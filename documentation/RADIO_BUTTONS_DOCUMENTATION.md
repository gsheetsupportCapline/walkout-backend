# Radio Buttons Management System - Complete Documentation

## Overview

The Radio Buttons Management System provides a flexible way to manage dynamic form radio buttons that can be reused across multiple contexts in the application. The system uses a many-to-many relationship architecture where:

1. **Radio Buttons** - Independent, reusable button entities
2. **Button Sets** - Logical groups that can contain multiple buttons
3. **Association** - Buttons can be added to or removed from multiple button sets

**Key Features:**

- Independent button management (create once, use anywhere)
- Flexible button grouping via button sets
- Many-to-many relationships (one button can be in multiple sets)
- Role-based access control
- Bulk operations for efficiency
- Audit trail tracking

---

## Architecture

### Many-to-Many Relationship

```
Button Set 1  ──┐
                ├──> Radio Button A
Button Set 2  ──┘

Button Set 2  ──┐
                ├──> Radio Button B
Button Set 3  ──┘
```

Radio buttons are independent entities. Button sets maintain an array of button IDs, creating a flexible many-to-many relationship.

---

## Database Collections

### 1. radio-buttons Collection

Stores independent radio button entities.

**Schema:**

```javascript
{
  _id: ObjectId,
  name: String (required, unique globally),
  visibility: Boolean (default: true),
  isActive: Boolean (default: true),
  createdBy: ObjectId (ref: User, required),
  updatedBy: ObjectId (ref: User),
  createdAt: DateTime (auto),
  updatedAt: DateTime (auto)
}
```

**Indexes:**

- `name`: Unique index for fast lookups and uniqueness constraint
- `isActive`: Single field index for filtering
- `visibility`: Single field index for filtering

**Example:**

```json
{
  "_id": "674c1a2b3d4e5f6a7b8c9d10",
  "name": "Root Canal",
  "visibility": true,
  "isActive": true,
  "createdBy": "674c1a2b3d4e5f6a7b8c9d01",
  "updatedBy": null,
  "createdAt": "2025-12-19T10:05:00.000Z",
  "updatedAt": "2025-12-19T10:05:00.000Z"
}
```

### 2. button-sets Collection

Stores button set groups that reference multiple radio buttons.

**Schema:**

```javascript
{
  _id: ObjectId,
  name: String (required, unique),
  description: String,
  buttons: [ObjectId] (ref: RadioButton),
  isActive: Boolean (default: true),
  createdBy: ObjectId (ref: User, required),
  updatedBy: ObjectId (ref: User),
  createdAt: DateTime (auto),
  updatedAt: DateTime (auto)
}
```

**Indexes:**

- `name`: Single field index for fast lookups
- `isActive`: Single field index for filtering

**Example:**

```json
{
  "_id": "674c1a2b3d4e5f6a7b8c9d0e",
  "name": "Treatment Type",
  "description": "Types of dental treatments available",
  "buttons": [
    "674c1a2b3d4e5f6a7b8c9d10",
    "674c1a2b3d4e5f6a7b8c9d11",
    "674c1a2b3d4e5f6a7b8c9d12"
  ],
  "isActive": true,
  "createdBy": "674c1a2b3d4e5f6a7b8c9d01",
  "updatedBy": null,
  "createdAt": "2025-12-19T10:00:00.000Z",
  "updatedAt": "2025-12-19T10:00:00.000Z"
}
```

---

## Field Descriptions

### Radio Button Fields

| Field        | Type     | Required | Description                                         |
| ------------ | -------- | -------- | --------------------------------------------------- |
| `_id`        | ObjectId | Auto     | Unique identifier                                   |
| `name`       | String   | Yes      | Button name (must be unique globally)               |
| `visibility` | Boolean  | No       | Controls if button is visible in UI (default: true) |
| `isActive`   | Boolean  | No       | Active status (default: true)                       |
| `createdBy`  | ObjectId | Yes      | User who created the button                         |
| `updatedBy`  | ObjectId | No       | User who last updated the button                    |
| `createdAt`  | DateTime | Auto     | Creation timestamp                                  |
| `updatedAt`  | DateTime | Auto     | Last update timestamp                               |

### Button Set Fields

