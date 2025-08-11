var express = require('express');
var router = express.Router();
const Order = require('../../models/order');
const User = require('../../models/user');
const Store = require('../../models/store');
const Service = require('../../models/service');
const { auth } = require('../../middleware/auth');
const bcrypt = require('bcryptjs'); // Added for quick-test endpoint

/**
 * @route POST /api/order/calc
 * @desc 计算订单价格
 */
router.post('/calc', auth, async (req, res) => {
  try {
    // 获取请求体中的数据
    const { items, storeId, deliveryType = 'self' } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        code: -1,
        message: '请选择需要清洗的物品',
        data: null
      });
    }
    
    if (!storeId) {
      return res.status(400).json({
        code: -1,
        message: '请选择门店',
        data: null
      });
    }
    
    // 检查门店是否存在
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({
        code: -1,
        message: '门店不存在',
        data: null
      });
    }
    
    // 获取所有服务项目
    const services = await Service.find();
    
    // 计算每个物品的价格
    let calculatedItems = [];
    let subTotal = 0;
    
    for (const item of items) {
      const { serviceItemId, quantity = 1 } = item;
      
      if (!serviceItemId) {
        return res.status(400).json({
          code: -1,
          message: '物品信息不完整',
          data: null
        });
      }
      
      // 查找对应的服务项目
      let serviceItem = null;
      let serviceName = '';
      
      // 遍历所有服务类别查找对应的项目
      for (const service of services) {
        for (const category of service.categories) {
          const found = category.items.find(i => i._id.toString() === serviceItemId);
          if (found) {
            serviceItem = found;
            serviceName = service.name;
            break;
          }
        }
        if (serviceItem) break;
      }
      
      if (!serviceItem) {
        // 如果没有找到对应项目，可以返回模拟数据
        const price = 30.00; // 默认价格
        const totalPrice = price * quantity;
        
        calculatedItems.push({
          serviceItemId,
          name: '未知物品',
          price,
          quantity,
          unit: '件',
          totalPrice
        });
        
        subTotal += totalPrice;
      } else {
        // 计算该物品的总价
        const totalPrice = serviceItem.price * quantity;
        
        calculatedItems.push({
          serviceItemId,
          name: serviceItem.name,
          price: serviceItem.price,
          quantity,
          unit: serviceItem.unit,
          totalPrice
        });
        
        subTotal += totalPrice;
      }
    }
    
    // 计算配送费用
    let deliveryFee = 0;
    if (deliveryType === 'delivery') {
      deliveryFee = 10.00; // 默认配送费10元
    }
    
    // 计算折扣（可以根据用户会员状态等计算）
    const user = req.user;
    let discount = 0;
    
    if (user.isVip) {
      discount = subTotal * 0.05; // VIP用户享受95折
    }
    
    // 计算最终价格
    const totalPrice = subTotal + deliveryFee - discount;
    
    res.json({
      code: 0,
      message: '计算成功',
      data: {
        items: calculatedItems,
        subTotal,
        deliveryFee,
        discount,
        totalPrice
      }
    });
  } catch (error) {
    console.error('计算价格失败:', error);
    res.status(500).json({
      code: -1,
      message: '计算价格失败',
      data: null
    });
  }
});

/**
 * @route POST /api/order/create
 * @desc 创建洗衣筐订单
 */
