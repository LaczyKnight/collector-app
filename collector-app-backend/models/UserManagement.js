// ./scripts/user-management.js
const mongoose = require("mongoose");
const bcrypt = require("bcryptjs");
const dotenv = require("dotenv");
const User = require("../models/User"); // <-- IMPORT the User model

dotenv.config({ path: '../.env' }); // <-- Adjust path to .env if needed

const SALT_ROUNDS = 10; // Consistent salt rounds

// Function to create a user
async function createUser(username, password, role = 'user') { // Default role
    console.log(`Attempting to create user: ${username}, Role: ${role}`);

    if (!username || !password) {
        console.error("❌ Error: Username and password are required.");
        return;
    }
     // Validate role against the schema enum if possible (optional enhancement)
    const allowedRoles = User.schema.path('role').enumValues;
    if (role && !allowedRoles.includes(role)) {
        console.error(`❌ Error: Invalid role '${role}'. Allowed roles are: ${allowedRoles.join(', ')}`);
        return;
    }

    try {
        // Hash password before creating user
        console.log(`[CREATE DEBUG] Hashing password: '${password}'`); // Existing debug log
        const hashedPassword = await bcrypt.hash(password, SALT_ROUNDS);

        // --- ADD THIS LOG ---
        console.log(`[CREATE DEBUG] Generated hash for '${username}': ${hashedPassword}`);
        // --- END ADDED LOG ---

        // Create and save the new user instance
        const newUser = new User({
            username, // Will be lowercased due to schema option
            password: hashedPassword,
            role,
            mustChangePassword: true // Default from schema, but explicit is okay
        });

        await newUser.save(); // .save() will trigger the pre-save hook if password wasn't hashed above
        console.log(`✅ User '${newUser.username}' created successfully with role '${newUser.role}'`);
    } catch (error) {
        if (error.code === 11000) { // Handle duplicate key error (username)
            console.error(`❌ Error: Username '${username}' already exists.`);
        } else if (error.name === 'ValidationError') { // Handle Mongoose validation errors
             console.error('❌ Validation Error:', error.message);
        }
        else {
            console.error("❌ Error creating user:", error);
        }
    }
}

// Function to update user role
async function updateUserRole(username, newRole) {
    // ... function code remains the same ...
    console.log(`Attempting to update role for user: ${username} to ${newRole}`);

    if (!username || !newRole) {
        console.error("❌ Error: Username and new role are required.");
        return;
    }
    const allowedRoles = User.schema.path('role').enumValues;
    if (!allowedRoles.includes(newRole)) {
        console.error(`❌ Error: Invalid role '${newRole}'. Allowed roles are: ${allowedRoles.join(', ')}`);
        return;
    }

    try {
        const user = await User.findOneAndUpdate(
            { username: username.toLowerCase() }, { role: newRole }, { new: true }
        );

        if (user) {
            console.log(`✅ Updated '${user.username}' to role '${newRole}'`);
        } else {
            console.log(`❌ User '${username}' not found.`);
        }
    } catch (error) {
        console.error("❌ Error updating user role:", error);
    }
}

// Function to delete a user
async function deleteUser(username) {
    // ... function code remains the same ...
    console.log(`Attempting to delete user: ${username}`);
     if (!username) {
        console.error("❌ Error: Username is required.");
        return;
    }

    try {
        const result = await User.deleteOne({ username: username.toLowerCase() });
        if (result.deletedCount > 0) {
            console.log(`✅ User '${username}' deleted successfully.`);
        } else {
            console.log(`❌ User '${username}' not found.`);
        }
    } catch (error) {
        console.error("❌ Error deleting user:", error);
    }
}

// Function to force password reset flag
async function forcePasswordReset(username) {
    // ... function code remains the same ...
    console.log(`Attempting to set 'mustChangePassword=true' for user: ${username}`);
     if (!username) {
        console.error("❌ Error: Username is required.");
        return;
    }
    try {
         const user = await User.findOneAndUpdate(
            { username: username.toLowerCase() }, { mustChangePassword: true }, { new: true }
        );
         if (user) {
            console.log(`✅ User '${user.username}' now flagged to require password change on next login.`);
        } else {
            console.log(`❌ User '${username}' not found.`);
        }
    } catch (error) {
        console.error("❌ Error forcing password reset:", error);
    }
}

// Function to update user password (if you added it previously)
async function updateUserPassword(username, newPassword) {
    console.log(`Attempting to update password for user: ${username}`);
    if (!username || !newPassword) { /* ... error check ... */ return; }
    // ... password length check ...

    try {
        const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
        console.log(`[UPDATE PW DEBUG] Generated hash for '${username}': ${hashedPassword}`); // Also log here
        const user = await User.findOneAndUpdate(
            { username: username.toLowerCase() }, { password: hashedPassword }, { new: true }
        );
        if (user) { console.log(`✅ Updated password for '${user.username}'.`); }
        else { console.log(`❌ User '${username}' not found.`); }
    } catch (error) { console.error("❌ Error updating user password:", error); }
}


// --- Main Script Execution ---
(async () => {
    if (!process.env.MONGO_URI) { /* ... check MONGO_URI ... */ }

    let connection;
    try {
        connection = await mongoose.connect(process.env.MONGO_URI);
        console.log("✅ Connected to MongoDB for user management.");

        const args = process.argv.slice(2);
        const action = args[0];

        console.log("\n--- User Management Script ---");

        switch (action) {
            case "create":
                if (args.length < 3) { console.log("Usage: node user-management.js create <username> <password> [role]"); }
                else { await createUser(args[1], args[2], args[3]); }
                break;
            case "update-role":
                if (args.length < 3) { console.log("Usage: node user-management.js update-role <username> <newRole>"); }
                else { await updateUserRole(args[1], args[2]); }
                break;
            case "delete":
                if (args.length < 2) { console.log("Usage: node user-management.js delete <username>"); }
                else { await deleteUser(args[1]); }
                break;
             case "force-reset":
                 if (args.length < 2) { console.log("Usage: node user-management.js force-reset <username>"); }
                 else { await forcePasswordReset(args[1]); }
                 break;
            // Include update-password case if you added the function
            case "update-password":
                if (args.length < 3) { console.log("Usage: node user-management.js update-password <username> <newPassword>"); }
                else { await updateUserPassword(args[1], args[2]); }
                break;
            default:
                console.log("Available Actions:");
                console.log("  create <username> <password> [role]  (Default role: user)");
                console.log("  update-role <username> <newRole>");
                console.log("  delete <username>");
                console.log("  force-reset <username>");
                console.log("  update-password <username> <newPassword>"); // List if added
        }

        console.log("--- Script Finished ---\n");

    } catch (error) {
        console.error("❌ Script execution failed:", error);
        process.exitCode = 1;
    } finally {
        if (connection) {
            await mongoose.connection.close();
            console.log("✅ MongoDB connection closed.");
        }
    }
})();