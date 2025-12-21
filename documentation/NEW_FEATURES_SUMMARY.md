# New Features Implementation Summary

## Date: December 20, 2024

---

## Overview

Two major features have been added to the Radio Buttons and Dropdowns systems:

1. **Incremental ID System**: Never-reused sequential IDs for stable frontend mapping
2. **Archive System**: Soft delete with full audit trail and data preservation

---

## 1. Incremental ID System

### What Changed

**Before**:

- Buttons/options only had MongoDB's `_id` field
- Frontend had to track items by constantly changing `_id`
- If item was recreated, frontend mapping broke

**After**:

- Each button/option gets an `incrementalId` field (1, 2, 3, 4...)
- IDs are **never reused**, even after deletion
- Frontend can safely map by `incrementalId` - it never changes

### Implementation

#### Model Changes

**ButtonSet.js**:

```javascript
// Added to ButtonSet schema
lastButtonId: {
  type: Number,
  default: 0  // Counter starts at 0
}

// Added to radioButtonSchema
incrementalId: {
  type: Number,
  required: true  // Auto-assigned on creation
}
```

**DropdownSet.js**:

```javascript
// Added to DropdownSet schema
lastOptionId: {
  type: Number,
  default: 0
}

// Added to dropdownOptionSchema
incrementalId: {
  type: Number,
  required: true
}
```

#### Controller Changes

**buttonSetController.js**:

- `createButton`: Auto-increments `lastButtonId` and assigns to new button
- `bulkCreateButtons`: Increments counter for each button created

**dropdownSetController.js**:

- `createOption`: Auto-increments `lastOptionId` and assigns to new option
- `bulkCreateOptions`: Increments counter for each option created

### Example Flow

```javascript
// Create first button
lastButtonId: 0 → 1
Button: { _id: "xyz", incrementalId: 1, name: "Cleaning" }

// Create second button
lastButtonId: 1 → 2
Button: { _id: "abc", incrementalId: 2, name: "Filling" }

// Delete second button
lastButtonId: stays at 2 (never decreases!)
Buttons: [{ incrementalId: 1 }]  // incrementalId 2 retired forever

// Create third button
lastButtonId: 2 → 3
Button: { _id: "def", incrementalId: 3, name: "Root Canal" }
// Note: incrementalId 2 is NEVER reused
```

### API Response Changes

**Old Response**:

```json
{
  "buttons": [
    {
      "_id": "6578abc123",
      "name": "Cleaning"
    }
  ]
}
```

**New Response**:

```json
{
  "lastButtonId": 1,
  "buttons": [
    {
      "_id": "6578abc123",
      "incrementalId": 1,
      "name": "Cleaning"
    }
  ]
}
```

### Frontend Integration

```javascript
// Before: Mapping by _id (breaks on recreation)
const buttonMap = {
  "6578abc123": "Cleaning",
  "6578abc124": "Filling",
};

// After: Mapping by incrementalId (stable forever)
const buttonMap = {
  1: "Cleaning",
  2: "Filling",
};

// When button name changes from "Cleaning" to "Deep Cleaning"
// incrementalId stays 1, frontend automatically updates
```

---

## 2. Archive System

### What Changed

**Before**:

- DELETE operations permanently removed data from database
- No way to recover deleted items
- No audit trail of what was deleted, when, or by whom

**After**:

- DELETE operations move data to archive collections
- Original data preserved with full metadata
- Complete audit trail: who deleted, when, and why
- Data can be restored in future (feature planned)

### Implementation

#### New Models

**ArchiveRadioButton.js** (Collection: `archive-radio-buttons`):

```javascript
{
  originalId: ObjectId,      // Original ButtonSet _id
  name: String,
  description: String,
  lastButtonId: Number,
  buttons: [                 // All archived buttons
    {
      incrementalId: Number,
      name: String,
      visibility: Boolean,
      isActive: Boolean,
      originalId: ObjectId,  // Original button _id
      createdAt: Date,
      updatedAt: Date
    }
  ],

  // Original metadata
  isActive: Boolean,
  createdBy: ObjectId,
  updatedBy: ObjectId,

  // Deletion metadata
  deletedBy: ObjectId,       // Who deleted it
  deletedAt: Date,           // When deleted
  deletionReason: String,    // Why deleted (optional)

  // Original timestamps
  originalCreatedAt: Date,
  originalUpdatedAt: Date
}
```

**ArchiveDropdown.js** (Collection: `archive-dropdowns`):

- Same structure as ArchiveRadioButton
- Stores archived dropdown sets and options

#### Controller Changes

**buttonSetController.js**:

**deleteButtonSet**:

