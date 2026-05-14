import Phaser from "../phaser.js";

export default class DialogueUI {
  constructor(scene, options = {}) {
    this.scene = scene;
    this.lines = [];
    this.currentIndex = 0;
    this.visible = false;

    const width = options.width ?? scene.scale.width - 40;
    const height = options.height ?? 140;
    const x = options.x ?? 20;
    const y = options.y ?? scene.scale.height - height - 20;

    const background = scene.add.rectangle(0, 0, width, height, 0x000000, 0.7).setOrigin(0, 0);
    // 維護提示：目前頭像使用「色塊」表示。
    // 未來若改為圖片頭像，可在此改成 scene.add.image(...) 或 scene.add.sprite(...)
    // 並在 renderCurrentLine() 依 line.avatarKey 切換 texture。
    this.avatar = scene.add.rectangle(16, 16, 64, 64, 0xff0000, 1).setOrigin(0, 0);
    this.nameText = scene.add.text(96, 14, "", {
      fontSize: "22px",
      color: "#ffffff",
      fontStyle: "bold",
      padding: { top: 4, bottom: 4 },
    });
    this.bodyText = scene.add.text(96, 52, "", {
      fontSize: "20px",
      color: "#f5f5f5",
      wordWrap: { width: width - 120 },
      padding: { top: 4, bottom: 4 },
    });

    this.container = scene.add.container(x, y, [background, this.avatar, this.nameText, this.bodyText]);
    this.container.setScrollFactor(0);
    this.container.setVisible(false);
    this.container.setDepth(1000);
  }

  setDialogueData(lines) {
    // 維護提示：每筆資料目前支援 { name, dialogue, avatarColor }
    // 可擴充欄位：avatarKey、voiceKey、emotion、sfx 等。
    this.lines = Array.isArray(lines) ? lines.slice() : [];
    this.currentIndex = 0;
  }

  isOpen() {
    return this.visible;
  }

  open(lines) {
    if (lines) {
      this.setDialogueData(lines);
    }

    if (this.lines.length === 0) {
      return false;
    }

    this.visible = true;
    this.currentIndex = 0;
    this.container.setVisible(true);
    this.renderCurrentLine();
    return true;
  }

  advance() {
    if (!this.visible) {
      return false;
    }

    this.currentIndex += 1;

    if (this.currentIndex >= this.lines.length) {
      this.close();
      return false;
    }

    this.renderCurrentLine();
    return true;
  }

  close() {
    this.visible = false;
    this.container.setVisible(false);
  }

  renderCurrentLine() {
    const line = this.lines[this.currentIndex];
    if (!line) {
      return;
    }

    // 維護提示：目前根據 avatarColor 切換頭像顏色。
    // 若改成圖片頭像：
    // 1) preload 對應圖片
    // 2) 在這裡判斷 line.avatarKey，呼叫 this.avatar.setTexture(line.avatarKey)
    // 3) 並將 this.avatar 由 rectangle 改成 image/sprite。
    this.avatar.fillColor = line.avatarColor ?? 0xffffff;
    this.nameText.setText(line.name ?? "");
    this.bodyText.setText(line.dialogue ?? "");
  }
}
