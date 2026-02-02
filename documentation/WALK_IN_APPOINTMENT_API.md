# Walk-in/Unscheduled Appointment API Documentation

## Overview

APIs for creating, updating, and deleting walk-in or unscheduled patient appointments. These appointments are manually created (mode: "manual") and stored in the same collection as ES-Query appointments.

---

## Collection Details

- **Collection Name**: `pt-appt`
- **Model**: PatientAppointment
- **Mode Field**:
  - `"manual"` - Walk-in appointments created via API
  - `"ES-Query"` - Appointments synced from cron job

---

## Endpoints

### 1. Create Walk-in Appointment

**Endpoint**: `POST /api/appointments/walk-in`

**Access**: Admin, SuperAdmin, User

**Description**: Creates a new walk-in/unscheduled patient appointment. Checks for duplicate appointments with same DOS and patient-id before creation.

**Headers**:

```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**Request Body**:

```json
{
  "patient-id": "1245",
  "patient-name": "John Doe",
  "dos": "2025-12-02",
  "office-name": "Downtown Dental"
}
```

**Optional Fields**:

```json
{
  "chair-name": "Chair 1",
  "insurance-name": "Blue Cross",
  "insurance-type": "PPO"
}
```

**Field Validations**:

- Required fields: `patient-id`, `patient-name`, `dos`, `office-name`
- Optional fields: `chair-name`, `insurance-name`, `insurance-type`
- `dos`: String in format "YYYY-MM-DD"
- `patient-id`: String (e.g., "1245")
- Duplicate check: Same `dos` + `patient-id` combination cannot exist

**Success Response** (201):

```json
{
  "success": true,
  "message": "Walk-in appointment created successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "patient-id": "1245",
    "patient-name": "John Doe",
    "dos": "2025-12-02",
    "chair-name": "Chair 1",
    "insurance-name": "Blue Cross",
    "insurance-type": "PPO",
    "office-name": "Downtown Dental",
    "updated-on": "2025-01-30T10:30:00.000Z",
    "mode": "manual",
    "createdOn": "2025-01-30T10:30:00.000Z",
    "createdBy": "507f191e810c19729de860ea"
  }
}
```

**Error Response - Duplicate** (409):

```json
{
  "success": false,
  "message": "Appointment already exists for this patient on this date",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "patient-id": "1245",
    "dos": "2025-12-02",
    ...
  }
}
```

**Error Response - Missing Fields** (400):

```json
{
  "success": false,
  "message": "All fields are required"
}
```

---

### 2. Update Walk-in Appointment

**Endpoint**: `PUT /api/appointments/walk-in/:id`

**Access**: SuperAdmin only

**Description**: Updates an existing walk-in appointment. Only manually created appointments (mode: "manual") can be updated. Checks for duplicates if DOS or patient-id is changed.

**Headers**:

```json
{
  "Authorization": "Bearer <token>",
  "Content-Type": "application/json"
}
```

**URL Parameters**:

- `id`: MongoDB ObjectId of the appointment

**Request Body** (all fields optional):

```json
{
  "patient-id": "1246",
  "patient-name": "John Doe Updated",
  "dos": "2025-12-03",
  "chair-name": "Chair 2",
  "insurance-name": "Aetna",
  "insurance-type": "HMO",
  "office-name": "Uptown Dental"
}
```

**Success Response** (200):

```json
{
  "success": true,
  "message": "Walk-in appointment updated successfully",
  "data": {
    "_id": "507f1f77bcf86cd799439011",
    "patient-id": "1246",
    "patient-name": "John Doe Updated",
    "dos": "2025-12-03",
    "chair-name": "Chair 2",
    "insurance-name": "Aetna",
    "insurance-type": "HMO",
    "office-name": "Uptown Dental",
    "updated-on": "2025-01-30T11:45:00.000Z",
    "mode": "manual",
    "createdOn": "2025-01-30T10:30:00.000Z",
    "createdBy": "507f191e810c19729de860ea"
  }
}
```

**Error Response - Not Found** (404):

```json
{
  "success": false,
  "message": "Appointment not found"
}
```

**Error Response - Not Manual Appointment** (400):

```json
{
  "success": false,
  "message": "Only manually created appointments can be updated"
}
```

**Error Response - Duplicate** (409):

```json
{
  "success": false,
  "message": "Another appointment already exists for this patient on this date"
}
```

---

### 3. Delete Walk-in Appointment

**Endpoint**: `DELETE /api/appointments/walk-in/:id`

**Access**: SuperAdmin only

**Description**: Deletes a walk-in appointment. Only manually created appointments (mode: "manual") can be deleted.

**Headers**:

```json
{
  "Authorization": "Bearer <token>"
}
```

**URL Parameters**:

- `id`: MongoDB ObjectId of the appointment

**Success Response** (200):

```json
{
  "success": true,
  "message": "Walk-in appointment deleted successfully"
}
```

**Error Response - Not Found** (404):

```json
{
  "success": false,
  "message": "Appointment not found"
}
```

**Error Response - Not Manual Appointment** (400):

```json
{
  "success": false,
  "message": "Only manually created appointments can be deleted"
}
```

---

## Access Control Summary

| Endpoint       | Admin | SuperAdmin | User |
| -------------- | ----- | ---------- | ---- |
| Create Walk-in | ✅    | ✅         | ✅   |
| Update Walk-in | ❌    | ✅         | ❌   |
| Delete Walk-in | ❌    | ✅         | ❌   |

---

## Database Schema Changes

### PatientAppointment Model Updates

**New Fields**:

```javascript
{
  mode: {
    type: String,
    enum: ["manual", "ES-Query"],
    default: "ES-Query"
  },
  createdOn: {
    type: Date
  },
  createdBy: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User"
  },
  updatedBy: {
    type: String  // User ObjectId or "cron"
  }
}
```

**Existing Fields** (unchanged):

- `patient-id`: String (required)
- `patient-name`: String (required)
- `dos`: String (required) - Date format: "YYYY-MM-DD"
- `chair-name`: String (required)
- `insurance-name`: String (required)
- `insurance-type`: String (required)
- `office-name`: String (required)
- `updated-on`: Date (required)

---

## Business Rules

### 1. Duplicate Prevention

- **Check**: Before creating or updating, verify no appointment exists with same `dos` + `patient-id`
- **Fields Used**: `dos` (string), `patient-id` (string)
- **Example**: Cannot create appointment for patient "1245" on "2025-12-02" if it already exists

### 2. Mode-Based Access Control

- **Create**: Always sets `mode: "manual"`
- **Update**: Only allowed for appointments with `mode: "manual"`
- **Delete**: Only allowed for appointments with `mode: "manual"`
- **Cron Jobs**: Set `mode: "ES-Query"` (automatic appointments cannot be edited/deleted via API)

### 3. Cron Job Sync Behavior

**Important**: When cron jobs sync appointments from ES-Query:

- If a walk-in appointment (mode: "manual") exists with same DOS + patient-id:
  - ✅ `patient-name` is updated if changed
  - ✅ `updated-on` timestamp is refreshed
  - ✅ `updatedBy` is set to "cron"
  - ❌ `mode` remains "manual" (NOT changed to "ES-Query")
  - ❌ `createdOn` is preserved (NOT changed)
  - ❌ `createdBy` is preserved (NOT changed)
- This ensures manually created appointments maintain their "manual" status even when cron finds them

### 4. Tracking Metadata

- **createdOn**: Set once during creation (timestamp)
- **createdBy**: Set once during creation (user ObjectId)
- **updated-on**: Updated on every modification
- **updatedBy**: Set to user ID when updated via API, or "cron" when updated by cron job

---

## Testing Examples

### Create Walk-in Appointment

```bash
curl -X POST http://localhost:5000/api/appointments/walk-in \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "patient-id": "1245",
    "patient-name": "John Doe",
    "dos": "2025-12-02",
    "office-name": "Downtown Dental"
  }'
