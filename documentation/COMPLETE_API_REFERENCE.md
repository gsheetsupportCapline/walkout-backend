# Complete API Reference - Radio Buttons & Dropdowns

## Table of Contents

- [Radio Button Sets](#radio-button-sets)
  - [CRUD Operations](#radio-button-crud-operations)
  - [Individual Button Operations](#individual-button-operations)
  - [Bulk Operations](#radio-button-bulk-operations)
  - [Archive Operations](#radio-button-archive-operations)
  - [UsedIn Operations](#radio-button-usedin-operations)
- [Dropdown Sets](#dropdown-sets)
  - [CRUD Operations](#dropdown-crud-operations)
  - [Individual Option Operations](#individual-option-operations)
  - [Bulk Operations](#dropdown-bulk-operations)
  - [Archive Operations](#dropdown-archive-operations)
  - [UsedIn Operations](#dropdown-usedin-operations)

---

# Radio Button Sets

## Radio Button CRUD Operations

### 1. Create Button Set

**Endpoint:** `POST /api/radio-buttons/button-sets`  
**Access:** Admin/SuperAdmin only  
**Auth:** Bearer Token Required

**Request Body:**

```json
{
  "name": "Gender Options",
  "description": "Gender selection for forms",
  "isActive": true
}
```

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49f1b2c8b1f8e4c123",
    "name": "Gender Options",
    "description": "Gender selection for forms",
    "lastButtonId": 0,
    "buttons": [],
    "isActive": true,
    "usedIn": [],
    "createdBy": {
      "_id": "60d5ec49f1b2c8b1f8e4c001",
      "name": "Admin User",
      "email": "admin@walkout.com"
    },
    "updatedBy": null,
    "createdAt": "2024-12-29T10:00:00.000Z",
    "updatedAt": "2024-12-29T10:00:00.000Z"
  }
}
```

**Error Response (400):**

```json
{
  "success": false,
  "message": "Button set with this name already exists"
}
```

---

### 2. Get All Button Sets

**Endpoint:** `GET /api/radio-buttons/button-sets`  
**Access:** Public (No authentication required)  
**Auth:** None

**Query Parameters:**

- `isActive` (optional): Filter by active status (true/false)
- `limit` (optional): Number of records to return
- `skip` (optional): Number of records to skip for pagination

**Example:** `GET /api/radio-buttons/button-sets?isActive=true&limit=50&skip=0`

**Success Response (200):**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "60d5ec49f1b2c8b1f8e4c123",
      "name": "Gender Options",
      "description": "Gender selection for forms",
      "lastButtonId": 2,
      "buttons": [
        {
          "_id": "60d5ec49f1b2c8b1f8e4c124",
          "incrementalId": 1,
          "name": "Male",
          "visibility": true,
          "isActive": true,
          "createdAt": "2024-12-29T10:01:00.000Z",
          "updatedAt": "2024-12-29T10:01:00.000Z"
        },
        {
          "_id": "60d5ec49f1b2c8b1f8e4c125",
          "incrementalId": 2,
          "name": "Female",
          "visibility": true,
          "isActive": true,
          "createdAt": "2024-12-29T10:02:00.000Z",
          "updatedAt": "2024-12-29T10:02:00.000Z"
        }
      ],
      "isActive": true,
      "usedIn": ["profile_screen", "registration_form"],
      "createdBy": {
        "_id": "60d5ec49f1b2c8b1f8e4c001",
        "name": "Admin User",
        "email": "admin@walkout.com"
      },
      "updatedBy": null,
      "createdAt": "2024-12-29T10:00:00.000Z",
      "updatedAt": "2024-12-29T10:02:00.000Z"
    }
  ]
}
```

---

### 3. Get Button Set by ID

**Endpoint:** `GET /api/radio-buttons/button-sets/:id`  
**Access:** All authenticated users  
**Auth:** Bearer Token Required

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49f1b2c8b1f8e4c123",
    "name": "Gender Options",
    "description": "Gender selection for forms",
    "lastButtonId": 2,
    "buttons": [
      {
        "_id": "60d5ec49f1b2c8b1f8e4c124",
        "incrementalId": 1,
        "name": "Male",
        "visibility": true,
        "isActive": true,
        "createdAt": "2024-12-29T10:01:00.000Z",
        "updatedAt": "2024-12-29T10:01:00.000Z"
      }
    ],
    "isActive": true,
    "usedIn": ["profile_screen", "registration_form"],
    "createdBy": {...},
    "updatedBy": null,
    "createdAt": "2024-12-29T10:00:00.000Z",
    "updatedAt": "2024-12-29T10:02:00.000Z"
  }
}
```

**Error Response (404):**

```json
{
  "success": false,
  "message": "Button set not found"
}
```

---

### 4. Update Button Set

**Endpoint:** `PUT /api/radio-buttons/button-sets/:id`  
**Access:** Admin/SuperAdmin only  
**Auth:** Bearer Token Required

**Request Body:**

```json
{
  "name": "Gender Selection",
  "description": "Updated description",
  "isActive": false
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49f1b2c8b1f8e4c123",
    "name": "Gender Selection",
    "description": "Updated description",
    "buttons": [...],
    "isActive": false,
    "usedIn": ["profile_screen"],
    "updatedBy": {
      "_id": "60d5ec49f1b2c8b1f8e4c001",
      "name": "Admin User",
      "email": "admin@walkout.com"
    },
    ...
  }
}
```

---

### 5. Delete Button Set (Archive)

**Endpoint:** `DELETE /api/radio-buttons/button-sets/:id`  
**Access:** Admin/SuperAdmin only  
**Auth:** Bearer Token Required

**Optional Request Body:**

```json
{
  "deletionReason": "No longer needed"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "Button set archived and deleted successfully"
}
```

---

## Individual Button Operations

### 1. Create Button in Set

**Endpoint:** `POST /api/radio-buttons/button-sets/:buttonSetId/buttons`  
**Access:** Admin/SuperAdmin only  
**Auth:** Bearer Token Required

**Request Body:**

```json
{
  "name": "Other",
  "visibility": true,
  "isActive": true
}
```

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49f1b2c8b1f8e4c123",
    "name": "Gender Options",
    "lastButtonId": 3,
    "buttons": [
      {
        "_id": "60d5ec49f1b2c8b1f8e4c126",
        "incrementalId": 3,
        "name": "Other",
        "visibility": true,
        "isActive": true,
        "createdAt": "2024-12-29T10:05:00.000Z",
        "updatedAt": "2024-12-29T10:05:00.000Z"
      }
    ],
    ...
  }
}
```

**Error Response (400):**

```json
{
  "success": false,
  "message": "Button with this name already exists in this set"
}
```

---

### 2. Get All Buttons in Set

**Endpoint:** `GET /api/radio-buttons/button-sets/:buttonSetId/buttons`  
**Access:** All authenticated users  
**Auth:** Bearer Token Required

**Query Parameters:**

- `isActive` (optional): Filter by active status
- `visibility` (optional): Filter by visibility

**Success Response (200):**

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "60d5ec49f1b2c8b1f8e4c124",
      "incrementalId": 1,
      "name": "Male",
      "visibility": true,
      "isActive": true,
      "createdAt": "2024-12-29T10:01:00.000Z",
      "updatedAt": "2024-12-29T10:01:00.000Z"
    },
    {
      "_id": "60d5ec49f1b2c8b1f8e4c125",
      "incrementalId": 2,
      "name": "Female",
      "visibility": true,
      "isActive": true,
      "createdAt": "2024-12-29T10:02:00.000Z",
      "updatedAt": "2024-12-29T10:02:00.000Z"
    }
  ]
}
```

---

### 3. Get Button by ID

**Endpoint:** `GET /api/radio-buttons/button-sets/:buttonSetId/buttons/:buttonId`  
**Access:** All authenticated users  
**Auth:** Bearer Token Required

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49f1b2c8b1f8e4c124",
    "incrementalId": 1,
    "name": "Male",
    "visibility": true,
    "isActive": true,
    "createdAt": "2024-12-29T10:01:00.000Z",
    "updatedAt": "2024-12-29T10:01:00.000Z"
  }
}
```

---

### 4. Update Button

**Endpoint:** `PUT /api/radio-buttons/button-sets/:buttonSetId/buttons/:buttonId`  
**Access:** Admin/SuperAdmin only  
**Auth:** Bearer Token Required

**Request Body:**

```json
{
  "name": "Male (Updated)",
  "visibility": false,
  "isActive": true
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49f1b2c8b1f8e4c123",
    "name": "Gender Options",
    "buttons": [
      {
        "_id": "60d5ec49f1b2c8b1f8e4c124",
        "incrementalId": 1,
        "name": "Male (Updated)",
        "visibility": false,
        "isActive": true,
        ...
      }
    ],
    ...
  }
}
```

---

### 5. Delete Button (Archive)

**Endpoint:** `DELETE /api/radio-buttons/button-sets/:buttonSetId/buttons/:buttonId`  
**Access:** Admin/SuperAdmin only  
**Auth:** Bearer Token Required

**Success Response (200):**

```json
{
  "success": true,
  "message": "Button archived and deleted successfully"
}
```

---

## Radio Button Bulk Operations

### 1. Bulk Create Buttons

**Endpoint:** `POST /api/radio-buttons/button-sets/:buttonSetId/buttons/bulk`  
**Access:** Admin/SuperAdmin only  
**Auth:** Bearer Token Required

**Request Body:**

```json
{
  "buttons": [
    {
      "name": "Option A",
      "visibility": true,
      "isActive": true
    },
    {
      "name": "Option B",
      "visibility": true,
      "isActive": false
    },
    {
      "name": "Option C"
    }
  ]
}
```

**Success Response (201):**

```json
{
  "success": true,
  "created": 3,
  "failed": 0,
  "data": {
    "_id": "60d5ec49f1b2c8b1f8e4c123",
    "buttons": [
      {
        "incrementalId": 4,
        "name": "Option A",
        ...
      },
      {
        "incrementalId": 5,
        "name": "Option B",
        ...
      }
    ],
    ...
  },
  "errors": []
}
```

**Partial Success Response (201):**

```json
{
  "success": true,
  "created": 2,
  "failed": 1,
  "data": {...},
  "errors": [
    {
      "button": {
        "name": "Male"
      },
      "error": "Button with name 'Male' already exists in this set"
    }
  ]
}
```

---

### 2. Bulk Update Buttons

**Endpoint:** `PUT /api/radio-buttons/button-sets/:buttonSetId/buttons/bulk`  
**Access:** Admin/SuperAdmin only  
**Auth:** Bearer Token Required

**Request Body:**

```json
{
  "updates": [
    {
      "id": "60d5ec49f1b2c8b1f8e4c124",
      "name": "Male (Updated)",
      "isActive": true
    },
    {
      "id": "60d5ec49f1b2c8b1f8e4c125",
      "visibility": false
    }
  ]
}
```

**Success Response (200):**

```json
{
  "success": true,
  "updated": 2,
  "failed": 0,
  "data": {...},
  "errors": []
}
```

---

### 3. Bulk Delete Buttons

**Endpoint:** `DELETE /api/radio-buttons/button-sets/:buttonSetId/buttons/bulk`  
**Access:** Admin/SuperAdmin only  
**Auth:** Bearer Token Required

**Request Body:**

```json
{
  "ids": ["60d5ec49f1b2c8b1f8e4c124", "60d5ec49f1b2c8b1f8e4c125"]
}
```

**Success Response (200):**

```json
{
  "success": true,
  "deleted": 2,
  "failed": 0,
  "message": "2 buttons deleted successfully",
  "errors": []
}
```

---

## Radio Button Archive Operations

### 1. Get All Archived Button Sets

**Endpoint:** `GET /api/radio-buttons/archives/button-sets`  
**Access:** SuperAdmin only  
**Auth:** Bearer Token Required

**Query Parameters:**

- `deletedBy` (optional): Filter by user who deleted
- `limit` (optional, default: 20): Records per page
- `skip` (optional, default: 0): Skip records
- `sortBy` (optional, default: -deletedAt): Sort order

**Success Response (200):**

```json
{
  "success": true,
  "count": 2,
  "total": 15,
  "data": [
    {
      "_id": "60d5ec49f1b2c8b1f8e4c999",
      "originalId": "60d5ec49f1b2c8b1f8e4c123",
      "name": "Old Gender Set",
      "description": "Archived set",
      "buttons": [...],
      "deletionType": "set",
      "deletedBy": {
        "_id": "60d5ec49f1b2c8b1f8e4c001",
        "name": "Admin User",
        "email": "admin@walkout.com"
      },
      "deletedAt": "2024-12-29T12:00:00.000Z",
      "deletionReason": "Manual deletion",
      "parentSetId": null,
      "parentSetName": null,
      ...
    }
  ]
}
```

---

### 2. Get Archived Button Set by ID

**Endpoint:** `GET /api/radio-buttons/archives/button-sets/:id`  
**Access:** SuperAdmin only  
**Auth:** Bearer Token Required

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49f1b2c8b1f8e4c999",
    "originalId": "60d5ec49f1b2c8b1f8e4c123",
    "name": "Old Gender Set",
    "buttons": [...],
    "deletionType": "button",
    "parentSetId": "60d5ec49f1b2c8b1f8e4c123",
    "parentSetName": "Gender Options",
    ...
  }
}
```

---

### 3. Restore Button Set or Button

**Endpoint:** `POST /api/radio-buttons/archives/button-sets/:archiveId/restore`  
**Access:** SuperAdmin only  
**Auth:** Bearer Token Required

**Optional Request Body (for name conflicts):**

```json
{
  "newName": "Gender Options V2"
}
```

**Success Response - Full Set Restored (200):**

```json
{
  "success": true,
  "message": "Button set restored successfully",
  "data": {
    "_id": "60d5ec49f1b2c8b1f8e4c888",
    "name": "Gender Options",
    "buttons": [...],
    ...
  }
}
```

**Success Response - Individual Button Restored to Parent (200):**

```json
{
  "success": true,
  "message": "Button restored successfully to set 'Gender Options'",
  "data": {
    "_id": "60d5ec49f1b2c8b1f8e4c123",
    "name": "Gender Options",
    "buttons": [
      {
        "incrementalId": 3,
        "name": "Other",
        ...
      }
    ],
    ...
  }
}
```

**Success Response - Individual Button, Parent Deleted (200):**

```json
{
  "success": true,
  "message": "Parent set was deleted. Created new set 'Gender Options' with restored button.",
  "data": {...}
}
```

**Error Response - Name Conflict (400):**

```json
{
  "success": false,
  "message": "Button set with name 'Gender Options' already exists. Provide 'newName' to restore with a different name."
}
```

---

### 4. Permanently Delete Archived Set

**Endpoint:** `DELETE /api/radio-buttons/archives/button-sets/:archiveId/permanent`  
**Access:** SuperAdmin only  
**Auth:** Bearer Token Required

**Success Response (200):**

```json
{
  "success": true,
  "message": "Archived button set permanently deleted"
}
```

---

## Radio Button UsedIn Operations

### 1. Add UsedIn References

**Endpoint:** `PATCH /api/radio-buttons/button-sets/:id/used-in/add`  
**Access:** Admin/SuperAdmin only  
**Auth:** Bearer Token Required

**Request Body:**

```json
{
  "references": ["profile_screen", "registration_form", "dashboard_filter"]
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "3 reference(s) added successfully",
  "data": {
    "_id": "60d5ec49f1b2c8b1f8e4c123",
    "name": "Gender Options",
    "usedIn": [
      "profile_screen",
      "registration_form",
      "dashboard_filter"
    ],
    ...
  }
}
```

**Response - All Already Exist (200):**

```json
{
  "success": true,
  "message": "All references already exist in usedIn array",
  "data": {...}
}
```

---

### 2. Remove UsedIn References

**Endpoint:** `PATCH /api/radio-buttons/button-sets/:id/used-in/remove`  
**Access:** Admin/SuperAdmin only  
**Auth:** Bearer Token Required

**Request Body:**

```json
{
  "references": ["old_screen", "removed_module"]
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "2 reference(s) removed successfully",
  "data": {
    "_id": "60d5ec49f1b2c8b1f8e4c123",
    "name": "Gender Options",
    "usedIn": [
      "profile_screen"
    ],
    ...
  }
}
```

**Response - No Matches Found (200):**

```json
{
  "success": true,
  "message": "No matching references found to remove",
  "data": {...}
}
```

---

### 3. Replace UsedIn Array

**Endpoint:** `PUT /api/radio-buttons/button-sets/:id/used-in`  
**Access:** Admin/SuperAdmin only  
**Auth:** Bearer Token Required

**Request Body:**

```json
{
  "references": ["new_screen", "updated_module"]
}
```

**To Clear All References:**

```json
{
  "references": []
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "UsedIn references updated successfully",
  "data": {
    "_id": "60d5ec49f1b2c8b1f8e4c123",
    "name": "Gender Options",
    "usedIn": [
      "new_screen",
      "updated_module"
    ],
    ...
  }
}
```

---

# Dropdown Sets

## Dropdown CRUD Operations

### 1. Create Dropdown Set

**Endpoint:** `POST /api/dropdowns/dropdown-sets`  
**Access:** Admin/SuperAdmin only  
**Auth:** Bearer Token Required

**Request Body:**

```json
{
  "name": "Country List",
  "description": "List of countries",
  "isActive": true
}
```

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49f1b2c8b1f8e4d123",
    "name": "Country List",
    "description": "List of countries",
    "lastOptionId": 0,
    "options": [],
    "isActive": true,
    "usedIn": [],
    "createdBy": {
      "_id": "60d5ec49f1b2c8b1f8e4c001",
      "name": "Admin User",
      "email": "admin@walkout.com"
    },
    "updatedBy": null,
    "createdAt": "2024-12-29T10:00:00.000Z",
    "updatedAt": "2024-12-29T10:00:00.000Z"
  }
}
```

**Error Response (400):**

```json
{
  "success": false,
  "message": "Dropdown set with this name already exists"
}
```

---

### 2. Get All Dropdown Sets

**Endpoint:** `GET /api/dropdowns/dropdown-sets`  
**Access:** Public (No authentication required)  
**Auth:** None

**Query Parameters:**

- `isActive` (optional): Filter by active status
- `limit` (optional): Number of records to return
- `skip` (optional): Number of records to skip

**Success Response (200):**

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "60d5ec49f1b2c8b1f8e4d123",
      "name": "Country List",
      "description": "List of countries",
      "lastOptionId": 3,
      "options": [
        {
          "_id": "60d5ec49f1b2c8b1f8e4d124",
          "incrementalId": 1,
          "name": "United States",
          "visibility": true,
          "isActive": true,
          "createdAt": "2024-12-29T10:01:00.000Z",
          "updatedAt": "2024-12-29T10:01:00.000Z"
        },
        {
          "_id": "60d5ec49f1b2c8b1f8e4d125",
          "incrementalId": 2,
          "name": "Canada",
          "visibility": true,
          "isActive": true,
          "createdAt": "2024-12-29T10:02:00.000Z",
          "updatedAt": "2024-12-29T10:02:00.000Z"
        }
      ],
      "isActive": true,
      "usedIn": ["address_form", "shipping_page"],
      "createdBy": {...},
      "updatedBy": null,
      "createdAt": "2024-12-29T10:00:00.000Z",
      "updatedAt": "2024-12-29T10:02:00.000Z"
    }
  ]
}
```

---

### 3. Get Dropdown Set by ID

**Endpoint:** `GET /api/dropdowns/dropdown-sets/:id`  
**Access:** All authenticated users  
**Auth:** Bearer Token Required

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49f1b2c8b1f8e4d123",
    "name": "Country List",
    "options": [...],
    "usedIn": ["address_form"],
    ...
  }
}
```

