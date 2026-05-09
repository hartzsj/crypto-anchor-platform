# TRON链上充值配置指南

## 功能说明

系统已实现TRON网络（TRC-20）USDT自动充值功能：

1. 用户设置自己的TRON钱包地址作为充值地址
2. 用户转账USDT到该地址
3. 后端每30秒自动扫描链上交易
4. 发现入账后自动更新用户余额

## 配置步骤

### 1. 获取TronGrid API Key（免费）

访问 https://www.trongrid.io/ 注册账号，获取免费API Key。

### 2. 后端配置

在 `backend/.env` 添加：

```env
TRONGRID_API_KEY=your-api-key-here
```

### 3. 重启后端服务

```bash
cd backend
npm run start:dev
```

## 用户使用流程

1. 登录后访问钱包页面 `/wallet`
2. 设置TRON充值地址（用户自己的钱包地址）
3. 从任何交易所或钱包转账USDT（TRC-20）到该地址
4. 系统自动检测并入账（约30秒）

## 注意事项

- 仅支持 TRON 网络 USDT（TRC-20）
- 不要转账其他币种或其他网络的USDT
- 最小充值金额建议 ≥ 1 USDT
- 充值地址必须是有效的TRON地址（以T开头，长度34位）

## 生产环境优化建议

### 安全增强
1. 使用HD钱包为每个用户派生独立地址
2. 私钥加密存储
3. 定期归集资金到平台冷钱包

### 性能优化
1. 使用WebSocket实时监听链上事件
2. 添加充值记录缓存
3. 支持批量地址扫描

### 合规要求
1. 大额充值需要KYC验证
2. 添加充值限额
3. 记录所有链上交易Hash

## 相关文件

- `backend/src/tron/tron-monitor.service.ts` - 链上监听服务
- `backend/src/tron/tron-address.service.ts` - 地址管理服务
- `backend/src/tron/tron.controller.ts` - TRON API接口
- `frontend/app/wallet/page.tsx` - 钱包充值页面

## API接口

- `GET /api/tron/deposit-address` - 获取用户充值地址
- `POST /api/tron/deposit-address` - 设置充值地址
- `GET /api/tron/deposit-balance` - 查询链上待入账余额