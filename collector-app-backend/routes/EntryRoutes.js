// src/routes/EntryRoutes.js
const express = require('express');
const router = express.Router();
const passport = require('passport');
const mongoose = require('mongoose'); // For ObjectId.isValid
const { Parser } = require('json2csv'); // <<<< ADDED for CSV Export

const Entry = require('../models/Entry'); // Your Mongoose Entry model
const { body, validationResult } = require('express-validator');
const authorize = require('../middleware/AuthMiddleware'); // Make sure this path is correct
const { permissions } = require('../config/Roles'); // Make sure this path is correct

// --- Helper function to parse street (DRY principle) ---
const parseStreetAddress = (fullStreet) => {
    let addressLine1 = fullStreet || '';
    let addressLine2 = '';
    if (fullStreet) {
        const parts = fullStreet.split(', ', 2); // Assuming ", " as separator
        if (parts.length > 0) addressLine1 = parts[0];
        if (parts.length > 1) addressLine2 = parts[1];
    }
    return { addressLine1, addressLine2 };
};


// --- POST /api/entries - Create a new entry ---
router.post(
    '/',
    passport.authenticate('jwt', { session: false }),
    authorize(permissions.CREATE_ENTRY || 'create_entry'),
    [
        body('name', 'Name is required').not().isEmpty().trim(),
        body('addressLine1', 'Address Line 1 is required').not().isEmpty().trim(),
        body('addressLine2').optional({ checkFalsy: true }).trim(),
        body('zipcode', 'Zipcode is required').not().isEmpty().trim(),
        body('city', 'City is required').not().isEmpty().trim(),
        body('floor').optional({ checkFalsy: true }).trim(),
        body('door').optional({ checkFalsy: true }).trim(),
        body('telephone', 'Telephone is required').not().isEmpty().trim(),
        body('email', 'Valid email is required').isEmail().normalizeEmail(),
    ],
    async (req, res) => {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.warn("[API POST /api/entries] Validation Errors:", JSON.stringify(errors.array()));
            return res.status(400).json({ success: false, errors: errors.array() });
        }

        const { name, addressLine1, addressLine2, zipcode, city, floor, door, telephone, email } = req.body;

        try {
            let combinedStreet = addressLine1.trim();
            if (addressLine2 && addressLine2.trim() !== '') {
                combinedStreet += `, ${addressLine2.trim()}`;
            }

            const existingEntry = await Entry.findOne({
                name: new RegExp(`^${name}$`, 'i'),
                street: new RegExp(`^${combinedStreet.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')}$`, 'i'),
                zipcode: zipcode,
            });

            if (existingEntry) {
                console.warn(`[API POST /api/entries] Duplicate entry attempt for name: ${name}, street: ${combinedStreet}`);
                return res.status(409).json({
                    success: false,
                    message: 'Duplicate entry detected. An entry with similar name, street, and zipcode already exists.'
                });
            }

            const newEntryData = {
                name, street: combinedStreet, zipcode, city,
                floor: floor || '', door: door || '',
                telephone, email, createdBy: req.user._id
            };

            const entry = new Entry(newEntryData);
            await entry.save();
            const populatedEntry = await Entry.findById(entry._id).populate('createdBy', 'username email').lean();
            
            // Add parsed address lines to the response for consistency if frontend expects it immediately
            const { addressLine1: respAddr1, addressLine2: respAddr2 } = parseStreetAddress(populatedEntry.street);

            console.log(`[API POST /api/entries] Entry created successfully for user: ${req.user.username}, ID: ${entry._id}`);
            res.status(201).json({ success: true, data: {...populatedEntry, addressLine1: respAddr1, addressLine2: respAddr2 } });

        } catch (error) {
            if (error.name === 'ValidationError') {
                console.error("[API POST /api/entries] Mongoose Validation Error:", error.message);
                return res.status(400).json({ success: false, message: `Validation failed: ${error.message}` });
            }
            if (error.code === 11000) {
                console.error("[API POST /api/entries] Duplicate Key Error (MongoDB):", error.message);
                return res.status(409).json({ success: false, message: 'Duplicate entry error. Field: ' + Object.keys(error.keyValue)[0] });
            }
            console.error("[API POST /api/entries] Unexpected error saving entry:", error.message, error.stack);
            res.status(500).json({ success: false, message: 'Server error saving entry.' });
        }
    }
);

