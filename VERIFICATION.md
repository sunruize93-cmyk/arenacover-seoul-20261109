# ArenaCover 验证记录

日期：2026 年 11 月 9 日。

## 已验证

- Solidity 以 Paris EVM 目标编译，使用 OpenZeppelin ERC20、SafeERC20 和 ReentrancyGuard。
- 六组本地合约测试通过：完整赔付、正常不赔、重复及乱序调用、角色约束、资金不足、失败转账原子回滚。
- 浏览器从操作页执行四笔实际本地 EVM 交易，全部确认；余额 100→99→89→79→89。
- 池余额由 100 到 90，赔付后 reserved 为零；正常和重复付款都不进入赔付池。
- Playwright Chromium 检查页面无未捕获异常，390px 宽度没有横向溢出。
- TypeScript 检查、Next.js 生产构建通过。

浏览器证据位于 public/evidence/run.json，包含网络、部署、订单和实际交易哈希；截图位于 test-results。以证据文件所列部署为准，重复准备演示会产生新的合约和订单。

## 完成层级与限制

当前已验证本地 EVM 交互版本。TEE 为 Not connected，原因见 TEE_CHECK_RESULT.md。该原型没有生产 Agent Runtime、x402、真实交易所或独立承保机构。

执行与保障在同一测试合约中，故障由用户明确触发；测试证明固定资金闭环，不证明对任意外部 Agent 的独立归责。DemoUSD 无真实货币价值。

公开网页若读取本地链的记录，只能展示明确标识的 Replay；远程网页不会连接用户电脑的 127.0.0.1，也不会使用本地开发钱包签署远程交易。