```javascript
// Before
await ButtonSet.findByIdAndDelete(id);

// After
// 1. Create archive entry
await ArchiveRadioButton.create({
  originalId: buttonSet._id,
  ...buttonSet,
  deletedBy: req.user._id,
  deletedAt: new Date(),
  deletionReason: req.body.deletionReason || "Manual deletion",
});

// 2. Then delete from main collection
await ButtonSet.findByIdAndDelete(id);
```

**deleteButton**:

```javascript
// Archives individual button with parent set context
await ArchiveRadioButton.create({
  originalId: buttonSet._id,
  name: `${buttonSet.name} - Button: ${button.name}`,
  buttons: [archivedButton], // Only deleted button
  deletedBy: req.user._id,
  deletedAt: new Date(),
});

// Then remove from button set
button.deleteOne();
```

**dropdownSetController.js**:

- Same archiving logic applied to `deleteDropdownSet` and `deleteOption`

### Archive Indexes

Both archive models have indexes for efficient querying:

```javascript
archiveSchema.index({ originalId: 1 }); // Find archives by original ID
archiveSchema.index({ deletedBy: 1 }); // Find what user deleted
archiveSchema.index({ deletedAt: -1 }); // Sort by deletion time
archiveSchema.index({ name: 1 }); // Search archived items
```

### API Changes

#### Request Changes (Optional)

**Old**:

```http
DELETE /api/radio-buttons/button-sets/:id
```

**New** (deletion reason optional):

```http
DELETE /api/radio-buttons/button-sets/:id
Content-Type: application/json

{
  "deletionReason": "Service discontinued"
}
```

If no reason provided, defaults to "Manual deletion".

#### Response Changes

**Old**:

```json
{
  "success": true,
  "message": "Button set deleted successfully"
}
```

**New**:

```json
{
  "success": true,
  "message": "Button set archived and deleted successfully"
}
```

---

## Breaking Changes

### None!

✅ **All existing APIs remain unchanged**:

- Same endpoints
- Same request bodies (except optional `deletionReason`)
- Same authentication
- Same permissions
- Response structure unchanged (only added fields)

### Backward Compatibility

**Existing button sets without `lastButtonId`**:

- Default value of `0` is set automatically
- First new button gets `incrementalId: 1`

**Existing buttons without `incrementalId`**:

- If you have existing data, you may need a migration script
- OR start fresh with new sets (old data unchanged)

---

## Database Changes

### New Collections

1. **archive-radio-buttons**: Stores archived button sets and individual buttons
2. **archive-dropdowns**: Stores archived dropdown sets and individual options

### Modified Collections

1. **button-sets**: Added `lastButtonId` field (Number, default: 0)
2. **dropdown-sets**: Added `lastOptionId` field (Number, default: 0)

### Modified Subdocuments

1. **RadioButton subdocument**: Added `incrementalId` field (Number, required)
2. **DropdownOption subdocument**: Added `incrementalId` field (Number, required)

---

## Testing Checklist

### Incremental ID Tests

- [ ] Create button → verify `incrementalId: 1` and `lastButtonId: 1`
- [ ] Create second button → verify `incrementalId: 2` and `lastButtonId: 2`
- [ ] Delete first button → verify `lastButtonId` stays at 2
- [ ] Create third button → verify `incrementalId: 3` (not 1!)
- [ ] Bulk create 3 buttons → verify incrementalIds are 4, 5, 6
- [ ] Same tests for dropdown options

### Archive Tests

- [ ] Delete button set → verify archived in `archive-radio-buttons`
- [ ] Check archive contains all original data
- [ ] Verify `deletedBy` = current user
- [ ] Verify `deletedAt` = current time
- [ ] Verify button set deleted from main collection
- [ ] Delete individual button → verify archived separately
- [ ] Delete with reason → verify `deletionReason` saved
- [ ] Delete without reason → verify defaults to "Manual deletion"
- [ ] Same tests for dropdown sets

### API Compatibility Tests

- [ ] Create button set → old API still works
- [ ] Create button → old request body still works
- [ ] Get button set → verify new fields included in response
- [ ] Delete button set → old API works, returns new message
- [ ] Bulk operations → old API still works
- [ ] All existing Postman requests work without changes

---

## Files Changed

### Models

- ✅ `models/ButtonSet.js` - Added `lastButtonId` and `incrementalId`
- ✅ `models/DropdownSet.js` - Added `lastOptionId` and `incrementalId`
- ✅ `models/ArchiveRadioButton.js` - NEW FILE
- ✅ `models/ArchiveDropdown.js` - NEW FILE

### Controllers

