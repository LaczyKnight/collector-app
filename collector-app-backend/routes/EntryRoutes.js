// src/routes/EntryRoutes.js
const express = require('express');
const router = express.Router();
const passport = require('passport'); // For passport.authenticate('jwt', ...)
const { body, validationResult } = require('express-validator');
const mongoose = require('mongoose');
const { Parser } = require('json2csv'); // For CSV export
const multer = require('multer');      // For CSV import (file upload)
const Papa = require('papaparse');     // For CSV import (parsing)


const Entry = require('../models/Entry'); // Adjust path if needed
const authorize = require('../middleware/AuthMiddleware'); // Adjust path if needed
const { permissions } = require('../config/Roles'); // Adjust path if needed

// --- Multer Configuration for CSV Import (in-memory storage) ---
const storage = multer.memoryStorage();
const upload = multer({
    storage: storage,
    fileFilter: (req, file, cb) => {
        if (file.mimetype === 'text/csv' || file.originalname.toLowerCase().endsWith('.csv')) {
            cb(null, true);
        } else {
            cb(new Error('Invalid file type. Only CSV files are allowed.'), false);
        }
    },
    limits: { fileSize: 5 * 1024 * 1024 } // 5MB limit
});

// --- POST /api/entries - Create a new entry ---
router.post(
    '/',
    passport.authenticate('jwt', { session: false }), // Use Passport JWT Strategy
    authorize(permissions.CREATE_ENTRY),
    [ // Validation rules
        body('name', 'Name is required').not().isEmpty().trim(),
        body('addressLine1', 'Address Line 1 is required').not().isEmpty().trim(), // Assuming addressLine1
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
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        // Ensure you use addressLine1 and addressLine2 if that's your schema now
        const { name, addressLine1, addressLine2, zipcode, city, floor, door, telephone, email } = req.body;
        try {
            // Consider adding duplicate check logic here if needed
            const newEntryData = {
                name, addressLine1, addressLine2, zipcode, city,
                floor: floor || '', door: door || '',
                telephone, email, createdBy: req.user._id
            };
            const entry = new Entry(newEntryData);
            await entry.save();
            const populatedEntry = await Entry.findById(entry._id).populate('createdBy', 'username email').lean();
            res.status(201).json({ success: true, data: populatedEntry });
        } catch (error) {
            if (error.code === 11000) { // Duplicate key error
                return res.status(409).json({ success: false, message: 'Duplicate entry. Field: ' + Object.keys(error.keyValue)[0] });
            }
            console.error("[API POST /api/entries] Error:", error.message);
            res.status(500).json({ success: false, message: 'Server error saving entry.' });
        }
    }
);

// --- GET /api/entries/query - Fetch and query entry data ---
router.get(
    '/query',
    passport.authenticate('jwt', { session: false }), // Use Passport JWT Strategy
    authorize(permissions.READ_ENTRIES),
    async (req, res) => {
        try {
            const { search, page = 1, limit = 10, sortField = 'createdAt', sortOrder = 'desc' } = req.query;
            let mongoQuery = {};
            if (search && search.trim() !== "") {
                const searchRegex = new RegExp(search.trim(), 'i');
                mongoQuery = { // Adjust searchable fields as needed
                    $or: [
                        { name: searchRegex }, { addressLine1: searchRegex }, { addressLine2: searchRegex },
                        { city: searchRegex }, { zipcode: searchRegex }, { email: searchRegex }, { telephone: searchRegex }
                    ]
                };
            }
            const pageNumber = parseInt(page, 10);
            const limitNumber = parseInt(limit, 10);
            const skip = (pageNumber - 1) * limitNumber;
            const sortOptions = { [sortField]: sortOrder === 'asc' ? 1 : -1 };

            const entries = await Entry.find(mongoQuery)
                .sort(sortOptions).skip(skip).limit(limitNumber)
                .populate('createdBy', 'username email').lean();
            const totalRecords = await Entry.countDocuments(mongoQuery);
            res.json({
                success: true, data: entries,
                pagination: {
                    currentPage: pageNumber, totalPages: Math.ceil(totalRecords / limitNumber),
                    totalRecords: totalRecords, limit: limitNumber, sortField, sortOrder
                }
            });
        } catch (error) {
            console.error("[API GET /api/entries/query] Error:", error.message);
            res.status(500).json({ success: false, message: "Server error fetching query data." });
        }
    }
);

