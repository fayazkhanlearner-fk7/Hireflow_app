"use strict";
require("dotenv").config();
const bcrypt = require("bcryptjs");
const {
  connectDatabase,
  disconnectDatabase,
} = require("../src/config/database");
const User = require("../src/modules/users/user.model");
(async () => {
  const {
    MONGO_URI,
    BOOTSTRAP_ADMIN_NAME,
    BOOTSTRAP_ADMIN_EMAIL,
    BOOTSTRAP_ADMIN_PASSWORD,
  } = process.env;
  if (
    !MONGO_URI ||
    !BOOTSTRAP_ADMIN_NAME ||
    !BOOTSTRAP_ADMIN_EMAIL ||
    !BOOTSTRAP_ADMIN_PASSWORD
  )
    throw new Error(
      "Set MONGO_URI, BOOTSTRAP_ADMIN_NAME, BOOTSTRAP_ADMIN_EMAIL, and BOOTSTRAP_ADMIN_PASSWORD in your environment",
    );
  if (BOOTSTRAP_ADMIN_PASSWORD.length < 12)
    throw new Error("Bootstrap admin password must be at least 12 characters");
  await connectDatabase(MONGO_URI);
  const email = BOOTSTRAP_ADMIN_EMAIL.trim().toLowerCase();
  if (await User.exists({ email }))
    throw new Error("A user with that email already exists; no changes made");
  const user = await User.create({
    name: BOOTSTRAP_ADMIN_NAME.trim(),
    email,
    passwordHash: await bcrypt.hash(BOOTSTRAP_ADMIN_PASSWORD, 12),
    role: "admin",
  });
  console.log(`Administrator created: ${user.email}`);
})()
  .catch((error) => {
    console.error(error.message);
    process.exitCode = 1;
  })
  .finally(async () => {
    await disconnectDatabase().catch(() => {});
  });