router.post('/create', auth, async (req, res) => {
  try {
    const { 
      storeId, 
      items, 
      addressId = null, 
      remark = '', 
      deliveryType = 'self',
      useBalance = false,
      couponId = null
    } = req.body;
    
    if (!items || !Array.isArray(items) || items.length === 0) {
      return res.status(400).json({
        code: -1,
        message: '请选择需要清洗的物品',
        data: null
      });
    }
    
    if (!storeId) {
      return res.status(400).json({
        code: -1,
        message: '请选择门店',
        data: null
      });
    }
    
    // 检查门店是否存在
    const store = await Store.findById(storeId);
    if (!store) {
      return res.status(404).json({
        code: -1,
        message: '门店不存在',
        data: null
      });
    }
    
    // 计算订单价格
    const user = req.user;
    
    // 使用模拟数据创建订单
    let orderItems = [];
    let subTotal = 0;
    
    for (const item of items) {
      const { serviceItemId, name, price, quantity = 1, unit = '件' } = item;
      
      const totalPrice = price * quantity;
      
      orderItems.push({
        serviceItemId,
        name,
        price,
        quantity,
        unit,
        totalPrice
      });
      
      subTotal += totalPrice;
    }
    
    // 计算配送费用
    let deliveryFee = 0;
    if (deliveryType === 'delivery') {
      deliveryFee = 10.00;
    }
    
    // 计算折扣
    let discount = 0;
    if (user.isVip) {
      discount = subTotal * 0.05; // VIP用户享受95折
    }
    
    // 计算最终价格
    const totalPrice = subTotal + deliveryFee - discount;
    
    // 生成订单号和取件码
    const orderNo = Order.generateOrderNo();
    const pickupCode = Order.generatePickupCode();
    
    // 创建订单
    const order = new Order({
      user: user._id,
      store: storeId,
      orderNo,
      pickupCode,
      items: orderItems,
      status: 'pending', // 待支付
      subTotal,
      deliveryFee,
      discount,
      totalPrice,
      address: addressId,
      remark
    });
    
    await order.save();
    
    res.json({
      code: 0,
      message: '订单创建成功',
      data: {
        orderId: order._id,
        orderNo,
        totalPrice,
        orderTime: order.createdAt,
        pickupCode
      }
    });
  } catch (error) {
    console.error('创建订单失败:', error);
    res.status(500).json({
      code: -1,
      message: '创建订单失败',
      data: null
    });
  }
});

/**
 * @route POST /api/order/pay
 * @desc 发起支付请求
 */
router.post('/pay', auth, async (req, res) => {
  try {
    const { orderId, paymentMethod } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        code: -1,
        message: '订单ID不能为空',
        data: null
      });
    }
    
    if (!paymentMethod || !['wechat', 'alipay', 'memberCard', 'balance'].includes(paymentMethod)) {
      return res.status(400).json({
        code: -1,
        message: '支付方式无效',
        data: null
      });
    }
    
    // 查询订单
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        code: -1,
        message: '订单不存在',
        data: null
      });
    }
    
    // 检查订单状态
    if (order.status !== 'pending') {
      return res.status(400).json({
        code: -1,
        message: '订单状态异常，无法支付',
        data: null
      });
    }
    
    // 检查订单是否属于当前用户
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        code: -1,
        message: '无权操作该订单',
        data: null
      });
    }
    
    // 生成支付ID
    const paymentId = 'P' + Date.now().toString() + Math.floor(Math.random() * 1000).toString();
    
    // 根据支付方式处理
    if (paymentMethod === 'balance') {
      // 使用余额支付
      const user = req.user;
      
      if (user.balance < order.totalPrice) {
        return res.status(400).json({
          code: -1,
          message: '余额不足',
          data: null
        });
      }
      
      // 扣减余额
      user.balance -= order.totalPrice;
      await user.save();
      
      // 更新订单状态
      order.status = 'paid';
      order.paymentMethod = 'balance';
      order.paymentId = paymentId;
      order.payTime = new Date();
      await order.save();
      
      return res.json({
        code: 0,
        message: '支付成功',
        data: {
          orderId: order._id,
          orderNo: order.orderNo,
          paymentId,
          amount: order.totalPrice,
          status: 'success'
        }
      });
    } else {
      // 第三方支付 (模拟)
      order.paymentMethod = paymentMethod;
      order.paymentId = paymentId;
      await order.save();
      
      res.json({
        code: 0,
        message: '支付请求发起成功',
        data: {
          paymentId,
          orderId: order._id,
          orderNo: order.orderNo,
          amount: order.totalPrice,
          paymentUrl: `https://example.com/pay/${paymentId}`
        }
      });
    }
  } catch (error) {
    console.error('发起支付失败:', error);
    res.status(500).json({
      code: -1,
      message: '发起支付失败',
      data: null
    });
  }
});

/**
 * @route PUT /api/order/status
 * @desc 更改订单状态
 */
router.put('/status', auth, async (req, res) => {
  try {
    const { orderId, status } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        code: -1,
        message: '订单ID不能为空',
        data: null
      });
    }
    
    if (!status || !['pending', 'paid', 'processing', 'ready', 'completed', 'cancelled'].includes(status)) {
      return res.status(400).json({
        code: -1,
        message: '状态无效',
        data: null
      });
    }
    
    // 查询订单
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        code: -1,
        message: '订单不存在',
        data: null
      });
    }
    
    // 检查订单是否属于当前用户（或管理员）
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        code: -1,
        message: '无权操作该订单',
        data: null
      });
    }
    
    // 更新订单状态
    order.status = status;
    if (status === 'completed') {
      order.completedTime = new Date();
    }
    
    await order.save();
    
    res.json({
      code: 0,
      message: '状态更新成功',
      data: {
        orderId: order._id,
        orderNo: order.orderNo,
        status: order.status,
        updateTime: new Date()
      }
    });
  } catch (error) {
    console.error('更新订单状态失败:', error);
    res.status(500).json({
      code: -1,
      message: '更新订单状态失败',
      data: null
    });
  }
});

/**
 * @route GET /api/order/list
 * @desc 获取用户订单列表
 */
router.get('/list', auth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    
   
    
    // 构建查询条件
    const query = { user: req.user._id };
    if (status && ['pending', 'paid', 'processing', 'ready', 'completed', 'cancelled'].includes(status)) {
      query.status = status;
    }
    
   
    // 获取订单总数
    const total = await Order.countDocuments(query);
    
    
    // 查询订单列表
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .populate('store', 'name address phone')
      .exec();
    console.log('查询到的订单:', orders);
    
    // 格式化订单数据
    const formattedOrders = orders.map(order => ({
      orderId: order._id,
      orderNo: order.orderNo,
      storeName: order.store ? order.store.name : '未知门店',
      status: order.status,
      totalPrice: order.totalPrice,
      createTime: order.createdAt,
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity
      }))
    }));
    
    console.log('格式化后的订单数据:', formattedOrders);
    
    res.json({
      code: 0,
      message: '获取成功',
      data: {
        orders: formattedOrders,
        pagination: {
          page: pageNumber,
          pageSize: limitNumber,
          total
        }
      }
    });
  } catch (error) {
    console.error('获取订单列表失败:', error);
    res.status(500).json({
      code: -1,
      message: '获取订单列表失败',
      data: null
    });
  }
});

/**
 * @route GET /api/order/:id
 * @desc 获取订单详情
 */
router.get('/:id', auth, async (req, res) => {
  try {
    const orderId = req.params.id;
    
    // 查询订单详情
    const order = await Order.findById(orderId)
      .populate('store', 'name address phone')
      .populate('user', 'nickname phone')
      .populate('address')
      .exec();
    
    if (!order) {
      return res.status(404).json({
        code: -1,
        message: '订单不存在',
        data: null
      });
    }
    
    // 检查权限（订单所有者或管理员）
    if (order.user._id.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        code: -1,
        message: '无权查看该订单',
        data: null
      });
    }
    
    res.json({
      code: 0,
      message: '获取成功',
      data: {
        orderId: order._id,
        orderNo: order.orderNo,
        storeName: order.store ? order.store.name : '未知门店',
        storeAddress: order.store ? order.store.address : '',
        storePhone: order.store ? order.store.phone : '',
        status: order.status,
        pickupCode: order.pickupCode,
        createTime: order.createdAt,
        payTime: order.payTime,
        estimateCompleteTime: order.estimateCompleteTime,
        items: order.items,
        subTotal: order.subTotal,
        deliveryFee: order.deliveryFee,
        discount: order.discount,
        totalPrice: order.totalPrice,
        paymentMethod: order.paymentMethod,
        remark: order.remark
      }
    });
  } catch (error) {
    console.error('获取订单详情失败:', error);
    res.status(500).json({
      code: -1,
      message: '获取订单详情失败',
      data: null
    });
  }
});