// --- GET /api/entries/export/csv - Export entries as CSV ---
router.get(
    '/export/csv',
    passport.authenticate('jwt', { session: false }), // Use Passport JWT Strategy
    authorize(permissions.READ_ENTRIES), // Or a specific EXPORT_ENTRIES permission
    async (req, res) => {
        try {
            console.log("[API GET /api/entries/export/csv] Request received.");
            const entries = await Entry.find({}).populate('createdBy', 'username email').lean();

            if (!entries || entries.length === 0) {
                return res.status(404).json({ success: false, message: 'No entries found to export.' });
            }
            // Adjust fields based on your model, especially addressLine1/addressLine2
            const fields = [
                { label: 'ID', value: '_id' }, { label: 'Name', value: 'name' },
                { label: 'Address Line 1', value: 'addressLine1' }, { label: 'Address Line 2', value: 'addressLine2' },
                { label: 'Zipcode', value: 'zipcode' }, { label: 'City', value: 'city' },
                { label: 'Floor', value: 'floor' }, { label: 'Door', value: 'door' },
                { label: 'Telephone', value: 'telephone' }, { label: 'Email', value: 'email' },
                { label: 'Created At', value: 'createdAt' },
                { label: 'Created By (Username)', value: (row) => row.createdBy?.username || 'N/A' }, // Handle potentially null createdBy
            ];
            const json2csvParser = new Parser({ fields, excelStrings: true }); // excelStrings: true helps with some Excel quirks
            const csv = json2csvParser.parse(entries);
            res.header('Content-Type', 'text/csv');
            res.attachment('entries_export.csv'); // Filename for download
            console.log("[API GET /api/entries/export/csv] CSV generated, sending response.");
            return res.status(200).send(csv);
        } catch (error) {
            console.error("[API GET /api/entries/export/csv] Error:", error.message);
            res.status(500).json({ success: false, message: 'Server error generating CSV.' });
        }
    }
);

// --- POST /api/entries/import/csv - Import entries from CSV ---
router.post(
    '/import/csv',
    passport.authenticate('jwt', { session: false }),
    authorize(permissions.CREATE_ENTRY), // Or a specific IMPORT_PERMISSION
    upload.single('csvFile'), // 'csvFile' is the field name in FormData
    async (req, res) => {
        console.log("[API POST /api/entries/import/csv] Request received.");
        if (!req.file) {
            return res.status(400).json({ success: false, message: 'No CSV file uploaded.' });
        }
        const results = { successCount: 0, errorCount: 0, errors: [] };
        try {
            const csvString = req.file.buffer.toString('utf8');
            const parseResult = Papa.parse(csvString, {
                header: true, skipEmptyLines: true, transformHeader: header => header.trim().toLowerCase().replace(/\s+/g, '')
            });

            if (parseResult.meta.aborted || parseResult.errors.length > 0) {
                console.warn("[API IMPORT] PapaParse issues:", parseResult.errors, parseResult.meta);
                // Consider if these are fatal, or just add to results.errors
            }
            const entriesToCreate = [];
            for (let i = 0; i < parseResult.data.length; i++) {
                const row = parseResult.data[i];
                const rowNumber = i + 2;
                // Map CSV headers (now lowercase, no spaces) to your model fields
                // Ensure these keys (e.g., 'name', 'addressline1') match your transformed headers
                const entryData = {
                    name: row.name, addressLine1: row.addressline1, addressLine2: row.addressline2 || '',
                    zipcode: row.zipcode, city: row.city, floor: row.floor || '', door: row.door || '',
                    telephone: row.telephone, email: row.email, createdBy: req.user._id
                };
                // Basic validation example
                if (!entryData.name || !entryData.addressLine1 || !entryData.zipcode || !entryData.city || !entryData.telephone || !entryData.email) {
                    results.errorCount++;
                    results.errors.push({ row: rowNumber, message: 'Missing required fields.', data: row });
                    continue;
                }
                // Add more robust validation here (email format, etc.)
                entriesToCreate.push(entryData);
            }

            if (entriesToCreate.length > 0) {
                try {
                    const created = await Entry.insertMany(entriesToCreate, { ordered: false });
                    results.successCount = created.length;
                } catch (e) { // BulkWriteError
                    results.successCount = e.result?.nInserted || e.nInserted || 0;
                    results.errorCount = entriesToCreate.length - results.successCount;
                    if (e.writeErrors) {
                        e.writeErrors.forEach(err => results.errors.push({ message: `DB Insert Error: ${err.errmsg}`, data: err.op }));
                    } else {
                        results.errors.push({ message: `Bulk insert error: ${e.message}` });
                    }
                    console.error("[API IMPORT] insertMany error details:", JSON.stringify(e, null, 2));
                }
            }
            const status = results.errorCount > 0 ? 207 : 201; // 207 Multi-Status or 201 Created
            res.status(status).json({
                success: results.errorCount === 0,
                message: `Import processed. Success: ${results.successCount}, Failures: ${results.errorCount}.`,
                summary: results
            });
        } catch (error) {
            console.error("[API POST /api/entries/import/csv] Top-level error:", error);
            res.status(500).json({ success: false, message: error.message || 'Server error during CSV import.' });
        }
    }
);

