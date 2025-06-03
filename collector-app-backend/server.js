// src/server.js
console.log("[SERVER START] Loading requires...");

require("dotenv").config(); // CRITICAL: Load .env variables FIRST

const express = require("express");
const session = require("express-session");
const passport = require("passport"); // Main passport library
const LocalStrategy = require("passport-local").Strategy;
const bcrypt = require("bcryptjs");
const mongoose = require("mongoose");
const cors = require("cors");
const jwt = require("jsonwebtoken");
const path = require('path'); // For serving static files

const User = require("./models/User"); // Adjust path if needed

// --- ROUTE FILES ---
const entryRoutes = require('./routes/EntryRoutes'); // Adjust path if needed

// --- MIDDLEWARE ---
// authenticateJWT custom middleware is no longer directly used for route protection
// const authenticateJWT = require('./middleware/authenticateJWT');
const authorize = require('./middleware/AuthMiddleware'); // Adjust path if needed

// --- PASSPORT STRATEGY CONFIGURATION ---
const configurePassportJwt = require('./config/passport-jwt-strategy'); // Adjust path if needed

console.log("[SERVER START] Requires loaded.");

const app = express();
console.log("[SERVER START] Express app created.");

// --- GLOBAL REQUEST LOGGER ---
app.use((req, res, next) => {
  const start = Date.now();
  res.on('finish', () => {
    const duration = Date.now() - start;
    console.log(
        `[REQ] ${new Date().toISOString()} | ${req.method} ${req.originalUrl} | ${res.statusCode} | ${duration}ms | User: ${req.user ? req.user.username : 'Guest'} | IP: ${req.ip} | Origin: ${req.headers.origin || 'N/A'}`
    );
  });
  next();
});
console.log("[SERVER START] Global request logger added.");


// =====================
// 1. Configuration Check & Constants
// =====================
console.log("[SERVER START] Checking environment variables...");
if (!process.env.MONGO_URI || !process.env.JWT_SECRET || !process.env.SESSION_SECRET) {
    console.error("❌ FATAL: Missing required environment variables: MONGO_URI, JWT_SECRET, and/or SESSION_SECRET. Exiting.");
    process.exit(1);
} else {
    console.log("  MONGO_URI: Loaded (value hidden)");
    console.log("  JWT_SECRET: Loaded (value hidden)");
    console.log("  SESSION_SECRET: Loaded (value hidden)");
}
const JWT_SECRET = process.env.JWT_SECRET; // Used for signing tokens
const SALT_ROUNDS = 10;
console.log("[SERVER START] Constants defined.");


// =====================
// 2. Middleware Setup
// =
console.log("[SERVER START] Setting up core middleware...");
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const corsOptions = {
    origin: process.env.FRONTEND_URL || 'http://localhost:3000', // Or your specific frontend IP:Port
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use(cors(corsOptions));
app.options('*', cors(corsOptions));

app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false,
    cookie: {
        secure: process.env.NODE_ENV === "production",
        httpOnly: true,
        sameSite: process.env.NODE_ENV === "production" ? 'none' : 'lax',
        maxAge: 24 * 60 * 60 * 1000
    }
}));

if (process.env.NODE_ENV === 'production') {
    app.set('trust proxy', 1);
}
console.log("[SERVER START] Core middleware (express, cors, session) setup complete.");


// === PASSPORT INITIALIZATION & STRATEGY REGISTRATION ===
console.log("[SERVER START] Initializing Passport and configuring strategies...");
app.use(passport.initialize());
// app.use(passport.session()); // Only if mixing session auth; for pure JWT API for SPA, session:false is key

// Configure Local Strategy (for username/password login)
passport.use(new LocalStrategy(
    { usernameField: 'username', passwordField: 'password' },
    async (username, password, done) => {
    try {
        console.log(`[PASSPORT LOCAL] Attempting to authenticate user: ${username}`);
        const user = await User.findOne({ username: new RegExp(`^${username}$`, 'i') }).select('+password');
        if (!user) {
            console.log(`[PASSPORT LOCAL] User '${username}' not found.`);
            return done(null, false, { message: "Incorrect username or password." });
        }
        if (!user.password) {
            console.error(`[PASSPORT LOCAL] CRITICAL: Password missing for user ${username}.`);
            return done(new Error("Authentication system error: Password data corrupt."));
        }
        const isMatch = await bcrypt.compare(password, user.password);
        console.log(`[PASSPORT LOCAL] Password comparison result for ${username}: ${isMatch}`);
        if (!isMatch) {
            return done(null, false, { message: "Incorrect username or password." });
        }
        const userForAuth = user.toObject();
        delete userForAuth.password;
        console.log(`[PASSPORT LOCAL] Authentication successful for user: ${username}`);
        return done(null, userForAuth);
    } catch (err) {
        console.error(`[PASSPORT LOCAL] Error during authentication for ${username || 'N/A'}:`, err);
        return done(err);
    }
}));

