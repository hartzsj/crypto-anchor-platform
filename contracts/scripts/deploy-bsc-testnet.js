const hre = require("hardhat");

async function main() {
  console.log("Deploying Escrow contract to BSC Testnet...");

  // 获取部署账户
  const [deployer] = await hre.ethers.getSigners();
  console.log("Deployer address:", deployer.address);

  // 检查部署账户余额
  const balance = await deployer.getBalance();
  console.log("Deployer balance:", hre.ethers.utils.formatEther(balance), "BNB");

  // 管理员地址（平台地址）
  const ADMIN_ADDRESS = process.env.ADMIN_ADDRESS || deployer.address;
  console.log("Admin address:", ADMIN_ADDRESS);

  // 部署合约
  const Escrow = await hre.ethers.getContractFactory("Escrow");
  const escrow = await Escrow.deploy(ADMIN_ADDRESS);

  await escrow.deployed();

  console.log("Escrow contract deployed to:", escrow.address);
  console.log("Transaction hash:", escrow.deployTransaction.hash);

  // 等待几个区块确认
  console.log("Waiting for confirmations...");
  await escrow.deployTransaction.wait(3);

  // 保存部署信息
  const deploymentInfo = {
    network: "bsc-testnet",
    chainId: 97,
    contractName: "Escrow",
    address: escrow.address,
    admin: ADMIN_ADDRESS,
    deployer: deployer.address,
    txHash: escrow.deployTransaction.hash,
    deployedAt: new Date().toISOString(),
    abi: Escrow.interface.format("json")
  };

  // 写入部署文件
  const fs = require("fs");
  const path = require("path");
  const deploymentPath = path.join(__dirname, "../deployments/bsc-testnet.json");
  fs.writeFileSync(deploymentPath, JSON.stringify(deploymentInfo, null, 2));
  console.log("Deployment info saved to:", deploymentPath);

  console.log("\n=== Deployment Complete ===");
  console.log("Contract Address:", escrow.address);
  console.log("Admin Address:", ADMIN_ADDRESS);
  console.log("\nNext steps:");
  console.log("1. Verify the contract on BscScan (if needed)");
  console.log("2. Update backend configuration with contract address");
  console.log("3. Test order creation and funding");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });