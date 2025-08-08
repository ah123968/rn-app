var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var cors = require('cors');
var mongoose = require('mongoose');

// 路由导入
var indexRouter = require('./routes/index');
var usersRouter = require('./routes/users');
var userApiRouter = require('./routes/api/user');
var storeApiRouter = require('./routes/api/store');
var servicesApiRouter = require('./routes/api/services');
var orderApiRouter = require('./routes/api/order');
var storeAdminApiRouter = require('./routes/api/store-admin');

// 未实现的路由模块，临时创建
const router = express.Router();
router.all('*', (req, res) => {
  res.json({
    code: 0,
    message: '接口开发中',
    data: null
  });
});
var couponApiRouter = router;
var memberCardApiRouter = router;
var addressApiRouter = router;
var invoiceApiRouter = router;
var afterSaleApiRouter = router;
var inviteApiRouter = router;

var app = express();

// 连接MongoDB数据库
mongoose.connect('mongodb+srv://c502121895:hm2Pyf8TM4di7G7S@cluster0.u3c9jsm.mongodb.net/laundry')
  .then(() => {
    console.log('数据库连接成功');
  })
  .catch(err => {
    console.error('数据库连接失败:', err);
  });
  
// 配置跨域
app.use(cors());

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'jade');

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

// 基础路由
app.use('/', indexRouter);
app.use('/users', usersRouter);

// API 路由
app.use('/api/user', userApiRouter);
app.use('/api/store', storeApiRouter);
app.use('/api/services', servicesApiRouter);
app.use('/api/order', orderApiRouter);
app.use('/api/coupon', couponApiRouter);
app.use('/api/member-card', memberCardApiRouter);
app.use('/api/address', addressApiRouter);
app.use('/api/invoice', invoiceApiRouter);
app.use('/api/after-sale', afterSaleApiRouter);
app.use('/api/invite', inviteApiRouter);
app.use('/api/store-admin', storeAdminApiRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('error');
});

module.exports = app;
