const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// 订单模型
const orderItemSchema = new Schema({
  serviceId: {
    type: Schema.Types.ObjectId,
    ref: 'Service'
  },
  serviceItemId: String,
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    default: 1
  },
  unit: {
    type: String,
    default: '件'
  },
  totalPrice: {
    type: Number,
    required: true
  }
});

const orderSchema = new Schema({
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  store: {
    type: Schema.Types.ObjectId,
    ref: 'Store',
    required: true
  },
  orderNo: {
    type: String,
    required: true,
    unique: true
  },
  pickupCode: {
    type: String,
    required: true
  },
  items: [orderItemSchema],
  status: {
    type: String,
    enum: [
      'pending',       // 待支付
      'paid',          // 已支付
      'toPickup',      // 待取件(店家需上门取衣或等待客户送来)
      'pickedUp',      // 已取件(已收到衣物)
      'sorting',       // 分拣中
      'washing',       // 洗涤中
      'drying',        // 烘干中
      'ironing',       // 熨烫中
      'packaging',     // 包装中
      'ready',         // 准备好(待客户取件)
      'delivering',    // 配送中
      'completed',     // 已完成
      'cancelled'      // 已取消
    ],
    default: 'pending'
  },
  paymentMethod: {
    type: String,
    enum: ['wechat', 'alipay', 'memberCard', 'cash', ''],
    default: ''
  },
  paymentId: String,
  payTime: Date,
  subTotal: {
    type: Number,
    required: true
  },
  deliveryFee: {
    type: Number,
    default: 0
  },
  discount: {
    type: Number,
    default: 0
  },
  totalPrice: {
    type: Number,
    required: true
  },
  address: {
    type: Schema.Types.ObjectId,
    ref: 'Address'
  },
  remark: String,
  estimateCompleteTime: Date,
  completedTime: Date,
  // 新增字段 - 状态历史记录
  statusHistory: [{
    status: String,
    timestamp: Date,
    operator: {
      type: Schema.Types.ObjectId,
      ref: 'StoreAdmin'
    },
    remark: String
  }],
  // 新增字段 - 洗涤处理状态
  processingStatus: {
    type: String,
    enum: ['sorting', 'washing', 'drying', 'ironing', 'packaging', ''],
    default: ''
  },
  processingTime: Date,
  // 新增字段 - 配送相关
  deliveryStartTime: Date,
  deliveryCompletedTime: Date,
  // 原有字段
  cancelReason: String,
  usedCoupon: {
    type: Schema.Types.ObjectId,
    ref: 'Coupon'
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

// 生成唯一订单号和取件码的方法
orderSchema.statics.generateOrderNo = function() {
  // 生成格式：O + 年月日 + 随机6位数字
  const date = new Date();
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const random = Math.floor(Math.random() * 900000) + 100000;
  return `O${year}${month}${day}${random}`;
};

orderSchema.statics.generatePickupCode = function() {
  // 生成格式：随机2个大写字母 + 4位数字
  const letters = 'ABCDEFGHJKLMNPQRSTUVWXYZ'; // 去掉容易混淆的I和O
  let code = '';
  for (let i = 0; i < 2; i++) {
    code += letters.charAt(Math.floor(Math.random() * letters.length));
  }
  const numbers = Math.floor(Math.random() * 9000) + 1000;
  code += numbers;
  return code;
};

const Order = mongoose.model('Order', orderSchema);

module.exports = Order; 