// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

/**
 * @title CryptoAnchorDeposit
 * @dev USDT充值托管合约 - TRON TRC-20
 * 用户充值USDT到合约，合约发出Deposit事件，后端监听并自动入账
 */
contract CryptoAnchorDeposit is Ownable {

    // USDT代币合约地址 (TRON主网)
    IERC20 public usdtToken;

    // 平台运营地址 - 用于提现和资金归集
    address public platformWallet;

    // 用户充值地址映射 (userId => depositAddress)
    mapping(string => address) public userDepositAddresses;

    // 地址对应的用户ID (depositAddress => userId)
    mapping(address => string) public addressToUserId;

    // 充值事件 - 后端监听此事件
    event Deposit(
        string userId,           // 用户ID
        address from,            // 充值来源地址
        uint256 amount,          // 充值金额 (6 decimals for USDT)
        uint256 timestamp        // 时间戳
    );

    // 提现事件
    event Withdraw(
        string userId,
        address to,
        uint256 amount,
        uint256 timestamp
    );

    // 用户充值地址注册事件
    event AddressRegistered(
        string userId,
        address depositAddress
    );

    constructor(address _usdtToken, address _platformWallet) Ownable(msg.sender) {
        usdtToken = IERC20(_usdtToken);
        platformWallet = _platformWallet;
    }

    /**
     * @dev 注册用户充值地址
     * @param userId 用户ID
     * @param depositAddress 用户专属充值地址
     */
    function registerUserAddress(string userId, address depositAddress) external onlyOwner {
        require(userDepositAddresses[userId] == address(0), "User already registered");
        require(addressToUserId[depositAddress] == "", "Address already used");

        userDepositAddresses[userId] = depositAddress;
        addressToUserId[depositAddress] = userId;

        emit AddressRegistered(userId, depositAddress);
    }

    /**
     * @dev 用户充值USDT
     * 用户从自己的充值地址转账USDT到此合约
     * @param amount 充值金额
     */
    function deposit(uint256 amount) external {
        require(amount > 0, "Amount must be greater than 0");
        require(addressToUserId[msg.sender] != "", "Address not registered");

        string userId = addressToUserId[msg.sender];

        // 转移USDT到合约
        require(usdtToken.transferFrom(msg.sender, address(this), amount), "Transfer failed");

        // 发出充值事件
        emit Deposit(userId, msg.sender, amount, block.timestamp);
    }

    /**
     * @dev 批量处理充值（管理员调用）
     * 当用户从非注册地址充值时，管理员可手动处理
     */
    function manualDeposit(string userId, address from, uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(usdtToken.balanceOf(address(this)) >= amount, "Insufficient balance");

        emit Deposit(userId, from, amount, block.timestamp);
    }

    /**
     * @dev 提现到用户地址
     * @param userId 用户ID
     * @param to 提现目标地址
     * @param amount 提现金额
     */
    function withdraw(string userId, address to, uint256 amount) external onlyOwner {
        require(amount > 0, "Amount must be greater than 0");
        require(usdtToken.balanceOf(address(this)) >= amount, "Insufficient contract balance");

        require(usdtToken.transfer(to, amount), "Transfer failed");

        emit Withdraw(userId, to, amount, block.timestamp);
    }

    /**
     * @dev 归集资金到平台钱包
     */
    function collectFunds(uint256 amount) external onlyOwner {
        require(usdtToken.transfer(platformWallet, amount), "Transfer failed");
    }

    /**
     * @dev 获取合约USDT余额
     */
    function getBalance() external view returns (uint256) {
        return usdtToken.balanceOf(address(this));
    }

    /**
     * @dev 更新平台钱包地址
     */
    function setPlatformWallet(address newWallet) external onlyOwner {
        platformWallet = newWallet;
    }

    /**
     * @dev 更新USDT合约地址（如需更换代币）
     */
    function setUsdtToken(address newToken) external onlyOwner {
        usdtToken = IERC20(newToken);
    }
}