---

### 4. Update Dropdown Set

**Endpoint:** `PUT /api/dropdowns/dropdown-sets/:id`  
**Access:** Admin/SuperAdmin only  
**Auth:** Bearer Token Required

**Request Body:**

```json
{
  "name": "Countries Dropdown",
  "description": "Updated description",
  "isActive": true
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49f1b2c8b1f8e4d123",
    "name": "Countries Dropdown",
    "description": "Updated description",
    ...
  }
}
```

---

### 5. Delete Dropdown Set (Archive)

**Endpoint:** `DELETE /api/dropdowns/dropdown-sets/:id`  
**Access:** Admin/SuperAdmin only  
**Auth:** Bearer Token Required

**Success Response (200):**

```json
{
  "success": true,
  "message": "Dropdown set archived and deleted successfully"
}
```

---

## Individual Option Operations

### 1. Create Option in Set

**Endpoint:** `POST /api/dropdowns/dropdown-sets/:dropdownSetId/options`  
**Access:** Admin/SuperAdmin only  
**Auth:** Bearer Token Required

**Request Body:**

```json
{
  "name": "Mexico",
  "visibility": true,
  "isActive": true
}
```

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49f1b2c8b1f8e4d123",
    "name": "Country List",
    "lastOptionId": 4,
    "options": [
      {
        "_id": "60d5ec49f1b2c8b1f8e4d126",
        "incrementalId": 4,
        "name": "Mexico",
        "visibility": true,
        "isActive": true,
        ...
      }
    ],
    ...
  }
}
```

---

### 2. Get All Options in Set

**Endpoint:** `GET /api/dropdowns/dropdown-sets/:dropdownSetId/options`  
**Access:** All authenticated users  
**Auth:** Bearer Token Required

**Query Parameters:**

- `isActive` (optional): Filter by active status
- `visibility` (optional): Filter by visibility

**Success Response (200):**

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "60d5ec49f1b2c8b1f8e4d124",
      "incrementalId": 1,
      "name": "United States",
      "visibility": true,
      "isActive": true,
      ...
    }
  ]
}
```

