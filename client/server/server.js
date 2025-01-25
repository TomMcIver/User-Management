const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const config = require('./config/config');
const initializeDatabase = require('./database/init');

const app = express();
app.use(cors());
app.use(express.json());

const db = initializeDatabase();


const logActivity = (db, userId, actionType, description, targetUserId = null) => {
    const query = `
        INSERT INTO activities (user_id, action_type, description, target_user_id)
        VALUES (?, ?, ?, ?)
    `;
    db.run(query, [userId, actionType, description, targetUserId], (err) => {
        if (err) {
            console.error('Error logging activity:', err);
        }
    });
};

const authenticateToken = (req, res, next) => {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (!token) {
        return res.status(401).json({ message: 'Authentication required' });
    }

    jwt.verify(token, config.JWT_SECRET, (err, user) => {
        if (err) {
            return res.status(403).json({ message: 'Invalid or expired token' });
        }
        req.user = user;
        next();
    });
};

const isAdmin = (req, res, next) => {
    if (req.user.role !== 'admin') {
        return res.status(403).json({ message: 'Admin access required' });
    }
    next();
};


app.get('/api/auth/verify', authenticateToken, (req, res) => {
    db.get('SELECT id FROM users WHERE id = ?', [req.user.id], (err, user) => {
        if (err || !user) {
            return res.status(401).json({ valid: false });
        }
        res.json({ valid: true });
    });
});


app.post('/api/auth/register', async (req, res) => {
    const { username, email, password, role } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(`
            INSERT INTO users (username, email, password, role)
            VALUES (?, ?, ?, ?)
        `, [username, email, hashedPassword, role || 'user'], function(err) {
            if (err) {
                console.error('Registration error:', err);
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ message: 'Username or email already exists' });
                }
                return res.status(500).json({ message: 'Error creating user' });
            }

            
            const actorId = req.user ? req.user.id : this.lastID; 
            const description = req.user ? 
                `Admin created new account for ${username}` : 
                `New user account created: ${username}`;
            
            logActivity(db, actorId, 'ACCOUNT_CREATED', description, this.lastID);

            res.status(201).json({ 
                message: 'User registered successfully',
                userId: this.lastID 
            });
        });
    } catch (err) {
        console.error('Server error during registration:', err);
        res.status(500).json({ message: 'Error registering user' });
    }
});


app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
            console.error('Login error:', err);
            return res.status(500).json({ message: 'Error during login' });
        }

        if (!user) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) {
            return res.status(401).json({ message: 'Invalid credentials' });
        }

        const token = jwt.sign(
            { id: user.id, username: user.username, email: user.email, role: user.role },
            config.JWT_SECRET,
            { expiresIn: '24h' }
        );

        logActivity(db, user.id, 'USER_LOGIN', `${user.username} logged in`);
        res.json({ token });
    });
});


app.get('/api/admin/users', authenticateToken, isAdmin, (req, res) => {
    db.all('SELECT id, username, email, role FROM users', (err, users) => {
        if (err) {
            console.error('Error fetching users:', err);
            return res.status(500).json({ message: 'Error fetching users' });
        }
        res.json(users);
    });
});


app.put('/api/admin/users/:id', authenticateToken, isAdmin, (req, res) => {
    const { username, email, role } = req.body;
    const userId = req.params.id;

    db.run(`
        UPDATE users 
        SET username = ?, email = ?, role = ?
        WHERE id = ?
    `, [username, email, role, userId], function(err) {
        if (err) {
            console.error('Error updating user:', err);
            return res.status(500).json({ message: 'Error updating user' });
        }
        if (this.changes === 0) {
            return res.status(404).json({ message: 'User not found' });
        }

        logActivity(db, req.user.id, 'USER_UPDATED',
            `Updated user information for ${username}`, userId);

        res.json({ message: 'User updated successfully' });
    });
});


app.delete('/api/admin/users/:id', authenticateToken, isAdmin, (req, res) => {
    const userId = req.params.id;

    
    db.get('SELECT username FROM users WHERE id = ?', [userId], (err, user) => {
        if (err || !user) {
            return res.status(404).json({ message: 'User not found' });
        }

        db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
            if (err) {
                console.error('Error deleting user:', err);
                return res.status(500).json({ message: 'Error deleting user' });
            }

            logActivity(db, req.user.id, 'USER_DELETED',
                `Deleted user account: ${user.username}`, userId);

            res.json({ message: 'User deleted successfully' });
        });
    });
});


app.put('/api/users/profile', authenticateToken, async (req, res) => {
    const { username, email, currentPassword, newPassword } = req.body;
    const userId = req.user.id;

    try {
        if (newPassword) {
            const user = await new Promise((resolve, reject) => {
                db.get('SELECT * FROM users WHERE id = ?', [userId], (err, row) => {
                    if (err) reject(err);
                    resolve(row);
                });
            });

            const validPassword = await bcrypt.compare(currentPassword, user.password);
            if (!validPassword) {
                return res.status(401).json({ message: 'Current password is incorrect' });
            }

            const hashedPassword = await bcrypt.hash(newPassword, 10);
            
            db.run(`
                UPDATE users 
                SET username = ?, email = ?, password = ?
                WHERE id = ?
            `, [username, email, hashedPassword, userId], function(err) {
                if (err) {
                    console.error('Error updating profile with password:', err);
                    return res.status(500).json({ message: 'Error updating profile' });
                }
                
                logActivity(db, userId, 'PASSWORD_CHANGED',
                    'Changed account password', userId);

                const token = jwt.sign(
                    { id: userId, username, email, role: user.role },
                    config.JWT_SECRET,
                    { expiresIn: '24h' }
                );
                
                res.json({ message: 'Profile updated successfully', token });
            });
        } else {
            db.run(`
                UPDATE users 
                SET username = ?, email = ?
                WHERE id = ?
            `, [username, email, userId], function(err) {
                if (err) {
                    console.error('Error updating profile:', err);
                    return res.status(500).json({ message: 'Error updating profile' });
                }
                
                logActivity(db, userId, 'PROFILE_UPDATED',
                    'Updated profile information', userId);

                const token = jwt.sign(
                    { id: userId, username, email, role: req.user.role },
                    config.JWT_SECRET,
                    { expiresIn: '24h' }
                );
                
                res.json({ message: 'Profile updated successfully', token });
            });
        }
    } catch (err) {
        console.error('Server error during profile update:', err);
        res.status(500).json({ message: 'Error updating profile' });
    }
});

app.get('/api/users/activities', authenticateToken, (req, res) => {
    const userId = req.user.id;
    const isAdmin = req.user.role === 'admin';
    
    let query = `
        SELECT 
            a.id,
            a.action_type,
            a.description,
            a.created_at,
            u.username as actor_username,
            tu.username as target_username
        FROM activities a
        LEFT JOIN users u ON a.user_id = u.id
        LEFT JOIN users tu ON a.target_user_id = tu.id
        WHERE 1=1
    `;
    

    if (!isAdmin) {
        query += ' AND (a.user_id = ? OR a.target_user_id = ?)';
    }
    
    query += ' ORDER BY a.created_at DESC LIMIT 50';
    
    db.all(query, !isAdmin ? [userId, userId] : [], (err, activities) => {
        if (err) {
            console.error('Error fetching activities:', err);
            return res.status(500).json({ message: 'Error fetching activities' });
        }
        res.json(activities);
    });
});

app.listen(config.PORT, () => {
    console.log(`Server running on port ${config.PORT}`);
});