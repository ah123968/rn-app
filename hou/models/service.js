const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 服务项目模型
const serviceItemSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  unit: {
    type: String,
    default: '件'
  },
  description: String,
  image: String
});

const serviceCategorySchema = new Schema({
  name: {
    type: String,
    required: true
  },
  items: [serviceItemSchema]
});

const serviceSchema = new Schema({
  name: {
    type: String,
    required: true
  },
  icon: String,
  description: String,
  categories: [serviceCategorySchema],
  isActive: {
    type: Boolean,
    default: true
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

const Service = mongoose.model('Service', serviceSchema);

module.exports = Service; 