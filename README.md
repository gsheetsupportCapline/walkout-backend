# Walkout Backend API

Complete Node.js backend system built with Express.js and MongoDB for managing user authentication, role-based access control, and organizational data (regions, offices, teams).

---

## ðŸ“‘ Table of Contents

1. [Overview](#overview)
2. [System Architecture](#system-architecture)
3. [Installation & Setup](#installation--setup)
4. [Authentication System](#authentication-system)
5. [Role-Based Access Control](#role-based-access-control)
6. [API Documentation](#api-documentation)
7. [Data Models](#data-models)
8. [Security Features](#security-features)
9. [Testing with Postman](#testing-with-postman)

---

## Overview

### Purpose & Use Case

This backend system is designed for organizations that need:

- **User Management**: Control who can access the system with approval workflows
- **Role-Based Access**: Different permission levels for different user types
- **Organizational Structure**: Manage regions, offices, and teams hierarchically
- **Secure Authentication**: JWT-based token authentication with password encryption

### Core Functionalities

1. **User Signup & Approval Workflow**: New users register but must be approved by admin before accessing the system
2. **Login System**: Secure authentication with JWT tokens
3. **Role Management**: Four distinct roles with different access levels
4. **Dropdown Management**: Admin can manage regions, offices, and teams that appear in dropdowns
5. **Profile Management**: Users can update their own information

---

## System Architecture

### Technology Stack

- **Node.js**: JavaScript runtime for backend
- **Express.js**: Web framework for building REST APIs
- **MongoDB**: NoSQL database for storing all data
- **Mongoose**: ODM (Object Data Modeling) library for MongoDB
- **JWT (jsonwebtoken)**: Token-based authentication
- **bcryptjs**: Password hashing for security
- **CORS**: Cross-Origin Resource Sharing enabled

### Folder Structure

```
Walkout-Backend/
â”œâ”€â”€ config/
â”‚   â””â”€â”€ database.js          # MongoDB connection configuration
â”œâ”€â”€ controllers/
â”‚   â”œâ”€â”€ userController.js    # User-related business logic
â”‚   â”œâ”€â”€ regionController.js  # Region CRUD operations
â”‚   â”œâ”€â”€ officeController.js  # Office CRUD operations
â”‚   â””â”€â”€ teamController.js    # Team CRUD operations
â”œâ”€â”€ middleware/
â”‚   â””â”€â”€ auth.js             # JWT verification & role checking
â”œâ”€â”€ models/
â”‚   â”œâ”€â”€ User.js             # User schema with authentication
â”‚   â”œâ”€â”€ Region.js           # Region schema
â”‚   â”œâ”€â”€ Office.js           # Office schema
â”‚   â””â”€â”€ Team.js             # Team schema
â”œâ”€â”€ routes/
â”‚   â”œâ”€â”€ userRoutes.js       # User API endpoints
â”‚   â”œâ”€â”€ regionRoutes.js     # Region API endpoints
â”‚   â”œâ”€â”€ officeRoutes.js     # Office API endpoints
â”‚   â””â”€â”€ teamRoutes.js       # Team API endpoints
â”œâ”€â”€ scripts/
â”‚   â””â”€â”€ createSuperAdmin.js # Script to create first superAdmin
â”œâ”€â”€ utils/
â”‚   â””â”€â”€ generateToken.js    # JWT token generation utility
â”œâ”€â”€ .env                    # Environment variables (not in git)
â”œâ”€â”€ .gitignore             # Git ignore rules
â”œâ”€â”€ server.js              # Main Express server entry point
â”œâ”€â”€ package.json           # Dependencies and scripts
â””â”€â”€ README.md              # This file
```

---

## Installation & Setup

### Prerequisites

- Node.js (v14 or higher)
- MongoDB (running locally on port 27017)
- Git (for version control)

### Step 1: Install Dependencies

```bash
npm install
```

**What this does**: Installs all required packages listed in `package.json` including Express, Mongoose, JWT, bcryptjs, etc.

### Step 2: Environment Configuration

Create a `.env` file in the root directory. Contact the system administrator for the exact values.

**Why needed**: Environment variables store sensitive configuration like database URLs, JWT secrets, and port numbers. These should never be committed to GitHub.

**Required variables**:

- `PORT`: Server port (typically 5000)
- `MONGO_URI`: MongoDB connection string
- `JWT_SECRET`: Secret key for signing JWT tokens
- `JWT_EXPIRE`: Token expiration time (e.g., "30d")

### Step 3: Create SuperAdmin

```bash
npm run create-admin
```

**What this does**: Runs the `scripts/createSuperAdmin.js` file which:

1. Connects to MongoDB
2. Checks if a superAdmin already exists
3. If not, creates a new superAdmin user with:
   - Pre-defined credentials (shown in console)
   - Role: "superAdmin"
   - isActive: true (no approval needed)
4. Displays the login credentials in the terminal

**Why needed**: The first user must be a superAdmin to manage the system. This superAdmin can then create and approve other admins and users.

### Step 4: Run Server

```bash
# Development mode with auto-restart on file changes
npm run dev

# Production mode
npm start
```

**Development mode** uses `nodemon` which automatically restarts the server when you make code changes.

**Production mode** runs the server normally without auto-restart.

---

---

## Authentication System

### How Authentication Works

1. **User Registration (Signup)**

   - New users submit: name, email, username, password, role
   - Password is automatically hashed using bcryptjs (10 salt rounds)
   - User account is created with `isActive: false`
   - User CANNOT login until admin activates the account

   **Why this workflow**: Prevents unauthorized access. Admin reviews and approves users before they can access the system.

2. **User Activation**

   - Admin or SuperAdmin activates the user
   - System records who activated (approvedBy) and when (approvedOn)
   - User receives active status (`isActive: true`)

   **Why needed**: Creates an audit trail and ensures only verified users can access the system.

3. **User Login**

   - User provides email/username and password
   - System checks if user exists and is active
   - If inactive: Login fails with message "Account not activated"
   - If active: Password is compared with hashed password
   - On success: JWT token is generated and returned

   **Token contains**: User ID, role, and expiration time

   **Why JWT**: Stateless authentication - server doesn't need to store session data. Token is sent with each request for verification.

4. **Accessing Protected Routes**

   - User sends token in Authorization header: `Bearer <token>`
   - Middleware (`auth.js`) verifies the token
   - If valid: Request proceeds with user data attached
   - If invalid/expired: Request is rejected with 401 error

   **Why middleware**: Centralizes authentication logic. Every protected route automatically checks the token.

### Token Lifecycle

```
Signup â†’ (isActive=false) â†’ Admin Activation â†’ Login â†’ Get JWT Token â†’ Access Protected Routes
```

**Token Expiration**: Set in .env (typically 30 days). After expiration, user must login again.

---

## Role-Based Access Control

### The Four Roles

#### 1. SuperAdmin

**Purpose**: System owner with complete control

**Capabilities**:

- âœ… All admin capabilities
- âœ… Change any user's role
- âœ… Assign extra permissions to users
- âœ… Create/manage other superAdmins
- âœ… Access to all system features

**Use Case**: Organization owner, CTO, or technical lead who manages the entire system.

**Restrictions**: None - full access

#### 2. Admin

**Purpose**: Day-to-day system management

**Capabilities**:

- âœ… Activate/deactivate users
- âœ… View all users
- âœ… Update user details (teams, offices)
- âœ… Manage regions (create, edit, delete)
- âœ… Manage offices (create, edit, delete)
- âœ… Manage teams (create, edit, delete)
- âœ… Delete users

**Use Case**: HR managers, team leads who handle user onboarding and organizational structure.

**Restrictions**:

- âŒ Cannot change user roles
- âŒ Cannot assign extra permissions
- âŒ Cannot manage superAdmin functions

#### 3. User

**Purpose**: Regular system user with basic access

**Capabilities**:

- âœ… Update own profile (name, email, password)
- âœ… Access features as per assigned permissions
- âœ… View own team and office assignments

**Use Case**: Employees, staff members who use the system for daily work.

**Restrictions**:

- âŒ Cannot access admin features
- âŒ Cannot manage other users
- âŒ Cannot manage dropdowns (regions/offices/teams)

#### 4. Office

**Purpose**: Office-specific user with location-based access

**Capabilities**:

- âœ… Same as User role
- âœ… Access limited to assigned offices
- âœ… View data relevant to assigned office only

**Use Case**: Branch managers, location-specific staff who should only see their office data.

**Restrictions**:

- âŒ Same as User restrictions
- âŒ Cannot access other offices' data

### How Role Checking Works

When a protected route is accessed:

1. **Authentication Check** (`protect` middleware):

   - Verifies JWT token exists and is valid
   - Checks if user is active
   - Attaches user data to request

2. **Authorization Check** (`restrictTo` middleware):
   - Compares user's role against allowed roles
   - If role matches: Request proceeds
   - If role doesn't match: Returns 403 Forbidden error

**Example**:

```javascript
// Route accessible by admin and superAdmin only
router.delete("/:id", protect, restrictTo("admin", "superAdmin"), deleteUser);
```

### Extra Permissions System

**Purpose**: Give specific users additional capabilities beyond their role.

**How it works**:

- SuperAdmin can assign custom permissions to any user
- Stored in `extraPermissions` object on User model
- Can be used by frontend to show/hide features

**Use Case**: Give a regular user access to reports, or allow an admin to access a specific analytics dashboard.

**Example**:

```json
{
  "extraPermissions": {
    "dashboard": {
      "section": "analytics",
      "permission": "view"
    },
    "reports": {
      "section": "financial",
      "permission": "edit"
    }
  }
}
```

---

---

## API Documentation

### ðŸ”“ Public Routes (No Authentication Required)

#### 1. User Signup

```
POST /api/users/signup
```

**Purpose**: Register a new user account

**Who can use**: Anyone (public endpoint)

**Request Body**:

```json
{
  "name": "John Doe",
  "email": "john@example.com",
  "username": "johndoe",
  "password": "password123",
  "role": "user"
}
```

**Process**:

1. Validates that email and username are unique
2. Hashes the password using bcryptjs
3. Creates user with `isActive: false`
4. Records signup date in `signedUpOn`
5. Returns success message (does NOT auto-login)

**Response**:

```json
{
  "success": true,
  "message": "User created successfully. Waiting for admin approval."
}
```

**Why isActive=false**: Ensures admin reviews and approves users before they can access the system. Prevents spam accounts.

**Validation Rules**:

- Name: Required, string
- Email: Required, unique, valid email format
- Username: Required, unique
- Password: Required, minimum 6 characters
- Role: Must be one of: "user", "admin", "office", "superAdmin"

---

#### 2. User Login

```
POST /api/users/login
```

**Purpose**: Authenticate user and get JWT token

**Who can use**: Any registered user (if active)

**Request Body**:

```json
{
  "emailOrUsername": "john@example.com",
  "password": "password123"
}
```

**Process**:

1. Finds user by email or username
2. Checks if user exists
3. **Checks if user is active** (isActive must be true)
4. Compares password with hashed password
5. If all checks pass: Generates JWT token
6. Returns token and user data

**Response**:

```json
{
  "success": true,
  "token": "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...",
  "data": {
    "_id": "60d5ec49f1b2c72b8c8e4f1a",
    "name": "John Doe",
    "email": "john@example.com",
    "username": "johndoe",
    "role": "user",
    "isActive": true
  }
}
```

**Error Cases**:

- User not found: "Invalid credentials"
- Wrong password: "Invalid credentials"
- Account not active: "Account not activated. Please contact admin."

**Why email OR username**: Provides flexibility for users to login with either identifier.

---

### ðŸ”’ Authenticated Routes (All Logged-in Users)

#### 3. Update Own Profile

```
PUT /api/users/profile
```

**Purpose**: Allow users to update their own information

**Who can use**: Any authenticated user (user, office, admin, superAdmin)

**Authentication**: Required - JWT token in header

```
Authorization: Bearer <token>
```

**Request Body** (all fields optional):

```json
{
  "name": "Updated Name",
  "email": "newemail@example.com",
  "password": "newpassword123"
}
```

**Process**:

1. Middleware verifies JWT token
2. Extracts user ID from token
3. Finds user in database
4. Updates only the provided fields
5. If password is changed: Automatically hashes new password
6. Saves and returns updated user

**Response**:

```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49f1b2c72b8c8e4f1a",
    "name": "Updated Name",
    "email": "newemail@example.com",
    "role": "user"
  }
}
```

**Why separate endpoint**:

- Users should update their own data without admin intervention
- Security: Users can only update their own profile, not others
- Prevents users from changing role, teams, or offices (admin-only fields)

**Fields NOT updateable by user**:

- role (only superAdmin can change)
- isActive (only admin can change)
- teamName (only admin can assign)
- assignedOffice (only admin can assign)
- extraPermissions (only superAdmin can change)

---

### ðŸ” Admin Routes (Admin & SuperAdmin Only)

#### 4. Get All Users

```
GET /api/users
```

**Purpose**: View list of all users in the system

**Who can use**: Admin, SuperAdmin

**Authentication**: Required with admin/superAdmin role

**Process**:

1. Verifies user is admin or superAdmin
2. Fetches all users from database
3. Populates teamName and assignedOffice with full details
4. Excludes password field from response

**Response**:

```json
{
  "success": true,
  "count": 15,
  "data": [
    {
      "_id": "60d5ec49f1b2c72b8c8e4f1a",
      "name": "John Doe",
      "email": "john@example.com",
      "username": "johndoe",
      "role": "user",
      "isActive": true,
      "signedUpOn": "2024-01-15T10:30:00Z",
      "approvedOn": "2024-01-15T11:00:00Z",
      "teamName": [
        {
          "teamId": {
            "_id": "60d5ec49f1b2c72b8c8e4f1b",
            "teamName": "Development Team"
          }
        }
      ],
      "assignedOffice": [
        {
          "officeId": {
            "_id": "60d5ec49f1b2c72b8c8e4f1c",
            "officeName": "Delhi Office",
            "officeCode": "DLH01"
          }
        }
      ]
    }
  ]
}
```

**Why admin needs this**: To manage users, view who is active, and see user assignments.

---

#### 5. Get User by ID

```
GET /api/users/:id
```

**Purpose**: View details of a specific user

**Who can use**: Admin, SuperAdmin

**Authentication**: Required with admin/superAdmin role

**URL Parameter**: User ID

**Example**: `GET /api/users/60d5ec49f1b2c72b8c8e4f1a`

**Process**:

1. Verifies requester is admin/superAdmin
2. Finds user by ID
3. Populates team and office details
4. Returns user data

**Use Case**: When admin wants to view complete details of a user before updating or managing them.

---

#### 6. Update User Details

```
PUT /api/users/:id
```

**Purpose**: Admin updates user's team and office assignments

**Who can use**: Admin, SuperAdmin

**Authentication**: Required with admin/superAdmin role

**Request Body**:

```json
{
  "name": "Updated Name",
  "teamName": [{ "teamId": "60d5ec49f1b2c72b8c8e4f1b" }],
  "assignedOffice": [{ "officeId": "60d5ec49f1b2c72b8c8e4f1c" }]
}
```

**Process**:

1. Verifies requester is admin/superAdmin
2. Finds user by ID
3. Updates name, teamName, and assignedOffice
4. Saves and returns updated user

**Why separate from profile update**:

- Team and office assignments are organizational decisions
- Users should not be able to assign themselves to teams/offices
- Only admin can manage organizational structure

**Fields admin CAN update**:

- name
- teamName (array of team IDs)
- assignedOffice (array of office IDs)

**Fields admin CANNOT update**:

- role (superAdmin only)
- extraPermissions (superAdmin only)
- password (user must update their own)
- email/username (security reasons)

---

#### 7. Delete User

```
DELETE /api/users/:id
```

**Purpose**: Permanently remove a user from the system

**Who can use**: Admin, SuperAdmin

**Authentication**: Required with admin/superAdmin role

**URL Parameter**: User ID

**Process**:

1. Verifies requester is admin/superAdmin
2. Finds and deletes user by ID
3. Returns success message

**Response**:

```json
{
  "success": true,
  "message": "User deleted successfully"
}
```

**Warning**: This is permanent deletion. Consider deactivation instead for temporary access removal.

---

#### 8. Activate User

```
PUT /api/users/:id/activate
```

**Purpose**: Approve a user account and allow login

**Who can use**: Admin, SuperAdmin

**Authentication**: Required with admin/superAdmin role

**URL Parameter**: User ID

**Process**:

1. Verifies requester is admin/superAdmin
2. Finds user by ID
3. Sets `isActive: true`
4. Records approvedBy (ID of admin who activated)
5. Records approvedOn (current timestamp)
6. Saves and returns updated user

**Response**:

```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49f1b2c72b8c8e4f1a",
    "name": "John Doe",
    "isActive": true,
    "approvedBy": "60d5ec49f1b2c72b8c8e4f2a",
    "approvedOn": "2024-01-15T11:00:00Z"
  }
}
```

**Why track approvedBy and approvedOn**:

- Audit trail for compliance
- Know who authorized each user
- Track when users were granted access

**Use Case**: After reviewing a new signup, admin approves the user so they can login.

---

#### 9. Deactivate User

```
PUT /api/users/:id/deactivate
```

**Purpose**: Temporarily suspend a user's access

**Who can use**: Admin, SuperAdmin

**Authentication**: Required with admin/superAdmin role

**URL Parameter**: User ID

**Process**:

1. Verifies requester is admin/superAdmin
2. Finds user by ID
3. Sets `isActive: false`
4. User can no longer login (existing tokens still work until expiration)
5. Returns updated user

**Response**:

```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49f1b2c72b8c8e4f1a",
    "name": "John Doe",
    "isActive": false
  }
}
```

**Why deactivate instead of delete**:

- Preserve user data and history
- Can reactivate later if needed
- Useful for employees on leave or suspended accounts

**Note**: Active JWT tokens will still work until they expire. For immediate access revocation, implement a token blacklist (future enhancement).

---

### ðŸ‘‘ SuperAdmin Routes (SuperAdmin Only)

#### 10. Change User Role

```
PUT /api/users/:id/change-role
```

**Purpose**: Change a user's role (elevation or demotion)

**Who can use**: SuperAdmin ONLY

**Authentication**: Required with superAdmin role

**Request Body**:

```json
{
  "role": "admin"
}
```

**Process**:

1. Verifies requester is superAdmin
2. Validates new role is valid
3. Updates user's role
4. Returns updated user

**Response**:

```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49f1b2c72b8c8e4f1a",
    "name": "John Doe",
    "role": "admin"
  }
}
```

**Valid Roles**: "user", "admin", "office", "superAdmin"

**Why superAdmin only**:

- Role changes affect system security
- Prevents privilege escalation attacks
- Admin cannot make themselves superAdmin
- Ensures proper hierarchy and control

**Use Cases**:

- Promote user to admin
- Demote admin to user
- Change user to office role for location-specific access

---

#### 11. Update Extra Permissions

```
PUT /api/users/:id/extra-permissions
```

**Purpose**: Grant specific permissions beyond role capabilities

**Who can use**: SuperAdmin ONLY

**Authentication**: Required with superAdmin role

**Request Body**:

```json
{
  "extraPermissions": {
    "dashboard": {
      "section": "analytics",
      "permission": "view"
    },
    "reports": {
      "section": "financial",
      "permission": "edit"
    }
  }
}
```

**Process**:

1. Verifies requester is superAdmin
2. Updates user's extraPermissions object
3. Returns updated user

**Response**:

```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49f1b2c72b8c8e4f1a",
    "name": "John Doe",
    "role": "user",
    "extraPermissions": {
      "dashboard": {
        "section": "analytics",
        "permission": "view"
      },
      "reports": {
        "section": "financial",
        "permission": "edit"
      }
    }
  }
}
```

**Why superAdmin only**: Fine-grained permissions affect security and access control.

**Use Cases**:

- Give regular user access to admin dashboard section
- Allow user to view specific reports
- Grant temporary elevated permissions for special tasks

**How frontend uses this**: Frontend checks extraPermissions object to show/hide features dynamically.

---

### ðŸŒ Region Routes (Admin & SuperAdmin)

#### 12. Create Region

```
POST /api/regions
```

**Purpose**: Add a new geographic region to the system

**Who can use**: Admin, SuperAdmin

**Authentication**: Required with admin/superAdmin role

**Request Body**:

```json
{
  "regionName": "North Region",
  "regionCode": "NR01",
  "isActive": true,
  "visibility": "on"
}
```

**Process**:

1. Verifies requester is admin/superAdmin
2. Validates regionName is unique
3. Validates regionCode is unique
4. **Converts regionCode to uppercase** (nr01 â†’ NR01)
5. Creates region in database
6. Returns created region

**Response**:

```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49f1b2c72b8c8e4f1d",
    "regionName": "North Region",
    "regionCode": "NR01",
    "isActive": true,
    "visibility": "on"
  }
}
```

**Field Explanations**:

- **regionName**: Display name (e.g., "North Region", "South Zone")
  - Must be unique across all regions
  - Used in dropdowns and displays
- **regionCode**: Short unique identifier (e.g., "NR01", "SZ02")
  - Automatically converted to uppercase
  - Used for filtering and quick identification
  - Must be unique across all regions
- **isActive**: Boolean flag for active/inactive state
  - true: Region is operational
  - false: Region is suspended but data preserved
- **visibility**: Controls whether region appears in dropdowns
  - "on": Shows in dropdowns
  - "off": Hidden from dropdowns but still in database

**Why regionCode is uppercase**: Standardization and consistency. "nr01", "NR01", "Nr01" are all stored as "NR01".

**Use Case**: When organization expands to new geographic areas, admin creates regions for each area.

---

#### 13. Get All Regions

```
GET /api/regions
```

**Purpose**: Retrieve list of all regions

**Who can use**: Admin, SuperAdmin

**Authentication**: Required with admin/superAdmin role

**Response**:

```json
{
  "success": true,
  "count": 5,
  "data": [
    {
      "_id": "60d5ec49f1b2c72b8c8e4f1d",
      "regionName": "North Region",
      "regionCode": "NR01",
      "isActive": true,
      "visibility": "on"
    }
  ]
}
```

**Use Case**:

- Populate region dropdown in forms
- Admin dashboard showing all regions
- Reports and analytics by region

---

#### 14. Get Region by ID

```
GET /api/regions/:id
```

**Purpose**: Get details of a specific region

**Who can use**: Admin, SuperAdmin

**URL Parameter**: Region ID

**Use Case**: View/edit region details in admin panel.

---

#### 15. Update Region

```
PUT /api/regions/:id
```

**Purpose**: Modify region information

**Who can use**: Admin, SuperAdmin

**Request Body** (all fields optional):

```json
{
  "regionName": "Updated North Region",
  "regionCode": "NR02",
  "isActive": false,
  "visibility": "off"
}
```

**Process**:

1. Verifies admin/superAdmin
2. Finds region by ID
3. If regionCode is being changed: Validates uniqueness and converts to uppercase
4. Updates provided fields
5. Returns updated region

**Use Cases**:

- Rename region
- Change region code
- Deactivate region temporarily
- Hide region from dropdowns

---

#### 16. Delete Region

```
DELETE /api/regions/:id
```

**Purpose**: Permanently remove a region

**Who can use**: Admin, SuperAdmin

**Warning**: Deleting a region may affect offices linked to it. Consider deactivation instead.

**Process**:

1. Verifies admin/superAdmin
2. Deletes region by ID
3. Returns success message

---

### ðŸ¢ Office Routes (Admin & SuperAdmin)

#### 17. Create Office

```
POST /api/offices
```

**Purpose**: Add a new office location under a region

**Who can use**: Admin, SuperAdmin

**Authentication**: Required with admin/superAdmin role

**Request Body**:

```json
{
  "officeName": "Delhi Office",
  "officeCode": "DLH01",
  "regionId": "60d5ec49f1b2c72b8c8e4f1d",
  "isActive": true,
  "visibility": "on"
}
```

**Process**:

1. Verifies requester is admin/superAdmin
2. Validates officeCode is unique
3. **Converts officeCode to uppercase** (dlh01 â†’ DLH01)
4. Verifies regionId exists in database
5. Creates office with region reference
6. Returns created office with populated region details

**Response**:

```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49f1b2c72b8c8e4f1e",
    "officeName": "Delhi Office",
    "officeCode": "DLH01",
    "regionId": {
      "_id": "60d5ec49f1b2c72b8c8e4f1d",
      "regionName": "North Region",
      "regionCode": "NR01"
    },
    "isActive": true,
    "visibility": "on"
  }
}
```

**Field Explanations**:

- **officeName**: Display name of the office (e.g., "Delhi Office", "Mumbai Branch")
- **officeCode**: Unique identifier for the office
  - Automatically converted to uppercase
  - Must be unique across ALL offices
  - Used for quick identification
- **regionId**: MongoDB ObjectId reference to Region model
  - Links office to a specific region
  - Creates hierarchical structure: Region â†’ Offices
  - Must be a valid existing region ID
- **isActive**: Whether office is operational
- **visibility**: Whether office appears in dropdowns

**Why offices link to regions**:

- Organizational hierarchy (Region contains multiple offices)
- Filter offices by region
- Regional managers can view all offices in their region
- Reports and analytics grouped by region

**Use Case**: Company opens new branch office in Delhi under North Region.

---

#### 18. Get All Offices

```
GET /api/offices
```

**Purpose**: Retrieve list of all offices with region details

**Who can use**: Admin, SuperAdmin

**Response**:

```json
{
  "success": true,
  "count": 10,
  "data": [
    {
      "_id": "60d5ec49f1b2c72b8c8e4f1e",
      "officeName": "Delhi Office",
      "officeCode": "DLH01",
      "regionId": {
        "_id": "60d5ec49f1b2c72b8c8e4f1d",
        "regionName": "North Region",
        "regionCode": "NR01"
      },
      "isActive": true,
      "visibility": "on"
    }
  ]
}
```

**Note**: Region details are automatically populated (not just ID).

**Use Case**:

- Populate office dropdown in forms
- Show all offices with their regions in admin dashboard
- Assign users to offices

---

#### 19. Get Office by ID

```
GET /api/offices/:id
```

**Purpose**: Get details of a specific office

**Who can use**: Admin, SuperAdmin

**URL Parameter**: Office ID

---

#### 20. Update Office

```
PUT /api/offices/:id
```

**Purpose**: Modify office information

**Who can use**: Admin, SuperAdmin

**Request Body** (all fields optional):

```json
{
  "officeName": "New Delhi Office",
  "officeCode": "NDLH01",
  "regionId": "60d5ec49f1b2c72b8c8e4f1f",
  "isActive": false
}
```

**Process**:

1. Verifies admin/superAdmin
2. If officeCode changing: Validates uniqueness and converts to uppercase
3. If regionId changing: Verifies new region exists
4. Updates office
5. Returns updated office with populated region

**Use Cases**:

- Rename office
- Move office to different region
- Change office code
- Deactivate office

---

#### 21. Delete Office

```
DELETE /api/offices/:id
```

**Purpose**: Permanently remove an office

**Who can use**: Admin, SuperAdmin

**Warning**: Deleting office may affect users assigned to it.

---

### ðŸ‘¥ Team Routes (Admin & SuperAdmin)

#### 22. Create Team

```
POST /api/teams
```

**Purpose**: Create a team with specific permissions

**Who can use**: Admin, SuperAdmin

**Authentication**: Required with admin/superAdmin role

**Request Body**:

```json
{
  "teamName": "Development Team",
  "teamPermissions": {
    "dashboard": ["view", "edit"],
    "reports": ["view"],
    "users": ["view", "create"]
  },
  "isActive": true,
  "visibility": "on"
}
```

**Process**:

1. Verifies requester is admin/superAdmin
2. Validates teamName is unique
3. Creates team with permissions object
4. Returns created team

**Response**:

```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49f1b2c72b8c8e4f1f",
    "teamName": "Development Team",
    "teamPermissions": {
      "dashboard": ["view", "edit"],
      "reports": ["view"],
      "users": ["view", "create"]
    },
    "isActive": true,
    "visibility": "on"
  }
}
```

**Field Explanations**:

- **teamName**: Unique name for the team (e.g., "Development Team", "Sales Team")
- **teamPermissions**: Object defining what team members can access
  - Structure is flexible and customizable
  - Frontend checks these permissions to show/hide features
  - Example: `{"dashboard": ["view", "edit"]}` means team can view and edit dashboard
- **isActive**: Whether team is currently active
- **visibility**: Whether team appears in dropdowns

**Why teams have permissions**:

- Group-based access control
- All users in team inherit team permissions
- Easier than setting permissions for each user
- Modify team permissions to affect all team members

**Use Case**: Create "Sales Team" with access to sales dashboard and customer reports.

---

#### 23. Get All Teams

```
GET /api/teams
```

**Purpose**: Retrieve list of all teams

**Who can use**: Admin, SuperAdmin

**Response**:

```json
{
  "success": true,
  "count": 8,
  "data": [
    {
      "_id": "60d5ec49f1b2c72b8c8e4f1f",
      "teamName": "Development Team",
      "teamPermissions": {
        "dashboard": ["view", "edit"],
        "reports": ["view"]
      },
      "isActive": true,
      "visibility": "on"
    }
  ]
}
```

**Use Case**:

- Populate team dropdown when assigning users
- View all teams in admin dashboard
- Team management interface

---

#### 24. Get Team by ID

```
GET /api/teams/:id
```

**Purpose**: Get details of a specific team

**Who can use**: Admin, SuperAdmin

**URL Parameter**: Team ID

---

#### 25. Update Team

```
PUT /api/teams/:id
```

**Purpose**: Modify team information or permissions

**Who can use**: Admin, SuperAdmin

**Request Body** (all fields optional):

```json
{
  "teamName": "Senior Development Team",
  "teamPermissions": {
    "dashboard": ["view", "edit", "delete"],
    "reports": ["view", "edit"]
  },
  "isActive": true
}
```

**Process**:

1. Verifies admin/superAdmin
2. If teamName changing: Validates uniqueness
3. Updates team
4. All users in this team inherit new permissions
5. Returns updated team

**Use Cases**:

- Rename team
- Add more permissions to team
- Remove permissions from team
- Deactivate team

**Important**: Changing team permissions affects all users assigned to that team.

---

#### 26. Delete Team

```
DELETE /api/teams/:id
```

**Purpose**: Permanently remove a team

**Who can use**: Admin, SuperAdmin

**Warning**: Deleting team may affect users assigned to it. Consider deactivation instead.

---

---

## Data Models

### User Model

**File**: `models/User.js`

**Purpose**: Store user accounts with authentication and authorization details

**Schema Fields**:

```javascript
{
  name: {
    type: String,
    required: true,
    trim: true
  },

  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },

  username: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  password: {
    type: String,
    required: true,
    minlength: 6,
    select: false  // Never returned in queries by default
  },

  role: {
    type: String,
    enum: ['user', 'admin', 'office', 'superAdmin'],
    default: 'user'
  },

  extraPermissions: {
    type: Object,
    default: {}
  },

  isActive: {
    type: Boolean,
    default: false  // Users start inactive
  },

  approvedBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User'
  },

  signedUpOn: {
    type: Date,
    default: Date.now
  },

  approvedOn: {
    type: Date
  },

  teamName: [{
    teamId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Team'
    }
  }],

  assignedOffice: [{
    officeId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'Office'
    }
  }]
}
```

**Field Explanations**:

- **name**: Full name of the user

  - Trimmed to remove whitespace
  - Required field

- **email**: Email address

  - Must be unique across all users
  - Automatically converted to lowercase
  - Used for login and communication
  - Validated for email format

- **username**: Username for login

  - Must be unique across all users
  - Alternative to email for login
  - Trimmed

- **password**: Hashed password

  - Minimum 6 characters required
  - Automatically hashed using bcryptjs before saving
  - `select: false` means it's never included in query results (security)
  - Must explicitly include if needed: `User.findOne().select('+password')`

- **role**: User's access level

  - Only 4 allowed values: 'user', 'admin', 'office', 'superAdmin'
  - Defaults to 'user' if not specified
  - Determines what routes user can access

- **extraPermissions**: Custom permissions object

  - Flexible structure for additional permissions
  - SuperAdmin can assign specific permissions beyond role
  - Frontend uses this to show/hide features
  - Empty object by default

- **isActive**: Account activation status

  - Defaults to `false` on signup
  - Admin sets to `true` to activate account
  - Only active users can login
  - Used for approval workflow

- **approvedBy**: Reference to User who activated this account

  - MongoDB ObjectId pointing to another User
  - Creates audit trail
  - Set when admin activates user

- **signedUpOn**: Timestamp of account creation

  - Automatically set to current date/time
  - Never changes after creation

- **approvedOn**: Timestamp of account activation

  - Set when admin activates user
  - Null until activated

- **teamName**: Array of team assignments

  - User can be in multiple teams
  - Each element has `teamId` reference to Team model
  - Populated queries return full team details
  - Admin assigns teams to users

- **assignedOffice**: Array of office assignments
  - User can be assigned to multiple offices
  - Each element has `officeId` reference to Office model
  - Populated queries return full office details
  - Important for office role users (location-based access)

**Model Methods**:

1. **Pre-save Hook** (Automatic Password Hashing):

```javascript
userSchema.pre("save", async function (next) {
  if (!this.isModified("password")) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});
```

- Runs automatically before saving user
- Only hashes if password was modified
- Uses bcryptjs with 10 salt rounds
- User's password never stored in plain text

2. **matchPassword Method** (Password Verification):

```javascript
userSchema.methods.matchPassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};
```

- Used during login
- Compares plain text password with hashed password
- Returns true if match, false if not
- Secure comparison using bcrypt

**Indexes**:

- email: Unique index for fast lookup and uniqueness constraint
- username: Unique index for fast lookup and uniqueness constraint

---

### Region Model

**File**: `models/Region.js`

**Purpose**: Store geographic regions for organizational structure

**Schema Fields**:

```javascript
{
  regionName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  regionCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },

  isActive: {
    type: Boolean,
    default: true
  },

  visibility: {
    type: String,
    enum: ['on', 'off'],
    default: 'on'
  }
}
```

**Field Explanations**:

- **regionName**: Display name of region

  - Must be unique (e.g., "North Region")
  - Required field
  - Used in dropdowns and displays

- **regionCode**: Short code for region

  - Must be unique (e.g., "NR01")
  - Automatically converted to UPPERCASE
  - Required field
  - Used for filtering and quick identification
  - Even if you send "nr01", stored as "NR01"

- **isActive**: Whether region is operational

  - Defaults to true
  - Set to false to temporarily disable region
  - Inactive regions preserved in database

- **visibility**: Control dropdown appearance
  - "on": Shows in dropdowns/forms
  - "off": Hidden from dropdowns but exists in database
  - Defaults to "on"
  - Useful for temporarily hiding without deleting

**Why regionCode is uppercase**:

- Standardization across system
- Prevents duplicates like "nr01" and "NR01"
- Easier to read and consistent
- Professional appearance

**Use Case**: Organization operates in North, South, East, West regions. Each region contains multiple offices.

---

### Office Model

**File**: `models/Office.js`

**Purpose**: Store office locations linked to regions

**Schema Fields**:

```javascript
{
  officeName: {
    type: String,
    required: true,
    trim: true
  },

  officeCode: {
    type: String,
    required: true,
    unique: true,
    uppercase: true,
    trim: true
  },

  regionId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Region',
    required: true
  },

  isActive: {
    type: Boolean,
    default: true
  },

  visibility: {
    type: String,
    enum: ['on', 'off'],
    default: 'on'
  }
}
```

**Field Explanations**:

- **officeName**: Display name of office

  - Not unique (can have "Main Office" in multiple regions)
  - Required field
  - Examples: "Delhi Office", "Mumbai Branch"

- **officeCode**: Unique identifier for office

  - Must be unique across ALL offices (not just within region)
  - Automatically converted to UPPERCASE
  - Required field
  - Examples: "DLH01", "MUM01"

- **regionId**: Link to parent region

  - MongoDB ObjectId reference to Region model
  - Required field (every office must belong to a region)
  - Creates hierarchy: Region â†’ Offices
  - When queried with populate, returns full region details

- **isActive**: Whether office is operational

  - Defaults to true
  - Deactivate closed/temporary offices

- **visibility**: Control dropdown appearance
  - "on": Shows in office selection dropdowns
  - "off": Hidden but preserved in database

**Relationships**:

- **Parent**: Region (one region has many offices)
- **Children**: Users can be assigned to offices

**Query Example with Population**:

```javascript
const office = await Office.findById(id).populate('regionId');
// Returns:
{
  officeName: "Delhi Office",
  officeCode: "DLH01",
  regionId: {
    regionName: "North Region",
    regionCode: "NR01"
  }
}
```

**Why offices link to regions**:

- Organizational hierarchy
- Filter offices by region
- Regional reports
- Regional managers see all offices in their region

---

### Team Model

**File**: `models/Team.js`

**Purpose**: Store teams with permission sets

**Schema Fields**:

```javascript
{
  teamName: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },

  teamPermissions: {
    type: Object,
    default: {}
  },

  isActive: {
    type: Boolean,
    default: true
  },

  visibility: {
    type: String,
    enum: ['on', 'off'],
    default: 'on'
  }
}
```

**Field Explanations**:

- **teamName**: Unique name for team

  - Must be unique across all teams
  - Required field
  - Examples: "Development Team", "Sales Team", "Support Team"

- **teamPermissions**: Object defining team's access rights

  - Flexible structure (any object)
  - Users in team inherit these permissions
  - Frontend checks these to show/hide features
  - Example structure:

  ```javascript
  {
    "dashboard": ["view", "edit"],
    "reports": ["view"],
    "users": ["view", "create"]
  }
  ```

- **isActive**: Whether team is currently active

  - Defaults to true
  - Deactivate dissolved teams

- **visibility**: Control dropdown appearance
  - "on": Shows in team selection
  - "off": Hidden from dropdowns

**How Team Permissions Work**:

1. **Team Level**: Set permissions for entire team

   ```json
   {
     "dashboard": ["view", "edit"],
     "reports": ["view"]
   }
   ```

2. **User Level**: Users assigned to team inherit team permissions

   - User joins "Development Team"
   - User automatically gets dashboard view/edit and reports view

3. **Extra Permissions**: SuperAdmin can add individual permissions to specific users
   - User is in "Sales Team" (has sales dashboard access)
   - SuperAdmin gives user extra permission for admin dashboard
   - User now has both team permissions + extra permissions

**Use Cases**:

- "Development Team" gets access to code repos and deployment
- "Sales Team" gets access to customer database and sales reports
- "Support Team" gets access to ticket system and knowledge base
- "Management Team" gets access to all reports and analytics

---

## Security Features

### 1. Password Hashing

**Technology**: bcryptjs with 10 salt rounds

**How it works**:

- When user creates/updates password, it's never stored in plain text
- Bcrypt generates a random salt
- Salt is combined with password and hashed
- Hash is stored in database

**Example**:

```
User enters: "mypassword123"
Stored in DB: "$2a$10$N9qo8uLOickgx2ZMRZoMyeIjZAgcfl7p92ldGxad68LJZdL17lhWy"
```

**Why secure**:

- Even if database is compromised, passwords are unreadable
- Each hash is unique (different salt each time)
- Cannot be reversed to original password
- Brute force attacks are extremely slow

### 2. JWT Token Authentication

**Technology**: jsonwebtoken

**Token Structure**:

```
eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpZCI6IjYwZDVlYzQ5ZjFiMmM3MmI4YzhlNGYxYSIsInJvbGUiOiJ1c2VyIiwiaWF0IjoxNjI0NjE3MjAwLCJleHAiOjE2MjcyMDkyMDB9.Rw_iLqvxZGz8ZqYxNxQH5h1E0XqL8Q8PwKYb3YqMm8w
```

**Three Parts**:

1. **Header**: Algorithm and token type
2. **Payload**: User ID, role, issued at, expiration
3. **Signature**: Encrypted with JWT_SECRET

**Process**:

1. User logs in with valid credentials
2. Server generates JWT containing user ID and role
3. Token is signed with JWT_SECRET from .env
4. Token sent to client
5. Client stores token (localStorage/cookies)
6. Client sends token with every request in Authorization header
7. Server verifies token signature and expiration
8. If valid: Request proceeds; If invalid: 401 error

**Why JWT**:

- Stateless: Server doesn't need to store sessions
- Scalable: Works across multiple servers
- Fast: No database lookup for each request
- Self-contained: Token has all needed info

**Security Features**:

- Signed with secret key (prevents tampering)
- Expiration time (tokens expire after 30 days)
- Cannot be modified without invalidating signature

### 3. Role-Based Middleware

**File**: `middleware/auth.js`

**Two Middleware Functions**:

#### protect Middleware

```javascript
const protect = async (req, res, next) => {
  let token;

  // 1. Extract token from header
  if (req.headers.authorization?.startsWith("Bearer")) {
    token = req.headers.authorization.split(" ")[1];
  }

  // 2. Check token exists
  if (!token) {
    return res.status(401).json({
      success: false,
      message: "Not authorized to access this route",
    });
  }

  try {
    // 3. Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);

    // 4. Get user from token
    req.user = await User.findById(decoded.id);

    // 5. Check if user is active
    if (!req.user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is not active",
      });
    }

    next(); // Token valid, proceed to route
  } catch (error) {
    return res.status(401).json({
      success: false,
      message: "Token is invalid or expired",
    });
  }
};
```

**What it does**:

- Verifies JWT token is present and valid
- Checks if user is still active
- Attaches user object to request
- Used on ALL protected routes

#### restrictTo Middleware

```javascript
const restrictTo = (...roles) => {
  return (req, res, next) => {
    // req.user populated by protect middleware
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        message: "You do not have permission to perform this action",
      });
    }
    next();
  };
};
```

**What it does**:

- Checks if user's role is in allowed roles list
- Returns 403 Forbidden if not authorized
- Used after protect middleware

**Usage Example**:

```javascript
router.delete(
  "/:id",
  protect, // First: Verify token
  restrictTo("admin", "superAdmin"), // Second: Check role
  deleteUser // Third: Execute controller
);
```

### 4. Unique Constraints

**Why needed**: Prevent duplicate data

**Implemented on**:

- User email (no two users with same email)
- User username (no two users with same username)
- Region name (no duplicate region names)
- Region code (no duplicate region codes)
- Office code (no duplicate office codes across all offices)
- Team name (no duplicate team names)

**How enforced**:

1. **Database Level**: Mongoose unique index
2. **Application Level**: Validation before save

**Error handling**: Returns clear error message if duplicate detected

### 5. Input Validation

**Technologies**:

- Mongoose built-in validators
- express-validator (for complex validation)

**Validated Fields**:

- Email format validation
- Password minimum length (6 characters)
- Required fields
- Enum validation (role must be one of 4 values)
- ObjectId validation for references

### 6. Environment Variables

**File**: `.env` (not committed to git)

**Why secure**:

- Sensitive data never in source code
- Different values for development/production
- Can be changed without code changes
- Protected by .gitignore

**Required Variables**:

```
PORT=5000
MONGO_URI=mongodb://localhost:27017/walkout-backend
JWT_SECRET=your_super_secret_key_here_change_in_production
JWT_EXPIRE=30d
```

**Never commit .env to GitHub**: Contains database URLs, API keys, secrets

### 7. CORS Configuration

**What it is**: Cross-Origin Resource Sharing

**Purpose**: Control which domains can access API

**Current Setting**: Enabled for all origins (development)

**Production Recommendation**:

```javascript
const corsOptions = {
  origin: "https://your-frontend-domain.com",
  credentials: true,
};
app.use(cors(corsOptions));
```

### 8. Approval Workflow

**Security Benefit**: Two-factor user onboarding

**Process**:

1. User signs up (isActive=false)
2. Admin reviews user details
3. Admin approves (isActive=true)
4. System records who approved and when
5. Only then user can login

**Prevents**:

- Spam accounts
- Unauthorized access
- Bot registrations
- Malicious signups

**Audit Trail**: Know exactly who approved each user and when

---
