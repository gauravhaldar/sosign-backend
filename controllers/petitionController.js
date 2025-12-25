import asyncHandler from "express-async-handler";
import Petition from "../models/petitionModel.js";
import User from "../models/userModel.js";
import SuccessfulPetition from "../models/successfulPetitionModel.js";
import cloudinary from "../config/cloudinary.js";
import { sendPetitionNotificationEmails } from "../config/emailConfig.js";

// @desc    Create a new petition
// @route   POST /api/petitions
// @access  Private
const createPetition = asyncHandler(async (req, res) => {
  const { title, decisionMakers, country, petitionDetails, petitionStarter, categories } =
    req.body;

  // Parse decisionMakers if it's a string (from FormData)
  let parsedDecisionMakers = decisionMakers;
  if (typeof decisionMakers === "string") {
    try {
      parsedDecisionMakers = JSON.parse(decisionMakers);
    } catch (error) {
      res.status(400);
      throw new Error("Invalid decision makers data format");
    }
  }

  // Parse petitionDetails if it's a string (from FormData)
  let parsedPetitionDetails = petitionDetails;
  if (typeof petitionDetails === "string") {
    try {
      parsedPetitionDetails = JSON.parse(petitionDetails);
    } catch (error) {
      res.status(400);
      throw new Error("Invalid petition details data format");
    }
  }

  // Parse petitionStarter if it's a string (from FormData)
  let parsedPetitionStarter = petitionStarter;
  if (typeof petitionStarter === "string") {
    try {
      parsedPetitionStarter = JSON.parse(petitionStarter);
    } catch (error) {
      res.status(400);
      throw new Error("Invalid petition starter data format");
    }
  }

  // Parse categories if it's a string (from FormData)
  let parsedCategories = categories || [];
  if (typeof categories === "string") {
    try {
      parsedCategories = JSON.parse(categories);
    } catch (error) {
      res.status(400);
      throw new Error("Invalid categories data format");
    }
  }

  // Validate required fields
  if (
    !title ||
    !country ||
    !parsedPetitionDetails?.problem ||
    !parsedPetitionDetails?.solution ||
    !parsedPetitionStarter
  ) {
    res.status(400);
    throw new Error("Please provide all required fields");
  }

  // Handle authentication - create temporary user if not authenticated
  let userId;
  console.log("req.user in createPetition:", req.user); // Debugging line
  if (req.user && req.user._id) {
    // User is authenticated
    const user = await User.findById(req.user._id);
    if (!user) {
      res.status(404);
      throw new Error("User not found");
    }
    userId = req.user._id;
    console.log("Using authenticated user ID:", userId); // Debugging line
  } else {
    // User is not authenticated - create a temporary user if req.user is undefined
    // In production, this should be removed and proper authentication enforced
    const tempUser = await User.findOne({ email: "temp@example.com" });
    if (tempUser) {
      userId = tempUser._id;
    } else {
      // Create a temporary user with unique mobile number
      const newTempUser = await User.create({
        name: "Temporary User",
        email: "temp@example.com",
        password: "temppassword123", // This will be hashed by the model
        designation: "Citizen",
        mobileNumber: `+1${Date.now()}`, // Unique mobile number based on timestamp
      });
      userId = newTempUser._id;
    }
  }
  console.log("Derived userId for petition creation:", userId); // Debugging line
  console.log("parsedPetitionStarter before creation:", parsedPetitionStarter); // Debugging line

  // Handle image upload to Cloudinary if file is present
  let imageUrl = "";
  if (req.file) {
    try {
      imageUrl = req.file.path; // Cloudinary URL from multer-storage-cloudinary
    } catch (error) {
      res.status(500);
      throw new Error("Image upload failed");
    }
  }

  const petition = await Petition.create({
    title,
    decisionMakers: parsedDecisionMakers || [],
    country,
    categories: parsedCategories,
    petitionDetails: {
      ...parsedPetitionDetails,
      image: imageUrl,
    },
    petitionStarter: {
      ...parsedPetitionStarter,
      user: userId,
    },
    approved: false, // Explicitly set to false for approval workflow
  });

  // Link the petition to the user
  if (userId) {
    console.log("Attempting to link petition to user:", userId);
    const user = await User.findById(userId);
    if (user) {
      user.petitions.push(petition._id);
      await user.save();
      console.log(
        "Petition linked successfully. User petitions:",
        user.petitions
      );
    } else {
      console.log("User not found when attempting to link petition.", userId);
    }
  }

  if (petition) {
    // Send email notifications to decision makers (async, don't wait for completion)
    console.log("🔍 Checking decision makers for email sending...");
    console.log("Decision makers:", petition.decisionMakers);
    console.log(
      "Decision makers length:",
      petition.decisionMakers ? petition.decisionMakers.length : 0
    );

    if (petition.decisionMakers && petition.decisionMakers.length > 0) {
      const frontendUrl = process.env.FRONTEND_URL || "http://localhost:3000";
      console.log("📧 Starting email notification process...");
      console.log("Frontend URL:", frontendUrl);

      // Send emails asynchronously (don't block the response)
      sendPetitionNotificationEmails(petition, frontendUrl)
        .then((emailResult) => {
          if (emailResult.success) {
            console.log(
              `✅ Email notifications sent: ${emailResult.totalSent} successful, ${emailResult.totalFailed} failed`
            );
            console.log("📋 Email results:", emailResult.results);
          } else {
            console.error(
              "❌ Failed to send email notifications:",
              emailResult.error
            );
          }
        })
        .catch((error) => {
          console.error("💥 Error in email notification process:", error);
        });
    } else {
      console.log(
        "⚠️ No decision makers found or decision makers array is empty"
      );
    }

    res.status(201).json({
      success: true,
      message: "Petition created successfully",
      petition: {
        _id: petition._id,
        title: petition.title,
        decisionMakers: petition.decisionMakers,
        country: petition.country,
        categories: petition.categories,
        petitionDetails: petition.petitionDetails,
        petitionStarter: petition.petitionStarter,
        numberOfSignatures: petition.numberOfSignatures,
        createdAt: petition.createdAt,
        updatedAt: petition.updatedAt,
      },
    });
  } else {
    res.status(400);
    throw new Error("Invalid petition data");
  }
});

