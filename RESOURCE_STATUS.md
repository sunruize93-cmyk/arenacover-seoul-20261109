# 旧 Arena 资源核对

2026 年 11 月 9 日，Injective EVM 测试网 Chain ID 1439。查询时区块 147719135。

| 配置角色 | 地址 | INJ | mUSDC |
| --- | --- | --- | --- |
| Buyer | 0x07900F7f7C5E3d92BB0Eeea43981050605e1aB25 | 0 | 9971.999997 |
| Seller | 0x93Dafa6bFa2428CA033e8d6Fe9C94e40d1AC8754 | 0 | 28.000003 |
| Facilitator | 0x7fB8d49698E40656F727511Da6251D3e6dfFaD50 | 0.96447361664 | 0 |
| 本次新部署者 | 0x734403049b4f5fA486CD7d92720Ac049D517a74B | 0 | 0 |

来源为旧后端 agent-arena/settlement/deployments.json，余额通过 RPC 实查。mUSDC 合约为 0x06D223D12774386A96D33863D9106A800e52BDeD，精度 6。余额是查询时快照，后续会变化。

旧测试币和钱包地址确实存在，但 mUSDC 不能代替原生 INJ 支付 gas，旧钱包也不等于本次新生成钱包。没有复制旧钱包私钥或生产钱包数据库。

本次新测试网钱包位于 Git 忽略的本机 .local 目录。用户于 14:43 前明确决定暂停测试币与公开测试网部署，当前交付本地闭环及测试网部署框架。未来接入时可运行 npm run deploy:testnet，使用本次新建的 DemoUSD 和保障合约，不修改旧合约或消耗原游戏代币。
