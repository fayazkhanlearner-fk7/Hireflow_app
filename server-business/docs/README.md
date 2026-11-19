<!-- # Applicant Management System API

A modular Express + MongoDB backend with JWT authentication, role-based access control, applicant CRUD, validation, centralized errors, SMTP integration, and local PDF storage.

## Requirements
- Node.js 20 or later
- MongoDB running locally or a MongoDB URI
- npm

## Setup
1. Copy `.env.example` to `.env`.
2. Set `MONGO_URI` and generate a long random `JWT_SECRET`:
   `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`
3. Install dependencies: `npm install`
4. Start MongoDB.
5. Create the first administrator by setting `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_EMAIL`, and `BOOTSTRAP_ADMIN_PASSWORD` in your shell and running `node scripts/create-admin.js`. Use a strong password; these variables are not included in `.env.example` to discourage storing bootstrap credentials long-term.
6. Start the API: `npm run dev` or `npm start`.

## Endpoints
- `GET /api/health` — health status (database status included)
- `POST /api/auth/register` — register a standard user (never grants admin role)
- `POST /api/auth/login` — login, returns a 15-minute bearer token
- `GET /api/users/me` — current user profile (authenticated)
- `PATCH /api/users/me` — update current profile
- `PATCH /api/users/me/password` — change password and revoke existing tokens
- `GET /api/users` — list users (admin)
- `GET /api/users/:id` — get user (admin)
- `PATCH /api/users/:id/role` — change user role (admin)
- `/api/applicants` — list/create/update/delete applicants (admin/recruiter for read/write; admin for delete)

Protected endpoints use `Authorization: Bearer <token>`.

## Roles
- `admin`: manage users and all applicant records
- `recruiter`: create/read/update applicant records
- `user`: self profile and password only

Public registration always creates role `user`. Use the bootstrap script to create the initial administrator.

## File uploads and email
`src/integrations/storageProvider.js` provides a Multer upload middleware for PDF files, but no public upload/download route is mounted yet. The storage directory is private by default. `src/integrations/emailProvider.js` sends mail only when valid SMTP environment variables are configured. The in-memory email queue is not durable; queued messages can be lost on restart.

## Testing
Run `npm test`. Tests use `mongodb-memory-server`, which may need to download a MongoDB binary the first time. If your environment blocks downloads, configure an accessible MongoDB instance and adapt test setup.

## Docker
Build: `docker build -t applicant-management-api .`
The container needs a reachable MongoDB URI. If MongoDB runs on the Mac host under Docker Desktop, use `mongodb://host.docker.internal:27017/applicant-management` for the container's `MONGO_URI`. Never bake `.env` or secrets into the image.

## Security notes
- Keep `.env` private and never commit it.
- JWT secret must be at least 32 characters; generate a cryptographically random value.
- Use HTTPS in production.
- Review CORS, rate limits, MongoDB backups, log retention, upload scanning, and durable background queues before production deployment. -->
