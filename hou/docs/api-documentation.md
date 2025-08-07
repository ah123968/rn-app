# 干洗洗衣洗护门店系统 - 后端API文档

## 目录

- [概述](#概述)
- [基础配置](#基础配置)
- [数据库模型](#数据库模型)
- [认证机制](#认证机制)
- [API接口](#api接口)
  - [用户相关](#用户相关)
  - [门店相关](#门店相关)
  - [服务项目](#服务项目)
  - [订单管理](#订单管理)
  - [商家管理](#商家管理)

## 概述

本文档描述了干洗洗衣洗护门店系统的后端API接口。系统使用Express.js框架开发，MongoDB作为数据库，提供RESTful API接口。

## 基础配置

- **服务器环境**：Node.js
- **框架**：Express.js
- **数据库**：MongoDB (MongoDB Atlas)
- **认证方式**：JWT (JSON Web Token)

## 数据库模型

### 用户模型 (User)

```javascript
{
  phone: String,          // 手机号，唯一
  nickname: String,       // 昵称
  avatar: String,         // 头像URL
  gender: String,         // 性别：male/female/unknown
  balance: Number,        // 账户余额
  points: Number,         // 积分
  isVip: Boolean,         // 是否VIP
  inviteCode: String,     // 邀请码
  invitedBy: ObjectId,    // 邀请人ID
  lastLoginAt: Date,      // 最后登录时间
  createdAt: Date,        // 创建时间
  updatedAt: Date         // 更新时间
}
```

### 门店模型 (Store)

```javascript
{
  name: String,           // 门店名称
  address: String,        // 门店地址
  location: {             // 地理位置
    type: String,         // Point类型
    coordinates: [Number] // [经度, 纬度]
  },
  phone: String,          // 联系电话
  businessHours: String,  // 营业时间
  images: [String],       // 门店图片
  services: [String],     // 提供服务
  introduction: String,   // 门店介绍
  status: String,         // 营业状态：open/closed/maintenance
  createdAt: Date,        // 创建时间
  updatedAt: Date         // 更新时间
}
```

### 服务模型 (Service)

```javascript
{
  name: String,           // 服务名称
  icon: String,           // 图标URL
  description: String,    // 描述
  categories: [{          // 分类
    name: String,         // 分类名
    items: [{             // 服务项目
      name: String,       // 项目名称
      price: Number,      // 价格
      unit: String,       // 单位
      description: String,// 描述
      image: String       // 图片URL
    }]
  }],
  isActive: Boolean,      // 是否启用
  createdAt: Date,        // 创建时间
  updatedAt: Date         // 更新时间
}
```

### 订单模型 (Order)

```javascript
{
  user: ObjectId,         // 用户ID
  store: ObjectId,        // 门店ID
  orderNo: String,        // 订单号
  pickupCode: String,     // 取件码
  items: [{               // 订单项目
    serviceId: ObjectId,  // 服务ID
    serviceItemId: String,// 服务项目ID
    name: String,         // 名称
    price: Number,        // 单价
    quantity: Number,     // 数量
    unit: String,         // 单位
    totalPrice: Number    // 总价
  }],
  status: String,         // 状态：pending/paid/processing/ready/completed/cancelled
  paymentMethod: String,  // 支付方式：wechat/alipay/memberCard/cash
  paymentId: String,      // 支付ID
  payTime: Date,          // 支付时间
  subTotal: Number,       // 小计
  deliveryFee: Number,    // 配送费
  discount: Number,       // 折扣
  totalPrice: Number,     // 总价
  address: ObjectId,      // 地址ID
  remark: String,         // 备注
  estimateCompleteTime: Date, // 预计完成时间
  completedTime: Date,    // 完成时间
  cancelReason: String,   // 取消原因
  usedCoupon: ObjectId,   // 使用的优惠券
  createdAt: Date,        // 创建时间
  updatedAt: Date         // 更新时间
}
```

### 商家管理员模型 (StoreAdmin)

```javascript
{
  username: String,       // 用户名
  password: String,       // 密码(加密)
  name: String,           // 姓名
  phone: String,          // 联系电话
  role: String,           // 角色：admin/manager/staff
  store: ObjectId,        // 所属门店
  avatar: String,         // 头像URL
  isActive: Boolean,      // 是否激活
  lastLoginAt: Date,      // 最后登录时间
  createdAt: Date,        // 创建时间
  updatedAt: Date         // 更新时间
}
```

## 认证机制

系统使用JWT(JSON Web Token)进行认证，包括两种认证方式：

### 1. 用户认证

- 客户端通过登录接口获取token
- 后续请求需在头部携带token: `Authorization: Bearer <token>`

### 2. 商家认证

- 商家管理员通过登录接口获取专用token
- 后续请求需在头部携带token: `Authorization: Bearer <token>`
- 根据角色不同，权限控制不同

## API接口

### 用户相关

#### 发送验证码

- **接口**：`POST /api/user/send-code`
- **参数**：
  ```json
  {
    "phone": "13800138000"
  }
  ```
- **响应**：
  ```json
  {
    "code": 0,
    "message": "验证码发送成功",
    "data": {
      "code": "123456" // 测试环境返回验证码
    }
  }
  ```

#### 用户注册

- **接口**：`POST /api/user/register`
- **参数**：
  ```json
  {
    "phone": "13800138000",
    "code": "123456"
  }
  ```
- **响应**：
  ```json
  {
    "code": 0,
    "message": "注册成功",
    "data": {
      "userId": "60d5ec9f1c9d4400001234",
      "token": "eyJhbGciOiJIUz...",
      "nickname": "用户8000",
      "avatar": ""
    }
  }
  ```

#### 用户登录

- **接口**：`POST /api/user/login`
- **参数**：
  ```json
  {
    "phone": "13800138000",
    "code": "123456"
  }
  ```
- **响应**：
  ```json
  {
    "code": 0,
    "message": "登录成功",
    "data": {
      "userId": "60d5ec9f1c9d4400001234",
      "token": "eyJhbGciOiJIUz...",
      "nickname": "用户8000",
      "avatar": ""
    }
  }
  ```

#### 获取用户信息

- **接口**：`GET /api/user/info`
- **请求头**：`Authorization: Bearer <token>`
- **响应**：
  ```json
  {
    "code": 0,
    "message": "获取成功",
    "data": {
      "userId": "60d5ec9f1c9d4400001234",
      "phone": "13800138000",
      "nickname": "用户8000",
      "avatar": "",
      "gender": "unknown",
      "balance": 0,
      "points": 0,
      "isVip": false,
      "inviteCode": "ABC123",
      "createdAt": "2023-11-01T08:00:00Z"
    }
  }
  ```

#### 更新用户信息

- **接口**：`PUT /api/user/info`
- **请求头**：`Authorization: Bearer <token>`
- **参数**：
  ```json
  {
    "nickname": "新昵称",
    "avatar": "https://example.com/avatar.jpg",
    "gender": "male"
  }
  ```
- **响应**：
  ```json
  {
    "code": 0,
    "message": "更新成功",
    "data": {
      "userId": "60d5ec9f1c9d4400001234",
      "nickname": "新昵称",
      "avatar": "https://example.com/avatar.jpg",
      "gender": "male"
    }
  }
  ```

#### 绑定邀请码

- **接口**：`POST /api/user/bind-invite`
- **请求头**：`Authorization: Bearer <token>`
- **参数**：
  ```json
  {
    "inviteCode": "ABC123"
  }
  ```
- **响应**：
  ```json
  {
    "code": 0,
    "message": "绑定成功",
    "data": {}
  }
  ```

### 门店相关

#### 获取门店列表

- **接口**：`GET /api/store/list`
- **参数**：
  - `latitude`: 纬度(可选)
  - `longitude`: 经度(可选)
  - `page`: 页码，默认1
  - `limit`: 每页数量，默认10
- **响应**：
  ```json
  {
    "code": 0,
    "message": "获取成功",
    "data": {
      "stores": [
        {
          "_id": "60d5ec9f1c9d4400005678",
          "name": "洁净干洗店（东城店）",
          "address": "北京市东城区东直门南大街5号",
          "phone": "010-12345678",
          "businessHours": "09:00-21:00",
          "distance": "1.2km"
        }
      ],
      "pagination": {
        "page": 1,
        "pageSize": 10,
        "total": 1
      }
    }
  }
  ```

#### 获取门店详情

- **接口**：`GET /api/store/:id`
- **响应**：
  ```json
  {
    "code": 0,
    "message": "获取成功",
    "data": {
      "_id": "60d5ec9f1c9d4400005678",
      "name": "洁净干洗店（东城店）",
      "address": "北京市东城区东直门南大街5号",
      "phone": "010-12345678",
      "businessHours": "09:00-21:00",
      "images": ["https://example.com/store1.jpg"],
      "services": ["干洗", "水洗", "熨烫", "皮具护理"],
      "introduction": "洁净干洗店成立于2010年，专注高品质洗护服务。",
      "location": {
        "type": "Point",
        "coordinates": [116.4074, 39.9042]
      }
    }
  }
  ```

### 服务项目

#### 获取服务列表

- **接口**：`GET /api/services`
- **响应**：
  ```json
  {
    "code": 0,
    "message": "获取成功",
    "data": {
      "services": [
        {
          "id": "1001",
          "name": "干洗",
          "icon": "https://example.com/icons/dry-cleaning.png",
          "categories": [
            {
              "id": "101",
              "name": "上衣",
              "items": [
                {
                  "id": "10101",
                  "name": "西装上衣",
                  "price": 35.00,
                  "unit": "件"
                }
              ]
            }
          ]
        }
      ]
    }
  }
  ```

#### 初始化服务数据（开发测试用）

- **接口**：`POST /api/services/init`
- **响应**：
  ```json
  {
    "code": 0,
    "message": "服务数据初始化成功",
    "data": {
      "count": 3
    }
  }
  ```

### 订单管理

#### 计算订单价格

- **接口**：`POST /api/order/calc`
- **请求头**：`Authorization: Bearer <token>`
- **参数**：
  ```json
  {
    "items": [
      {
        "serviceItemId": "10101",
        "quantity": 2
      },
      {
        "serviceItemId": "10201",
        "quantity": 1
      }
    ],
    "storeId": "60d5ec9f1c9d4400005678",
    "deliveryType": "self"
  }
  ```
- **响应**：
  ```json
  {
    "code": 0,
    "message": "计算成功",
    "data": {
      "items": [
        {
          "serviceItemId": "10101",
          "name": "西装上衣",
          "price": 35.00,
          "quantity": 2,
          "unit": "件",
          "totalPrice": 70.00
        },
        {
          "serviceItemId": "10201",
          "name": "西裤",
          "price": 25.00,
          "quantity": 1,
          "unit": "条",
          "totalPrice": 25.00
        }
      ],
      "subTotal": 95.00,
      "deliveryFee": 0.00,
      "discount": 0.00,
      "totalPrice": 95.00
    }
  }
  ```

#### 创建订单

- **接口**：`POST /api/order/create`
- **请求头**：`Authorization: Bearer <token>`
- **参数**：
  ```json
  {
    "storeId": "60d5ec9f1c9d4400005678",
    "items": [
      {
        "serviceItemId": "10101",
        "name": "西装上衣",
        "price": 35.00,
        "quantity": 2,
        "unit": "件"
      },
      {
        "serviceItemId": "10201",
        "name": "西裤",
        "price": 25.00,
        "quantity": 1,
        "unit": "条"
      }
    ],
    "addressId": null,
    "remark": "轻柔处理",
    "deliveryType": "self"
  }
  ```
- **响应**：
  ```json
  {
    "code": 0,
    "message": "订单创建成功",
    "data": {
      "orderId": "60d5ec9f1c9d4400009876",
      "orderNo": "O202311013456",
      "totalPrice": 95.00,
      "orderTime": "2023-11-01T14:30:00Z",
      "pickupCode": "AB1234"
    }
  }
  ```

#### 发起支付

- **接口**：`POST /api/order/pay`
- **请求头**：`Authorization: Bearer <token>`
- **参数**：
  ```json
  {
    "orderId": "60d5ec9f1c9d4400009876",
    "paymentMethod": "wechat"
  }
  ```
- **响应**：
  ```json
  {
    "code": 0,
    "message": "支付请求发起成功",
    "data": {
      "paymentId": "P202311010001",
      "orderId": "60d5ec9f1c9d4400009876",
      "orderNo": "O202311013456",
      "amount": 95.00,
      "paymentUrl": "https://example.com/pay/P202311010001"
    }
  }
  ```

#### 更新订单状态

- **接口**：`PUT /api/order/status`
- **请求头**：`Authorization: Bearer <token>`
- **参数**：
  ```json
  {
    "orderId": "60d5ec9f1c9d4400009876",
    "status": "cancelled"
  }
  ```
- **响应**：
  ```json
  {
    "code": 0,
    "message": "状态更新成功",
    "data": {
      "orderId": "60d5ec9f1c9d4400009876",
      "orderNo": "O202311013456",
      "status": "cancelled",
      "updateTime": "2023-11-01T15:00:00Z"
    }
  }
  ```

#### 获取订单列表

- **接口**：`GET /api/order/list`
- **请求头**：`Authorization: Bearer <token>`
- **参数**：
  - `status`: 订单状态(可选)
  - `page`: 页码，默认1
  - `limit`: 每页数量，默认10
- **响应**：
  ```json
  {
    "code": 0,
    "message": "获取成功",
    "data": {
      "orders": [
        {
          "orderId": "60d5ec9f1c9d4400009876",
          "orderNo": "O202311013456",
          "storeName": "洁净干洗店（东城店）",
          "status": "pending",
          "totalPrice": 95.00,
          "createTime": "2023-11-01T14:30:00Z",
          "items": [
            {
              "name": "西装上衣",
              "quantity": 2
            },
            {
              "name": "西裤",
              "quantity": 1
            }
          ]
        }
      ],
      "pagination": {
        "page": 1,
        "pageSize": 10,
        "total": 1
      }
    }
  }
  ```

#### 获取订单详情

- **接口**：`GET /api/order/:id`
- **请求头**：`Authorization: Bearer <token>`
- **响应**：
  ```json
  {
    "code": 0,
    "message": "获取成功",
    "data": {
      "orderId": "60d5ec9f1c9d4400009876",
      "orderNo": "O202311013456",
      "storeName": "洁净干洗店（东城店）",
      "storeAddress": "北京市东城区东直门南大街5号",
      "storePhone": "010-12345678",
      "status": "pending",
      "pickupCode": "AB1234",
      "createTime": "2023-11-01T14:30:00Z",
      "payTime": null,
      "estimateCompleteTime": null,
      "items": [
        {
          "name": "西装上衣",
          "price": 35.00,
          "quantity": 2,
          "totalPrice": 70.00
        },
        {
          "name": "西裤",
          "price": 25.00,
          "quantity": 1,
          "totalPrice": 25.00
        }
      ],
      "subTotal": 95.00,
      "deliveryFee": 0.00,
      "discount": 0.00,
      "totalPrice": 95.00,
      "paymentMethod": "",
      "remark": "轻柔处理"
    }
  }
  ```

#### 凭码查询订单

- **接口**：`GET /api/order/by-code`
- **参数**：
  - `code`: 取件码
- **响应**：
  ```json
  {
    "code": 0,
    "message": "查询成功",
    "data": {
      "orderId": "60d5ec9f1c9d4400009876",
      "orderNo": "O202311013456",
      "storeName": "洁净干洗店（东城店）",
      "status": "ready",
      "createTime": "2023-11-01T14:30:00Z",
      "items": [
        {
          "name": "西装上衣",
          "quantity": 2
        },
        {
          "name": "西裤",
          "quantity": 1
        }
      ],
      "totalPrice": 95.00
    }
  }
  ```

#### 确认取件

- **接口**：`POST /api/order/confirm-pickup`
- **请求头**：`Authorization: Bearer <token>`
- **参数**：
  ```json
  {
    "orderId": "60d5ec9f1c9d4400009876"
  }
  ```
- **响应**：
  ```json
  {
    "code": 0,
    "message": "取件成功",
    "data": {
      "orderId": "60d5ec9f1c9d4400009876",
      "orderNo": "O202311013456",
      "pickupTime": "2023-11-05T10:00:00Z"
    }
  }
  ```

### 商家管理

#### 商家登录

- **接口**：`POST /api/store-admin/login`
- **参数**：
  ```json
  {
    "username": "admin",
    "password": "admin123"
  }
  ```
- **响应**：
  ```json
  {
    "code": 0,
    "message": "登录成功",
    "data": {
      "token": "eyJhbGciOiJIUz...",
      "adminId": "60d5ec9f1c9d4400000123",
      "name": "管理员",
      "role": "admin",
      "avatar": "",
      "store": {
        "id": "60d5ec9f1c9d4400005678",
        "name": "洁净干洗店（总店）",
        "address": "北京市东城区东直门南大街5号"
      }
    }
  }
  ```

#### 获取商家信息

- **接口**：`GET /api/store-admin/info`
- **请求头**：`Authorization: Bearer <token>`
- **响应**：
  ```json
  {
    "code": 0,
    "message": "获取成功",
    "data": {
      "adminId": "60d5ec9f1c9d4400000123",
      "username": "admin",
      "name": "管理员",
      "phone": "13800138000",
      "role": "admin",
      "avatar": "",
      "store": {
        "id": "60d5ec9f1c9d4400005678",
        "name": "洁净干洗店（总店）",
        "address": "北京市东城区东直门南大街5号",
        "phone": "010-12345678",
        "businessHours": "09:00-21:00"
      }
    }
  }
  ```

#### 商家获取订单列表

- **接口**：`GET /api/store-admin/orders`
- **请求头**：`Authorization: Bearer <token>`
- **参数**：
  - `status`: 订单状态(可选)
  - `page`: 页码，默认1
  - `limit`: 每页数量，默认10
- **响应**：
  ```json
  {
    "code": 0,
    "message": "获取成功",
    "data": {
      "orders": [
        {
          "orderId": "60d5ec9f1c9d4400009876",
          "orderNo": "O202311013456",
          "status": "paid",
          "pickupCode": "AB1234",
          "totalPrice": 95.00,
          "createTime": "2023-11-01T14:30:00Z",
          "items": [
            {
              "name": "西装上衣",
              "quantity": 2,
              "price": 35.00
            },
            {
              "name": "西裤",
              "quantity": 1,
              "price": 25.00
            }
          ],
          "user": {
            "nickname": "用户8000",
            "phone": "13800138000"
          },
          "address": null,
          "remark": "轻柔处理"
        }
      ],
      "pagination": {
        "page": 1,
        "pageSize": 10,
        "total": 1
      }
    }
  }
  ```

#### 商家修改订单状态

- **接口**：`PUT /api/store-admin/order/:id/status`
- **请求头**：`Authorization: Bearer <token>`
- **参数**：
  ```json
  {
    "status": "processing"
  }
  ```
- **响应**：
  ```json
  {
    "code": 0,
    "message": "状态更新成功",
    "data": {
      "orderId": "60d5ec9f1c9d4400009876",
      "orderNo": "O202311013456",
      "status": "processing",
      "updateTime": "2023-11-01T16:00:00Z"
    }
  }
  ```

#### 商家凭码取件

- **接口**：`POST /api/store-admin/order/take`
- **请求头**：`Authorization: Bearer <token>`
- **参数**：
  ```json
  {
    "pickupCode": "AB1234"
  }
  ```
- **响应**：
  ```json
  {
    "code": 0,
    "message": "取件成功，订单状态已更新为处理中",
    "data": {
      "orderId": "60d5ec9f1c9d4400009876",
      "orderNo": "O202311013456",
      "status": "processing",
      "user": {
        "nickname": "用户8000",
        "phone": "13800138000"
      },
      "items": [
        {
          "name": "西装上衣",
          "quantity": 2
        },
        {
          "name": "西裤",
          "quantity": 1
        }
      ]
    }
  }
  ```

#### 初始化商家账号（开发测试用）

- **接口**：`POST /api/store-admin/init`
- **响应**：
  ```json
  {
    "code": 0,
    "message": "管理员账号初始化成功",
    "data": {
      "username": "admin",
      "password": "admin123",
      "storeName": "洁净干洗店（总店）"
    }
  }
  ``` 