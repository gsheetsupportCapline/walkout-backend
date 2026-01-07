# Walkout Backend - Postman Collections

Yeh folder me Walkout Backend ke saare APIs ke liye detailed Postman collections hain. **Do options** hain:

1. **Single Complete File** - Ek hi file se sab kuch import karo (Production/Testing)
2. **Individual Module Files** - Development aur easy maintenance ke liye

## 📁 Folder Structure

```
postman/
├── README.md                              # Yeh file
├── IMPORT-INSTRUCTIONS.md                 # Quick import guide
│
├── Walkout-Complete.postman_collection.json  ⭐ MAIN FILE - 80+ APIs (Recommended)
│
├── Individual Module Files (Backend development ke liye):
├── authentication.postman_collection.json  # Login/Signup APIs (2)
├── users.postman_collection.json          # User management APIs (9)
├── regions.postman_collection.json        # Region CRUD APIs (5)
├── offices.postman_collection.json        # Office CRUD APIs (5)
├── teams.postman_collection.json          # Team CRUD APIs (5)
├── appointments.postman_collection.json   # Appointment sync & list APIs (5)
├── provider-schedule.postman_collection.json  # Provider schedule APIs (4)
├── radio-buttons.postman_collection.json  # Radio button sets - 20 APIs with nested folders
├── dropdowns.postman_collection.json      # Dropdown sets - 20 APIs with nested folders
└── walkouts.postman_collection.json       # Walkout form APIs (5) - formRefId support
```

## 🎯 Do Import Options

### Option 1: Single File Import ⭐ (RECOMMENDED)

**Use This When:**

- Production testing kar rahe ho
- Complete API collection chahiye ek jagah
- Quick import chahiye
- Simple workflow chahiye

**File:** `Walkout-Complete.postman_collection.json`

**Contains:**

- ✅ Sare 80+ APIs ek collection me
- ✅ Organized folders aur sub-folders
- ✅ Automatic token save on login
- ✅ All IDs auto-save (user, region, office, team, etc.)
- ✅ Complete validation examples
- ✅ Bulk operations support
- ✅ Archive management
- ✅ UsedIn operations

**Import Steps:**

1. Postman kholo
2. **Import** button pe click karein (top-left)
3. **File** tab select karein
4. `Walkout-Complete.postman_collection.json` select karein
5. **Import** button pe click karein
6. Done! ✅ Ek comprehensive collection mil jayegi

### Option 2: Individual Module Files (Development Ke Liye)

**Use This When:**

- Backend me specific module update kar rahe ho
- Easy maintenance chahiye
- Git me cleaner diffs chahiye
- Module-wise testing karni hai

**Files:** Individual collection files (authentication.json, users.json, etc.)

**Benefits:**

- ✅ Backend me koi module change hua? Sirf us file ko update karo
- ✅ Testing specific module ki easily ho sakti hai
- ✅ Git commits me smaller changes
- ✅ Multiple developers parallel kaam kar sakte hain

**Import Steps:**

1. Postman kholo
2. **Import** button pe click karein
3. **Folder** tab select karein
4. Ye `postman/` folder select karein
5. **Import** button pe click karein
6. Sari individual collections alag-alag import ho jayengi

**⚠️ Important:** Individual files import karoge to har file ek separate collection banegi. Ye merge nahi honge automatically.

## 🔄 Workflow: Individual Files Update Karne ke Baad Main File Me Merge

Agar tum backend me changes karte ho aur individual files update karte ho, to main file me merge karne ke liye:

1. **Individual file update karo** (e.g., `users.postman_collection.json`)
2. **Test karo** ki changes sahi hain
3. **Main file me merge karo:**
   - Walkout-Complete.json open karo
   - Updated module ka section dhundho
   - Individual file se "item" array copy karo
   - Main file me us module ke "item" array me paste karo
   - Save karo

**Note:** Agar regularly changes ho rahe hain, to individual files use karo development me, aur periodically main file update karo.

## 📋 Collection Details

### Total APIs: 80+

