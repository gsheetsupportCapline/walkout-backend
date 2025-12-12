# API Testing Examples

## 1. User Signup (Public)

```
POST http://localhost:5000/api/users/signup
Content-Type: application/json

{
  "name": "Test User",
  "email": "test@example.com",
  "username": "testuser",
  "password": "password123"
}
```

## 2. Create Super Admin (First User - Manual in MongoDB)

```javascript
// Run this in MongoDB Compass or mongosh
db.users.insertOne({
  name: "Super Admin",
  email: "admin@example.com",
  username: "superadmin",
  password: "$2a$10$...", // Use bcrypt to hash password
  role: "superAdmin",
  isActive: true,
  signedUpOn: new Date(),
  extraPermissions: {},
  teamName: [],
  assignedOffice: [],
});
```

## 3. User Login

```
POST http://localhost:5000/api/users/login
Content-Type: application/json

{
  "emailOrUsername": "admin@example.com",
  "password": "admin123"
}

Response will include JWT token - use this for all protected routes
```

## 4. Create Region (Admin/SuperAdmin)

```
POST http://localhost:5000/api/regions
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "regionName": "North Region",
  "isActive": true,
  "visibility": "on"
}
```

## 5. Get All Regions

```
GET http://localhost:5000/api/regions
Authorization: Bearer <your_jwt_token>
```

## 6. Create Office (Admin/SuperAdmin)

```
POST http://localhost:5000/api/offices
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "officeName": "Delhi Office",
  "regionId": "paste_region_id_here",
  "isActive": true,
  "visibility": "on"
}
```

## 7. Get All Offices

```
GET http://localhost:5000/api/offices
Authorization: Bearer <your_jwt_token>
```

## 8. Create Team (Admin/SuperAdmin)

```
POST http://localhost:5000/api/teams
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "teamName": "Development Team",
  "teamPermissions": {
    "dashboard": ["view", "edit"],
    "reports": ["view"],
    "users": ["view"]
  },
  "isActive": true,
  "visibility": "on"
}
```

## 9. Get All Teams

```
GET http://localhost:5000/api/teams
Authorization: Bearer <your_jwt_token>
```

## 10. Get All Users (Admin/SuperAdmin)

```
GET http://localhost:5000/api/users
Authorization: Bearer <your_jwt_token>
```

## 11. Activate User (Admin/SuperAdmin)

```
PUT http://localhost:5000/api/users/{user_id}/activate
Authorization: Bearer <your_jwt_token>
```

## 12. Deactivate User (Admin/SuperAdmin)

```
PUT http://localhost:5000/api/users/{user_id}/deactivate
Authorization: Bearer <your_jwt_token>
```

## 13. Change User Role (SuperAdmin Only)

```
PUT http://localhost:5000/api/users/{user_id}/change-role
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "role": "admin"
}
```

## 14. Update Extra Permissions (SuperAdmin Only)

```
PUT http://localhost:5000/api/users/{user_id}/extra-permissions
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

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

## 15. Update User (Admin/SuperAdmin)

```
PUT http://localhost:5000/api/users/{user_id}
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "name": "Updated Name",
  "teamName": [
    { "teamId": "paste_team_id_here" }
  ],
  "assignedOffice": [
    { "officeId": "paste_office_id_here" }
  ]
}
```

## 16. Delete User (Admin/SuperAdmin)

```
DELETE http://localhost:5000/api/users/{user_id}
Authorization: Bearer <your_jwt_token>
```

## 17. Update Region

```
PUT http://localhost:5000/api/regions/{region_id}
Authorization: Bearer <your_jwt_token>
Content-Type: application/json

{
  "regionName": "Updated North Region",
  "visibility": "off"
}
```

## 18. Delete Region

```
DELETE http://localhost:5000/api/regions/{region_id}
Authorization: Bearer <your_jwt_token>
```

## Testing Flow

1. Start MongoDB locally: `mongod`
2. Start the server: `npm run dev`
3. Create first superAdmin user directly in MongoDB
4. Login with superAdmin credentials
5. Use the JWT token for all subsequent requests
6. Create regions, offices, and teams
7. Create new users via signup
8. Activate users using admin/superAdmin account
9. Test login with activated users

## Notes

- Replace `<your_jwt_token>` with actual token from login response
- Replace `{user_id}`, `{region_id}`, etc. with actual ObjectIds
- Make sure MongoDB is running before testing
- Server runs on http://localhost:5000 by default
