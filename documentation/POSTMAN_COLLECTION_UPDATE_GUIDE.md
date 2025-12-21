# Postman Collection Update Guide - Embedded Architecture

## Overview

The Radio Buttons and Dropdowns have been migrated to an **embedded subdocument architecture**. This means buttons/options are no longer in separate collections but are stored as embedded subdocuments within their parent sets.

## Architecture Change Summary

### OLD Architecture (Reference-Based):

- Separate collections: `radio-buttons`, `dropdown-options`
- Buttons/options could exist independently
- Needed `buttonSetId`/`dropdownSetId` in request bodies
- Had add/remove association endpoints

### NEW Architecture (Embedded):

- Single collections: `button-sets` (with embedded buttons), `dropdown-sets` (with embedded options)
- Buttons/options exist only within their parent sets
- `buttonSetId`/`dropdownSetId` now in URL path params
- No association endpoints needed

---

## Required Postman Collection Updates

### 1. Radio Buttons Section

#### OLD Endpoints Structure:

```
Radio Buttons/
├── Button Sets/ (✅ Keep these unchanged)
│   ├── Create Button Set
│   ├── Get All Button Sets
│   ├── Get Button Set by ID
│   ├── Update Button Set
│   └── Delete Button Set
│
├── Radio Buttons/ (❌ CHANGE THESE)
│   ├── Create Radio Button
│   ├── Get All Radio Buttons
│   ├── Get Radio Button by ID
│   ├── Update Radio Button
│   └── Delete Radio Button
│
└── Bulk Operations/ (❌ CHANGE THESE)
    ├── Bulk Create Radio Buttons
    ├── Bulk Update Radio Buttons
    └── Bulk Delete Radio Buttons
```

#### NEW Endpoints Structure:

```
Radio Buttons/
├── Button Sets/ (✅ Unchanged)
│   ├── Create Button Set
│   ├── Get All Button Sets
│   ├── Get Button Set by ID
│   ├── Update Button Set
│   └── Delete Button Set
│
├── Radio Buttons (Embedded)/ (🔄 UPDATED)
│   ├── Create Button in Set
│   ├── Get All Buttons in Set
│   ├── Get Button by ID
│   ├── Update Button
│   └── Delete Button
│
└── Bulk Operations/ (🔄 UPDATED)
    ├── Bulk Create Buttons
    ├── Bulk Update Buttons
    └── Bulk Delete Buttons
```

---

### 2. Detailed Endpoint Changes

#### A. Create Radio Button

**OLD:**

```http
POST /api/radio-buttons
Content-Type: application/json

{
  "buttonSetId": "{{button_set_id}}",
  "name": "Root Canal",
  "visibility": true,
  "isActive": true
}
```

**NEW:**

```http
POST /api/radio-buttons/button-sets/:buttonSetId/buttons
Content-Type: application/json

{
  "name": "Root Canal",
  "visibility": true,
  "isActive": true
}
```

**Changes:**

- URL changed from `/api/radio-buttons` to `/api/radio-buttons/button-sets/:buttonSetId/buttons`
- Add URL variable: `buttonSetId` = `{{button_set_id}}`
- Remove `buttonSetId` from request body
- Update description: "Create an embedded radio button within a specific button set. Admin/SuperAdmin only."

---

#### B. Get All Radio Buttons

**OLD:**

```http
GET /api/radio-buttons?buttonSetId={{button_set_id}}&isActive=true&visibility=true&limit=100&skip=0
```

**NEW:**

```http
GET /api/radio-buttons/button-sets/:buttonSetId/buttons?isActive=true&visibility=true
```

**Changes:**

- URL changed from `/api/radio-buttons` to `/api/radio-buttons/button-sets/:buttonSetId/buttons`
- Add URL variable: `buttonSetId` = `{{button_set_id}}`
- Remove `buttonSetId` query parameter
- Remove `limit` and `skip` query parameters (returns all buttons in the set)
- Update description: "Get all embedded radio buttons within a specific button set. All authenticated users."