| Field         | Type            | Required | Description                           |
| ------------- | --------------- | -------- | ------------------------------------- |
| `_id`         | ObjectId        | Auto     | Unique identifier                     |
| `name`        | String          | Yes      | Button set name (must be unique)      |
| `description` | String          | No       | Description of the button set         |
| `buttons`     | Array[ObjectId] | No       | Array of radio button IDs in this set |
| `isActive`    | Boolean         | No       | Active status (default: true)         |
| `createdBy`   | ObjectId        | Yes      | User who created the button set       |
| `updatedBy`   | ObjectId        | No       | User who last updated the button set  |
| `createdAt`   | DateTime        | Auto     | Creation timestamp                    |
| `updatedAt`   | DateTime        | Auto     | Last update timestamp                 |

---

## API Endpoints

### Base URL

```
/api/radio-buttons
```

### Authentication

All endpoints require authentication via Bearer token:

```
Authorization: Bearer <your-jwt-token>
```

### Permission Levels

- **View/Read**: All authenticated users
- **Create/Update/Delete**: Admin and SuperAdmin only

---

## Button Set Endpoints

### 1. Create Button Set

**POST** `/api/radio-buttons/button-sets`

**Access**: Admin, SuperAdmin

**Request Body:**

```json
{
  "name": "Treatment Type",
  "description": "Types of dental treatments available"
}
```

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Button set created successfully",
  "data": {
    "_id": "674c1a2b3d4e5f6a7b8c9d0e",
    "name": "Treatment Type",
    "description": "Types of dental treatments available",
    "buttons": [],
    "isActive": true,
    "createdBy": "674c1a2b3d4e5f6a7b8c9d01",
    "createdAt": "2025-12-19T10:00:00.000Z",
    "updatedAt": "2025-12-19T10:00:00.000Z"
  }
}
```

**Error Responses:**

- **400**: Button set name already exists
- **401**: Unauthorized
- **403**: Forbidden (not admin/superAdmin)

---

### 2. Get All Button Sets

**GET** `/api/radio-buttons/button-sets`

**Access**: All authenticated users

**Query Parameters:**

- `isActive` (boolean, optional): Filter by active status
- `limit` (number, optional): Records per page (default: 100)
- `skip` (number, optional): Skip records for pagination (default: 0)

**Example Request:**

```
GET /api/radio-buttons/button-sets?isActive=true&limit=50&skip=0
```

**Response (200 OK):**

```json
{
  "success": true,
  "count": 2,
  "total": 2,
  "data": [
    {
      "_id": "674c1a2b3d4e5f6a7b8c9d0e",
      "name": "Treatment Type",
      "description": "Types of dental treatments available",
      "buttons": ["674c1a2b3d4e5f6a7b8c9d10", "674c1a2b3d4e5f6a7b8c9d11"],
      "isActive": true,
      "createdBy": {
        "_id": "674c1a2b3d4e5f6a7b8c9d01",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "updatedBy": null,
      "createdAt": "2025-12-19T10:00:00.000Z",
      "updatedAt": "2025-12-19T10:00:00.000Z"
    }
  ]
}
```

---

### 3. Get Button Set by ID

**GET** `/api/radio-buttons/button-sets/:id`

**Access**: All authenticated users

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "674c1a2b3d4e5f6a7b8c9d0e",
    "name": "Treatment Type",
    "description": "Types of dental treatments available",
    "buttons": [
      {
        "_id": "674c1a2b3d4e5f6a7b8c9d10",
        "name": "Root Canal",
        "visibility": true,
        "isActive": true
      },
      {
        "_id": "674c1a2b3d4e5f6a7b8c9d11",
        "name": "Filling",
        "visibility": true,
        "isActive": true
      }
    ],
    "isActive": true,
    "createdBy": {
      "_id": "674c1a2b3d4e5f6a7b8c9d01",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "updatedBy": null,
    "createdAt": "2025-12-19T10:00:00.000Z",
    "updatedAt": "2025-12-19T10:00:00.000Z"
  }
}
```

**Note**: The `buttons` array is automatically populated with full button details.

**Error Responses:**

- **404**: Button set not found

---

### 4. Update Button Set

**PUT** `/api/radio-buttons/button-sets/:id`

**Access**: Admin, SuperAdmin

**Request Body:**

```json
{
  "name": "Treatment Type Updated",
  "description": "Updated description",
  "isActive": true
}
```

**Note**: All fields are optional. Only provided fields will be updated. To manage buttons in the set, use the dedicated endpoints below.

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Button set updated successfully",
  "data": {
    "_id": "674c1a2b3d4e5f6a7b8c9d0e",
    "name": "Treatment Type Updated",
    "description": "Updated description",
    "buttons": ["674c1a2b3d4e5f6a7b8c9d10"],
    "isActive": true,
    "createdBy": "674c1a2b3d4e5f6a7b8c9d01",
    "updatedBy": "674c1a2b3d4e5f6a7b8c9d01",
    "createdAt": "2025-12-19T10:00:00.000Z",
    "updatedAt": "2025-12-19T11:00:00.000Z"
  }
}
```

**Error Responses:**

- **400**: Button set name already exists (if changing name)
- **404**: Button set not found

---

### 5. Delete Button Set

**DELETE** `/api/radio-buttons/button-sets/:id`

**Access**: Admin, SuperAdmin

**Important**: Deleting a button set does NOT delete the buttons themselves. Only the association is removed.

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Button set deleted successfully"
}
```

