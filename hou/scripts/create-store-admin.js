const mongoose = require('mongoose');
const StoreAdmin = require('../models/storeAdmin');
const Store = require('../models/store');

// 连接数据库
mongoose.connect('mongodb+srv://c502121895:hm2Pyf8TM4di7G7S@cluster0.u3c9jsm.mongodb.net/laundry')
  .then(async () => {
    console.log('数据库连接成功');

    try {
      // 查询第一个门店
      const store = await Store.findOne();

      if (!store) {
        console.error('未找到门店，请先创建门店');
        process.exit(1);
      }

      // 创建测试商户账号
      const newAdmin = new StoreAdmin({
        username: 'store1',
        password: '123456',  // 实际环境中应使用更复杂密码
        name: '测试商户1',
        phone: '13900001111',
        role: 'manager',
        store: store._id,
        isActive: true
      });

      await newAdmin.save();
      
      console.log('测试商户创建成功！');
      console.log('登录信息:');
      console.log('用户名: store1');
      console.log('密码: 123456');
      console.log('门店ID:', store._id);
      console.log('门店名称:', store.name);

      process.exit(0);
    } catch (error) {
      console.error('创建商户失败:', error);
      process.exit(1);
    }
  })
  .catch(err => {
    console.error('数据库连接失败:', err);
    process.exit(1);
  }); 