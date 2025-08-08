/**
 * 重新生成测试订单数据脚本
 * 用于清除现有订单并重新生成新的测试订单
 * 使用方法: node regenerate-orders.js
 */

const mongoose = require('mongoose');
const config = require('./config/database');
const bcrypt = require('bcryptjs');

// 加载模型
require('./models/order');
require('./models/user');
require('./models/store');
require('./models/storeAdmin');
require('./models/service');

const Order = mongoose.model('Order');
const User = mongoose.model('User');
const Store = mongoose.model('Store');
const Service = mongoose.model('Service');

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

// 生成随机电话号码
function generateRandomPhone() {
  return '1' + Math.floor(Math.random() * 9 + 1) + Math.random().toString().slice(2, 11);
}

// 生成随机名字
function generateRandomName() {
  const surnames = ['张', '王', '李', '赵', '刘', '陈', '杨', '黄', '周', '吴'];
  const names = ['伟', '芳', '娜', '秀英', '敏', '静', '强', '磊', '洋', '艳', '勇', '军', '杰', '娟', '涛', '明', '超', '霞', '平', '刚'];
  
  return surnames[Math.floor(Math.random() * surnames.length)] + 
         names[Math.floor(Math.random() * names.length)];
}

// 生成随机地址
function generateRandomAddress() {
  const provinces = ['北京市', '上海市', '广东省', '浙江省', '江苏省'];
  const cities = ['朝阳区', '浦东新区', '广州市', '杭州市', '南京市'];
  const districts = ['海淀', '徐汇', '天河', '西湖', '玄武'];
  const streets = ['中关村大街', '淮海路', '天河路', '西湖大道', '中山路'];
  
  const province = provinces[Math.floor(Math.random() * provinces.length)];
  const city = cities[Math.floor(Math.random() * cities.length)];
  const district = districts[Math.floor(Math.random() * districts.length)];
  const street = streets[Math.floor(Math.random() * streets.length)];
  const number = Math.floor(Math.random() * 100) + 1;
  
  return `${province}${city}${district}区${street}${number}号`;
}

// 生成随机订单状态
function generateRandomStatus() {
  // 使用新的状态系统
  const statuses = [
    'pending',  // 待支付
    'paid',     // 已支付
    'toPickup', // 待取件
    'pickedUp', // 已取件
    'sorting',  // 分拣中
    'washing',  // 洗涤中
    'drying',   // 烘干中
    'ironing',  // 熨烫中
    'packaging', // 包装中
    'ready',    // 准备好
    'completed' // 已完成
  ];
  
  // 权重分配，使大部分订单处于中间状态
  const weights = [5, 15, 10, 10, 15, 20, 10, 5, 5, 3, 2];
  let totalWeight = weights.reduce((a, b) => a + b, 0);
  let random = Math.random() * totalWeight;
  
  for (let i = 0; i < weights.length; i++) {
    if (random < weights[i]) {
      return statuses[i];
    }
    random -= weights[i];
  }
  
  return statuses[0]; // 默认返回第一个状态
}

