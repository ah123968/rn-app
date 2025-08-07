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
    const { status } = req.body;
    
    if (!status || !['paid', 'processing', 'ready', 'completed', 'cancelled'].includes(status)) {
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
    
    // 状态检查和流程控制
    const currentStatus = order.status;
    
    // 只能按照正常流程更改状态
    const validTransitions = {
      'pending': ['cancelled'],
      'paid': ['processing', 'cancelled'],
      'processing': ['ready', 'cancelled'],
      'ready': ['completed', 'cancelled'],
      'completed': [],
      'cancelled': []
    };
    
    if (!validTransitions[currentStatus].includes(status)) {
      return res.status(400).json({
        code: -1,
        message: `无法将订单从 ${currentStatus} 状态更改为 ${status} 状态`,
        data: null
      });
    }
    
    // 更新订单状态
    order.status = status;
    
    // 如果更新为完成状态，设置完成时间
    if (status === 'completed') {
      order.completedTime = new Date();
    }
    
    // 如果更新为准备取件状态，设置预计完成时间
    if (status === 'ready') {
      // 默认设置为当前时间后的2小时
      const estimateTime = new Date();
      estimateTime.setHours(estimateTime.getHours() + 2);
      order.estimateCompleteTime = estimateTime;
    }
    
    // 保存订单
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
    
    // 检查订单状态
    if (order.status !== 'paid') {
      return res.status(400).json({
        code: -1,
        message: `订单当前状态为 ${order.status}，无法取件`,
        data: null
      });
    }
    
    // 更新订单状态为处理中
    order.status = 'processing';
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

module.exports = router; 