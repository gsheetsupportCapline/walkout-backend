# Appointment Sync API Response Structure

## Complete API Response

```javascript
{
  "success": true,
  "message": "Sync completed successfully",

  "dateRange": {
    "startDate": "2025-12-01",  // First day of last month (CST)
    "endDate": "2026-01-25"     // Today (CST)
  },

  "totalOffices": 15,  // Total number of active offices processed

  "successfulOffices": {
    "count": 12,  // Number of successful syncs
    "offices": [  // Simple array of office names (for quick display)
      "Crosby",
      "Dallas",
      "Houston"
    ],
    "details": [  // Detailed data for each successful office
      {
        "officeName": "Crosby",
        "newCount": 5,
        "updatedCount": 3,
        "archivedCount": 2,
        "newAppointments": [ /* See below */ ],
        "updatedAppointments": [ /* See below */ ],
        "archivedAppointments": [ /* See below */ ]
      }
    ]
  },

  "failedOffices": {
    "count": 3,  // Number of failed syncs
    "offices": [  // Simple array of failed office names
      "Office1",
      "Office2"
    ],
    "details": [  // Detailed data for each failed office
      {
        "officeName": "Office1",
        "reason": "timeout of 20000ms exceeded"
      },
      {
        "officeName": "Office2",
        "reason": "No data received"
      }
    ]
  },

  "details": [  // Raw results array (for debugging)
    /* All office results */
  ]
}
```

---

## Detailed Office Data Structure

### Each Office in `successfulOffices.details[]`:

```javascript
{
  "officeName": "Crosby",
  "newCount": 5,        // Number of new appointments added
  "updatedCount": 3,    // Number of appointments updated
  "archivedCount": 2,   // Number of appointments archived

  "newAppointments": [
    // Array of newly added appointments
  ],

  "updatedAppointments": [
    // Array of updated appointments with before/after data
  ],

  "archivedAppointments": [
    // Array of archived appointments
  ]
}
```

---

## 1. New Appointments Structure

**Field:** `newAppointments[]`

Each new appointment contains:

```javascript
{
  "patient-id": "123456",           // String - Patient ID from system
  "patient-name": "John Doe",       // String - Patient full name
  "dos": "2026-01-24",              // String - Date of Service (YYYY-MM-DD)
  "chair-name": "Chair 1",          // String - Chair/location name
  "insurance-name": "Blue Cross",   // String - Insurance company name
  "insurance-type": "PPO"           // String - Insurance type (PPO, HMO, etc.)
}
```

**Example:**

```javascript
"newAppointments": [
  {
    "patient-id": "101234",
    "patient-name": "John Smith",
    "dos": "2026-01-25",
    "chair-name": "Hygiene 1",
    "insurance-name": "Delta Dental",
    "insurance-type": "PPO"
  },
  {
    "patient-id": "101235",
    "patient-name": "Jane Doe",
    "dos": "2026-01-25",
    "chair-name": "Operatory 2",
    "insurance-name": "MetLife",
    "insurance-type": "HMO"
  }
]
```

---

## 2. Updated Appointments Structure

**Field:** `updatedAppointments[]`

Each updated appointment contains **before** and **after** data:

```javascript
{
  "patient-id": "123456",           // String - Patient ID (identifier)
  "patient-name": "John Doe",       // String - Patient name (for easy identification)
  "dos": "2026-01-24",              // String - Date of Service (identifier)

  "before": {
    "patient-name": "John Doe",     // String - Name before update
    "chair-name": "Chair 1",        // String - Chair before update
    "insurance-name": "Blue Cross", // String - Insurance before update
    "insurance-type": "PPO"         // String - Type before update
  },

  "after": {
    "patient-name": "John Doe",     // String - Name after update
    "chair-name": "Chair 2",        // String - Chair after update (CHANGED)
    "insurance-name": "Aetna",      // String - Insurance after update (CHANGED)
    "insurance-type": "HMO"         // String - Type after update (CHANGED)
  }
}
```

**Example:**

