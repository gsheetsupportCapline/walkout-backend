# Patient Appointment Sync System

## Overview

Automatically sync patient appointment data from external API every 3 hours. Maintains active appointments in `pt-appt` collection and archives removed appointments in `pt-appt-archive` collection.

## Features

- ✅ **Automatic Sync**: Runs every 3 hours (00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00 CST)
- ✅ **Date Range**: Fetches data from first day of last month to today (CST timezone)
- ✅ **Active Offices Only**: Processes only offices marked as active in database
- ✅ **Data Deduplication**: Prevents duplicate appointments
- ✅ **Auto Archiving**: Moves removed appointments to archive collection
- ✅ **Sync Logging**: Tracks every sync execution with success/failure details
- ✅ **Manual Trigger**: Admin can manually trigger sync via API

## Configuration

### Step 1: Environment Variables

Add this variable to your `.env` file:

```env
# Appointment API Configuration
APPOINTMENT_API_PASSWORD=134568
```

### Step 2: API Details

**Endpoint**: `https://www.caplineruleengine.com/googleESReport`

**Method**: GET

**Parameters**:

- `query`: SQL query for fetching appointments
- `selectcolumns`: Columns to select (6 columns)
- `columnCount`: "6"
- `office`: Office name
- `password`: API password

**Response Format**:

```json
{
  "message": "",
  "data": [
    {
      "c1": "24254",
      "c2": "Patricia Rivoire",
      "c3": "2025-11-11",
      "c4": "RECALL (HYG 1)",
      "c5": "Metlife Dental - PPO",
      "c6": "PPO"
    }
  ],
  "status": "OK"
}
```

**Note**: When no data is available, the `data` array will be empty, but `status` will still be "OK".

## Data Flow

### 1. Fetch Data

- Fetches appointment data for each active office
- Date range: First day of last month → Today (CST)
- Calls external API with office name and date range

### 2. Transform Data

API columns are mapped as follows:

| API Column | Database Field | Description         |
| ---------- | -------------- | ------------------- |
| c1         | patient-id     | Patient ID          |
| c2         | patient-name   | Patient Name        |
| c3         | dos            | Date of Service     |
| c4         | chair-name     | Chair Name          |
| c5         | insurance-name | Insurance Name      |
| c6         | insurance-type | Insurance Type      |
| -          | office-name    | Office Name (added) |
| -          | updated-on     | Sync Time (CST)     |

### 3. Sync Process

For each office:

**A. If API Returns Data:**

1. Compare API data with existing appointments
2. **New/Updated**: Insert or update in `pt-appt` collection
3. **Removed**: Move to `pt-appt-archive` with `moved-on` timestamp
4. Log as successful sync

**B. If API Returns No Data:**

1. Skip processing (no changes to database)
2. Log as failed sync with reason "No data received"
3. Existing appointments remain unchanged

### 4. Logging

Every sync execution is logged with:

- Execution timestamp (CST)
- List of successfully synced offices
- List of failed offices (no data received)
- Count of each
- Manual vs automatic trigger
- User who triggered (if manual)

## Database Collections

### 1. pt-appt (PatientAppointment)

Active appointments currently in the system.

```javascript
{
  "patient-id": String,
  "patient-name": String,
  "dos": String,
  "chair-name": String,
  "insurance-name": String,
  "insurance-type": String,
  "office-name": String,
  "updated-on": Date (CST)
}
```

**Unique Index**: `patient-id` + `office-name` + `dos`

### 2. pt-appt-archive (PatientAppointmentArchive)

Appointments that were removed from external API.

```javascript
{
  "patient-id": String,
  "patient-name": String,
  "dos": String,
  "chair-name": String,
  "insurance-name": String,
  "insurance-type": String,
  "office-name": String,
  "updated-on": Date (CST),
  "moved-on": Date (CST)  // When archived
}
```

### 3. sync-logs (SyncLog)

Tracks all sync executions by date.

```javascript
{
  "date": "2024-01-15",  // CST date
  "executions": [
    {
      "executedAt": Date (CST),
      "successfulOffices": {
        "count": 10,
        "offices": ["Office A", "Office B", ...]
      },
      "failedOffices": {
        "count": 2,
        "offices": ["Office C", "Office D"]
      },
      "totalProcessed": 12,
      "manualTrigger": false,
      "triggeredBy": ObjectId (User)
    }
  ],
  "totalExecutions": 8,
  "lastSyncAt": Date (CST)
}
```

## API Endpoints

All endpoints require authentication and admin/superAdmin role.

### 1. Manual Sync

```
POST /api/appointments/sync
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "message": "Appointment sync completed successfully",
  "data": {
    "dateRange": {
      "startDate": "2023-12-01",
      "endDate": "2024-01-15"
    },
    "totalOffices": 15,
    "successfulOffices": {
      "count": 13,
      "offices": ["Office A", "Office B", ...]
    },
    "failedOffices": {
      "count": 2,
      "offices": ["Office C", "Office D"]
    },
    "details": [...]
  }
}
```

### 2. Get Sync History

```
GET /api/appointments/sync-history?limit=30&date=2024-01-15
Authorization: Bearer <token>
```

**Query Parameters:**

- `limit` (optional): Number of days to retrieve (default: 30)
- `date` (optional): Specific date in YYYY-MM-DD format

**Response:**