**Error Responses:**

- **404**: Button set not found

---

### 6. Add Buttons to Button Set

**POST** `/api/radio-buttons/button-sets/:id/buttons`

**Access**: Admin, SuperAdmin

Add one or more buttons to a button set.

**Request Body:**

```json
{
  "buttonIds": [
    "674c1a2b3d4e5f6a7b8c9d10",
    "674c1a2b3d4e5f6a7b8c9d11",
    "674c1a2b3d4e5f6a7b8c9d12"
  ]
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Buttons added to button set successfully",
  "data": {
    "_id": "674c1a2b3d4e5f6a7b8c9d0e",
    "name": "Treatment Type",
    "description": "Types of dental treatments available",
    "buttons": [
      {
        "_id": "674c1a2b3d4e5f6a7b8c9d10",
        "name": "Root Canal",
        "visibility": true,
        "isActive": true
      },
      {
        "_id": "674c1a2b3d4e5f6a7b8c9d11",
        "name": "Filling",
        "visibility": true,
        "isActive": true
      },
      {
        "_id": "674c1a2b3d4e5f6a7b8c9d12",
        "name": "Extraction",
        "visibility": true,
        "isActive": true
      }
    ],
    "isActive": true,
    "updatedBy": {
      "_id": "674c1a2b3d4e5f6a7b8c9d01",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "createdAt": "2025-12-19T10:00:00.000Z",
    "updatedAt": "2025-12-19T11:30:00.000Z"
  }
}
```

**Notes:**

- Duplicate button IDs are automatically avoided
- All button IDs must be valid (exist in database)
- Returns fully populated button set with button details

**Error Responses:**

- **400**: Button IDs array is required or empty
- **404**: Button set not found or one or more button IDs are invalid

---

### 7. Remove Buttons from Button Set

**DELETE** `/api/radio-buttons/button-sets/:id/buttons`

**Access**: Admin, SuperAdmin

Remove one or more buttons from a button set.

**Request Body:**

```json
{
  "buttonIds": ["674c1a2b3d4e5f6a7b8c9d10", "674c1a2b3d4e5f6a7b8c9d11"]
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Buttons removed from button set successfully",
  "data": {
    "_id": "674c1a2b3d4e5f6a7b8c9d0e",
    "name": "Treatment Type",
    "description": "Types of dental treatments available",
    "buttons": [
      {
        "_id": "674c1a2b3d4e5f6a7b8c9d12",
        "name": "Extraction",
        "visibility": true,
        "isActive": true
      }
    ],
    "isActive": true,
    "updatedBy": {
      "_id": "674c1a2b3d4e5f6a7b8c9d01",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "createdAt": "2025-12-19T10:00:00.000Z",
    "updatedAt": "2025-12-19T11:45:00.000Z"
  }
}
```

**Notes:**

- Removing buttons from a set does NOT delete the buttons themselves
- Invalid button IDs are silently ignored
- Returns fully populated button set with remaining button details

**Error Responses:**

- **400**: Button IDs array is required or empty
- **404**: Button set not found

---

## Radio Button Endpoints

