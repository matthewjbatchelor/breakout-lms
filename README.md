# Breakout LMS - Learning Management System

Enterprise-grade Learning Management System for Breakout Programme and Mentoring Day initiatives, built with Node.js, Express, PostgreSQL, and vanilla JavaScript.

## Features

### User Management
- 4 role-based access levels: Admin, Mentor, Participant, Viewer
- User authentication with Passport.js and bcrypt
- Active/inactive user status management
- Organization and job title tracking

### Programme Management
- Create and manage Breakout and Mentoring Day programmes
- Programme types: Breakout, Mentoring Day, Other
- Status tracking: Draft, Active, Completed, Archived
- Start/end dates and duration tracking
- Maximum participant limits

### Cohort Management
- Multiple cohorts per programme
- Cohort scheduling and location tracking
- Status management: Scheduled, Active, Completed, Cancelled
- Participant enrollment tracking
- Mentor assignment capabilities

### Enrollment Management
- Enroll participants to cohorts
- Enrollment status tracking: Active, Completed, Withdrawn, Suspended
- Progress tracking with completion percentages
- CSV import/export for bulk operations
- Enrollment statistics and reporting

### Attendance Tracking
- Session-based attendance recording
- Attendance statuses: Present, Absent, Late, Excused
- Filter by cohort and status
- Session naming and notes
- CSV import/export for bulk attendance records
- Attendance rate calculations

### Course & Module Management
- Course creation linked to programmes
- Module support with multiple content types
- Course ordering and publishing status
- Module resources and attachments
- Progress tracking through modules

### Analytics Dashboard
- Real-time LMS metrics and statistics
- Programme status breakdown
- Enrollment statistics and trends
- User role distribution
- Top programmes by enrollment
- Recent activity feed
- Completion rate tracking

## Tech Stack

**Backend:** Node.js, Express.js v5+, PostgreSQL, Passport.js, Bcrypt

**Frontend:** Vanilla JavaScript, Fetch API, Boardwave branding

**Security:** Helmet, CORS, Rate limiting, SQL injection prevention

## Environment Variables

```env
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://user:password@host:port/database
SESSION_SECRET=your-secret-key-here
ADMIN_USERNAME=admin
ADMIN_PASSWORD=your-secure-password
ADMIN_EMAIL=admin@example.com
ALLOWED_ORIGINS=https://yourdomain.railway.app
```

## Installation

```bash
npm install
npm start
```

Access at `http://localhost:3000`

## Railway Deployment

1. Create Railway project
2. Add PostgreSQL database
3. Connect GitHub repository
4. Configure environment variables
5. Deploy automatically

## License

Proprietary - Boardwave Platform

---

Built with Claude Code 🤖
