/**
 * Migration script to add slugs to existing petitions
 * Run with: node scripts/migrateAddSlugs.js
 */

import mongoose from "mongoose";
import dotenv from "dotenv";

dotenv.config();

// Helper function to generate URL-friendly slug from title
function generateSlug(title) {
    return title
        .trim()
        .toLowerCase()
        .replace(/[^a-z0-9\s-]/g, '') // Remove special characters
        .replace(/\s+/g, '-')          // Replace spaces with hyphens
        .replace(/-+/g, '-')           // Replace multiple hyphens with single
        .replace(/^-|-$/g, '')         // Remove leading/trailing hyphens
        .substring(0, 100);            // Limit length
}

// Connect to MongoDB
const connectDB = async () => {
    try {
        const conn = await mongoose.connect(process.env.MONGODB_URL);
        console.log(`MongoDB Connected: ${conn.connection.host}`);
        return conn;
    } catch (error) {
        console.error(`Error: ${error.message}`);
        process.exit(1);
    }
};

// Simple petition schema for migration (without pre-save hooks)
const migrationPetitionSchema = new mongoose.Schema({
    title: String,
    slug: String,
}, { collection: 'petitions', strict: false });

const MigrationPetition = mongoose.model('MigrationPetition', migrationPetitionSchema);

const migrateAddSlugs = async () => {
    console.log("Starting slug migration...\n");

    // Find all petitions without slugs
    const petitionsWithoutSlugs = await MigrationPetition.find({
        $or: [
            { slug: { $exists: false } },
            { slug: null },
            { slug: '' }
        ]
    });

    console.log(`Found ${petitionsWithoutSlugs.length} petitions without slugs\n`);

    if (petitionsWithoutSlugs.length === 0) {
        console.log("No petitions need slug migration. All petitions already have slugs.");
        return;
    }

    // Get all existing slugs to avoid duplicates
    const existingSlugs = new Set();
    const petitionsWithSlugs = await MigrationPetition.find({ slug: { $exists: true, $ne: null, $ne: '' } });
    petitionsWithSlugs.forEach(p => existingSlugs.add(p.slug));

    let successCount = 0;
    let errorCount = 0;

    for (const petition of petitionsWithoutSlugs) {
        try {
            let baseSlug = generateSlug(petition.title);
            let slug = baseSlug;
            let counter = 1;

            // Ensure unique slug
            while (existingSlugs.has(slug)) {
                slug = `${baseSlug}-${counter}`;
                counter++;
            }

            // Update the petition with the new slug
            await MigrationPetition.updateOne(
                { _id: petition._id },
                { $set: { slug: slug } }
            );

            existingSlugs.add(slug);
            successCount++;
            console.log(`✓ Added slug for: "${petition.title}" -> "${slug}"`);

        } catch (error) {
            errorCount++;
            console.error(`✗ Error migrating petition "${petition.title}": ${error.message}`);
        }
    }

    console.log(`\n${"=".repeat(50)}`);
    console.log(`Migration complete!`);
    console.log(`Successfully migrated: ${successCount}`);
    console.log(`Errors: ${errorCount}`);
};

// Main execution
const run = async () => {
    try {
        await connectDB();
        await migrateAddSlugs();
        process.exit(0);
    } catch (error) {
        console.error("Migration failed:", error);
        process.exit(1);
    }
};

run();
