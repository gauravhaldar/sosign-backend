import crypto from "crypto";
import jwt from "jsonwebtoken";

const DEFAULT_JWT_SECRET = "default_jwt_secret_key";

const getJwtSecret = () => process.env.JWT_SECRET || DEFAULT_JWT_SECRET;

const normalizeAadhaarNumber = (value = "") =>
  value.toString().replace(/\D/g, "");

const isValidAadhaarNumber = (aadhaarNumber = "") =>
  /^[2-9]\d{11}$/.test(aadhaarNumber);

const maskAadhaarNumber = (aadhaarNumber = "") => {
  if (!aadhaarNumber || aadhaarNumber.length < 4) {
    return "************";
  }
  return `XXXXXXXX${aadhaarNumber.slice(-4)}`;
};

const hashAadhaarNumber = (aadhaarNumber = "") => {
  return crypto.createHash("sha256").update(aadhaarNumber).digest("hex");
};

const createAadhaarOtpSessionToken = ({ userId, aadhaarNumber, refId }) => {
  if (!userId || !aadhaarNumber || !refId) {
    throw new Error("Missing values for Aadhaar OTP session token");
  }

  return jwt.sign(
    {
      purpose: "aadhaar_otp_session",
      userId: userId.toString(),
      aadhaarHash: hashAadhaarNumber(aadhaarNumber),
      refId: refId.toString(),
    },
    getJwtSecret(),
    { expiresIn: process.env.AADHAAR_OTP_SESSION_EXPIRY || "10m" },
  );
};

const verifyAadhaarOtpSessionToken = (token) => {
  const decoded = jwt.verify(token, getJwtSecret());
  if (decoded.purpose !== "aadhaar_otp_session") {
    throw new Error("Invalid Aadhaar OTP session token");
  }
  return decoded;
};

const createAadhaarVerificationToken = ({
  userId,
  aadhaarNumber,
  providerRefId,
}) => {
  if (!userId || !aadhaarNumber) {
    throw new Error("Missing values for Aadhaar verification token");
  }

  return jwt.sign(
    {
      purpose: "aadhaar_verified",
      userId: userId.toString(),
      aadhaarHash: hashAadhaarNumber(aadhaarNumber),
      providerRefId: providerRefId ? providerRefId.toString() : undefined,
    },
    getJwtSecret(),
    { expiresIn: process.env.AADHAAR_VERIFIED_TOKEN_EXPIRY || "30m" },
  );
};

const verifyAadhaarVerificationToken = (token) => {
  const decoded = jwt.verify(token, getJwtSecret());
  if (decoded.purpose !== "aadhaar_verified") {
    throw new Error("Invalid Aadhaar verification token");
  }
  return decoded;
};

export {
  normalizeAadhaarNumber,
  isValidAadhaarNumber,
  maskAadhaarNumber,
  hashAadhaarNumber,
  createAadhaarOtpSessionToken,
  verifyAadhaarOtpSessionToken,
  createAadhaarVerificationToken,
  verifyAadhaarVerificationToken,
};
