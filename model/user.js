const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

const userSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, "Please enter your name!"],
  },
  email: {
    type: String,
    required: [true, "Please enter your email!"],
    trim: true,
    lowercase: true,
    validate: {
      validator: function (value) {
        return EMAIL_REGEX.test(value);
      },
      message: "Please enter a valid email address",
    },
  },
  password: {
    type: String,
    required: [true, "Please enter your password"],
    minLength: [8, "Password must be at least 8 characters"],
    select: false,
  },
  //phoneNumber: {
  // type: Number,
  //},
  phoneNumber: {
    type: String, 
    default: "",
  },
  role: {
    type: String,
    default: "user",
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  avatar: {
    public_id: {
      type: String,
      default: "",
    },
    url: {
      type: String,
      default: "",
    },
  },
  createdAt: {
    type: Date,
    default: Date.now(),
  },
  resetPasswordToken: String,
  resetPasswordTime: Date,
});

//  Hash password
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});

// jwt token
//userSchema.methods.getJwtToken = function () {
//  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
//   expiresIn: process.env.JWT_EXPIRES,
// });
//};

userSchema.methods.getJwtToken = function (rememberMe = false) {
  return jwt.sign({ id: this._id }, process.env.JWT_SECRET_KEY, {
    expiresIn: rememberMe ? "30d" : "1d",
  });
};

// compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.models.User || mongoose.model("User", userSchema);

/*
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const jwt = require("jsonwebtoken");

const userSchema = new mongoose.Schema({
  name:{
    type: String,
    required: [true, "Please enter your name!"],
  },
  email:{
    type: String,
    required: [true, "Please enter your email!"],
  },
  password:{
    type: String,
    required: [true, "Please enter your password"],
    minLength: [4, "Password should be greater than 4 characters"],
    select: false,
  },
  phoneNumber:{
    type: Number,
  },
  role:{
    type: String,
    default: "user",
  },
  avatar:{
    public_id: {
      type: String,
        default: "",  
     
    },
    url: {
      type: String,
        default: "",  
      
    },
 },
 createdAt:{
  type: Date,
  default: Date.now(),
 },
 resetPasswordToken: String,
 resetPasswordTime: Date,
});


//  Hash password
userSchema.pre("save", async function () {
  if (!this.isModified("password")) return;
  this.password = await bcrypt.hash(this.password, 10);
});


// jwt token
userSchema.methods.getJwtToken = function () {
  return jwt.sign({ id: this._id}, process.env.JWT_SECRET_KEY,{
    expiresIn: process.env.JWT_EXPIRES,
  });
};

// compare password
userSchema.methods.comparePassword = async function (enteredPassword) {
  return await bcrypt.compare(enteredPassword, this.password);
};

//module.exports = mongoose.model("User", userSchema);
module.exports =
  mongoose.models.User || mongoose.model("User", userSchema);

  */
