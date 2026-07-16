const app = require("./app");
const connectDatabase = require("./db/Database");
const cloudinary = require("cloudinary").v2;

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Connect Database
connectDatabase();

// Vercel ke liye — app.listen NAHI, sirf export
module.exports = app;