// @desc    Get all petitions
// @route   GET /api/petitions
// @access  Public
const getPetitions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { country, search } = req.query;

  // Build query object
  let query = {};

  if (country) {
    query.country = country;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { "petitionDetails.problem": { $regex: search, $options: "i" } },
      { "petitionDetails.solution": { $regex: search, $options: "i" } },
    ];
  }

  // Only fetch approved petitions
  query.approved = true;

  const petitions = await Petition.find(query)
    .populate("petitionStarter.user", "name email designation")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalPetitions = await Petition.countDocuments(query);

  res.status(200).json({
    petitions,
    currentPage: page,
    totalPages: Math.ceil(totalPetitions / limit),
    totalPetitions,
    hasNextPage: page < Math.ceil(totalPetitions / limit),
    hasPrevPage: page > 1,
  });
});

// @desc    Get all petitions for admin (including unapproved)
// @route   GET /api/admin/petitions (admin only)
// @access  Private/Admin
const getAllPetitionsForAdmin = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const { country, search } = req.query;

  // Build query object
  let query = {};

  if (country) {
    query.country = country;
  }

  if (search) {
    query.$or = [
      { title: { $regex: search, $options: "i" } },
      { "petitionDetails.problem": { $regex: search, $options: "i" } },
      { "petitionDetails.solution": { $regex: search, $options: "i" } },
    ];
  }

  // Admin sees ALL petitions (approved and unapproved)
  const petitions = await Petition.find(query)
    .populate("petitionStarter.user", "name email designation")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalPetitions = await Petition.countDocuments(query);

  res.status(200).json({
    petitions,
    currentPage: page,
    totalPages: Math.ceil(totalPetitions / limit),
    totalPetitions,
    hasNextPage: page < Math.ceil(totalPetitions / limit),
    hasPrevPage: page > 1,
  });
});

// @desc    Get petition by ID
// @route   GET /api/petitions/:id
// @access  Public
const getPetitionById = asyncHandler(async (req, res) => {
  const petition = await Petition.findById(req.params.id)
    .populate("petitionStarter.user", "name email designation uniqueCode")
    .populate("signatures.user", "name email uniqueCode")
    .populate("signatures.referral.owner", "name email uniqueCode");

  if (petition) {
    res.status(200).json(petition);
  } else {
    res.status(404);
    throw new Error("Petition not found");
  }
});

// @desc    Update petition
// @route   PUT /api/petitions/:id
// @access  Private (Only petition creator)
const updatePetition = asyncHandler(async (req, res) => {
  const petition = await Petition.findById(req.params.id);

  if (!petition) {
    res.status(404);
    throw new Error("Petition not found");
  }

  // Check if the user is the petition creator
  if (petition.petitionStarter.user.toString() !== req.user._id.toString()) {
    res.status(403);
    throw new Error("Not authorized to update this petition");
  }

  const { title, decisionMakers, country, petitionDetails } = req.body;

  // Update only the fields that are provided
  if (title !== undefined) petition.title = title;
  if (decisionMakers !== undefined) petition.decisionMakers = decisionMakers;
  if (country !== undefined) petition.country = country;
  if (petitionDetails !== undefined) {
    petition.petitionDetails = {
      ...petition.petitionDetails,
      ...petitionDetails,
    };
  }

  const updatedPetition = await petition.save();

  res.status(200).json({
    _id: updatedPetition._id,
    title: updatedPetition.title,
    decisionMakers: updatedPetition.decisionMakers,
    country: updatedPetition.country,
    petitionDetails: updatedPetition.petitionDetails,
    petitionStarter: updatedPetition.petitionStarter,
    numberOfSignatures: updatedPetition.numberOfSignatures,
    createdAt: updatedPetition.createdAt,
    updatedAt: updatedPetition.updatedAt,
  });
});