- ✅ `controllers/buttonSetController.js` - Updated create/delete methods
- ✅ `controllers/dropdownSetController.js` - Updated create/delete methods

### Documentation

- ✅ `documentation/RADIO_BUTTONS_DOCUMENTATION.md` - Added new sections
- ✅ `documentation/DROPDOWN_DOCUMENTATION.md` - Added new sections
- ✅ `documentation/NEW_FEATURES_SUMMARY.md` - NEW FILE (this file)

---

## Usage Examples

### Frontend: Using Incremental IDs

```javascript
// React component
const RadioButtonGroup = ({ buttonSetId }) => {
  const [buttons, setButtons] = useState([]);

  // Fetch buttons
  useEffect(() => {
    fetch(`/api/radio-buttons/button-sets/${buttonSetId}`)
      .then((res) => res.json())
      .then((data) => {
        // Map by incrementalId for stable tracking
        const buttonMap = {};
        data.data.buttons.forEach((btn) => {
          buttonMap[btn.incrementalId] = btn;
        });
        setButtons(buttonMap);
      });
  }, [buttonSetId]);

  // incrementalId never changes, perfect for keys
  return (
    <div>
      {Object.entries(buttons).map(([incrementalId, button]) => (
        <label key={incrementalId}>
          <input
            type="radio"
            name="treatment"
            value={incrementalId} // Use incrementalId as value
          />
          {button.name}
        </label>
      ))}
    </div>
  );
};
```

### API: Deleting with Reason

```javascript
// JavaScript
await fetch(`/api/radio-buttons/button-sets/${buttonSetId}`, {
  method: "DELETE",
  headers: {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
  },
  body: JSON.stringify({
    deletionReason: "Service discontinued due to policy change",
  }),
});
```

### Querying Archives (Future Feature)

```javascript
// Example of how archives might be queried (not implemented yet)
GET /api/archives/radio-buttons?deletedBy=user_id
GET /api/archives/radio-buttons?originalId=set_id
GET /api/archives/radio-buttons?deletedAt[gte]=2024-01-01
```

---

## Benefits Summary

### Incremental ID Benefits

✅ **Stable Frontend Mapping**: IDs never change, perfect for React keys  
✅ **No Remapping Needed**: Edit button name without breaking frontend  
✅ **Sequential & Predictable**: Easy to understand (1, 2, 3...)  
✅ **Never Reused**: Historical integrity maintained  
✅ **Set-Scoped**: Each set has its own sequence

### Archive Benefits

✅ **Data Preservation**: Nothing permanently deleted  
✅ **Audit Trail**: Complete history of deletions  
✅ **Compliance**: Meet data retention requirements  
✅ **Recovery**: Future feature to restore archived items  
✅ **Analytics**: Analyze deletion patterns  
✅ **No Breaking Changes**: Existing APIs unchanged

---

## Migration Guide (Optional)

If you have existing data in production:

### Option 1: Soft Migration (Recommended)

1. Deploy new code
2. Existing data works fine (uses default values)
3. New items get incremental IDs automatically
4. Mix of old (no incrementalId) and new (with incrementalId) coexists

### Option 2: Full Migration

Create migration script:

```javascript
const ButtonSet = require('./models/ButtonSet');

async function migrateBut tonSets() {
  const buttonSets = await ButtonSet.find({});

  for (const set of buttonSets) {
    // Add lastButtonId if not exists
    if (!set.lastButtonId) {
      set.lastButtonId = set.buttons.length;
    }

    // Add incrementalId to each button
    set.buttons.forEach((button, index) => {
      if (!button.incrementalId) {
        button.incrementalId = index + 1;
      }
    });

    await set.save();
  }

  console.log('Migration complete!');
}
```

---

## Support

For questions or issues:

---

## 3. Restore Operations (SuperAdmin Only)

### What Changed

**Problem**: Users accidentally delete button sets or dropdown sets and realize the mistake later.

**Solution**: SuperAdmin-only restore functionality to undo accidental deletions.

### Features

1. **View Archived Data**: SuperAdmin can browse all archived items
2. **Restore Archived Items**: Bring back deleted items to main collection
3. **Name Conflict Handling**: Optional rename during restore
4. **Permanent Delete**: Clean up archives when item definitely not needed

### Implementation

#### New Controller Methods

**buttonSetController.js**:

- `getArchivedButtonSets`: List all archived button sets with filters
- `getArchivedButtonSetById`: Get specific archived set details
- `restoreButtonSet`: Restore archived set to main collection
- `permanentlyDeleteArchivedSet`: Permanently remove from archive

**dropdownSetController.js**:

- Same 4 methods for dropdown sets