### 1. Create Radio Button

**POST** `/api/radio-buttons`

**Access**: Admin, SuperAdmin

**Request Body:**

```json
{
  "name": "Root Canal",
  "visibility": true,
  "isActive": true
}
```

**Note**: `visibility` and `isActive` are optional (default: true)

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Radio button created successfully",
  "data": {
    "_id": "674c1a2b3d4e5f6a7b8c9d10",
    "name": "Root Canal",
    "visibility": true,
    "isActive": true,
    "createdBy": {
      "_id": "674c1a2b3d4e5f6a7b8c9d01",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "createdAt": "2025-12-19T10:05:00.000Z",
    "updatedAt": "2025-12-19T10:05:00.000Z"
  }
}
```

**Error Responses:**

- **400**: Button name is required OR Button with this name already exists
- **401**: Unauthorized
- **403**: Forbidden (not admin/superAdmin)

---

### 2. Get All Radio Buttons

**GET** `/api/radio-buttons`

**Access**: All authenticated users

**Query Parameters:**

- `isActive` (boolean, optional): Filter by active status
- `visibility` (boolean, optional): Filter by visibility
- `limit` (number, optional): Records per page (default: 100)
- `skip` (number, optional): Skip records for pagination (default: 0)

**Example Request:**

```
GET /api/radio-buttons?isActive=true&visibility=true&limit=50
```

**Response (200 OK):**

```json
{
  "success": true,
  "count": 3,
  "total": 3,
  "data": [
    {
      "_id": "674c1a2b3d4e5f6a7b8c9d10",
      "name": "Root Canal",
      "visibility": true,
      "isActive": true,
      "createdBy": {
        "_id": "674c1a2b3d4e5f6a7b8c9d01",
        "name": "Admin User",
        "email": "admin@example.com"
      },
      "updatedBy": null,
      "createdAt": "2025-12-19T10:05:00.000Z",
      "updatedAt": "2025-12-19T10:05:00.000Z"
    }
  ]
}
```

---

### 3. Get Radio Button by ID

**GET** `/api/radio-buttons/:id`

**Access**: All authenticated users

**Response (200 OK):**

```json
{
  "success": true,
  "data": {
    "_id": "674c1a2b3d4e5f6a7b8c9d10",
    "name": "Root Canal",
    "visibility": true,
    "isActive": true,
    "createdBy": {
      "_id": "674c1a2b3d4e5f6a7b8c9d01",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "updatedBy": null,
    "createdAt": "2025-12-19T10:05:00.000Z",
    "updatedAt": "2025-12-19T10:05:00.000Z"
  }
}
```

**Error Responses:**

- **404**: Radio button not found

---

### 4. Update Radio Button

**PUT** `/api/radio-buttons/:id`

**Access**: Admin, SuperAdmin

**Request Body:**

```json
{
  "name": "Root Canal Treatment",
  "visibility": true,
  "isActive": true
}
```

**Note**: All fields are optional. Only provided fields will be updated.

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Radio button updated successfully",
  "data": {
    "_id": "674c1a2b3d4e5f6a7b8c9d10",
    "name": "Root Canal Treatment",
    "visibility": true,
    "isActive": true,
    "createdBy": {
      "_id": "674c1a2b3d4e5f6a7b8c9d01",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "updatedBy": {
      "_id": "674c1a2b3d4e5f6a7b8c9d01",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "createdAt": "2025-12-19T10:05:00.000Z",
    "updatedAt": "2025-12-19T11:15:00.000Z"
  }
}
```

**Error Responses:**

- **400**: Button with this name already exists
- **404**: Radio button not found

---

### 5. Delete Radio Button

**DELETE** `/api/radio-buttons/:id`

**Access**: Admin, SuperAdmin

**Important**: Deleting a button automatically removes it from all button sets that reference it.

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Radio button deleted successfully"
}
```

**Error Responses:**

- **404**: Radio button not found

---

## Bulk Operations

### 1. Bulk Create Radio Buttons

**POST** `/api/radio-buttons/bulk`

**Access**: Admin, SuperAdmin

Create multiple radio buttons at once.

**Request Body:**

```json
{
  "buttons": [
    {
      "name": "Cleaning",
      "visibility": true,
      "isActive": true
    },
    {
      "name": "Filling",
      "visibility": true,
      "isActive": true
    },
    {
      "name": "Extraction"
    }
  ]
}
```

**Note**: Each button must have a `name`. Other fields are optional.

**Response (201 Created):**

```json
{
  "success": true,
  "message": "Successfully created 3 radio buttons",
  "created": 3,
  "failed": 0,
  "data": [
    {
      "_id": "674c1a2b3d4e5f6a7b8c9d11",
      "name": "Cleaning",
      "visibility": true,
      "isActive": true,
      "createdBy": "674c1a2b3d4e5f6a7b8c9d01",
      "createdAt": "2025-12-19T10:20:00.000Z",
      "updatedAt": "2025-12-19T10:20:00.000Z"
    },
    {
      "_id": "674c1a2b3d4e5f6a7b8c9d12",
      "name": "Filling",
      "visibility": true,
      "isActive": true,
      "createdBy": "674c1a2b3d4e5f6a7b8c9d01",
      "createdAt": "2025-12-19T10:20:00.000Z",
      "updatedAt": "2025-12-19T10:20:00.000Z"
    },
    {
      "_id": "674c1a2b3d4e5f6a7b8c9d13",
      "name": "Extraction",
      "visibility": true,
      "isActive": true,
      "createdBy": "674c1a2b3d4e5f6a7b8c9d01",
      "createdAt": "2025-12-19T10:20:00.000Z",
      "updatedAt": "2025-12-19T10:20:00.000Z"
    }
  ]
}
```

**Partial Success Response:**
If some buttons fail (e.g., duplicate names or missing name):

```json
{
  "success": true,
  "message": "Successfully created 2 radio buttons",
  "created": 2,
  "failed": 1,
  "data": [
    /* successfully created buttons */
  ],
  "errors": [
    {
      "name": "Cleaning",
      "error": "Duplicate name"
    }
  ]
}
```

**Error Responses:**

- **400**: Buttons array is required or empty

---

### 2. Bulk Update Radio Buttons

**PUT** `/api/radio-buttons/bulk`

**Access**: Admin, SuperAdmin

Update multiple radio buttons at once.

**Request Body:**

```json
{
  "buttons": [
    {
      "id": "674c1a2b3d4e5f6a7b8c9d11",
      "name": "Deep Cleaning",
      "visibility": true
    },
    {
      "id": "674c1a2b3d4e5f6a7b8c9d12",
      "visibility": false
    }
  ]
}
```

**Note**: Each button object must include `id`. Other fields are optional.

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Successfully updated 2 radio buttons",
  "updated": 2,
  "failed": 0,
  "data": [
    /* updated buttons */
  ]
}
```

