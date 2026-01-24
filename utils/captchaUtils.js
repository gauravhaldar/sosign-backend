import jwt from "jsonwebtoken";

const CAPTCHA_EXPIRY = "5m"; // CAPTCHA valid for 5 minutes

/**
 * Generate a random math CAPTCHA challenge
 * Returns { question: string, token: string }
 */
export const generateCaptcha = () => {
    // Generate two random numbers between 1 and 20
    const num1 = Math.floor(Math.random() * 20) + 1;
    const num2 = Math.floor(Math.random() * 20) + 1;

    // Randomly choose addition or subtraction
    const isAddition = Math.random() > 0.5;

    let question, answer;

    if (isAddition) {
        question = `${num1} + ${num2}`;
        answer = num1 + num2;
    } else {
        // For subtraction, ensure result is positive
        const larger = Math.max(num1, num2);
        const smaller = Math.min(num1, num2);
        question = `${larger} - ${smaller}`;
        answer = larger - smaller;
    }

    // Create a signed token containing the answer
    const token = jwt.sign(
        { answer, type: "captcha" },
        process.env.JWT_SECRET,
        { expiresIn: CAPTCHA_EXPIRY }
    );

    return { question, token };
};

/**
 * Verify a CAPTCHA answer against the token
 * @param {string} token - The CAPTCHA token
 * @param {number|string} userAnswer - The user's answer
 * @returns {{ valid: boolean, error?: string }}
 */
export const verifyCaptcha = (token, userAnswer) => {
    if (!token || userAnswer === undefined || userAnswer === null || userAnswer === "") {
        return { valid: false, error: "CAPTCHA answer is required" };
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if (decoded.type !== "captcha") {
            return { valid: false, error: "Invalid CAPTCHA token" };
        }

        // Compare answers (convert to number for comparison)
        const numericAnswer = parseInt(userAnswer, 10);

        if (isNaN(numericAnswer)) {
            return { valid: false, error: "CAPTCHA answer must be a number" };
        }

        if (numericAnswer !== decoded.answer) {
            return { valid: false, error: "Incorrect CAPTCHA answer" };
        }

        return { valid: true };
    } catch (error) {
        if (error.name === "TokenExpiredError") {
            return { valid: false, error: "CAPTCHA has expired, please refresh and try again" };
        }
        if (error.name === "JsonWebTokenError") {
            return { valid: false, error: "Invalid CAPTCHA token" };
        }
        return { valid: false, error: "CAPTCHA verification failed" };
    }
};
