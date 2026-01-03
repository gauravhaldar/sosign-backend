import express from "express";
import dotenv from "dotenv";
import cors from "cors";
import cookieParser from "cookie-parser";
import helmet from "helmet";
import compression from "compression";
import morgan from "morgan";
import rateLimit from "express-rate-limit";

// Config
import connectDB from "./config/db.js";

// Routes
import userRoutes from "./routes/userRoutes.js";
import petitionRoutes from "./routes/petitionRoutes.js";
import adminRoutes from "./routes/adminRoutes.js";
import commentRoutes from "./routes/commentRoutes.js";
import successfulPetitionRoutes from "./routes/successfulPetitionRoutes.js";
import adsRoutes from "./routes/adsRoutes.js";
import downloadRequestRoutes from "./routes/downloadRequestRoutes.js";
import blogRoutes from "./routes/blogRoutes.js";
import hideRequestRoutes from "./routes/hideRequestRoutes.js";

// Middleware
import { notFound, errorHandler } from "./middleware/errorMiddleware.js";

// Load environment variables
dotenv.config();

// Connect to database
connectDB();

const app = express();

// Trust proxy for rate limiting behind reverse proxies
app.set("trust proxy", 1);

// Security middleware
app.use(helmet({
    crossOriginResourcePolicy: { policy: "cross-origin" },
}));

// Compression middleware
app.use(compression());

// Logging middleware (dev mode)
if (process.env.NODE_ENV !== "production") {
    app.use(morgan("dev"));
}

// Rate limiting
const limiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max: 100, // Limit each IP to 100 requests per windowMs
    message: {
        error: "Too many requests from this IP, please try again after 15 minutes",
    },
    standardHeaders: true,
    legacyHeaders: false,
});
app.use("/api", limiter);

// CORS configuration
const allowedOrigins = process.env.ALLOWED_ORIGINS
    ? process.env.ALLOWED_ORIGINS.split(",").map((origin) => origin.trim())
    : [
        "http://localhost:3000",
        "http://localhost:3001",
        "https://sosign.vercel.app",
        "https://sosign-admin.vercel.app",
    ];

app.use(
    cors({
        origin: function (origin, callback) {
            // Allow requests with no origin (like mobile apps or curl requests)
            if (!origin) return callback(null, true);
            if (allowedOrigins.indexOf(origin) !== -1) {
                callback(null, true);
            } else {
                console.log("Blocked by CORS:", origin);
                callback(new Error("Not allowed by CORS"));
            }
        },
        credentials: true,
        methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS", "PATCH"],
        allowedHeaders: ["Content-Type", "Authorization", "X-Requested-With"],
    })
);

// Body parsing middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Cookie parser middleware
app.use(cookieParser());

// Health check endpoint
app.get("/health", (req, res) => {
    res.status(200).json({
        status: "ok",
        timestamp: new Date().toISOString(),
        uptime: process.uptime(),
    });
});

// API Routes
app.use("/api/users", userRoutes);
app.use("/api/petitions", petitionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/comments", commentRoutes);
app.use("/api/successful-petitions", successfulPetitionRoutes);
app.use("/api/ads", adsRoutes);
app.use("/api/download-requests", downloadRequestRoutes);
app.use("/api/blogs", blogRoutes);
app.use("/api/hide-requests", hideRequestRoutes);

// Root endpoint
app.get("/", (req, res) => {
    res.json({
        message: "SOSign API Server",
        version: "1.0.0",
        endpoints: {
            users: "/api/users",
            petitions: "/api/petitions",
            admin: "/api/admin",
            comments: "/api/comments",
            successfulPetitions: "/api/successful-petitions",
            ads: "/api/ads",
            downloadRequests: "/api/download-requests",
            blogs: "/api/blogs",
            health: "/health",
        },
    });
});

// Error handling middleware
app.use(notFound);
app.use(errorHandler);

// Start server
const PORT = process.env.PORT || 8000;
app.listen(PORT, () => {
    console.log(`
╔═══════════════════════════════════════════════════════════╗
║                   SOSign Backend Server                   ║
╠═══════════════════════════════════════════════════════════╣
║  Status:      Running                                     ║
║  Port:        ${PORT}                                          ║
║  Environment: ${process.env.NODE_ENV || "development"}                                 ║
║  Time:        ${new Date().toISOString()}             ║
╚═══════════════════════════════════════════════════════════╝
  `);
});

// Handle unhandled promise rejections
process.on("unhandledRejection", (err, promise) => {
    console.error(`Unhandled Rejection: ${err.message}`);
});

// Handle uncaught exceptions
process.on("uncaughtException", (err) => {
    console.error(`Uncaught Exception: ${err.message}`);
    process.exit(1);
});

export default app;
