// Load environment config in dev
if (process.env.NODE_ENV !== "PRODUCTION") {
  require("dotenv").config({ path: "config/.env" });
}
const express = require("express");
const cookieParser = require("cookie-parser");
const bodyParser = require("body-parser");
const cors = require("cors");
const ErrorHandler = require("./middleware/error");
const app = express();

// Middleware
app.use(cookieParser());
app.use(express.json({ limit: "20mb" }));
app.use(bodyParser.urlencoded({ extended: true, limit: "20mb" }));

// Enable CORS for frontend
app.use(
  cors({
    // origin: "http://localhost:3000",
    origin: process.env.FRONTEND_URL || "http://localhost:3000",
    credentials:true,
})
);
// Health check
app.get("/test", (req, res) => {
  res.send(" Backend server is running");
});

// Import routes
const user = require("./controller/auth");
const resume = require("./controller/resume");
const admin = require("./controller/admin");
const atsCheck = require("./controller/atsCheck");

// Mount routes
app.use("/api/v2/user", user);
app.use("/api/v2/resume", resume);
app.use("/api/v2/admin", admin);
app.use("/api/v2/ats", atsCheck);

// Error Handler (must come last)
app.use(ErrorHandler);

module.exports = app;
