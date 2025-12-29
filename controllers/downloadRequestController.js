import asyncHandler from "express-async-handler";
import DownloadRequest from "../models/downloadRequestModel.js";
import Petition from "../models/petitionModel.js";
import Comment from "../models/commentModel.js";

// @desc    Create a download request for a petition
// @route   POST /api/download-requests
// @access  Private
const createDownloadRequest = asyncHandler(async (req, res) => {
    const { petitionId, reason } = req.body;

    if (!petitionId || !reason) {
        res.status(400);
        throw new Error("Please provide petition ID and reason for download request");
    }

    if (reason.length > 500) {
        res.status(400);
        throw new Error("Reason cannot exceed 500 characters");
    }

    // Check if petition exists
    const petition = await Petition.findById(petitionId);
    if (!petition) {
        res.status(404);
        throw new Error("Petition not found");
    }

    // Check if user already has a pending request for this petition
    const existingRequest = await DownloadRequest.findOne({
        petition: petitionId,
        user: req.user._id,
        status: "pending",
    });

    if (existingRequest) {
        res.status(400);
        throw new Error("You already have a pending download request for this petition");
    }

    // Create the download request
    const downloadRequest = await DownloadRequest.create({
        petition: petitionId,
        user: req.user._id,
        reason: reason.trim(),
    });

    res.status(201).json({
        success: true,
        message: "Download request submitted successfully. Please wait for admin approval.",
        request: downloadRequest,
    });
});

// @desc    Get user's download requests
// @route   GET /api/download-requests/my-requests
// @access  Private
const getUserDownloadRequests = asyncHandler(async (req, res) => {
    const requests = await DownloadRequest.find({ user: req.user._id })
        .populate("petition", "title _id")
        .sort({ createdAt: -1 });

    res.status(200).json({
        success: true,
        requests,
    });
});

// @desc    Check download request status for a specific petition
// @route   GET /api/download-requests/check/:petitionId
// @access  Private
const checkDownloadRequestStatus = asyncHandler(async (req, res) => {
    const { petitionId } = req.params;

    const request = await DownloadRequest.findOne({
        petition: petitionId,
        user: req.user._id,
    }).sort({ createdAt: -1 }); // Get the most recent request

    if (!request) {
        return res.status(200).json({
            success: true,
            hasRequest: false,
            canRequest: true,
            canDownload: false,
        });
    }

    res.status(200).json({
        success: true,
        hasRequest: true,
        status: request.status,
        canRequest: request.status === "rejected", // Can request again if rejected
        canDownload: request.status === "approved",
        request,
    });
});

// @desc    Download petition data (if approved)
// @route   GET /api/download-requests/download/:petitionId
// @access  Private
const downloadPetitionData = asyncHandler(async (req, res) => {
    const { petitionId } = req.params;

    // Check if user has an approved request
    const request = await DownloadRequest.findOne({
        petition: petitionId,
        user: req.user._id,
        status: "approved",
    });

    if (!request) {
        res.status(403);
        throw new Error("You do not have permission to download this petition data. Please request access first.");
    }

    // Fetch petition with all related data
    const petition = await Petition.findById(petitionId)
        .populate("petitionStarter.user", "name email designation")
        .populate("signatures.user", "name email designation");

    if (!petition) {
        res.status(404);
        throw new Error("Petition not found");
    }

    // Fetch all approved comments for this petition
    const comments = await Comment.find({
        petition: petitionId,
        isApproved: true,
    })
        .populate("user", "name email designation")
        .sort({ createdAt: -1 });

    // Format the download data
    const downloadData = {
        exportDate: new Date().toISOString(),
        exportedBy: {
            name: req.user.name,
            email: req.user.email,
        },
        petition: {
            id: petition._id,
            title: petition.title,
            country: petition.country,
            categories: petition.categories,
            createdAt: petition.createdAt,
            updatedAt: petition.updatedAt,
            approved: petition.approved,
            petitionDetails: {
                problem: petition.petitionDetails?.problem,
                solution: petition.petitionDetails?.solution,
                image: petition.petitionDetails?.image,
                videoUrl: petition.petitionDetails?.videoUrl,
            },
            petitionStarter: {
                name: petition.petitionStarter?.name,
                location: petition.petitionStarter?.location,
                comment: petition.petitionStarter?.comment,
            },
            decisionMakers: petition.decisionMakers?.map((dm) => ({
                name: dm.name,
                organization: dm.organization,
                email: dm.email,
            })),
        },
        statistics: {
            totalSignatures: petition.numberOfSignatures || petition.signatures?.length || 0,
            totalComments: comments.length,
        },
        signatures: petition.signatures?.map((sig) => ({
            name: sig.user?.name || "Anonymous",
            email: sig.user?.email || "N/A",
            designation: sig.user?.designation || "N/A",
            signedAt: sig.signedAt,
            referralCode: sig.referral?.code || null,
        })),
        comments: comments.map((comment) => ({
            author: comment.user?.name || "Anonymous",
            authorEmail: comment.user?.email || "N/A",
            content: comment.content,
            createdAt: comment.createdAt,
            likesCount: comment.likes?.length || 0,
            repliesCount: comment.replies?.length || 0,
        })),
    };

    // Update download count and track download
    request.downloadCount += 1;
    request.downloadedAt = new Date();
    await request.save();

    // Set headers for file download
    res.setHeader("Content-Type", "application/json");
    res.setHeader(
        "Content-Disposition",
        `attachment; filename="petition-${petition._id}-data.json"`
    );

    res.status(200).json(downloadData);
});

