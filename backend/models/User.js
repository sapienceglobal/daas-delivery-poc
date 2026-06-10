const mongoose = require('mongoose');
const crypto = require('crypto');

const UserSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Name is required']
  },
  email: {
    type: String,
    required: [true, 'Email is required'],
    unique: true,
    lowercase: true,
    trim: true,
    match: [/^\S+@\S+\.\S+$/, 'Please provide a valid email address']
  },
  password: {
    type: String,
    required: [true, 'Password is required']
  },
  salt: {
    type: String
  },
  passwordAlgorithm: {
    type: String,
    enum: ['scrypt'],
    default: undefined
  },
  phone: {
    type: String,
    default: ''
  },
  savedAddresses: [{
    type: String
  }],
  role: {
    type: String,
    enum: ['customer', 'merchant', 'admin'],
    default: 'customer'
  },
  restaurantId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Restaurant',
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpire: {
    type: Date,
    default: null
  }
}, { timestamps: true });

// New passwords use Node's memory-hard scrypt. Existing PBKDF2 hashes are
// verified once and transparently upgraded on the next successful login.
UserSchema.methods.setPassword = function(password) {
  this.salt = crypto.randomBytes(16).toString('hex');
  this.password = crypto.scryptSync(password, this.salt, 64).toString('hex');
  this.passwordAlgorithm = 'scrypt';
};

UserSchema.methods.validatePassword = function(password) {
  const storedHash = Buffer.from(this.password, 'hex');
  const candidateHash = this.passwordAlgorithm === 'scrypt'
    ? crypto.scryptSync(password, this.salt, 64)
    : crypto.pbkdf2Sync(password, this.salt, 1000, 64, 'sha512');

  return storedHash.length === candidateHash.length &&
    crypto.timingSafeEqual(storedHash, candidateHash);
};

UserSchema.methods.needsPasswordRehash = function() {
  return this.passwordAlgorithm !== 'scrypt';
};

module.exports = mongoose.model('User', UserSchema);
