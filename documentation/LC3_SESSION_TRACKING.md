# LC3 Session Tracking Implementation

## Overview

Session tracking feature allows teams to track the time spent working on each walkout in the LC3 section.

---

## Database Schema

### LC3 Session Schema

```javascript
{
  user: ObjectId (ref: User),
  startDateTime: Date,
  endDateTime: Date,
  duration: Number (in seconds)
}
```

### Sessions Field in LC3 Section

```javascript
{
  sessions: {
    list: [LC3SessionSchema], // Array of all sessions
    total: Number // Total duration in seconds across all sessions
  }
}
```

---

## How It Works

1. **User Opens Walkout**: Frontend notes the start time
2. **User Submits LC3**: Frontend sends both start and end time
3. **Backend Calculates Duration**: `(endDateTime - startDateTime) / 1000` seconds
4. **Session Added**: New session object is pushed to `sessions.list`
5. **Total Updated**: `sessions.total` is incremented by the new duration

---

## API Usage

### Endpoint

```
POST /api/walkouts/:id/lc3
```

### Request Parameters

```javascript
{
  // Existing LC3 fields
  "ruleEngine": {...},
  "documentCheck": {...},

  // NEW: Session tracking fields
  "sessionStartDateTime": "2026-01-29T10:00:00Z", // ISO 8601 format
  "sessionEndDateTime": "2026-01-29T10:45:00Z",   // ISO 8601 format

  // Other fields
  "currentStatus": "LC3 In Progress",
  "pendingWith": "Provider"
}
```

### Response Example

```javascript
{
  "success": true,
  "message": "LC3 section updated successfully",
  "data": {
    "lc3Section": {
      "sessions": {
        "list": [
          {
            "_id": "abc123",
            "user": "userId789",
            "startDateTime": "2026-01-29T10:00:00Z",
            "endDateTime": "2026-01-29T10:45:00Z",
            "duration": 2700, // 45 minutes in seconds
            "createdAt": "2026-01-29T10:45:00Z",
            "updatedAt": "2026-01-29T10:45:00Z"
          },
          {
            "_id": "def456",
            "user": "userId999",
            "startDateTime": "2026-01-29T14:00:00Z",
            "endDateTime": "2026-01-29T14:30:00Z",
            "duration": 1800, // 30 minutes in seconds
            "createdAt": "2026-01-29T14:30:00Z",
            "updatedAt": "2026-01-29T14:30:00Z"
          }
        ],
        "total": 4500 // 75 minutes total (2700 + 1800)
      }
    }
  }
}
```

---

## Frontend Integration

### Step 1: Capture Start Time (When Opening Walkout)

```javascript
// When user opens LC3 section for a walkout
const sessionStartTime = new Date().toISOString();
localStorage.setItem(`walkout_${walkoutId}_sessionStart`, sessionStartTime);
```

### Step 2: Send Start and End Time (When Submitting)

```javascript
// When user submits LC3 section
const sessionStartTime = localStorage.getItem(`walkout_${walkoutId}_sessionStart`);
const sessionEndTime = new Date().toISOString();

const formData = new FormData();
formData.append('ruleEngine', JSON.stringify({...}));
formData.append('sessionStartDateTime', sessionStartTime);
formData.append('sessionEndDateTime', sessionEndTime);

await fetch(`/api/walkouts/${walkoutId}/lc3`, {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`
  },
  body: formData
});

// Clear the start time from localStorage
localStorage.removeItem(`walkout_${walkoutId}_sessionStart`);
```

### Step 3: Display Session Data

```javascript
// Fetch walkout with session data
const response = await fetch(`/api/walkouts/${walkoutId}`, {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});

const { data: walkout } = await response.json();

// Display total time
const totalSeconds = walkout.lc3Section.sessions.total;
const totalMinutes = Math.floor(totalSeconds / 60);
const totalHours = Math.floor(totalMinutes / 60);
const remainingMinutes = totalMinutes % 60;

console.log(`Total time spent: ${totalHours}h ${remainingMinutes}m`);

// Display individual sessions
walkout.lc3Section.sessions.list.forEach((session) => {
  const durationMinutes = Math.floor(session.duration / 60);
  console.log(`Session by ${session.user}: ${durationMinutes} minutes`);
});
```

---

## Use Cases

### 1. Track Individual Work Sessions

```javascript
// Session 1: Morning work
{
  user: "userId123",
  startDateTime: "2026-01-29T09:00:00Z",
  endDateTime: "2026-01-29T10:30:00Z",
  duration: 5400 // 90 minutes
}

// Session 2: Afternoon work
{
  user: "userId123",
  startDateTime: "2026-01-29T14:00:00Z",
  endDateTime: "2026-01-29T15:00:00Z",
  duration: 3600 // 60 minutes
}