---

### 3. Get Option by ID

**Endpoint:** `GET /api/dropdowns/dropdown-sets/:dropdownSetId/options/:optionId`  
**Access:** All authenticated users  
**Auth:** Bearer Token Required

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49f1b2c8b1f8e4d124",
    "incrementalId": 1,
    "name": "United States",
    "visibility": true,
    "isActive": true,
    ...
  }
}
```

---

### 4. Update Option

**Endpoint:** `PUT /api/dropdowns/dropdown-sets/:dropdownSetId/options/:optionId`  
**Access:** Admin/SuperAdmin only  
**Auth:** Bearer Token Required

**Request Body:**

```json
{
  "name": "USA",
  "visibility": true,
  "isActive": true
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49f1b2c8b1f8e4d123",
    "name": "Country List",
    "options": [
      {
        "_id": "60d5ec49f1b2c8b1f8e4d124",
        "incrementalId": 1,
        "name": "USA",
        ...
      }
    ],
    ...
  }
}
```

---

### 5. Delete Option (Archive)

**Endpoint:** `DELETE /api/dropdowns/dropdown-sets/:dropdownSetId/options/:optionId`  
**Access:** Admin/SuperAdmin only  
**Auth:** Bearer Token Required

**Success Response (200):**

```json
{
  "success": true,
  "message": "Option archived and deleted successfully"
}
```

---

## Dropdown Bulk Operations

### 1. Bulk Create Options

**Endpoint:** `POST /api/dropdowns/dropdown-sets/:dropdownSetId/options/bulk`  
**Access:** Admin/SuperAdmin only  
**Auth:** Bearer Token Required

**Request Body:**

```json
{
  "options": [
    {
      "name": "Brazil",
      "visibility": true,
      "isActive": true
    },
    {
      "name": "Argentina",
      "visibility": true
    },
    {
      "name": "Chile"
    }
  ]
}
```

**Success Response (201):**

```json
{
  "success": true,
  "created": 3,
  "failed": 0,
  "data": {...},
  "errors": []
}
```

---

### 2. Bulk Update Options

**Endpoint:** `PUT /api/dropdowns/dropdown-sets/:dropdownSetId/options/bulk`  
**Access:** Admin/SuperAdmin only  
**Auth:** Bearer Token Required

**Request Body:**

```json
{
  "updates": [
    {
      "id": "60d5ec49f1b2c8b1f8e4d124",
      "name": "United States of America",
      "isActive": true
    },
    {
      "id": "60d5ec49f1b2c8b1f8e4d125",
      "visibility": false
    }
  ]
}
```

**Success Response (200):**

```json
{
  "success": true,
  "updated": 2,
  "failed": 0,
  "data": {...},
  "errors": []
}
```

---

### 3. Bulk Delete Options

**Endpoint:** `DELETE /api/dropdowns/dropdown-sets/:dropdownSetId/options/bulk`  
**Access:** Admin/SuperAdmin only  
**Auth:** Bearer Token Required

**Request Body:**

```json
{
  "ids": ["60d5ec49f1b2c8b1f8e4d124", "60d5ec49f1b2c8b1f8e4d125"]
}
```

**Success Response (200):**

```json
{
  "success": true,
  "deleted": 2,
  "failed": 0,
  "message": "2 options deleted successfully",
  "errors": []
}
```

---

## Dropdown Archive Operations

### 1. Get All Archived Dropdown Sets

**Endpoint:** `GET /api/dropdowns/archives/dropdown-sets`  
**Access:** SuperAdmin only  
**Auth:** Bearer Token Required

**Query Parameters:**

- `deletedBy` (optional): Filter by user
- `limit` (optional, default: 20)
- `skip` (optional, default: 0)
- `sortBy` (optional, default: -deletedAt)

**Success Response (200):**

```json
{
  "success": true,
  "count": 2,
  "total": 10,
  "data": [
    {
      "_id": "60d5ec49f1b2c8b1f8e4d999",
      "originalId": "60d5ec49f1b2c8b1f8e4d123",
      "name": "Old Country List",
      "options": [...],
      "deletionType": "set",
      "deletedBy": {...},
      "deletedAt": "2024-12-29T12:00:00.000Z",
      ...
    }
  ]
}
```

---

### 2. Get Archived Dropdown Set by ID

**Endpoint:** `GET /api/dropdowns/archives/dropdown-sets/:id`  
**Access:** SuperAdmin only  
**Auth:** Bearer Token Required

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "_id": "60d5ec49f1b2c8b1f8e4d999",
    "originalId": "60d5ec49f1b2c8b1f8e4d123",
    "name": "Old Country List",
    "options": [...],
    "deletionType": "option",
    "parentSetId": "60d5ec49f1b2c8b1f8e4d123",
    "parentSetName": "Country List",
    ...
  }
}
```

