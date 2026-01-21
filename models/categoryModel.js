import mongoose from "mongoose";

// Helper function to generate URL-friendly slug from name
function generateSlug(name) {
    return name
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '_')          // Replace spaces with underscores
        .replace(/_+/g, '_')           // Replace multiple underscores with single
        .replace(/^_|_$/g, '');        // Remove leading/trailing underscores
}

const categorySchema = mongoose.Schema(
    {
        name: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        slug: {
            type: String,
            unique: true,
            index: true,
        },
        icon: {
            type: String,
            default: null, // Icon name (e.g., 'FaPaw', 'FaLeaf')
        },
        isDefault: {
            type: Boolean,
            default: false, // True for predefined categories
        },
        createdBy: {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User",
            default: null, // Null for default/seeded categories
        },
    },
    {
        timestamps: true,
    }
);

// Pre-save hook to generate slug from name
categorySchema.pre('save', async function (next) {
    if (this.isModified('name') || !this.slug) {
        this.slug = generateSlug(this.name);
    }
    next();
});

// Static method to seed default categories
categorySchema.statics.seedDefaults = async function () {
    const defaultCategories = [
        { name: "Animals", slug: "animals", icon: "FaPaw", isDefault: true },
        { name: "Game", slug: "game", icon: "FaGamepad", isDefault: true },
        { name: "Interior", slug: "interior", icon: "FaCouch", isDefault: true },
        { name: "Lifestyle", slug: "lifestyle", icon: "FaSpa", isDefault: true },
        { name: "Sports", slug: "sports", icon: "FaPersonRunning", isDefault: true },
        { name: "Technology", slug: "technology", icon: "FaLaptopCode", isDefault: true },
        { name: "Travel", slug: "travel", icon: "FaPlane", isDefault: true },
        { name: "Environment", slug: "environment", icon: "FaLeaf", isDefault: true },
        { name: "Education", slug: "education", icon: "FaGraduationCap", isDefault: true },
        { name: "Health", slug: "health", icon: "FaHeartPulse", isDefault: true },
        { name: "Politics", slug: "politics", icon: "FaLandmarkDome", isDefault: true },
        { name: "Human Rights", slug: "human_rights", icon: "FaHandFist", isDefault: true },
    ];

    for (const category of defaultCategories) {
        try {
            await this.findOneAndUpdate(
                { slug: category.slug },
                category,
                { upsert: true, new: true }
            );
        } catch (error) {
            // Ignore duplicate key errors
            if (error.code !== 11000) {
                console.error(`Error seeding category ${category.name}:`, error.message);
            }
        }
    }

    console.log("✅ Default categories seeded successfully");
};

const Category = mongoose.model("Category", categorySchema);

export default Category;
