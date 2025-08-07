# 干洗洗衣洗护门店系统

## 项目概述

本系统是一个干洗洗衣洗护门店管理系统的后端服务，提供包括用户管理、门店管理、订单处理、服务项目管理等功能的RESTful API接口。

## 技术栈

- **运行环境**: Node.js
- **Web框架**: Express.js
- **数据库**: MongoDB (MongoDB Atlas)
- **认证**: JWT (JSON Web Token)
- **包管理**: npm

## 项目结构

```
├── bin/                    # 程序启动脚本
├── docs/                   # 项目文档
│   ├── api-documentation.md # API文档
│   └── readme.md           # 项目概述
├── middleware/             # 中间件
│   └── auth.js             # 认证中间件
├── models/                 # 数据模型
│   ├── user.js             # 用户模型
│   ├── store.js            # 门店模型
│   ├── service.js          # 服务项目模型
│   ├── order.js            # 订单模型
│   └── storeAdmin.js       # 商家管理员模型
├── public/                 # 静态资源
├── routes/                 # 路由
│   ├── api/                # API路由
│   │   ├── user.js         # 用户相关路由
│   │   ├── store.js        # 门店相关路由
│   │   ├── services.js     # 服务项目路由
│   │   ├── order.js        # 订单相关路由
│   │   └── store-admin.js  # 商家管理路由
│   ├── index.js            # 主路由
│   └── users.js            # 基础用户路由
├── scripts/                # 实用脚本
│   └── create-store-admin.js # 创建商户账号脚本
├── views/                  # 视图模板
├── app.js                  # 应用入口
├── package.json            # 项目依赖
└── README.md               # 项目说明
```

## 安装与运行

### 环境要求

- Node.js >= 12.x
- npm >= 6.x
- MongoDB (本地或MongoDB Atlas)

### 安装步骤

1. 克隆仓库

```bash
git clone https://github.com/your-username/laundry-service.git
cd laundry-service
```

2. 安装依赖

```bash
npm install
```

3. 配置环境变量（可选）

创建 `.env` 文件并添加以下内容：

```
MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/laundry
JWT_SECRET=your_jwt_secret
PORT=3000
```

4. 启动服务

```bash
# 开发模式
npm run dev

# 生产模式
npm start
```

## 初始化数据

为了方便测试，系统提供了初始化脚本：

1. 初始化商家管理员账号

```bash
# 通过API
curl -X POST http://localhost:3000/api/store-admin/init

# 通过脚本
node scripts/create-store-admin.js
```

2. 初始化服务数据

```bash
curl -X POST http://localhost:3000/api/services/init
```

## 开发指南

### 添加新路由

1. 在 `routes/api/` 目录中创建新的路由文件
2. 在 `app.js` 中导入并挂载新的路由

### 添加新模型

1. 在 `models/` 目录中创建新的数据模型
2. 定义模型架构和方法
3. 在需要使用的路由中导入模型

### 开发约定

- 统一响应格式：
  ```json
  {
    "code": 0,           // 0表示成功，非0表示失败
    "message": "消息",   // 提示信息
    "data": {}           // 响应数据
  }
  ```

- 请求认证：
  - 用户接口：请求头携带 `Authorization: Bearer <token>`
  - 商家接口：请求头携带 `Authorization: Bearer <token>`

## API文档

详细API接口文档请参考 [API文档](api-documentation.md)。

## 部署

### Docker部署

1. 构建Docker镜像

```bash
docker build -t laundry-service .
```

2. 运行容器

```bash
docker run -p 3000:3000 -e MONGODB_URI=mongodb+srv://username:password@cluster0.mongodb.net/laundry -e JWT_SECRET=your_jwt_secret laundry-service
```

### 服务器部署

1. 在服务器上安装Node.js和npm
2. 拉取代码并安装依赖
3. 使用PM2等进程管理工具启动服务

```bash
npm install -g pm2
pm2 start ./bin/www --name "laundry-service"
```

## 开发人员

- 开发者：XXX
- 联系方式：xxx@example.com 