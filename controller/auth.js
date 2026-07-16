const express = require("express");
const router = express.Router();
const User = require("../model/user");
const cloudinary = require("cloudinary");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const sendToken = require("../utils/jwtToken");
const { isAuthenticated } = require("../middleware/auth");

// create user
router.post(
  "/create-user",
  catchAsyncErrors(async (req, res, next) => {
    try {
      const { name, email, password, avatar } = req.body;

      const userEmail = await User.findOne({ email });

      if (userEmail) {
        return next(new ErrorHandler("User already exists", 400));
      }

      let avatarData = {};

      // Upload only if avatar is provided
      if (avatar) {
        const myCloud = await cloudinary.v2.uploader.upload(avatar, {
          folder: "avatars",
        });

        avatarData = {
          public_id: myCloud.public_id,
          url: myCloud.secure_url,
        };
      }

      const user = await User.create({
        name,
        email,
        password,
        avatar: avatarData,
      });

      const token = user.getJwtToken();

      res.status(201).json({
        success: true,
        token,
        user,
      });
    } catch (error) {
      console.error("SIGNUP ERROR:", error);
      return next(new ErrorHandler(error.message, 400));
    }
  }),
);
// login user
router.post(
  "/login-user",
  catchAsyncErrors(async (req, res, next) => {
    try {
      //const { email, password } = req.body;
      const { email, password, rememberMe } = req.body;

      if (!email || !password) {
        return next(new ErrorHandler("Please provide the all fields!", 400));
      }

      const user = await User.findOne({ email }).select("+password");

      if (!user) {
        return next(new ErrorHandler("User doesn't exists!", 400));
      }

      const isPasswordValid = await user.comparePassword(password);

      if (!isPasswordValid) {
        return next(
          new ErrorHandler("Please provide the correct information", 400),
        );
      }

      if (!user.isActive) {
        return next(
          new ErrorHandler(
            "Your account has been disabled. From Admin",
            403,
          ),
        );
      }
      //sendToken(user, 201, res);
      sendToken(user, 201, res, !!rememberMe);
    } catch (error) {
      return next(new ErrorHandler(error.message, 500));
    }
  }),
);

// load logged-in user
router.get(
  "/getuser",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    if (!user) {
      return next(new ErrorHandler("User doesn't exist", 400));
    }

    res.status(200).json({
      success: true,
      user,
    });
  }),
);

// logout
router.get(
  "/logout",
  catchAsyncErrors(async (req, res, next) => {
    res.cookie("token", null, {
      expires: new Date(Date.now()),
      httpOnly: true,
    });

    res.status(200).json({
      success: true,
      message: "Logged out successfully!",
    });
  }),
);

// update user info (name, email, phone)
router.put(
  "/update-user-info",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    const { name, email, phoneNumber } = req.body;

    const user = await User.findOne({ email }).select("+password");

    if (!user) {
      return next(new ErrorHandler("User not found", 400));
    }

    user.name = name || user.name;
    user.email = email || user.email;
    user.phoneNumber = phoneNumber || user.phoneNumber;

    await user.save();

    res.status(200).json({
      success: true,
      user,
    });
  }),
);

// update avatar
router.put(
  "/update-avatar",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.user.id);

    if (req.body.avatar !== "") {
      // remove old avatar if it exists
      if (user.avatar?.public_id) {
        await cloudinary.v2.uploader.destroy(user.avatar.public_id);
      }

      const myCloud = await cloudinary.v2.uploader.upload(req.body.avatar, {
        folder: "avatars",
        width: 150,
      });

      user.avatar = {
        public_id: myCloud.public_id,
        url: myCloud.secure_url,
      };
    }

    await user.save();

    res.status(200).json({
      success: true,
      user,
    });
  }),
);

// update password
router.put(
  "/update-user-password",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    const { oldPassword, newPassword, confirmPassword } = req.body;

    if (!oldPassword || !newPassword || !confirmPassword) {
      return next(new ErrorHandler("Please provide all fields", 400));
    }

    if (newPassword.length < 4) {
      return next(
        new ErrorHandler("New password must be at least 4 characters", 400),
      );
    }

    if (newPassword !== confirmPassword) {
      return next(new ErrorHandler("Passwords don't match", 400));
    }

    const user = await User.findById(req.user.id).select("+password");

    const isPasswordMatched = await user.comparePassword(oldPassword);

    if (!isPasswordMatched) {
      return next(new ErrorHandler("Old password is incorrect", 400));
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password updated successfully",
    });
  }),
);

module.exports = router;
