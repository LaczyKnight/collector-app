// src/config/passport-jwt-strategy.js
const JwtStrategy = require('passport-jwt').Strategy;
const ExtractJwt = require('passport-jwt').ExtractJwt;
const User = require('../models/User'); // Adjust path if necessary

const opts = {};
opts.jwtFromRequest = ExtractJwt.fromAuthHeaderAsBearerToken();
opts.secretOrKey = process.env.JWT_SECRET; // Make sure JWT_SECRET is loaded from .env

module.exports = (passport) => { // This function receives the main passport instance
    if (!opts.secretOrKey) {
        // This check is important because if JWT_SECRET is undefined here, passport-jwt will throw an error
        console.error("❌ FATAL: JWT_SECRET not available for Passport JWT Strategy. Ensure it's loaded from .env before this file is required.");
        throw new Error("JWT_SECRET for Passport is missing. Server cannot start securely.");
    }

    passport.use(
        'jwt', // <--- NAMING THE STRATEGY 'jwt'
        new JwtStrategy(opts, async (jwt_payload, done) => {
            console.log('[PASSPORT JWT STRATEGY] Verifying token. Payload:', jwt_payload);
            try {
                const user = await User.findById(jwt_payload.id).select('-password');
                if (user) {
                    console.log(`[PASSPORT JWT STRATEGY] User found by ID ${jwt_payload.id}: ${user.username}`);
                    return done(null, user); // req.user will be this user object
                } else {
                    console.warn(`[PASSPORT JWT STRATEGY] User NOT found for ID ${jwt_payload.id} from token.`);
                    return done(null, false);
                }
            } catch (err) {
                console.error('[PASSPORT JWT STRATEGY] Error during user lookup:', err);
                return done(err, false);
            }
        })
    );
    console.log('[PASSPORT CORE] JWT Strategy configured and registered with Passport.');
};