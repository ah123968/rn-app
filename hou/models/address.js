const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 地址模型（用于订单 address 字段的 populate）
const addressSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: false
  },
  contactName: {
    type: String,
    default: ''
  },
  phone: {
    type: String,
    default: ''
  },
  province: {
    type: String,
    default: ''
  },
  city: {
    type: String,
    default: ''
  },
  district: {
    type: String,
    default: ''
  },
  detail: {
    type: String,
    default: ''
  },
  isDefault: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

const Address = mongoose.model('Address', addressSchema);

module.exports = Address; 