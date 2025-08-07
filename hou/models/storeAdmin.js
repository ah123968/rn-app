const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const bcrypt = require('bcryptjs');

// 商家管理员模型
const storeAdminSchema = new Schema({
  username: {
    type: String,
    required: true,
    unique: true
  },
  password: {
    type: String,
    required: true
  },
  name: {
    type: String,
    required: true
  },
  phone: {
    type: String,
    required: true
  },
  role: {
    type: String,
    enum: ['admin', 'manager', 'staff'],
    default: 'staff'
  },
  store: {
    type: Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  avatar: {
    type: String,
    default: ''
  },
  isActive: {
    type: Boolean,
    default: true
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

// 密码加密
storeAdminSchema.pre('save', async function(next) {
  const admin = this;
  
  // 只有在密码被修改或新创建时才加密
  if (!admin.isModified('password')) return next();
  
  try {
    // 生成盐
    const salt = await bcrypt.genSalt(10);
    
    // 加密密码
    const hash = await bcrypt.hash(admin.password, salt);
    
    // 替换明文密码
    admin.password = hash;
    next();
  } catch (error) {
    return next(error);
  }
});

// 验证密码
storeAdminSchema.methods.comparePassword = async function(candidatePassword) {
  return await bcrypt.compare(candidatePassword, this.password);
};

const StoreAdmin = mongoose.model('StoreAdmin', storeAdminSchema);

module.exports = StoreAdmin; 