// =====================
// ADMIN ROUTES
// =====================

// @desc    Get all download requests (Admin)
// @route   GET /api/download-requests/admin/all
// @access  Admin
const getAllDownloadRequests = asyncHandler(async (req, res) => {
    const { status, page = 1, limit = 20 } = req.query;
    const skip = (parseInt(page) - 1) * parseInt(limit);

    const filter = {};
    if (status && ["pending", "approved", "rejected"].includes(status)) {
        filter.status = status;
    }

    const requests = await DownloadRequest.find(filter)
        .populate("petition", "title _id")
        .populate("user", "name email designation")
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(parseInt(limit));

    const totalRequests = await DownloadRequest.countDocuments(filter);

    res.status(200).json({
        success: true,
        requests,
        currentPage: parseInt(page),
        totalPages: Math.ceil(totalRequests / parseInt(limit)),
        totalRequests,
    });
});

// @desc    Get pending download requests count (Admin)
// @route   GET /api/download-requests/admin/pending-count
// @access  Admin
const getPendingRequestsCount = asyncHandler(async (req, res) => {
    const count = await DownloadRequest.countDocuments({ status: "pending" });

    res.status(200).json({
        success: true,
        count,
    });
});

// @desc    Approve a download request (Admin)
// @route   PUT /api/download-requests/admin/:id/approve
// @access  Admin
const approveDownloadRequest = asyncHandler(async (req, res) => {
    const { adminNote } = req.body;

    const request = await DownloadRequest.findById(req.params.id);

    if (!request) {
        res.status(404);
        throw new Error("Download request not found");
    }

    if (request.status !== "pending") {
        res.status(400);
        throw new Error("This request has already been processed");
    }

    request.status = "approved";
    request.approvedBy = req.admin?.username || "admin";
    request.approvedAt = new Date();
    if (adminNote) {
        request.adminNote = adminNote.trim();
    }

    await request.save();

    res.status(200).json({
        success: true,
        message: "Download request approved successfully",
        request,
    });
});

// @desc    Reject a download request (Admin)
// @route   PUT /api/download-requests/admin/:id/reject
// @access  Admin
const rejectDownloadRequest = asyncHandler(async (req, res) => {
    const { adminNote } = req.body;

    const request = await DownloadRequest.findById(req.params.id);

    if (!request) {
        res.status(404);
        throw new Error("Download request not found");
    }

    if (request.status !== "pending") {
        res.status(400);
        throw new Error("This request has already been processed");
    }

    request.status = "rejected";
    request.approvedBy = req.admin?.username || "admin";
    request.approvedAt = new Date();
    if (adminNote) {
        request.adminNote = adminNote.trim();
    }

    await request.save();

    res.status(200).json({
        success: true,
        message: "Download request rejected",
        request,
    });
});

export {
    createDownloadRequest,
    getUserDownloadRequests,
    checkDownloadRequestStatus,
    downloadPetitionData,
    getAllDownloadRequests,
    getPendingRequestsCount,
    approveDownloadRequest,
    rejectDownloadRequest,
};
