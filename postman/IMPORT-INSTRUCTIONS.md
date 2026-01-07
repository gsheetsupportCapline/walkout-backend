# Quick Import Instructions

## ⭐ RECOMMENDED: Single File Import

**सबसे आसान तरीका है:**

1. Postman खोलें
2. **Import** button (top-left) पर क्लिक करें
3. **File** tab select करें
4. `Walkout-Complete.postman_collection.json` select करें
5. **Import** button पर क्लिक करें

✅ Done! सारी 80+ APIs एक organized collection में मिल जाएंगी।

---

## Alternative: Individual Module Files

**Development के लिए अगर individual files चाहिए:**

1. Postman खोलें
2. **Import** button पर क्लिक करें
3. **Folder** tab select करें
4. `postman/` folder select करें
5. **Import** button पर क्लिक करें

⚠️ **Note:** हर file एक separate collection बनेगी। ये automatically merge नहीं होंगे।

---

## पहला Request कौन सा Run करें?

### Step 1: Login करो

```
Folder: Authentication
Request: User Login

Body:
{
  "email": "your-email@example.com",
  "password": "your-password"
}
```

✅ Token automatically save हो जाएगा!

### Step 2: Create Basic Entities

**Create Region:**

```
Folder: Regions
Request: Create Region
```

**Create Office:**

```
Folder: Offices
Request: Create Office
(Region ID automatically use hogi)
```

**Create Team:**

```
Folder: Teams
Request: Create Team
(Office ID automatically use hogi)
```

### Step 3: Test Other Modules

अब सारे IDs automatically saved हैं। किसी भी API को test कर सकते हो!

---

## Automatic Features

### ✅ Token Auto-Save

- Login/Signup करते ही token automatically save
- सभी authenticated APIs में automatically use होता है

### ✅ ID Auto-Save

- Create/List APIs से IDs automatically save
- Update/Delete APIs में automatically use होते हैं

### ✅ No Manual Updates

- Token manually paste करने की जरूरत नहीं
- IDs manually copy-paste करने की जरूरत नहीं

---

## Variables (Automatically Saved)

| Variable          | Saved From                | Used In                |
| ----------------- | ------------------------- | ---------------------- |
| `auth_token`      | Login/Signup              | All authenticated APIs |
| `user_id`         | Login/Signup/Create User  | User operations        |
| `region_id`       | Create/List Regions       | Office creation, etc.  |
| `office_id`       | Create/List Offices       | Team creation, etc.    |
| `team_id`         | Create/List Teams         | User creation, etc.    |
| `button_set_id`   | Create/List Button Sets   | Button operations      |
| `button_id`       | Create/List Buttons       | Button update/delete   |
| `dropdown_set_id` | Create/List Dropdown Sets | Dropdown operations    |
| `option_id`       | Create/List Options       | Option update/delete   |
| `walkout_id`      | Create/List Walkouts      | Walkout operations     |

---

## 🔄 Backend Changes के बाद

**अगर backend में changes करते हो:**

### Option A: Individual File Update (Easy)

1. Individual file update करो (e.g., `users.postman_collection.json`)
2. Postman में reimport करो
3. Test करो

### Option B: Main File Direct Update

1. Directly `Walkout-Complete.postman_collection.json` update करो
2. Postman में reimport करो

### Option C: Merge Individual to Main

1. Individual file update करो
2. उसके changes को Walkout-Complete.json में manually merge करो
3. Postman में reimport करो

---

## Need More Details?

देखें: [README.md](./README.md) - Complete documentation with detailed module information