/**
 * @route GET /api/order/by-code
 * @desc 通过提取码查询订单
 */
router.get('/by-code', async (req, res) => {
  try {
    const { code } = req.query;
    
    if (!code) {
      return res.status(400).json({
        code: -1,
        message: '提取码不能为空',
        data: null
      });
    }
    
    // 查询订单
    const order = await Order.findOne({ pickupCode: code })
      .populate('store', 'name')
      .exec();
    
    if (!order) {
      return res.status(404).json({
        code: -1,
        message: '未找到相关订单',
        data: null
      });
    }
    
    res.json({
      code: 0,
      message: '查询成功',
      data: {
        orderId: order._id,
        orderNo: order.orderNo,
        storeName: order.store ? order.store.name : '未知门店',
        status: order.status,
        createTime: order.createdAt,
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity
        })),
        totalPrice: order.totalPrice
      }
    });
  } catch (error) {
    console.error('查询订单失败:', error);
    res.status(500).json({
      code: -1,
      message: '查询订单失败',
      data: null
    });
  }
});

/**
 * @route POST /api/order/confirm-pickup
 * @desc 确认取件
 */
router.post('/confirm-pickup', auth, async (req, res) => {
  try {
    const { orderId } = req.body;
    
    if (!orderId) {
      return res.status(400).json({
        code: -1,
        message: '订单ID不能为空',
        data: null
      });
    }
    
    // 查询订单
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        code: -1,
        message: '订单不存在',
        data: null
      });
    }
    
    // 检查订单状态
    if (order.status !== 'ready') {
      return res.status(400).json({
        code: -1,
        message: '订单当前状态无法取件',
        data: null
      });
    }
    
    // 检查权限
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        code: -1,
        message: '无权操作该订单',
        data: null
      });
    }
    
    // 更新订单状态
    order.status = 'completed';
    order.completedTime = new Date();
    await order.save();
    
    res.json({
      code: 0,
      message: '取件成功',
      data: {
        orderId: order._id,
        orderNo: order.orderNo,
        pickupTime: order.completedTime
      }
    });
  } catch (error) {
    console.error('确认取件失败:', error);
    res.status(500).json({
      code: -1,
      message: '确认取件失败',
      data: null
    });
  }
});

/**
 * @route POST /api/order/create-test
 * @desc 创建测试订单（仅用于开发测试）
 */