---

#### C. Get Radio Button by ID

**OLD:**

```http
GET /api/radio-buttons/:id
```

**NEW:**

```http
GET /api/radio-buttons/button-sets/:buttonSetId/buttons/:buttonId
```

**Changes:**

- URL changed from `/api/radio-buttons/:id` to `/api/radio-buttons/button-sets/:buttonSetId/buttons/:buttonId`
- Add URL variable: `buttonSetId` = `{{button_set_id}}`
- Change URL variable name from `id` to `buttonId` = `{{radio_button_id}}`
- Update description: "Get a specific embedded radio button by ID. All authenticated users."

---

#### D. Update Radio Button

**OLD:**

```http
PUT /api/radio-buttons/:id
Content-Type: application/json

{
  "name": "Root Canal Treatment",
  "visibility": true,
  "isActive": true
}
```

**NEW:**

```http
PUT /api/radio-buttons/button-sets/:buttonSetId/buttons/:buttonId
Content-Type: application/json

{
  "name": "Root Canal Treatment",
  "visibility": true,
  "isActive": true
}
```

**Changes:**

- URL changed from `/api/radio-buttons/:id` to `/api/radio-buttons/button-sets/:buttonSetId/buttons/:buttonId`
- Add URL variable: `buttonSetId` = `{{button_set_id}}`
- Change URL variable name from `id` to `buttonId` = `{{radio_button_id}}`
- Request body remains the same
- Update description: "Update an embedded radio button. Admin/SuperAdmin only."

---

#### E. Delete Radio Button

**OLD:**

```http
DELETE /api/radio-buttons/:id
```

**NEW:**

```http
DELETE /api/radio-buttons/button-sets/:buttonSetId/buttons/:buttonId
```

**Changes:**

- URL changed from `/api/radio-buttons/:id` to `/api/radio-buttons/button-sets/:buttonSetId/buttons/:buttonId`
- Add URL variable: `buttonSetId` = `{{button_set_id}}`
- Change URL variable name from `id` to `buttonId` = `{{radio_button_id}}`
- Update description: "Delete an embedded radio button. Admin/SuperAdmin only."

---

#### F. Bulk Create Radio Buttons

**OLD:**

```http
POST /api/radio-buttons/bulk
Content-Type: application/json

{
  "buttonSetId": "{{button_set_id}}",
  "buttons": [
    {
      "name": "Cleaning",
      "visibility": true,
      "isActive": true
    }
  ]
}
```

**NEW:**

```http
POST /api/radio-buttons/button-sets/:buttonSetId/buttons/bulk
Content-Type: application/json

{
  "buttons": [
    {
      "name": "Cleaning",
      "visibility": true,
      "isActive": true
    }
  ]
}
```

**Changes:**

- URL changed from `/api/radio-buttons/bulk` to `/api/radio-buttons/button-sets/:buttonSetId/buttons/bulk`
- Add URL variable: `buttonSetId` = `{{button_set_id}}`
- Remove `buttonSetId` from request body
- Keep `buttons` array in request body
- Update description: "Create multiple embedded radio buttons at once within a specific button set. Admin/SuperAdmin only."

---

#### G. Bulk Update Radio Buttons

**OLD:**

```http
PUT /api/radio-buttons/bulk
Content-Type: application/json

{
  "buttons": [
    {
      "id": "button_id_1",
      "name": "Deep Cleaning"
    }
  ]
}
```

**NEW:**

```http
PUT /api/radio-buttons/button-sets/:buttonSetId/buttons/bulk
Content-Type: application/json

{
  "updates": [
    {
      "id": "button_id_1",
      "name": "Deep Cleaning"
    }
  ]
}
```

**Changes:**

- URL changed from `/api/radio-buttons/bulk` to `/api/radio-buttons/button-sets/:buttonSetId/buttons/bulk`
- Add URL variable: `buttonSetId` = `{{button_set_id}}`
- Change request body key from `buttons` to `updates`
- Update description: "Update multiple embedded radio buttons at once. Admin/SuperAdmin only."

