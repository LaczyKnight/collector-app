// src/config/Roles.js
const roles = {
    admin: ["manage_users", "edit_content", "view_content", "read_entries", "create_entry", "update_entry", "delete_entry"], // Added entry permissions
    editor: ["edit_content", "view_content", "read_entries", "create_entry", "update_entry"], // Added entry permissions
    viewer: ["view_content", "read_entries"] // Added entry permissions
    // Add other roles and their permissions as needed
};

// Define constants for permissions to avoid typos (optional but good practice)
const permissions = {
    MANAGE_USERS: "manage_users",
    EDIT_CONTENT: "edit_content",
    VIEW_CONTENT: "view_content",
    READ_ENTRIES: "read_entries",
    CREATE_ENTRY: "create_entry",
    UPDATE_ENTRY: "update_entry",
    DELETE_ENTRY: "delete_entry"
    // Add all unique permission strings here
};

module.exports = { roles, permissions }; // Export both roles and the permissions constants