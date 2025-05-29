const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EntrySchema = new Schema({
    name: {
        type: String,
        required: [true, 'Name is required.'],
        trim: true
    },
    street: {
        type: String,
        required: [true, 'Street is required.'],
        trim: true
    },
    zipcode: {
        type: String,
        required: [true, 'Zipcode is required.'],
        trim: true,
        // Optional: Add validation if you always expect exactly 4 digits
        // match: [/^\d{4}$/, 'Zipcode must be 4 digits.']
    },
    city: {
        type: String,
        required: [true, 'City is required.'],
        trim: true
    },
    floor: { // Optional field
        type: String,
        trim: true,
        default: '' // Or null if preferred
    },
    door: { // Optional field
        type: String,
        trim: true,
        default: '' // Or null if preferred
    },
    telephone: {
        type: String,
        required: [true, 'Telephone is required.'],
        trim: true,
        // Optional: Add validation based on your frontend logic (e.g., max 11 digits)
        // match: [/^\d{1,11}$/, 'Telephone number is invalid.']
    },
    email: {
        type: String,
        required: [true, 'Email is required.'],
        trim: true,
        lowercase: true, // Store emails consistently
        match: [/^[^\s@]+@[^\s@]+\.[^\s@]+$/, 'Please provide a valid email address.'] // Server-side validation
    },
    // --- Link to the user who created this entry ---
    createdBy: {
        type: mongoose.Schema.Types.ObjectId, // Stores the User's _id
        ref: 'User',                          // Refers to the 'User' model
        required: true,
        index: true // Good idea to index this if you query entries by user
    }
}, {
    // Add timestamps (createdAt, updatedAt) automatically
    timestamps: true
});

// Optional: Index fields you expect to query frequently
// EntrySchema.index({ name: 1 });
// EntrySchema.index({ city: 1, zipcode: 1 });

module.exports = mongoose.model('Entry', EntrySchema);
// Mongoose will create a collection named 'entries' (pluralized, lowercase)