---

#### H. Bulk Delete Radio Buttons

**OLD:**

```http
DELETE /api/radio-buttons/bulk
Content-Type: application/json

{
  "ids": ["button_id_1", "button_id_2"]
}
```

**NEW:**

```http
DELETE /api/radio-buttons/button-sets/:buttonSetId/buttons/bulk
Content-Type: application/json

{
  "ids": ["button_id_1", "button_id_2"]
}
```

**Changes:**

- URL changed from `/api/radio-buttons/bulk` to `/api/radio-buttons/button-sets/:buttonSetId/buttons/bulk`
- Add URL variable: `buttonSetId` = `{{button_set_id}}`
- Request body remains the same
- Update description: "Delete multiple embedded radio buttons at once. Admin/SuperAdmin only."

---

#### I. Remove OLD Endpoints

**DELETE these endpoints (no longer exist):**

- `GET /api/radio-buttons/button-set/:buttonSetId` (replaced by nested endpoint)

---

### 3. Dropdown Options Section

Apply the **EXACT SAME PATTERN** to Dropdown Options:

#### OLD Endpoints:

```
POST /api/dropdowns
GET /api/dropdowns
GET /api/dropdowns/:id
PUT /api/dropdowns/:id
DELETE /api/dropdowns/:id
POST /api/dropdowns/bulk
PUT /api/dropdowns/bulk
DELETE /api/dropdowns/bulk
```

#### NEW Endpoints:

```
POST /api/dropdowns/dropdown-sets/:dropdownSetId/options
GET /api/dropdowns/dropdown-sets/:dropdownSetId/options
GET /api/dropdowns/dropdown-sets/:dropdownSetId/options/:optionId
PUT /api/dropdowns/dropdown-sets/:dropdownSetId/options/:optionId
DELETE /api/dropdowns/dropdown-sets/:dropdownSetId/options/:optionId
POST /api/dropdowns/dropdown-sets/:dropdownSetId/options/bulk
PUT /api/dropdowns/dropdown-sets/:dropdownSetId/options/bulk
DELETE /api/dropdowns/dropdown-sets/:dropdownSetId/options/bulk
```

**Changes:**

