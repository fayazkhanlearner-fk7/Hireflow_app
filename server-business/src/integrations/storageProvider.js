"use strict";
const fs = require("node:fs");
const path = require("node:path");
const crypto = require("node:crypto");
const multer = require("multer");
const UPLOAD_DIR = path.resolve(
  process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads"),
);
const MAX_FILE_SIZE = 5 * 1024 * 1024;
const storage = multer.diskStorage({
  destination(req, file, callback) {
    fs.mkdir(UPLOAD_DIR, { recursive: true }, (error) =>
      callback(error, UPLOAD_DIR),
    );
  },
  filename(req, file, callback) {
    callback(null, `${crypto.randomUUID()}.pdf`);
  },
});
function fileFilter(req, file, callback) {
  if (file.mimetype !== "application/pdf") {
    const error = new Error("Only PDF files are allowed");
    error.status = 400;
    error.code = "INVALID_FILE_TYPE";
    return callback(error);
  }
  callback(null, true);
}
const upload = multer({
  storage,
  fileFilter,
  limits: { fileSize: MAX_FILE_SIZE, files: 1 },
});
async function deleteFile(filename) {
  if (typeof filename !== "string" || !/^[a-f0-9-]+\.pdf$/i.test(filename)) {
    const error = new Error("Invalid stored filename");
    error.status = 400;
    error.code = "INVALID_FILENAME";
    throw error;
  }
  try {
    await fs.promises.unlink(path.join(UPLOAD_DIR, filename));
    return true;
  } catch (error) {
    if (error.code === "ENOENT") return false;
    throw error;
  }
}
module.exports = { upload, deleteFile, UPLOAD_DIR, MAX_FILE_SIZE };