```

**With Optional Fields:**

```bash
curl -X POST http://localhost:5000/api/appointments/walk-in \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "patient-id": "1245",
    "patient-name": "John Doe",
    "dos": "2025-12-02",
    "office-name": "Downtown Dental",
    "chair-name": "Chair 1",
    "insurance-name": "Blue Cross",
    "insurance-type": "PPO"
  }'
```

### Update Walk-in Appointment

```bash
curl -X PUT http://localhost:5000/api/appointments/walk-in/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer <token>" \
  -H "Content-Type: application/json" \
  -d '{
    "patient-name": "John Doe Updated",
    "chair-name": "Chair 2"
  }'
```

### Delete Walk-in Appointment

```bash
curl -X DELETE http://localhost:5000/api/appointments/walk-in/507f1f77bcf86cd799439011 \
  -H "Authorization: Bearer <token>"
```

---

## Error Codes

| Status Code | Meaning      | When It Occurs                                |
| ----------- | ------------ | --------------------------------------------- |
| 200         | Success      | Update/Delete successful                      |
| 201         | Created      | Appointment created successfully              |
| 400         | Bad Request  | Missing fields, invalid mode                  |
| 401         | Unauthorized | No token or invalid token                     |
| 403         | Forbidden    | User role doesn't have permission             |
| 404         | Not Found    | Appointment ID doesn't exist                  |
| 409         | Conflict     | Duplicate appointment (same DOS + patient-id) |
| 500         | Server Error | Database or server error                      |

---

## Integration Notes

### Frontend Integration

1. **Create Form**: All fields required, validate before submission
2. **Update Form**: Pre-populate with existing data, allow partial updates
3. **Delete Action**: Confirm before deletion (irreversible)
4. **Error Handling**: Show user-friendly messages for duplicate appointments

### Existing Appointment List API

- Walk-in appointments appear in existing `/api/appointments/list` API
- Filter by `mode: "manual"` to show only walk-in appointments
- Filter by `mode: "ES-Query"` to show only cron-synced appointments

---

## Migration Considerations

### Existing Appointments

- All existing appointments will have `mode: "ES-Query"` by default
- Manually created appointments will have `mode: "manual"`
- `createdOn` and `createdBy` will be null for existing appointments (migration not required)

### Backward Compatibility

- Existing APIs unchanged
- New fields optional in queries
- Cron jobs automatically set `mode: "ES-Query"`
