// src/middleware/AuthMiddleware.js
const { roles } = require("../config/Roles"); // Adjust path if necessary; import `roles`

function authorize(requiredPermission) {
    return (req, res, next) => {
        if (!req.user || !req.user.role) {
            console.warn("[AuthMiddleware] Authorization Denied: User or user role not found on request object.");
            return res.status(401).json({ success: false, message: "Unauthorized: Missing user credentials or role." });
        }

        const userRole = req.user.role;

        if (!roles[userRole]) { // Check against the imported 'roles' object
            console.warn(`[AuthMiddleware] Authorization Denied: Role '${userRole}' not defined in roles configuration.`);
            return res.status(403).json({ success: false, message: "Forbidden: Your user role is unrecognized." });
        }

        const userPermissions = roles[userRole];
        if (!userPermissions.includes(requiredPermission)) {
            console.warn(`[AuthMiddleware] Authorization Denied: Role '${userRole}' lacks required permission '${requiredPermission}'.`);
            return res.status(403).json({ success: false, message: "Forbidden: You do not have sufficient permissions for this action." });
        }

        console.log(`[AuthMiddleware] Authorization Granted: Role '${userRole}' has required permission '${requiredPermission}'.`);
        next();
    };
}

module.exports = authorize;