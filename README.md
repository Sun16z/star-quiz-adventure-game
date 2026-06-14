# 星願問答大冒險

可愛 3D 倖存者玩法 + 國小題庫問答。玩家選擇公主角色，在夢境小鎮裡移動、閃避、收集星星升級；每次想拿寶物前，要先答對一題，答對才會獲得能力強化。

線上遊玩：<https://sun16z.github.io/star-quiz-adventure-game/>

## 目前版本

- 題庫：台灣國小康軒版一到六年級，上下學期，國語/英語/數學，期中/期末共 432 題。
- 角色：原創公主風格，含星願系與蜜桃系造型。
- 小怪與王：可愛夢境小夥伴，圖鑑顯示模型縮圖與招式提示。
- 升級：三選一寶物，答對題目才取得。
- 操作：桌機 WASD / 方向鍵移動、空白鍵跳躍；手機使用虛擬搖桿與跳躍鈕。
- 音效：Web Audio 程式合成，含答對、答錯、寶物入手、戰鬥與背景音樂。

## 遊戲流程

1. 選擇年級學期、科目、期中/期末題庫。
2. 選擇公主角色與難度。
3. 進入夢境小鎮，收集星星升級。
4. 升級時先選寶物，再答題挑戰。
5. 答對取得寶物並回到戰場，答錯可換一題再挑戰。
6. 依序通過夢境大夥伴，完成冒險。

## 技術

- Vue 3 + TypeScript
- Babylon.js 9
- Vite + Tailwind CSS v4
- Web Audio 程式合成音樂與音效
- GitHub Pages 自動部署

## 題庫重用

- App 內部匯入：`src/question-bank/elementary-kangxuan.ts`
- 外部 JSON：`public/question-bank/elementary-kangxuan.json`
- 線上 JSON：`https://sun16z.github.io/star-quiz-adventure-game/question-bank/elementary-kangxuan.json`

題庫欄位包含 `grade`、`semester`、`subject`、`exam`、`skill`、`prompt`、`options`、`answerIndex`、`explanation`。題目為本專案原創題型，分類結構參考米蘭老師教育資訊室的國小題庫頁面。

## 開發

```bash
pnpm install
pnpm dev
pnpm build
pnpm preview
```

GitHub Pages build 會使用 `VITE_BASE=/star-quiz-adventure-game/`，設定在 `.github/workflows/deploy-pages.yml`。
