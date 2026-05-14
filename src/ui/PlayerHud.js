import Phaser from "../phaser.js";

export default class PlayerHud {
    constructor(scene, options = {}) {
        this.scene = scene;

        this.marginX = options.x ?? 20;
        this.textY = options.textY ?? 16;
        this.barY = options.barY ?? 46;
        this.barWidth = options.barWidth ?? 220;
        this.barHeight = options.barHeight ?? 18;
        this.depth = options.depth ?? 2000;

        this.currentHp = 100;
        this.maxHp = 100;
        this.destroyed = false;

        this.hpText = scene.add.text(this.marginX, this.textY, "HP: 100/100", {
            fontSize: "20px",
            color: "#ffffff",
            fontStyle: "bold",
        });
        this.hpText.setScrollFactor(0);
        this.hpText.setDepth(this.depth);

        this.hpBarBg = scene.add.graphics();
        this.hpBarFill = scene.add.graphics();
        this.hpBarBg.setScrollFactor(0);
        this.hpBarFill.setScrollFactor(0);
        this.hpBarBg.setDepth(this.depth);
        this.hpBarFill.setDepth(this.depth + 1);

        this.scene.scale.on("resize", this.resizeUI, this);
        this.scene.events.once("shutdown", this.destroy, this);
        this.scene.events.once("destroy", this.destroy, this);

        this.resizeUI(this.scene.scale.gameSize);
    }

    setHp(currentHp, maxHp = this.maxHp) {
        this.currentHp = Math.max(0, currentHp);
        this.maxHp = Math.max(1, maxHp);
        this.render();
    }

    resizeUI(_gameSize) {
        this.hpText.setPosition(this.marginX, this.textY);
        this.render();
    }

    render() {
        const hpRatio = Phaser.Math.Clamp(this.currentHp / this.maxHp, 0, 1);

        this.hpText.setText(`HP: ${this.currentHp}/${this.maxHp}`);

        this.hpBarBg.clear();
        this.hpBarBg.fillStyle(0x000000, 0.75);
        this.hpBarBg.fillRect(this.marginX, this.barY, this.barWidth, this.barHeight);

        this.hpBarFill.clear();
        this.hpBarFill.fillStyle(0xe53935, 1);
        this.hpBarFill.fillRect(
            this.marginX + 2,
            this.barY + 2,
            (this.barWidth - 4) * hpRatio,
            this.barHeight - 4
        );
    }

    destroy() {
        if (this.destroyed) {
            return;
        }

        this.destroyed = true;
        this.scene.scale.off("resize", this.resizeUI, this);

        if (this.hpText) {
            this.hpText.destroy();
            this.hpText = null;
        }

        if (this.hpBarBg) {
            this.hpBarBg.destroy();
            this.hpBarBg = null;
        }

        if (this.hpBarFill) {
            this.hpBarFill.destroy();
            this.hpBarFill = null;
        }
    }
}
