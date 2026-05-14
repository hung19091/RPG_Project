import Phaser from "../phaser.js";

/**
 * UIScene — 純 UI 疊加層（Dual Scene 架構）
 *
 * 此場景永遠疊在遊戲場景正上方，camera 保持預設不縮放，
 * 因此所有 UI 元素都以「螢幕座標」定位，不受遊戲世界 zoom 影響。
 *
 * 公開 API（供遊戲場景呼叫）：
 *   openDialogue(lines)   — 開啟對話框
 *   advanceDialogue()     — 推進一行，返回 true 表示對話仍在進行
 *   closeDialogue()       — 強制關閉對話框
 *   isDialogueOpen()      — 查詢對話框是否開啟
 *   setPlayerHp(cur, max) — 更新 HP 顯示
 */
export default class UIScene extends Phaser.Scene {
    constructor() {
        super({ key: "UIScene" });

        // ── 對話框 ──────────────────────────────────────────────
        this.dlgLines = [];
        this.dlgIndex = 0;
        this.dlgVisible = false;

        this.dlgMarginX = 20;
        this.dlgMarginBottom = 20;
        this.dlgHeight = 180;  // 增加高度以容納換行文字
        this.dlgMinWidth = 280;

        // ── PlayerHud ───────────────────────────────────────────
        this.hudMarginX = 20;
        this.hudTextY = 16;
        this.hudBarY = 46;
        this.hudBarWidth = 220;
        this.hudBarHeight = 18;

        this.currentHp = 100;
        this.maxHp = 100;
    }

    /**
     * 由 BaseScene 以 this.scene.launch('UIScene', data) 傳入初始 HP。
     */
    init(data) {
        if (typeof data?.initialHp === "number") {
            this.currentHp = data.initialHp;
        }
        if (typeof data?.maxHp === "number") {
            this.maxHp = data.maxHp;
        }
    }

    create() {
        this._createDialogueBox();
        this._createPlayerHud();

        this.scale.on("resize", this.onResize, this);
        this.onResize(this.scale.gameSize);
    }

    // ════════════════════════════════════════════════════════════
    //  私有：建立物件
    // ════════════════════════════════════════════════════════════

    _createDialogueBox() {
        const { width, height } = this.scale;
        const boxW = Math.max(this.dlgMinWidth, width - this.dlgMarginX * 2);
        const boxY = height - this.dlgHeight - this.dlgMarginBottom;

        this.dlgBg = this.add
            .rectangle(0, 0, boxW, this.dlgHeight, 0x000000, 0.7)
            .setOrigin(0, 0);

        // 維護提示：目前頭像以色塊表示。
        // 改圖片頭像時：改成 this.add.image(...)，並在 _renderLine() 切換 texture。
        this.dlgAvatar = this.add
            .rectangle(16, 16, 64, 64, 0xff0000, 1)
            .setOrigin(0, 0);

        this.dlgName = this.add.text(96, 14, "", {
            fontFamily: "Arial, sans-serif",
            fontSize: "24px",
            color: "#ffffff",
            fontStyle: "bold",
            padding: { top: 4, bottom: 4 },
        });

        const initialWrapW = Math.max(60, boxW - 108);
        this.dlgBody = this.add.text(96, 48, "", {
            fontFamily: "Arial, sans-serif",
            fontSize: "18px",
            color: "#f5f5f5",
            wordWrap: { width: initialWrapW, useAdvancedWrap: true },
            padding: { top: 4, bottom: 4 },
        });

        this.dlgContainer = this.add.container(this.dlgMarginX, boxY, [
            this.dlgBg,
            this.dlgAvatar,
            this.dlgName,
            this.dlgBody,
        ]);
        this.dlgContainer.setDepth(1000);
        this.dlgContainer.setVisible(false);
    }

    _createPlayerHud() {
        this.hpText = this.add
            .text(this.hudMarginX, this.hudTextY, "HP: 100/100", {
                fontFamily: "Arial, sans-serif",
                fontSize: "24px",
                color: "#ffffff",
                fontStyle: "bold",
            })
            .setDepth(2000);

        this.hpBarBg = this.add.graphics().setDepth(2000);
        this.hpBarFill = this.add.graphics().setDepth(2001);

        this._renderHud();
    }

