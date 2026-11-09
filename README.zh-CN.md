# ArenaCover — Agent 出错，谁来赔？

[English](./README.md) · [한국어](./README.ko.md) · [中文](./README.zh-CN.md)

**自主执行需要明确担责。** ArenaCover 为 Agent 支付提供有预存资本支撑的执行保障。先约定规则，再锁定赔付资金；同一业务订单发生重复扣款时，由合约验证并一次性赔付超额部分。

[在线演示](https://arenacover-seoul-20261109.vercel.app) · [60 秒英文视频](https://arenacover-seoul-20261109.vercel.app/demo/ArenaCover_Demo60s.mp4)

## 黑客松 MVP

面向 **Injective EVM Testnet（chain ID 1439）** 构建，Arena402 是首个计划接入对象。当前视频和公开回放来自 **本地 EVM（31337）真实合约交易**；测试网部署脚本已准备，尚未完成公开测试网部署。

1. 运营方预存 100 DemoUSD。
2. 用户支付 1 DemoUSD 保费，锁定 10 DemoUSD 赔付额度。
3. 订单原本只允许扣款 10，故障注入器重复扣款一次。
4. 用户余额依次为 100 → 99 → 89 → 79。
5. 合约验证超额扣款，赔付 10，余额恢复至 89；资金池剩余 90，锁定额归零。

每一步都有交易凭证。托管版为明确标注的只读回放；本机运行可亲自完成全流程。所有代币均为无价值测试资产。

## Arena402 历史测试网钱包

网络：**Injective EVM 测试网 · Chain ID 1439**。

| 角色 | 地址 | 历史用途 |
| --- | --- | --- |
| Facilitator | `0x7fB8d49698E40656F727511Da6251D3e6dfFaD50` | 接收 Faucet 测试币、部署合约、支付 Gas |
| Seller | `0x93Dafa6bFa2428CA033e8d6Fe9C94e40d1AC8754` | 交易测试中的卖方收款地址 |

来源：旧项目 `agent-arena/settlement/deployments.json`，其中 Facilitator 的定位为第 19 行，已由所有者再次确认。**本次补充未重新查询当前余额。** 地址作为历史钱包资料保存；ArenaCover 当前部署状态见 [`public/deployment.json`](./public/deployment.json)。

[机器可读地址记录](./docs/arena402-historical-testnet-wallets.json) · [较早的余额快照与资源说明](./RESOURCE_STATUS.md)

## 本地运行

需要 Node.js 22+。

```bash
npm ci
npm run compile:contracts
npm run chain
```

保持本地链终端运行，在另一终端执行：

```bash
npm run deploy:local
npm run dev
```

打开 http://127.0.0.1:3000，依次连接沙盒钱包、购买保障、执行故障、验证赔付。每次部署支持一个订单；重新运行部署脚本可准备新订单。沙盒账户使用公开开发助记词，只能用于本地，不能转入真实资产。

## 验证与范围

`npm test` 包含 6 项合约行为测试与 3 项网络签名防护测试；`npm run typecheck`、`npm run build` 验证前端；浏览器端到端检查验证 4 笔凭证和最终余额。

仅覆盖本演示的重复业务支付；不保障交易盈利或市场损失。执行器和保障逻辑同处演示合约，不是独立外部 Agent 预言机。TEE 尚未接入，不声称已实现 x402 结算，也不作为持牌保险产品提供服务。

## 仓库与证据

全新仓库，非 Arena402 fork。参考其支付阶段与凭证思路，不复制旧钱包、生产凭证或认证服务。

[验证记录](./VERIFICATION.md) · [实际运行 JSON](./public/evidence/run.json) · [合约](./contracts/ArenaCover.sol) · [PRD](./PRD.md) · [开发清单](./DEVELOPMENT_TASKS.md) · [TEE 检查](./TEE_CHECK_RESULT.md)

界面参考 Hermes Agent 的电蓝、窄体大字与版式，盾牌为原创生成图；使用本地 SIL OFL 字体 Barlow Condensed、IBM Plex Mono。无 Hermes 标志、商业试用字体或追踪脚本。

视频配乐：**'Neon' by Scott Buckley - released under CC-BY 4.0. www.scottbuckley.com.au**。英文旁白为合成语音。上传 YouTube 时请将该音乐署名放进视频简介。[原曲与授权](https://www.scottbuckley.com.au/library/neon/)