```json
{
  "success": true,
  "count": 30,
  "data": [
    {
      "date": "2024-01-15",
      "executions": [...],
      "totalExecutions": 8,
      "lastSyncAt": "2024-01-15T21:00:00.000Z"
    }
  ]
}
```

### 3. Get Appointment Statistics

```
GET /api/appointments/stats
Authorization: Bearer <token>
```

**Response:**

```json
{
  "success": true,
  "data": {
    "totalAppointments": 1250,
    "appointmentsByOffice": [
      {
        "_id": "Office A",
        "count": 350
      },
      {
        "_id": "Office B",
        "count": 200
      }
    ],
    "lastSync": "2024-01-15T18:00:00.000Z",
    "lastSyncDetails": {
      "date": "2024-01-15",
      "totalExecutions": 8,
      "lastExecution": {...}
    }
  }
}
```

### 4. Get Office Appointments

```
GET /api/appointments/office/:officeName?limit=100&skip=0
Authorization: Bearer <token>
```

**Query Parameters:**

- `limit` (optional): Number of records (default: 100)
- `skip` (optional): Number of records to skip (default: 0)

**Response:**

```json
{
  "success": true,
  "count": 100,
  "total": 350,
  "data": [
    {
      "patient-id": "123",
      "patient-name": "John Doe",
      "dos": "2024-01-15",
      "chair-name": "Chair A",
      "insurance-name": "Blue Cross",
      "insurance-type": "PPO",
      "office-name": "Office A",
      "updated-on": "2024-01-15T18:00:00.000Z"
    }
  ]
}
```

## Cron Schedule

**Pattern**: `0 */3 * * *`  
**Meaning**: At minute 0 past every 3rd hour  
**Timezone**: America/Chicago (CST)

**Execution Times (CST):**

- 00:00 (Midnight)
- 03:00 (3 AM)
- 06:00 (6 AM)
- 09:00 (9 AM)
- 12:00 (Noon)
- 15:00 (3 PM)
- 18:00 (6 PM)
- 21:00 (9 PM)

## Important Notes

### 1. Office Status

Only offices with `isActive: true` are processed. Inactive offices are skipped entirely.

### 2. No Data Scenario

When API returns no data for an office:

- ✅ No changes to `pt-appt` collection
- ✅ No archiving happens
- ✅ Logged as failed sync
- ✅ Existing appointments remain untouched

This prevents accidental data loss due to API issues.

### 3. Timezone Handling

All timestamps use CST (America/Chicago) timezone:

- `updated-on`: When appointment was synced
- `moved-on`: When appointment was archived
- Sync log dates and times

### 4. Duplicate Prevention

Unique index on `patient-id + office-name + dos` prevents duplicate appointments.

### 5. Data Archiving

Appointments removed from API are:

1. Copied to `pt-appt-archive` with `moved-on` timestamp
2. Deleted from `pt-appt` collection
3. Preserved for historical reference

## Troubleshooting

### Issue 1: Cron Not Running

**Check:**

- Server is running continuously
- No errors in console logs
- Timezone configuration is correct

**Solution:**

```bash
# Check server logs for cron initialization message
✓ Appointment sync cron job initialized
✓ Schedule: Every 3 hours (0 */3 * * *)
```

### Issue 2: API Connection Failed

**Check:**

- `.env` has correct `APPOINTMENT_API_ENDPOINT`
- `.env` has valid `APPOINTMENT_API_KEY`
- API is accessible from server
- API timeout (30 seconds)

**Solution:**
Check sync logs for specific error messages.

### Issue 3: No Data Being Synced

**Check:**

- Offices are marked as `isActive: true`
- API is returning data
- Date range is correct

**Solution:**
Call manual sync API and check response details.

### Issue 4: Duplicate Key Errors

**Check:**

- Unique index is created on collection
- Data format matches expected structure

**Solution:**

```bash
# Rebuild index if needed
db.pt-appt.dropIndex("patient-id_1_office-name_1_dos_1")
# Restart server to recreate index
```

## Monitoring

### Check Last Sync Status

```
GET /api/appointments/stats
```

### View Today's Sync History

```
GET /api/appointments/sync-history?date=2024-01-15
```

### Manually Trigger Sync

```
POST /api/appointments/sync
```

## Development Tips

### Test Sync Locally

```javascript
// Use Postman or similar tool
POST http://localhost:5000/api/appointments/sync
Authorization: Bearer <admin-token>
```

### Monitor Console Logs

```
========================================================
Cron job started at: 2024-01-15T18:00:00.000Z
========================================================
Processing 15 active offices
Date range: 2023-12-01 to 2024-01-15
Successfully synced 150 appointments for office: Office A
Archived 10 appointments for office: Office A
...
Sync completed - Success: 13, Failed: 2
========================================================
```

### Check Database

```javascript
// MongoDB shell
use walkout-backend

// Count active appointments
db["pt-appt"].countDocuments()

// Count archived appointments
db["pt-appt-archive"].countDocuments()

// View today's sync log
db["sync-logs"].findOne({ date: "2024-01-15" })
```

## Security

- ✅ All endpoints require authentication (JWT)
- ✅ Admin or SuperAdmin role required
- ✅ API key stored in environment variables
- ✅ No sensitive data in logs
- ✅ Audit trail in sync logs

## Performance

- Parallel processing of all offices
- Efficient database queries with indexes
- 30-second timeout per API call
- Batch operations for archiving

---

**Built with Node.js, Express, MongoDB, and node-cron**