---

### 3. Restore Dropdown Set or Option

**Endpoint:** `POST /api/dropdowns/archives/dropdown-sets/:archiveId/restore`  
**Access:** SuperAdmin only  
**Auth:** Bearer Token Required

**Optional Request Body:**

```json
{
  "newName": "Country List V2"
}
```

**Success Responses:** Same pattern as Radio Button restore

---

### 4. Permanently Delete Archived Set

**Endpoint:** `DELETE /api/dropdowns/archives/dropdown-sets/:archiveId/permanent`  
**Access:** SuperAdmin only  
**Auth:** Bearer Token Required

**Success Response (200):**

```json
{
  "success": true,
  "message": "Archived dropdown set permanently deleted"
}
```

---

## Dropdown UsedIn Operations

### 1. Add UsedIn References

**Endpoint:** `PATCH /api/dropdowns/dropdown-sets/:id/used-in/add`  
**Access:** Admin/SuperAdmin only  
**Auth:** Bearer Token Required

**Request Body:**

```json
{
  "references": ["address_form", "shipping_page", "settings_module"]
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "3 reference(s) added successfully",
  "data": {
    "_id": "60d5ec49f1b2c8b1f8e4d123",
    "name": "Country List",
    "usedIn": [
      "address_form",
      "shipping_page",
      "settings_module"
    ],
    ...
  }
}
```

