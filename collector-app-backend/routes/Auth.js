const express = require("express");
const jwt = require("jsonwebtoken");
const passport = require('passport');
const User = require("../models/User");

const router = express.Router();

// --- THIS IS THE DIAGNOSTIC VERSION - PLEASE USE THIS EXACT CODE ---
router.post("/login", (req, res, next) => {
    console.log(`[ROUTE /api/auth/login] Attempting login for user: ${req.body.username}`);
    
    passport.authenticate('local', { session: false }, (err, user, info) => {
        if (err) {
            return res.status(500).json({ success: false, message: 'Server error.' });
        }
        if (!user) {
            return res.status(401).json({ success: false, message: info.message || "Invalid credentials." });
        }

        console.log(`[ROUTE /api/auth/login] Passport authentication successful for: ${user.username}`);

        // =================================================================
        // !! CRITICAL DIAGNOSTIC LOG !!
        // This will show us EXACTLY what is in the user object from Passport.
        console.log("--- PASSPORT USER OBJECT RECEIVED ---");
        console.log(user.toObject ? user.toObject() : user); // Use .toObject() if it's a Mongoose doc
        console.log("-------------------------------------");
        // =================================================================

        const token = jwt.sign(
            { id: user._id, role: user.role },
            process.env.JWT_SECRET,
            { expiresIn: "1h" }
        );
        console.log(`[ROUTE /api/auth/login] JWT generated for ${user.username}.`);

        return res.json({
            success: true,
            token: token,
            user: {
                id: user._id,
                username: user.username,
                role: user.role,
                mustChangePassword: user.mustChangePassword
            }
        });

    })(req, res, next);
});

module.exports = router;