#### New Routes (SuperAdmin Only)

**radioButtonRoutes.js**:

```javascript
GET    /archives/button-sets                    // List archived sets
GET    /archives/button-sets/:id                // Get archived set by ID
POST   /archives/button-sets/:archiveId/restore // Restore archived set
DELETE /archives/button-sets/:archiveId/permanent // Permanently delete
```

**dropdownRoutes.js**:

```javascript
GET    /archives/dropdown-sets                    // List archived sets
GET    /archives/dropdown-sets/:id                // Get archived set by ID
POST   /archives/dropdown-sets/:archiveId/restore // Restore archived set
DELETE /archives/dropdown-sets/:archiveId/permanent // Permanently delete
```

All routes protected with `restrictTo('superAdmin')` middleware.

### Usage Examples

#### View Archived Button Sets

```javascript
// Request
GET /api/radio-buttons/archives/button-sets?deletedBy=user123&limit=10&sortBy=-deletedAt
Authorization: Bearer <superAdmin-token>

// Response
{
  "success": true,
  "count": 2,
  "total": 5,
  "data": [
    {
      "_id": "archive123",
      "originalId": "6578abc123def456789012",
      "name": "Treatment Type",
      "lastButtonId": 3,
      "buttons": [...],
      "deletedBy": { "_id": "user123", "name": "Admin User", "email": "admin@example.com" },
      "deletedAt": "2024-01-20T10:00:00.000Z",
      "deletionReason": "Accidentally deleted"
    }
  ]
}
```

#### Restore Without Rename

```javascript
// Request
POST /api/radio-buttons/archives/button-sets/archive123/restore
Authorization: Bearer <superAdmin-token>
Content-Type: application/json

{}

// Success Response
{
  "success": true,
  "message": "Button set restored successfully",
  "data": {
    "_id": "new_id_123",
    "name": "Treatment Type",
    "lastButtonId": 3,
    "buttons": [
      { "incrementalId": 1, "name": "Cleaning" }
    ],
    "updatedBy": { ... }  // User who performed restore
  }
}
```

#### Restore With Rename (Name Conflict)

```javascript
// Request
POST /api/radio-buttons/archives/button-sets/archive123/restore
Authorization: Bearer <superAdmin-token>
Content-Type: application/json

{
  "newName": "Treatment Type (Restored)"
}

// Response - Set restored with new name
{
  "success": true,
  "message": "Button set restored successfully",
  "data": {
    "name": "Treatment Type (Restored)",
    ...
  }
}

// Error if name already exists and no newName provided
{
  "success": false,
  "message": "Button set with name 'Treatment Type' already exists. Please rename the existing set first or provide a new name."
}
```

#### Permanently Delete Archived Item

```javascript
// Request
DELETE / api / radio -
  buttons / archives / button -
  sets / archive123 / permanent;
Authorization: Bearer <
  superAdmin - token >
  // Response
  {
    success: true,
    message: "Archived button set permanently deleted",
  };
```

### Restore Behavior

1. **Incremental IDs Preserved**: Restored items keep their original `incrementalId` values
2. **Archive Removed**: Archive entry deleted after successful restore
3. **One-Time Restore**: Can't restore the same archive twice (removed after restore)
4. **User Tracking**: `updatedBy` set to user who performed restore
5. **Name Conflicts**: Must provide `newName` if original name already exists

### Security

- **SuperAdmin Only**: All archive operations require `superAdmin` role
- **Regular Admins**: Cannot access archived data or restore items
- **Authentication**: All routes protected with `protect` middleware
- **Authorization**: All routes use `restrictTo('superAdmin')`

---

## Breaking Changes

### None!

✅ **All existing APIs remain unchanged**:

- Same endpoints
- Same request bodies (except optional `deletionReason`)
- Same authentication
- Same permissions
- Response structure unchanged (only added fields)

✅ **New features are additive**:

- New archive routes don't affect existing routes
- SuperAdmin restriction is new permission level
- Restore operations are optional feature

---

## Database Changes

### New Collections

1. **archive-radio-buttons**: Stores archived button sets and individual buttons
2. **archive-dropdowns**: Stores archived dropdown sets and individual options

### Modified Collections

1. **button-sets**: Added `lastButtonId` field (Number, default: 0)
2. **dropdown-sets**: Added `lastOptionId` field (Number, default: 0)

### Modified Subdocuments

1. **RadioButton subdocument**: Added `incrementalId` field (Number, required)
2. **DropdownOption subdocument**: Added `incrementalId` field (Number, required)

---

## Testing Checklist

### Incremental ID Tests