---

### 2. Remove UsedIn References

**Endpoint:** `PATCH /api/dropdowns/dropdown-sets/:id/used-in/remove`  
**Access:** Admin/SuperAdmin only  
**Auth:** Bearer Token Required

**Request Body:**

```json
{
  "references": ["old_screen", "removed_page"]
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "2 reference(s) removed successfully",
  "data": {
    "_id": "60d5ec49f1b2c8b1f8e4d123",
    "name": "Country List",
    "usedIn": [
      "address_form"
    ],
    ...
  }
}
```

---

### 3. Replace UsedIn Array

**Endpoint:** `PUT /api/dropdowns/dropdown-sets/:id/used-in`  
**Access:** Admin/SuperAdmin only  
**Auth:** Bearer Token Required

**Request Body:**

```json
{
  "references": ["new_form", "updated_page"]
}
```

**Success Response (200):**

```json
{
  "success": true,
  "message": "UsedIn references updated successfully",
  "data": {
    "_id": "60d5ec49f1b2c8b1f8e4d123",
    "name": "Country List",
    "usedIn": [
      "new_form",
      "updated_page"
    ],
    ...
  }
}
```

---

## Common Error Responses

### Authentication Error (401)

```json
{
  "success": false,
  "message": "Not authorized to access this route"
}
```

