# 🔗 CryptoAnchor - 数字货币与实物锚定交易平台

一个基于 Next.js + NestJS 的全栈交易平台，支持使用 USDT 进行数字货币交易，并实现现实物品的锚定交割。

## ✨ 核心特性

- 💰 **USDT 交易** - 使用稳定币交易，避免价格波动风险
- 🔒 **资金托管** - 买家付款后资金被托管，确认收货后自动释放
- 📦 **物品市场** - 发布、浏览、搜索现实物品，支持分类和价格筛选
- ⭐ **信誉系统** - 买卖双方互评，累积信誉分
- 🚚 **物流追踪** - 卖家发货后支持物流单号追踪
- ⏰ **自动确认** - 7天未确认收货自动完成订单
- 💎 **多链充值** - 支持 TRON (TRC-20) 和 BSC (BEP-20) 链上 USDT 充值
- 📊 **行情数据** - 实时价格查询、历史价格、K线数据 (CoinGecko API)
- 💱 **多币种支持** - 支持 USDT、TRX、BNB、ETH 等多种代币
- 👤 **用户系统** - 个人中心、资料编辑、密码修改、公开主页
- 🛡️ **管理后台** - 数据统计、订单管理、用户管理、争议处理
- 🎨 **多主题支持** - 8种配色方案，管理员可在后台切换平台外观

## 🏗️ 技术栈

### 前端
- **Next.js 16** - React 框架 (App Router)
- **TailwindCSS** - 样式系统
- **TypeScript** - 类型安全
- **Axios** - HTTP 客户端
- **Geist** - 字体系统（取代 Inter）
- **多主题系统** - CSS 变量驱动，支持 8 种配色方案

### 后端
- **NestJS** - Node.js 企业级框架
- **Prisma** - ORM 工具
- **PostgreSQL** - 数据库
- **JWT** - 身份认证
- **bcryptjs** - 密码加密
- **TronWeb** - TRON 链交互
- **@nestjs/throttler** - API 限流

### 区块链
- **TRON Network** - TRC-20 USDT/TRX 充值监听
- **BSC Network** - BEP-20 USDT/BNB/ETH 充值监听
- **CoinGecko API** - 行情数据、历史价格
- **TronGrid API** - TRON 链上数据查询
- **BscScan API** - BSC 链上数据查询

### 部署
- **Docker** - 容器化
- **docker-compose** - 一键启动

## 🚀 快速开始

### 前置要求

- Node.js 18+
- PostgreSQL 14+（本地安装或使用云服务）
- npm 或 yarn

