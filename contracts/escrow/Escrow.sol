// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

/**
 * @title Escrow
 * @dev 多链托管合约 - 支持 TRON 和 BSC (EVM兼容)
 *
 * 功能：
 * - createOrder: 创建托管订单
 * - fundOrder: 买家充值资金
 * - release: 释放资金给卖家
 * - refund: 退款给买家
 * - getOrder: 查询订单状态
 */
contract Escrow {
    // 订单状态
    enum OrderStatus {
        CREATED,    // 0: 已创建，等待充值
        FUNDED,     // 1: 已充值，资金托管中
        RELEASED,   // 2: 已释放给卖家
        REFUNDED    // 3: 已退款给买家
    }

    // 托管订单结构
    struct EscrowOrder {
        bytes32 orderId;      // 平台订单ID (bytes32)
        address buyer;        // 买家地址
        address seller;       // 卖家地址
        uint256 amount;       // 托管金额
        address token;        // 代币地址 (address(0) 表示原生币)
        OrderStatus status;   // 订单状态
        uint256 createdAt;    // 创建时间
        uint256 fundedAt;     // 充值时间
        uint256 releasedAt;   // 释放时间
        uint256 refundedAt;   // 退款时间
    }

    // 状态变量
    address public admin;                    // 管理员地址（平台）
    mapping(bytes32 => EscrowOrder) public orders;  // 订单映射
    mapping(bytes32 => bool) public orderExists;    // 订单是否存在

    // 事件
    event OrderCreated(bytes32 orderId, address buyer, address seller, uint256 amount, address token);
    event OrderFunded(bytes32 orderId, uint256 amount, uint256 fundedAt);
    event OrderReleased(bytes32 orderId, address seller, uint256 amount, uint256 releasedAt);
    event OrderRefunded(bytes32 orderId, address buyer, uint256 amount, uint256 refundedAt);
    event AdminChanged(address oldAdmin, address newAdmin);

    // 修饰符
    modifier onlyAdmin() {
        require(msg.sender == admin, "Escrow: only admin can call this");
        _;
    }

    modifier onlyBuyer(bytes32 _orderId) {
        require(orders[_orderId].buyer == msg.sender, "Escrow: only buyer can call this");
        _;
    }

    modifier orderCreated(bytes32 _orderId) {
        require(orderExists[_orderId], "Escrow: order does not exist");
        _;
    }

    /**
     * @dev 构造函数
     * @param _admin 管理员地址（平台地址）
     */
    constructor(address _admin) {
        require(_admin != address(0), "Escrow: invalid admin address");
        admin = _admin;
    }

    /**
     * @dev 创建托管订单（由平台调用）
     * @param _orderId 平台订单ID
     * @param _buyer 买家地址
     * @param _seller 卖家地址
     * @param _amount 托管金额
     * @param _token 代币地址 (address(0) 表示原生币，如ETH/BNB/TRX)
     */
    function createOrder(
        bytes32 _orderId,
        address _buyer,
        address _seller,
        uint256 _amount,
        address _token
    ) external onlyAdmin {
        require(!orderExists[_orderId], "Escrow: order already exists");
        require(_buyer != address(0), "Escrow: invalid buyer address");
        require(_seller != address(0), "Escrow: invalid seller address");
        require(_amount > 0, "Escrow: amount must be greater than 0");
        require(_buyer != _seller, "Escrow: buyer and seller cannot be the same");

        orders[_orderId] = EscrowOrder({
            orderId: _orderId,
            buyer: _buyer,
            seller: _seller,
            amount: _amount,
            token: _token,
            status: OrderStatus.CREATED,
            createdAt: block.timestamp,
            fundedAt: 0,
            releasedAt: 0,
            refundedAt: 0
        });

        orderExists[_orderId] = true;

        emit OrderCreated(_orderId, _buyer, _seller, _amount, _token);
    }

    /**
     * @dev 买家充值资金到托管
     * @param _orderId 平台订单ID
     *
     * 注意：对于 ERC20/BEP20/TRC20 代币，买家需要先 approve 合约
     */
    function fundOrder(bytes32 _orderId)
        external
        payable
        orderCreated(_orderId)
        onlyBuyer(_orderId)
    {
        EscrowOrder storage order = orders[_orderId];

        require(order.status == OrderStatus.CREATED, "Escrow: order not in created status");

        // 处理充值
        if (order.token == address(0)) {
            // 原生币充值 (ETH/BNB/TRX)
            require(msg.value == order.amount, "Escrow: incorrect native token amount");
        } else {
            // 代币充值 (ERC20/BEP20/TRC20)
            require(msg.value == 0, "Escrow: native token not accepted for token orders");

            // 使用 SafeERC20 的 transferFrom
            IERC20 token = IERC20(order.token);
            require(token.transferFrom(msg.sender, address(this), order.amount), "Escrow: token transfer failed");
        }

        order.status = OrderStatus.FUNDED;
        order.fundedAt = block.timestamp;

        emit OrderFunded(_orderId, order.amount, order.fundedAt);
    }

    /**
     * @dev 释放资金给卖家
     * @param _orderId 平台订单ID
     *
     * 可以由以下人员调用：
     * - 买家确认收货后调用
     * - 管理员处理争议后调用
     * - 自动确认逻辑（由管理员触发）
     */
    function release(bytes32 _orderId)
        external
        orderCreated(_orderId)
    {
        EscrowOrder storage order = orders[_orderId];

        require(order.status == OrderStatus.FUNDED, "Escrow: order not in funded status");
        require(msg.sender == order.buyer || msg.sender == admin, "Escrow: only buyer or admin can release");

        // 转账给卖家
        if (order.token == address(0)) {
            // 原生币
            (bool success, ) = order.seller.call{value: order.amount}("");
            require(success, "Escrow: native token transfer failed");
        } else {
            // 代币
            IERC20 token = IERC20(order.token);
            require(token.transfer(order.seller, order.amount), "Escrow: token transfer failed");
        }

        order.status = OrderStatus.RELEASED;
        order.releasedAt = block.timestamp;

        emit OrderReleased(_orderId, order.seller, order.amount, order.releasedAt);
    }

    /**
     * @dev 退款给买家（仅管理员可调用）
     * @param _orderId 平台订单ID
     *
     * 用于处理争议、订单取消等情况
     */
    function refund(bytes32 _orderId)
        external
        onlyAdmin
        orderCreated(_orderId)
    {
        EscrowOrder storage order = orders[_orderId];

        require(order.status == OrderStatus.FUNDED, "Escrow: order not in funded status");

        // 退款给买家
        if (order.token == address(0)) {
            // 原生币
            (bool success, ) = order.buyer.call{value: order.amount}("");
            require(success, "Escrow: native token refund failed");
        } else {
            // 代币
            IERC20 token = IERC20(order.token);
            require(token.transfer(order.buyer, order.amount), "Escrow: token refund failed");
        }

        order.status = OrderStatus.REFUNDED;
        order.refundedAt = block.timestamp;

        emit OrderRefunded(_orderId, order.buyer, order.amount, order.refundedAt);
    }

    /**
     * @dev 查询订单详情
     * @param _orderId 平台订单ID
     */
    function getOrder(bytes32 _orderId)
        external
        view
        orderCreated(_orderId)
        returns (
            address buyer,
            address seller,
            uint256 amount,
            address token,
            OrderStatus status,
            uint256 createdAt,
            uint256 fundedAt
        )
    {
        EscrowOrder storage order = orders[_orderId];
        return (
            order.buyer,
            order.seller,
            order.amount,
            order.token,
            order.status,
            order.createdAt,
            order.fundedAt
        );
    }

    /**
     * @dev 查询订单状态
     * @param _orderId 平台订单ID
     */
    function getOrderStatus(bytes32 _orderId)
        external
        view
        orderCreated(_orderId)
        returns (OrderStatus)
    {
        return orders[_orderId].status;
    }

    /**
     * @dev 查询合约中的托管余额（原生币）
     */
    function getContractBalance() external view returns (uint256) {
        return address(this).balance;
    }

    /**
     * @dev 更换管理员（仅当前管理员可调用）
     * @param _newAdmin 新管理员地址
     */
    function changeAdmin(address _newAdmin) external onlyAdmin {
        require(_newAdmin != address(0), "Escrow: invalid new admin address");

        address oldAdmin = admin;
        admin = _newAdmin;

        emit AdminChanged(oldAdmin, _newAdmin);
    }
}

/**
 * @dev ERC20/BEP20/TRC20 接口
 */
interface IERC20 {
    function transferFrom(address sender, address recipient, uint256 amount) external returns (bool);
    function transfer(address recipient, uint256 amount) external returns (bool);
    function balanceOf(address account) external view returns (uint256);
    function approve(address spender, uint256 amount) external returns (bool);
}