### Authorization Error (403)

```json
{
  "success": false,
  "message": "User role 'user' is not authorized to access this route"
}
```

### Validation Error (400)

```json
{
  "success": false,
  "message": "Button set name is required"
}
```

### Not Found Error (404)

```json
{
  "success": false,
  "message": "Button set not found"
}
```

### Server Error (500)

```json
{
  "success": false,
  "message": "Error creating button set",
  "error": "Detailed error message"
}
```

---

## API Summary Tables

### Radio Button Sets APIs

| Endpoint                                                | Method | Access           | Description                 |
| ------------------------------------------------------- | ------ | ---------------- | --------------------------- |
| `/api/radio-buttons/button-sets`                        | POST   | Admin/SuperAdmin | Create button set           |
| `/api/radio-buttons/button-sets`                        | GET    | Public           | Get all button sets         |
| `/api/radio-buttons/button-sets/:id`                    | GET    | Authenticated    | Get button set by ID        |
| `/api/radio-buttons/button-sets/:id`                    | PUT    | Admin/SuperAdmin | Update button set           |
| `/api/radio-buttons/button-sets/:id`                    | DELETE | Admin/SuperAdmin | Delete (archive) button set |
| `/api/radio-buttons/button-sets/:setId/buttons`         | POST   | Admin/SuperAdmin | Create button               |
| `/api/radio-buttons/button-sets/:setId/buttons`         | GET    | Authenticated    | Get all buttons             |
| `/api/radio-buttons/button-sets/:setId/buttons/:id`     | GET    | Authenticated    | Get button by ID            |
| `/api/radio-buttons/button-sets/:setId/buttons/:id`     | PUT    | Admin/SuperAdmin | Update button               |
| `/api/radio-buttons/button-sets/:setId/buttons/:id`     | DELETE | Admin/SuperAdmin | Delete button               |
| `/api/radio-buttons/button-sets/:setId/buttons/bulk`    | POST   | Admin/SuperAdmin | Bulk create buttons         |
| `/api/radio-buttons/button-sets/:setId/buttons/bulk`    | PUT    | Admin/SuperAdmin | Bulk update buttons         |
| `/api/radio-buttons/button-sets/:setId/buttons/bulk`    | DELETE | Admin/SuperAdmin | Bulk delete buttons         |
| `/api/radio-buttons/archives/button-sets`               | GET    | SuperAdmin       | Get all archives            |
| `/api/radio-buttons/archives/button-sets/:id`           | GET    | SuperAdmin       | Get archive by ID           |
| `/api/radio-buttons/archives/button-sets/:id/restore`   | POST   | SuperAdmin       | Restore from archive        |
| `/api/radio-buttons/archives/button-sets/:id/permanent` | DELETE | SuperAdmin       | Permanent delete            |
| `/api/radio-buttons/button-sets/:id/used-in/add`        | PATCH  | Admin/SuperAdmin | Add usedIn references       |
| `/api/radio-buttons/button-sets/:id/used-in/remove`     | PATCH  | Admin/SuperAdmin | Remove usedIn references    |
| `/api/radio-buttons/button-sets/:id/used-in`            | PUT    | Admin/SuperAdmin | Replace usedIn array        |