// Total: 9000 seconds = 150 minutes = 2.5 hours
```

### 2. Track Multiple Users Working on Same Walkout

```javascript
{
  sessions: {
    list: [
      {
        user: "userId_TeamMemberA",
        duration: 3600 // 1 hour
      },
      {
        user: "userId_TeamMemberB",
        duration: 2700 // 45 minutes
      },
      {
        user: "userId_TeamMemberA", // Came back later
        duration: 1800 // 30 minutes
      }
    ],
    total: 8100 // 2 hours 15 minutes total
  }
}
```

### 3. Analytics and Reporting

```javascript
// Find walkouts with high time spent
const slowWalkouts = await Walkout.find({
  "lc3Section.sessions.total": { $gt: 7200 }, // More than 2 hours
});

// Get average time per walkout
const walkouts = await Walkout.aggregate([
  { $match: { "lc3Section.sessions.total": { $exists: true } } },
  {
    $group: {
      _id: null,
      avgTime: { $avg: "$lc3Section.sessions.total" },
    },
  },
]);

// Get time spent by specific user
const userSessions = await Walkout.aggregate([
  { $unwind: "$lc3Section.sessions.list" },
  { $match: { "lc3Section.sessions.list.user": userId } },
  {
    $group: {
      _id: "$lc3Section.sessions.list.user",
      totalTime: { $sum: "$lc3Section.sessions.list.duration" },
    },
  },
]);
```

---

## Helper Functions

### Convert Seconds to Human Readable Format

```javascript
function formatDuration(seconds) {
  const hours = Math.floor(seconds / 3600);
  const minutes = Math.floor((seconds % 3600) / 60);
  const secs = seconds % 60;

  if (hours > 0) {
    return `${hours}h ${minutes}m`;
  } else if (minutes > 0) {
    return `${minutes}m ${secs}s`;
  } else {
    return `${secs}s`;
  }
}

// Usage
const total = walkout.lc3Section.sessions.total;
console.log(`Total: ${formatDuration(total)}`);
// Output: "Total: 2h 15m"
```

### Get Sessions by User

```javascript
function getSessionsByUser(walkout, userId) {
  return walkout.lc3Section.sessions.list.filter(
    (session) => session.user.toString() === userId.toString(),
  );
}

// Usage
const userSessions = getSessionsByUser(walkout, currentUserId);
const userTotalTime = userSessions.reduce((sum, s) => sum + s.duration, 0);
```

---

## Important Notes

1. **Time Zone Handling**: All times are stored in UTC. Frontend should convert to local timezone for display.

2. **Precision**: Duration is stored in seconds for accuracy.

3. **Session Validation**:
   - Both `sessionStartDateTime` and `sessionEndDateTime` must be provided together
   - End time must be after start time
   - Frontend is responsible for sending valid times

4. **Data Accumulation**: Sessions continuously accumulate. There's no limit on the number of sessions.

5. **Populate User Data**: When fetching walkouts, populate session users:
   ```javascript
   const walkout = await Walkout.findById(id).populate(
     "lc3Section.sessions.list.user",
     "name email",
   );
   ```

---

## Testing Examples

### Test 1: Single Session

```javascript
// Request
POST /api/walkouts/123/lc3
{
  "sessionStartDateTime": "2026-01-29T10:00:00Z",
  "sessionEndDateTime": "2026-01-29T10:30:00Z"
}

// Expected: duration = 1800 seconds (30 minutes)
// Expected: total = 1800 seconds
```

### Test 2: Multiple Sessions

```javascript
// First session
POST /api/walkouts/123/lc3
{
  "sessionStartDateTime": "2026-01-29T10:00:00Z",
  "sessionEndDateTime": "2026-01-29T10:30:00Z"
}
// Result: total = 1800

// Second session
POST /api/walkouts/123/lc3
{
  "sessionStartDateTime": "2026-01-29T14:00:00Z",
  "sessionEndDateTime": "2026-01-29T15:00:00Z"
}
// Result: total = 5400 (1800 + 3600)
```

### Test 3: Without Session Data

```javascript
// Request without session tracking
POST /api/walkouts/123/lc3
{
  "ruleEngine": {...}
  // No sessionStartDateTime or sessionEndDateTime
}

// Expected: No new session added, total remains unchanged
```

---

## Summary

- ✅ Session tracking added to LC3 section
- ✅ Stores user, start/end time, and duration for each session
- ✅ Maintains running total across all sessions
- ✅ Frontend sends session data when submitting LC3 section
- ✅ Supports multiple users working on same walkout
- ✅ Enables time-based analytics and reporting