**Partial Success Response:**

```json
{
  "success": true,
  "message": "Successfully updated 1 radio buttons",
  "updated": 1,
  "failed": 1,
  "data": [
    /* updated buttons */
  ],
  "errors": [
    {
      "id": "674c1a2b3d4e5f6a7b8c9d12",
      "error": "Radio button not found"
    }
  ]
}
```

**Error Responses:**

- **400**: Buttons array is required or empty

---

### 3. Bulk Delete Radio Buttons

**DELETE** `/api/radio-buttons/bulk`

**Access**: Admin, SuperAdmin

Delete multiple radio buttons at once.

**Important**: All deleted buttons are automatically removed from all button sets that reference them.

**Request Body:**

```json
{
  "ids": [
    "674c1a2b3d4e5f6a7b8c9d11",
    "674c1a2b3d4e5f6a7b8c9d12",
    "674c1a2b3d4e5f6a7b8c9d13"
  ]
}
```

**Response (200 OK):**

```json
{
  "success": true,
  "message": "Successfully deleted 3 radio buttons",
  "deleted": 3
}
```

**Error Responses:**

- **400**: IDs array is required or empty

---

## Use Cases & Workflows

### Use Case 1: Setting Up Treatment Options

```bash
# Step 1: Create buttons in bulk
POST /api/radio-buttons/bulk
{
  "buttons": [
    { "name": "Cleaning" },
    { "name": "Filling" },
    { "name": "Root Canal" },
    { "name": "Extraction" },
    { "name": "Crown" }
  ]
}
# Returns button IDs: [id1, id2, id3, id4, id5]

# Step 2: Create button set
POST /api/radio-buttons/button-sets
{
  "name": "Treatment Type",
  "description": "Available dental treatments"
}
# Returns set ID: set_id_1

# Step 3: Add buttons to set
POST /api/radio-buttons/button-sets/set_id_1/buttons
{
  "buttonIds": ["id1", "id2", "id3", "id4", "id5"]
}
```

