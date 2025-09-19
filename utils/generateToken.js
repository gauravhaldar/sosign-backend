import jwt from "jsonwebtoken";

const generateToken = (res, userId) => {
  const token = jwt.sign({ userId }, process.env.JWT_SECRET || "default_jwt_secret_key", {
    expiresIn: "1h",
  });

  console.log('NODE_ENV in generateToken:', process.env.NODE_ENV); // Debugging line
  console.log('JWT_SECRET in generateToken:', process.env.JWT_SECRET); // Debugging line
  res.cookie("jwt", token, {
    httpOnly: false, // Set to false to allow frontend access
    secure: process.env.NODE_ENV !== "development", // Use original secure logic
    sameSite: process.env.NODE_ENV === "development" ? "lax" : "strict", // Use original sameSite logic
    maxAge: 3600000, // 1 hour
  });
  console.log('JWT cookie attempted to be set.'); // Debugging line
  return token; // Return the token
};

export default generateToken;
