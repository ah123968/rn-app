var express = require('express');
var router = express.Router();
const User = require('../../models/user');
const { generateToken, auth } = require('../../middleware/auth');
const crypto = require('crypto');

// 生成随机邀请码
const generateInviteCode = () => {
  // 生成6位随机字母数字组合
  return crypto.randomBytes(3).toString('hex').toUpperCase();
};

// 生成短信验证码 (模拟)
const generateSmsCode = () => {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// 模拟短信验证码存储
const smsCodeStore = {};

/**
 * @route POST /api/user/send-code
 * @desc 发送短信验证码
 */
router.post('/send-code', async (req, res) => {
  try {
    const { phone } = req.body;
    
    if (!phone || !/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        code: -1,
        message: '手机号格式不正确',
        data: null
      });
    }
    
    // 生成验证码
    const code = generateSmsCode();
    
    // 存储验证码 (实际应存入Redis并设置过期时间)
    smsCodeStore[phone] = code;
    
    // 模拟发送短信
    console.log(`向 ${phone} 发送验证码: ${code}`);
    
    res.json({
      code: 0,
      message: '验证码发送成功',
      data: { 
        // 测试环境可直接返回验证码
        code: code
      }
    });
  } catch (error) {
    console.error('发送验证码失败:', error);
    res.status(500).json({
      code: -1,
      message: '发送验证码失败',
      data: null
    });
  }
});

/**
 * @route POST /api/user/register
 * @desc 用户注册 - 手机号+验证码注册
 */
router.post('/register', async (req, res) => {
  try {
    const { phone, code } = req.body;
    
    // 验证参数
    if (!phone || !code) {
      return res.status(400).json({
        code: -1,
        message: '手机号和验证码不能为空',
        data: null
      });
    }
    
    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        code: -1,
        message: '手机号格式不正确',
        data: null
      });
    }
    
    // 验证验证码
    const storedCode = smsCodeStore[phone];
    if (!storedCode || storedCode !== code) {
      return res.status(400).json({
        code: -1,
        message: '验证码错误或已过期',
        data: null
      });
    }
    
    // 检查用户是否已存在
    let user = await User.findOne({ phone });
    if (user) {
      return res.status(400).json({
        code: -1,
        message: '该手机号已注册',
        data: null
      });
    }
    
    // 生成邀请码
    const inviteCode = generateInviteCode();
    
    // 创建用户
    user = new User({
      phone,
      inviteCode,
      nickname: `用户${phone.substr(7)}` // 默认昵称
    });
    
    await user.save();
    
    // 清除验证码
    delete smsCodeStore[phone];
    
    // 生成token
    const token = generateToken(user._id);
    
    res.json({
      code: 0,
      message: '注册成功',
      data: {
        userId: user._id,
        token,
        nickname: user.nickname,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('注册失败:', error);
    res.status(500).json({
      code: -1,
      message: '注册失败',
      data: null
    });
  }
});

/**
 * @route POST /api/user/login
 * @desc 用户登录 - 手机号+验证码登录
 */
router.post('/login', async (req, res) => {
  try {
    const { phone, code } = req.body;
    
    // 验证参数
    if (!phone || !code) {
      return res.status(400).json({
        code: -1,
        message: '手机号和验证码不能为空',
        data: null
      });
    }
    
    // 验证手机号格式
    if (!/^1[3-9]\d{9}$/.test(phone)) {
      return res.status(400).json({
        code: -1,
        message: '手机号格式不正确',
        data: null
      });
    }
    
    // 验证验证码
    const storedCode = smsCodeStore[phone];
    if (!storedCode || storedCode !== code) {
      return res.status(400).json({
        code: -1,
        message: '验证码错误或已过期',
        data: null
      });
    }
    
    // 查找用户
    let user = await User.findOne({ phone });
    
    // 如果用户不存在，则自动注册
    if (!user) {
      const inviteCode = generateInviteCode();
      user = new User({
        phone,
        inviteCode,
        nickname: `用户${phone.substr(7)}`
      });
      await user.save();
    }
    
    // 更新最后登录时间
    user.lastLoginAt = new Date();
    await user.save();
    
    // 清除验证码
    delete smsCodeStore[phone];
    
    // 生成token
    const token = generateToken(user._id);
    
    res.json({
      code: 0,
      message: '登录成功',
      data: {
        userId: user._id,
        token,
        nickname: user.nickname,
        avatar: user.avatar
      }
    });
  } catch (error) {
    console.error('登录失败:', error);
    res.status(500).json({
      code: -1,
      message: '登录失败',
      data: null
    });
  }
});

/**
 * @route GET /api/user/info
 * @desc 获取当前登录用户信息
 */
router.get('/info', auth, async (req, res) => {
  try {
    // 通过auth中间件获取用户信息
    const user = req.user;
    
    res.json({
      code: 0,
      message: '获取成功',
      data: {
        userId: user._id,
        phone: user.phone,
        nickname: user.nickname,
        avatar: user.avatar,
        gender: user.gender,
        balance: user.balance,
        points: user.points,
        isVip: user.isVip,
        inviteCode: user.inviteCode,
        createdAt: user.createdAt
      }
    });
  } catch (error) {
    console.error('获取用户信息失败:', error);
    res.status(500).json({
      code: -1,
      message: '获取用户信息失败',
      data: null
    });
  }
});

