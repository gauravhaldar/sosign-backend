import asyncHandler from "express-async-handler";
import generateToken from "../utils/generateToken.js";
import User from "../models/userModel.js";

// @desc    Auth user & get token
// @route   POST /api/users/login
// @access  Public
const authUser = asyncHandler(async (req, res) => {
  const { email, password } = req.body;

  const user = await User.findOne({ email });

  if (user && (await user.matchPassword(password))) {
    const token = generateToken(res, user._id);

    // Populate petitions before sending the response
    const userWithPetitions = await User.findById(user._id).populate(
      "petitions"
    );

    res.json({
      _id: userWithPetitions._id,
      name: userWithPetitions.name,
      email: userWithPetitions.email,
      uniqueCode: userWithPetitions.uniqueCode,
      designation: userWithPetitions.designation,
      mobileNumber: userWithPetitions.mobileNumber,
      petitions: userWithPetitions.petitions, // Include petitions data
      token: token, // Include token in response
    });
  } else {
    res.status(401);
    throw new Error("Invalid email or password");
  }
});

// @desc    Register a new user
// @route   POST /api/users
// @access  Public
const registerUser = asyncHandler(async (req, res) => {
  const { name, designation, email, mobileNumber, password } = req.body;

  const userExists = await User.findOne({ email });

  if (userExists) {
    res.status(400);
    throw new Error("User already exists");
  }

  const user = await User.create({
    name,
    designation,
    email,
    mobileNumber,
    password,
  });

  if (user) {
    const token = generateToken(res, user._id);

    res.status(201).json({
      _id: user._id,
      name: user.name,
      uniqueCode: user.uniqueCode,
      designation: user.designation,
      email: user.email,
      mobileNumber: user.mobileNumber,
      token: token, // Include token in response
    });
  } else {
    res.status(400);
    throw new Error("Invalid user data");
  }
});

// @desc    Logout user / clear cookie
// @route   POST /api/users/logout
// @access  Public
const logoutUser = asyncHandler(async (req, res) => {
  res.cookie("jwt", "", {
    httpOnly: true,
    expires: new Date(0),
  });
  res.status(200).json({ message: "Logged out successfully" });
});

// @desc    Get user profile
// @route   GET /api/users/profile
// @access  Private
const getUserProfile = asyncHandler(async (req, res) => {
  const user = {
    _id: req.user._id,
    name: req.user.name,
    uniqueCode: req.user.uniqueCode,
    designation: req.user.designation,
    email: req.user.email,
    mobileNumber: req.user.mobileNumber,
  };

  // Fetch the full user object with populated petitions
  const userWithPetitions = await User.findById(req.user._id).populate(
    "petitions"
  );

  if (userWithPetitions) {
    res.status(200).json({
      _id: userWithPetitions._id,
      name: userWithPetitions.name,
      uniqueCode: userWithPetitions.uniqueCode,
      designation: userWithPetitions.designation,
      email: userWithPetitions.email,
      mobileNumber: userWithPetitions.mobileNumber,
      petitions: userWithPetitions.petitions,
    });
  } else {
    res.status(404);
    throw new Error("User not found");
  }
});

// @desc    Auth user with Google
// @route   POST /api/users/google-auth
// @access  Public
const authGoogleUser = asyncHandler(async (req, res) => {
  const { email, name, photoURL, uid } = req.body;

  let user = await User.findOne({ email });

  if (user) {
    // User exists, log them in
    const token = generateToken(res, user._id);
    res.json({
      _id: user._id,
      name: user.name,
      email: user.email,
      uniqueCode: user.uniqueCode,
      designation: user.designation, // May not be available for Google sign-ups
      mobileNumber: user.mobileNumber, // May not be available for Google sign-ups
      photoURL: user.photoURL || photoURL, // Update photoURL if available
      petitions: user.petitions, // Include petitions data
      token: token, // Include token in response
    });
  } else {
    // User does not exist, register them
    user = await User.create({
      name,
      email,
      photoURL,
      googleId: uid, // Store Google's UID for future reference
      // For Google registered users, password/designation/mobileNumber might be optional
      // You might want to handle default values or prompt user later for these
    });

    if (user) {
      const token = generateToken(res, user._id);
      res.status(201).json({
        _id: user._id,
        name: user.name,
        email: user.email,
        photoURL: user.photoURL,
        uniqueCode: user.uniqueCode,
        designation: user.designation,
        mobileNumber: user.mobileNumber,
        petitions: user.petitions, // Include petitions data
        token: token, // Include token in response
      });
    } else {
      res.status(400);
      throw new Error("Invalid Google user data");
    }
  }
});

export { authUser, registerUser, logoutUser, getUserProfile, authGoogleUser };
// @desc    Get public user info by unique code
// @route   GET /api/users/code/:code
// @access  Public
const getUserByCode = asyncHandler(async (req, res) => {
  const code = (req.params.code || "").trim().toUpperCase();
  if (!code) {
    res.status(400);
    throw new Error("Code is required");
  }
  const user = await User.findOne({ uniqueCode: code }).select(
    "name email designation uniqueCode"
  );
  if (!user) {
    res.status(404);
    throw new Error("User not found for this code");
  }
  res.status(200).json({
    _id: user._id,
    name: user.name,
    email: user.email,
    designation: user.designation,
    uniqueCode: user.uniqueCode,
  });
});

export { getUserByCode };