### Use Case 2: Reusing Buttons Across Multiple Forms

```bash
# Scenario: "Cleaning" button used in both "Treatment" and "Quick Services" sets

# Get button ID first
GET /api/radio-buttons?name=Cleaning
# Returns: button_id_cleaning

# Add to Treatment set
POST /api/radio-buttons/button-sets/treatment_set_id/buttons
{
  "buttonIds": ["button_id_cleaning"]
}

# Add same button to Quick Services set
POST /api/radio-buttons/button-sets/quick_services_set_id/buttons
{
  "buttonIds": ["button_id_cleaning"]
}
```

### Use Case 3: Frontend Form Rendering

```javascript
// Fetch button set with populated buttons
async function renderRadioForm(buttonSetId) {
  const response = await fetch(
    `/api/radio-buttons/button-sets/${buttonSetId}`,
    {
      headers: { Authorization: `Bearer ${token}` },
    }
  );

  const { data: buttonSet } = await response.json();

  // Filter active & visible buttons
  const visibleButtons = buttonSet.buttons.filter(
    (btn) => btn.isActive && btn.visibility
  );

  // Render form
  const form = document.createElement("form");
  form.innerHTML = `<h3>${buttonSet.name}</h3>`;

  visibleButtons.forEach((button) => {
    const radio = `
      <label>
        <input type="radio" name="${buttonSet.name}" value="${button._id}">
        ${button.name}
      </label>
    `;
    form.innerHTML += radio;
  });

  document.body.appendChild(form);
}
```

### Use Case 4: Temporarily Hiding a Button Globally

```bash
# Hide "Root Canal" button (affects ALL sets using it)
PUT /api/radio-buttons/button_id
{
  "visibility": false
}
```

### Use Case 5: Reorganizing Button Sets

```bash
# Move buttons from "Old Set" to "New Set"

# Step 1: Remove from old set
DELETE /api/radio-buttons/button-sets/old_set_id/buttons
{
  "buttonIds": ["id1", "id2", "id3"]
}

# Step 2: Add to new set
POST /api/radio-buttons/button-sets/new_set_id/buttons
{
  "buttonIds": ["id1", "id2", "id3"]
}
```

---

## Business Rules

1. **Global Button Uniqueness**: Button names must be unique across the entire system (not just within a set).

2. **Many-to-Many Relationship**:

   - One button can belong to multiple button sets
   - One button set can contain multiple buttons
   - Changes to a button affect all sets that use it

3. **Visibility vs isActive**:

   - `visibility`: Controls UI display (temporary hiding)
   - `isActive`: Controls logical active status (soft delete)
   - Prefer `visibility=false` for temporary hiding
   - Use `isActive=false` for soft deletion

4. **Cascade Deletion**:

   - Deleting a button automatically removes it from ALL button sets
   - Deleting a button set does NOT delete its buttons (only removes associations)

5. **Audit Trail**: All create/update operations track `createdBy` and `updatedBy`

6. **Button Set Independence**: Button sets can be deleted anytime without affecting buttons

---

## Error Handling

All API responses follow a consistent format:

**Success Response:**

```json
{
  "success": true,
  "message": "Operation successful",
  "data": {
    /* response data */
  }
}
```

**Error Response:**

```json
{
  "success": false,
  "message": "Error description",
  "error": "Detailed error message"
}
```

**Common HTTP Status Codes:**

- `200 OK`: Successful GET, PUT, DELETE
- `201 Created`: Successful POST
- `400 Bad Request`: Validation error, duplicate entry
- `401 Unauthorized`: Missing or invalid authentication token
- `403 Forbidden`: Insufficient permissions
- `404 Not Found`: Resource not found
- `500 Internal Server Error`: Server error

---

## Frontend Integration Examples

### Complete Setup Workflow