// @desc    Delete petition
// @route   DELETE /api/petitions/:id
// @access  Private (Only petition creator or admin)
const deletePetition = asyncHandler(async (req, res) => {
  const petition = await Petition.findById(req.params.id);

  if (!petition) {
    res.status(404);
    throw new Error("Petition not found");
  }

  // Check if the user is the petition creator OR if it's an admin request
  const isAdmin = req.admin; // Admin requests have req.admin set by adminAuth middleware
  const isCreator =
    req.user &&
    petition.petitionStarter.user.toString() === req.user._id.toString();

  if (!isAdmin && !isCreator) {
    res.status(403);
    throw new Error("Not authorized to delete this petition");
  }

  await Petition.findByIdAndDelete(req.params.id);

  res.status(200).json({ message: "Petition removed successfully" });
});

// @desc    Get user's petitions
// @route   GET /api/petitions/my-petitions
// @access  Private
const getUserPetitions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const petitions = await Petition.find({
    "petitionStarter.user": req.user._id,
  })
    .populate("petitionStarter.user", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalPetitions = await Petition.countDocuments({
    "petitionStarter.user": req.user._id,
  });

  res.status(200).json({
    petitions,
    currentPage: page,
    totalPages: Math.ceil(totalPetitions / limit),
    totalPetitions,
    hasNextPage: page < Math.ceil(totalPetitions / limit),
    hasPrevPage: page > 1,
  });
});

// @desc    Increment petition signature count
// @route   PUT /api/petitions/:id/sign
// @access  Private
const signPetition = asyncHandler(async (req, res) => {
  // Check if user is authenticated
  if (!req.user || !req.user._id) {
    res.status(401);
    throw new Error("Not authorized, please login");
  }

  const petition = await Petition.findById(req.params.id);

  if (!petition) {
    res.status(404);
    throw new Error("Petition not found");
  }

  // Check if the user is trying to sign their own petition
  if (
    petition.petitionStarter.user &&
    petition.petitionStarter.user.toString() === req.user._id.toString()
  ) {
    res.status(400);
    throw new Error("You cannot sign your own petition");
  }

  // Check if user has already signed this petition
  const hasAlreadySigned = petition.signatures.some(
    (signature) => signature.user.toString() === req.user._id.toString()
  );

  if (hasAlreadySigned) {
    res.status(400);
    throw new Error("You have already signed this petition");
  }

  // Accept optional referral code from body or query
  let referralDetails = undefined;
  try {
    const referralCode =
      (req.body && req.body.referralCode) || req.query.referralCode;
    if (referralCode && typeof referralCode === "string") {
      const codeOwner = await User.findOne({
        uniqueCode: referralCode.trim().toUpperCase(),
      });
      if (codeOwner) {
        // Prevent self-referral: signing user can't take credit for themselves unless desired
        if (codeOwner._id.toString() !== req.user._id.toString()) {
          referralDetails = {
            code: referralCode.trim().toUpperCase(),
            owner: codeOwner._id,
          };
        } else {
          // Still record the code but without owner to indicate self-used code, if needed
          referralDetails = {
            code: referralCode.trim().toUpperCase(),
          };
        }
      } else {
        // Unknown code: still store the raw code for analysis if desired
        referralDetails = { code: referralCode.trim().toUpperCase() };
      }
    }
  } catch (e) {
    // Non-fatal: continue without referral
    console.warn("Referral code processing error:", e?.message || e);
  }

  // Add user signature and increment the signature count
  petition.signatures.push({
    user: req.user._id,
    referral: referralDetails,
    signedAt: new Date(),
  });
  petition.numberOfSignatures += 1;
  await petition.save();

  res.status(200).json({
    message: "Petition signed successfully",
    numberOfSignatures: petition.numberOfSignatures,
  });
});

