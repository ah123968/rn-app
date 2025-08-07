const jwt = require('jsonwebtoken');
const User = require('../models/user');
const StoreAdmin = require('../models/storeAdmin');

// JWT密钥
const JWT_SECRET = 'laundry_service_secret_key';

// 生成JWT令牌 - 用户
const generateToken = (userId) => {
  return jwt.sign(
    {
      userId
    },
    JWT_SECRET,
    { expiresIn: '30d' }
  );
};

// 生成JWT令牌 - 商家管理员
const generateAdminToken = (adminId, storeId, role) => {
  return jwt.sign(
    {
      adminId,
      storeId,
      role
    },
    JWT_SECRET,
    { expiresIn: '7d' }
  );
};

// 用户认证中间件
const auth = async (req, res, next) => {
  try {
    // 获取请求头中的Authorization
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        code: -1,
        message: '请先登录',
        data: null
      });
    }

    // 验证令牌
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded.userId) {
      return res.status(401).json({
        code: -1,
        message: '无效的认证令牌',
        data: null
      });
    }

    // 查找用户
    const user = await User.findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        code: -1,
        message: '用户不存在',
        data: null
      });
    }

    // 将用户信息添加到请求对象中
    req.user = user;
    req.userId = user._id;
    
    next();
  } catch (error) {
    res.status(401).json({
      code: -1,
      message: '认证失败，请重新登录',
      data: null
    });
  }
};

// 商家认证中间件
const storeAdminAuth = async (req, res, next) => {
  try {
    // 获取请求头中的Authorization
    const token = req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        code: -1,
        message: '请先登录',
        data: null
      });
    }

    // 验证令牌
    const decoded = jwt.verify(token, JWT_SECRET);

    if (!decoded.adminId || !decoded.storeId) {
      return res.status(401).json({
        code: -1,
        message: '无效的认证令牌',
        data: null
      });
    }

    // 查找商家管理员
    const admin = await StoreAdmin.findById(decoded.adminId);
    
    if (!admin) {
      return res.status(401).json({
        code: -1,
        message: '管理员不存在',
        data: null
      });
    }

    if (!admin.isActive) {
      return res.status(403).json({
        code: -1,
        message: '账号已被禁用',
        data: null
      });
    }

    // 检查门店是否匹配
    if (admin.store.toString() !== decoded.storeId) {
      return res.status(401).json({
        code: -1,
        message: '无效的门店信息',
        data: null
      });
    }

    // 将管理员信息添加到请求对象中
    req.admin = admin;
    req.adminId = admin._id;
    req.storeId = admin.store;
    req.adminRole = admin.role;
    
    next();
  } catch (error) {
    res.status(401).json({
      code: -1,
      message: '认证失败，请重新登录',
      data: null
    });
  }
};

// 检查管理员权限
const checkAdminRole = (roles = []) => {
  return (req, res, next) => {
    if (!req.adminRole) {
      return res.status(401).json({
        code: -1,
        message: '请先登录',
        data: null
      });
    }

    // 如果未指定角色或管理员具有admin角色，则允许访问
    if (roles.length === 0 || req.adminRole === 'admin') {
      return next();
    }

    // 检查角色是否符合要求
    if (roles.includes(req.adminRole)) {
      next();
    } else {
      res.status(403).json({
        code: -1,
        message: '您没有权限执行此操作',
        data: null
      });
    }
  };
};

module.exports = {
  generateToken,
  generateAdminToken,
  auth,
  storeAdminAuth,
  checkAdminRole
}; 