router.post('/create-test', async (req, res) => {
  try {
    const { count = 10 } = req.body;
    const orders = [];

    // 获取用户列表
    const users = await User.find().limit(20);
    if (users.length === 0) {
      return res.status(400).json({
        code: -1,
        message: '没有可用的用户，请先创建用户',
        data: null
      });
    }

    // 获取商店列表
    const stores = await Store.find().limit(10);
    if (stores.length === 0) {
      return res.status(400).json({
        code: -1,
        message: '没有可用的商店，请先创建商店',
        data: null
      });
    }

    // 获取服务列表
    const services = await Service.find();
    if (services.length === 0) {
      return res.status(400).json({
        code: -1,
        message: '没有可用的服务项目，请先创建服务',
        data: null
      });
    }

    // 生成随机订单状态
    const generateStatus = () => {
      const statuses = ['pending', 'paid', 'processing', 'ready', 'completed', 'cancelled'];
      const weights = [0.1, 0.2, 0.3, 0.2, 0.15, 0.05]; // 加权概率，使某些状态出现更频繁
      
      let random = Math.random();
      let sum = 0;
      for (let i = 0; i < weights.length; i++) {
        sum += weights[i];
        if (random <= sum) return statuses[i];
      }
      return statuses[0];
    };

    // 生成随机订单项目
    const generateItems = () => {
      const numItems = Math.floor(Math.random() * 4) + 1; // 1-4个商品
      const items = [];
      
      for (let i = 0; i < numItems; i++) {
        const service = services[Math.floor(Math.random() * services.length)];
        const quantity = Math.floor(Math.random() * 5) + 1; // 1-5件
        const price = Math.floor(Math.random() * 50) + 10; // 10-60元
        
        items.push({
          serviceId: service._id,
          serviceItemId: service._id,
          name: service.name,
          price: price,
          quantity: quantity,
          unit: '件',
          totalPrice: price * quantity
        });
      }
      return items;
    };

    // 计算总价
    const calculateTotals = (items) => {
      const subtotal = items.reduce((sum, item) => sum + item.totalPrice, 0);
      const deliveryFee = Math.random() > 0.7 ? Math.floor(Math.random() * 15) + 5 : 0;
      const discount = Math.random() > 0.6 ? Math.floor(Math.random() * 20) + 5 : 0;
      const total = subtotal + deliveryFee - discount;
      
      return { subtotal, deliveryFee, discount, total };
    };

    // 批量创建订单
    for (let i = 0; i < count; i++) {
      const user = users[Math.floor(Math.random() * users.length)];
      const store = stores[Math.floor(Math.random() * stores.length)];
      const status = generateStatus();
      const items = generateItems();
      const { subtotal, deliveryFee, discount, total } = calculateTotals(items);
      
      const orderNo = Order.generateOrderNo();
      const pickupCode = Order.generatePickupCode();
      
      const order = new Order({
        user: user._id,
        store: store._id,
        orderNo: orderNo,
        pickupCode: pickupCode,
        items: items,
        status: status,
        paymentMethod: status !== 'pending' ? ['wechat', 'alipay', 'memberCard'][Math.floor(Math.random() * 3)] : '',
        subTotal: subtotal,
        deliveryFee: deliveryFee,
        discount: discount,
        totalPrice: total,
        remark: Math.random() > 0.7 ? '请轻柔洗涤，衣物易损' : '',
      });
      
      // 添加支付时间
      if (status !== 'pending') {
        order.payTime = new Date(Date.now() - Math.floor(Math.random() * 7 * 24 * 60 * 60 * 1000));
      }
      
      // 添加预计完成时间
      if (['processing', 'ready'].includes(status)) {
        const estimateTime = new Date();
        estimateTime.setHours(estimateTime.getHours() + Math.floor(Math.random() * 48) + 2);
        order.estimateCompleteTime = estimateTime;
      }
      
      // 添加完成时间
      if (status === 'completed') {
        const completedTime = new Date();
        completedTime.setHours(completedTime.getHours() - Math.floor(Math.random() * 120));
        order.completedTime = completedTime;
      }
      
      // 添加取消原因
      if (status === 'cancelled') {
        const cancelReasons = ['用户取消', '店铺无法接单', '商品缺货', '其他原因'];
        order.cancelReason = cancelReasons[Math.floor(Math.random() * cancelReasons.length)];
      }
      
      await order.save();
      orders.push({
        id: order._id,
        orderNo: order.orderNo,
        status: order.status,
        totalPrice: order.totalPrice,
        createdAt: order.createdAt
      });
    }

    res.json({
      code: 0,
      message: '测试订单创建成功',
      data: { count: orders.length, orders }
    });
  } catch (error) {
    console.error('创建测试订单失败:', error);
    res.status(500).json({
      code: -1,
      message: '创建测试订单失败',
      data: null
    });
  }
});

/**
 * @route POST /api/order/quick-test
 * @desc 快速生成10条测试订单（直接使用简化逻辑）
 */