```javascript
"updatedAppointments": [
  {
    "patient-id": "101234",
    "patient-name": "John Smith",
    "dos": "2026-01-24",
    "before": {
      "patient-name": "John Smith",
      "chair-name": "Hygiene 1",
      "insurance-name": "Delta Dental",
      "insurance-type": "PPO"
    },
    "after": {
      "patient-name": "John Smith",
      "chair-name": "Hygiene 2",      // Chair changed
      "insurance-name": "Delta Dental",
      "insurance-type": "PPO"
    }
  },
  {
    "patient-id": "101235",
    "patient-name": "Jane Doe",
    "dos": "2026-01-23",
    "before": {
      "patient-name": "Jane Doe",
      "chair-name": "Operatory 2",
      "insurance-name": "MetLife",
      "insurance-type": "HMO"
    },
    "after": {
      "patient-name": "Jane Doe",
      "chair-name": "Operatory 2",
      "insurance-name": "United Healthcare",  // Insurance changed
      "insurance-type": "PPO"                 // Type changed
    }
  }
]
```

---

## 3. Archived Appointments Structure

**Field:** `archivedAppointments[]`

Each archived appointment contains:

```javascript
{
  "patient-id": "123456",           // String - Patient ID
  "patient-name": "John Doe",       // String - Patient full name
  "dos": "2026-01-15",              // String - Date of Service
  "chair-name": "Chair 1",          // String - Chair/location name
  "insurance-name": "Blue Cross",   // String - Insurance company name
  "insurance-type": "PPO"           // String - Insurance type
}
```

**Example:**

```javascript
"archivedAppointments": [
  {
    "patient-id": "101200",
    "patient-name": "Bob Johnson",
    "dos": "2026-01-15",
    "chair-name": "Hygiene 3",
    "insurance-name": "Cigna",
    "insurance-type": "PPO"
  },
  {
    "patient-id": "101201",
    "patient-name": "Alice Williams",
    "dos": "2026-01-16",
    "chair-name": "Operatory 1",
    "insurance-name": "Aetna",
    "insurance-type": "HMO"
  }
]
```

---

## Complete Example Response

```javascript
{
  "success": true,
  "message": "Sync completed successfully",
  "dateRange": {
    "startDate": "2025-12-01",
    "endDate": "2026-01-25"
  },
  "totalOffices": 3,

  "successfulOffices": {
    "count": 2,
    "offices": ["Crosby", "Dallas"],
    "details": [
      {
        "officeName": "Crosby",
        "newCount": 2,
        "updatedCount": 1,
        "archivedCount": 1,

        "newAppointments": [
          {
            "patient-id": "101234",
            "patient-name": "John Smith",
            "dos": "2026-01-25",
            "chair-name": "Hygiene 1",
            "insurance-name": "Delta Dental",
            "insurance-type": "PPO"
          },
          {
            "patient-id": "101235",
            "patient-name": "Jane Doe",
            "dos": "2026-01-25",
            "chair-name": "Operatory 2",
            "insurance-name": "MetLife",
            "insurance-type": "HMO"
          }
        ],

        "updatedAppointments": [
          {
            "patient-id": "101200",
            "patient-name": "Bob Johnson",
            "dos": "2026-01-24",
            "before": {
              "patient-name": "Bob Johnson",
              "chair-name": "Hygiene 1",
              "insurance-name": "Delta Dental",
              "insurance-type": "PPO"
            },
            "after": {
              "patient-name": "Bob Johnson",
              "chair-name": "Hygiene 2",
              "insurance-name": "Delta Dental",
              "insurance-type": "PPO"
            }
          }
        ],

        "archivedAppointments": [
          {
            "patient-id": "101150",
            "patient-name": "Old Patient",
            "dos": "2026-01-10",
            "chair-name": "Hygiene 3",
            "insurance-name": "Cigna",
            "insurance-type": "PPO"
          }
        ]
      },
      {
        "officeName": "Dallas",
        "newCount": 3,
        "updatedCount": 0,
        "archivedCount": 2,
        "newAppointments": [ /* ... */ ],
        "updatedAppointments": [],
        "archivedAppointments": [ /* ... */ ]
      }
    ]
  },

  "failedOffices": {
    "count": 1,
    "offices": ["Houston"],
    "details": [
      {
        "officeName": "Houston",
        "reason": "timeout of 20000ms exceeded"
      }
    ]
  },

  "details": [ /* All raw results */ ]
}
```

