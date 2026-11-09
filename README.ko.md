# ArenaCover — 에이전트가 실수하면 누가 책임질까요?

[English](./README.md) · [한국어](./README.ko.md) · [中文](./README.zh-CN.md)

**자율 실행에는 책임이 필요합니다.** ArenaCover는 에이전트 결제의 실행 오류를 사전에 예치한 자본으로 보상하는 프로토타입입니다. 조건을 정하고, 보상금을 확보하고, 중복 결제를 검증한 뒤 초과 금액을 한 번만 지급합니다.

[라이브 데모](https://arenacover-seoul-20261109.vercel.app) · [60초 영어 영상](https://arenacover-seoul-20261109.vercel.app/demo/ArenaCover_Demo60s.mp4)

## 해커톤 MVP

**Injective EVM Testnet(chain ID 1439)**을 대상으로 개발했으며, 첫 연동 대상은 Arena402입니다. 현재 영상과 공개 리플레이는 **로컬 EVM(31337)의 실제 스마트 컨트랙트 거래**입니다. 테스트넷 배포 스크립트는 준비했으나 공개 테스트넷 배포는 아직 완료하지 않았습니다.

1. 운영자가 100 DemoUSD를 예치합니다.
2. 사용자는 1 DemoUSD의 보장료를 내고, 10 DemoUSD의 보상 한도를 확보합니다.
3. 주문은 10 DemoUSD 결제를 한 번만 허용하지만, 오류 주입기가 두 번째 결제를 실행합니다.
4. 사용자 잔액은 100 → 99 → 89 → 79로 변합니다.
5. 컨트랙트가 초과 결제를 확인하고 10을 보상합니다. 사용자 잔액은 89, 풀은 90, 예약액은 0이 됩니다.

모든 단계에 거래 영수증이 있습니다. 호스팅된 페이지는 명시된 읽기 전용 리플레이이며, 로컬 실행에서는 직접 전 과정을 수행할 수 있습니다. 토큰에는 금전적 가치가 없습니다.

## Arena402 과거 테스트넷 지갑

네트워크: **Injective EVM Testnet · Chain ID 1439**.

| 역할 | 주소 | 과거 용도 |
| --- | --- | --- |
| Facilitator | `0x7fB8d49698E40656F727511Da6251D3e6dfFaD50` | Faucet 테스트 토큰 수령, 컨트랙트 배포 및 Gas 지불 |
| Seller | `0x93Dafa6bFa2428CA033e8d6Fe9C94e40d1AC8754` | 거래 테스트의 판매자 수령 지갑 |

출처는 기존 `agent-arena/settlement/deployments.json`이며, Facilitator의 참조 위치는 19행입니다. 소유자가 과거 주소를 다시 확인했습니다. **이번 문서 업데이트에서는 현재 잔액을 다시 조회하지 않았습니다.** 현재 ArenaCover 배포 정보는 [`public/deployment.json`](./public/deployment.json)에 있습니다.

[기계 판독용 주소 기록](./docs/arena402-historical-testnet-wallets.json) · [이전 잔액 스냅샷과 리소스 설명](./RESOURCE_STATUS.md)

## 로컬 실행

Node.js 22 이상이 필요합니다.

```bash
npm ci
npm run compile:contracts
npm run chain
```

로컬 체인을 유지하고 다른 터미널에서 실행합니다.

```bash
npm run deploy:local
npm run dev
```

http://127.0.0.1:3000 에서 샌드박스 지갑 연결 → 보장 활성화 → 오류 시나리오 → 검증 및 보상 순으로 진행합니다. 배포당 주문 한 개를 지원하며 재배포로 새 주문을 준비합니다. 샌드박스는 공개 개발용 니모닉을 사용하므로 실제 자산을 보내면 안 됩니다.

## 검증과 범위

`npm test`: 컨트랙트 동작 6개 및 서명 네트워크 방어 3개 테스트. `npm run typecheck`, `npm run build`: 프런트엔드 검사. 브라우저 종단 검사는 영수증 4개와 최종 잔액을 확인합니다.

이 데모의 중복 업무 결제만 보장합니다. 시장 손실이나 수익률을 보장하지 않습니다. 실행과 보상 로직이 하나의 데모 컨트랙트에 있으므로 독립적인 외부 에이전트 오라클이 아닙니다. TEE는 연결되지 않았으며, x402 정산을 구현했다고 주장하지 않습니다. 정식 보험 상품이 아닌 프로토타입입니다.

## 저장소와 증거

Arena402를 fork하지 않은 신규 저장소입니다. 결제 단계와 영수증 설계를 참고했으며 기존 지갑 비밀, 운영 인증 정보 및 인증 서비스를 복사하지 않았습니다.

[검증 기록](./VERIFICATION.md) · [실제 실행 JSON](./public/evidence/run.json) · [컨트랙트](./contracts/ArenaCover.sol) · [PRD](./PRD.md) · [개발 목록](./DEVELOPMENT_TASKS.md) · [TEE 검사](./TEE_CHECK_RESULT.md)

Hermes Agent의 코발트색, 압축 서체와 편집형 레이아웃을 참고했습니다. 방패는 새로 생성한 원본 이미지이며 Barlow Condensed와 IBM Plex Mono(SIL OFL)를 로컬로 사용합니다. Hermes 로고, 상용 시험용 폰트 또는 추적 스크립트는 사용하지 않습니다.

영상 음악: **'Neon' by Scott Buckley - released under CC-BY 4.0. www.scottbuckley.com.au**. 영어 내레이션은 합성 음성입니다. YouTube 업로드 시 영상 설명에 음악 크레딧을 포함하세요. [음원과 라이선스](https://www.scottbuckley.com.au/library/neon/)
