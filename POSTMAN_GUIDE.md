# Postman Collection - Walkout Backend API

## Import Instructions

1. **Postman me import karo:**

   - Postman open karo
   - Import button click karo
   - `Walkout-Backend.postman_collection.json` file select karo
   - Collection import ho jayega

2. **Environment variables automatically set honge:**
   - Jab aap login karoge, token automatically save ho jayega
   - Jab region/office/team create karoge, IDs automatically save hongi
   - Ye IDs baaki APIs me automatically use hongi

## Testing Flow

### Step 1: Create SuperAdmin

```bash
npm run create-admin
```

Credentials:

- Email: `admin@walkout.com`
- Username: `superadmin`
- Password: `admin123`

### Step 2: Admin Login

1. "Authentication" folder open karo
2. "Admin Login" request run karo
3. ✅ Token automatically save ho jayega `{{auth_token}}` variable me

### Step 3: Create Dropdowns

**Region create karo:**

1. "Regions" → "Create Region" run karo
2. ✅ Region ID automatically save hoga

**Office create karo:**

1. "Offices" → "Create Office" run karo
2. Uses saved `{{region_id}}`
3. ✅ Office ID automatically save hoga

**Team create karo:**

1. "Teams" → "Create Team" run karo
2. ✅ Team ID automatically save hoga

### Step 4: User Management

**New user signup:**

1. "Authentication" → "User Signup" run karo
2. ✅ User ID automatically save hoga

**User ko activate karo:**

1. "User Management" → "Activate User" run karo
2. Uses saved `{{new_user_id}}`

**User login karo:**

1. "Authentication" → "User Login" run karo
2. User credentials se login hoga

## Automatic Variables

Collection me ye variables automatically set hote hain:

| Variable      | Set By        | Usage                       |
| ------------- | ------------- | --------------------------- |
| `auth_token`  | Admin Login   | Authentication header me    |
| `user_token`  | User Login    | User authentication ke liye |
| `new_user_id` | User Signup   | User operations ke liye     |
| `region_id`   | Create Region | Office create karne me      |
| `office_id`   | Create Office | User assignment me          |
| `team_id`     | Create Team   | User assignment me          |

## Request Scripts

Har important request me **Test Scripts** included hain jo:

- Response se IDs extract karti hain
- Variables me automatically save karti hain
- Console me confirmation print karti hain

Example:

```javascript
if (pm.response.code === 200) {
  const responseData = pm.response.json();
  pm.environment.set("auth_token", responseData.token);
  console.log("Token saved:", responseData.token);
}
```

## Collection Variables

Base URL: `http://localhost:5000`

Agar server kisi aur port pe hai toh collection variables me change kar sakte ho:

1. Collection pe right-click
2. "Edit" select karo
3. "Variables" tab open karo
4. `base_url` change karo

## Authentication

Har protected request me automatically Bearer token use hota hai:

```
Authorization: Bearer {{auth_token}}
```

## Role-Based Access

| Endpoint          | Allowed Roles     |
| ----------------- | ----------------- |
| Signup/Login      | Public            |
| Get Users         | admin, superAdmin |
| Activate User     | admin, superAdmin |
| Change Role       | superAdmin only   |
| Extra Permissions | superAdmin only   |
| CRUD Dropdowns    | admin, superAdmin |

## Example Request Body

**Create Team with Permissions:**

```json
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

**Update User with Teams & Offices:**

```json
{
  "name": "Updated User Name",
  "teamName": [{ "teamId": "{{team_id}}" }],
  "assignedOffice": [{ "officeId": "{{office_id}}" }]
}
```

## Troubleshooting

**Token expired:**

- Re-run "Admin Login" request
- Token automatically update ho jayega

**404 Not Found:**

- Check server running hai ya nahi
- Verify `base_url` correct hai

**401 Unauthorized:**

- Login request dobara run karo
- Check user active hai ya nahi

**403 Forbidden:**

- Check aapka role sufficient hai
- SuperAdmin credentials use karo agar role change karna hai

## Notes

- Sab IDs automatically save hote hain aur reuse hote hain
- Console output dekho variables ki values check karne ke liye
- Collection 順序 me run karo for best results
- MongoDB running hona chahiye local me
