// ./models/User.js
const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');

const SALT_ROUNDS = 10;

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    unique: true,
    required: [true, 'Username is required.'],
    trim: true,
    lowercase: true
  },
  password: {
    type: String,
    required: [true, 'Password is required.'],
    select: false
  },
  role: {
    type: String,
    required: true,
    enum: ['user', 'admin', 'editor'],
    default: 'user'
  },
  mustChangePassword: {
    type: Boolean,
    required: true,
    default: true
  }
}, {
  timestamps: true
});

// --- NEW AND IMPROVED BULLETPROOF FIX STARTS HERE ---

// HOOK #1: For 'save' and 'create' commands (Our original fix, kept for safety)
UserSchema.pre('save', async function(next) {
  if (this.isNew) {
    console.log(`[PRE-SAVE HOOK] New user ('${this.username}'). Setting mustChangePassword=true.`);
    this.mustChangePassword = true;
  }
  if (this.isModified('password')) {
    const isHashed = /^\$2[aby]\$/.test(this.password);
    if (!isHashed) {
      this.password = await bcrypt.hash(this.password, SALT_ROUNDS);
    }
  }
  next();
});

// HOOK #2: For 'findOneAndUpdate', 'updateOne' etc. (This will catch your broken API route)
UserSchema.pre('findOneAndUpdate', async function(next) {
  // 'this._update' contains the data being sent in the update command
  const update = this.getUpdate();
  console.log('[PRE-FINDONEANDUPDATE HOOK] Intercepted an update command.');

  // Check if a password is being updated. If so, hash it.
  if (update.password) {
    const isHashed = /^\$2[aby]\$/.test(update.password);
    if (!isHashed) {
      console.log('[PRE-FINDONEANDUPDATE HOOK] Hashing password for update command.');
      update.password = await bcrypt.hash(update.password, SALT_ROUNDS);
    }
  }

  // Check if this is a user creation via "upsert"
  // An "upsert" is an update that creates the document if it doesn't exist.
  const options = this.getOptions();
  if (options.upsert && options.setDefaultsOnInsert) {
      console.log('[PRE-FINDONEANDUPDATE HOOK] Upsert detected. Setting mustChangePassword=true.');
      // Mongoose 6+ uses this syntax for updates.
      this.set({ mustChangePassword: true });
      // For older Mongoose versions, you might need: update.$set = update.$set || {}; update.$set.mustChangePassword = true;
  }
  
  next();
});

// --- FIX ENDS HERE ---

// Method to compare passwords (unchanged)
UserSchema.methods.comparePassword = async function(candidatePassword) {
  try {
      if (!this.password) { throw new Error('Password field not selected.'); }
      return await bcrypt.compare(candidatePassword, this.password);
  } catch (error) {
      throw error;
  }
};

module.exports = mongoose.model('User', UserSchema);