// Configure JWT Strategy (for token-based authentication on protected routes)
configurePassportJwt(passport); // This function call registers the JWT strategy

// Passport session serialization/deserialization (only if app.use(passport.session()) is active)
passport.serializeUser((user, done) => {
    done(null, user._id);
});
passport.deserializeUser(async (id, done) => {
    try {
        const user = await User.findById(id).select('-password');
        done(null, user);
    } catch (err) {
        done(err);
    }
});
console.log("[SERVER START] All Passport strategies configured.");
// =======================================================


// =====================
// 3. Database Connection
// =====================
console.log(`[SERVER START] Attempting to connect to MongoDB...`);
mongoose.connect(process.env.MONGO_URI)
  .then(() => {
    console.log(`[SERVER START] ✅ MongoDB connected successfully to database: '${mongoose.connection.name}' on host: ${mongoose.connection.host}:${mongoose.connection.port}`);
  }).catch(err => {
    console.error("[SERVER START] ❌ MongoDB Connection Error.", err.message);
    process.exit(1);
  });


// =====================
// 4. Routes
// =====================
console.log("[SERVER START] Defining API routes...");

// --- Public Health Check ---
app.get("/api/health", (req, res) => {
    console.log("[ROUTE /api/health] Health check accessed.");
    res.json({
        success: true, status: "OK", timestamp: new Date().toISOString(),
        db_state: mongoose.connection.readyState === 1 ? 'connected' : `state: ${mongoose.connection.readyState}`
    });
});

// --- Authentication Routes ---
app.post("/api/auth/login", (req, res, next) => {
    console.log(`[ROUTE /api/auth/login] Attempting login for user: ${req.body.username}`);
    passport.authenticate("local", { session: false }, (err, user, info) => {
        if (err) {
            console.error('[ROUTE /api/auth/login] Passport authentication error:', err.message);
            return res.status(500).json({ success: false, message: err.message || "Authentication error." });
        }
        if (!user) {
            console.warn(`[ROUTE /api/auth/login] Authentication failed for ${req.body.username}: ${info?.message}`);
            return res.status(401).json({ success: false, message: info?.message || "Incorrect username or password." });
        }
        console.log(`[ROUTE /api/auth/login] Passport authentication successful for: ${user.username}`);
        const payload = { id: user._id, username: user.username, role: user.role };
        const token = jwt.sign(payload, JWT_SECRET, { expiresIn: "1h" });
        console.log(`[ROUTE /api/auth/login] JWT generated for ${user.username}.`);
        return res.json({
            success: true, message: "Login successful", token,
            user: { id: user._id, username: user.username, role: user.role, mustChangePassword: user.mustChangePassword }
        });
    })(req, res, next);
});

app.post("/api/auth/logout",
    passport.authenticate('jwt', { session: false }), // Protected by Passport JWT Strategy
    (req, res) => {
    console.log(`[ROUTE /api/auth/logout] User ${req.user.username} (ID: ${req.user.id}) logout.`);
    res.status(200).json({ success: true, message: "Logout acknowledged by server." });
});

app.post("/api/auth/beacon-logout", (req, res) => {
  console.log(`[ROUTE /api/auth/beacon-logout] Received logout beacon.`);
  res.status(204).send();
});

app.post("/api/auth/change-password",
    passport.authenticate('jwt', { session: false }), // Protected by Passport JWT Strategy
    // authorize('SOME_PERMISSION_IF_NEEDED'), // Not usually needed, user identified by token
    async (req, res) => {
        console.log(`[ROUTE /api/auth/change-password] Request for user: ${req.user?.username}`);
        const { newPassword } = req.body;
        const userId = req.user.id;
        if (!newPassword || newPassword.length < 8) {
            return res.status(400).json({ success: false, message: "New password must be at least 8 characters long." });
        }
        try {
            const hashedPassword = await bcrypt.hash(newPassword, SALT_ROUNDS);
            const updatedUser = await User.findByIdAndUpdate(userId, { password: hashedPassword, mustChangePassword: false }, { new: true }).select('-password');
            if (!updatedUser) return res.status(404).json({ success: false, message: "User not found." });
            console.log(`[ROUTE /api/auth/change-password] Password changed for: ${updatedUser.username}`);
            res.json({ success: true, message: "Password changed successfully." });
        } catch (error) {
            console.error(`[ROUTE /api/auth/change-password] Error for user ${userId}:`, error);
            res.status(500).json({ success: false, message: "Failed to change password." });
        }
    }
);

// --- DATA ENTRY ROUTES (handled by EntryRoutes.js) ---
console.log("[SERVER START] Registering /api/entries routes...");
app.use('/api/entries', entryRoutes);
console.log("[SERVER START] /api/entries routes registered.");

// --- Example Protected/Authorized Routes ---
const { permissions } = require('./config/Roles'); // Make sure this is how you export permissions

