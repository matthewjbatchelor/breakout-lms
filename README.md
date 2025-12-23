# Breakout LMS

Learning Management System for the Breakout Programme and Mentoring Day.

## Overview

A custom-built LMS for managing programmes, cohorts, participants, courses, attendance tracking, and analytics. Built with Node.js, Express, PostgreSQL, and vanilla JavaScript.

## Features

- **User Management**: 4 roles (Admin, Mentor, Participant, Viewer)
- **Programme & Cohort Management**: Create and manage multiple programmes and cohorts
- **Course Content**: Create courses with modules, resources, and rich content
- **Enrollment System**: Enroll participants individually or via CSV bulk import
- **Attendance Tracking**: Track session attendance with CSV export
- **Progress Tracking**: Automatic tracking of module completion and progress
- **Analytics Dashboard**: Real-time metrics and reporting
- **Role-Based Access Control**: Secure authorization for all features

## Tech Stack

- **Backend**: Node.js, Express.js v5+
- **Database**: PostgreSQL
- **Authentication**: Passport.js with Local Strategy
- **Session**: PostgreSQL-backed sessions (connect-pg-simple)
- **Frontend**: Vanilla JavaScript, HTML5, CSS3
- **Security**: Helmet, CORS, bcrypt, rate limiting
- **Deployment**: Railway.app

## Quick Start

### Prerequisites

- Node.js >= 18.0.0
- PostgreSQL database

### Installation

1. Clone the repository:
   ```bash
   git clone <repository-url>
   cd breakoutprogramme-and-mentoringday-mvp
   ```

2. Install dependencies:
   ```bash
   npm install
   ```

3. Create `.env` file from template:
   ```bash
   cp .env.example .env
   ```

4. Configure environment variables in `.env`:
   - Set `DATABASE_URL` to your PostgreSQL connection string
   - Set `SESSION_SECRET` to a random secure string
   - Configure admin credentials (`ADMIN_USERNAME`, `ADMIN_PASSWORD`, `ADMIN_EMAIL`)

5. Start the development server:
   ```bash
   npm run dev
   ```

6. Access the application at `http://localhost:3000`

7. Login with admin credentials configured in `.env`

## Project Structure

```
breakout-lms/
├── server/
│   ├── config/           # Database, session, passport configuration
│   ├── models/           # Data models (User, Programme, Cohort, etc.)
│   ├── middleware/       # Authentication and authorization middleware
│   ├── routes/           # API route handlers
│   ├── utils/            # Utility functions (CSV, analytics, etc.)
│   ├── migrations/       # Database migrations
│   └── server.js         # Main Express application
├── public/
│   ├── css/              # Stylesheets
│   ├── js/               # Client-side JavaScript
│   │   ├── admin/        # Admin interface scripts
│   │   ├── shared/       # Shared components
│   │   └── utils/        # Utility functions
│   └── index.html        # Main HTML file
└── uploads/              # File uploads storage
```

## Database

The application automatically runs migrations on startup to create all necessary tables:

- `users` - User accounts with 4 roles
- `programmes` - Breakout/Mentoring Day programmes
- `cohorts` - Multiple cohorts per programme
- `courses` - Courses within programmes
- `modules` - Lessons/content within courses
- `module_resources` - Files and links
- `enrollments` - Participant enrollment tracking
- `mentor_assignments` - Mentor-to-cohort assignments
- `attendance_records` - Session attendance
- `progress_tracking` - Module completion tracking
- `assessments` - Quizzes and assignments
- `discussion_threads` & `discussion_posts` - Forum functionality
- `engagement_logs` - Activity tracking
- `notifications` - User notifications
- `import_history` - Data migration tracking
- `session` - Session storage

## User Roles

1. **Admin**: Full access to all features (create programmes, manage users, etc.)
2. **Mentor**: Manage assigned cohorts, track attendance, view progress
3. **Participant**: Access enrolled courses, track personal progress
4. **Viewer**: Read-only access to analytics and reports

## Default Credentials

After first startup, login with the admin credentials set in your `.env` file:

- Username: `admin` (or value from `ADMIN_USERNAME`)
- Password: (value from `ADMIN_PASSWORD`)

**Important**: Change the admin password immediately after first login!

## Deployment

### Railway.app

1. Create a new Railway project
2. Add PostgreSQL database service
3. Connect your GitHub repository
4. Add environment variables from `.env.example`
5. Railway will auto-deploy on push to `main` branch

The `railway.json` configuration is already included.

### Environment Variables for Production

Required environment variables:
- `DATABASE_URL` - PostgreSQL connection string (provided by Railway)
- `SESSION_SECRET` - Secure random string
- `ADMIN_USERNAME` - Admin username
- `ADMIN_PASSWORD` - Strong admin password
- `ADMIN_EMAIL` - Admin email
- `NODE_ENV=production`
- `ALLOWED_ORIGINS` - Your Railway domain (e.g., `https://your-app.railway.app`)

## API Endpoints

### Authentication
- `POST /api/auth/login` - Login
- `POST /api/auth/logout` - Logout
- `GET /api/auth/session` - Check session status

### Coming Soon
- Programme management endpoints
- Cohort management endpoints
- User management endpoints
- Course & module endpoints
- Enrollment endpoints
- Attendance endpoints
- Analytics endpoints

## Development

### Run in Development Mode

```bash
npm run dev
```

This uses `nodemon` to auto-restart the server on file changes.

### Production Build

```bash
npm start
```

## Security Features

- Bcrypt password hashing (12 rounds)
- PostgreSQL-backed sessions (no memory store)
- HTTPS-only cookies in production
- CSRF protection (SameSite cookies)
- SQL injection prevention (parameterized queries)
- XSS prevention (Helmet CSP headers)
- Rate limiting (100 requests per 15 minutes)
- File upload validation (MIME type, size limits)
- Role-based access control

## Contributing

This is a custom LMS for Boardwave's Breakout Programme and Mentoring Day.

## License

ISC

## Support

For issues or questions, please contact the development team.
