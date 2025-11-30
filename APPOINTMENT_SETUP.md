# Appointment Sync System - Quick Setup

## ✅ Files Created

### Models (4 files)

1. **models/PatientAppointment.js** - Active appointments collection (pt-appt)
2. **models/PatientAppointmentArchive.js** - Archived appointments (pt-appt-archive)
3. **models/SyncLog.js** - Sync execution logs (sync-logs)
4. Office.js (existing) - Office data with isActive flag

### Services (1 file)

5. **services/appointmentService.js** - Core sync logic
   - Fetch data from external API
   - Transform columns (c1→patient-id, c2→patient-name, etc.)
   - Sync and deduplicate appointments
   - Archive removed appointments
   - Handle CST timezone
   - Log sync execution

### Controllers (1 file)

6. **controllers/appointmentController.js** - API endpoints
   - Manual sync trigger
   - Get sync history
   - Get appointment stats
   - Get office appointments

### Routes (1 file)

7. **routes/appointmentRoutes.js** - Route definitions
   - POST /api/appointments/sync
   - GET /api/appointments/sync-history
   - GET /api/appointments/stats
   - GET /api/appointments/office/:officeName

### Cron (1 file)

8. **cron/appointmentCron.js** - Scheduled task
   - Runs every 3 hours
   - CST timezone
   - Auto-sync all active offices

### Updated Files

9. **server.js** - Added appointment routes and cron initialization
10. **Walkout-Backend.postman_collection.json** - Added 4 appointment endpoints
11. **package.json** - Added dependencies (axios, node-cron, moment-timezone)

## 🔧 Required Configuration

### Step 1: Add to .env file

```env
# Appointment API Configuration (Optional - default value used if not provided)
APPOINTMENT_API_PASSWORD=134568
```

### Step 2: API is Pre-configured

The system is already configured to use:

- **API Endpoint**: https://www.caplineruleengine.com/googleESReport
- **Default Password**: 134568 (can be overridden in .env)
- **Method**: GET with query parameters

No additional API configuration needed!

## 📋 How It Works

### Data Flow

```
External API (every 3 hours)
    ↓
Fetch data for each active office
    ↓
Transform: c1→patient-id, c2→patient-name, c3→dos, c4→chair-name, c5→insurance-name, c6→insurance-type
    ↓
Compare with existing pt-appt collection
    ↓
New/Updated → Save to pt-appt
Removed → Move to pt-appt-archive
    ↓
Log execution in sync-logs
```

### Special Cases

- **No data from API**: Skip that office (no changes)
- **Office inactive**: Skip that office
- **Duplicate appointment**: Update existing entry
- **API error**: Log as failed, continue with other offices

## 🕐 Cron Schedule

**Pattern**: `0 */3 * * *`  
**Runs at**: 00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00 CST

## 🚀 Testing

### 1. Start Server

```bash
npm run dev
```

You should see:

```
✓ Appointment sync cron job initialized
✓ Schedule: Every 3 hours (0 */3 * * *)
✓ Timezone: America/Chicago (CST)
```

### 2. Manual Sync (via Postman)

```
POST http://localhost:5000/api/appointments/sync
Authorization: Bearer <admin-token>
```

### 3. Check Sync History

```
GET http://localhost:5000/api/appointments/sync-history?limit=30
Authorization: Bearer <admin-token>
```

### 4. View Stats

```
GET http://localhost:5000/api/appointments/stats
Authorization: Bearer <admin-token>
```

### 5. View Office Appointments

```
GET http://localhost:5000/api/appointments/office/Delhi Office?limit=100
Authorization: Bearer <admin-token>
```

## 📊 Database Collections

### pt-appt (Current Appointments)

```javascript
{
  "patient-id": "123",
  "patient-name": "John Doe",
  "dos": "2024-01-15",
  "chair-name": "Chair A",
  "insurance-name": "Blue Cross",
  "insurance-type": "PPO",
  "office-name": "Delhi Office",
  "updated-on": ISODate("2024-01-15T18:00:00.000Z")
}
```

### pt-appt-archive (Removed Appointments)

Same as above + `moved-on` field

### sync-logs (Execution History)

```javascript
{
  "date": "2024-01-15",
  "executions": [
    {
      "executedAt": ISODate("..."),
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
      "triggeredBy": null
    }
  ],
  "totalExecutions": 8,
  "lastSyncAt": ISODate("...")
}
```

## 🔒 Security

- ✅ All endpoints require authentication (JWT)
- ✅ Admin or SuperAdmin role required
- ✅ API key in environment variables
- ✅ Audit trail in sync logs

## 📝 Important Notes

1. **Only active offices** are processed (isActive: true)
2. **No data scenario**: If API returns no data, that office is skipped (no archiving happens)
3. **CST timezone**: All dates and times use America/Chicago timezone
4. **Date range**: Always fetches from first day of last month to today
5. **Duplicate prevention**: Unique index on patient-id + office-name + dos

## 🐛 Troubleshooting

### Cron not running?

- Check console for initialization message
- Ensure server is running continuously
- Check timezone configuration

### API errors?

- Verify .env has correct APPOINTMENT_API_ENDPOINT
- Verify API_KEY is valid
- Check API is accessible
- Check console logs for detailed errors

### No data syncing?

- Verify offices are marked isActive: true
- Check API is returning data
- Call manual sync API to see detailed response
- Check sync-logs collection in MongoDB

## 📚 Documentation

See **APPOINTMENT_SYNC_GUIDE.md** for complete documentation.

## ✨ What's Next?

1. Add your actual API endpoint to .env
2. Test manual sync via Postman
3. Verify data in MongoDB collections
4. Check sync logs for execution history
5. Monitor automatic syncs every 3 hours

---

**All done! System ready to use.** 🎉
