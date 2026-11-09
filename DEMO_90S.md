# ArenaCover 90 秒演示流程

对应 PRD 1.2。2026 年 11 月 9 日 14:10 开始录制，14:40 前上传，时间为首尔时间 KST。

目标：展示谁承诺负责、保障资金已预留、重复扣款可以核验，以及赔款实际到账。执行仍是固定演示流程，没有生产交易 Agent 或 x402 接入。唯一新增亮点是本次订单的 TEE 签名事故回执；只有证明链和订单绑定通过才使用 TEE 版讲稿。

## 录制准备

- [ ] 从 T05 起保存真实交易及余额片段；不要求再跑第二轮测试网全流程。
- [ ] 若需要从头重录，用准备流程重新部署，用户 100、池 100 DemoUSD；不用页面重置。
- [ ] 用户有测试 gas，向演示合约准备 21 DemoUSD allowance。
- [ ] 页面有责任承诺方、条款、预留额度和真实链接。
- [ ] TEE 成功时准备本次回执、外部工具验证结果、公钥绑定证明与应用身份；只有通用 quote 或截图就改用降级讲稿。
- [ ] 测试网、本地链、故障注入及回放标识与实际状态一致。
- [ ] 录音测试、关闭通知。先录一份可用视频，仅补录失败片段。

## 分镜与英文讲稿

讲稿按平稳语速朗读，给钱包确认和结果展示留时间。等待段可剪短，交易顺序与实际结果必须保留。

| 视频时间 | 画面和操作 | 英文旁白 |
| --- | --- | --- |
| 0–12 秒 | Who pays when an agent fails?；用户余额 100 | Trading agents can move money on their own. But when execution goes wrong, users are left asking one question: who pays? |
| 12–26 秒 | Protect this trade；条款、责任方和锁定的 10；费用后余额 99 | This is ArenaCover. An operator backs an execution guarantee with funds reserved on Injective. This demo covers one duplicate payment, up to ten test tokens. |
| 26–45 秒 | 点击 Run fault scenario；逐笔展示正常付款后 89、重复付款后 79，保留两个支付 ID | Our controlled execution demo pays ten tokens, then reproduces a business-level retry bug. A second payment charges the same order again. These are real test-token transfers. |
| 45–68 秒 | Verify & compensate；确认余额 89、池 90、预留归零，展示凭证 | The contract compares the payments with the agreed limit. It compensates the extra ten tokens from the reserved funds. Here are the confirmed transaction receipts. |
| 68–80 秒 | 同一证据卡展开 TEE 回执及验证范围，仍显示市场亏损除外 | This TEE-signed incident record binds the order to its payment evidence. Market losses remain excluded. |
| 80–90 秒 | 全景保留责任方、赔款和证据 | Our first target is Arena402 agents. We want every delegated trade to come with a clear, funded responsibility commitment. |

测试网未完成时，将“reserved on Injective”改为“reserved in this local demo contract”，画面显示 Local demo。如果仅脚本驱动，保留终端实际执行和只读证据展示，不表演不存在的浏览器按钮操作。

TEE 未接入或验证失败时，68–80 秒保持条款和测试结果，改读：“Normal market losses are outside this guarantee. Tests also check normal payments and prevent duplicate claims.” 不显示 Verified 标签，不播放无关 attestation。

## 必须拍清楚的内容

1. 保障在付款前建立，预留 10 DemoUSD。
2. 同一业务订单、两个不同支付 ID、两次各 10 的成功付款。
3. 用户余额 100→99→89→79→89，赔付后池余额 90、锁定归零。
4. Paid 在确认后显示；链接来自本次真实交易。
5. TEE 成功时，本次回执的签名、公钥证明链、应用身份和订单关联；失败时清楚显示未接入。
6. Market losses are not covered 的固定说明，正常不赔和不可重复理赔的测试结果可作为旁证。

## 录制和提交边界

不录制独立市场亏损场景或聊天动画。TEE 只在原证据卡展示一个本次订单的已验证回执，不增加全新页面或部署展示。可以使用已完成运行的真实片段或标明 Replay 的回放，不把待确认交易剪成已赔付，也不把旧回放称为正在实时执行。

14:10 后不再加功能。视频尽量一次完成；14:40 前确认时长不超过 90 秒、上传后可播放，再留 20 分钟提交仓库与凭证。

## 常见问答

**为什么和 Arena402 有关？**

目标是在 Arena 的授权和结算步骤增加有资金支持的责任承诺。本场复用步骤与凭证展示，目标是再复用现成 TEE 工具签出本次事故回执；只有来源和证明核对通过才称为 Arena TEE 复用，不宣称生产交易 Agent 后台已经接入。

**谁出钱？**

运营商为自己的服务预存保证金，按条款由该池赔付。本场没有独立保险机构或开放资金市场。

**为什么不直接阻止重复扣款？**

业务去重仍然需要。演示故意注入重复付款，验证执行约束失效后保障如何工作，不代表原 Arena 生产系统存在该漏洞。

**为什么合并故障与保障合约？**

为了在五小时内验证资金闭环。本场不能证明对任意外部 Agent 的独立归责；后续需要独立执行适配和证据核验。

**TEE 证明什么？x402 呢？**

TEE 成功时证明经证明的工作负载签署了这份订单事故材料，验证工具另行核对身份、签名和订单关联；它不自动证明客户端材料真实，也不裁定赔付。若未接入，应直接回答未完成。x402 和生产交易 Agent 留待后续，本场不接。

**会赔交易亏损吗？**

本次只覆盖固定订单的重复扣款。普通行情损失、策略收益和法律责任裁定都不在该保障中。