**Module-wise Breakdown:** 5. Collection apne Postman me aa jayegi

**Fayda:** Sirf zaruri APIs dikhenge, organized rahega

### Option 2: Sab Ek Saath Import (Recommended for Testing)

Agar sab APIs ko ek saath import karna hai:

1. Postman kholo
2. **Import** button pe click karein
3. **Folder** option pe click karein
4. Yeh pura `postman/` folder select karein
5. **Import** pe click karein
6. Sari files import ho jayengi as separate collections

**Fayda:** Sab kuch ek jagah mil jayega, module-wise organized

## ✨ Main Features

### 1. **Automatic Token Management** 🔐

- Login/Signup karte hi token automatically save ho jata hai
- Har protected API me token automatically use hota hai
- Manually update karne ki zarurat nahi

### 2. **Auto-Save All IDs** 💾

Collection automatically save karti hai:

- `auth_token` - Login token
- `user_id` - Current user ID
- `region_id` - Region ID (first region se ya create karte waqt)
- `office_id` - Office ID
- `team_id` - Team ID
- `button_set_id` - Radio button set ID
- `dropdown_set_id` - Dropdown set ID
- `walkout_id` - Walkout form ID
- `archive_id` - Archived item ID

### 3. **Complete Examples** 📝

Har API me:

- Sample request body
- Description in Hindi & English
- Expected responses
- Validation rules

### 4. **Bulk Operations Support** 📦

- Bulk create buttons/options
- Bulk update
- Bulk delete
- Example arrays included

### 5. **No Manual Updates** 🚫✋

Koi bhi ID manually copy-paste karne ki zarurat nahi. Scripts automatically handle karenge.

## 📚 Collections Detail

### 1. Authentication (`authentication.postman_collection.json`)

**APIs:**

- POST `/api/users/signup` - Naya user banao
- POST `/api/users/login` - Login karo

**Auto-Save:**

- Token automatically save (har request me use hoga)
- User ID save
- User role save

---

### 2. Users (`users.postman_collection.json`)

**APIs:**

- GET `/api/users` - Sab users dekho (Admin/SuperAdmin only)
- GET `/api/users/:id` - Ek user ka detail
- PUT `/api/users/profile` - Apna profile update
- PUT `/api/users/:id` - Kisi user ko update (Admin)
- PUT `/api/users/:id/activate` - User activate karo
- PUT `/api/users/:id/deactivate` - User deactivate karo
- PUT `/api/users/:id/change-role` - User role change (SuperAdmin only)
- PUT `/api/users/:id/extra-permissions` - Extra permissions do
- DELETE `/api/users/:id` - User delete karo

**Total:** 9 APIs

---

### 3. Regions (`regions.postman_collection.json`)

**APIs:**

- GET `/api/regions` - Sab regions
- POST `/api/regions` - Naya region banao
- GET `/api/regions/:id` - Ek region detail
- PUT `/api/regions/:id` - Region update
- DELETE `/api/regions/:id` - Region delete

**Total:** 5 APIs

---

### 4. Offices (`offices.postman_collection.json`)

**APIs:**

- GET `/api/offices` - Sab offices
- POST `/api/offices` - Naya office banao
- GET `/api/offices/:id` - Ek office detail
- PUT `/api/offices/:id` - Office update
- DELETE `/api/offices/:id` - Office delete

**Total:** 5 APIs

---

### 5. Teams (`teams.postman_collection.json`)

**APIs:**

- GET `/api/teams` - Sab teams
- POST `/api/teams` - Naya team banao
- GET `/api/teams/:id` - Ek team detail
- PUT `/api/teams/:id` - Team update
- DELETE `/api/teams/:id` - Team delete

**Total:** 5 APIs

---

### 6. Appointments (`appointments.postman_collection.json`)

**APIs:**

- POST `/api/appointments/sync` - Manual sync (Admin/SuperAdmin)
- GET `/api/appointments/sync-history` - Sync history dekho
- GET `/api/appointments/stats` - Statistics dekho
- GET `/api/appointments/office/:officeName` - Office ke appointments
- GET `/api/appointments/list` - Filter ke saath list (page, limit, office, dates)

