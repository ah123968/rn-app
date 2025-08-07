var express = require('express');
var router = express.Router();
const Store = require('../../models/store');

/**
 * @route GET /api/store/list
 * @desc 获取附近门店列表
 */
router.get('/list', async (req, res) => {
  try {
    // 获取查询参数
    const { latitude, longitude, page = 1, limit = 10 } = req.query;
    const pageNumber = parseInt(page);
    const limitNumber = parseInt(limit);
    
    let query = {};
    let stores = [];
    
    // 如果提供了经纬度，则按距离排序
    if (latitude && longitude) {
      // 使用MongoDB地理空间查询
      stores = await Store.find({
        location: {
          $near: {
            $geometry: {
              type: 'Point',
              coordinates: [parseFloat(longitude), parseFloat(latitude)]
            },
            $maxDistance: 50000 // 50km范围内
          }
        },
        status: 'open' // 只查询营业中的门店
      })
      .skip((pageNumber - 1) * limitNumber)
      .limit(limitNumber);
      
      // 为每个门店计算距离
      stores = stores.map(store => {
        const storeData = store.toObject();
        // 简单的距离计算，实际项目中可能需要更准确的计算方法
        const distance = calculateDistance(
          parseFloat(latitude),
          parseFloat(longitude),
          store.location.coordinates[1],
          store.location.coordinates[0]
        );
        
        return {
          ...storeData,
          distance: distance.toFixed(1) + 'km'
        };
      });
    } else {
      // 如果没有提供经纬度，则返回所有营业中的门店
      stores = await Store.find({ status: 'open' })
        .skip((pageNumber - 1) * limitNumber)
        .limit(limitNumber);
        
      // 不计算距离
      stores = stores.map(store => store.toObject());
    }
    
    // 获取总门店数量
    const total = await Store.countDocuments({ status: 'open' });
    
    res.json({
      code: 0,
      message: '获取成功',
      data: {
        stores,
        pagination: {
          page: pageNumber,
          limit: limitNumber,
          total
        }
      }
    });
  } catch (error) {
    console.error('获取门店列表失败:', error);
    res.status(500).json({
      code: -1,
      message: '获取门店列表失败',
      data: null
    });
  }
});

/**
 * @route GET /api/store/:id
 * @desc 获取门店详细信息
 */
router.get('/:id', async (req, res) => {
  try {
    const storeId = req.params.id;
    
    // 查询门店信息
    const store = await Store.findById(storeId);
    
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
      data: store
    });
  } catch (error) {
    console.error('获取门店详情失败:', error);
    res.status(500).json({
      code: -1,
      message: '获取门店详情失败',
      data: null
    });
  }
});

/**
 * 计算两点之间的距离 (使用 Haversine 公式)
 * @param {number} lat1 第一点的纬度
 * @param {number} lon1 第一点的经度
 * @param {number} lat2 第二点的纬度
 * @param {number} lon2 第二点的经度
 * @returns {number} 两点之间的距离 (千米)
 */
function calculateDistance(lat1, lon1, lat2, lon2) {
  const R = 6371; // 地球半径 (千米)
  const dLat = deg2rad(lat2 - lat1);
  const dLon = deg2rad(lon2 - lon1);
  
  const a = 
    Math.sin(dLat/2) * Math.sin(dLat/2) +
    Math.cos(deg2rad(lat1)) * Math.cos(deg2rad(lat2)) * 
    Math.sin(dLon/2) * Math.sin(dLon/2);
    
  const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1-a));
  const distance = R * c; // 距离 (千米)
  
  return distance;
}

function deg2rad(deg) {
  return deg * (Math.PI/180);
}

module.exports = router; 