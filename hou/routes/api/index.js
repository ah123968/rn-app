/**
 * API路由索引文件
 * 集中导出所有API路由模块
 */

const userRouter = require('./user');
const storeRouter = require('./store');
const servicesRouter = require('./services');
const orderRouter = require('./order');
// 未实现的路由模块预留
/*
const couponRouter = require('./coupon');
const memberCardRouter = require('./member-card');
const addressRouter = require('./address');
const invoiceRouter = require('./invoice');
const afterSaleRouter = require('./after-sale');
const inviteRouter = require('./invite');
const storeAdminRouter = require('./store-admin');
*/

module.exports = {
  userRouter,
  storeRouter,
  servicesRouter,
  orderRouter
}; 