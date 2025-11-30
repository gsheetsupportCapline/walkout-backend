# Appointment API - Example Requests & Responses

## API Endpoint Details

**Base URL**: `https://www.caplineruleengine.com/googleESReport`

**Method**: GET

**Authentication**: Password-based (password parameter)

---

## Example Request

### URL Structure

```
https://www.caplineruleengine.com/googleESReport?query=<SQL_QUERY>&selectcolumns=<COLUMNS>&columnCount=6&office=<OFFICE_NAME>&password=<PASSWORD>
```

### Actual Example

```
https://www.caplineruleengine.com/googleESReport?query=from patient p JOIN appointment a JOIN chairs c ON a.location_id=c.chair_num JOIN appt_types ap ON ap.type_id = a.appointment_type_id LEFT JOIN employer e ON e.employer_id = p.prim_employer_id LEFT JOIN insurance_company i ON i.insurance_company_id = e.insurance_company_id  WHERE (a.confirmation_status = 0 OR a.confirmation_status = 1 OR a.confirmation_status = 2) AND LOWER(c.chair_name) not Like '%25ortho%25' AND Date(a.start_time) BETWEEN '10/1/2025' AND '12/1/2025'&selectcolumns=p.patient_id,(p.first_name%2B' '%2Bp.last_name),Date(a.start_time),c.chair_name,i.name,ap.description&columnCount=6&office=Jasper&password=134568
```

### Parameters

| Parameter     | Value            | Description                                                             |
| ------------- | ---------------- | ----------------------------------------------------------------------- |
| query         | SQL query string | Filters appointments by confirmation status, chair type, and date range |
| selectcolumns | Column list      | 6 columns: patient_id, name, date, chair, insurance, type               |
| columnCount   | 6                | Number of columns to return                                             |
| office        | Office name      | Name of the office (e.g., "Jasper")                                     |
| password      | 134568           | API authentication password                                             |

### Date Format in Query

**Format**: M/D/YYYY (e.g., 10/1/2025, 12/1/2025)

**Note**: System automatically converts from YYYY-MM-DD to M/D/YYYY format

---

## Example Response

### Success with Data

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
    },
    {
      "c1": "4382",
      "c2": "Natalie Jordan",
      "c3": "2025-10-02",
      "c4": "RECALL (HYG 1)",
      "c5": "MCNA - MEDICAID",
      "c6": "CHILD MEDICAID - MCNA"
    },
    {
      "c1": "4381",
      "c2": "Rachel ANN. Jordan",
      "c3": "2025-10-02",
      "c4": "RECALL (HYG 1)",
      "c5": "MCNA - MEDICAID",
      "c6": "CHILD MEDICAID - MCNA"
    }
  ],
  "status": "OK"
}
```

### Success with No Data

```json
{
  "message": "",
  "data": [],
  "status": "OK"
}
```

**Important**: When no appointments are found, the `data` array is empty but `status` remains "OK". System checks array length to determine if data exists.

---

## Column Mapping

System automatically transforms API columns to database fields:

| API Column | Database Field        | Example Value          |
| ---------- | --------------------- | ---------------------- |
| c1         | patient-id            | "24254"                |
| c2         | patient-name          | "Patricia Rivoire"     |
| c3         | dos (date of service) | "2025-11-11"           |
| c4         | chair-name            | "RECALL (HYG 1)"       |
| c5         | insurance-name        | "Metlife Dental - PPO" |
| c6         | insurance-type        | "PPO"                  |
| -          | office-name           | "Jasper" (added)       |
| -          | updated-on            | ISODate (CST, added)   |

---

## SQL Query Details

### Base Query Structure

```sql
from patient p
JOIN appointment a
JOIN chairs c ON a.location_id=c.chair_num
JOIN appt_types ap ON ap.type_id = a.appointment_type_id
LEFT JOIN employer e ON e.employer_id = p.prim_employer_id
LEFT JOIN insurance_company i ON i.insurance_company_id = e.insurance_company_id
WHERE
  (a.confirmation_status = 0 OR a.confirmation_status = 1 OR a.confirmation_status = 2)
  AND LOWER(c.chair_name) not Like '%ortho%'
  AND Date(a.start_time) BETWEEN '${startDate}' AND '${endDate}'
