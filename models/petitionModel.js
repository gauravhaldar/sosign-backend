import mongoose from "mongoose";

const petitionSchema = mongoose.Schema(
  {
    title: {
      type: String,
      required: true,
    },
    decisionMakers: [
      {
        name: { type: String, required: true },
        organization: { type: String },
        email: { type: String, required: true },
        phone: { type: String },
      },
    ],
    country: {
      type: String,
      required: true,
    },
    categories: [{
      type: String,
      enum: [
        'animals',
        'game',
        'interior',
        'lifestyle',
        'sports',
        'technology',
        'travel',
        'environment',
        'education',
        'health',
        'politics',
        'human_rights'
      ]
    }],
    petitionDetails: {
      problem: { type: String, required: true },
      solution: { type: String, required: true },
      image: { type: String }, // URL to the image
      videoUrl: { type: String },
    },
    petitionStarter: {
      user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true,
      },
      name: { type: String, required: true },
      age: { type: Number },
      mobile: { type: String, required: true },
      location: { type: String },
      comment: { type: String },
      aadharNumber: { type: String, required: true },
      panNumber: { type: String },
      voterNumber: { type: String },
      pincode: { type: String },
      mpConstituencyNumber: { type: String },
      mlaConstituencyNumber: { type: String },
    },
    numberOfSignatures: {
      type: Number,
      default: 0,
    },
    signatures: [
      {
        user: {
          type: mongoose.Schema.Types.ObjectId,
          ref: "User",
          required: true,
        },
        // Optional referral tracking: who referred and via which code
        referral: {
          code: { type: String },
          owner: { type: mongoose.Schema.Types.ObjectId, ref: "User" },
        },
        signedAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    approved: {
      type: Boolean,
      default: false,
    },
  },
  {
    timestamps: true,
  }
);

const Petition = mongoose.model("Petition", petitionSchema);

export default Petition;
