const express = require('express');
const router = express.Router();
const passport = require('passport'); // Assuming you use Passport for auth
const Entry = require('../models/Entry'); // Import the new model
const { body, validationResult } = require('express-validator'); // For input validation

// --- POST /api/entries - Create a new entry ---
// Protect this route: Only logged-in users can create entries
router.post(
    '/',
    passport.authenticate('jwt', { session: false }), // Or your session auth middleware
    [
        // --- Server-side Input Validation ---
        // Matches your frontend requirements + schema
        body('name', 'Name is required').not().isEmpty().trim(),
        body('street', 'Street is required').not().isEmpty().trim(),
        body('zipcode', 'Zipcode is required').not().isEmpty().trim(),
        // Optional: Add specific zipcode validation: .isLength({min: 4, max: 4}).isNumeric(),
        body('city', 'City is required').not().isEmpty().trim(),
        body('floor').optional().trim(),
        body('door').optional().trim(),
        body('telephone', 'Telephone is required').not().isEmpty().trim(),
        // Optional: Add specific phone validation: .isLength({ max: 11 }).isNumeric(),
        body('email', 'Valid email is required').isEmail().normalizeEmail(),
    ],
    async (req, res) => {
        // 1. Check for validation errors
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            // Return validation errors to the frontend
            return res.status(400).json({ errors: errors.array() });
        }

        // 2. Extract validated data from request body
        const { name, street, zipcode, city, floor, door, telephone, email } = req.body;

        try {
            // 3. Create a new Entry document
            const newEntry = new Entry({
                name,
                street,
                zipcode,
                city,
                floor,
                door,
                telephone,
                email,
                createdBy: req.user._id // <-- Get user ID from authenticated user (Passport attaches user to req.user)
            });

            // 4. Save the entry to the database
            await newEntry.save();

            // 5. Send success response (e.g., the created entry)
            res.status(201).json(newEntry); // 201 Created is appropriate

        } catch (error) {
            console.error("Error saving entry:", error);
            // Handle potential errors (e.g., database errors)
            res.status(500).json({ message: 'Server error saving entry.' });
        }
    }
);

// --- TODO: Add routes for retrieving entries later ---
// GET /api/entries (get all entries for logged-in user? or all for admin?)
// GET /api/entries/:id (get a specific entry)
// PUT /api/entries/:id (update an entry)
// DELETE /api/entries/:id (delete an entry)

module.exports = router;