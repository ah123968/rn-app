const express = require('express');
const router = express.Router();
const StoreAdmin = require('../../models/storeAdmin');
const Store = require('../../models/store');
const Order = require('../../models/order');
const { generateAdminToken, storeAdminAuth, checkAdminRole } = require('../../middleware/auth');

/**
 * @route POST /api/store-admin/login
 * @desc 商家登录
 */
router.post('/login', async (req, res) => {
  try {
    const { username, password } = req.body;
    console.log(username, password);
    
    // 验证参数
    if (!username || !password) {
      return res.status(400).json({
        code: -1,
        message: '用户名和密码不能为空',
        data: null
      });
    }
    
    // 查找管理员
    const admin = await StoreAdmin.findOne({ username }).populate('store', 'name address');
    
    if (!admin) {
      return res.status(401).json({
        code: -1,
        message: '用户名或密码错误',
        data: null
      });
    }
    
    // 检查账号状态
    if (!admin.isActive) {
      return res.status(403).json({
        code: -1,
        message: '账号已被禁用，请联系管理员',
        data: null
      });
    }
    
    // 验证密码
    const isMatch = await admin.comparePassword(password);
    
    if (!isMatch) {
      return res.status(401).json({
        code: -1,
        message: '用户名或密码错误',
        data: null
      });
    }
    
    // 更新登录时间
    admin.lastLoginAt = new Date();
    await admin.save();
    
    // 生成token
    const token = generateAdminToken(admin._id, admin.store._id, admin.role);
    
    res.json({
      code: 0,
      message: '登录成功',
      data: {
        token,
        adminId: admin._id,
        name: admin.name,
        role: admin.role,
        avatar: admin.avatar,
        store: {
          id: admin.store._id,
          name: admin.store.name,
          address: admin.store.address
        }
      }
    });
  } catch (error) {
    console.error('商家登录失败:', error);
    res.status(500).json({
      code: -1,
      message: '登录失败',
      data: null
    });
  }
});

/**
 * @route GET /api/store-admin/info
 * @desc 获取商家管理员信息
 */
router.get('/info', storeAdminAuth, async (req, res) => {
  try {
    const admin = req.admin;
    
    // 获取门店信息
    const store = await Store.findById(admin.store);
    
    if (!store) {
      return res.status(404).json({
        code: -1,
        message: '门店不存在',
        data: null
      });
    }
    
    res.json({
      code: 0,
      message: '获取成功',
      data: {
        adminId: admin._id,
        username: admin.username,
        name: admin.name,
        phone: admin.phone,
        role: admin.role,
        avatar: admin.avatar,
        store: {
          id: store._id,
          name: store.name,
          address: store.address,
          phone: store.phone,
          businessHours: store.businessHours
        }
      }
    });
  } catch (error) {
    console.error('获取商家信息失败:', error);
    res.status(500).json({
      code: -1,
      message: '获取商家信息失败',
      data: null
    });
  }
});

/**
 * @route GET /api/store-admin/orders
 * @desc 商家查看所有订单
 */