- Follow the same pattern as Radio Buttons
- Replace `buttons` with `options`
- Replace `buttonSetId` with `dropdownSetId`
- Replace `buttonId` with `optionId`
- Remove `dropdownSetId` from request bodies (it's in URL)
- Update all descriptions to mention "embedded" architecture

---

#### J. Remove OLD Dropdown Endpoints

**DELETE these endpoints (no longer exist):**

- `POST /api/dropdowns/dropdown-sets/:id/options` (Add Options to Set) - Old association endpoint
- `DELETE /api/dropdowns/dropdown-sets/:id/options` (Remove Options from Set) - Old association endpoint

---

### 4. Collection Variables

**Current variables (✅ Keep these):**

```json
{
  "button_set_id": "",
  "radio_button_id": "",
  "dropdown_set_id": "",
  "dropdown_option_id": ""
}
```

All variables remain the same. No changes needed.

---

## Step-by-Step Update Process

### For Radio Buttons:

1. **Keep "Button Sets" folder unchanged** (5 endpoints already correct)

2. **Update "Radio Buttons" folder:**

   - Rename to "Radio Buttons (Embedded)"
   - Update each endpoint URL to nested structure
   - Add `buttonSetId` URL variable to all endpoints
   - Remove `buttonSetId` from request bodies
   - Change `:id` to `:buttonId` where applicable
   - Update descriptions

3. **Update "Bulk Operations" folder:**

   - Update all URLs to nested structure
   - Add `buttonSetId` URL variable
   - Remove `buttonSetId` from request bodies
   - Change `buttons` to `updates` in bulk update request
   - Update descriptions

4. **Delete old endpoints:**
   - Remove `GET /api/radio-buttons/button-set/:buttonSetId`

### For Dropdowns:

Follow the exact same process, but replace:

- `buttons` → `options`
- `buttonSetId` → `dropdownSetId`
- `buttonId` → `optionId`

---

## Testing After Updates

### Test Sequence:

1. **Test Button Set Creation:**

   ```
   POST /api/radio-buttons/button-sets
   → Save returned _id to {{button_set_id}}
   ```

2. **Test Button Creation:**

   ```
   POST /api/radio-buttons/button-sets/{{button_set_id}}/buttons
   → Save returned button _id to {{radio_button_id}}
   ```

3. **Test Get Buttons in Set:**

   ```
   GET /api/radio-buttons/button-sets/{{button_set_id}}/buttons
   → Should return array of embedded buttons
   ```

4. **Test Bulk Create:**

   ```
   POST /api/radio-buttons/button-sets/{{button_set_id}}/buttons/bulk
   → Should create multiple buttons
   ```

5. **Test Update Button:**

   ```
   PUT /api/radio-buttons/button-sets/{{button_set_id}}/buttons/{{radio_button_id}}
   ```

6. **Test Delete Button:**

   ```
   DELETE /api/radio-buttons/button-sets/{{button_set_id}}/buttons/{{radio_button_id}}
   ```

7. **Repeat for Dropdowns**

---

## Quick Reference: URL Patterns

### Radio Buttons:

```
Button Sets (unchanged):
✅ /api/radio-buttons/button-sets
✅ /api/radio-buttons/button-sets/:id

Embedded Buttons (updated):
🔄 /api/radio-buttons/button-sets/:buttonSetId/buttons
🔄 /api/radio-buttons/button-sets/:buttonSetId/buttons/:buttonId
🔄 /api/radio-buttons/button-sets/:buttonSetId/buttons/bulk
```

### Dropdowns:

```
Dropdown Sets (unchanged):
✅ /api/dropdowns/dropdown-sets
✅ /api/dropdowns/dropdown-sets/:id

Embedded Options (updated):
🔄 /api/dropdowns/dropdown-sets/:dropdownSetId/options
🔄 /api/dropdowns/dropdown-sets/:dropdownSetId/options/:optionId
🔄 /api/dropdowns/dropdown-sets/:dropdownSetId/options/bulk
```

---

## Common Issues & Solutions

**Issue**: 404 Not Found after updating URLs
**Solution**: Make sure you're using the correct nested structure with both parent set ID and button/option ID in the URL path.

**Issue**: 400 Bad Request - "buttonSetId is required"
**Solution**: `buttonSetId` should be in the URL path as `:buttonSetId`, not in the request body.

**Issue**: Can't find button by ID
**Solution**: Remember that button IDs are scoped to their parent set. Always provide both `buttonSetId` and `buttonId`.

---

## Summary of Changes

| Aspect                     | OLD                                    | NEW                          |
| -------------------------- | -------------------------------------- | ---------------------------- |
| Architecture               | Reference-based (separate collections) | Embedded subdocuments        |
| Button/Option Independence | Could exist independently              | Must belong to a set         |
| ID Location                | Body field                             | URL path parameter           |
| Associations               | Explicit add/remove endpoints          | Automatic (embedded)         |
| Uniqueness                 | Globally unique names                  | Unique within each set       |
| Cleanup                    | Manual cleanup needed                  | Automatic (cascading delete) |

---

**Total Endpoints to Update:**

- Radio Buttons: 8 endpoints (5 buttons + 3 bulk)
- Dropdowns: 8 endpoints (5 options + 3 bulk)
- **Total: 16 endpoint updates**

**Endpoints to Delete:**

- 4 old association endpoints (2 radio + 2 dropdown)

**Time Estimate**: 30-45 minutes for complete update and testing

---

**Last Updated**: December 2024
**Version**: 2.0.0 (Embedded Architecture)
**Maintained By**: Walkout Backend Team
