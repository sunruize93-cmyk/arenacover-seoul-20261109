// SPDX-License-Identifier: MIT
pragma solidity ^0.8.24;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

/// @notice Fixed-supply demonstration token, with no monetary value.
contract DemoUSD is ERC20 {
    constructor(address operator_, address user_) ERC20("ArenaCover Demo USD", "DemoUSD") {
        require(operator_ != address(0) && user_ != address(0) && operator_ != user_, "Invalid actors");
        _mint(operator_, 100 * 10 ** 6);
        _mint(user_, 100 * 10 ** 6);
    }
    function decimals() public pure override returns (uint8) { return 6; }
}

/// @notice One-order, prefunded guarantee plus an explicitly controlled fault harness.
/// @dev Not an independent oracle, production executor, or licensed insurance product.
contract ArenaCoverDemo is ReentrancyGuard {
    using SafeERC20 for IERC20;
    enum Stage { Unprotected, Protected, FirstPayment, DuplicatePayment, Paid }
    IERC20 public immutable token;
    address public immutable operator;
    address public immutable user;
    bytes32 public immutable orderId;
    bytes32 public immutable termsHash;
    uint256 public constant PAYMENT = 10 * 10 ** 6;
    uint256 public constant PREMIUM = 1 * 10 ** 6;
    uint256 public constant COVER = 10 * 10 ** 6;
    Stage public stage;
    uint256 public reserved;
    uint256 public paidTotal;
    uint256 public compensation;

    error WrongActor();
    error WrongStage();
    error InsufficientCapital();
    error NoDuplicatePayment();
    event Funded(address indexed operator, uint256 amount);
    event PolicyProtected(bytes32 indexed orderId, address indexed beneficiary, bytes32 termsHash, uint256 reserved);
    event PaymentRecorded(bytes32 indexed orderId, bytes32 indexed paymentId, uint256 amount, bool controlledFault);
    event ClaimPaid(bytes32 indexed orderId, address indexed beneficiary, uint256 amount);

    constructor(IERC20 token_, address operator_, address user_, bytes32 orderId_) {
        require(address(token_) != address(0) && operator_ != address(0) && user_ != address(0), "Zero address");
        require(operator_ != user_ && orderId_ != bytes32(0), "Invalid actors/order");
        token = token_; operator = operator_; user = user_; orderId = orderId_;
        termsHash = keccak256(abi.encode("ArenaCover/v1", block.chainid, address(this), orderId_, user_, operator_, address(token_), PAYMENT, PREMIUM, COVER));
    }
    modifier onlyUser() { if (msg.sender != user) revert WrongActor(); _; }
    function fund(uint256 amount) external nonReentrant {
        if (msg.sender != operator) revert WrongActor();
        token.safeTransferFrom(operator, address(this), amount);
        emit Funded(operator, amount);
    }
    function available() public view returns (uint256) { return token.balanceOf(address(this)) - reserved; }
    function protect() external onlyUser nonReentrant {
        if (stage != Stage.Unprotected) revert WrongStage();
        if (available() < COVER) revert InsufficientCapital();
        reserved = COVER; stage = Stage.Protected;
        token.safeTransferFrom(user, operator, PREMIUM);
        emit PolicyProtected(orderId, user, termsHash, COVER);
    }
    function executePayment() external onlyUser nonReentrant {
        if (stage != Stage.Protected) revert WrongStage();
        stage = Stage.FirstPayment; paidTotal = PAYMENT;
        token.safeTransferFrom(user, operator, PAYMENT);
        emit PaymentRecorded(orderId, keccak256(abi.encode(orderId, uint256(1))), PAYMENT, false);
    }
    /// @notice Intentionally reproduces a BUSINESS retry bug; not a signature replay.
    function injectDuplicate() external onlyUser nonReentrant {
        if (stage != Stage.FirstPayment) revert WrongStage();
        stage = Stage.DuplicatePayment; paidTotal += PAYMENT;
        token.safeTransferFrom(user, operator, PAYMENT);
        emit PaymentRecorded(orderId, keccak256(abi.encode(orderId, uint256(2))), PAYMENT, true);
    }
    function claim() external onlyUser nonReentrant {
        if (stage != Stage.DuplicatePayment || paidTotal != 2 * PAYMENT) revert NoDuplicatePayment();
        stage = Stage.Paid; compensation = COVER; reserved = 0;
        token.safeTransfer(user, COVER);
        emit ClaimPaid(orderId, user, COVER);
    }
}
