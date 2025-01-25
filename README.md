# User Management System

## Installation
```bash
git clone https://github.com/TomMcIver/User-Management.git
```

## Backend Setup
```bash
cd server
npm install
```

## Frontend Setup
```bash
cd client
npm install
```


## Run Backend
```bash
cd server
npm start
```

## Run Frontend
```bash
cd client
npm run start
```

## Default Admin Login
```
Email: admin@example.com
Password: admin123
```

## Database Schema
```sql
CREATE TABLE users (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    username TEXT UNIQUE NOT NULL,
    email TEXT UNIQUE NOT NULL,
    password TEXT NOT NULL,
    role TEXT DEFAULT 'user'
);

CREATE TABLE activities (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    user_id INTEGER,
    action_type TEXT NOT NULL,
    description TEXT NOT NULL,
    created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
    target_user_id INTEGER,
    FOREIGN KEY (user_id) REFERENCES users (id),
    FOREIGN KEY (target_user_id) REFERENCES users (id)
);
```

## API Endpoints

### Auth Routes
```
POST /api/auth/register   
POST /api/auth/login       
GET  /api/auth/verify     
```

### Admin Routes
```
GET    /api/admin/users     
PUT    /api/admin/users/:id 
DELETE /api/admin/users/:id 
```

### User Routes
```
PUT  /api/users/profile    
GET  /api/users/activities
```


![1](https://github.com/user-attachments/assets/ce37ca51-b1f6-49ca-b297-025376a83357)

![2](https://github.com/user-attachments/assets/e5e197e8-2ca8-40cc-af9f-23fbb313a5e1)

![3](https://github.com/user-attachments/assets/0fa729c2-fa7e-48b8-b33c-bd36ed648f9d)

![4](https://github.com/user-attachments/assets/356e3375-4fab-4ae0-811e-cb4c57d1efc3)

![5](https://github.com/user-attachments/assets/2f28a138-7d7f-4431-b146-c71443f4328c)

![6](https://github.com/user-attachments/assets/0506b7cc-f6dc-4ffe-9774-d2fbdf99c741)

![7](https://github.com/user-attachments/assets/a9646959-7741-422c-a4f2-93a0454a62c4)

![8](https://github.com/user-attachments/assets/56c9f2ff-fe3a-4d61-b2c6-c32f7bbf0699)

![9](https://github.com/user-attachments/assets/3dc8c436-5e21-461f-9180-22eddc364826)

![10](https://github.com/user-attachments/assets/15de9078-ebdb-4e64-9c5a-5d8717c5806b)















