# Applicant Management System — Backend

This is a standalone modular Express + MongoDB backend project. It is separate from any existing backend on your Mac.

## Requirements
- Node.js 20+ (Node 22 recommended)
- MongoDB running locally or a MongoDB connection URI

## First-time setup
1. Open this folder in VS Code.
2. Copy `.env.example` to `.env`.
3. Set `MONGO_URI` and generate a random `JWT_SECRET` with:
   `node -e "console.log(require('node:crypto').randomBytes(48).toString('hex'))"`
4. Install dependencies: `npm install`
5. Start MongoDB.
6. Create the first admin (set these shell variables first, using your own values):
   `BOOTSTRAP_ADMIN_NAME`, `BOOTSTRAP_ADMIN_EMAIL`, `BOOTSTRAP_ADMIN_PASSWORD`
   then run `node scripts/create-admin.js`. The admin password must be at least 12 characters.
7. Start the server with `npm run dev`.
8. Check `http://localhost:5001/api/health`.

## Main endpoints
- `POST /api/auth/register` — standard user registration (cannot self-assign roles)
- `POST /api/auth/login` — returns a 15-minute JWT bearer token
- `GET /api/users/me` — current user profile
- `PATCH /api/users/me` — update current profile
- `PATCH /api/users/me/password` — change password and revoke existing sessions
- `GET /api/users` — admin-only user listing
- `PATCH /api/users/:id/role` — admin-only role change
- `/api/applicants` — protected applicant CRUD; recruiter/admin can read/create/update, only admin can delete

Protected endpoints require `Authorization: Bearer <token>`.

## Tests and checks
- `npm run check` checks JavaScript syntax without starting MongoDB.
- `npm test` runs integration tests using `mongodb-memory-server`; its first run may need to download a MongoDB binary.

## Notes
- Email sending is optional and requires valid SMTP settings in `.env`. The email queue is in-memory, so it is not durable across restarts.
- PDF storage middleware exists but is not exposed through an upload route yet; applicant documents are not publicly served.
- The cleanup job intentionally deletes nothing until a retention policy is defined.
- For Docker Desktop on Mac with MongoDB running on the host, use `mongodb://host.docker.internal:27017/applicant-management` as the container's `MONGO_URI`.
- Do not commit `.env`, uploaded files, or real credentials. Review security and operational requirements before production deployment.