> **注意：** 如果你没有安装 Docker，可以直接使用本地 PostgreSQL 或者使用免费的云数据库（如 [Supabase](https://supabase.com/)、[Neon](https://neon.tech/)）。

### 方案一：使用 Docker（推荐）

```bash
# 启动 PostgreSQL 数据库
docker compose up -d
```

### 方案二：使用本地/云数据库

1. 创建 PostgreSQL 数据库
2. 修改 `backend/.env` 中的 `DATABASE_URL`

### 后端设置

```bash
cd backend

# 安装依赖
npm install

# 生成 Prisma 客户端
npx prisma generate

# 应用数据库迁移
npx prisma migrate dev

# 启动后端服务
npm run start:dev
```

后端将运行在 `http://localhost:13001`

### 前端设置

```bash
cd frontend

# 安装依赖
npm install

# 启动前端开发服务器
npm run dev
```

前端将运行在 `http://localhost:13002`

## 📁 项目结构

```
crypto-anchor-platform/
├── backend/                # NestJS 后端
│   ├── src/
│   │   ├── auth/          # 认证模块（登录/注册/JWT）
│   │   ├── users/         # 用户模块（资料/密码/公开主页）
│   │   ├── wallets/       # 钱包模块（充值/提现/记账）
│   │   ├── items/         # 物品模块（发布/审核/搜索）
│   │   ├── orders/        # 订单模块（下单/托管/发货/确认）
│   │   ├── reviews/       # 评价模块（互评/信誉）
│   │   ├── tron/          # TRON 充值监听模块
│   │   ├── blockchain/    # 多链区块链模块（TRON/BSC托管、充值监听）
│   │   ├── market/        # 行情数据模块（价格/K线/历史）
│   │   ├── admin/         # 管理后台模块
│   │   ├── prisma/        # Prisma 服务
│   │   └── app.module.ts
│   ├── prisma/
│   │   └── schema.prisma  # 数据库 Schema
│   └── .env               # 环境变量
├── frontend/              # Next.js 前端
│   ├── app/              # 页面路由
│   │   ├── page.tsx      # 首页
│   │   ├── login/        # 登录页
│   │   ├── register/     # 注册页
│   │   ├── items/        # 物品相关页面
│   │   ├── orders/       # 订单页面
│   │   ├── wallet/       # 钱包页面（含 TRON 充值）
│   │   ├── profile/      # 个人中心
│   │   ├── user/[id]/    # 用户公开主页
│   │   └── admin/        # 管理后台
│   ├── components/       # 组件
│   ├── contexts/         # React Context
│   └── lib/
│   │       └── api.ts        # API 服务层
├── contracts/            # 智能合约（TRON）
├── docker-compose.yml    # Docker 配置
├── LICENSE               # 许可证
└── README.md
```

## 🔑 核心 API

### 认证
- `POST /api/auth/register` - 注册
- `POST /api/auth/login` - 登录

### 钱包
- `GET /api/wallets/balance` - 查询余额
- `POST /api/wallets/deposit` - 充值
- `POST /api/wallets/withdraw` - 提现
- `GET /api/wallets/transactions` - 交易记录

### TRON 充值
- `GET /api/tron/deposit-address` - 获取充值地址
- `POST /api/tron/deposit-address` - 设置充值地址
- `GET /api/tron/deposit-balance` - 查询链上余额

### 多链钱包
- `GET /api/blockchain/networks` - 获取支持的区块链网络
- `GET /api/blockchain/networks/:network/tokens` - 获取网络代币列表
- `GET /api/blockchain/wallet-address/:network` - 获取用户钱包地址
- `POST /api/blockchain/wallet-address` - 设置钱包地址
- `GET /api/blockchain/deposit-balance/:network` - 查询链上余额
- `GET /api/blockchain/balance` - 查询指定代币余额
- `POST /api/blockchain/validate-address` - 验证地址格式
- `GET /api/blockchain/escrow/status` - 查询托管订单状态

### 行情数据
- `GET /api/market/prices?symbols=BTC,ETH,USDT` - 获取实时价格
- `GET /api/market/history?symbol=BTC&days=30` - 获取历史价格
- `GET /api/market/klines?symbol=BTC&interval=1d&limit=100` - 获取K线数据
- `GET /api/market/all` - 获取所有代币价格

### 物品
- `GET /api/items` - 获取物品列表
- `GET /api/items/:id` - 获取物品详情
- `POST /api/items` - 发布物品
- `GET /api/items/my` - 我的物品
- `POST /api/items/:id/approve` - 审核通过（管理员）
- `POST /api/items/:id/reject` - 审核拒绝（管理员）

### 订单
- `POST /api/orders` - 创建订单
- `POST /api/orders/:id/pay` - 支付订单
- `POST /api/orders/:id/ship` - 发货
- `POST /api/orders/:id/confirm` - 确认收货
- `POST /api/orders/:id/cancel` - 取消订单
- `POST /api/orders/:id/dispute` - 发起争议
- `POST /api/orders/:id/resolve` - 解决争议（管理员）
- `GET /api/orders/my/buy` - 我的购买
- `GET /api/orders/my/sell` - 我的销售

### 用户
- `GET /api/users/me` - 获取当前用户信息
- `PUT /api/users/me` - 更新资料
- `POST /api/users/me/password` - 修改密码
- `GET /api/users/:id/public` - 获取用户公开信息
- `GET /api/users/:id/items` - 获取用户物品
- `GET /api/users/:id/reviews` - 获取用户评价

### 评价
- `POST /api/reviews` - 创建评价

### 管理后台
- `GET /api/admin/stats` - 平台统计
- `GET /api/admin/orders` - 所有订单
- `GET /api/admin/orders/disputed` - 争议订单
- `GET /api/admin/users` - 所有用户
- `PUT /api/admin/users/:id/role` - 设置用户角色
- `PUT /api/admin/users/:id/reputation` - 调整信誉分
- `GET /api/admin/items/stats` - 物品统计
- `GET /api/admin/transactions` - 交易记录

## 🔄 交易流程

```
1. 卖家发布物品 → 平台审核
2. 买家浏览并下单
3. 买家支付 USDT → 资金托管
4. 卖家发货（填写物流）
5. 买家确认收货 → 资金释放给卖家
6. 双方互评 → 更新信誉分

注：7天未确认收货将自动完成订单
```

## 💎 TRON 充值流程

```
1. 用户在钱包页面获取/设置专属 TRON 充值地址
2. 用户向该地址转账 USDT (TRC-20)
3. 后端定时扫描链上交易（每60秒）
4. 检测到新交易后自动入账到用户钱包
5. 用户可在交易记录中查看充值详情
```

详见 [TRON_SETUP.md](./TRON_SETUP.md)

## 📊 数据库模型

- **User** - 用户（邮箱、用户名、密码、角色、信誉分、头像、简介）
- **Wallet** - 钱包（USDT余额、冻结余额）
- **Transaction** - 交易记录（充值、提现、订单支付/放款/退款）
- **Item** - 物品（标题、描述、图片、价格、分类、状态）
- **Order** - 订单（买家、卖家、价格、状态、物流信息）
- **Review** - 评价（订单、评分、评论）
- **TronDepositAddress** - TRON 充值地址绑定

## 🔐 安全特性

- 密码使用 bcrypt 加密存储
- JWT 令牌认证（7天有效期）
- 角色权限控制（USER/ADMIN）
- API 请求限流（每分钟100次）
- class-validator 输入验证
- 资金托管机制
- 信誉评分系统
- 争议仲裁功能

## 🎨 主题系统

平台支持 8 种配色方案，管理员可在后台「外观设置」中切换：

| 主题 | 中文名 | 主色调 |
|------|--------|--------|
| Rose | 深玫瑰 | #BE185D |
| Ocean | 海洋蓝 | #0369A1 |
| Emerald | 翡翠绿 | #059669 |
| Sunset | 日落橙 | #EA580C |
| Violet | 紫罗兰 | #7C3AED |
| Midnight | 午夜黑 | #18181B |
| Gold | 金琥珀 | #D97706 |
| Teal | 青碧 | #0D9488 |

设计特点：
- 所有图标使用 SVG（无 Emoji）
- CSS 变量驱动配色系统
- 柔和扩散阴影效果
- 不对称 Bento Grid 布局
- 等宽字体显示数字

## 🛠️ 开发命令

### 后端

```bash
# 开发模式
npm run start:dev

# 生产模式
npm run build
npm run start:prod

# 数据库迁移
npx prisma migrate dev

# 查看数据库
npx prisma studio
```

### 前端

```bash
# 开发模式
npm run dev

# 构建
npm run build

# 生产模式
npm run start
```

## 📝 环境变量

### 后端 (.env)
```env
# Database
DATABASE_URL=postgresql://postgres@localhost:5432/crypto_anchor

# JWT
JWT_SECRET=your-super-secret-jwt-key
JWT_EXPIRES_IN=7d

# App
PORT=13001
FRONTEND_URL=http://localhost:13002

# TRON (可选，用于真实环境)
TRON_NETWORK=shasta  # 或 mainnet
TRON_GRID_API_KEY=your-api-key
```

### 前端 (.env)
```env
NEXT_PUBLIC_API_URL=http://localhost:13001/api
```

## 🎯 未来计划

- [x] 链上智能合约托管（TRON + BSC 测试网）
- [x] 多币种支持（USDT、TRX、BNB、ETH）
- [ ] 第三方验货服务
- [x] 邮件/短信通知（SendGrid + Twilio 集成）
- [ ] KYC 认证
- [ ] 移动端 App
- [x] K线图表和行情数据（CoinGecko API）

## 👥 用户角色

- **USER** - 普通用户，可以发布物品、交易、评价
- **ADMIN** - 管理员，可以审核物品、处理争议、管理用户、查看统计数据

## 📄 许可证

**非商业使用免费，商业使用需授权**

- ✅ 个人学习与研究
- ✅ 教育用途
- ✅ 开源项目贡献
- ✅ 学术研究
- ✅ 个人非营利项目
- ❌ 商业产品/服务
- ❌ 企业内部使用

详见 [LICENSE](./LICENSE)

---

**Author:** hartzsj

**Repository:** https://github.com/hartzsj/crypto-anchor-platform