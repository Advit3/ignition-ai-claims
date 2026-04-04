import express from "express";
import upload from "../middlewares/upload.middleware.js";

const router = express.Router();

router.post("/", upload.single("file"), (req, res) => {
  // If we reach this point, Multer has uploaded the file to Cloudinary and attached the req.file object.
  if (!req.file) {
    return res.status(400).json({ status: "error", message: "File upload failed" });
  }

  res.status(200).json({
    status: "success",
    data: {
      url: req.file.path, // The Cloudinary URL mapping
    }
  });
});

export default router;
