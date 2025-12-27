import mongoose from "mongoose";

const adsSchema = new mongoose.Schema(
    {
        title: {
            type: String,
            required: [true, "Ad title is required"],
            trim: true,
            maxLength: [100, "Title cannot exceed 100 characters"],
        },
        description: {
            type: String,
            trim: true,
            maxLength: [500, "Description cannot exceed 500 characters"],
        },
        image: {
            type: String,
            required: [true, "Ad image is required"],
        },
        link: {
            type: String,
            required: [true, "Ad link is required"],
            trim: true,
        },
        position: {
            type: String,
            enum: ["banner", "sidebar", "inline", "popup"],
            default: "sidebar",
        },
        isActive: {
            type: Boolean,
            default: true,
        },
        priority: {
            type: Number,
            default: 0,
            min: 0,
            max: 100,
        },
        clicks: {
            type: Number,
            default: 0,
        },
        impressions: {
            type: Number,
            default: 0,
        },
        startDate: {
            type: Date,
            default: Date.now,
        },
        endDate: {
            type: Date,
        },
    },
    {
        timestamps: true,
    }
);

// Index for efficient queries
adsSchema.index({ isActive: 1, position: 1, priority: -1 });

const Ad = mongoose.model("Ad", adsSchema);

export default Ad;
