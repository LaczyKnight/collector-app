const mongoose = require('mongoose');
const bcrypt = require('bcryptjs'); // Needed for pre-save hook

const SALT_ROUNDS = 10; // Define salt rounds here or load from env

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true, // Ensure usernames are unique
    required: [true, 'Username is required.'], // Add custom error message
    trim: true,    // Remove leading/trailing whitespace
    lowercase: true // Store usernames in lowercase for consistent checks
  },
  password: {
    type: String,
    required: [true, 'Password is required.'],
    select: false  // IMPORTANT: Prevent password hash from being sent in query results by default
  },
  role: {
    type: String,
    required: true,
    enum: ['user', 'admin', 'editor'], // Define allowed roles (adjust as needed)
    default: 'user'
  },
  mustChangePassword: {
    type: Boolean,
    required: true,
    default: true // Default to true for new users
  }
}, {
  // Add timestamps (createdAt, updatedAt) automatically
  timestamps: true
});

// --- MODIFIED PRE-SAVE HOOK STARTS HERE ---
// Pre-save hook to hash password IF it has been modified AND isn't already hashed
UserSchema.pre('save', async function(next) {
  // Only proceed if the password field has been modified (or is new)
  if (!this.isModified('password')) {
    // console.log('[DEBUG] pre-save hook: Password not modified, skipping hash.'); // Optional: uncomment for verbose debugging
    return next(); // Go to the next middleware/save operation
  }

  // --- ADDED CHECK: Prevent re-hashing ---
  // Regular expression to check if the password already looks like a bcrypt hash
  const isHashed = /^\$2[aby]\$/.test(this.password);

  if (isHashed) {
    // If it already looks like a hash, don't hash it again
    console.log('[DEBUG] pre-save hook: Password already appears hashed, skipping re-hash.');
    return next(); // Go to the next middleware/save operation
  }
  // --- END ADDED CHECK ---

  // If the password was modified AND it's not already hashed, proceed to hash it
  try {
    console.log('[DEBUG] pre-save hook: Hashing new/modified plain text password before save.');
    const salt = await bcrypt.genSalt(SALT_ROUNDS);
    this.password = await bcrypt.hash(this.password, salt);
    next(); // Proceed with the now-hashed password
  } catch (error) {
    console.error('[ERROR] pre-save hook: Error hashing password:', error);
    next(error); // Pass the error to Mongoose
  }
});
// --- MODIFIED PRE-SAVE HOOK ENDS HERE ---


// Method to compare candidate password with the stored hash (useful elsewhere, e.g., login)
UserSchema.methods.comparePassword = async function(candidatePassword) {
  // 'this.password' won't be available here directly due to 'select: false'
  // We need to explicitly re-select it if using this method after a query.
  // Or, fetch the user with the password field explicitly selected when needed for comparison.
  // For now, we assume the password hash is available on the instance when called.
  // This might require adjustments depending on how you fetch users before comparing passwords.
  // A safer approach is often to fetch the user *with* the password field when needed:
  // const user = await User.findOne({ username }).select('+password');
  // Then call: await user.comparePassword(candidatePassword);
  // Or perform the comparison directly in the login logic as done in server.js.
  try {
      // If using this method, ensure 'this.password' is populated (e.g., using .select('+password'))
      if (!this.password) {
         // This error might occur if you fetched the user without '.select("+password")'
         // before calling this instance method.
         console.error("Error in comparePassword: User instance does not have password field selected.");
         throw new Error('Password field not selected on user instance.');
      }
      return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
      // Rethrow the error to be handled by the calling function
      console.error("Error during password comparison:", error);
      throw error;
  }
};


module.exports = mongoose.model('User', UserSchema);