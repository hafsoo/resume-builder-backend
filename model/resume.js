const mongoose = require("mongoose");

const resumeSchema = new mongoose.Schema(
  {
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    resumeName: {
      type: String,
      required: [true, "Please enter a resume name"],
      trim: true,
    },
    accentColor: {
      type: String,
      default: "#0891b2",
    },
    templateId: {
      type: String,
      enum: ["classic", "modern", "minimal"],
      default: "modern",
    },
    avatar: {
      public_id: { type: String, default: "" },
      url: { type: String, default: "" },
    },
    personalInfo: {
      fullName: { type: String, default: "", trim: true },
      email: { type: String, default: "", trim: true },
      phone: { type: String, default: "", trim: true },
      linkedin: { type: String, default: "", trim: true },
      address: { type: String, default: "", trim: true },
      github: { type: String, default: "", trim: true },
      portfolio: { type: String, default: "", trim: true },
      summary: { type: String, default: "", trim: true },
    },
    education: [
      {
        degree: {
          type: String,
          required: [true, "Degree is required"],
          trim: true,
        },
        institute: {
          type: String,
          required: [true, "Institute is required"],
          trim: true,
        },
        startDate: {
          type: String,
          required: [true, "Start date is required"],
          trim: true,
        },
        endDate: { type: String, default: "", trim: true },
        isPresent: { type: Boolean, default: false },
        cgpa: { type: String, default: "", trim: true },
      },
    ],
    experience: [
      {
        company: {
          type: String,
          required: [true, "Company is required"],
          trim: true,
        },
        position: {
          type: String,
          required: [true, "Position is required"],
          trim: true,
        },
        startDate: {
          type: String,
          required: [true, "Start date is required"],
          trim: true,
        },
        endDate: { type: String, default: "", trim: true },
        isPresent: { type: Boolean, default: false },
        description: { type: String, default: "", trim: true },
      },
    ],
    skills: [{ type: String, trim: true }],

    projects: [
      {
        name: {
          type: String,
          required: [true, "Project name is required"],
          trim: true,
        },
        technologies: { type: String, default: "", trim: true },
        description: { type: String, default: "", trim: true },
        githubLink: { type: String, default: "", trim: true },
        liveLink: { type: String, default: "", trim: true },
      },
    ],
    isComplete: {
      type: Boolean,
      default: false,
    },
  },
  { timestamps: true },
);

module.exports = mongoose.model("Resume", resumeSchema);
