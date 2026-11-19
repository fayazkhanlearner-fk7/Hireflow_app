"use strict";
const express = require("express");
const controller = require("./auth.controller");
const { registerSchema, loginSchema, validate } = require("./auth.validation");
const router = express.Router();
router.post("/register", validate(registerSchema), controller.register);
router.post("/login", validate(loginSchema), controller.login);
module.exports = router;
