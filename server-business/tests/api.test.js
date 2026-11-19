"use strict";
process.env.NODE_ENV = "test";
process.env.JWT_SECRET =
  "test-only-secret-that-is-at-least-thirty-two-characters-long";
process.env.CLIENT_URL = "http://localhost:5173";

const request = require("supertest");
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const { MongoMemoryServer } = require("mongodb-memory-server");
const app = require("../src/app");
const User = require("../src/modules/users/user.model");
const Applicant = require("../src/modules/applicants/applicant.model");

let mongoServer;
async function createUser({
  name = "Test User",
  email,
  role = "user",
  password = "Test-password-123",
}) {
  return User.create({
    name,
    email,
    role,
    passwordHash: await bcrypt.hash(password, 4),
  });
}
async function login(email, password = "Test-password-123") {
  const response = await request(app)
    .post("/api/auth/login")
    .send({ email, password });
  return response.body.data?.token;
}

afterAll(async () => {
  await mongoose.disconnect();
  if (mongoServer) await mongoServer.stop();
});

beforeAll(async () => {
  mongoServer = await MongoMemoryServer.create();
  await mongoose.connect(mongoServer.getUri(), {
    dbName: "applicant-management-test",
  });
  await Promise.all([User.init(), Applicant.init()]);
});

beforeEach(async () => {
  await Promise.all([User.deleteMany({}), Applicant.deleteMany({})]);
});

test("health endpoint responds even before database readiness is interpreted by client", async () => {
  const response = await request(app).get("/api/health");
  expect(response.status).toBe(200);
  expect(response.body.success).toBe(true);
  expect(response.body.data.database).toBe("connected");
});

test("registration creates a standard user and rejects privilege escalation", async () => {
  const response = await request(app)
    .post("/api/auth/register")
    .send({
      name: "Fayaz Khan",
      email: "fayaz@gmail.com",
      password: "Fayaz-Password-123",
    });
  expect(response.status).toBe(201);
  expect(response.body.data.role).toBe("user");
  expect(response.body.data.passwordHash).toBeUndefined();
  const forbidden = await request(app)
    .post("/api/auth/register")
    .send({
      name: "Admin User",
      email: "admin@example.com",
      password: "Strong-password-123",
      role: "admin",
    });
  expect(forbidden.status).toBe(400);
});

test("login issues a bearer token and invalid credentials are rejected", async () => {
  await createUser({ email: "person@example.com" });
  const success = await request(app)
    .post("/api/auth/login")
    .send({ email: "person@example.com", password: "Test-password-123" });
  expect(success.status).toBe(200);
  expect(success.body.data.tokenType).toBe("Bearer");
  const failure = await request(app)
    .post("/api/auth/login")
    .send({ email: "person@example.com", password: "wrong-password" });
  expect(failure.status).toBe(401);
});

test("applicant CRUD is protected and recruiters can manage applicants", async () => {
  const recruiter = await createUser({
    email: "recruiter@example.com",
    role: "recruiter",
  });
  const token = await login(recruiter.email);
  const unauthorized = await request(app).get("/api/applicants");
  expect(unauthorized.status).toBe(401);
  const created = await request(app)
    .post("/api/applicants")
    .set("Authorization", `Bearer ${token}`)
    .send({
      name: "Applicant One",
      email: "applicant@example.com",
      role: "MERN Developer",
    });
  expect(created.status).toBe(201);
  const id = created.body.data._id;
  const listed = await request(app)
    .get("/api/applicants")
    .set("Authorization", `Bearer ${token}`);
  expect(listed.status).toBe(200);
  expect(listed.body.data.items).toHaveLength(1);
  const updated = await request(app)
    .patch(`/api/applicants/${id}`)
    .set("Authorization", `Bearer ${token}`)
    .send({ status: "interview" });
  expect(updated.status).toBe(200);
  expect(updated.body.data.status).toBe("interview");
  const deleteDenied = await request(app)
    .delete(`/api/applicants/${id}`)
    .set("Authorization", `Bearer ${token}`);
  expect(deleteDenied.status).toBe(403);
});

test("admin can delete applicants and role changes revoke old tokens", async () => {
  const admin = await createUser({ email: "admin@example.com", role: "admin" });
  const applicant = await Applicant.create({
    name: "Applicant Two",
    email: "two@example.com",
    role: "Backend Developer",
  });
  const adminToken = await login(admin.email);
  const removed = await request(app)
    .delete(`/api/applicants/${applicant._id}`)
    .set("Authorization", `Bearer ${adminToken}`);
  expect(removed.status).toBe(200);

  const target = await createUser({ email: "target@example.com" });
  const targetTokenBeforeRoleChange = await login(target.email);
  const changed = await request(app)
    .patch(`/api/users/${target._id}/role`)
    .set("Authorization", `Bearer ${adminToken}`)
    .send({ role: "recruiter" });
  expect(changed.status).toBe(200);
  const revokedTargetToken = await request(app)
    .get("/api/users/me")
    .set("Authorization", `Bearer ${targetTokenBeforeRoleChange}`);
  expect(revokedTargetToken.status).toBe(401);
  const adminStillAuthorized = await request(app)
    .get("/api/users")
    .set("Authorization", `Bearer ${adminToken}`);
  expect(adminStillAuthorized.status).toBe(200);
});

test("users can update profile and change password", async () => {
  const user = await createUser({ email: "profile@example.com" });
  const token = await login(user.email);
  const profile = await request(app)
    .patch("/api/users/me")
    .set("Authorization", `Bearer ${token}`)
    .send({ name: "Updated User" });
  expect(profile.status).toBe(200);
  expect(profile.body.data.name).toBe("Updated User");
  const changed = await request(app)
    .patch("/api/users/me/password")
    .set("Authorization", `Bearer ${token}`)
    .send({
      currentPassword: "Test-password-123",
      newPassword: "New-password-456",
    });
  expect(changed.status).toBe(200);
  const oldToken = await request(app)
    .get("/api/users/me")
    .set("Authorization", `Bearer ${token}`);
  expect(oldToken.status).toBe(401);
});
