const logger = require("../utils/logger");
const jwt = require("jsonwebtoken");
require("dotenv").config();

const validateToken = (req, res, next) => {
    const authHeader = req.headers["authorization"]; // Get the Authorization header

    // Check if the authHeader exists and starts with "Bearer"
    if (!authHeader || !authHeader.startsWith("Bearer ")) {
        logger.warn("Access attempt without a valid Authorization header");
        return res.status(401).json({
            message: "Authentication required",
            success: false,
        });
    }

    // Extract the token from the header
    const token = authHeader.split(" ")[1];

    // Check if the token exists after splitting
    if (!token) {
        logger.warn("Access attempt without a valid token");
        return res.status(401).json({
            message: "Authentication required",
            success: false,
        });
    }

    // Verify the token using jwt.verify
    jwt.verify(token, process.env.JWT_SECRET, (err, user) => {
        if (err) {
            logger.warn("Invalid Token");
            return res.status(401).json({
                message: "Invalid token",
                success: false,
            });
        }

        // Attach the user object to the request and proceed
        req.user = user;
        next();
    });
};

module.exports = {
    validateToken,
};
