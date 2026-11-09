# ArenaCover 验证记录

日期：2026 年 11 月 9 日。

## 已验证

- Solidity 以 Paris EVM 目标编译，使用 OpenZeppelin ERC20、SafeERC20 和 ReentrancyGuard。
- 六组本地合约测试通过：完整赔付、正常不赔、重复及乱序调用、角色约束、资金不足、失败转账原子回滚。
- 浏览器从操作页执行四笔实际本地 EVM 交易，全部确认；余额 100→99→89→79→89。
- 池余额由 100 到 90，赔付后 reserved 为零；正常和重复付款都不进入赔付池。
- Playwright Chromium 检查页面无未捕获异常，390px 宽度没有横向溢出。
- TypeScript 检查、Next.js 生产构建通过。
- 三组网络限制测试通过：本地开发签名拒绝远程 RPC、拒绝公共链 ID；测试网脚本在加载密钥前拒绝主网。
- 模拟已确认赔付但页面丢失回执缓存，刷新后恢复第四份凭证并清除 pending 的浏览器检查通过。
- 两项独立只读审查发现的回执恢复和运营商地址展示问题已修复并经审查确认；脚本本地签名网络限制同步补齐。
- npm 生产依赖审计当前为零已报告漏洞；开发依赖未据此宣称无漏洞。
- 公开仓库为新建非 fork 仓库，地址 https://github.com/sunruize93-cmyk/arenacover-seoul-20261109 。
- 公开页面 https://arenacover-seoul-20261109.vercel.app 返回 HTTP 200；最终远程浏览器检查与视频交付状态见交付文档。

浏览器证据位于 public/evidence/run.json，包含网络、部署、订单和实际交易哈希；截图位于 test-results。以证据文件所列部署为准，重复准备演示会产生新的合约和订单。

## 完成层级与限制

当前已验证本地 EVM 交互版本。TEE 为 Not connected，原因见 TEE_CHECK_RESULT.md。该原型没有生产 Agent Runtime、x402、真实交易所或独立承保机构。

执行与保障在同一测试合约中，故障由用户明确触发；测试证明固定资金闭环，不证明对任意外部 Agent 的独立归责。DemoUSD 无真实货币价值。

公开网页若读取本地链的记录，只能展示明确标识的 Replay；远程网页不会连接用户电脑的 127.0.0.1，也不会使用本地开发钱包签署远程交易。

## Final visual delivery

- Original chrome guardian artwork and cobalt frontend, adapted from the requested Hermes reference.
- English, Korean and Chinese README entry points.
- Final capture: 1920×1080, four successful contract receipts, final balances 89/90, zero page errors.
- 390px viewport: no horizontal overflow.
- Film: 90 seconds at 30fps; Bodoni Moda titles, licensed music and disclosed synthesized English narration. HyperFrames check passes with zero errors in lint, runtime, layout, contrast and audio.
- User explicitly deferred testnet funding. No public Injective deployment is claimed; the toolchain targets EVM testnet 1439 and recorded evidence is local 31337.

See [visual adaptation record](./VISUAL_ADAPTATION.md) for the intentionally approximate reference comparison.

Final MP4 verified with ffprobe: H.264, 1920×1080, 30 fps, AAC, duration 90.000 seconds, 23,639,515 bytes. Decoded 29s fault and 54s payout frames inspected. Audio mean -17.7 dB and peak -1.6 dB; no digital clipping detected. Audio presence and levels were checked computationally, not subjectively listened to.

## Faster 60-second revision

Supersedes the earlier 90-second delivery: Bebas Neue title/number typography,17 shots,16 animated cover/uncover transitions, iris reveals and camera punches. All scene midpoint sheets, phone sheet, seam samples and decoded final frames were inspected. Source clips preserve natural transaction timing.

Final MP4: H.264/AAC,1920×1080,30fps,60.000s,22,430,563 bytes. Mean audio -17.1dB,peak -1.5dB. HyperFrames check passes with zero errors. Public link ends Demo60s.mp4; the previous90s URL redirects to it.

## 75-second music revision (current)

Supersedes60s:21 main shots,20 animated bridges,new terms/operator-capital/replay-protection beats. Active music is Pursuit by Scott Buckley(CC BY4.0),source78–153s,with automated narration ducking and1.5s fade-out. License/credit updated in film,three README files and source manifest.

ffprobe:H264/AAC,1920×1080,30fps,75.000s,23,632,950bytes. Audio peak -1.0dB. HyperFrames check passes with zero errors. Scene midpoint contact sheets and seam samples inspected; final39s payout frame decoded. Audio measured,not subjectively listened to.
