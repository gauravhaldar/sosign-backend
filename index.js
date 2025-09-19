import express from "express";
import mongoose from "mongoose";
import dotenv from "dotenv";
import connectDB from "./config/db.js";
import userRoutes from "./routes/userRoutes.js";
import cookieParser from "cookie-parser";
import cors from "cors";
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";
import petitionRoutes from "./routes/petitionRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import successfulPetitionRoutes from "./routes/successfulPetitionRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";

dotenv.config();
console.log("NODE_ENV:", process.env.NODE_ENV);
console.log("JWT_SECRET available:", !!process.env.JWT_SECRET);

connectDB();

const app = express();
const PORT = process.env.PORT || 8000;

// CORS configuration using environment variables
const allowedOrigins = process.env.ALLOWED_ORIGINS
  ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
  : ["http://localhost:3000", "http://localhost:3001"];

console.log("Allowed CORS origins:", allowedOrigins);

app.use(
  cors({
    origin: allowedOrigins,
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

// Routes
app.get("/", (req, res) => {
  res.send("API is running...");
});

// Health check endpoint for deployment monitoring
app.get("/health", (req, res) => {
  const healthCheck = {
    uptime: process.uptime(),
    message: "OK",
    timestamp: Date.now(),
    env: process.env.NODE_ENV || "development",
  };

  try {
    res.status(200).json(healthCheck);
  } catch (error) {
    healthCheck.message = error;
    res.status(503).json(healthCheck);
  }
});

app.use("/api/users", userRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/petitions", petitionRoutes);
app.use("/api/successful-petitions", successfulPetitionRoutes);
app.use("/api/comments", commentRoutes);

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
