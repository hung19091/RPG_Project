import Phaser from "../phaser.js";

export default class Npc extends Phaser.Physics.Arcade.Sprite {
  static registerAnimations(scene, textureKey, frameWidth, frameHeight, animationPrefix = "npc") {
    if (!scene.textures.exists(textureKey)) {
      return;
    }

    const sourceImage = scene.textures.get(textureKey).getSourceImage();
    const columns = Math.max(1, Math.floor(sourceImage.width / frameWidth));
    const rows = Math.max(1, Math.floor(sourceImage.height / frameHeight));
    const directionOrder = ["down", "left", "right", "up"];

    const getRowIndex = (direction) => {
      const directionIndex = directionOrder.indexOf(direction);
      if (directionIndex < 0) {
        return 0;
      }

      return Math.min(directionIndex, rows - 1);
    };

    const createAnimation = (key, startFrame, endFrame, frameRate, repeat) => {
      if (scene.anims.exists(key)) {
        return;
      }

      scene.anims.create({
        key,
        frames: scene.anims.generateFrameNumbers(textureKey, {
          start: startFrame,
          end: endFrame,
        }),
        frameRate,
        repeat,
      });
    };

    directionOrder.forEach((direction) => {
      const rowIndex = getRowIndex(direction);
      const rowStart = rowIndex * columns;
      const rowEnd = rowStart + columns - 1;

      createAnimation(`${animationPrefix}-walk-${direction}`, rowStart, rowEnd, 8, -1);
      createAnimation(`${animationPrefix}-idle-${direction}`, rowStart, rowStart, 1, -1);
    });
  }

  constructor(scene, x, y, textureKey, options = {}) {
    super(scene, x, y, textureKey, 0);

    scene.add.existing(this);
    scene.physics.add.existing(this);

    this.animationPrefix = options.animationPrefix ?? "npc";
    this.hasAnimations = options.hasAnimations ?? false;
    this.facing = options.facing ?? "down";

    this.body.setImmovable(true);
    this.body.setAllowGravity(false);
    this.body.moves = false;

    if (this.hasAnimations) {
      this.play(`${this.animationPrefix}-idle-${this.facing}`);
    }
  }

  setFacing(direction) {
    this.facing = direction;

    if (this.hasAnimations) {
      this.anims.play(`${this.animationPrefix}-idle-${this.facing}`, true);
    }
  }

  playIdle() {
    if (!this.hasAnimations) {
      return;
    }

    this.anims.play(`${this.animationPrefix}-idle-${this.facing}`, true);
  }
}
