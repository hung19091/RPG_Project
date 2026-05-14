import Phaser from "../phaser.js";

export default class TouchControls {
    constructor(scene) {
        this.scene = scene;
        this.moveState = {
            left: false,
            right: false,
            up: false,
            down: false,
        };

        this.actionQueue = {
            attack: false,
            talk: false,
        };

        this.isVisible = false;
        this.container = null;
        this.buttons = {};

        this.create();
    }

    create() {
        const width = this.scene.scale.width;
        const height = this.scene.scale.height;

        this.container = this.scene.add.container(0, 0);
        this.container.setScrollFactor(0);
        this.container.setDepth(5000);

        const buttonStyle = {
            fontSize: "20px",
            color: "#ffffff",
            fontStyle: "bold",
        };

        const createButton = (x, y, widthValue, heightValue, label, fillColor) => {
            const buttonBg = this.scene.add.rectangle(x, y, widthValue, heightValue, fillColor, 0.75)
                .setStrokeStyle(2, 0xffffff, 0.65)
                .setOrigin(0.5, 0.5)
                .setScrollFactor(0)
                .setInteractive({ useHandCursor: true });

            const buttonText = this.scene.add.text(x, y, label, buttonStyle)
                .setOrigin(0.5, 0.5)
                .setScrollFactor(0);

            this.container.add([buttonBg, buttonText]);
            return { buttonBg, buttonText };
        };

        const dpadBaseX = 110;
        const dpadBaseY = height - 135;
        const dpadSize = 52;
        const dpadGap = 10;

        this.buttons.left = createButton(dpadBaseX - dpadSize - dpadGap, dpadBaseY, dpadSize, dpadSize, "←", 0x222222);
        this.buttons.right = createButton(dpadBaseX + dpadSize + dpadGap, dpadBaseY, dpadSize, dpadSize, "→", 0x222222);
        this.buttons.up = createButton(dpadBaseX, dpadBaseY - dpadSize - dpadGap, dpadSize, dpadSize, "↑", 0x222222);
        this.buttons.down = createButton(dpadBaseX, dpadBaseY + dpadSize + dpadGap, dpadSize, dpadSize, "↓", 0x222222);

        const actionBaseX = width - 95;
        const actionBaseY = height - 105;
        const actionSize = 72;

        this.buttons.attack = createButton(actionBaseX, actionBaseY, actionSize, actionSize, "ATK", 0xc0392b);
        this.buttons.talk = createButton(actionBaseX - 92, actionBaseY + 18, 66, 48, "TALK", 0x2980b9);

        this.bindMoveButton(this.buttons.left.buttonBg, "left");
        this.bindMoveButton(this.buttons.right.buttonBg, "right");
        this.bindMoveButton(this.buttons.up.buttonBg, "up");
        this.bindMoveButton(this.buttons.down.buttonBg, "down");

        this.bindActionButton(this.buttons.attack.buttonBg, "attack");
        this.bindActionButton(this.buttons.talk.buttonBg, "talk");

        this.setVisible(false);
    }

    bindMoveButton(button, direction) {
        button.on("pointerdown", () => {
            this.moveState[direction] = true;
        });

        button.on("pointerup", () => {
            this.moveState[direction] = false;
        });

        button.on("pointerout", () => {
            this.moveState[direction] = false;
        });

        button.on("pointerupoutside", () => {
            this.moveState[direction] = false;
        });
    }

    bindActionButton(button, actionName) {
        button.on("pointerdown", () => {
            this.actionQueue[actionName] = true;
        });
    }

    consumeAction(actionName) {
        if (!this.actionQueue[actionName]) {
            return false;
        }

        this.actionQueue[actionName] = false;
        return true;
    }

    getMovementState() {
        return this.moveState;
    }

    setVisible(visible) {
        this.isVisible = visible;
        if (this.container) {
            this.container.setVisible(visible);
        }
    }

    destroy() {
        if (this.container) {
            this.container.destroy(true);
            this.container = null;
        }
    }
}
