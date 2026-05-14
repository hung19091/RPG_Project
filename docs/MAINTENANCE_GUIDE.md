# RPG 專案維護引導

本文件整理「要改哪裡」的快速索引，方便後續擴充。

## 1) 新增或替換走路圖（玩家 / NPC）

### 主要修改點
- 場景基底：src/scenes/BaseScene.js
- 角色動畫：src/entities/Player.js、src/entities/Npc.js

### 步驟
1. 放入素材檔
   - 玩家：assets/player.png
   - NPC：assets/npc.png

2. 調整每幀尺寸
   - 在 BaseScene 建構子修改：
     - `this.playerFrameWidth` / `this.playerFrameHeight`
     - `this.npcFrameWidth` / `this.npcFrameHeight`

3. 啟用精靈圖（場景設定）
   - 在 GrassScene / DesertScene 的 `super(..., { ... })` 設定：
     - `usePlayerSprite: true`
     - `useNpcSprite: true`（若要 NPC 也用 spritesheet）

4. 動畫切行規則（重要）
   - Player/Npc 的 `registerAnimations()` 使用方向順序：
     - `down`, `left`, `right`, `up`
   - 若你的素材列順序不同，請修改：
     - src/entities/Player.js 的 `directionOrder`
     - src/entities/Npc.js 的 `directionOrder`

---

## 2) 新增對話內容

### 主要修改點
- 對話資料：src/data/dialogues/grassDialogue.js、src/data/dialogues/desertDialogue.js
- UI 渲染：src/ui/DialogueUI.js

### 步驟
1. 在對話資料檔中調整台詞陣列
   - 單筆格式（目前）：
     - `{ name, dialogue, avatarColor }`

2. 若要每個場景有不同 NPC 劇情
   - 建立新的對話資料檔，並在對應場景 `import` 後傳給 `dialogueLines`。

---

## 3) 對話頭像由色塊改為圖片

### 目前狀態
- DialogueUI 使用 `rectangle` 代表頭像，透過 `avatarColor` 切換顏色。

### 改圖像頭像建議
1. 預載頭像圖片（建議在場景 preload）
2. 將 src/ui/DialogueUI.js 中的 `this.avatar` 改為 `image` 或 `sprite`
3. 對話資料新增 `avatarKey` 欄位，例如：
   - `{ name: "小明", dialogue: "...", avatarKey: "avatar_xiaoming" }`
4. 在 `renderCurrentLine()` 讀 `line.avatarKey` 切換貼圖

---

## 4) 新增場景（例如雪地）

### 步驟
1. 新增場景檔（建議繼承 BaseScene）
2. 在 `super("SceneKey", { ... })` 設定：
   - `theme`
   - `dialogueLines`（建議從 `src/data/dialogues/*` 匯入）
   - `nextSceneKey`
   - `slimeCount`
3. 到 src/main.js 註冊場景
4. 於前一個場景設定 `nextSceneKey` 指向新場景

---

## 5) 戰鬥與怪物數量調整

### 主要修改點
- src/scenes/BaseScene.js

### 常用參數
- `this.attackDamage`
- `this.playerTouchDamage`
- `this.attackCooldown`
- 場景設定中的 `slimeCount`

---

## 6) 手機觸控操作（移動 / 攻擊 / 對話）

### 主要修改點
- 觸控控制器：src/ui/TouchControls.js
- 輸入整合：src/scenes/BaseScene.js
- 鍵盤輸入延伸：src/entities/Player.js

### 目前功能
- 左下角方向鍵：移動
- 右下角 ATK：攻擊
- 右下角 TALK：對話 / 進下一句 / 離開後切換場景

### 若要新增按鈕
1. 在 `src/ui/TouchControls.js` 加新的 action 按鈕
2. 在 `BaseScene.update()` 裡讀取 `consumeAction()`
3. 若是移動類按鈕，加入 `moveState`

### 若要調整按鈕位置
- 修改 `src/ui/TouchControls.js` 內的座標常數：
   - `dpadBaseX`, `dpadBaseY`
   - `actionBaseX`, `actionBaseY`

---

## 7) 快速檢查清單（改完必看）

1. 角色是否可正常移動與播放對應方向動畫
2. 與 NPC 對話是否能正常開啟/推進/關閉
3. 對話結束是否正確切換場景
4. 史萊姆是否正常生成、移動、受傷與顯示血條
5. 缺素材時是否仍可 fallback 顯示（避免整個角色消失）
