import multer from "multer";
import { CloudinaryStorage } from "multer-storage-cloudinary";
import cloudinary from "../config/cloudinary.js";

const storage = new CloudinaryStorage({
    cloudinary: cloudinary,
    params: {
        folder: "ads-images",
        allowed_formats: ["jpg", "jpeg", "png", "gif", "webp"],
        transformation: [
            { width: 1200, height: 600, crop: "limit" },
            { quality: "auto:good" },
        ],
    },
});

const adsUpload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB limit
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith("image/")) {
            cb(null, true);
        } else {
            cb(new Error("Only image files are allowed!"), false);
        }
    },
});

export default adsUpload;