    // ════════════════════════════════════════════════════════════
    //  Resize 自適應（確保 UI 永遠貼在螢幕正確位置）
    // ════════════════════════════════════════════════════════════

    onResize(gameSize) {
        const { width, height } = gameSize;

        // 對話框重新定位
        const boxW = Math.max(this.dlgMinWidth, width - this.dlgMarginX * 2);
        const boxY = height - this.dlgHeight - this.dlgMarginBottom;
        // textX=96，右邊送 12px，所以有效文字寬 = boxW - 96 - 12
        const wrapW = Math.max(60, boxW - 108);
        this.dlgContainer.setPosition(this.dlgMarginX, boxY);
        this.dlgBg.setSize(boxW, this.dlgHeight);
        this.dlgBody.setWordWrapWidth(wrapW, true);

        // HUD 重新定位（固定左上角）
        this.hpText.setPosition(this.hudMarginX, this.hudTextY);
        this._renderHud();
    }

    // ════════════════════════════════════════════════════════════
    //  公開 API — 對話
    // ════════════════════════════════════════════════════════════

    /**
     * 開啟對話，傳入對話行陣列 [{ name, dialogue, avatarColor }]。
     * @returns {boolean} 是否成功開啟
     */
    openDialogue(lines) {
        if (!Array.isArray(lines) || lines.length === 0) {
            return false;
        }

        this.dlgLines = lines.slice();
        this.dlgIndex = 0;
        this.dlgVisible = true;
        this.dlgContainer.setVisible(true);
        this._renderLine();
        return true;
    }

    /**
     * 推進一行對話。
     * @returns {boolean} true = 對話仍在進行，false = 對話已結束
     */
    advanceDialogue() {
        if (!this.dlgVisible) {
            return false;
        }

        this.dlgIndex += 1;

        if (this.dlgIndex >= this.dlgLines.length) {
            this.closeDialogue();
            return false;
        }

        this._renderLine();
        return true;
    }

    /** 強制關閉對話框（換場景前呼叫） */
    closeDialogue() {
        this.dlgVisible = false;
        this.dlgContainer.setVisible(false);
    }

    /** @returns {boolean} */
    isDialogueOpen() {
        return this.dlgVisible;
    }

    // ════════════════════════════════════════════════════════════
    //  公開 API — HP HUD
    // ════════════════════════════════════════════════════════════

    /**
     * @param {number} current
     * @param {number} max
     */
    setPlayerHp(current, max) {
        this.currentHp = Math.max(0, current);
        this.maxHp = Math.max(1, max);
        this._renderHud();
    }

    // ════════════════════════════════════════════════════════════
    //  私有：渲染
    // ════════════════════════════════════════════════════════════

    _renderLine() {
        const line = this.dlgLines[this.dlgIndex];
        if (!line) {
            return;
        }

        this.dlgAvatar.fillColor = line.avatarColor ?? 0xffffff;
        this.dlgName.setText(line.name ?? "");
        this.dlgBody.setText(line.dialogue ?? "");
    }

    _renderHud() {
        const ratio = Phaser.Math.Clamp(this.currentHp / this.maxHp, 0, 1);

        this.hpText.setText(`HP: ${this.currentHp}/${this.maxHp}`);

        this.hpBarBg.clear();
        this.hpBarBg.fillStyle(0x000000, 0.75);
        this.hpBarBg.fillRect(
            this.hudMarginX,
            this.hudBarY,
            this.hudBarWidth,
            this.hudBarHeight
        );

        this.hpBarFill.clear();
        this.hpBarFill.fillStyle(0xe53935, 1);
        this.hpBarFill.fillRect(
            this.hudMarginX + 2,
            this.hudBarY + 2,
            (this.hudBarWidth - 4) * ratio,
            this.hudBarHeight - 4
        );
    }
}