### Dropdown Sets APIs

| Endpoint                                              | Method | Access           | Description                   |
| ----------------------------------------------------- | ------ | ---------------- | ----------------------------- |
| `/api/dropdowns/dropdown-sets`                        | POST   | Admin/SuperAdmin | Create dropdown set           |
| `/api/dropdowns/dropdown-sets`                        | GET    | Public           | Get all dropdown sets         |
| `/api/dropdowns/dropdown-sets/:id`                    | GET    | Authenticated    | Get dropdown set by ID        |
| `/api/dropdowns/dropdown-sets/:id`                    | PUT    | Admin/SuperAdmin | Update dropdown set           |
| `/api/dropdowns/dropdown-sets/:id`                    | DELETE | Admin/SuperAdmin | Delete (archive) dropdown set |
| `/api/dropdowns/dropdown-sets/:setId/options`         | POST   | Admin/SuperAdmin | Create option                 |
| `/api/dropdowns/dropdown-sets/:setId/options`         | GET    | Authenticated    | Get all options               |
| `/api/dropdowns/dropdown-sets/:setId/options/:id`     | GET    | Authenticated    | Get option by ID              |
| `/api/dropdowns/dropdown-sets/:setId/options/:id`     | PUT    | Admin/SuperAdmin | Update option                 |
| `/api/dropdowns/dropdown-sets/:setId/options/:id`     | DELETE | Admin/SuperAdmin | Delete option                 |
| `/api/dropdowns/dropdown-sets/:setId/options/bulk`    | POST   | Admin/SuperAdmin | Bulk create options           |
| `/api/dropdowns/dropdown-sets/:setId/options/bulk`    | PUT    | Admin/SuperAdmin | Bulk update options           |
| `/api/dropdowns/dropdown-sets/:setId/options/bulk`    | DELETE | Admin/SuperAdmin | Bulk delete options           |
| `/api/dropdowns/archives/dropdown-sets`               | GET    | SuperAdmin       | Get all archives              |
| `/api/dropdowns/archives/dropdown-sets/:id`           | GET    | SuperAdmin       | Get archive by ID             |
| `/api/dropdowns/archives/dropdown-sets/:id/restore`   | POST   | SuperAdmin       | Restore from archive          |
| `/api/dropdowns/archives/dropdown-sets/:id/permanent` | DELETE | SuperAdmin       | Permanent delete              |
| `/api/dropdowns/dropdown-sets/:id/used-in/add`        | PATCH  | Admin/SuperAdmin | Add usedIn references         |
| `/api/dropdowns/dropdown-sets/:id/used-in/remove`     | PATCH  | Admin/SuperAdmin | Remove usedIn references      |
| `/api/dropdowns/dropdown-sets/:id/used-in`            | PUT    | Admin/SuperAdmin | Replace usedIn array          |

---

## Notes

1. **Authentication**: Bearer token must be included in Authorization header for protected routes
2. **Incremental IDs**: Each button/option within a set has a unique incremental ID (1, 2, 3...)
3. **Soft Delete**: Delete operations archive data instead of permanent deletion
4. **Smart Restore**: Individual buttons/options restore to original parent set if it exists
5. **UsedIn Tracking**: Optional array field to track where sets are being used in your application
6. **Public Endpoints**: GET all button sets and dropdown sets are public (no auth required)
7. **Pagination**: Use `limit` and `skip` query parameters for pagination
8. **Filtering**: Use `isActive` and `visibility` query parameters to filter results
