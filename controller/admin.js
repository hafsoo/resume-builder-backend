const express = require("express");
const router = express.Router();
const User = require("../model/user");
const Resume = require("../model/resume");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated, authorizeRoles } = require("../middleware/auth");

// every route below requires login + admin role
router.use(isAuthenticated, authorizeRoles("admin"));

// dashboard stats
router.get(
  "/stats",
  catchAsyncErrors(async (req, res, next) => {
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    const startOfWeek = new Date();
    startOfWeek.setDate(startOfWeek.getDate() - 7);

    const [
      totalUsers,
      totalResumes,
      newUsersToday,
      newResumesToday,
      newUsersThisWeek,
      completedResumes,
      activeUsers,
    ] = await Promise.all([
      User.countDocuments({ role: "user" }),
      Resume.countDocuments(),
      User.countDocuments({ createdAt: { $gte: startOfDay }, role: "user" }),
      Resume.countDocuments({ createdAt: { $gte: startOfDay } }),
      User.countDocuments({ createdAt: { $gte: startOfWeek }, role: "user" }),
      Resume.countDocuments({ isComplete: true }),
      User.countDocuments({ isActive: true, role: "user" }),
    ]);

    res.status(200).json({
      success: true,
      stats: {
        totalUsers,
        totalResumes,
        newUsersToday,
        newResumesToday,
        newUsersThisWeek,
        completedResumes,
        activeUsers,
      },
    });
  })
);

// get all users
router.get(
  "/users",
  catchAsyncErrors(async (req, res, next) => {
    const users = await User.find({ role: "user" }).sort({ createdAt: -1 });
    res.status(200).json({ success: true, users });
  })
);

// get single user + their resumes
router.get(
  "/users/:id",
  catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) return next(new ErrorHandler("User not found", 404));

    const resumes = await Resume.find({ userId: user._id });
    res.status(200).json({ success: true, user, resumes });
  })
);

// enable/disable user
router.patch(
  "/users/:id/toggle-status",
  catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) return next(new ErrorHandler("User not found", 404));

    user.isActive = !user.isActive;
    await user.save({ validateBeforeSave: false });

    res.status(200).json({ success: true, user });
  })
);

// delete user (and their resumes)
router.delete(
  "/users/:id",
  catchAsyncErrors(async (req, res, next) => {
    const user = await User.findById(req.params.id);
    if (!user) return next(new ErrorHandler("User not found", 404));

    await Resume.deleteMany({ userId: user._id });
    await user.deleteOne();

    res.status(200).json({ success: true, message: "User and their resumes deleted" });
  })
);

// get all resumes across all users
router.get(
  "/resumes",
  catchAsyncErrors(async (req, res, next) => {
    const resumes = await Resume.find()
      .populate("userId", "name email")
      .sort({ createdAt: -1 });

    res.status(200).json({ success: true, resumes });
  })
);

// delete a resume
router.delete(
  "/resumes/:id",
  catchAsyncErrors(async (req, res, next) => {
    const resume = await Resume.findById(req.params.id);
    if (!resume) return next(new ErrorHandler("Resume not found", 404));

    await resume.deleteOne();
    res.status(200).json({ success: true, message: "Resume deleted" });
  })
);

module.exports = router;