// @desc    Check if user has signed a petition
// @route   GET /api/petitions/:id/check-signature
// @access  Private
const checkUserSignature = asyncHandler(async (req, res) => {
  // Check if user is authenticated
  if (!req.user || !req.user._id) {
    res.status(401);
    throw new Error("Not authorized, please login");
  }

  const petition = await Petition.findById(req.params.id);

  if (!petition) {
    res.status(404);
    throw new Error("Petition not found");
  }

  // Check if user has already signed this petition
  const hasAlreadySigned = petition.signatures.some(
    (signature) => signature.user.toString() === req.user._id.toString()
  );

  // Check if user is the creator of the petition
  const isCreator =
    petition.petitionStarter.user &&
    petition.petitionStarter.user.toString() === req.user._id.toString();

  res.status(200).json({
    hasSigned: hasAlreadySigned,
    isCreator: isCreator,
    canSign: !hasAlreadySigned && !isCreator,
  });
});

// @desc    Get petitions by country
// @route   GET /api/petitions/country/:country
// @access  Public
const getPetitionsByCountry = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const petitions = await Petition.find({
    country: req.params.country,
    approved: true,
  })
    .populate("petitionStarter.user", "name email")
    .sort({ createdAt: -1 })
    .skip(skip)
    .limit(limit);

  const totalPetitions = await Petition.countDocuments({
    country: req.params.country,
    approved: true,
  });

  res.status(200).json({
    petitions,
    country: req.params.country,
    currentPage: page,
    totalPages: Math.ceil(totalPetitions / limit),
    totalPetitions,
    hasNextPage: page < Math.ceil(totalPetitions / limit),
    hasPrevPage: page > 1,
  });
});

// @desc    Get popular petitions (by signature count)
// @route   GET /api/petitions/popular
// @access  Public
const getPopularPetitions = asyncHandler(async (req, res) => {
  const limit = parseInt(req.query.limit) || 10;

  const petitions = await Petition.find({ approved: true })
    .populate("petitionStarter.user", "name email")
    .sort({ numberOfSignatures: -1 })
    .limit(limit);

  res.status(200).json({
    petitions,
    totalCount: petitions.length,
  });
});

// @desc    Get petition statistics
// @route   GET /api/petitions/stats
// @access  Public
const getPetitionStats = asyncHandler(async (req, res) => {
  try {
    // Get total active petitions count
    const totalPetitions = await Petition.countDocuments();

    // Get total successful petitions count
    const totalSuccessfulPetitions = await SuccessfulPetition.countDocuments();

    // Get total signatures count from active petitions
    const activeSignatureStats = await Petition.aggregate([
      {
        $group: {
          _id: null,
          totalSignatures: { $sum: "$numberOfSignatures" },
        },
      },
    ]);

    // Get total signatures count from successful petitions
    const successfulSignatureStats = await SuccessfulPetition.aggregate([
      {
        $group: {
          _id: null,
          totalSignatures: { $sum: "$totalSignatures" },
        },
      },
    ]);

    const activeSignatures =
      activeSignatureStats.length > 0
        ? activeSignatureStats[0].totalSignatures
        : 0;
    const successfulSignatures =
      successfulSignatureStats.length > 0
        ? successfulSignatureStats[0].totalSignatures
        : 0;
    const totalSignatures = activeSignatures + successfulSignatures;

    // Get total users count
    const totalUsers = await User.countDocuments();

    // Calculate victories (both from successful petitions and high-signature active petitions)
    const highSignaturePetitions = await Petition.countDocuments({
      numberOfSignatures: { $gte: 1000 },
    });

    const victories = totalSuccessfulPetitions + highSignaturePetitions;

    // Get recent activity count (petitions created in last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentActivePetitions = await Petition.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    const recentSuccessfulPetitions = await SuccessfulPetition.countDocuments({
      successDate: { $gte: thirtyDaysAgo },
    });

    const recentActivity = recentActivePetitions + recentSuccessfulPetitions;

    console.log("Stats calculated:", {
      totalPetitions,
      totalSuccessfulPetitions,
      totalSignatures,
      totalUsers,
      victories,
      recentActivity,
    });

    res.status(200).json({
      totalPetitions: totalPetitions + totalSuccessfulPetitions, // Combined count
      totalSignatures,
      totalUsers,
      victories,
      recentActivity,
      breakdown: {
        activePetitions: totalPetitions,
        successfulPetitions: totalSuccessfulPetitions,
        activeSignatures,
        successfulSignatures,
      },
      message: "Petition statistics retrieved successfully",
    });
  } catch (error) {
    console.error("Error retrieving statistics:", error);
    res.status(500);
    throw new Error("Failed to retrieve statistics: " + error.message);
  }
});

export {
  createPetition,
  getPetitions,
  getAllPetitionsForAdmin,
  getPetitionById,
  updatePetition,
  deletePetition,
  getUserPetitions,
  signPetition,
  checkUserSignature,
  getPetitionsByCountry,
  getPopularPetitions,
  getPetitionStats,
};
