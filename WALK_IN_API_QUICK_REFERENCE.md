# Walk-in Appointment API - Quick Reference

## Base URL

```
http://localhost:5000/api/appointments
```

---

## Endpoints Summary

| Method | Endpoint       | Access                  | Purpose                    |
| ------ | -------------- | ----------------------- | -------------------------- |
| POST   | `/walk-in`     | Admin, SuperAdmin, User | Create walk-in appointment |
| PUT    | `/walk-in/:id` | SuperAdmin              | Update walk-in appointment |
| DELETE | `/walk-in/:id` | SuperAdmin              | Delete walk-in appointment |

---

## 1. CREATE Walk-in Appointment

### Request

```
POST /api/appointments/walk-in
```

### Body

```json
{
  "patient-id": "1245",
  "patient-name": "John Doe",
  "dos": "2025-12-02",
  "office-name": "Downtown Dental"
}
```

**Optional Fields:**

```json
{
  "chair-name": "Chair 1",
  "insurance-name": "Blue Cross",
  "insurance-type": "PPO"
}
```

### Response (201)

```json
{
  "success": true,
  "message": "Walk-in appointment created successfully",
  "data": {...}
}
```

### Errors

- **409**: Appointment already exists (duplicate DOS + patient-id)
- **400**: Missing required fields

---

## 2. UPDATE Walk-in Appointment

### Request

```
PUT /api/appointments/walk-in/{appointmentId}
```

### Body (all optional)

```json
{
  "patient-name": "Jane Doe",
  "dos": "2025-12-03",
  "chair-name": "Chair 2"
}
```

### Response (200)

```json
{
  "success": true,
  "message": "Walk-in appointment updated successfully",
  "data": {...}
}
```

### Errors

- **404**: Appointment not found
- **400**: Not a manual appointment
- **409**: Duplicate after update
- **403**: Only SuperAdmin can update

---

## 3. DELETE Walk-in Appointment

### Request

```
DELETE /api/appointments/walk-in/{appointmentId}
```

### Response (200)

```json
{
  "success": true,
  "message": "Walk-in appointment deleted successfully"
}
```

### Errors

- **404**: Appointment not found
- **400**: Not a manual appointment
- **403**: Only SuperAdmin can delete

---

## Important Notes

### Duplicate Check

✅ Checked before CREATE and UPDATE

- Same `dos` (date string) + `patient-id` (string) = DUPLICATE
- Example: Cannot have two "1245" patients on "2025-12-02"

### Mode Field

- **manual**: Created via walk-in API (can edit/delete)
- **ES-Query**: Created via cron job (cannot edit/delete)

### 🔄 Cron Job Sync Behavior

**Critical**: When cron syncs appointments from ES-Query and finds existing walk-in appointment (same DOS + patient-id):

**Updated:**

- ✅ `patient-name` (if changed)
- ✅ `updated-on` (timestamp refreshed)
- ✅ `updatedBy` (set to "cron")

**Preserved:**

- ❌ `mode` stays "manual" (NOT changed to "ES-Query")
- ❌ `createdOn` (NOT changed)
- ❌ `createdBy` (NOT changed)

**Result**: Walk-in appointments maintain their manual status even when cron finds them!

### Required Fields (CREATE)

Only 4 fields required:

1. patient-id
2. patient-name
3. dos
4. office-name

**Optional Fields:**

- chair-name
- insurance-name
- insurance-type

### Auto-populated Fields

- `mode`: "manual"
- `createdOn`: Current timestamp
- `createdBy`: User ObjectId from token
- `updated-on`: Current timestamp

---

## Access Control

### Create

- ✅ Admin
- ✅ SuperAdmin
- ✅ User

### Update/Delete

- ❌ Admin
- ✅ SuperAdmin
- ❌ User

---

## Common Use Cases

### 1. Create Walk-in Patient

User sees walk-in patient → Creates appointment → System checks duplicates → Success

### 2. Fix Wrong Date

SuperAdmin realizes wrong DOS → Updates DOS → System checks duplicates → Success

### 3. Remove Test Data

SuperAdmin created test appointment → Deletes it → Success

### 4. Prevent Duplicate Entry

User tries creating same patient/date → System rejects → Shows existing appointment

---

## Testing Checklist

- [ ] Create with all valid fields
- [ ] Create with missing fields (should fail)
- [ ] Create duplicate DOS+patient-id (should fail)
- [ ] Update by SuperAdmin (should work)
- [ ] Update by User (should fail - 403)
- [ ] Update ES-Query appointment (should fail - 400)
- [ ] Update to duplicate DOS+patient-id (should fail - 409)
- [ ] Delete by SuperAdmin (should work)
- [ ] Delete by User (should fail - 403)
- [ ] Delete ES-Query appointment (should fail - 400)

---

## Example Scenarios

### Scenario 1: New Walk-in Patient

```
1. Patient walks in without appointment
2. Receptionist (User role) creates walk-in appointment
3. System creates with mode="manual", createdBy=receptionist
4. Appointment appears in regular appointment list
```

### Scenario 2: Duplicate Entry Attempt

```
1. Receptionist tries to create appointment
2. Patient "1245" on "2025-12-02" already exists
3. System returns 409 with existing appointment data
4. Receptionist sees the existing appointment
```

### Scenario 3: SuperAdmin Correction

```
1. SuperAdmin notices wrong patient name
2. Updates appointment with correct name
3. System updates and preserves createdBy/createdOn
4. updated-on timestamp refreshed
```

---

## Integration with Existing APIs

### Appointment List API

```
GET /api/appointments/list
```

- Walk-in appointments included automatically
- Filter by `mode: "manual"` to show only walk-ins
- All walkout data available (pendingWith, walkoutStatus, etc.)

### Office Appointments API

```
GET /api/appointments/office/:officeName
```

- Walk-in appointments included by office
- No special handling needed