```

### Query Filters

1. **Confirmation Status**: 0, 1, or 2 (confirmed/scheduled appointments)
2. **Chair Type**: Excludes chairs with 'ortho' in the name (orthodontic appointments)
3. **Date Range**: Between start and end dates (dynamic)

### Selected Columns

```sql
p.patient_id,
(p.first_name + ' ' + p.last_name),
Date(a.start_time),
c.chair_name,
i.name,
ap.description
```

---

## Testing with cURL

### Test Single Office

```bash
curl -X GET "https://www.caplineruleengine.com/googleESReport?query=from%20patient%20p%20JOIN%20appointment%20a%20JOIN%20chairs%20c%20ON%20a.location_id=c.chair_num%20JOIN%20appt_types%20ap%20ON%20ap.type_id%20=%20a.appointment_type_id%20LEFT%20JOIN%20employer%20e%20ON%20e.employer_id%20=%20p.prim_employer_id%20LEFT%20JOIN%20insurance_company%20i%20ON%20i.insurance_company_id%20=%20e.insurance_company_id%20%20WHERE%20(a.confirmation_status%20=%200%20OR%20a.confirmation_status%20=%201%20OR%20a.confirmation_status%20=%202)%20AND%20LOWER(c.chair_name)%20not%20Like%20'%25ortho%25'%20AND%20Date(a.start_time)%20BETWEEN%20'10/1/2025'%20AND%20'12/1/2025'&selectcolumns=p.patient_id,(p.first_name%2B'%20'%2Bp.last_name),Date(a.start_time),c.chair_name,i.name,ap.description&columnCount=6&office=Jasper&password=134568"
```

### Test with Different Office

Just change the `office` parameter:

```bash
office=Delhi Office
office=Mumbai Office
office=Bangalore Office
```

---

## Error Handling

### Timeout

If request takes longer than 60 seconds, system will timeout and retry on next scheduled sync.

### API Unavailable

If API is unreachable, error is logged and office is marked as failed in sync log.

### Invalid Office Name

If office name doesn't exist in Capline system, API returns empty data array.

---

## System Behavior

### When Data is Received

1. ✅ Transform columns (c1→patient-id, etc.)
2. ✅ Add office-name and updated-on fields
3. ✅ Upsert into pt-appt collection
4. ✅ Archive appointments no longer in API
5. ✅ Log as successful sync

### When No Data is Received (Empty Array)

1. ⚠️ Skip processing for that office
2. ⚠️ Do NOT modify pt-appt collection
3. ⚠️ Do NOT archive any appointments
4. ⚠️ Log as failed sync with reason "No data received"

**Why?** This prevents accidental data loss if API has temporary issues or office is closed.

---

## Integration in System

### Automatic Sync (Cron)

```javascript
// Runs every 3 hours
cron.schedule(
  "0 */3 * * *",
  async () => {
    await syncAllAppointments({
      manualTrigger: false,
      triggeredBy: null,
    });
  },
  { timezone: "America/Chicago" }
);
```

### Manual Sync (API Endpoint)

```javascript
// Admin triggers via API
POST / api / appointments / sync;
Authorization: Bearer <
  admin - token >
  (await syncAllAppointments({
    manualTrigger: true,
    triggeredBy: req.user._id,
  }));
```

---

## Date Range Logic

### Current Implementation

**Start Date**: First day of last month  
**End Date**: Today

**Example** (if today is December 15, 2025):

- Start: November 1, 2025
- End: December 15, 2025

### Code

```javascript
const today = moment().tz("America/Chicago");
const firstDayLastMonth = today.clone().subtract(1, "month").startOf("month");

return {
  startDate: firstDayLastMonth.format("YYYY-MM-DD"), // 2025-11-01
  endDate: today.format("YYYY-MM-DD"), // 2025-12-15
};
```

### Date Conversion for API

System converts YYYY-MM-DD to M/D/YYYY:

```javascript
const formatDateForAPI = (date) => {
  const d = new Date(date);
  return `${d.getMonth() + 1}/${d.getDate()}/${d.getFullYear()}`;
};

// 2025-11-01 → 11/1/2025
// 2025-12-15 → 12/15/2025
```

---

## Security Notes

1. **Password**: Stored in environment variable (APPOINTMENT_API_PASSWORD)
2. **Default**: Uses 134568 if not configured
3. **API Endpoints**: Admin/SuperAdmin authentication required
4. **Logging**: All sync executions tracked with user ID (if manual)

---

**For complete implementation details, see `services/appointmentService.js`**