/**
 * @route PUT /api/user/info
 * @desc 更新用户信息 - 更新昵称、头像等
 */
router.put('/info', auth, async (req, res) => {
  try {
    const { nickname, avatar, gender } = req.body;
    const user = req.user;
    
    // 更新用户信息
    if (nickname) user.nickname = nickname;
    if (avatar) user.avatar = avatar;
    if (gender && ['male', 'female', 'unknown'].includes(gender)) user.gender = gender;
    
    await user.save();
    
    res.json({
      code: 0,
      message: '更新成功',
      data: {
        userId: user._id,
        nickname: user.nickname,
        avatar: user.avatar,
        gender: user.gender
      }
    });
  } catch (error) {
    console.error('更新用户信息失败:', error);
    res.status(500).json({
      code: -1,
      message: '更新用户信息失败',
      data: null
    });
  }
});

/**
 * @route POST /api/user/bind-invite
 * @desc 绑定邀请码
 */
router.post('/bind-invite', auth, async (req, res) => {
  try {
    const { inviteCode } = req.body;
    const user = req.user;
    
    // 检查是否已经绑定过
    if (user.invitedBy) {
      return res.status(400).json({
        code: -1,
        message: '您已经绑定过邀请码',
        data: null
      });
    }
    
    // 验证邀请码
    if (!inviteCode) {
      return res.status(400).json({
        code: -1,
        message: '邀请码不能为空',
        data: null
      });
    }
    
    // 查找邀请人
    const inviter = await User.findOne({ inviteCode });
    if (!inviter) {
      return res.status(400).json({
        code: -1,
        message: '无效的邀请码',
        data: null
      });
    }
    
    // 不能自己邀请自己
    if (inviter._id.toString() === user._id.toString()) {
      return res.status(400).json({
        code: -1,
        message: '不能使用自己的邀请码',
        data: null
      });
    }
    
    // 绑定邀请关系
    user.invitedBy = inviter._id;
    await user.save();
    
    // 给邀请人增加积分（可选）
    inviter.points += 100;
    await inviter.save();
    
    res.json({
      code: 0,
      message: '绑定成功',
      data: {}
    });
  } catch (error) {
    console.error('绑定邀请码失败:', error);
    res.status(500).json({
      code: -1,
      message: '绑定邀请码失败',
      data: null
    });
  }
});

/**
 * @route POST /api/user/create-test
 * @desc 创建测试用户（仅用于开发测试）
 */
router.post('/create-test', async (req, res) => {
  try {
    const { count = 5 } = req.body;
    const users = [];

    // 生成随机手机号
    const generatePhone = () => {
      const prefixes = ['139', '138', '137', '136', '135', '134', '159', '158', '157', '188', '187'];
      const prefix = prefixes[Math.floor(Math.random() * prefixes.length)];
      const suffix = Math.floor(Math.random() * 90000000) + 10000000;
      return `${prefix}${suffix}`;
    };

    // 生成随机昵称
    const generateNickname = (index) => {
      const nicknames = ['张三', '李四', '王五', '赵六', '钱七', '孙八', '周九', '吴十', 
        '郑十一', '王小明', '李小红', '张小花', '刘大力', '陈晓', '林一一'];
      return nicknames[index % nicknames.length] + Math.floor(Math.random() * 1000);
    };

    // 生成随机头像
    const generateAvatar = () => {
      return `https://api.dicebear.com/7.x/personas/svg?seed=${Math.random()}`;
    };

    // 批量创建用户
    for (let i = 0; i < count; i++) {
      const phoneNumber = generatePhone();
      
      // 检查手机号是否已存在
      const existingUser = await User.findOne({ phone: phoneNumber });
      if (existingUser) {
        continue;
      }
      
      const user = new User({
        phone: phoneNumber,
        nickname: generateNickname(i),
        avatar: generateAvatar(),
        gender: ['male', 'female', 'unknown'][Math.floor(Math.random() * 3)],
        balance: Math.floor(Math.random() * 1000),
        points: Math.floor(Math.random() * 500),
        isVip: Math.random() > 0.7,
        inviteCode: `INV${Math.random().toString(36).substring(2, 8).toUpperCase()}`,
        lastLoginAt: new Date()
      });
      
      await user.save();
      users.push({
        id: user._id,
        phone: user.phone,
        nickname: user.nickname,
        balance: user.balance,
        isVip: user.isVip
      });
    }

    res.json({
      code: 0,
      message: '测试用户创建成功',
      data: { count: users.length, users }
    });
  } catch (error) {
    console.error('创建测试用户失败:', error);
    res.status(500).json({
      code: -1,
      message: '创建测试用户失败',
      data: null
    });
  }
});

module.exports = router; 