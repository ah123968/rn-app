var express = require('express');
var router = express.Router();
const Service = require('../../models/service');
const { auth } = require('../../middleware/auth');

/**
 * @route GET /api/services
 * @desc 获取洗衣服务类型列表
 */
router.get('/', async (req, res) => {
  try {
    // 从查询参数中获取门店ID（可选）
    const { storeId } = req.query;
    
    // 查询条件
    const query = { isActive: true };
    
    // 如果指定了门店ID，可以查询该门店特有的服务（这里假设服务是全局的，暂不按门店过滤）
    
    // 获取所有活跃的服务类型
    const services = await Service.find(query);
    
    if (services.length === 0) {
      // 如果数据库中没有服务数据，返回默认数据
      return res.json({
        code: 0,
        message: '获取成功',
        data: {
          services: [
            {
              id: '1001',
              name: '干洗',
              icon: 'https://example.com/icons/dry-cleaning.png',
              categories: [
                {
                  id: '101',
                  name: '上衣',
                  items: [
                    { id: '10101', name: '西装上衣', price: 35.00, unit: '件' },
                    { id: '10102', name: '夹克', price: 30.00, unit: '件' },
                    { id: '10103', name: '羽绒服', price: 50.00, unit: '件' }
                  ]
                },
                {
                  id: '102',
                  name: '裤装',
                  items: [
                    { id: '10201', name: '西裤', price: 25.00, unit: '条' },
                    { id: '10202', name: '牛仔裤', price: 28.00, unit: '条' }
                  ]
                }
              ]
            },
            {
              id: '1002',
              name: '水洗',
              icon: 'https://example.com/icons/water-washing.png',
              categories: [
                {
                  id: '201',
                  name: '家居服',
                  items: [
                    { id: '20101', name: 'T恤', price: 15.00, unit: '件' },
                    { id: '20102', name: '睡衣', price: 20.00, unit: '套' }
                  ]
                },
                {
                  id: '202',
                  name: '床品',
                  items: [
                    { id: '20201', name: '床单', price: 30.00, unit: '件' },
                    { id: '20202', name: '被套', price: 45.00, unit: '件' }
                  ]
                }
              ]
            },
            {
              id: '1003',
              name: '皮具护理',
              icon: 'https://example.com/icons/leather-care.png',
              categories: [
                {
                  id: '301',
                  name: '皮包',
                  items: [
                    { id: '30101', name: '小型皮包', price: 150.00, unit: '个' },
                    { id: '30102', name: '大型皮包', price: 300.00, unit: '个' }
                  ]
                },
                {
                  id: '302',
                  name: '皮衣',
                  items: [
                    { id: '30201', name: '皮夹克', price: 350.00, unit: '件' },
                    { id: '30202', name: '皮裤', price: 300.00, unit: '条' }
                  ]
                }
              ]
            }
          ]
        }
      });
    }
    
    res.json({
      code: 0,
      message: '获取成功',
      data: {
        services
      }
    });
  } catch (error) {
    console.error('获取服务列表失败:', error);
    res.status(500).json({
      code: -1,
      message: '获取服务列表失败',
      data: null
    });
  }
});

/**
 * @route GET /api/services/:id
 * @desc 获取指定服务类型的详情
 */
router.get('/:id', async (req, res) => {
  try {
    const serviceId = req.params.id;
    
    // 查询服务详情
    const service = await Service.findById(serviceId);
    
    if (!service) {
      return res.status(404).json({
        code: -1,
        message: '服务不存在',
        data: null
      });
    }
    
    res.json({
      code: 0,
      message: '获取成功',
      data: service
    });
  } catch (error) {
    console.error('获取服务详情失败:', error);
    res.status(500).json({
      code: -1,
      message: '获取服务详情失败',
      data: null
    });
  }
});

/**
 * @route POST /api/services/init
 * @desc 初始化服务数据（仅用于开发测试）
 */
router.post('/init', async (req, res) => {
  try {
    // 检查是否已存在服务数据
    const count = await Service.countDocuments();
    if (count > 0) {
      return res.json({
        code: -1,
        message: '服务数据已存在',
        data: { count }
      });
    }
    
    // 初始化默认服务数据
    const defaultServices = [
      {
        name: '干洗',
        icon: 'https://example.com/icons/dry-cleaning.png',
        description: '专业干洗服务',
        categories: [
          {
            name: '上衣',
            items: [
              { name: '西装上衣', price: 35.00, unit: '件' },
              { name: '夹克', price: 30.00, unit: '件' },
              { name: '羽绒服', price: 50.00, unit: '件' }
            ]
          },
          {
            name: '裤装',
            items: [
              { name: '西裤', price: 25.00, unit: '条' },
              { name: '牛仔裤', price: 28.00, unit: '条' }
            ]
          }
        ]
      },
      {
        name: '水洗',
        icon: 'https://example.com/icons/water-washing.png',
        description: '普通水洗服务',
        categories: [
          {
            name: '家居服',
            items: [
              { name: 'T恤', price: 15.00, unit: '件' },
              { name: '睡衣', price: 20.00, unit: '套' }
            ]
          },
          {
            name: '床品',
            items: [
              { name: '床单', price: 30.00, unit: '件' },
              { name: '被套', price: 45.00, unit: '件' }
            ]
          }
        ]
      },
      {
        name: '皮具护理',
        icon: 'https://example.com/icons/leather-care.png',
        description: '专业皮具护理服务',
        categories: [
          {
            name: '皮包',
            items: [
              { name: '小型皮包', price: 150.00, unit: '个' },
              { name: '大型皮包', price: 300.00, unit: '个' }
            ]
          },
          {
            name: '皮衣',
            items: [
              { name: '皮夹克', price: 350.00, unit: '件' },
              { name: '皮裤', price: 300.00, unit: '条' }
            ]
          }
        ]
      }
    ];
    
    // 创建服务
    await Service.insertMany(defaultServices);
    
    res.json({
      code: 0,
      message: '服务数据初始化成功',
      data: { count: defaultServices.length }
    });
  } catch (error) {
    console.error('初始化服务数据失败:', error);
    res.status(500).json({
      code: -1,
      message: '初始化服务数据失败',
      data: null
    });
  }
});

module.exports = router; 