# UsedIn Feature Documentation

## Overview

The `usedIn` field tracks where radio button sets and dropdown sets are being used/referenced across your application. This helps you know which elements, screens, or modules are using specific sets.

## Schema Changes

### ButtonSet Model

Added optional `usedIn` array field:

```javascript
usedIn: {
  type: [String],
  default: [],
  // Array to track where this button set is being used/updated
  // Can store element IDs, screen names, module names, or any reference
}
```

### DropdownSet Model

Added same `usedIn` array field:

```javascript
usedIn: {
  type: [String],
  default: [],
  // Array to track where this dropdown set is being used/updated
  // Can store element IDs, screen names, module names, or any reference
}
```

## API Endpoints

### Radio Button Sets

#### 1. Add References to usedIn Array

**Endpoint:** `PATCH /api/radio-buttons/button-sets/:id/used-in/add`  
**Access:** Admin/SuperAdmin only  
**Description:** Adds new references to the usedIn array (duplicates are automatically filtered)

**Request Body:**

```json
{
  "references": ["screen_1", "module_dashboard", "element_xyz"]
}
```

**Response:**

```json
{
  "success": true,
  "message": "3 reference(s) added successfully",
  "data": {
    "_id": "...",
    "name": "Gender Options",
    "usedIn": ["screen_1", "module_dashboard", "element_xyz"],
    ...
  }
}
```

#### 2. Remove References from usedIn Array

**Endpoint:** `PATCH /api/radio-buttons/button-sets/:id/used-in/remove`  
**Access:** Admin/SuperAdmin only  
**Description:** Removes specified references from the usedIn array

**Request Body:**

```json
{
  "references": ["screen_1", "element_xyz"]
}
```

**Response:**

```json
{
  "success": true,
  "message": "2 reference(s) removed successfully",
  "data": {
    "_id": "...",
    "name": "Gender Options",
    "usedIn": ["module_dashboard"],
    ...
  }
}
```

#### 3. Replace Entire usedIn Array

**Endpoint:** `PUT /api/radio-buttons/button-sets/:id/used-in`  
**Access:** Admin/SuperAdmin only  
**Description:** Replaces the entire usedIn array with new references

**Request Body:**

```json
{
  "references": ["new_screen", "new_module"]
}
```

**To clear all references:**

```json
{
  "references": []
}
```

**Response:**

```json
{
  "success": true,
  "message": "UsedIn references updated successfully",
  "data": {
    "_id": "...",
    "name": "Gender Options",
    "usedIn": ["new_screen", "new_module"],
    ...
  }
}
```

### Dropdown Sets

Same three endpoints for dropdown sets:

1. **Add References:** `PATCH /api/dropdowns/dropdown-sets/:id/used-in/add`
2. **Remove References:** `PATCH /api/dropdowns/dropdown-sets/:id/used-in/remove`
3. **Replace Array:** `PUT /api/dropdowns/dropdown-sets/:id/used-in`

All work exactly the same way as radio button sets.

## Usage Examples

### Example 1: Track Where a Button Set is Used

```javascript
// When you use a button set in a form on "Profile Screen"
PATCH /api/radio-buttons/button-sets/123abc/used-in/add
{
  "references": ["profile_screen", "user_registration_form"]
}
```

### Example 2: Track Multiple Usage Points

```javascript
// Add multiple locations where dropdown is used
PATCH /api/dropdowns/dropdown-sets/456def/used-in/add
{
  "references": [
    "dashboard_filter",
    "report_page",
    "settings_module",
    "element_dropdown_1"
  ]
}
```

### Example 3: Update When Element is Removed

```javascript
// Remove reference when you delete that element/screen
PATCH /api/radio-buttons/button-sets/123abc/used-in/remove
{
  "references": ["old_screen_removed"]
}
```

### Example 4: Complete Reset

```javascript
// Replace all references with new list
PUT /api/dropdowns/dropdown-sets/456def/used-in
{
  "references": ["new_screen", "updated_module"]
}
```

## Benefits

1. **Dependency Tracking:** Know exactly where each set is being used
2. **Safe Deletion:** Check usedIn array before deleting a set
3. **Impact Analysis:** Understand impact of changes to a set
4. **Documentation:** Self-documenting usage across your application
5. **Reference Management:** Clean up unused sets by checking empty usedIn arrays

## Important Notes

- ✅ Field is **optional** - not required during creation
- ✅ Field is **not validated** - you can store any string reference
- ✅ Duplicates are **automatically prevented** when adding
- ✅ Field is **returned in GET requests** automatically
- ✅ Only **Admin/SuperAdmin** can modify usedIn arrays
- ✅ Field is **preserved** during restore operations

## Integration Workflow

### When Creating Elements in Your Frontend

```javascript
// 1. Create a screen/element that uses a button set
createScreen({
  name: "Profile Screen",
  elements: [{ type: "radio", buttonSetId: "123abc" }],
});

// 2. Update the button set's usedIn array
fetch("/api/radio-buttons/button-sets/123abc/used-in/add", {
  method: "PATCH",
  body: JSON.stringify({
    references: ["profile_screen_id_xyz"],
  }),
});
```

### When Deleting Elements

```javascript
// 1. Get the element details
const element = getElement("profile_screen_id_xyz");

// 2. Remove reference from usedIn array
fetch(`/api/radio-buttons/button-sets/${element.buttonSetId}/used-in/remove`, {
  method: "PATCH",
  body: JSON.stringify({
    references: ["profile_screen_id_xyz"],
  }),
});

// 3. Delete the element
deleteElement("profile_screen_id_xyz");
```

### Before Deleting a Set

```javascript
// Check if set is being used anywhere
const buttonSet = await fetch("/api/radio-buttons/button-sets/123abc");
if (buttonSet.usedIn.length > 0) {
  console.log("Cannot delete - used in:", buttonSet.usedIn);
  // Show warning to user
} else {
  // Safe to delete
  deleteButtonSet("123abc");
}
```

## Reference Format Suggestions

You can use any string format for references. Here are some suggestions:

### Option 1: IDs Only

```json
{
  "references": ["60d5ec49f1b2c8b1f8e4c123", "60d5ec49f1b2c8b1f8e4c456"]
}
```

### Option 2: Descriptive Names

```json
{
  "references": ["profile_screen", "dashboard_filter", "settings_page"]
}
```

### Option 3: Structured Format (Recommended)

```json
{
  "references": [
    "screen:profile:form_1",
    "module:dashboard:filter_gender",
    "element:registration:radio_group_1"
  ]
}
```

### Option 4: JSON-like Strings (for more data)

```json
{
  "references": [
    "screen:profile|name:User Profile|id:123",
    "module:dashboard|name:Analytics|id:456"
  ]
}
```

Choose the format that best fits your application's needs!