router.post('/quick-test', async (req, res) => {
  try {
    // 1. 获取第一个商店和第一个管理员
    const store = await Store.findOne({});
    if (!store) {
      return res.status(404).json({
        code: -1,
        message: '没有找到商店',
        data: null
      });
    }

    // 2. 查找或创建测试用户
    let user = await User.findOne({ username: 'testuser' });
    
    if (!user) {
      // 创建测试用户
      user = new User({
        username: 'testuser',
        email: 'test@example.com',
        password: await bcrypt.hash('123456', 10),
        phone: '13800138000',
        nickname: '测试用户',
        address: [{
          name: '北京市朝阳区',
          phone: '13800138000',
          address: '北京市朝阳区三里屯1号',
          isDefault: true
        }]
      });
      
      await user.save();
    }
    
    // 3. 查找服务
    const services = await Service.find({}).limit(3);
    if (services.length === 0) {
      // 如果没有服务，创建一个默认服务
      const defaultService = new Service({
        name: '标准洗衣',
        description: '日常衣物洗涤服务',
        price: 30,
        store: store._id
      });
      
      await defaultService.save();
      services.push(defaultService);
    }
    
    // 4. 批量创建10条测试订单
    const statusList = ['pending', 'paid', 'toPickup', 'pickedUp', 'washing', 'drying', 'ready', 'completed'];
    const orders = [];
    
    for (let i = 0; i < 10; i++) {
      // 随机选择一个状态
      const status = statusList[Math.floor(Math.random() * statusList.length)];
      
      // 随机创建1-3个订单项
      const items = [];
      const itemCount = Math.floor(Math.random() * 3) + 1;
      let subTotal = 0;
      
      for (let j = 0; j < itemCount; j++) {
        const service = services[Math.floor(Math.random() * services.length)];
        const price = service.price || 30;
        const quantity = Math.floor(Math.random() * 5) + 1;
        const totalPrice = price * quantity;
        
        items.push({
          serviceId: service._id,
          name: service.name,
          price,
          quantity,
          unit: '件',
          totalPrice
        });
        
        subTotal += totalPrice;
      }
      
      // 生成订单
      const deliveryFee = Math.random() > 0.7 ? 10 : 0;
      const discount = Math.random() > 0.8 ? Math.floor(subTotal * 0.1) : 0;
      const totalPrice = subTotal + deliveryFee - discount;
      
      // 创建订单基础数据
      const orderData = {
        user: user._id,
        store: store._id,
        orderNo: await Order.generateOrderNo(),
        pickupCode: await Order.generatePickupCode(),
        items,
        status,
        paymentMethod: Math.random() > 0.5 ? 'wechat' : 'alipay',
        subTotal,
        deliveryFee,
        discount,
        totalPrice,
        address: user.address && user.address.length > 0 ? user.address[0] : null,
        remark: Math.random() > 0.7 ? '请轻柔洗涤' : '',
        createdAt: new Date(),
        updatedAt: new Date()
      };
      
      // 根据状态设置额外字段
      if (status !== 'pending') {
        orderData.payTime = new Date();
        
        // 添加状态历史
        orderData.statusHistory = [];
        const statuses = ['pending', 'paid', 'toPickup', 'pickedUp', 'sorting', 'washing', 'drying', 'packaging', 'ready', 'completed'];
        const currentIndex = statuses.indexOf(status);
        
        for (let k = 0; k <= currentIndex; k++) {
          if (k < statuses.length) {
            orderData.statusHistory.push({
              status: statuses[k],
              timestamp: new Date(Date.now() - (currentIndex - k) * 3600000),
              remark: `订单${statuses[k]}状态`
            });
          }
        }
      }
      
      orders.push(orderData);
    }
    
    // 5. 保存订单
    await Order.insertMany(orders);
    
    res.status(201).json({
      code: 0,
      message: '测试订单创建成功',
      data: {
        count: orders.length
      }
    });
    
  } catch (error) {
    console.error('创建测试订单失败:', error);
    res.status(500).json({
      code: -1,
      message: '创建测试订单失败: ' + error.message,
      data: null
    });
  }
});

module.exports = router; 