---

## Field Summary

### All Appointment Types Share These Fields:

- `patient-id` (String) - Unique patient identifier
- `patient-name` (String) - Full patient name
- `dos` (String) - Date of Service in YYYY-MM-DD format
- `chair-name` (String) - Treatment location/chair name
- `insurance-name` (String) - Insurance company name
- `insurance-type` (String) - Insurance type (PPO, HMO, etc.)

### Updated Appointments Additional Fields:

- `patient-id` (String) - Patient identifier
- `patient-name` (String) - Patient name (for easy identification)
- `dos` (String) - Date of Service
- `before` (Object) - Contains all 4 fields with old values
- `after` (Object) - Contains all 4 fields with new values

### Failed Offices:

- `officeName` (String) - Name of the office
- `reason` (String) - Error message explaining failure

---

## Frontend Usage Examples

### Display Counts

```javascript
const { successfulOffices } = response;
successfulOffices.details.forEach((office) => {
  console.log(`${office.officeName}:`);
  console.log(`  New: ${office.newCount}`);
  console.log(`  Updated: ${office.updatedCount}`);
  console.log(`  Archived: ${office.archivedCount}`);
});
```

### Show New Appointments on Click

```javascript
const office = successfulOffices.details[0];
office.newAppointments.forEach((appt) => {
  console.log(`${appt["patient-name"]} - ${appt.dos}`);
  console.log(`  Chair: ${appt["chair-name"]}`);
  console.log(
    `  Insurance: ${appt["insurance-name"]} (${appt["insurance-type"]})`,
  );
});
```

### Show Updated Appointments Comparison

```javascript
const office = successfulOffices.details[0];
office.updatedAppointments.forEach((appt) => {
  console.log(`Patient: ${appt["patient-name"]} (ID: ${appt["patient-id"]})`);
  console.log(`Date of Service: ${appt.dos}`);
  console.log("Changes:");

  if (appt.before["patient-name"] !== appt.after["patient-name"]) {
    console.log(
      `  Name: ${appt.before["patient-name"]} → ${appt.after["patient-name"]}`,
    );
  }
  if (appt.before["chair-name"] !== appt.after["chair-name"]) {
    console.log(
      `  Chair: ${appt.before["chair-name"]} → ${appt.after["chair-name"]}`,
    );
  }
  if (appt.before["insurance-name"] !== appt.after["insurance-name"]) {
    console.log(
      `  Insurance: ${appt.before["insurance-name"]} → ${appt.after["insurance-name"]}`,
    );
  }
  if (appt.before["insurance-type"] !== appt.after["insurance-type"]) {
    console.log(
      `  Type: ${appt.before["insurance-type"]} → ${appt.after["insurance-type"]}`,
    );
  }
});
```

### Show Archived Appointments

```javascript
const office = successfulOffices.details[0];
office.archivedAppointments.forEach((appt) => {
  console.log(`${appt["patient-name"]} - ${appt.dos}`);
  console.log(`  Was in: ${appt["chair-name"]}`);
  console.log(`  Had insurance: ${appt["insurance-name"]}`);
});
```

---

## Notes

1. **All dates are in CST timezone**
2. **Field names use kebab-case** (with hyphens): `patient-id`, `patient-name`, etc.
3. **Empty arrays** will be returned if no appointments in that category
4. **Updated appointments only track actual changes** - if nothing changed, appointment won't appear here
5. **Archived appointments** = appointments that existed before but are no longer in the API response
6. **All processing happens concurrently** - maximum 20 second timeout per office
7. **No retry logic** - single attempt per office

---

## API Endpoint

**POST** `/api/appointments/sync`

**Authentication Required:** Yes (Admin/Super Admin only)

**Request Body (Optional):**

```javascript
{
  "manualTrigger": true,  // Optional, defaults to false
  "triggeredBy": "user_id_here"  // Optional, user ID who triggered
}
```
