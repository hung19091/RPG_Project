class MainScene extends Phaser.Scene {
  constructor() {
    super("MainScene");

    this.player = null;
    this.npc = null;
    this.cursors = null;
    this.spaceKey = null;
    this.playerSpeed = 220;
    this.defaultPlayerSpeed = 220;
    this.mapWidth = 2000;
    this.mapHeight = 2000;

    // 精靈圖每幀尺寸（未來更換素材尺寸時只需改這裡）
    this.playerFrameWidth = 32;
    this.playerFrameHeight = 32;
    this.npcFrameWidth = 32;
    this.npcFrameHeight = 32;

    this.playerFacing = "down";

    this.dialogueData = [];
    this.currentDialogueIndex = 0;
    this.isDialogueOpen = false;

    this.dialogueContainer = null;
    this.dialogueAvatar = null;
    this.dialogueNameText = null;
    this.dialogueBodyText = null;
  }

  preload() {
    this.load.spritesheet("player_sprite", "assets/player.png", {
      frameWidth: this.playerFrameWidth,
      frameHeight: this.playerFrameHeight,
    });

    this.load.spritesheet("npc_sprite", "assets/npc.png", {
      frameWidth: this.npcFrameWidth,
      frameHeight: this.npcFrameHeight,
    });
  }

  createDirectionalAnimations(textureKey, keyPrefix, frameWidth, frameHeight) {
    const sourceImage = this.textures.get(textureKey).getSourceImage();
    const columns = Math.max(1, Math.floor(sourceImage.width / frameWidth));
    const rows = Math.max(1, Math.floor(sourceImage.height / frameHeight));

    const rowOrder = ["down", "left", "right", "up"];
    const getRowIndex = (direction) => {
      const mappedIndex = rowOrder.indexOf(direction);
      if (mappedIndex === -1) {
        return 0;
      }

      return Math.min(mappedIndex, rows - 1);
    };

    const createAnimIfNeeded = (animKey, startFrame, endFrame, frameRate, repeat) => {
      if (this.anims.exists(animKey)) {
        return;
      }

      this.anims.create({
        key: animKey,
        frames: this.anims.generateFrameNumbers(textureKey, {
          start: startFrame,
          end: endFrame,
        }),
        frameRate,
        repeat,
      });
    };

    rowOrder.forEach((direction) => {
      const row = getRowIndex(direction);
      const rowStart = row * columns;
      const rowEnd = rowStart + (columns - 1);

      createAnimIfNeeded(`${keyPrefix}-walk-${direction}`, rowStart, rowEnd, 8, -1);
      createAnimIfNeeded(`${keyPrefix}-idle-${direction}`, rowStart, rowStart, 1, -1);
    });
  }

  create() {
    // 設定世界邊界
    this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);

    // 生成草地紋理，並以 tileSprite 平鋪整個 2000x2000 世界
    const grassGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    grassGraphics.fillStyle(0x3cb043, 1);
    grassGraphics.fillRect(0, 0, 64, 64);
    grassGraphics.fillStyle(0x36a03b, 1);
    grassGraphics.fillRect(4, 10, 14, 10);
    grassGraphics.fillRect(28, 36, 16, 12);
    grassGraphics.fillRect(46, 8, 12, 16);
    grassGraphics.generateTexture("grass-tile", 64, 64);
    grassGraphics.destroy();

    this.add.tileSprite(0, 0, this.mapWidth, this.mapHeight, "grass-tile").setOrigin(0, 0);

    // 先建立玩家與 NPC 的四方向 walk / idle 動畫
    this.createDirectionalAnimations(
      "player_sprite",
      "player",
      this.playerFrameWidth,
      this.playerFrameHeight
    );
    this.createDirectionalAnimations("npc_sprite", "npc", this.npcFrameWidth, this.npcFrameHeight);

    // 玩家（Physics Sprite）
    this.player = this.physics.add.sprite(
      this.mapWidth / 2,
      this.mapHeight / 2,
      "player_sprite",
      0
    );
    this.player.body.setCollideWorldBounds(true);
    this.player.play("player-idle-down");

    // NPC（Physics Sprite，放在玩家出生點附近）
    this.npc = this.physics.add.sprite(
      this.mapWidth / 2 + 100,
      this.mapHeight / 2,
      "npc_sprite",
      0
    );
    this.npc.body.setImmovable(true);
    this.npc.body.setAllowGravity(false);
    this.npc.body.moves = false;
    this.npc.play("npc-idle-down");

    // 玩家與 NPC 靜態碰撞，避免穿過
    this.physics.add.collider(this.player, this.npc);

    // 對話資料
    this.dialogueData = [
      {
        name: "小明",
        dialogue: "你好！冒險者！",
        avatarColor: 0xff0000,
      },
      {
        name: "旁白",
        dialogue: "（看來他似乎需要幫忙...）",
        avatarColor: 0xaaaaaa,
      },
      {
        name: "小明",
        dialogue: "可以請你幫我消滅附近的史萊姆嗎？",
        avatarColor: 0xff0000,
      },
    ];

    // 對話 UI（固定在螢幕下方）
    const uiWidth = this.scale.width - 40;
    const uiHeight = 140;
    const uiX = 20;
    const uiY = this.scale.height - uiHeight - 20;

    const dialogueBg = this.add
      .rectangle(0, 0, uiWidth, uiHeight, 0x000000, 0.7)
      .setOrigin(0, 0);

    this.dialogueAvatar = this.add
      .rectangle(16, 16, 64, 64, 0xff0000, 1)
      .setOrigin(0, 0);

    this.dialogueNameText = this.add.text(96, 14, "", {
      fontSize: "22px",
      color: "#ffffff",
      fontStyle: "bold",
      //fontFamily: '"Microsoft JhengHei", "Apple LiGothic Medium", sans-serif', // 指定微軟正黑體或蘋果黑體
      padding: { top: 4, bottom: 4 }, // 確保文字上方有 4 像素緩衝，不被切掉
    });

    this.dialogueBodyText = this.add.text(96, 52, "", {
      fontSize: "20px",
      color: "#f5f5f5",
      wordWrap: { width: uiWidth - 120 },
      //fontFamily: '"Microsoft JhengHei", "Apple LiGothic Medium", sans-serif', // 指定微軟正黑體或蘋果黑體
      padding: { top: 4, bottom: 4 }, // 確保文字上方有 4 像素緩衝，不被切掉
    });

    this.dialogueContainer = this.add.container(uiX, uiY, [
      dialogueBg,
      this.dialogueAvatar,
      this.dialogueNameText,
      this.dialogueBodyText,
    ]);
    this.dialogueContainer.setScrollFactor(0);
    this.dialogueContainer.setVisible(false);

    // 攝影機邊界與世界一致，並平滑跟隨玩家
    this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);

    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      if (this.isDialogueOpen) {
        this.advanceDialogue();
      } else {
        const distanceToNpc = Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          this.npc.x,
          this.npc.y
        );

        if (distanceToNpc < 60) {
          this.openDialogue();
        }
      }
    }

    if (this.isDialogueOpen) {
      this.player.body.setVelocity(0, 0);
      this.player.anims.play(`player-idle-${this.playerFacing}`, true);
      return;
    }

    let velocityX = 0;
    let velocityY = 0;

    // 左右移動
    if (this.cursors.left.isDown) {
      velocityX = -this.playerSpeed;
    } else if (this.cursors.right.isDown) {
      velocityX = this.playerSpeed;
    }

    // 上下移動
    if (this.cursors.up.isDown) {
      velocityY = -this.playerSpeed;
    } else if (this.cursors.down.isDown) {
      velocityY = this.playerSpeed;
    }

    this.player.body.setVelocity(velocityX, velocityY);

    // 斜向移動速度正規化，避免比直線移動更快
    if (velocityX !== 0 && velocityY !== 0) {
      this.player.body.velocity.normalize().scale(this.playerSpeed);
    }

    // 玩家四方向動畫與 idle 狀態
    if (velocityX < 0) {
      this.playerFacing = "left";
      this.player.anims.play("player-walk-left", true);
    } else if (velocityX > 0) {
      this.playerFacing = "right";
      this.player.anims.play("player-walk-right", true);
    } else if (velocityY < 0) {
      this.playerFacing = "up";
      this.player.anims.play("player-walk-up", true);
    } else if (velocityY > 0) {
      this.playerFacing = "down";
      this.player.anims.play("player-walk-down", true);
    } else {
      this.player.anims.play(`player-idle-${this.playerFacing}`, true);
    }
  }

  openDialogue() {
    this.isDialogueOpen = true;
    this.currentDialogueIndex = 0;
    this.playerSpeed = 0;
    this.dialogueContainer.setVisible(true);
    this.renderDialogueLine();
  }

  advanceDialogue() {
    this.currentDialogueIndex += 1;

    if (this.currentDialogueIndex >= this.dialogueData.length) {
      this.closeDialogue();
      return;
    }

    this.renderDialogueLine();
  }

  closeDialogue() {
    this.isDialogueOpen = false;
    this.playerSpeed = this.defaultPlayerSpeed;
    this.dialogueContainer.setVisible(false);
  }

  renderDialogueLine() {
    const line = this.dialogueData[this.currentDialogueIndex];
    this.dialogueAvatar.fillColor = line.avatarColor;
    this.dialogueNameText.setText(line.name);
    this.dialogueBodyText.setText(line.dialogue);
  }
}

const config = {
  type: Phaser.AUTO,
  parent: "game-container",
  width: 800,
  height: 600,
  backgroundColor: "#000000",
  physics: {
    default: "arcade",
    arcade: {
      debug: false,
    },
  },
  scene: [MainScene],
};

new Phaser.Game(config);