// --- GET /api/entries/query - Fetch and query entry data ---
router.get(
    '/query',
    passport.authenticate('jwt', { session: false }),
    authorize(permissions.READ_ENTRIES || 'read_entries'),
    async (req, res) => {
        try {
            const { search, page = 1, limit = 10, sortField = 'createdAt', sortOrder = 'desc' } = req.query;
            let mongoQuery = {};
            if (search && search.trim() !== "") {
                const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
                mongoQuery = {
                    $or: [
                        { name: searchRegex }, { street: searchRegex }, { city: searchRegex },
                        { zipcode: searchRegex }, { email: searchRegex }, { telephone: searchRegex }
                    ]
                };
            }
            const pageNumber = parseInt(page, 10);
            const limitNumber = parseInt(limit, 10);
            const skip = (pageNumber - 1) * limitNumber;
            const sortOptions = { [sortField]: sortOrder === 'asc' ? 1 : -1 };

            const entriesFromDB = await Entry.find(mongoQuery)
                .sort(sortOptions)
                .skip(skip)
                .limit(limitNumber)
                .populate('createdBy', 'username email')
                .lean();

            // <<<< MODIFIED: Process entries to add addressLine1 and addressLine2 >>>>
            const entriesForFrontend = entriesFromDB.map(entry => {
                const { addressLine1, addressLine2 } = parseStreetAddress(entry.street);
                return { ...entry, addressLine1, addressLine2 };
            });

            const totalRecords = await Entry.countDocuments(mongoQuery);

            console.log(`[API GET /api/entries/query] Fetched ${entriesForFrontend.length} of ${totalRecords} entries. Processed for separate address lines. Page: ${pageNumber}, Limit: ${limitNumber}, Search: "${search||''}"`);
            res.json({
                success: true,
                data: entriesForFrontend, // Send processed data
                pagination: {
                    currentPage: pageNumber,
                    totalPages: Math.ceil(totalRecords / limitNumber),
                    totalRecords: totalRecords,
                    limit: limitNumber,
                    sortField,
                    sortOrder
                }
            });
        } catch (error) {
            console.error("[API GET /api/entries/query] Error:", error.message, error.stack);
            res.status(500).json({ success: false, message: "Server error while fetching query data." });
        }
    }
);


