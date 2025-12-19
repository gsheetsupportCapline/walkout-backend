# Dropdown Sets System - Complete Documentation

## Table of Contents

1. [Overview](#overview)
2. [Architecture](#architecture)
3. [Database Schema](#database-schema)
4. [API Endpoints](#api-endpoints)
5. [Use Cases and Examples](#use-cases-and-examples)
6. [Frontend Integration](#frontend-integration)
7. [Database Maintenance](#database-maintenance)
8. [Security and Permissions](#security-and-permissions)
9. [Best Practices](#best-practices)

---

## Overview

The Dropdown Sets system provides a flexible, reusable infrastructure for managing dropdown menus across the application. It implements a many-to-many relationship architecture where dropdown options are independent entities that can be associated with multiple dropdown sets.

### Key Features

- **Independent Dropdown Options**: Each option is a standalone entity with globally unique names
- **Reusable Architecture**: Options can be included in multiple dropdown sets simultaneously
- **Role-Based Access Control**: Admin and SuperAdmin for mutations, all authenticated users for queries
- **Bulk Operations**: Efficient batch creation, updates, and deletions
- **Visibility Control**: Options can be hidden without deletion
- **Association Management**: Add/remove options from sets dynamically
- **Automatic Cleanup**: Deleting an option automatically removes it from all dropdown sets

### Design Philosophy

The system separates the **content** (dropdown options) from the **organization** (dropdown sets), enabling:

- Option reusability across different contexts
- Flexible categorization without data duplication
- Easier maintenance and updates
- Efficient data structure for frequently used options

---

## Architecture

### Entity Relationship

```
┌─────────────────────┐         ┌──────────────────────┐
│  DropdownOption     │         │   DropdownSet        │
├─────────────────────┤         ├──────────────────────┤
│ _id                 │◄────────│ options: [ObjectId]  │
│ name (unique)       │  Many   │ name (unique)        │
│ visibility          │    to   │ description          │
│ isActive            │  Many   │ isActive             │
│ createdBy           │         │ createdBy            │
│ updatedBy           │         │ updatedBy            │
└─────────────────────┘         └──────────────────────┘
```

### Key Architectural Decisions

1. **No Foreign Key in DropdownOption**:
   - Options are globally available, not bound to any specific set
   - Allows maximum flexibility for option reuse
2. **Array of IDs in DropdownSet**:
   - DropdownSet maintains an array of DropdownOption IDs
   - Enables dynamic association/disassociation
3. **Automatic Cleanup**:

   - Deleting an option triggers removal from all dropdown sets
   - Maintains data integrity without manual intervention

4. **Visibility vs. Deletion**:
   - `visibility` flag for soft hiding (option remains in database)
   - `isActive` flag for status management
   - Actual deletion removes the option completely

---

## Database Schema

### DropdownOption Model

**Collection**: `dropdown-options`

```javascript
{
  _id: ObjectId,
  name: {
    type: String,
    required: true,
    unique: true,  // Globally unique across all dropdown options
    trim: true
  },
  visibility: {
    type: Boolean,
    default: true  // true = visible, false = hidden
  },
  isActive: {
    type: Boolean,
    default: true  // Status flag for option availability
  },
  createdBy: {
    type: ObjectId,
    ref: "User",
    required: true
  },
  updatedBy: {
    type: ObjectId,
    ref: "User"
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:

- `name`: 1 (unique index for fast lookups and constraint enforcement)
- `isActive`: 1 (filter active/inactive options)
- `visibility`: 1 (filter visible/hidden options)

**Example Document**:

```json
{
  "_id": "6578abc123def456789012",
  "name": "Primary Care",
  "visibility": true,
  "isActive": true,
  "createdBy": "6578abc123def456789001",
  "updatedBy": "6578abc123def456789001",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z"
}
```

---

### DropdownSet Model

**Collection**: `dropdown-sets`

```javascript
{
  _id: ObjectId,
  name: {
    type: String,
    required: true,
    unique: true,  // Globally unique set names
    trim: true
  },
  description: {
    type: String,
    default: ""
  },
  options: [{
    type: ObjectId,
    ref: "DropdownOption"  // Array of dropdown option references
  }],
  isActive: {
    type: Boolean,
    default: true
  },
  createdBy: {
    type: ObjectId,
    ref: "User",
    required: true
  },
  updatedBy: {
    type: ObjectId,
    ref: "User"
  },
  createdAt: Date,
  updatedAt: Date
}
```

**Indexes**:

- `name`: 1 (unique index)
- `isActive`: 1 (filter active/inactive sets)

**Example Document**:

```json
{
  "_id": "6578def123abc456789012",
  "name": "Department Dropdown",
  "description": "List of hospital departments",
  "options": [
    "6578abc123def456789012",
    "6578abc123def456789013",
    "6578abc123def456789014"
  ],
  "isActive": true,
  "createdBy": "6578abc123def456789001",
  "updatedBy": "6578abc123def456789001",
  "createdAt": "2024-01-15T11:00:00.000Z",
  "updatedAt": "2024-01-15T14:30:00.000Z"
}
```

---

## API Endpoints

### Base URL

All dropdown endpoints are prefixed with: `/api/dropdowns`

### Authentication

All endpoints require JWT authentication via the `Authorization: Bearer <token>` header.

### Permission Levels

- **All Authenticated Users**: GET requests (read-only)
- **Admin & SuperAdmin**: POST, PUT, DELETE requests (mutations)

---

## 1. Dropdown Set Endpoints

### 1.1 Create Dropdown Set

**Endpoint**: `POST /api/dropdowns/dropdown-sets`

**Access**: Admin, SuperAdmin

**Description**: Creates a new dropdown set with an empty options array.

**Request Body**:

```json
{
  "name": "Department Dropdown",
  "description": "List of hospital departments",
  "isActive": true
}
```

**Response** (201):

```json
{
  "success": true,
  "data": {
    "_id": "6578def123abc456789012",
    "name": "Department Dropdown",
    "description": "List of hospital departments",
    "options": [],
    "isActive": true,
    "createdBy": {
      "_id": "6578abc123def456789001",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T11:00:00.000Z"
  }
}
```

**Error Responses**:

- `400`: Missing required field (name)
- `400`: Duplicate set name (code: 11000)
- `401`: Unauthorized (no token)
- `403`: Forbidden (insufficient permissions)

---

### 1.2 Get All Dropdown Sets

**Endpoint**: `GET /api/dropdowns/dropdown-sets`

**Access**: All authenticated users

**Description**: Retrieves all dropdown sets with pagination and filtering.

**Query Parameters**:

- `isActive` (optional): Filter by active status (true/false)
- `limit` (optional): Number of results per page (default: 10)
- `skip` (optional): Number of results to skip (default: 0)

**Example Request**:

```
GET /api/dropdowns/dropdown-sets?isActive=true&limit=20&skip=0
```

**Response** (200):

```json
{
  "success": true,
  "count": 2,
  "data": [
    {
      "_id": "6578def123abc456789012",
      "name": "Department Dropdown",
      "description": "List of hospital departments",
      "options": ["6578abc123def456789012", "6578abc123def456789013"],
      "isActive": true,
      "createdBy": {
        "_id": "6578abc123def456789001",
        "name": "Admin User"
      },
      "updatedBy": {
        "_id": "6578abc123def456789001",
        "name": "Admin User"
      },
      "createdAt": "2024-01-15T11:00:00.000Z",
      "updatedAt": "2024-01-15T14:30:00.000Z"
    },
    {
      "_id": "6578def123abc456789013",
      "name": "Specialty Dropdown",
      "description": "Medical specialties",
      "options": ["6578abc123def456789015", "6578abc123def456789016"],
      "isActive": true,
      "createdBy": {
        "_id": "6578abc123def456789001",
        "name": "Admin User"
      },
      "createdAt": "2024-01-15T12:00:00.000Z",
      "updatedAt": "2024-01-15T12:00:00.000Z"
    }
  ]
}
```

---

### 1.3 Get Dropdown Set by ID

**Endpoint**: `GET /api/dropdowns/dropdown-sets/:id`

**Access**: All authenticated users

**Description**: Retrieves a single dropdown set with fully populated option details.

**Example Request**:

```
GET /api/dropdowns/dropdown-sets/6578def123abc456789012
```

**Response** (200):

```json
{
  "success": true,
  "data": {
    "_id": "6578def123abc456789012",
    "name": "Department Dropdown",
    "description": "List of hospital departments",
    "options": [
      {
        "_id": "6578abc123def456789012",
        "name": "Primary Care",
        "visibility": true,
        "isActive": true
      },
      {
        "_id": "6578abc123def456789013",
        "name": "Emergency Medicine",
        "visibility": true,
        "isActive": true
      }
    ],
    "isActive": true,
    "createdBy": {
      "_id": "6578abc123def456789001",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "updatedBy": {
      "_id": "6578abc123def456789001",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T14:30:00.000Z"
  }
}
```

**Error Responses**:

- `404`: Dropdown set not found

---

### 1.4 Update Dropdown Set

**Endpoint**: `PUT /api/dropdowns/dropdown-sets/:id`

**Access**: Admin, SuperAdmin

**Description**: Updates dropdown set properties (name, description, isActive). Does not modify options array - use add/remove endpoints for that.

**Request Body** (all fields optional):

```json
{
  "name": "Updated Department Dropdown",
  "description": "Updated description",
  "isActive": false
}
```

**Response** (200):

```json
{
  "success": true,
  "data": {
    "_id": "6578def123abc456789012",
    "name": "Updated Department Dropdown",
    "description": "Updated description",
    "options": ["6578abc123def456789012", "6578abc123def456789013"],
    "isActive": false,
    "createdBy": {
      "_id": "6578abc123def456789001",
      "name": "Admin User"
    },
    "updatedBy": {
      "_id": "6578abc123def456789002",
      "name": "SuperAdmin User"
    },
    "createdAt": "2024-01-15T11:00:00.000Z",
    "updatedAt": "2024-01-15T15:45:00.000Z"
  }
}
```

**Error Responses**:

- `404`: Dropdown set not found
- `400`: Duplicate name (if updating to existing name)

---

### 1.5 Delete Dropdown Set

**Endpoint**: `DELETE /api/dropdowns/dropdown-sets/:id`

**Access**: Admin, SuperAdmin

**Description**: Permanently deletes a dropdown set. Options are NOT deleted and remain available for other sets.

**Example Request**:

```
DELETE /api/dropdowns/dropdown-sets/6578def123abc456789012
```

**Response** (200):

```json
{
  "success": true,
  "message": "Dropdown set deleted successfully"
}
```

**Error Responses**:

- `404`: Dropdown set not found

---

### 1.6 Add Options to Dropdown Set

**Endpoint**: `POST /api/dropdowns/dropdown-sets/:id/options`

**Access**: Admin, SuperAdmin

**Description**: Associates one or more dropdown options with a dropdown set. Validates option existence and prevents duplicates.

**Request Body**:

```json
{
  "optionIds": [
    "6578abc123def456789012",
    "6578abc123def456789013",
    "6578abc123def456789014"
  ]
}
```

**Response** (200):

```json
{
  "success": true,
  "data": {
    "_id": "6578def123abc456789012",
    "name": "Department Dropdown",
    "description": "List of hospital departments",
    "options": [
      {
        "_id": "6578abc123def456789012",
        "name": "Primary Care",
        "visibility": true,
        "isActive": true
      },
      {
        "_id": "6578abc123def456789013",
        "name": "Emergency Medicine",
        "visibility": true,
        "isActive": true
      },
      {
        "_id": "6578abc123def456789014",
        "name": "Cardiology",
        "visibility": true,
        "isActive": true
      }
    ],
    "isActive": true,
    "updatedBy": {
      "_id": "6578abc123def456789001",
      "name": "Admin User"
    },
    "updatedAt": "2024-01-15T16:00:00.000Z"
  }
}
```

**Behavior**:

- Validates all option IDs exist before adding any
- Skips option IDs already in the set (no duplicates)
- Only adds new, valid option IDs
- Returns fully populated result

**Error Responses**:

- `400`: Missing or empty optionIds array
- `400`: Invalid option IDs (some don't exist)
- `404`: Dropdown set not found

---

### 1.7 Remove Options from Dropdown Set

**Endpoint**: `DELETE /api/dropdowns/dropdown-sets/:id/options`

**Access**: Admin, SuperAdmin

**Description**: Removes specified dropdown options from a dropdown set. Does NOT delete the options themselves.

**Request Body**:

```json
{
  "optionIds": ["6578abc123def456789014"]
}
```

**Response** (200):

```json
{
  "success": true,
  "data": {
    "_id": "6578def123abc456789012",
    "name": "Department Dropdown",
    "description": "List of hospital departments",
    "options": [
      {
        "_id": "6578abc123def456789012",
        "name": "Primary Care",
        "visibility": true,
        "isActive": true
      },
      {
        "_id": "6578abc123def456789013",
        "name": "Emergency Medicine",
        "visibility": true,
        "isActive": true
      }
    ],
    "isActive": true,
    "updatedBy": {
      "_id": "6578abc123def456789001",
      "name": "Admin User"
    },
    "updatedAt": "2024-01-15T16:15:00.000Z"
  }
}
```

**Error Responses**:

- `400`: Missing or empty optionIds array
- `404`: Dropdown set not found

---

## 2. Dropdown Option Endpoints

### 2.1 Create Dropdown Option

**Endpoint**: `POST /api/dropdowns`

**Access**: Admin, SuperAdmin

**Description**: Creates a new standalone dropdown option with a globally unique name.

**Request Body**:

```json
{
  "name": "Primary Care",
  "visibility": true,
  "isActive": true
}
```

**Response** (201):

```json
{
  "success": true,
  "data": {
    "_id": "6578abc123def456789012",
    "name": "Primary Care",
    "visibility": true,
    "isActive": true,
    "createdBy": {
      "_id": "6578abc123def456789001",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses**:

- `400`: Missing required field (name)
- `400`: Duplicate option name (code: 11000)

---

### 2.2 Get All Dropdown Options

**Endpoint**: `GET /api/dropdowns`

**Access**: All authenticated users

**Description**: Retrieves all dropdown options with filtering and pagination.

**Query Parameters**:

- `isActive` (optional): Filter by active status (true/false)
- `visibility` (optional): Filter by visibility (true/false)
- `limit` (optional): Number of results per page (default: 50)
- `skip` (optional): Number of results to skip (default: 0)

**Example Request**:

```
GET /api/dropdowns?isActive=true&visibility=true&limit=100
```

**Response** (200):

```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "_id": "6578abc123def456789012",
      "name": "Primary Care",
      "visibility": true,
      "isActive": true,
      "createdBy": {
        "_id": "6578abc123def456789001",
        "name": "Admin User"
      },
      "updatedBy": {
        "_id": "6578abc123def456789001",
        "name": "Admin User"
      },
      "createdAt": "2024-01-15T10:30:00.000Z",
      "updatedAt": "2024-01-15T10:30:00.000Z"
    },
    {
      "_id": "6578abc123def456789013",
      "name": "Emergency Medicine",
      "visibility": true,
      "isActive": true,
      "createdBy": {
        "_id": "6578abc123def456789001",
        "name": "Admin User"
      },
      "createdAt": "2024-01-15T10:35:00.000Z",
      "updatedAt": "2024-01-15T10:35:00.000Z"
    }
  ]
}
```

---

### 2.3 Get Dropdown Option by ID

**Endpoint**: `GET /api/dropdowns/:id`

**Access**: All authenticated users

**Description**: Retrieves a single dropdown option with full details.

**Example Request**:

```
GET /api/dropdowns/6578abc123def456789012
```

**Response** (200):

```json
{
  "success": true,
  "data": {
    "_id": "6578abc123def456789012",
    "name": "Primary Care",
    "visibility": true,
    "isActive": true,
    "createdBy": {
      "_id": "6578abc123def456789001",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "updatedBy": {
      "_id": "6578abc123def456789001",
      "name": "Admin User",
      "email": "admin@example.com"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T10:30:00.000Z"
  }
}
```

**Error Responses**:

- `404`: Dropdown option not found

---

### 2.4 Update Dropdown Option

**Endpoint**: `PUT /api/dropdowns/:id`

**Access**: Admin, SuperAdmin

**Description**: Updates dropdown option properties. Changes apply across all dropdown sets using this option.

**Request Body** (all fields optional):

```json
{
  "name": "Primary Care Department",
  "visibility": false,
  "isActive": true
}
```

**Response** (200):

```json
{
  "success": true,
  "data": {
    "_id": "6578abc123def456789012",
    "name": "Primary Care Department",
    "visibility": false,
    "isActive": true,
    "createdBy": {
      "_id": "6578abc123def456789001",
      "name": "Admin User"
    },
    "updatedBy": {
      "_id": "6578abc123def456789002",
      "name": "SuperAdmin User"
    },
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T16:45:00.000Z"
  }
}
```

**Error Responses**:

- `404`: Dropdown option not found
- `400`: Duplicate name (if updating to existing name)

---

### 2.5 Delete Dropdown Option

**Endpoint**: `DELETE /api/dropdowns/:id`

**Access**: Admin, SuperAdmin

**Description**: Permanently deletes a dropdown option and automatically removes it from all dropdown sets.

**Example Request**:

```
DELETE /api/dropdowns/6578abc123def456789012
```

**Response** (200):

```json
{
  "success": true,
  "message": "Dropdown option deleted successfully and removed from all dropdown sets"
}
```

**Automatic Cleanup Process**:

1. Finds all dropdown sets containing this option
2. Removes the option ID from all sets' options arrays
3. Deletes the dropdown option document
4. Returns success message

**Error Responses**:

- `404`: Dropdown option not found

---

## 3. Bulk Operations

### 3.1 Bulk Create Dropdown Options

**Endpoint**: `POST /api/dropdowns/bulk`

**Access**: Admin, SuperAdmin

**Description**: Creates multiple dropdown options in a single request. Supports partial success - returns both successful creations and errors.

**Request Body**:

```json
{
  "options": [
    {
      "name": "Cardiology",
      "visibility": true,
      "isActive": true
    },
    {
      "name": "Neurology",
      "visibility": true,
      "isActive": true
    },
    {
      "name": "Orthopedics",
      "visibility": true,
      "isActive": true
    }
  ]
}
```

**Response** (201):

```json
{
  "success": true,
  "created": 3,
  "failed": 0,
  "data": [
    {
      "_id": "6578abc123def456789015",
      "name": "Cardiology",
      "visibility": true,
      "isActive": true,
      "createdBy": {
        "_id": "6578abc123def456789001",
        "name": "Admin User"
      },
      "createdAt": "2024-01-15T17:00:00.000Z",
      "updatedAt": "2024-01-15T17:00:00.000Z"
    },
    {
      "_id": "6578abc123def456789016",
      "name": "Neurology",
      "visibility": true,
      "isActive": true,
      "createdBy": {
        "_id": "6578abc123def456789001",
        "name": "Admin User"
      },
      "createdAt": "2024-01-15T17:00:01.000Z",
      "updatedAt": "2024-01-15T17:00:01.000Z"
    },
    {
      "_id": "6578abc123def456789017",
      "name": "Orthopedics",
      "visibility": true,
      "isActive": true,
      "createdBy": {
        "_id": "6578abc123def456789001",
        "name": "Admin User"
      },
      "createdAt": "2024-01-15T17:00:02.000Z",
      "updatedAt": "2024-01-15T17:00:02.000Z"
    }
  ],
  "errors": []
}
```

**Partial Success Example**:
If one option has a duplicate name:

```json
{
  "success": true,
  "created": 2,
  "failed": 1,
  "data": [
    {
      "_id": "6578abc123def456789015",
      "name": "Cardiology",
      ...
    },
    {
      "_id": "6578abc123def456789017",
      "name": "Orthopedics",
      ...
    }
  ],
  "errors": [
    {
      "option": {
        "name": "Neurology",
        "visibility": true,
        "isActive": true
      },
      "error": "Duplicate option name: Neurology"
    }
  ]
}
```

**Error Responses**:

- `400`: Missing or empty options array
- `400`: Options is not an array

---

### 3.2 Bulk Update Dropdown Options

**Endpoint**: `PUT /api/dropdowns/bulk`

**Access**: Admin, SuperAdmin

**Description**: Updates multiple dropdown options in a single request. Each update requires the option ID.

**Request Body**:

```json
{
  "updates": [
    {
      "id": "6578abc123def456789015",
      "name": "Cardiology Department",
      "visibility": true
    },
    {
      "id": "6578abc123def456789016",
      "isActive": false
    },
    {
      "id": "6578abc123def456789017",
      "name": "Orthopedics & Sports Medicine",
      "visibility": false
    }
  ]
}
```

**Response** (200):

```json
{
  "success": true,
  "updated": 3,
  "failed": 0,
  "data": [
    {
      "_id": "6578abc123def456789015",
      "name": "Cardiology Department",
      "visibility": true,
      "isActive": true,
      "updatedBy": {
        "_id": "6578abc123def456789001",
        "name": "Admin User"
      },
      "updatedAt": "2024-01-15T17:30:00.000Z"
    },
    {
      "_id": "6578abc123def456789016",
      "name": "Neurology",
      "visibility": true,
      "isActive": false,
      "updatedBy": {
        "_id": "6578abc123def456789001",
        "name": "Admin User"
      },
      "updatedAt": "2024-01-15T17:30:01.000Z"
    },
    {
      "_id": "6578abc123def456789017",
      "name": "Orthopedics & Sports Medicine",
      "visibility": false,
      "isActive": true,
      "updatedBy": {
        "_id": "6578abc123def456789001",
        "name": "Admin User"
      },
      "updatedAt": "2024-01-15T17:30:02.000Z"
    }
  ],
  "errors": []
}
```

**Partial Success Example**:
If one option ID doesn't exist:

```json
{
  "success": true,
  "updated": 2,
  "failed": 1,
  "data": [
    {
      "_id": "6578abc123def456789015",
      "name": "Cardiology Department",
      ...
    },
    {
      "_id": "6578abc123def456789017",
      "name": "Orthopedics & Sports Medicine",
      ...
    }
  ],
  "errors": [
    {
      "id": "6578abc123def456789016",
      "error": "Dropdown option not found"
    }
  ]
}
```

**Error Responses**:

- `400`: Missing or empty updates array
- `400`: Updates is not an array
- `400`: Update object missing id field

---

### 3.3 Bulk Delete Dropdown Options

**Endpoint**: `DELETE /api/dropdowns/bulk`

**Access**: Admin, SuperAdmin

**Description**: Deletes multiple dropdown options in a single request. Automatically removes deleted options from all dropdown sets.

**Request Body**:

```json
{
  "ids": [
    "6578abc123def456789015",
    "6578abc123def456789016",
    "6578abc123def456789017"
  ]
}
```

**Response** (200):

```json
{
  "success": true,
  "deleted": 3,
  "failed": 0,
  "message": "3 dropdown options deleted successfully and removed from all dropdown sets",
  "errors": []
}
```

**Partial Success Example**:
If one option ID doesn't exist:

```json
{
  "success": true,
  "deleted": 2,
  "failed": 1,
  "message": "2 dropdown options deleted successfully and removed from all dropdown sets",
  "errors": [
    {
      "id": "6578abc123def456789016",
      "error": "Dropdown option not found"
    }
  ]
}
```

**Automatic Cleanup Process**:

1. For each valid option ID:
   - Removes the option from all dropdown sets' options arrays
   - Deletes the dropdown option document
2. Returns count of successful deletions and any errors

**Error Responses**:

- `400`: Missing or empty ids array
- `400`: ids is not an array

---

## Use Cases and Examples

### Use Case 1: Creating Department Dropdowns

**Scenario**: Admin wants to create a department dropdown for patient appointment forms.

**Step 1**: Create the dropdown options

```bash
POST /api/dropdowns/bulk
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "options": [
    {"name": "Primary Care", "visibility": true, "isActive": true},
    {"name": "Emergency Medicine", "visibility": true, "isActive": true},
    {"name": "Cardiology", "visibility": true, "isActive": true},
    {"name": "Neurology", "visibility": true, "isActive": true},
    {"name": "Orthopedics", "visibility": true, "isActive": true}
  ]
}
```

**Step 2**: Create the dropdown set

```bash
POST /api/dropdowns/dropdown-sets
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "name": "Patient Department Dropdown",
  "description": "Available departments for patient appointments",
  "isActive": true
}
```

**Step 3**: Associate options with the set

```bash
POST /api/dropdowns/dropdown-sets/<set_id>/options
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "optionIds": [
    "6578abc123def456789012",
    "6578abc123def456789013",
    "6578abc123def456789015",
    "6578abc123def456789016",
    "6578abc123def456789017"
  ]
}
```

---

### Use Case 2: Reusing Options Across Multiple Sets

**Scenario**: Same department options need to appear in both "Patient Appointment" and "Staff Assignment" dropdowns.

**Step 1**: Get all department options

```bash
GET /api/dropdowns?isActive=true
Authorization: Bearer <token>
```

**Step 2**: Create first dropdown set (Patient Appointments)

```bash
POST /api/dropdowns/dropdown-sets
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "name": "Patient Department Dropdown",
  "description": "Departments for patient appointments"
}
```

**Step 3**: Create second dropdown set (Staff Assignments)

```bash
POST /api/dropdowns/dropdown-sets
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "name": "Staff Department Dropdown",
  "description": "Departments for staff assignments"
}
```

**Step 4**: Add the same options to both sets

```bash
POST /api/dropdowns/dropdown-sets/<patient_set_id>/options
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "optionIds": ["6578abc123def456789012", "6578abc123def456789013", ...]
}

POST /api/dropdowns/dropdown-sets/<staff_set_id>/options
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "optionIds": ["6578abc123def456789012", "6578abc123def456789013", ...]
}
```

**Result**: Options are reused without duplication. Updating an option updates it in all dropdown sets.

---

### Use Case 3: Temporarily Hiding an Option

**Scenario**: "Emergency Medicine" department is temporarily closed for renovations. Don't want to delete the option as it will be reopened.

**Solution**: Update visibility flag

```bash
PUT /api/dropdowns/<option_id>
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "visibility": false
}
```

**Result**:

- Option remains in database and in all dropdown sets
- Frontend can filter options by `visibility: true` to hide it from users
- Easy to restore by setting `visibility: true`
- Historical data remains intact

---

### Use Case 4: Deactivating vs. Deleting Options

**Scenario**: Admin wants to phase out an old department name.

**Option A - Deactivate** (soft delete):

```bash
PUT /api/dropdowns/<option_id>
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "isActive": false
}
```

**Benefits**:

- Option stays in database
- Historical records intact
- Can be reactivated later
- Remains in dropdown sets

**Option B - Delete** (hard delete):

```bash
DELETE /api/dropdowns/<option_id>
Authorization: Bearer <admin_token>
```

**Benefits**:

- Completely removes option
- Automatic cleanup from all dropdown sets
- Cleaner database
- Use when option will never be used again

---

### Use Case 5: Adding New Options to Existing Set

**Scenario**: Hospital adds two new departments to existing dropdown.

**Step 1**: Create the new options

```bash
POST /api/dropdowns/bulk
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "options": [
    {"name": "Psychiatry", "visibility": true, "isActive": true},
    {"name": "Dermatology", "visibility": true, "isActive": true}
  ]
}
```

**Step 2**: Add to existing dropdown set

```bash
POST /api/dropdowns/dropdown-sets/<set_id>/options
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "optionIds": [
    "6578abc123def456789018",
    "6578abc123def456789019"
  ]
}
```

**Result**: New options immediately available in the dropdown.

---

### Use Case 6: Reorganizing Options Between Sets

**Scenario**: Admin wants to move "Pediatrics" from "General Departments" to "Specialized Departments" dropdown.

**Step 1**: Add to new set

```bash
POST /api/dropdowns/dropdown-sets/<specialized_set_id>/options
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "optionIds": ["6578abc123def456789020"]
}
```

**Step 2**: Remove from old set

```bash
DELETE /api/dropdowns/dropdown-sets/<general_set_id>/options
Content-Type: application/json
Authorization: Bearer <admin_token>

{
  "optionIds": ["6578abc123def456789020"]
}
```

**Result**: Option moved between sets without duplication or deletion.

---

## Frontend Integration

### React Example: Fetching and Displaying Dropdown

```javascript
import React, { useState, useEffect } from "react";
import axios from "axios";

const DepartmentDropdown = ({ dropdownSetId }) => {
  const [dropdownSet, setDropdownSet] = useState(null);
  const [selectedOption, setSelectedOption] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchDropdownSet = async () => {
      try {
        const token = localStorage.getItem("authToken");
        const response = await axios.get(
          `http://localhost:5000/api/dropdowns/dropdown-sets/${dropdownSetId}`,
          {
            headers: { Authorization: `Bearer ${token}` },
          }
        );

        setDropdownSet(response.data.data);
        setLoading(false);
      } catch (err) {
        setError(err.response?.data?.message || "Failed to load dropdown");
        setLoading(false);
      }
    };

    fetchDropdownSet();
  }, [dropdownSetId]);

  if (loading) return <div>Loading dropdown...</div>;
  if (error) return <div>Error: {error}</div>;
  if (!dropdownSet) return null;

  // Filter visible and active options
  const visibleOptions = dropdownSet.options.filter(
    (option) => option.visibility && option.isActive
  );

  return (
    <div className="dropdown-container">
      <label htmlFor="department-select">{dropdownSet.name}</label>

      <select
        id="department-select"
        value={selectedOption}
        onChange={(e) => setSelectedOption(e.target.value)}
        disabled={!dropdownSet.isActive}
      >
        <option value="">-- Select Department --</option>
        {visibleOptions.map((option) => (
          <option key={option._id} value={option._id}>
            {option.name}
          </option>
        ))}
      </select>

      {dropdownSet.description && (
        <small className="dropdown-description">
          {dropdownSet.description}
        </small>
      )}
    </div>
  );
};

export default DepartmentDropdown;
```

---

### React Example: Admin Panel for Managing Options

```javascript
import React, { useState, useEffect } from "react";
import axios from "axios";

const AdminDropdownManager = () => {
  const [dropdownSets, setDropdownSets] = useState([]);
  const [allOptions, setAllOptions] = useState([]);
  const [selectedSet, setSelectedSet] = useState(null);
  const [newOptionName, setNewOptionName] = useState("");
  const [loading, setLoading] = useState(false);

  const token = localStorage.getItem("authToken");
  const axiosConfig = {
    headers: { Authorization: `Bearer ${token}` },
  };

  // Fetch all dropdown sets
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [setsRes, optionsRes] = await Promise.all([
          axios.get(
            "http://localhost:5000/api/dropdowns/dropdown-sets",
            axiosConfig
          ),
          axios.get("http://localhost:5000/api/dropdowns", axiosConfig),
        ]);

        setDropdownSets(setsRes.data.data);
        setAllOptions(optionsRes.data.data);
      } catch (error) {
        console.error("Failed to fetch data:", error);
      }
    };

    fetchData();
  }, []);

  // Create new option
  const handleCreateOption = async () => {
    if (!newOptionName.trim()) return;

    setLoading(true);
    try {
      const response = await axios.post(
        "http://localhost:5000/api/dropdowns",
        {
          name: newOptionName,
          visibility: true,
          isActive: true,
        },
        axiosConfig
      );

      setAllOptions([...allOptions, response.data.data]);
      setNewOptionName("");
      alert("Option created successfully!");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to create option");
    }
    setLoading(false);
  };

  // Add option to selected dropdown set
  const handleAddOptionToSet = async (optionId) => {
    if (!selectedSet) return;

    setLoading(true);
    try {
      const response = await axios.post(
        `http://localhost:5000/api/dropdowns/dropdown-sets/${selectedSet._id}/options`,
        { optionIds: [optionId] },
        axiosConfig
      );

      setSelectedSet(response.data.data);
      alert("Option added to dropdown set!");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to add option");
    }
    setLoading(false);
  };

  // Remove option from selected dropdown set
  const handleRemoveOptionFromSet = async (optionId) => {
    if (!selectedSet) return;

    setLoading(true);
    try {
      const response = await axios.delete(
        `http://localhost:5000/api/dropdowns/dropdown-sets/${selectedSet._id}/options`,
        {
          ...axiosConfig,
          data: { optionIds: [optionId] },
        }
      );

      setSelectedSet(response.data.data);
      alert("Option removed from dropdown set!");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to remove option");
    }
    setLoading(false);
  };

  // Toggle option visibility
  const handleToggleVisibility = async (option) => {
    setLoading(true);
    try {
      const response = await axios.put(
        `http://localhost:5000/api/dropdowns/${option._id}`,
        { visibility: !option.visibility },
        axiosConfig
      );

      setAllOptions(
        allOptions.map((opt) =>
          opt._id === option._id ? response.data.data : opt
        )
      );
      alert("Option visibility updated!");
    } catch (error) {
      alert(error.response?.data?.message || "Failed to update visibility");
    }
    setLoading(false);
  };

  return (
    <div className="admin-dropdown-manager">
      <h2>Dropdown Manager</h2>

      {/* Create New Option */}
      <section className="create-option-section">
        <h3>Create New Option</h3>
        <input
          type="text"
          value={newOptionName}
          onChange={(e) => setNewOptionName(e.target.value)}
          placeholder="Enter option name"
          disabled={loading}
        />
        <button onClick={handleCreateOption} disabled={loading}>
          Create Option
        </button>
      </section>

      {/* Select Dropdown Set */}
      <section className="select-set-section">
        <h3>Select Dropdown Set</h3>
        <select
          value={selectedSet?._id || ""}
          onChange={(e) => {
            const set = dropdownSets.find((s) => s._id === e.target.value);
            setSelectedSet(set);
          }}
          disabled={loading}
        >
          <option value="">-- Select Dropdown Set --</option>
          {dropdownSets.map((set) => (
            <option key={set._id} value={set._id}>
              {set.name}
            </option>
          ))}
        </select>
      </section>

      {/* Manage Options in Selected Set */}
      {selectedSet && (
        <section className="manage-options-section">
          <h3>Options in "{selectedSet.name}"</h3>
          <ul>
            {selectedSet.options?.map((option) => (
              <li key={option._id}>
                {option.name}
                <button
                  onClick={() => handleRemoveOptionFromSet(option._id)}
                  disabled={loading}
                >
                  Remove
                </button>
              </li>
            ))}
          </ul>

          <h4>Available Options to Add</h4>
          <ul>
            {allOptions
              .filter(
                (opt) => !selectedSet.options?.find((o) => o._id === opt._id)
              )
              .map((option) => (
                <li key={option._id}>
                  {option.name}
                  <button
                    onClick={() => handleAddOptionToSet(option._id)}
                    disabled={loading}
                  >
                    Add to Set
                  </button>
                  <button
                    onClick={() => handleToggleVisibility(option)}
                    disabled={loading}
                  >
                    {option.visibility ? "Hide" : "Show"}
                  </button>
                </li>
              ))}
          </ul>
        </section>
      )}
    </div>
  );
};

export default AdminDropdownManager;
```

---

## Database Maintenance

### Checking Data Integrity

**Find Dropdown Sets with Invalid Option References**:

```javascript
// MongoDB Shell
db["dropdown-sets"].aggregate([
  {
    $lookup: {
      from: "dropdown-options",
      localField: "options",
      foreignField: "_id",
      as: "validOptions",
    },
  },
  {
    $project: {
      name: 1,
      totalOptions: { $size: "$options" },
      validOptions: { $size: "$validOptions" },
      invalidCount: {
        $subtract: [{ $size: "$options" }, { $size: "$validOptions" }],
      },
    },
  },
  {
    $match: {
      invalidCount: { $gt: 0 },
    },
  },
]);
```

**Find Orphaned Options (not in any dropdown set)**:

```javascript
// MongoDB Shell
db["dropdown-options"].aggregate([
  {
    $lookup: {
      from: "dropdown-sets",
      let: { optionId: "$_id" },
      pipeline: [
        {
          $match: {
            $expr: { $in: ["$$optionId", "$options"] },
          },
        },
      ],
      as: "usedInSets",
    },
  },
  {
    $match: {
      usedInSets: { $size: 0 },
    },
  },
  {
    $project: {
      name: 1,
      isActive: 1,
      createdAt: 1,
    },
  },
]);
```

---

### Cleanup Operations

**Remove Invalid Option References from All Dropdown Sets**:

```javascript
// MongoDB Shell
// First, get all valid option IDs
const validOptionIds = db["dropdown-options"].distinct("_id");

// Update all dropdown sets to remove invalid references
db["dropdown-sets"].updateMany(
  {},
  {
    $pull: {
      options: {
        $nin: validOptionIds,
      },
    },
  }
);
```

**Delete Inactive Options Older Than 1 Year**:

```javascript
// MongoDB Shell
const oneYearAgo = new Date();
oneYearAgo.setFullYear(oneYearAgo.getFullYear() - 1);

// Find options to delete
const optionsToDelete = db["dropdown-options"]
  .find({
    isActive: false,
    updatedAt: { $lt: oneYearAgo },
  })
  .toArray();

// Get their IDs
const idsToDelete = optionsToDelete.map((opt) => opt._id);

// Remove from all dropdown sets
db["dropdown-sets"].updateMany(
  {},
  {
    $pull: {
      options: { $in: idsToDelete },
    },
  }
);

// Delete the options
db["dropdown-options"].deleteMany({
  _id: { $in: idsToDelete },
});
```

---

### Backup and Restore

**Backup Dropdown Collections**:

```bash
# Backup dropdown-options collection
mongodump --db=walkout --collection=dropdown-options --out=./backup

# Backup dropdown-sets collection
mongodump --db=walkout --collection=dropdown-sets --out=./backup
```

**Restore Dropdown Collections**:

```bash
# Restore dropdown-options collection
mongorestore --db=walkout --collection=dropdown-options ./backup/walkout/dropdown-options.bson

# Restore dropdown-sets collection
mongorestore --db=walkout --collection=dropdown-sets ./backup/walkout/dropdown-sets.bson
```

---

## Security and Permissions

### Role-Based Access Control

**Permissions Matrix**:

| Action                  | User | Admin | SuperAdmin |
| ----------------------- | ---- | ----- | ---------- |
| View dropdown sets      | ✅   | ✅    | ✅         |
| View dropdown options   | ✅   | ✅    | ✅         |
| Create dropdown set     | ❌   | ✅    | ✅         |
| Create dropdown option  | ❌   | ✅    | ✅         |
| Update dropdown set     | ❌   | ✅    | ✅         |
| Update dropdown option  | ❌   | ✅    | ✅         |
| Delete dropdown set     | ❌   | ✅    | ✅         |
| Delete dropdown option  | ❌   | ✅    | ✅         |
| Add options to set      | ❌   | ✅    | ✅         |
| Remove options from set | ❌   | ✅    | ✅         |
| Bulk operations         | ❌   | ✅    | ✅         |

### Authentication Flow

1. **User Login**: Receive JWT token
2. **Token Storage**: Store in localStorage/sessionStorage
3. **Request Headers**: Include `Authorization: Bearer <token>` in all API requests
4. **Token Validation**: Server validates token and user role
5. **Permission Check**: Server verifies user has required role for action
6. **Response**: Success or 401/403 error

### Security Best Practices

1. **Always validate tokens** on the server side
2. **Never trust client-side role checks** - always verify on backend
3. **Use HTTPS** in production to encrypt token transmission
4. **Implement token expiration** and refresh mechanisms
5. **Log all mutation operations** (create, update, delete) for audit trails
6. **Sanitize input** to prevent injection attacks
7. **Rate limit** bulk operations to prevent abuse

---

## Best Practices

### Naming Conventions

**Dropdown Option Names**:

- Use clear, descriptive names
- Keep names concise (under 50 characters)
- Use title case for consistency
- Examples: "Primary Care", "Emergency Medicine", "Cardiology"

**Dropdown Set Names**:

- Include context: "Patient Department Dropdown", "Staff Role Dropdown"
- Avoid generic names like "Dropdown 1"
- Use descriptive identifiers

### Option Management

**When to Create New Options**:

- New department opens
- New service category added
- New classification needed

**When to Update Existing Options**:

- Department name changes
- Option needs to be hidden temporarily
- Correcting typos or improving clarity

**When to Delete Options**:

- Option will never be used again
- Duplicate option exists
- Data cleanup required

### Dropdown Set Organization

**Single-Purpose Sets**:

- Create separate dropdown sets for different contexts
- Example: "Patient Appointment Departments" vs "Staff Assignment Departments"
- Allows different option combinations per context

**Shared Option Pools**:

- Leverage many-to-many architecture
- Reuse common options across multiple sets
- Update once, reflect everywhere

### Performance Optimization

**Frontend Caching**:

```javascript
// Cache dropdown sets for 5 minutes
const CACHE_DURATION = 5 * 60 * 1000;
const cache = new Map();

const fetchDropdownSet = async (setId) => {
  const cached = cache.get(setId);
  if (cached && Date.now() - cached.timestamp < CACHE_DURATION) {
    return cached.data;
  }

  const response = await axios.get(`/api/dropdowns/dropdown-sets/${setId}`);
  cache.set(setId, {
    data: response.data.data,
    timestamp: Date.now(),
  });

  return response.data.data;
};
```

**Backend Pagination**:

- Always use `limit` and `skip` for large datasets
- Default limit: 10 for dropdown sets, 50 for dropdown options
- Adjust based on frontend requirements

**Database Indexing**:

- Indexes already set on `name`, `isActive`, `visibility`
- Ensure indexes are maintained
- Monitor query performance

---

## Troubleshooting

### Common Issues

**Issue**: Dropdown set shows option count but options don't populate

**Solution**: Check if options are populated in the response. Use the get-by-ID endpoint which automatically populates options:

```javascript
GET /api/dropdowns/dropdown-sets/:id
```

---

**Issue**: Creating option fails with "Duplicate name" error

**Solution**: Option names must be globally unique. Check existing options:

```javascript
GET /api/dropdowns?limit=1000
```

Search for the name in the results or update to use a unique name.

---

**Issue**: Deleted option still appears in dropdown set

**Solution**: This shouldn't happen due to automatic cleanup. If it does, manually remove:

```javascript
DELETE /api/dropdowns/dropdown-sets/:setId/options
{
  "optionIds": ["<option_id>"]
}
```

Then report the bug for investigation.

---

**Issue**: Can't add option to dropdown set - "Invalid option IDs" error

**Solution**: Verify the option exists:

```javascript
GET /api/dropdowns/:optionId
```

If it doesn't exist, create it first.

---

**Issue**: Bulk operation partially fails

**Solution**: Check the `errors` array in the response. Each error includes the problematic data and specific error message. Fix those items and retry.

---

## API Testing with Postman

### Environment Variables

Create these variables in your Postman environment:

- `base_url`: `http://localhost:5000`
- `token`: Your JWT authentication token
- `dropdown_set_id`: ID of a dropdown set (for testing)
- `dropdown_option_id`: ID of a dropdown option (for testing)

### Pre-request Script (for authenticated requests)

```javascript
pm.request.headers.add({
  key: "Authorization",
  value: "Bearer " + pm.environment.get("token"),
});
```

### Sample Test Scripts

**For successful creation (201)**:

```javascript
pm.test("Status code is 201", function () {
  pm.response.to.have.status(201);
});

pm.test("Response has success flag", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData.success).to.eql(true);
});

pm.test("Response has data object", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData.data).to.be.an("object");
});
```

**For successful retrieval (200)**:

```javascript
pm.test("Status code is 200", function () {
  pm.response.to.have.status(200);
});

pm.test("Response has data array", function () {
  var jsonData = pm.response.json();
  pm.expect(jsonData.data).to.be.an("array");
});
```

---

## Changelog

### Version 1.0.0 (Initial Release)

- DropdownOption model with globally unique names
- DropdownSet model with many-to-many relationship
- 15 API endpoints (7 set endpoints, 5 option endpoints, 3 bulk endpoints)
- Role-based access control (Admin/SuperAdmin for mutations)
- Automatic cleanup on option deletion
- Bulk operations with partial success handling
- Comprehensive documentation

---

## Support and Contact

For issues, questions, or feature requests:

- Backend Developer: [Your Contact]
- Technical Documentation: This file
- API Postman Collection: [Link to collection]

---

**Last Updated**: January 2024
**Version**: 1.0.0
**Maintained By**: Walkout Backend Team
