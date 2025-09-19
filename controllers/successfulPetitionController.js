import asyncHandler from "express-async-handler";
import SuccessfulPetition from "../models/successfulPetitionModel.js";
import Petition from "../models/petitionModel.js";

// @desc    Create a new successful petition
// @route   POST /api/successful-petitions
// @access  Private
const createSuccessfulPetition = asyncHandler(async (req, res) => {
  const {
    petitionTitle,
    totalSignatures,
    decisionMakers,
    issue,
    location,
    petitionStarterName,
    startedDate,
    image,
    originalPetitionId,
    outcome,
    category,
  } = req.body;

  // Validate required fields
  if (
    !petitionTitle ||
    totalSignatures === undefined || totalSignatures === null ||
    !decisionMakers ||
    !issue ||
    !location ||
    !petitionStarterName ||
    !startedDate
  ) {
    res.status(400);
    throw new Error("Please provide all required fields");
  }

  // Validate decision makers array
  if (!Array.isArray(decisionMakers) || decisionMakers.length === 0) {
    res.status(400);
    throw new Error("At least one decision maker is required");
  }

  // Validate each decision maker
  for (const dm of decisionMakers) {
    if (!dm.name || !dm.email) {
      res.status(400);
      throw new Error("Decision maker name and email are required");
    }
  }

  // Check if original petition exists (if provided)
  if (originalPetitionId) {
    const originalPetition = await Petition.findById(originalPetitionId);
    if (!originalPetition) {
      res.status(404);
      throw new Error("Original petition not found");
    }
  }

  const successfulPetition = await SuccessfulPetition.create({
    petitionTitle,
    totalSignatures: parseInt(totalSignatures),
    decisionMakers,
    issue,
    location,
    petitionStarterName,
    startedDate: new Date(startedDate),
    image,
    originalPetitionId: originalPetitionId || undefined,
    outcome,
    category,
  });

  if (successfulPetition) {
    res.status(201).json({
      success: true,
      message: "Successful petition created successfully",
      successfulPetition,
    });
  } else {
    res.status(400);
    throw new Error("Invalid successful petition data");
  }
});