// --- NEW: GET /api/entries/export/csv - Export entries to CSV ---
router.get(
    '/export/csv',
    passport.authenticate('jwt', { session: false }),
    authorize(permissions.READ_ENTRIES || 'read_entries'), // Or a specific export permission
    async (req, res) => {
        try {
            // Option: Reuse filtering logic from '/query' if CSV should match current view
            const { search } = req.query; // Example: only implementing search filter for export
            let mongoQuery = {};
            if (search && search.trim() !== "") {
                const searchRegex = new RegExp(search.trim().replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i');
                mongoQuery = {
                    $or: [
                        { name: searchRegex }, { street: searchRegex }, { city: searchRegex },
                        { zipcode: searchRegex }, { email: searchRegex }, { telephone: searchRegex }
                    ]
                };
            }

            const entriesFromDB = await Entry.find(mongoQuery) // Apply query if present
                .populate('createdBy', 'username') // Populate username for CSV
                .sort({ createdAt: -1 }) // Consistent sort order
                .lean();

            if (!entriesFromDB || entriesFromDB.length === 0) {
                console.log("[API GET /export/csv] No entries found to export for the given filter.");
                // Return an empty CSV or a message. For now, a 404 if no data matches filter.
                return res.status(404).json({ success: false, message: "No data available to export for the current filter." });
            }

            const processedEntriesForCSV = entriesFromDB.map(entry => {
                const { addressLine1, addressLine2 } = parseStreetAddress(entry.street); // Use helper
                return {
                    // Define CSV columns and map data
                    ID: entry._id.toString(),
                    Name: entry.name,
                    'Address Line 1': addressLine1,
                    'Address Line 2': addressLine2,
                    Zipcode: entry.zipcode,
                    City: entry.city,
                    Floor: entry.floor || '',
                    Door: entry.door || '',
                    Telephone: entry.telephone,
                    Email: entry.email,
                    'Created By': entry.createdBy ? entry.createdBy.username : 'N/A',
                    'Created At': entry.createdAt ? new Date(entry.createdAt).toLocaleString() : 'N/A',
                    'Updated At': entry.updatedAt ? new Date(entry.updatedAt).toLocaleString() : 'N/A',
                };
            });

            const fields = [ // Define order and headers for CSV
                'ID', 'Name', 'Address Line 1', 'Address Line 2', 'Zipcode', 'City',
                'Floor', 'Door', 'Telephone', 'Email', 'Created By', 'Created At', 'Updated At'
            ];
            const opts = { fields };
            const parser = new Parser(opts);
            const csv = parser.parse(processedEntriesForCSV);

            const filename = `entries_export_${new Date().toISOString().slice(0,10)}.csv`;
            res.setHeader('Content-Type', 'text/csv; charset=utf-8');
            res.setHeader('Content-Disposition', `attachment; filename="${filename}"`);
            
            console.log(`[API GET /export/csv] Exporting ${processedEntriesForCSV.length} entries to CSV: ${filename}`);
            res.status(200).send(csv);

        } catch (error) {
            console.error("[API GET /export/csv] Error exporting CSV:", error.message, error.stack);
            res.status(500).json({ success: false, message: "Server error during CSV export." });
        }
    }
);


// --- GET /api/entries/:id - Retrieve a single entry by ID ---
router.get(
    '/:id',
    passport.authenticate('jwt', { session: false }),
    authorize(permissions.READ_ENTRIES || 'read_entries'),
    async (req, res) => {
        try {
            const entryId = req.params.id;
            if (!mongoose.Types.ObjectId.isValid(entryId)) {
                console.warn(`[API GET /api/entries/:id] Invalid ID format: ${entryId}`);
                return res.status(400).json({ success: false, message: 'Invalid entry ID format' });
            }

            const entryFromDB = await Entry.findById(entryId).populate('createdBy', 'username email').lean();
            if (!entryFromDB) {
                console.warn(`[API GET /api/entries/:id] Entry not found: ${entryId}`);
                return res.status(404).json({ success: false, message: 'Entry not found' });
            }

            // <<<< MODIFIED: Process entry to add addressLine1 and addressLine2 >>>>
            const { addressLine1, addressLine2 } = parseStreetAddress(entryFromDB.street);
            const entryForFrontend = { ...entryFromDB, addressLine1, addressLine2 };

            console.log(`[API GET /api/entries/:id] Fetched entry: ${entryId}. Processed for separate address lines.`);
            res.json({ success: true, data: entryForFrontend }); // Send processed data

        } catch (error) {
            console.error(`[API GET /api/entries/:id] Error (ID: ${req.params.id}):`, error.message, error.stack);
            if (error.name === 'CastError') {
                return res.status(400).json({ success: false, message: 'Invalid entry ID format (cast error)' });
            }
            res.status(500).json({ success: false, message: 'Server error retrieving entry.' });
        }
    }
);

// --- PUT /api/entries/:id - Update an existing entry ---
router.put(
    '/:id',
    passport.authenticate('jwt', { session: false }),
    authorize(permissions.UPDATE_ENTRY || 'update_entry'),
    [
        body('name').optional().notEmpty({ ignore_whitespace:true }).trim(),
        body('addressLine1').optional().notEmpty({ ignore_whitespace:true }).trim(),
        body('addressLine2').optional({ checkFalsy: true }).trim(),
        body('zipcode').optional().notEmpty({ ignore_whitespace:true }).trim(),
        body('city').optional().notEmpty({ ignore_whitespace:true }).trim(),
        body('floor').optional({ checkFalsy: true }).trim(),
        body('door').optional({ checkFalsy: true }).trim(),
        body('telephone').optional().notEmpty({ ignore_whitespace:true }).trim(),
        body('email').optional().isEmail().normalizeEmail(),
    ],
    async (req, res) => {
        const entryId = req.params.id;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            console.warn(`[API PUT /api/entries/:id] Validation Errors:`, JSON.stringify(errors.array()));
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        if (!mongoose.Types.ObjectId.isValid(entryId)) {
            console.warn(`[API PUT /api/entries/:id] Invalid ID format: ${entryId}`);
            return res.status(400).json({ success: false, message: 'Invalid entry ID format' });
        }

        try {
            const updateData = {};
            const directUpdateFields = ['name', 'zipcode', 'city', 'floor', 'door', 'telephone', 'email'];

            for (const key of directUpdateFields) {
                if (req.body[key] !== undefined) { // Allows setting fields to empty string if desired
                    updateData[key] = req.body[key];
                }
            }

            if (req.body.addressLine1 !== undefined) { // If addressLine1 is part of the update
                let combinedStreet = req.body.addressLine1.trim();
                if (req.body.addressLine2 !== undefined && req.body.addressLine2.trim() !== '') {
                    combinedStreet += `, ${req.body.addressLine2.trim()}`;
                }
                updateData.street = combinedStreet;
            } else if (req.body.addressLine1 === undefined && req.body.addressLine2 !== undefined) {
                // If only addressLine2 is sent, this implies an attempt to update only the second part.
                // This requires fetching the existing street to combine.
                // For simplicity, this scenario is often handled by requiring addressLine1 if street is being modified.
                // Or, frontend should always send both addressLine1 and addressLine2 if either changes.
                // If addressLine1 is explicitly empty string, street will become just addressLine2.
                console.warn(`[API PUT /api/entries/:id] addressLine2 provided without addressLine1. Street update might be incomplete.`);
                // Decide on behavior: for now, if addressLine1 not sent, street isn't touched by addressLine2 alone
            }


            if (Object.keys(updateData).length === 0) {
                console.log(`[API PUT /api/entries/:id] No valid fields to update for ID: ${entryId}`);
                return res.status(400).json({ success: false, message: "No update data provided or recognized." });
            }

            const updatedEntryFromDB = await Entry.findByIdAndUpdate(
                entryId,
                { $set: updateData },
                { new: true, runValidators: true, context: 'query' }
            ).populate('createdBy', 'username email').lean();

            if (!updatedEntryFromDB) {
                console.warn(`[API PUT /api/entries/:id] Entry not found or no changes for ID: ${entryId}`);
                return res.status(404).json({ success: false, message: 'Entry not found or no changes applied' });
            }
            
            // <<<< MODIFIED: Process entry to add addressLine1 and addressLine2 for response >>>>
            const { addressLine1, addressLine2 } = parseStreetAddress(updatedEntryFromDB.street);
            const entryForFrontend = { ...updatedEntryFromDB, addressLine1, addressLine2 };


            console.log(`[API PUT /api/entries/:id] Entry updated successfully: ${entryId}`);
            res.json({ success: true, message: 'Entry updated successfully', data: entryForFrontend });
        } catch (error) {
            if (error.name === 'ValidationError') {
                console.error(`[API PUT /api/entries/:id] Mongoose Validation Error (ID: ${entryId}):`, error.message);
                return res.status(400).json({ success: false, message: `Validation failed: ${error.message}` });
            }
            if (error.code === 11000) {
                console.error(`[API PUT /api/entries/:id] Duplicate Key Error (MongoDB) (ID: ${entryId}):`, error.message);
                return res.status(409).json({ success: false, message: 'Update failed due to duplicate value. Field: ' + Object.keys(error.keyValue)[0] });
            }
            console.error(`[API PUT /api/entries/:id] Error updating entry (ID: ${entryId}):`, error.message, error.stack);
            res.status(500).json({ success: false, message: 'Server error updating entry.' });
        }
    }
);

// --- DELETE /api/entries/:id - Delete an entry ---
router.delete(
    '/:id',
    passport.authenticate('jwt', { session: false }),
    authorize(permissions.DELETE_ENTRY || 'delete_entry'),
    async (req, res) => {
        const entryId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(entryId)) {
            console.warn(`[API DELETE /api/entries/:id] Invalid ID format: ${entryId}`);
            return res.status(400).json({ success: false, message: 'Invalid entry ID format' });
        }
        try {
            const deletedEntry = await Entry.findByIdAndDelete(entryId);
            if (!deletedEntry) {
                console.warn(`[API DELETE /api/entries/:id] Entry not found for deletion: ${entryId}`);
                return res.status(404).json({ success: false, message: 'Entry not found' });
            }
            console.log(`[API DELETE /api/entries/:id] Entry deleted successfully: ${entryId}`);
            res.json({ success: true, message: 'Entry deleted successfully', data: { _id: entryId } });
        } catch (error) {
            console.error(`[API DELETE /api/entries/:id] Error deleting entry (ID: ${entryId}):`, error.message, error.stack);
            res.status(500).json({ success: false, message: 'Server error deleting entry.' });
        }
    }
);

module.exports = router;
