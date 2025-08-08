/**
 * 订单状态迁移脚本
 * 用于直接修改MongoDB中的订单状态
 * 使用方法: node migrate-orders.js
 */

const mongoose = require('mongoose');
const config = require('./config/database');
require('./models/order');
const Order = mongoose.model('Order');

// 连接数据库
mongoose.connect(config.mongoURI, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('数据库连接成功'))
.catch(err => {
  console.error('数据库连接失败:', err);
  process.exit(1);
});

// 状态映射表
const statusMap = {
  'processing': 'washing', // 将旧的processing映射到新的washing
  // 可以添加其他状态映射
};

// 创建新的statusHistory字段
const createStatusHistory = (order, newStatus) => {
  return {
    status: newStatus,
    timestamp: new Date(),
    remark: '系统自动迁移状态'
  };
};

// 迁移订单状态
async function migrateOrderStatuses() {
  try {
    console.log('开始迁移订单状态...');
    
    // 查找所有订单
    const orders = await Order.find({});
    console.log(`找到 ${orders.length} 个订单`);
    
    let migratedCount = 0;
    let errorCount = 0;
    
    // 遍历并更新订单
    for (const order of orders) {
      try {
        let needsUpdate = false;
        let newStatus = order.status;
        
        // 判断是否需要更新状态
        if (statusMap[order.status]) {
          newStatus = statusMap[order.status];
          needsUpdate = true;
          console.log(`订单 ${order._id}: 状态将从 ${order.status} 更新为 ${newStatus}`);
        }
        
        // 更新订单状态
        if (needsUpdate) {
          // 更新状态
          order.status = newStatus;
          
          // 初始化状态历史记录
          if (!order.statusHistory) {
            order.statusHistory = [];
          }
          
          // 添加状态历史记录
          order.statusHistory.push(createStatusHistory(order, newStatus));
          
          // 设置处理状态
          if (['sorting', 'washing', 'drying', 'ironing', 'packaging'].includes(newStatus)) {
            order.processingStatus = newStatus;
            order.processingTime = new Date();
          }
          
          // 保存订单
          await order.save();
          migratedCount++;
          console.log(`订单 ${order._id} 状态更新成功`);
        }
      } catch (error) {
        console.error(`订单 ${order._id} 更新失败:`, error);
        errorCount++;
      }
    }
    
    console.log(`状态迁移完成: 成功更新 ${migratedCount} 个订单, 失败 ${errorCount} 个订单`);
  } catch (error) {
    console.error('迁移过程中出错:', error);
  } finally {
    // 断开数据库连接
    mongoose.disconnect();
    console.log('数据库连接已关闭');
  }
}

// 执行迁移
migrateOrderStatuses(); 