**Total:** 5 APIs

---

### 7. Provider Schedule (`provider-schedule.postman_collection.json`)

**APIs:**

- POST `/api/provider-schedule/sync` - Manual sync (Admin/SuperAdmin)
- GET `/api/provider-schedule/stats` - Statistics
- GET `/api/provider-schedule/list` - Schedule list
- POST `/api/provider-schedule/get-by-office-dos` - Office aur date se search

**Total:** 4 APIs

---

### 8. Radio Buttons (`radio-buttons.postman_collection.json`)

**Sections:**

1. **Button Sets** (5 APIs)

   - Create, Read, Update, Delete, List

2. **Radio Buttons** (5 APIs)

   - Individual button CRUD in sets

3. **Bulk Operations** (3 APIs)

   - Bulk create buttons
   - Bulk update buttons
   - Bulk delete buttons

4. **Archive Operations** (4 APIs)

   - Get archived sets
   - Get archived set by ID
   - Restore set
   - Permanently delete

5. **UsedIn Operations** (3 APIs)
   - Add references
   - Remove references
   - Replace all references

**Total:** 20 APIs

---

### 9. Dropdowns (`dropdowns.postman_collection.json`)

**Sections:**

1. **Dropdown Sets** (5 APIs)

   - Create, Read, Update, Delete, List

2. **Dropdown Options** (5 APIs)

   - Individual option CRUD in sets

3. **Bulk Operations** (3 APIs)

   - Bulk create options _(Yahi use karo jab kai options ek saath add karne ho)_
   - Bulk update options
   - Bulk delete options

4. **Archive Operations** (4 APIs)

   - Get archived sets
   - Get archived set by ID
   - Restore set
   - Permanently delete

5. **UsedIn Operations** (3 APIs)
   - Add references
   - Remove references
   - Replace all references

**Total:** 20 APIs

**⭐ Special Note:** Dropdown options bulk add ke liye:

```
POST /api/dropdowns/dropdown-sets/:dropdownSetId/options/bulk
Body: {
  "options": [
    { "label": "Option 1", "value": "opt1", "order": 1 },
    { "label": "Option 2", "value": "opt2", "order": 2 }
  ]
}
```

---

### 10. Walkouts (`walkouts.postman_collection.json`)

**APIs:**

- POST `/api/walkouts/submit-office` - Office section submit karo (formRefId support)
- GET `/api/walkouts` - Sab walkouts (filters: formRefId, officeName, dos)
- GET `/api/walkouts/:id` - Ek walkout detail
- PUT `/api/walkouts/:id/office` - Office section update (full validation)
- DELETE `/api/walkouts/:id` - Walkout delete (Admin/SuperAdmin)

**Total:** 5 APIs

**⭐ Special Features:**

- `formRefId` field - Frontend form ko backend entry se link karne ke liye
- Complete validation with batch errors
- Conditional field saving (sirf required fields save honge)
- Field labels in error messages

---

## 🔧 Variables Explanation

### Collection Variables (Automatically Set)

```javascript
{
  "base_url": "http://localhost:5000",     // API base URL
  "auth_token": "",                         // Auto-saved on login
  "user_id": "",                            // Auto-saved
  "region_id": "",                          // Auto-saved
  "office_id": "",                          // Auto-saved
  "team_id": "",                            // Auto-saved
  "button_set_id": "",                      // Auto-saved
  "button_id": "",                          // Auto-saved
  "dropdown_set_id": "",                    // Auto-saved
  "option_id": "",                          // Auto-saved
  "walkout_id": "",                         // Auto-saved
  "archive_id": ""                          // Auto-saved
}
```

### Kaise Variables Set Hote Hain?

