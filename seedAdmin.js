require("dotenv").config({ path: "config/.env" });
const mongoose = require("mongoose");
const User = require("./model/user");

const createAdmin = async () => {
  await mongoose.connect(process.env.DB_URL);

  const existingAdmin = await User.findOne({ email: "admin@gmail.com" });
  if (existingAdmin) {
    console.log("Admin already exists");
    process.exit();
  }

  await User.create({
    name: "Super Admin",
    email: "admin@gmail.com",
    password: "Admin@123", // change this
    role: "admin",
  });

  console.log("Admin created successfully");
  process.exit();
};

createAdmin();