- [ ] Create button → verify `incrementalId: 1` and `lastButtonId: 1`
- [ ] Create second button → verify `incrementalId: 2` and `lastButtonId: 2`
- [ ] Delete first button → verify `lastButtonId` stays at 2
- [ ] Create third button → verify `incrementalId: 3` (not 1!)
- [ ] Bulk create 3 buttons → verify incrementalIds are 4, 5, 6
- [ ] Same tests for dropdown options

### Archive Tests

- [ ] Delete button set → verify archived in `archive-radio-buttons`
- [ ] Check archive contains all original data
- [ ] Verify `deletedBy` = current user
- [ ] Verify `deletedAt` = current time
- [ ] Verify button set deleted from main collection
- [ ] Delete individual button → verify archived separately
- [ ] Delete with reason → verify `deletionReason` saved
- [ ] Delete without reason → verify defaults to "Manual deletion"
- [ ] Same tests for dropdown sets

### Restore Tests (SuperAdmin Only)

- [ ] Try restore as regular admin → verify 403 Forbidden
- [ ] List archived sets as SuperAdmin → verify visible
- [ ] Get archived set by ID → verify full data returned
- [ ] Restore without name conflict → verify success
- [ ] Restore with name conflict → verify error message
- [ ] Restore with newName → verify renamed correctly
- [ ] Verify incrementalIds preserved after restore
- [ ] Verify archive entry removed after restore
- [ ] Permanently delete archived set → verify removed
- [ ] Same tests for dropdown sets

### API Compatibility Tests

- [ ] Create button set → old API still works
- [ ] Create button → old request body still works
- [ ] Get button set → verify new fields included in response
- [ ] Delete button set → old API works, returns new message
- [ ] Bulk operations → old API still works
- [ ] All existing Postman requests work without changes

---

## Files Changed

### Models

- ✅ `models/ButtonSet.js` - Added `lastButtonId` and `incrementalId`
- ✅ `models/DropdownSet.js` - Added `lastOptionId` and `incrementalId`
- ✅ `models/ArchiveRadioButton.js` - NEW FILE
- ✅ `models/ArchiveDropdown.js` - NEW FILE

### Controllers

- ✅ `controllers/buttonSetController.js` - Updated create/delete methods + added 4 restore methods
- ✅ `controllers/dropdownSetController.js` - Updated create/delete methods + added 4 restore methods

### Routes

- ✅ `routes/radioButtonRoutes.js` - Added 4 archive routes (SuperAdmin only)
- ✅ `routes/dropdownRoutes.js` - Added 4 archive routes (SuperAdmin only)

### Documentation

- ✅ `documentation/RADIO_BUTTONS_DOCUMENTATION.md` - Added restore sections
- ✅ `documentation/DROPDOWN_DOCUMENTATION.md` - Added restore sections
- ✅ `documentation/NEW_FEATURES_SUMMARY.md` - Updated with restore feature

---

## Benefits Summary

### Incremental ID Benefits

✅ **Stable Frontend Mapping**: IDs never change, perfect for React keys  
✅ **No Remapping Needed**: Edit button name without breaking frontend  
✅ **Sequential & Predictable**: Easy to understand (1, 2, 3...)  
✅ **Never Reused**: Historical integrity maintained  
✅ **Set-Scoped**: Each set has its own sequence

### Archive Benefits

✅ **Data Preservation**: Nothing permanently deleted  
✅ **Audit Trail**: Complete history of deletions  
✅ **Compliance**: Meet data retention requirements  
✅ **Recovery**: Restore archived items (SuperAdmin only)  
✅ **Analytics**: Analyze deletion patterns  
✅ **No Breaking Changes**: Existing APIs unchanged

### Restore Benefits

✅ **Undo Mistakes**: Recover accidentally deleted items  
✅ **SuperAdmin Control**: Only highest permission level can restore  
✅ **Name Conflict Handling**: Optional rename during restore  
✅ **Incremental ID Preservation**: IDs stay intact after restore  
✅ **Archive Cleanup**: Permanent delete for items definitely not needed  
✅ **User Tracking**: Know who restored what and when

---

## Next Steps

- Check documentation in `/documentation` folder
- Review this summary for feature details
- Test with Postman collection (include SuperAdmin tests)
- Check server logs for errors
- Verify SuperAdmin role exists in User model
- Test restore functionality thoroughly

---

**Version**: 3.1.0  
**Status**: ✅ Implemented and Documented  
**Breaking Changes**: None  
**Backward Compatible**: Yes  
**Production Ready**: Yes (after testing)  
**New Features**: Incremental IDs, Archive System, Restore Operations (SuperAdmin only)
