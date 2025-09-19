import mongoose from 'mongoose';
import dotenv from 'dotenv';
import User from '../models/userModel.js';
import path from 'path'; // Import path module
import { fileURLToPath } from 'url';
import { dirname } from 'path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

dotenv.config({ path: path.resolve(__dirname, '../.env') }); // Specify path to .env

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URL);
    console.log(`MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`Error: ${error.message}`);
    process.exit(1);
  }
};

const addPetitionsFieldToUsers = async () => {
  await connectDB();

  try {
    console.log('Starting migration to add petitions field to users...');

    const result = await User.updateMany(
      { petitions: { $exists: false } }, // Find users where 'petitions' field does not exist
      { $set: { petitions: [] } }        // Set 'petitions' to an empty array
    );

    console.log(`${result.modifiedCount} user(s) updated to include an empty petitions array.`);
    console.log('Migration completed.');
  } catch (error) {
    console.error(`Error during migration: ${error.message}`);
  } finally {
    mongoose.disconnect();
  }
};

addPetitionsFieldToUsers();
