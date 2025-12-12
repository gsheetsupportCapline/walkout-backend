PROVIDER SCHEDULE SYNC SYSTEM - COMPLETE DOCUMENTATION

OVERVIEW:
Automatically syncs provider schedule data from Google Sheet "Helping" tab every 2 hours to MongoDB collection "provider-schedule"

GOOGLE SHEET DETAILS:
Sheet ID: 1GK8lWBc3rXgtnm6hzxcFS_ueS0QGb5tBGaKdskSFzuA
Tab Name: Helping
Data Range: A1:G (No headers)

COLUMN MAPPING:
Column A: Date of Service (dos)
Column B: Office Name (office-name)
Column C: Provider Code (provider-code)
Column D: Provider/Hygienist (provider-hygienist) - Examples: Doc - 1, Doc - 2, Hyg - 1, Hyg - 2, etc.
Column E: Provider Code with Type (provider-code-with-type)
Column F: Provider Full Name (provider-full-name)
Column G: Provider Type (provider-type)

DATABASE:
Collection: provider-schedule
Unique Index: office-name + dos + provider-code (prevents duplicates)

CRON JOB:
Schedule: Every 2 hours
Cron Expression: 0 _/2 _ \* \*
Run Times: 00:00, 02:00, 04:00, 06:00, 08:00, 10:00, 12:00, 14:00, 16:00, 18:00, 20:00, 22:00 CST
Timezone: America/Chicago (CST)

SYNC LOGIC:

1. Fetch data from Google Sheet with 3 retry attempts
2. If all retries fail, keep existing database data as is
3. For each row in sheet:
   - Check if record exists (match by office-name + dos + provider-code)
   - If exists and provider details changed: UPDATE with new timestamp
   - If exists and no changes: SKIP (keep old timestamp)
   - If not exists: INSERT new record
4. Records in DB but NOT in sheet: KEEP AS IS (no deletion)

UPDATE CONDITIONS:
Only updates if any of these fields change:

- provider-hygienist
- provider-code-with-type
- provider-full-name
- provider-type

RETRY LOGIC:

- 3 attempts to fetch data from Google Sheet
- 5 second delay between retries
- If all fail: Existing data remains unchanged

API ENDPOINTS:

1. MANUAL SYNC (Admin/SuperAdmin only)
   POST /api/provider-schedule/sync
   Authorization: Bearer <token>
   Response:
   {
   "success": true,
   "message": "Provider schedule sync completed",
   "data": {
   "success": true,
   "message": "Provider schedule sync completed",
   "inserted": 5,
   "updated": 3,
   "skipped": 12,
   "total": 20
   }
   }

2. GET PROVIDER SCHEDULE LIST (All authenticated users)
   GET /api/provider-schedule/list

Query Parameters:
officeName (string, optional) - Filter by office name
startDate (string, optional) - DOS start date (YYYY-MM-DD)
endDate (string, optional) - DOS end date (YYYY-MM-DD)
providerCode (string, optional) - Search by provider code
providerType (string, optional) - Filter by provider type
limit (number, optional) - Records per page (default: 100)
skip (number, optional) - Skip records for pagination (default: 0)
sortBy (string, optional) - Sort field (default: "dos")
sortOrder (string, optional) - "asc" or "desc" (default: "desc")

Example Request:
GET /api/provider-schedule/list?officeName=ABC Dental&startDate=2025-12-01&endDate=2025-12-31

Response:
{
"success": true,
"count": 3,
"total": 3,
"filters": {
"officeName": "ABC Dental",
"startDate": "2025-12-01",
"endDate": "2025-12-31",
"providerCode": null,
"providerType": null
},
"pagination": {
"limit": 100,
"skip": 0,
"hasMore": false
},
"data": [
{
"_id": "674c1a2b3d4e5f6a7b8c9d0e",
"dos": "2025-12-15",
"office-name": "ABC Dental",
"provider-code": "DOC001",
"provider-hygienist": "Doc - 1",
"provider-code-with-type": "DOC001-DENTIST",
"provider-full-name": "Dr. John Smith",
"provider-type": "Dentist",
"updated-on": "2025-12-12 10:30:00 CST"
},
{
"_id": "674c1a2b3d4e5f6a7b8c9d0f",
"dos": "2025-12-16",
"office-name": "ABC Dental",
"provider-code": "HYG001",
"provider-hygienist": "Hyg - 1",
"provider-code-with-type": "HYG001-HYGIENIST",
"provider-full-name": "Sarah Johnson",
"provider-type": "Hygienist",
"updated-on": "2025-12-12 10:30:00 CST"
},
{
"_id": "674c1a2b3d4e5f6a7b8c9d10",
"dos": "2025-12-17",
"office-name": "ABC Dental",
"provider-code": "DOC002",
"provider-hygienist": "Doc - 2",
"provider-code-with-type": "DOC002-DENTIST",
"provider-full-name": "Dr. Michael Brown",
"provider-type": "Dentist",
"updated-on": "2025-12-12 10:30:00 CST"
}
]
}

3. GET STATISTICS (Admin/SuperAdmin only)
   GET /api/provider-schedule/stats
   Authorization: Bearer <token>

Response:
{
"success": true,
"data": {
"totalRecords": 150,
"schedulesByOffice": [
{ "_id": "ABC Dental", "count": 45 },
{ "_id": "XYZ Clinic", "count": 38 }
],
"schedulesByProviderType": [
{ "_id": "Dentist", "count": 85 },
{ "_id": "Hygienist", "count": 65 }
]
}
}

RESPONSE FIELD DESCRIPTIONS:
\_id (string) - MongoDB document ID
dos (string) - Date of Service
office-name (string) - Office name
provider-code (string) - Provider code
provider-hygienist (string) - Provider/Hygienist designation (Doc - 1, Hyg - 1, etc)
provider-code-with-type (string) - Provider code with type
provider-full-name (string) - Provider full name
provider-type (string) - Provider type (Dentist, Hygienist, etc)
updated-on (string) - Last update timestamp in CST

FILES CREATED:

1. models/ProviderSchedule.js - Database model
2. services/providerScheduleService.js - Sync logic with retry
3. controllers/providerScheduleController.js - API controllers
4. routes/providerScheduleRoutes.js - API routes
5. cron/providerScheduleCron.js - Cron job (every 2 hours)
6. server.js - Updated with new routes and cron initialization

TESTING:

1. Start server: npm run dev
2. Manual sync: POST /api/provider-schedule/sync (with admin token)
3. Check data: GET /api/provider-schedule/list
4. View stats: GET /api/provider-schedule/stats (with admin token)

IMPORTANT NOTES:

- Credentials file required: credentials.json in root directory for Google Sheets API
- No data deletion: Records in DB but not in sheet are preserved
- Smart updates: Only updates when actual changes detected
- Retry mechanism: 3 attempts with 5 second delays
- If sync fails: Existing data remains unchanged
- Timezone: All timestamps in CST (America/Chicago)
