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
 * @route POST /api/services
 * @desc 创建新服务
 */
router.post('/', async (req, res) => {
  try {
    const { name, description, serviceType, price, isUrgentAvailable, urgentFee, urgentProcessingTime, isActive } = req.body;
    
    // 验证必填字段
    if (!name || !description) {
      return res.status(400).json({
        code: -1,
        message: '服务名称和描述不能为空',
        data: null
      });
    }
    
    // 创建基本类别和项目
    const categories = [];
    if (serviceType === 'dry' || serviceType === 'wet') {
      categories.push({
        name: serviceType === 'dry' ? '基础干洗' : '基础水洗',
        items: [
          { name: '标准服务', price: price || 0, unit: '件' }
        ]
      });
    } else {
      categories.push({
        name: '基础服务',
        items: [
          { name: '标准服务', price: price || 0, unit: '件' }
        ]
      });
    }
    
    // 创建新服务
    const newService = new Service({
      name,
      description,
      icon: `https://example.com/icons/${serviceType || 'default'}.png`,
      serviceType,
      categories,
      isUrgentAvailable: !!isUrgentAvailable,
      urgentFee,
      urgentProcessingTime,
      isActive: isActive !== undefined ? isActive : true
    });
    
    await newService.save();
    
    res.status(201).json({
      code: 0,
      message: '服务创建成功',
      data: newService
    });
  } catch (error) {
    console.error('创建服务失败:', error);
    res.status(500).json({
      code: -1,
      message: '创建服务失败',
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

/**
 * @route PUT /api/services/:id
 * @desc 更新服务信息
 */
router.put('/:id', async (req, res) => {
  try {
    const serviceId = req.params.id;
    const updateData = req.body;
    
    // 查找并更新服务
    const updatedService = await Service.findByIdAndUpdate(
      serviceId,
      { 
        $set: {
          name: updateData.name,
          description: updateData.description,
          icon: updateData.icon,
          isActive: updateData.isActive !== undefined ? updateData.isActive : true,
          // 其他字段根据需要更新
          updatedAt: Date.now()
        }
      },
      { new: true }
    );
    
    if (!updatedService) {
      return res.status(404).json({
        code: -1,
        message: '服务不存在',
        data: null
      });
    }
    
    res.json({
      code: 0,
      message: '更新成功',
      data: updatedService
    });
  } catch (error) {
    console.error('更新服务失败:', error);
    res.status(500).json({
      code: -1,
      message: '更新服务失败',
      data: null
    });
  }
});

/**
 * @route DELETE /api/services/:id
 * @desc 删除服务
 */
router.delete('/:id', async (req, res) => {
  try {
    const serviceId = req.params.id;
    
    // 查找并删除服务
    const deletedService = await Service.findByIdAndDelete(serviceId);
    
    if (!deletedService) {
      return res.status(404).json({
        code: -1,
        message: '服务不存在',
        data: null
      });
    }
    
    res.json({
      code: 0,
      message: '删除成功',
      data: { id: serviceId }
    });
  } catch (error) {
    console.error('删除服务失败:', error);
    res.status(500).json({
      code: -1,
      message: '删除服务失败',
      data: null
    });
  }
});

module.exports = router; 