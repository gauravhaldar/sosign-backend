import asyncHandler from "express-async-handler";
import {
  normalizeAadhaarNumber,
  isValidAadhaarNumber,
  maskAadhaarNumber,
  hashAadhaarNumber,
  createAadhaarOtpSessionToken,
  verifyAadhaarOtpSessionToken,
  createAadhaarVerificationToken,
} from "../utils/aadhaarVerificationUtils.js";
import {
  sendAadhaarOtpWithPlanApi,
  verifyAadhaarOtpWithPlanApi,
} from "../utils/planApiAadhaar.js";

// @desc    Send Aadhaar OTP for verification
// @route   POST /api/aadhaar/send-otp
// @access  Private
const sendAadhaarOtp = asyncHandler(async (req, res) => {
  const aadhaarInput = req.body?.aadhaarNumber || req.body?.aadharNumber;
  const aadhaarNumber = normalizeAadhaarNumber(aadhaarInput);

  if (!isValidAadhaarNumber(aadhaarNumber)) {
    res.status(400);
    throw new Error("Please enter a valid 12-digit Aadhaar number");
  }

  let sendOtpResult;
  try {
    sendOtpResult = await sendAadhaarOtpWithPlanApi(aadhaarNumber);
  } catch (error) {
    const message = error?.message || "Failed to send Aadhaar OTP";

    if (/whitelist|ip address/i.test(message)) {
      res.status(403);
      throw new Error(
        `${message}. Please whitelist your server/public IP in the PlanAPI dashboard.`,
      );
    }

    res.status(502);
    throw new Error(message);
  }

  const { refId, message, testMode, apiMode } = sendOtpResult;

  const otpSessionToken = createAadhaarOtpSessionToken({
    userId: req.user._id.toString(),
    aadhaarNumber,
    refId,
  });

  res.status(200).json({
    success: true,
    message: message || "OTP has been sent to Aadhaar-registered mobile number",
    otpSessionToken,
    maskedAadhaar: maskAadhaarNumber(aadhaarNumber),
    testMode,
    apiMode,
  });
});

// @desc    Verify Aadhaar OTP and return verification token
// @route   POST /api/aadhaar/verify-otp
// @access  Private
const verifyAadhaarOtp = asyncHandler(async (req, res) => {
  const { otpSessionToken, otp } = req.body || {};
  const aadhaarInput = req.body?.aadhaarNumber || req.body?.aadharNumber;
  const aadhaarNumber = normalizeAadhaarNumber(aadhaarInput);

  if (!otpSessionToken) {
    res.status(400);
    throw new Error("OTP session token is required");
  }

  if (!isValidAadhaarNumber(aadhaarNumber)) {
    res.status(400);
    throw new Error("Please enter a valid 12-digit Aadhaar number");
  }

  const otpValue = String(otp || "").trim();
  if (!/^\d{4,8}$/.test(otpValue)) {
    res.status(400);
    throw new Error("Please enter a valid OTP");
  }

  let decodedSession;
  try {
    decodedSession = verifyAadhaarOtpSessionToken(otpSessionToken);
  } catch (error) {
    res.status(401);
    throw new Error("Invalid or expired OTP session. Please send OTP again.");
  }

  if (decodedSession.userId !== req.user._id.toString()) {
    res.status(403);
    throw new Error("OTP session does not belong to this user");
  }

  if (decodedSession.aadhaarHash !== hashAadhaarNumber(aadhaarNumber)) {
    res.status(400);
    throw new Error("Entered Aadhaar number does not match OTP session");
  }

  let verifyOtpResult;
  try {
    verifyOtpResult = await verifyAadhaarOtpWithPlanApi({
      aadhaarNumber,
      refId: decodedSession.refId,
      otp: otpValue,
    });
  } catch (error) {
    const message = error?.message || "Failed to verify Aadhaar OTP";

    if (/whitelist|ip address/i.test(message)) {
      res.status(403);
      throw new Error(
        `${message}. Please whitelist your server/public IP in the PlanAPI dashboard.`,
      );
    }

    res.status(502);
    throw new Error(message);
  }

  const { message } = verifyOtpResult;

  const aadhaarVerificationToken = createAadhaarVerificationToken({
    userId: req.user._id.toString(),
    aadhaarNumber,
    providerRefId: decodedSession.refId,
  });

  res.status(200).json({
    success: true,
    message: message || "Aadhaar verified successfully",
    aadhaarVerificationToken,
    // Backward-compatible key spelling to avoid frontend mismatches.
    aadharVerificationToken: aadhaarVerificationToken,
    maskedAadhaar: maskAadhaarNumber(aadhaarNumber),
  });
});

export { sendAadhaarOtp, verifyAadhaarOtp };