// @desc    Get all successful petitions
// @route   GET /api/successful-petitions
// @access  Public
const getSuccessfulPetitions = asyncHandler(async (req, res) => {
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  // Build filter object
  const filter = {};
  
  if (req.query.category) {
    filter.category = req.query.category;
  }
  
  if (req.query.location) {
    filter.location = { $regex: req.query.location, $options: "i" };
  }

  // Add search functionality
  if (req.query.search) {
    filter.$or = [
      { petitionTitle: { $regex: req.query.search, $options: "i" } },
      { issue: { $regex: req.query.search, $options: "i" } },
      { outcome: { $regex: req.query.search, $options: "i" } },
    ];
  }

  // Build sort object
  let sort = { successDate: -1 }; // Default: newest first
  
  if (req.query.sort === "signatures") {
    sort = { totalSignatures: -1 };
  } else if (req.query.sort === "title") {
    sort = { petitionTitle: 1 };
  } else if (req.query.sort === "oldest") {
    sort = { successDate: 1 };
  }

  const total = await SuccessfulPetition.countDocuments(filter);
  const successfulPetitions = await SuccessfulPetition.find(filter)
    .sort(sort)
    .skip(skip)
    .limit(limit)
    .populate("originalPetitionId", "title slug");

  res.json({
    success: true,
    successfulPetitions,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalResults: total,
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
});

// @desc    Get successful petition by ID
// @route   GET /api/successful-petitions/:id
// @access  Public
const getSuccessfulPetitionById = asyncHandler(async (req, res) => {
  const successfulPetition = await SuccessfulPetition.findById(req.params.id)
    .populate("originalPetitionId", "title slug numberOfSignatures");

  if (successfulPetition) {
    res.json({
      success: true,
      successfulPetition,
    });
  } else {
    res.status(404);
    throw new Error("Successful petition not found");
  }
});

// @desc    Update successful petition
// @route   PUT /api/successful-petitions/:id
// @access  Private
const updateSuccessfulPetition = asyncHandler(async (req, res) => {
  const successfulPetition = await SuccessfulPetition.findById(req.params.id);

  if (!successfulPetition) {
    res.status(404);
    throw new Error("Successful petition not found");
  }

  const {
    petitionTitle,
    totalSignatures,
    decisionMakers,
    issue,
    location,
    petitionStarterName,
    startedDate,
    image,
    outcome,
    category,
  } = req.body;

  // Validate decision makers if provided
  if (decisionMakers) {
    if (!Array.isArray(decisionMakers) || decisionMakers.length === 0) {
      res.status(400);
      throw new Error("At least one decision maker is required");
    }

    for (const dm of decisionMakers) {
      if (!dm.name || !dm.email) {
        res.status(400);
        throw new Error("Decision maker name and email are required");
      }
    }
  }

  // Update fields
  successfulPetition.petitionTitle = petitionTitle || successfulPetition.petitionTitle;
  successfulPetition.totalSignatures = totalSignatures !== undefined 
    ? parseInt(totalSignatures) 
    : successfulPetition.totalSignatures;
  successfulPetition.decisionMakers = decisionMakers || successfulPetition.decisionMakers;
  successfulPetition.issue = issue || successfulPetition.issue;
  successfulPetition.location = location || successfulPetition.location;
  successfulPetition.petitionStarterName = petitionStarterName || successfulPetition.petitionStarterName;
  successfulPetition.startedDate = startedDate 
    ? new Date(startedDate) 
    : successfulPetition.startedDate;
  successfulPetition.image = image !== undefined ? image : successfulPetition.image;
  successfulPetition.outcome = outcome !== undefined ? outcome : successfulPetition.outcome;
  successfulPetition.category = category || successfulPetition.category;

  const updatedSuccessfulPetition = await successfulPetition.save();

  res.json({
    success: true,
    message: "Successful petition updated successfully",
    successfulPetition: updatedSuccessfulPetition,
  });
});

// @desc    Delete successful petition
// @route   DELETE /api/successful-petitions/:id
// @access  Private (Admin or authenticated user)
const deleteSuccessfulPetition = asyncHandler(async (req, res) => {
  const successfulPetition = await SuccessfulPetition.findById(req.params.id);

  if (!successfulPetition) {
    res.status(404);
    throw new Error("Successful petition not found");
  }

  // Allow admin deletion or user deletion (if user is authenticated)
  const isAdmin = req.admin; // Admin requests have req.admin set by adminAuth middleware
  const isUser = req.user; // User requests have req.user set by protect middleware
  
  if (!isAdmin && !isUser) {
    res.status(403);
    throw new Error("Not authorized to delete this successful petition");
  }

  await SuccessfulPetition.findByIdAndDelete(req.params.id);

  res.json({
    success: true,
    message: "Successful petition deleted successfully",
  });
});

// @desc    Get successful petitions by category
// @route   GET /api/successful-petitions/category/:category
// @access  Public
const getSuccessfulPetitionsByCategory = asyncHandler(async (req, res) => {
  const { category } = req.params;
  const page = parseInt(req.query.page) || 1;
  const limit = parseInt(req.query.limit) || 10;
  const skip = (page - 1) * limit;

  const total = await SuccessfulPetition.countDocuments({ category });
  const successfulPetitions = await SuccessfulPetition.find({ category })
    .sort({ successDate: -1 })
    .skip(skip)
    .limit(limit)
    .populate("originalPetitionId", "title slug");

  res.json({
    success: true,
    successfulPetitions,
    category,
    pagination: {
      currentPage: page,
      totalPages: Math.ceil(total / limit),
      totalResults: total,
      hasNext: page * limit < total,
      hasPrev: page > 1,
    },
  });
});

// @desc    Get successful petitions statistics
// @route   GET /api/successful-petitions/stats
// @access  Public
const getSuccessfulPetitionsStats = asyncHandler(async (req, res) => {
  const totalSuccessfulPetitions = await SuccessfulPetition.countDocuments();
  
  const categoryStats = await SuccessfulPetition.aggregate([
    {
      $group: {
        _id: "$category",
        count: { $sum: 1 },
        totalSignatures: { $sum: "$totalSignatures" },
      },
    },
    {
      $sort: { count: -1 },
    },
  ]);

  const locationStats = await SuccessfulPetition.aggregate([
    {
      $group: {
        _id: "$location",
        count: { $sum: 1 },
      },
    },
    {
      $sort: { count: -1 },
    },
    {
      $limit: 10,
    },
  ]);

  const totalSignatures = await SuccessfulPetition.aggregate([
    {
      $group: {
        _id: null,
        total: { $sum: "$totalSignatures" },
      },
    },
  ]);

  res.json({
    success: true,
    stats: {
      totalSuccessfulPetitions,
      totalSignatures: totalSignatures[0]?.total || 0,
      categoryBreakdown: categoryStats,
      topLocations: locationStats,
    },
  });
});

export {
  createSuccessfulPetition,
  getSuccessfulPetitions,
  getSuccessfulPetitionById,
  updateSuccessfulPetition,
  deleteSuccessfulPetition,
  getSuccessfulPetitionsByCategory,
  getSuccessfulPetitionsStats,
};