```javascript
// Admin workflow to set up button system
async function setupButtonSystem() {
  const token = getAuthToken();
  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  };

  // 1. Create buttons
  const createResponse = await fetch("/api/radio-buttons/bulk", {
    method: "POST",
    headers,
    body: JSON.stringify({
      buttons: [
        { name: "Cleaning" },
        { name: "Filling" },
        { name: "Root Canal" },
        { name: "Extraction" },
      ],
    }),
  });
  const { data: buttons } = await createResponse.json();
  const buttonIds = buttons.map((b) => b._id);

  // 2. Create button set
  const setResponse = await fetch("/api/radio-buttons/button-sets", {
    method: "POST",
    headers,
    body: JSON.stringify({
      name: "Treatment Type",
      description: "Available treatments",
    }),
  });
  const { data: buttonSet } = await setResponse.json();

  // 3. Associate buttons with set
  await fetch(`/api/radio-buttons/button-sets/${buttonSet._id}/buttons`, {
    method: "POST",
    headers,
    body: JSON.stringify({ buttonIds }),
  });

  console.log("Button system setup complete!");
}
```

### Fetching and Rendering Forms

```javascript
// Fetch and render a button set as a form
async function loadFormButtons(buttonSetId) {
  const response = await fetch(
    `/api/radio-buttons/button-sets/${buttonSetId}`,
    {
      headers: { Authorization: `Bearer ${getAuthToken()}` },
    }
  );

  const { data: set } = await response.json();

  // Filter for visible and active buttons only
  return set.buttons.filter((b) => b.isActive && b.visibility);
}

// React component example
function RadioButtonForm({ buttonSetId }) {
  const [buttons, setButtons] = useState([]);
  const [selected, setSelected] = useState(null);

  useEffect(() => {
    loadFormButtons(buttonSetId).then(setButtons);
  }, [buttonSetId]);

  return (
    <div>
      {buttons.map((button) => (
        <label key={button._id}>
          <input
            type="radio"
            name="option"
            value={button._id}
            checked={selected === button._id}
            onChange={() => setSelected(button._id)}
          />
          {button.name}
        </label>
      ))}
    </div>
  );
}
```

---

## Database Maintenance

### Finding Orphaned Buttons

Buttons not referenced by any button set:

```javascript
const allButtonIds = db.getCollection("radio-buttons").distinct("_id");
const usedButtonIds =
  db
    .getCollection("button-sets")
    .aggregate([
      { $unwind: "$buttons" },
      { $group: { _id: null, buttonIds: { $addToSet: "$buttons" } } },
    ])
    .toArray()[0]?.buttonIds || [];

const orphanedButtons = allButtonIds.filter(
  (id) => !usedButtonIds.some((used) => used.equals(id))
);

console.log(`Found ${orphanedButtons.length} orphaned buttons`);
```

### Cleanup Old Inactive Buttons

```javascript
const sixMonthsAgo = new Date();
sixMonthsAgo.setMonth(sixMonthsAgo.getMonth() - 6);

// Find candidates
const candidates = db
  .getCollection("radio-buttons")
  .find({
    isActive: false,
    updatedAt: { $lt: sixMonthsAgo },
  })
  .toArray();

const candidateIds = candidates.map((btn) => btn._id);

// Remove from all button sets first
db.getCollection("button-sets").updateMany(
  { buttons: { $in: candidateIds } },
  { $pull: { buttons: { $in: candidateIds } } }
);

// Delete buttons
const result = db.getCollection("radio-buttons").deleteMany({
  _id: { $in: candidateIds },
});

console.log(`Cleaned up ${result.deletedCount} inactive buttons`);
```

### Finding Button Usage

Find all button sets using a specific button:

```javascript
const buttonId = ObjectId("674c1a2b3d4e5f6a7b8c9d10");

const sets = db
  .getCollection("button-sets")
  .find(
    {
      buttons: buttonId,
    },
    {
      name: 1,
      description: 1,
    }
  )
  .toArray();

console.log(`Button is used in ${sets.length} button sets:`);
sets.forEach((set) => console.log(`- ${set.name}`));
```

---

## Performance Considerations