// --- GET /api/entries/:id - Retrieve a single entry by ID ---
router.get(
    '/:id',
    passport.authenticate('jwt', { session: false }), // Use Passport JWT Strategy
    authorize(permissions.READ_ENTRIES),
    async (req, res) => {
        try {
            const entryId = req.params.id;
            if (!mongoose.Types.ObjectId.isValid(entryId)) {
                return res.status(400).json({ success: false, message: 'Invalid entry ID format' });
            }
            const entry = await Entry.findById(entryId).populate('createdBy', 'username email').lean();
            if (!entry) {
                return res.status(404).json({ success: false, message: 'Entry not found' });
            }
            res.json({ success: true, data: entry });
        } catch (error) {
            console.error(`[API GET /api/entries/:id] Error (ID: ${req.params.id}):`, error.message);
            res.status(500).json({ success: false, message: 'Server error retrieving entry.' });
        }
    }
);

// --- PUT /api/entries/:id - Update an existing entry ---
router.put(
    '/:id',
    passport.authenticate('jwt', { session: false }), // Use Passport JWT Strategy
    authorize(permissions.UPDATE_ENTRY),
    [ // Validation rules (optional for PUT, but good practice)
        body('name').optional().not().isEmpty().trim(),
        body('addressLine1').optional().not().isEmpty().trim(), // Assuming addressLine1
        // ... other fields ...
        body('email').optional().isEmail().normalizeEmail(),
    ],
    async (req, res) => {
        const entryId = req.params.id;
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ success: false, errors: errors.array() });
        }
        if (!mongoose.Types.ObjectId.isValid(entryId)) {
            return res.status(400).json({ success: false, message: 'Invalid entry ID format' });
        }
        try {
            // Construct updateData carefully to only include fields sent by client
            const updateData = {};
            const allowedFields = ['name', 'addressLine1', 'addressLine2', 'zipcode', 'city', 'floor', 'door', 'telephone', 'email'];
            for (const key of allowedFields) {
                if (req.body.hasOwnProperty(key)) { // Only update if key is present in body
                    updateData[key] = req.body[key];
                }
            }
            if (Object.keys(updateData).length === 0) {
                return res.status(400).json({ success: false, message: 'No update data provided.' });
            }
            const updatedEntry = await Entry.findByIdAndUpdate(
                entryId, { $set: updateData }, { new: true, runValidators: true }
            ).populate('createdBy', 'username email').lean();

            if (!updatedEntry) {
                return res.status(404).json({ success: false, message: 'Entry not found or no changes applied' });
            }
            res.json({ success: true, message: 'Entry updated successfully', data: updatedEntry });
        } catch (error) {
            console.error(`[API PUT /api/entries/:id] Error (ID: ${entryId}):`, error.message);
            if (error.code === 11000) { // Duplicate key error
                return res.status(409).json({ success: false, message: 'Update failed due to duplicate value. Field: ' + Object.keys(error.keyValue)[0] });
            }
            res.status(500).json({ success: false, message: 'Server error updating entry.' });
        }
    }
);

// --- DELETE /api/entries/:id - Delete an entry ---
router.delete(
    '/:id',
    passport.authenticate('jwt', { session: false }), // Use Passport JWT Strategy
    authorize(permissions.DELETE_ENTRY),
    async (req, res) => {
        const entryId = req.params.id;
        if (!mongoose.Types.ObjectId.isValid(entryId)) {
            return res.status(400).json({ success: false, message: 'Invalid entry ID format' });
        }
        try {
            const deletedEntry = await Entry.findByIdAndDelete(entryId);
            if (!deletedEntry) {
                return res.status(404).json({ success: false, message: 'Entry not found' });
            }
            res.json({ success: true, message: 'Entry deleted successfully', data: { _id: entryId } });
        } catch (error) {
            console.error(`[API DELETE /api/entries/:id] Error (ID: ${entryId}):`, error.message);
            res.status(500).json({ success: false, message: 'Server error deleting entry.' });
        }
    }
);

module.exports = router;