const express = require("express");
const router = express.Router();
const pdfParseModule = require("pdf-parse");
const pdfParse =
  typeof pdfParseModule === "function"
    ? pdfParseModule
    : pdfParseModule.default;
const cloudinary = require("cloudinary");
const { GoogleGenerativeAI } = require("@google/generative-ai");
const ErrorHandler = require("../utils/ErrorHandler");
const catchAsyncErrors = require("../middleware/catchAsyncErrors");
const { isAuthenticated } = require("../middleware/auth");

const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);

router.post(
  "/analyze",
  isAuthenticated,
  catchAsyncErrors(async (req, res, next) => {
    // frontend base64 send "data:application/pdf;base64,JVBER..."
    const { resumeFile } = req.body;

    if (!resumeFile) {
      return next(new ErrorHandler("Please upload a PDF resume", 400));
    }

    // basic check
    if (!resumeFile.startsWith("data:application/pdf")) {
      return next(new ErrorHandler("Only PDF files are allowed", 400));
    }

    // Step 1: base64 se raw PDF bytes nikalo, text extract karne ke liye
    const base64Data = resumeFile.split(",")[1];
    const pdfBuffer = Buffer.from(base64Data, "base64");
    //Base64 string ko decode karke original binary bytes bana do

    // ~5MB se bada PDF reject karo 
    if (pdfBuffer.length > 5 * 1024 * 1024) {
      return next(new ErrorHandler("PDF must be under 5MB", 400));
    }

    let resumeText;

    // sanity check: is this actually a valid PDF buffer?
    console.log("PDF buffer size:", pdfBuffer.length, "bytes");
    console.log("PDF header:", pdfBuffer.slice(0, 8).toString());

    if (pdfBuffer.slice(0, 4).toString() !== "%PDF") {
      return next(
        new ErrorHandler(
          "This file doesn't look like a valid PDF — try re-exporting it",
          400,
        ),
      );
    }

    try {
      const parsed = await pdfParse(pdfBuffer);
      resumeText = parsed.text?.trim();
      console.log("Extracted text length:", resumeText?.length);
      console.log("Extracted text preview:", resumeText?.slice(0, 200));
      console.log("PDF numpages:", parsed.numpages);
      console.log("PDF numrender:", parsed.numrender);
      console.log("PDF info:", parsed.info);
    } catch (err) {
      console.error("PDF PARSE ERROR ↓↓↓");
      console.error(err);
      return next(new ErrorHandler("Could not read the PDF file", 400));
    }

    if (!resumeText || resumeText.length < 50) {
      console.error("PDF text too short/empty. Length:", resumeText?.length);
      return next(
        new ErrorHandler(
          "Couldn't extract readable text from this PDF — it may be a scanned image rather than a text-based PDF",
          400,
        ),
      );
    }
    //  Cloudinary pe bhi upload kar do —  for record 

    let uploadedFileUrl = "";
    try {
      const cloudUpload = await cloudinary.v2.uploader.upload(resumeFile, {
        resource_type: "raw",
        folder: "ats-checked-resumes",
      });
      uploadedFileUrl = cloudUpload.secure_url;
    } catch (err) {
      console.error("CLOUDINARY UPLOAD WARNING (non-fatal):", err);

    }

    // Step 3: Gemini prompt banao
    const prompt = `
You are an expert ATS (Applicant Tracking System) and resume reviewer.
Analyze the following resume text and return ONLY valid JSON (no markdown, no code fences, no extra text) in exactly this shape:

{
  "atsScore": <number 0-100>,
  "resumeScore": <number 0-100>,
  "strengths": ["...", "..."],
  "weaknesses": ["...", "..."],
  "suggestions": ["...", "..."]
}

Rules:
- atsScore reflects how well this resume would parse and rank in an automated tracking system (formatting, keywords, structure).
- resumeScore reflects overall quality as a human recruiter would judge it (clarity, impact, achievements).
- Give 3-6 items each for strengths, weaknesses, and suggestions.
- Be specific and actionable, not generic.

Resume text:
"""
${resumeText.slice(0, 12000)}
"""
    `.trim();
    // Step 4: Gemini API call

    let aiResponseText;
    try {
      const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });
      const result = await model.generateContent(prompt);
      aiResponseText = result.response.text();
    } catch (err) {
      console.error("GEMINI ERROR ↓↓↓");
      console.error(err);
      return next(
        new ErrorHandler("AI analysis failed, please try again", 500),
      );
    }

    const cleaned = aiResponseText
      .replace(/```json/gi, "")
      .replace(/```/g, "")
      .trim();

    let analysis;
    try {
      analysis = JSON.parse(cleaned);
    } catch (err) {
      console.error("JSON PARSE ERROR:", cleaned);
      return next(
        new ErrorHandler("Could not parse AI response, please try again", 500),
      );
    }

    res.status(200).json({
      success: true,
      analysis,
      fileUrl: uploadedFileUrl, 
    });
  }),
);

module.exports = router;
