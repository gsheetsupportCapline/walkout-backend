# Walkout Backend API

Complete backend system with authentication, role-based access control, and dropdown management.

## Features

- User authentication (Signup/Login)
- Role-based access control (superAdmin, admin, user, office)
- User activation/deactivation by admin
- Region, Office, and Team management
- Extra permissions management
- JWT token-based authentication

## Installation

```bash
npm install
```

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```
PORT=5000
MONGODB_URI=your_mongodb_connection_string
JWT_SECRET=your_secure_jwt_secret_key
JWT_EXPIRE=7d
NODE_ENV=development
```

**Important:** Never commit the `.env` file to version control. It's already added to `.gitignore`.

## Run Server

```bash
# Development mode with nodemon
npm run dev

# Production mode
npm start
```

## API Endpoints

### User Routes

#### Public Routes

- `POST /api/users/signup` - User signup (isActive=false by default)
- `POST /api/users/login` - User login (only active users can login)

#### Protected Routes (Admin/SuperAdmin)

- `GET /api/users` - Get all users
- `GET /api/users/:id` - Get user by ID
- `PUT /api/users/:id` - Update user details
- `DELETE /api/users/:id` - Delete user
- `PUT /api/users/:id/activate` - Activate user (admin/superAdmin)
- `PUT /api/users/:id/deactivate` - Deactivate user (admin/superAdmin)

#### SuperAdmin Only Routes

- `PUT /api/users/:id/change-role` - Change user role
- `PUT /api/users/:id/extra-permissions` - Update extra permissions

### Region Routes (Admin/SuperAdmin)

- `POST /api/regions` - Create region
- `GET /api/regions` - Get all regions
- `GET /api/regions/:id` - Get region by ID
- `PUT /api/regions/:id` - Update region
- `DELETE /api/regions/:id` - Delete region

### Office Routes (Admin/SuperAdmin)

- `POST /api/offices` - Create office
- `GET /api/offices` - Get all offices (with region populated)
- `GET /api/offices/:id` - Get office by ID
- `PUT /api/offices/:id` - Update office
- `DELETE /api/offices/:id` - Delete office

### Team Routes (Admin/SuperAdmin)

- `POST /api/teams` - Create team
- `GET /api/teams` - Get all teams
- `GET /api/teams/:id` - Get team by ID
- `PUT /api/teams/:id` - Update team
- `DELETE /api/teams/:id` - Delete team

## User Schema

```javascript
{
  name: String,
  email: String (unique),
  username: String (unique),
  password: String (hashed),
  role: String (superAdmin, admin, user, office),
  extraPermissions: Object,
  isActive: Boolean (default: false),
  approvedBy: ObjectId (ref: User),
  signedUpOn: Date,
  approvedOn: Date,
  teamName: [{ teamId: ObjectId }],
  assignedOffice: [{ officeId: ObjectId }]
}
```

## Authentication

All protected routes require JWT token in header:

```
Authorization: Bearer <token>
```

## Roles & Permissions

- **superAdmin**: Full access to all features including role change and extra permissions
- **admin**: Can activate/deactivate users, manage dropdowns
- **user**: Basic user access
- **office**: Office-specific access with assigned offices

## Request Examples

### Signup

```json
POST /api/users/signup
{
  "name": "John Doe",
  "email": "john@example.com",
  "username": "johndoe",
  "password": "password123",
  "role": "user"
}
```

### Login

```json
POST /api/users/login
{
  "emailOrUsername": "john@example.com",
  "password": "password123"
}
```

### Create Region

```json
POST /api/regions
Headers: Authorization: Bearer <token>
{
  "regionName": "North Region",
  "isActive": true,
  "visibility": "on"
}
```

### Create Office

```json
POST /api/offices
Headers: Authorization: Bearer <token>
{
  "officeName": "Main Office",
  "regionId": "60d5ec49f1b2c72b8c8e4f1a",
  "isActive": true,
  "visibility": "on"
}
```

### Create Team

```json
POST /api/teams
Headers: Authorization: Bearer <token>
{
  "teamName": "Development Team",
  "teamPermissions": {
    "dashboard": ["view", "edit"],
    "reports": ["view"]
  },
  "isActive": true,
  "visibility": "on"
}
```

### Activate User

```json
PUT /api/users/:id/activate
Headers: Authorization: Bearer <admin_token>
```

### Change User Role

```json
PUT /api/users/:id/change-role
Headers: Authorization: Bearer <superAdmin_token>
{
  "role": "admin"
}
```

### Update Extra Permissions

```json
PUT /api/users/:id/extra-permissions
Headers: Authorization: Bearer <superAdmin_token>
{
  "extraPermissions": {
    "dashboard": {
      "section": "analytics",
      "permission": "view"
    }
  }
}
```

## Notes

- Users signup with `isActive=false` and need admin approval
- Only active users can login
- Email and username are unique
- Passwords are hashed using bcryptjs
- JWT tokens expire in 7 days (configurable)
- Role changes only by superAdmin
- Extra permissions only by superAdmin
- User activation by admin or superAdmin
