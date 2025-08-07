const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 门店模型
const storeSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  address: {
    type: String,
    required: true
  },
  location: {
    type: {
      type: String,
      enum: ['Point'],
      default: 'Point'
    },
    coordinates: {
      type: [Number], // [经度, 纬度]
      required: true
    }
  },
  phone: {
    type: String,
    required: true
  },
  businessHours: {
    type: String,
    default: '09:00-21:00'
  },
  images: [String],
  services: [String],
  introduction: {
    type: String,
    default: ''
  },
  status: {
    type: String,
    enum: ['open', 'closed', 'maintenance'],
    default: 'open'
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

// 创建地理空间索引
storeSchema.index({ location: '2dsphere' });

const Store = mongoose.model('Store', storeSchema);

module.exports = Store; 