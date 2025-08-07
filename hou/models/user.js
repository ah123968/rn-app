const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 用户模型
const userSchema = new Schema({
  phone: {
    type: String,
    required: true,
    unique: true
  },
  nickname: {
    type: String,
    default: ''
  },
  avatar: {
    type: String,
    default: ''
  },
  gender: {
    type: String,
    enum: ['male', 'female', 'unknown'],
    default: 'unknown'
  },
  balance: {
    type: Number,
    default: 0
  },
  points: {
    type: Number,
    default: 0
  },
  isVip: {
    type: Boolean,
    default: false
  },
  inviteCode: {
    type: String,
    unique: true
  },
  invitedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User'
  },
  lastLoginAt: {
    type: Date
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  updatedAt: {
    type: Date,
    default: Date.now
  }
}, { timestamps: true });

const User = mongoose.model('User', userSchema);

module.exports = User; 