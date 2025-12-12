# Walkout Backend Documentation

This folder contains all reference documentation for the Walkout Backend API.

## Documentation Files

### API Documentation

- **API_EXAMPLE.md** - Sample API requests and responses
- **API_TESTING.md** - API testing guide
- **POSTMAN_GUIDE.md** - Guide for using Postman collection

### Feature Documentation

- **APPOINTMENT_SYNC_GUIDE.md** - Appointment sync system guide
- **APPOINTMENT_SETUP.md** - Appointment system setup instructions
- **PROVIDER_SCHEDULE_DOCUMENTATION.md** - Provider schedule sync documentation

### Implementation Guides

- **IMPLEMENTATION_COMPLETE.md** - Complete implementation summary

## Quick Links

### Main Documentation

- [Main README](../README.md) - Project overview and setup
- [Postman Collection](../Walkout-Backend.postman_collection.json) - Complete API collection

### API Base URL

- Development: `http://localhost:5000`
- Production: Update as needed

### Authentication

All authenticated endpoints require a Bearer token in the Authorization header:

```
Authorization: Bearer <your-token>
```

## API Categories

### 1. Authentication

- User signup, login, logout
- Token management

### 2. Users Management

- User CRUD operations
- User activation/deactivation
- Role management

### 3. Regions Management

- Region CRUD operations
- Admin/SuperAdmin only

### 4. Offices Management

- Office CRUD operations
- Office activation/deactivation
- Admin/SuperAdmin only

### 5. Teams Management

- Team CRUD operations
- Team member management
- Admin/SuperAdmin only

### 6. Appointments

- Auto-sync from Capline API (every 3 hours)
- Manual sync trigger (admin only)
- Office-wise appointment viewing
- Archive old appointments

### 7. Provider Schedule

- Auto-sync from Google Sheet (every 2 hours)
- Manual sync trigger (admin only)
- Query by office and date
- Provider schedule listing

## Cron Jobs

### Appointment Sync

- **Schedule**: Every 3 hours (00:00, 03:00, 06:00, 09:00, 12:00, 15:00, 18:00, 21:00 CST)
- **Source**: Capline Rule Engine API
- **Purpose**: Sync patient appointments and archive removed ones

### Provider Schedule Sync

- **Schedule**: Every 2 hours (00:00, 02:00, 04:00, 06:00, 08:00, 10:00, 12:00, 14:00, 16:00, 18:00, 20:00, 22:00 CST)
- **Source**: Google Sheet (Helping tab)
- **Purpose**: Sync provider schedules

## Database Collections

1. **users** - User accounts
2. **regions** - Regional data
3. **offices** - Office information
4. **teams** - Team structures
5. **pt-appt** - Active patient appointments
6. **pt-appt-archive** - Archived appointments
7. **sync-logs** - Sync execution history
8. **provider-schedule** - Provider scheduling data

## Support

For issues or questions, contact the development team.