app.get("/api/protected",
    passport.authenticate('jwt', { session: false }), // Protected by Passport JWT Strategy
    authorize(permissions.VIEW_CONTENT), // Ensure permissions.VIEW_CONTENT exists
    (req, res) => {
        res.json({ success: true, message: `Hello ${req.user.username}, you see protected content!` });
    }
);

app.get("/api/users",
    passport.authenticate('jwt', { session: false }), // Protected by Passport JWT Strategy
    authorize(permissions.MANAGE_USERS), // Ensure permissions.MANAGE_USERS exists
    async (req, res) => {
        try {
            const users = await User.find().select('-password');
            res.json({ success: true, users });
        } catch (error) {
            console.error("[ROUTE /api/users] Error fetching users:", error);
            res.status(500).json({ success: false, message: "Failed to retrieve users." });
        }
    }
);
console.log("[SERVER START] All API routes defined.");

// =====================
// 5. SERVE REACT APP (Production)
// =====================
if (process.env.NODE_ENV === 'production') {
    const frontendBuildPath = path.join(__dirname, '../frontend/build');
    console.log(`[SERVER PROD] Serving static files from ${frontendBuildPath}`);
    app.use(express.static(frontendBuildPath));
    app.get('*', (req, res, next) => {
        if (!req.originalUrl.startsWith('/api')) {
            console.log(`[SERVER PROD] Serving index.html for: ${req.originalUrl}`);
            res.sendFile(path.join(frontendBuildPath, 'index.html'));
        } else {
            next(); // Let API 404 handler catch it
        }
    });
}

// =====================
// 6. Error Handling Middleware (MUST BE LAST)
// =====================
console.log("[SERVER START] Defining error handling middleware...");
app.use((req, res, next) => { // 404 Handler
    console.warn(`[404 HANDLER] Resource not found: ${req.method} ${req.originalUrl}`);
    res.status(404).json({
        success: false,
        message: `API endpoint not found: ${req.method} ${req.originalUrl}`
    });
});

app.use((err, req, res, next) => { // Global Error Handler
    console.error("[GLOBAL ERROR HANDLER] Uncaught Error:", err.name, err.message);
    if (process.env.NODE_ENV !== 'production' && err.stack) {
        console.error("Stack:", err.stack);
    }
    const statusCode = err.status || err.statusCode || 500;
    const message = err.message || "An unexpected internal server error occurred.";
    res.status(statusCode).json({
        success: false, message: message,
        ...(process.env.NODE_ENV !== 'production' && { errorName: err.name, stack: err.stack?.substring(0, 300) + '...' })
    });
});
console.log("[SERVER START] Error handling middleware defined.");


// =====================
// 7. Server Startup
// =====================
const PORT_APP = process.env.PORT || 5000; // Renamed to avoid conflict with module 'path'
const HOST_APP = process.env.HOST || "0.0.0.0";

mongoose.connection.on('error', (err) => { console.error(`[MONGOOSE EVENT] Connection error: ${err.message}`); });
mongoose.connection.on('disconnected', () => { console.warn('[MONGOOSE EVENT] MongoDB disconnected!'); });
mongoose.connection.on('reconnected', () => { console.info('[MONGOOSE EVENT] MongoDB reconnected!'); });

const startServer = () => {
    app.listen(PORT_APP, HOST_APP, () => {
        console.log(`[SERVER START] 🚀 Server running in ${process.env.NODE_ENV || 'development'} mode.`);
        console.log(`   Listening on: http://${HOST_APP === '0.0.0.0' ? 'localhost' : HOST_APP}:${PORT_APP} (Actual: ${HOST_APP}:${PORT_APP})`);
        console.log(`   API Health: http://${HOST_APP === '0.0.0.0' ? 'localhost' : HOST_APP}:${PORT_APP}/api/health`);
        console.log(`   CORS Frontend URL: ${corsOptions.origin}`);
    }).on('error', (err) => {
        console.error(`[SERVER START] ❌ Failed to start server on ${HOST_APP}:${PORT_APP}:`, err.message);
        if (err.code === 'EADDRINUSE') { console.error(`   Port ${PORT_APP} is already in use.`); }
        process.exit(1);
    });
};

if (mongoose.connection.readyState === 1) {
    console.log("[SERVER START] MongoDB already connected. Starting server...");
    startServer();
} else {
    console.log("[SERVER START] Waiting for initial MongoDB connection...");
    mongoose.connection.once('open', () => {
        console.log("[SERVER START] MongoDB 'open' event. Starting server...");
        startServer();
    });
    const dbConnectTimeout = setTimeout(() => {
        if (mongoose.connection.readyState !== 1 && mongoose.connection.readyState !== 2) {
            console.error("[SERVER START] ❌ Timeout: MongoDB did not connect. Server NOT started.");
        }
    }, 20000);
    mongoose.connection.once('open', () => clearTimeout(dbConnectTimeout));
}