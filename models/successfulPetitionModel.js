import mongoose from "mongoose";

const successfulPetitionSchema = mongoose.Schema(
  {
    petitionTitle: {
      type: String,
      required: true,
      trim: true,
    },
    totalSignatures: {
      type: Number,
      required: true,
      min: 0,
    },
    decisionMakers: [
      {
        name: { 
          type: String, 
          required: true,
          trim: true,
        },
        organization: { 
          type: String,
          trim: true,
        },
        email: { 
          type: String, 
          required: true,
          trim: true,
          lowercase: true,
        },
        phone: { 
          type: String,
          trim: true,
        },
      },
    ],
    issue: {
      type: String,
      required: true,
      trim: true,
    },
    location: {
      type: String,
      required: true,
      trim: true,
    },
    petitionStarterName: {
      type: String,
      required: true,
      trim: true,
    },
    startedDate: {
      type: Date,
      required: true,
    },
    image: {
      type: String,
      trim: true,
    },
    // Optional fields that might be useful
    originalPetitionId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Petition",
      required: false,
    },
    successDate: {
      type: Date,
      default: Date.now,
    },
    outcome: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        'Environment', 
        'Education', 
        'Healthcare', 
        'Social Justice', 
        'Politics', 
        'Animal Rights', 
        'Human Rights',
        'Technology',
        'Other'
      ],
    },
  },
  {
    timestamps: true,
  }
);

// Add indexes for better query performance
successfulPetitionSchema.index({ petitionTitle: 1 });
successfulPetitionSchema.index({ location: 1 });
successfulPetitionSchema.index({ category: 1 });
successfulPetitionSchema.index({ successDate: -1 });
successfulPetitionSchema.index({ totalSignatures: -1 });

const SuccessfulPetition = mongoose.model("SuccessfulPetition", successfulPetitionSchema);

export default SuccessfulPetition;
