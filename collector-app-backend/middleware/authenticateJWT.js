const jwt = require('jsonwebtoken');
const User = require('../models/User'); // Adjust path to your User model if needed
const JWT_SECRET = process.env.JWT_SECRET;

const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    if (authHeader && authHeader.startsWith("Bearer ")) {
        const token = authHeader.split(" ")[1];

        if (!JWT_SECRET) {
             console.error("❌ FATAL: JWT_SECRET environment variable is not set.");
             return res.status(500).json({ success: false, message: "Internal server configuration error." });
        }

        jwt.verify(token, JWT_SECRET, async (err, decoded) => { // Make callback async
            if (err) {
                console.warn("⚠️ JWT Verification Error:", err.message);
                // Customize messages based on error type
                let message = "Invalid or expired token.";
                if (err.name === 'TokenExpiredError') {
                    message = 'Token has expired.';
                } else if (err.name === 'JsonWebTokenError') {
                    message = 'Token is invalid.';
                }
                // Use 401 for token expiry/invalidity issues that might be resolvable by re-login
                return res.status(401).json({ success: false, message: message });
            }

            try {
                 // --- IMPORTANT: Fetch user from DB using ID from token ---
                 // This ensures the user exists and you get up-to-date info (like role)
                 // It also prevents deleted users from accessing using old tokens.
                 // Select '-password' to ensure the hash is not included.
                 const user = await User.findById(decoded.id).select('-password');

                 if (!user) {
                     console.warn(`⚠️ User ID ${decoded.id} from valid JWT not found in DB.`);
                     return res.status(401).json({ success: false, message: "Unauthorized: User not found." });
                 }

                 // --- Attach the USER OBJECT from the DB to the request ---
                 req.user = user; // Attaching the full Mongoose user object (without password)
                 console.log(`[AuthJWT] User authenticated via JWT: ${user.username} (ID: ${user.id})`); // Debug log
                 next(); // Proceed to the next middleware or route handler

            } catch (dbError) {
                 console.error("❌ DB error during JWT user lookup:", dbError);
                 return res.status(500).json({ success: false, message: "Internal server error during authentication." });
            }
        });
    } else {
        console.warn("⚠️ Missing or malformed Authorization header.");
        // Use 401 Unauthorized when no token is provided
        res.status(401).json({ success: false, message: "Unauthorized: Authorization token required." });
    }
};

module.exports = authenticateJWT;