router.get('/orders', storeAdminAuth, async (req, res) => {
  try {
    const { status, page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    
    // 构建查询条件
    const query = { store: req.storeId };
    
    // 处理状态筛选
    if (status) {
      // 定义新旧状态映射关系
      const statusMap = {
        'paid': ['paid'], 
        'processing': ['toPickup', 'pickedUp', 'sorting', 'washing', 'drying', 'ironing', 'packaging'],
        'ready': ['ready'],
        'delivering': ['delivering'],
        'completed': ['completed'],
        'cancelled': ['cancelled'],
        'pending': ['pending'],
        // 反向映射
        'toPickup': ['processing'],
        'pickedUp': ['processing'],
        'sorting': ['processing'],
        'washing': ['processing'],
        'drying': ['processing'],
        'ironing': ['processing'],
        'packaging': ['processing']
      };
      
      // 添加状态兼容处理
      if (statusMap[status]) {
        // 使用 $in 运算符查询包含旧状态和新状态的订单
        query.status = { $in: [status, ...(statusMap[status] || [])] };
      } else if (['pending', 'paid', 'processing', 'ready', 'completed', 'cancelled'].includes(status)) {
        query.status = status;
      }
      
      console.log('应用状态筛选:', query.status);
    }
    
    // 获取订单总数
    const total = await Order.countDocuments(query);
    
    // 查询订单列表
    const orders = await Order.find(query)
      .sort({ createdAt: -1 })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber)
      .populate('user', 'nickname phone')
      .populate('address')
      .exec();
    
    // 格式化返回数据
    const formattedOrders = orders.map(order => ({
      orderId: order._id,
      orderNo: order.orderNo,
      status: order.status,
      pickupCode: order.pickupCode,
      totalPrice: order.totalPrice,
      createTime: order.createdAt,
      items: order.items.map(item => ({
        name: item.name,
        quantity: item.quantity,
        price: item.price
      })),
      user: order.user ? {
        nickname: order.user.nickname,
        phone: order.user.phone
      } : null,
      address: order.address,
      remark: order.remark
    }));
    
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
 * @route PUT /api/store-admin/order/:id/status
 * @desc 商家修改订单状态
 */
router.put('/order/:id/status', storeAdminAuth, async (req, res) => {
  try {
    const orderId = req.params.id;
    const { status, _allowPendingToProcessing, currentStatus } = req.body;
    // 兼容前端聚合状态：将 processing 映射为第一个具体阶段 toPickup
    const targetStatus = status === 'processing' ? 'toPickup' : status;
    
    // 更新可接受的状态列表
    const validStatuses = [
      'paid', 'toPickup', 'pickedUp', 'sorting',
      'washing', 'drying', 'ironing', 'packaging', 
      'ready', 'delivering', 'completed', 'cancelled'
    ];
    
    if (!targetStatus || !validStatuses.includes(targetStatus)) {
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
    
    // 检查订单是否属于该门店
    if (order.store.toString() !== req.storeId.toString()) {
      return res.status(403).json({
        code: -1,
        message: '无权操作该订单',
        data: null
      });
    }
    
    // 获取订单当前状态
    const orderStatus = order.status;
    console.log(`订单状态更新请求: ${orderStatus} -> ${targetStatus} (订单ID: ${orderId})`);
    
    // 定义合法的状态转换规则
    const validTransitions = {
      'pending': ['paid', 'cancelled'],
      'paid': ['toPickup', 'cancelled'],
      'toPickup': ['pickedUp', 'cancelled'],
      'pickedUp': ['sorting', 'cancelled'],
      'sorting': ['washing', 'drying', 'ironing', 'cancelled'],
      'washing': ['drying', 'cancelled'],
      'drying': ['ironing', 'cancelled'],
      'ironing': ['packaging', 'cancelled'],
      'packaging': ['ready', 'delivering', 'cancelled'],
      'ready': ['delivering', 'completed', 'cancelled'],
      'delivering': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': []
    };
    
    // 检查是否是合理的状态进度
    let allowUpdate = validTransitions[orderStatus] && validTransitions[orderStatus].includes(targetStatus);
    
    // 不允许重复设置相同状态
    if (orderStatus === targetStatus) {
      return res.status(400).json({
        code: -1,
        message: `订单已经是 ${targetStatus} 状态`,
        data: null
      });
    }
    
    // 不允许从完成或取消状态更改
    if (orderStatus === 'completed' || orderStatus === 'cancelled') {
      return res.status(400).json({
        code: -1,
        message: `订单已${orderStatus === 'completed' ? '完成' : '取消'}，无法更改状态`,
        data: null
      });
    }
    
    // 特殊处理: 如果前端发送了_allowPendingToProcessing参数，允许从pending到其他状态的转换
    if (orderStatus === 'pending' && _allowPendingToProcessing) {
      console.log(`特殊处理: 允许订单 ${orderId} 从 pending 状态更新为 ${targetStatus} 状态`);
      allowUpdate = true;
    }
    
    // 开发环境临时放宽限制，允许任意状态转换(除了上面明确禁止的)
    const isDevelopment = process.env.NODE_ENV !== 'production';
    if (isDevelopment && targetStatus !== orderStatus && orderStatus !== 'completed' && orderStatus !== 'cancelled') {
      console.log('开发环境: 允许任意有效状态转换');
      allowUpdate = true;
    }
    
    if (!allowUpdate) {
      return res.status(400).json({
        code: -1,
        message: `无法将订单从 ${orderStatus} 状态更改为 ${targetStatus} 状态`,
        data: null
      });
    }
    
    // 更新订单状态
    order.status = targetStatus;
    
    // 处理特定状态的额外逻辑
    const now = new Date();
    
    // 记录状态变更时间
    if (!order.statusHistory) {
      order.statusHistory = [];
    }
    
    order.statusHistory.push({
      status: targetStatus,
      timestamp: now,
      operator: req.adminId
    });
    
    // 如果更新为完成状态，设置完成时间
    if (targetStatus === 'completed') {
      order.completedTime = now;
    }
    
    // 如果更新为准备好取件状态，设置预计完成时间
    if (targetStatus === 'ready') {
      // 默认设置为当前时间后的2小时
      const estimateTime = new Date(now);
      estimateTime.setHours(estimateTime.getHours() + 2);
      order.estimateCompleteTime = estimateTime;
    }
    
    // 如果是洗涤相关状态，记录对应的洗涤进度
    if (['sorting', 'washing', 'drying', 'ironing', 'packaging'].includes(targetStatus)) {
      order.processingStatus = targetStatus;
      order.processingTime = now;
    }
    
    // 如果是配送状态，记录配送开始时间
    if (targetStatus === 'delivering') {
      order.deliveryStartTime = now;
    }
    
    // 保存订单
    await order.save();
    
    // 返回成功响应
    console.log(`订单 ${orderId} 状态更新成功: ${orderStatus} -> ${targetStatus}`);
    
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
      message: '更新状态失败',
      data: null
    });
  }
});

/**
 * @route POST /api/store-admin/order/take
 * @desc 商家凭提取码取件
 */
router.post('/order/take', storeAdminAuth, async (req, res) => {
  try {
    const { pickupCode } = req.body;
    
    if (!pickupCode) {
      return res.status(400).json({
        code: -1,
        message: '提取码不能为空',
        data: null
      });
    }
    
    // 查询订单
    const order = await Order.findOne({ 
      pickupCode,
      store: req.storeId 
    }).populate('user', 'nickname phone');
    
    if (!order) {
      return res.status(404).json({
        code: -1,
        message: '未找到相关订单或提取码错误',
        data: null
      });
    }
    
    // 允许的取件前状态
    const allowedBeforePickup = ['paid', 'pending', 'toPickup'];
    if (!allowedBeforePickup.includes(order.status)) {
      return res.status(400).json({
        code: -1,
        message: `订单当前状态为 ${order.status}，无法取件`,
        data: null
      });
    }
    
    // 更新订单状态为处理中
    order.status = 'processing';
    const now = new Date();
    if (!order.statusHistory) order.statusHistory = [];
    order.statusHistory.push({
      status: 'processing',
      timestamp: now,
      operator: req.adminId,
      remark: '门店凭提取码取衣'
    });
    order.processingStatus = 'sorting';
    order.processingTime = now;
    await order.save();
    
    res.json({
      code: 0,
      message: '取件成功，订单状态已更新为处理中',
      data: {
        orderId: order._id,
        orderNo: order.orderNo,
        status: order.status,
        user: order.user ? {
          nickname: order.user.nickname,
          phone: order.user.phone
        } : null,
        items: order.items.map(item => ({
          name: item.name,
          quantity: item.quantity
        }))
      }
    });
  } catch (error) {
    console.error('取件失败:', error);
    res.status(500).json({
      code: -1,
      message: '取件失败',
      data: null
    });
  }
});

/**
 * @route POST /api/store-admin/migrate-orders
 * @desc 商家手动迁移订单状态
 */
router.post('/migrate-orders', storeAdminAuth, async (req, res) => {
  try {
    // 获取该店铺的所有订单
    const orders = await Order.find({ store: req.storeId });
    
    let migratedCount = 0;
    
    // 遍历订单进行状态迁移
    for (const order of orders) {
      let needsUpdate = false;
      let newStatus = order.status;
      
      // 将旧状态映射为新状态
      if (order.status === 'processing') {
        newStatus = 'washing';
        needsUpdate = true;
      }
      
      // 如果需要更新，保存订单
      if (needsUpdate) {
        order.status = newStatus;
        
        // 添加状态历史记录
        if (!order.statusHistory) {
          order.statusHistory = [];
        }
        
        order.statusHistory.push({
          status: newStatus,
          timestamp: new Date(),
          operator: req.adminId,
          remark: '系统自动迁移状态'
        });
        
        await order.save();
        migratedCount++;
      }
    }
    
    res.json({
      code: 0,
      message: `状态迁移完成，共更新了${migratedCount}个订单`,
      data: { migratedCount }
    });
  } catch (error) {
    console.error('订单状态迁移失败:', error);
    res.status(500).json({
      code: -1,
      message: '订单状态迁移失败: ' + error.message,
      data: null
    });
  }
});

/**
 * @route POST /api/store-admin/init
 * @desc 初始化商家管理员账号（仅用于开发测试）
 */
router.post('/init', async (req, res) => {
  try {
    // 检查是否已存在管理员账号
    const count = await StoreAdmin.countDocuments();
    if (count > 0) {
      return res.json({
        code: -1,
        message: '已存在管理员账号',
        data: { count }
      });
    }
    
    // 检查是否存在门店
    const stores = await Store.find();
    if (stores.length === 0) {
      // 创建默认门店
      const defaultStore = new Store({
        name: '洁净干洗店（总店）',
        address: '北京市东城区东直门南大街5号',
        location: {
          type: 'Point',
          coordinates: [116.4074, 39.9042]
        },
        phone: '010-12345678',
        businessHours: '09:00-21:00',
        images: ['https://example.com/store1.jpg'],
        services: ['干洗', '水洗', '熨烫', '皮具护理'],
        introduction: '洁净干洗店成立于2010年，专注高品质洗护服务。',
        status: 'open'
      });
      
      await defaultStore.save();
      
      // 创建默认管理员
      const admin = new StoreAdmin({
        username: 'admin',
        password: 'admin123', // 实际应用中应使用更复杂的密码
        name: '管理员',
        phone: '13800138000',
        role: 'admin',
        store: defaultStore._id
      });
      
      await admin.save();
      
      return res.json({
        code: 0,
        message: '管理员账号初始化成功',
        data: {
          username: 'admin',
          password: 'admin123',
          storeName: defaultStore.name
        }
      });
    } else {
      // 使用现有的第一个门店创建管理员
      const store = stores[0];
      
      const admin = new StoreAdmin({
        username: 'admin',
        password: 'admin123', // 实际应用中应使用更复杂的密码
        name: '管理员',
        phone: '13800138000',
        role: 'admin',
        store: store._id
      });
      
      await admin.save();
      
      return res.json({
        code: 0,
        message: '管理员账号初始化成功',
        data: {
          username: 'admin',
          password: 'admin123',
          storeName: store.name
        }
      });
    }
  } catch (error) {
    console.error('初始化管理员账号失败:', error);
    res.status(500).json({
      code: -1,
      message: '初始化管理员账号失败',
      data: null
    });
  }
});

/**
 * @route POST /api/store-admin/create
 * @desc 创建新商家账号（仅用于开发测试）
 */
router.post('/create', async (req, res) => {
  try {
    const { username, password, name, phone, storeName, storeAddress } = req.body;
    
    // 验证必要参数
    if (!username || !password || !name || !phone) {
      return res.status(400).json({
        code: -1,
        message: '用户名、密码、姓名和电话不能为空',
        data: null
      });
    }
    
    // 检查用户名是否已存在
    const existingAdmin = await StoreAdmin.findOne({ username });
    if (existingAdmin) {
      return res.status(400).json({
        code: -1,
        message: '用户名已存在',
        data: null
      });
    }
    
    // 创建或获取店铺
    let store;
    if (storeName) {
      // 如果提供了店铺信息，创建新店铺
      store = new Store({
        name: storeName,
        address: storeAddress || '默认地址',
        location: {
          type: 'Point',
          coordinates: [116.4074, 39.9042] // 默认北京坐标
        },
        phone: phone,
        businessHours: '09:00-21:00',
        images: [],
        services: ['干洗', '水洗', '熨烫'],
        introduction: `${storeName}，专业洗护服务。`,
        status: 'open'
      });
      await store.save();
    } else {
      // 否则使用第一个可用店铺
      store = await Store.findOne();
      if (!store) {
        return res.status(400).json({
          code: -1,
          message: '没有可用店铺，请提供店铺信息',
          data: null
        });
      }
    }
    
    // 创建管理员账号
    const admin = new StoreAdmin({
      username,
      password, // 密码会在保存前自动加密（通过模型中的pre-save中间件）
      name,
      phone,
      role: 'admin', // 设为管理员
      store: store._id,
      isActive: true
    });
    
    await admin.save();
    
    res.json({
      code: 0,
      message: '商家账号创建成功',
      data: {
        username,
        name,
        storeName: store.name,
        storeId: store._id
      }
    });
  } catch (error) {
    console.error('创建商家账号失败:', error);
    res.status(500).json({
      code: -1,
      message: '创建商家账号失败',
      data: null
    });
  }
});

module.exports = router; 