// 生成测试订单
async function regenerateOrders() {
  try {
    // 1. 清除现有订单数据
    console.log('清除现有订单数据...');
    await Order.deleteMany({});
    console.log('订单数据已清除');
    
    // 2. 获取第一个商店和服务
    const store = await Store.findOne({});
    if (!store) {
      console.error('未找到商店，请先创建商店');
      return;
    }
    
    const services = await Service.find({});
    if (services.length === 0) {
      console.error('未找到服务，请先创建服务');
      return;
    }
    
    // 3. 获取或创建测试用户
    let users = await User.find({}).limit(5);
    if (users.length < 5) {
      console.log('创建测试用户...');
      
      // 删除现有测试用户
      await User.deleteMany({ email: /^test/ });
      
      // 创建新的测试用户
      const newUsers = [];
      for (let i = 0; i < 10; i++) {
        const name = generateRandomName();
        const phone = generateRandomPhone();
        const address = generateRandomAddress();
        
        const user = new User({
          username: `test${i + 1}`,
          email: `test${i + 1}@example.com`,
          password: await bcrypt.hash('123456', 10),
          phone,
          nickname: name,
          address: [{
            name: address,
            phone,
            address,
            isDefault: true
          }]
        });
        
        newUsers.push(user);
      }
      
      users = await User.insertMany(newUsers);
      console.log(`已创建 ${users.length} 个测试用户`);
    }
    
    // 4. 创建测试订单
    console.log('创建测试订单...');
    const newOrders = [];
    
    for (let i = 0; i < 50; i++) {
      // 随机选择用户
      const user = users[Math.floor(Math.random() * users.length)];
      
      // 随机选择服务和数量
      const orderItems = [];
      const numItems = Math.floor(Math.random() * 3) + 1;
      let subTotal = 0;
      
      for (let j = 0; j < numItems; j++) {
        const service = services[Math.floor(Math.random() * services.length)];
        let serviceItem;
        
        // 处理新的服务结构（包含categories和items）
        if (service.categories && service.categories.length > 0) {
          const category = service.categories[Math.floor(Math.random() * service.categories.length)];
          if (category.items && category.items.length > 0) {
            serviceItem = category.items[Math.floor(Math.random() * category.items.length)];
          }
        }
        
        if (!serviceItem) {
          // 如果没有找到服务项，使用默认值
          serviceItem = {
            name: service.name,
            price: service.price || 30,
            _id: service._id
          };
        }
        
        const quantity = Math.floor(Math.random() * 3) + 1;
        const price = serviceItem.price || 30;
        const totalPrice = price * quantity;
        
        orderItems.push({
          serviceId: service._id,
          serviceItemId: serviceItem._id,
          name: serviceItem.name,
          price,
          quantity,
          unit: '件',
          totalPrice
        });
        
        subTotal += totalPrice;
      }
      
      // 计算订单总价
      const deliveryFee = Math.random() > 0.7 ? 10 : 0;
      const discount = Math.random() > 0.8 ? Math.floor(subTotal * 0.1) : 0;
      const totalPrice = subTotal + deliveryFee - discount;
      
      // 生成订单
      const status = generateRandomStatus();
      const createdAt = new Date(Date.now() - Math.floor(Math.random() * 30) * 24 * 60 * 60 * 1000);
      
      // 创建订单对象
      const orderData = {
        user: user._id,
        store: store._id,
        orderNo: await Order.generateOrderNo(),
        pickupCode: await Order.generatePickupCode(),
        items: orderItems,
        status,
        paymentMethod: Math.random() > 0.3 ? 'wechat' : (Math.random() > 0.5 ? 'alipay' : 'cash'),
        subTotal,
        deliveryFee,
        discount,
        totalPrice,
        address: user.address && user.address.length > 0 ? user.address[0] : null,
        remark: Math.random() > 0.7 ? '请轻柔洗涤' : '',
        createdAt,
        updatedAt: createdAt
      };
      
      // 根据状态设置额外字段
      if (status !== 'pending') {
        orderData.payTime = new Date(createdAt.getTime() + Math.floor(Math.random() * 3600000));
        
        // 初始化状态历史
        orderData.statusHistory = [{
          status: 'pending',
          timestamp: createdAt,
          remark: '订单创建'
        }, {
          status: 'paid',
          timestamp: orderData.payTime,
          remark: '订单支付'
        }];
        
        // 添加后续状态记录
        const statuses = ['pending', 'paid', 'toPickup', 'pickedUp', 'sorting', 'washing', 'drying', 'ironing', 'packaging', 'ready', 'completed'];
        const statusIndex = statuses.indexOf(status);
        
        if (statusIndex > 1) { // 已经有pending和paid的记录
          for (let k = 2; k <= statusIndex; k++) {
            const timeOffset = Math.floor(Math.random() * 3600000) + 3600000; // 1-2小时
            const timestamp = new Date(orderData.statusHistory[k-1].timestamp.getTime() + timeOffset);
            
            orderData.statusHistory.push({
              status: statuses[k],
              timestamp,
              remark: `进入${statuses[k]}状态`
            });
          }
        }
        
        // 设置洗护状态
        if (['sorting', 'washing', 'drying', 'ironing', 'packaging'].includes(status)) {
          orderData.processingStatus = status;
          orderData.processingTime = orderData.statusHistory[orderData.statusHistory.length - 1].timestamp;
        }
        
        // 完成时间
        if (status === 'completed') {
          orderData.completedTime = orderData.statusHistory[orderData.statusHistory.length - 1].timestamp;
        }
        
        // 预计完成时间
        if (status === 'ready') {
          const readyTime = orderData.statusHistory[orderData.statusHistory.length - 1].timestamp;
          const estimateTime = new Date(readyTime);
          estimateTime.setHours(estimateTime.getHours() + 2);
          orderData.estimateCompleteTime = estimateTime;
        }
      }
      
      newOrders.push(orderData);
    }
    
    // 批量插入订单
    const createdOrders = await Order.create(newOrders);
    console.log(`已创建 ${createdOrders.length} 个测试订单`);
    
    console.log('订单重新生成完成');
  } catch (error) {
    console.error('生成测试订单失败:', error);
  } finally {
    mongoose.disconnect();
    console.log('数据库连接已关闭');
  }
}

// 执行重新生成
regenerateOrders(); 