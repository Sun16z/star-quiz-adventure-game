# 國小題庫資料

本資料夾放可重用的國小選擇題題庫。遊戲內會從這裡匯入，其他專案也可以直接使用 `public/question-bank/elementary-publishers.json`。`elementary-kangxuan.json` 保留為康軒單版本相容檔。

## 目前收錄

- 版本：康軒、翰林、南一
- 年級：國小一到六年級
- 學期：上學期、下學期
- 科目：國語、英語、數學
- 考次：期中考、期末考
- 題數：216 個分類切片，多數切片 30 題；五下數學期末每出版社 60 題，合計 6570 題
- 加強題：五下數學期末包含 `五下易錯加強`，收錄百分率、折扣成數與時間換算應用

遊戲選單預設提供「綜合版」，會混合國語、英語、數學出題；想加強單科時再選國語、英語或數學。

## JSON 欄位

- `id`：穩定題目 ID，例如 `kx-grade4b-final-math-21`
- `publisher`：版本，`康軒`、`翰林` 或 `南一`
- `grade`：`grade1a` 到 `grade6b`
- `semester`：`a` 上學期，`b` 下學期
- `subject`：`國語`、`英語`、`數學`
- `exam`：`midterm` 或 `final`
- `skill`：題型能力點
- `difficulty`：1 到 4 的相對難度
- `prompt`：題目
- `options`：四個選項
- `answerIndex`：正確選項索引，0 到 3
- `explanation`：解析

## 版權與來源

題目為本專案原創題型，用來對應台灣國小常見段考範圍。`sourceReference` 只記錄分類結構參考來源，沒有複製第三方考卷原文。