1. **Login karo** → `auth_token`, `user_id` automatically save
2. **Region create/list karo** → `region_id` save
3. **Office create/list karo** → `office_id` save
4. **Team create/list karo** → `team_id` save
5. **Button set create karo** → `button_set_id` save
6. **Dropdown set create karo** → `dropdown_set_id` save
7. **Walkout submit karo** → `walkout_id` save

Har API ke test scripts me automatic ID save ka logic hai!

## 🎯 Testing Workflow (Recommended Order)

### Step 1: Authentication

1. **Signup** ya **Login** karo
   - Token automatically save ho jayega
   - Sabhi protected APIs me use hoga

### Step 2: Basic Setup

1. **Create Region** → region_id save
2. **Create Office** → office_id save
3. **Create Team** → team_id save

### Step 3: Configuration

1. **Create Radio Button Sets** (payment modes, etc.)
2. **Bulk Create Buttons** in those sets
3. **Create Dropdown Sets** (insurance companies, etc.)
4. **Bulk Create Options** in those sets

### Step 4: Main Operations

1. **Submit Walkout** with formRefId
2. **Get Walkouts** with filters
3. **Update Walkout** if needed

## 💡 Pro Tips

### 1. Environment Variables

Agar multiple environments hain (dev, staging, prod):

1. Postman me Environment banao
2. `base_url` variable set karo
3. Baaki sab automatic save honge

### 2. Token Expiry

Token 7 din valid hai. Expire hone par:

1. Phir se login karo
2. Token automatically update ho jayega

### 3. IDs Not Saving?

Agar koi ID save nahi ho raha:

1. API response check karo (200/201 status?)
2. Console logs dekho (✓ ID saved dikhega)
3. Collection variables tab me manually check karo

### 4. Bulk Operations

Jab kai items ek saath add karna ho:

```javascript
// Radio Buttons - Bulk Create
POST /api/radio-buttons/button-sets/{{button_set_id}}/buttons/bulk
{
  "buttons": [
    { "label": "Cash", "value": "cash", "order": 1 },
    { "label": "Card", "value": "card", "order": 2 },
    { "label": "Check", "value": "check", "order": 3 }
  ]
}

// Dropdowns - Bulk Create
POST /api/dropdowns/dropdown-sets/{{dropdown_set_id}}/options/bulk
{
  "options": [
    { "label": "BCBS", "value": "bcbs", "order": 1 },
    { "label": "Aetna", "value": "aetna", "order": 2 },
    { "label": "UHC", "value": "uhc", "order": 3 }
  ]
}
```

### 5. formRefId Usage

Frontend form se backend entry link karne ke liye:

```javascript
// Frontend pe unique ID generate karo
const formRefId = `FORM-${Date.now()}`;

// Walkout submit karte waqt bhejo
{
  "formRefId": formRefId,
  "officeSection": { ... }
}

// Baad me filter kar sakte ho
GET /api/walkouts?formRefId=FORM-1234567890
```

## 🐛 Troubleshooting

### Error: "Token not provided"

**Solution:** Pehle login karo, token automatically save ho jayega

### Error: "Invalid token"

**Solution:** Token expire ho gaya hai, phir se login karo

### Error: "Access denied"

**Solution:** Tumhare role ke permissions check karo (user/admin/superAdmin)

### IDs not auto-saving

**Solution:**

1. Test scripts enabled hain check karo
2. Response 200/201 aa raha hai check karo
3. Console logs dekho

### Bulk create error

**Solution:**

1. Array format sahi hai check karo
2. Required fields (label, value, order) bhare hain check karo
3. Duplicate values nahi hain check karo

## 📞 Support

Agar koi problem ho ya confusion ho:

1. README phir se padho
2. Example requests dekho
3. Console logs check karo
4. API descriptions padho

## 🎉 Summary

- ✅ 10 alag collections (module-wise)
- ✅ 80+ APIs total
- ✅ Automatic token management
- ✅ Auto-save all IDs
- ✅ Complete examples
- ✅ Bulk operations
- ✅ Archive management
- ✅ formRefId support
- ✅ Hindi + English descriptions
- ✅ No manual updates needed

**Happy Testing! 🚀**
