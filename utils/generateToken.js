import jwt from "jsonwebtoken";

const generateToken = (res, userId) => {
  const token = jwt.sign(
    { userId },
    process.env.JWT_SECRET || "default_jwt_secret_key",
    {
      expiresIn: "1h",
    },
  );

  res.cookie("jwt", token, {
    httpOnly: false, // Set to false to allow frontend access
    secure: process.env.NODE_ENV !== "development", // Use original secure logic
    sameSite: process.env.NODE_ENV === "development" ? "lax" : "strict", // Use original sameSite logic
    maxAge: 3600000, // 1 hour
  });
  return token; // Return the token
};

export default generateToken;
