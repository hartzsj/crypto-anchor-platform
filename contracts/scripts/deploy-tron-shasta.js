const TronWeb = require("tronweb");

async function main() {
  console.log("Deploying Escrow contract to TRON Shasta Testnet...");

  // TRON 配置
  const PRIVATE_KEY = process.env.TRON_TESTNET_PRIVATE_KEY;
  const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS;

  if (!PRIVATE_KEY) {
    console.error("Error: TRON_TESTNET_PRIVATE_KEY not set in environment");
    process.exit(1);
  }

  // 连接到 Shasta 测试网
  const tronWeb = new TronWeb({
    fullHost: "https://api.shasta.trongrid.io",
    privateKey: PRIVATE_KEY
  });

  // 获取部署账户地址
  const deployerAddress = tronWeb.address.fromPrivateKey(PRIVATE_KEY);
  console.log("Deployer address:", deployerAddress);

  // 管理员地址
  const adminAddress = ADMIN_ADDRESS || deployerAddress;
  console.log("Admin address:", adminAddress);

  // 编译合约（读取 Solidity 文件）
  const fs = require("fs");
  const path = require("path");
  const contractPath = path.join(__dirname, "../escrow/Escrow.sol");
  const contractSource = fs.readFileSync(contractPath, "utf8");

  // 编译合约
  console.log("Compiling contract...");
  const compileResult = await tronWeb.utils.compiler.compileContract(
    contractSource,
    "Escrow"
  );

  if (!compileResult.success) {
    console.error("Compilation error:", compileResult.errors);
    process.exit(1);
  }

  console.log("Contract compiled successfully");

  // 部署合约
  console.log("Deploying contract...");
  const contractAbi = compileResult.abi;
  const contractBytecode = compileResult.bytecode;

  // TRON 地址转换（以太坊格式 -> TRON格式）
  const adminAddressHex = tronWeb.address.toHex(adminAddress);

  // 部署参数
  const deployParams = {
    abi: contractAbi,
    bytecode: contractBytecode,
    parameters: [adminAddressHex]
  };

  // 部署交易
  const tx = await tronWeb.transactionBuilder.createSmartContract(
    deployParams,
    deployerAddress
  );

  const signedTx = await tronWeb.trx.multiSign(tx, PRIVATE_KEY, 0);
  const result = await tronWeb.trx.sendRawTransaction(signedTx);

  if (!result.result) {
    console.error("Deployment failed:", result);
    process.exit(1);
  }

  console.log("Deployment transaction sent:", result.txid);

  // 等待合约确认
  console.log("Waiting for contract confirmation...");
  await new Promise(resolve => setTimeout(resolve, 10000));

  // 获取合约地址
  const contractAddress = tronWeb.utils.getContractAddressFromTx(result.txid);
  console.log("Contract deployed to:", contractAddress);

  // 保存部署信息
  const deploymentInfo = {
    network: "tron-shasta",
    chainId: null,
    contractName: "Escrow",
    address: contractAddress,
    admin: adminAddress,
    deployer: deployerAddress,
    txHash: result.txid,
    deployedAt: new Date().toISOString(),
    abi: JSON.stringify(contractAbi)
  };

  const deploymentPath = path.join(__dirname, "../deployments/tron-shasta.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info saved to:", deploymentPath);

  console.log("\n=== Deployment Complete ===");
  console.log("Contract Address:", contractAddress);
  console.log("Admin Address:", adminAddress);
  console.log("TxHash:", result.txid);
  console.log("\nView on TronScan: https://shasta.tronscan.org/#/contract/" + contractAddress);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });