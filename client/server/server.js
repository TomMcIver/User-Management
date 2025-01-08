
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

// register 
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        const hashedPassword = await bcrypt.hash(password, 10);

        db.run(`
            INSERT INTO users (username, email, password)
            VALUES (?, ?, ?)
        `, [username, email, hashedPassword], function(err) {
            if (err) {
                if (err.message.includes('UNIQUE constraint failed')) {
                    return res.status(400).json({ message: 'Username or email already exists' });
                }
                return res.status(500).json({ message: 'Error creating user' });
            }

            res.status(201).json({ message: 'User registered successfully' });
        });
    } catch (err) {
        res.status(500).json({ message: 'Error registering user' });
    }
});


app.post('/api/auth/login', (req, res) => {
    const { email, password } = req.body;

    db.get('SELECT * FROM users WHERE email = ?', [email], async (err, user) => {
        if (err) {
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

        res.json({ token });
    });
});


app.get('/api/admin/users', authenticateToken, isAdmin, (req, res) => {
    db.all('SELECT id, username, email, role FROM users', (err, users) => {
        if (err) {
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
            return res.status(500).json({ message: 'Error updating user' });
        }
        res.json({ message: 'User updated successfully' });
    });
});


app.delete('/api/admin/users/:id', authenticateToken, isAdmin, (req, res) => {
    const userId = req.params.id;

    db.run('DELETE FROM users WHERE id = ?', [userId], function(err) {
        if (err) {
            return res.status(500).json({ message: 'Error deleting user' });
        }
        res.json({ message: 'User deleted successfully' });
    });
});

// update  
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
                    return res.status(500).json({ message: 'Error updating profile' });
                }
                
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
                    return res.status(500).json({ message: 'Error updating profile' });
                }
                
                const token = jwt.sign(
                    { id: userId, username, email, role: req.user.role },
                    config.JWT_SECRET,
                    { expiresIn: '24h' }
                );
                
                res.json({ message: 'Profile updated successfully', token });
            });
        }
    } catch (err) {
        res.status(500).json({ message: 'Error updating profile' });
    }
});

app.listen(config.PORT, () => {
    console.log(`Server running on port ${config.PORT}`);
});