1. **Indexes**: Proper indexes are in place for common queries
2. **Pagination**: Always use `limit` and `skip` for large datasets
3. **Population**: Button sets auto-populate button details (consider caching)
4. **Frontend Caching**: Cache button sets as they don't change frequently
5. **Bulk Operations**: Use bulk endpoints to reduce API calls
6. **Lazy Loading**: For large button sets, consider pagination

---

## Security Notes

1. **Authentication**: All endpoints require valid JWT token
2. **Authorization**: Admin/SuperAdmin roles enforced for mutations
3. **Input Validation**: All inputs are validated before processing
4. **Injection Prevention**: MongoDB queries are parameterized
5. **Audit Trail**: All mutations track user who performed the action
6. **Rate Limiting**: Consider implementing rate limiting for bulk operations

---

## API Endpoint Summary

### Button Sets (7 endpoints)

| Method | Endpoint                   | Access | Description                                   |
| ------ | -------------------------- | ------ | --------------------------------------------- |
| POST   | `/button-sets`             | Admin  | Create button set                             |
| GET    | `/button-sets`             | All    | Get all button sets                           |
| GET    | `/button-sets/:id`         | All    | Get button set by ID (with buttons populated) |
| PUT    | `/button-sets/:id`         | Admin  | Update button set                             |
| DELETE | `/button-sets/:id`         | Admin  | Delete button set                             |
| POST   | `/button-sets/:id/buttons` | Admin  | Add buttons to set                            |
| DELETE | `/button-sets/:id/buttons` | Admin  | Remove buttons from set                       |

### Radio Buttons (5 endpoints)

| Method | Endpoint | Access | Description                                 |
| ------ | -------- | ------ | ------------------------------------------- |
| POST   | `/`      | Admin  | Create radio button                         |
| GET    | `/`      | All    | Get all radio buttons                       |
| GET    | `/:id`   | All    | Get radio button by ID                      |
| PUT    | `/:id`   | Admin  | Update radio button                         |
| DELETE | `/:id`   | Admin  | Delete radio button (removes from all sets) |

### Bulk Operations (3 endpoints)

| Method | Endpoint | Access | Description                                 |
| ------ | -------- | ------ | ------------------------------------------- |
| POST   | `/bulk`  | Admin  | Bulk create buttons                         |
| PUT    | `/bulk`  | Admin  | Bulk update buttons                         |
| DELETE | `/bulk`  | Admin  | Bulk delete buttons (removes from all sets) |

**Total**: 15 API endpoints

---

## Architecture Benefits

1. **Reusability**: Create button once, use in multiple contexts
2. **Consistency**: One button definition ensures consistent naming/behavior across application
3. **Flexibility**: Easily reorganize buttons into different sets without recreation
4. **Maintainability**: Update button once, changes reflect everywhere it's used
5. **Scalability**: Independent management of buttons and sets enables growth
6. **Efficiency**: Bulk operations reduce API calls and improve performance

---

## Migration Notes

If migrating from the old architecture (where buttonSetId was required):

1. **Database Migration**:

   - Remove `buttonSetId` field from all radio buttons
   - Add `buttons` array to all button sets
   - Migrate existing button-to-set relationships to new structure

2. **API Updates**:

   - Update all API calls to remove `buttonSetId` from button creation
   - Use new endpoints for managing button-set associations
   - Update bulk create requests to remove `buttonSetId`

3. **Frontend Updates**:
   - Fetch button sets using GET `/button-sets/:id` (auto-populates buttons)
   - Remove button set filtering from button queries
   - Update forms to use populated button arrays from button sets

---

## Files Modified

1. **Models**:

   - `models/RadioButton.js` - Removed `buttonSetId` field, made `name` globally unique
   - `models/ButtonSet.js` - Added `buttons` array field

2. **Controllers**:

   - `controllers/radioButtonController.js` - Removed `buttonSetId` logic, added cleanup on delete
   - `controllers/buttonSetController.js` - Added `addButtonsToSet` and `removeButtonsFromSet` methods

3. **Routes**:

   - `routes/radioButtonRoutes.js` - Removed `getByButtonSet` route, added button association routes

4. **Documentation**:
   - `documentation/RADIO_BUTTONS_DOCUMENTATION.md` - Complete rewrite for v2.0

---

**Last Updated**: December 19, 2025  
**Version**: 2.0.0 (Many-to-Many Architecture)  
**Breaking Changes**: Yes (from v1.0)
