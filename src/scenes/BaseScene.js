import Phaser from "../phaser.js";
import Player from "../entities/Player.js";
import Npc from "../entities/Npc.js";
import DialogueUI from "../ui/DialogueUI.js";

export default class BaseScene extends Phaser.Scene {
  constructor(sceneKey, sceneOptions = {}) {
    super(sceneKey);

    this.sceneOptions = {
      theme: "grass",
      nextSceneKey: null,
      dialogueLines: [],
      slimeCount: 3,
      usePlayerSprite: true,
      useNpcSprite: false,
      ...sceneOptions,
    };

    this.mapWidth = 2000;
    this.mapHeight = 2000;

    this.playerFrameWidth = 32;
    this.playerFrameHeight = 32;
    this.npcFrameWidth = 32;
    this.npcFrameHeight = 32;

    this.maxPlayerHp = 100;
    this.playerHp = 100;
    this.playerInvulnerableUntil = 0;
    this.attackDamage = 20;
    this.playerTouchDamage = 10;
    this.attackCooldown = 250;
    this.nextAttackTime = 0;

    this.player = null;
    this.npc = null;
    this.dialogueUI = null;
    this.slimes = [];
    this.attackHitbox = null;

    this.playerHpText = null;
    this.playerHpBarBg = null;
    this.playerHpBarFill = null;

    this.cursors = null;
    this.spaceKey = null;
    this.attackKey = null;
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

  create() {
    this.physics.world.setBounds(0, 0, this.mapWidth, this.mapHeight);
    this.createBackground();
    this.createActors();
    this.createDialogueUI();
    this.createPlayerHud();
    this.createSlimePack();
    this.createInput();
    this.createCamera();
    this.createSlimeMovementTimer();
  }

  createBackground() {
    const textureKey = this.sceneOptions.theme === "desert" ? "desert-tile" : "grass-tile";

    if (!this.textures.exists(textureKey)) {
      const graphics = this.make.graphics({ x: 0, y: 0, add: false });

      if (this.sceneOptions.theme === "desert") {
        graphics.fillStyle(0xd8b56a, 1);
        graphics.fillRect(0, 0, 64, 64);
        graphics.fillStyle(0xcda65b, 1);
        graphics.fillRect(8, 6, 16, 10);
        graphics.fillRect(34, 18, 20, 12);
        graphics.fillRect(20, 40, 22, 14);
      } else {
        graphics.fillStyle(0x3cb043, 1);
        graphics.fillRect(0, 0, 64, 64);
        graphics.fillStyle(0x36a03b, 1);
        graphics.fillRect(4, 10, 14, 10);
        graphics.fillRect(28, 36, 16, 12);
        graphics.fillRect(46, 8, 12, 16);
      }

      graphics.generateTexture(textureKey, 64, 64);
      graphics.destroy();
    }

    this.add.tileSprite(0, 0, this.mapWidth, this.mapHeight, textureKey).setOrigin(0, 0);
  }

  createFallbackTexture(textureKey, color, width, height) {
    if (this.textures.exists(textureKey)) {
      return textureKey;
    }

    const fallbackGraphics = this.make.graphics({ x: 0, y: 0, add: false });
    fallbackGraphics.fillStyle(color, 1);
    fallbackGraphics.fillRect(0, 0, width, height);
    fallbackGraphics.generateTexture(textureKey, width, height);
    fallbackGraphics.destroy();

    return textureKey;
  }

  createActors() {
    const playerSheetAvailable = this.sceneOptions.usePlayerSprite && this.textures.exists("player_sprite");
    const npcSheetAvailable = this.sceneOptions.useNpcSprite && this.textures.exists("npc_sprite");

    const playerTextureKey = playerSheetAvailable
      ? "player_sprite"
      : this.createFallbackTexture(
          "player_fallback",
          0x2f6bff,
          this.playerFrameWidth,
          this.playerFrameHeight
        );

    const npcTextureKey = npcSheetAvailable
      ? "npc_sprite"
      : this.createFallbackTexture("npc_fallback_red", 0xe53935, this.npcFrameWidth, this.npcFrameHeight);

    if (playerSheetAvailable) {
      Player.registerAnimations(this, playerTextureKey, this.playerFrameWidth, this.playerFrameHeight);
    }

    if (npcSheetAvailable) {
      Npc.registerAnimations(this, npcTextureKey, this.npcFrameWidth, this.npcFrameHeight);
    }

    this.player = new Player(this, this.mapWidth / 2, this.mapHeight / 2, playerTextureKey, {
      moveSpeed: 220,
      animationPrefix: "player",
      hasAnimations: playerSheetAvailable,
    });

    this.npc = new Npc(this, this.mapWidth / 2 + 100, this.mapHeight / 2, npcTextureKey, {
      animationPrefix: "npc",
      hasAnimations: npcSheetAvailable,
    });

    this.physics.add.collider(this.player, this.npc);
  }

  createDialogueUI() {
    this.dialogueUI = new DialogueUI(this, {
      x: 20,
      y: this.scale.height - 160,
      width: this.scale.width - 40,
      height: 140,
    });

    this.dialogueUI.setDialogueData(this.sceneOptions.dialogueLines);
  }

  createInput() {
    this.cursors = this.input.keyboard.createCursorKeys();
    this.spaceKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    this.attackKey = this.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.Z);
  }

  createCamera() {
    this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
    this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
  }

  createPlayerHud() {
    this.playerHpText = this.add.text(20, 16, "HP: 100/100", {
      fontSize: "20px",
      color: "#ffffff",
      fontStyle: "bold",
    });
    this.playerHpText.setScrollFactor(0);
    this.playerHpText.setDepth(2000);

    this.playerHpBarBg = this.add.graphics();
    this.playerHpBarFill = this.add.graphics();
    this.playerHpBarBg.setScrollFactor(0);
    this.playerHpBarFill.setScrollFactor(0);
    this.playerHpBarBg.setDepth(2000);
    this.playerHpBarFill.setDepth(2001);

    this.updatePlayerHud();
  }

  createSlimePack() {
    for (let index = 0; index < this.sceneOptions.slimeCount; index += 1) {
      const spawnX = Phaser.Math.Between(100, this.mapWidth - 100);
      const spawnY = Phaser.Math.Between(100, this.mapHeight - 100);
      this.createSlime(spawnX, spawnY);
    }

    this.updateSlimeMovement();
  }

  createSlime(sceneX, sceneY) {
    const slimeSize = 32;
    const slime = this.add.rectangle(sceneX, sceneY, slimeSize, slimeSize, 0x39b54a);
    this.physics.add.existing(slime);

    slime.body.setCollideWorldBounds(true);
    slime.body.setBounce(1, 1);
    slime.body.setAllowGravity(false);
    slime.body.setImmovable(false);

    slime.maxHp = 100;
    slime.hp = 100;
    slime.moveSpeed = 70;
    slime.hpBarBg = this.add.graphics().setDepth(20);
    slime.hpBarFill = this.add.graphics().setDepth(21);

    this.slimes.push(slime);
    this.physics.add.collider(this.player, slime, this.handlePlayerSlimeCollision, null, this);

    return slime;
  }

  createSlimeMovementTimer() {
    this.time.addEvent({
      delay: 2000,
      loop: true,
      callback: this.updateSlimeMovement,
      callbackScope: this,
    });
  }

  updateSlimeMovement() {
    this.slimes.forEach((slime) => {
      if (!slime || !slime.active) {
        return;
      }

      const directions = [
        { x: 0, y: -1 },
        { x: 0, y: 1 },
        { x: -1, y: 0 },
        { x: 1, y: 0 },
      ];

      const direction = Phaser.Utils.Array.GetRandom(directions);
      slime.body.setVelocity(direction.x * slime.moveSpeed, direction.y * slime.moveSpeed);
    });
  }

  updateSlimeBars() {
    this.slimes.forEach((slime) => {
      if (!slime || !slime.active) {
        return;
      }

      const barWidth = 34;
      const barHeight = 5;
      const barX = slime.x - barWidth / 2;
      const barY = slime.y - 30;
      const hpRatio = Phaser.Math.Clamp(slime.hp / slime.maxHp, 0, 1);

      slime.hpBarBg.clear();
      slime.hpBarBg.fillStyle(0x000000, 0.8);
      slime.hpBarBg.fillRect(barX, barY, barWidth, barHeight);

      slime.hpBarFill.clear();
      slime.hpBarFill.fillStyle(0x31d843, 1);
      slime.hpBarFill.fillRect(barX + 1, barY + 1, (barWidth - 2) * hpRatio, barHeight - 2);
    });
  }

  updatePlayerHud() {
    const barX = 20;
    const barY = 46;
    const barWidth = 220;
    const barHeight = 18;
    const hpRatio = Phaser.Math.Clamp(this.playerHp / this.maxPlayerHp, 0, 1);

    this.playerHpText.setText(`HP: ${this.playerHp}/${this.maxPlayerHp}`);

    this.playerHpBarBg.clear();
    this.playerHpBarBg.fillStyle(0x000000, 0.75);
    this.playerHpBarBg.fillRect(barX, barY, barWidth, barHeight);

    this.playerHpBarFill.clear();
    this.playerHpBarFill.fillStyle(0xe53935, 1);
    this.playerHpBarFill.fillRect(barX + 2, barY + 2, (barWidth - 4) * hpRatio, barHeight - 4);
  }

  takePlayerDamage(amount) {
    const now = this.time.now;
    if (now < this.playerInvulnerableUntil) {
      return;
    }

    this.playerHp = Math.max(0, this.playerHp - amount);
    this.playerInvulnerableUntil = now + 500;
    this.updatePlayerHud();
  }

  handlePlayerSlimeCollision() {
    this.takePlayerDamage(this.playerTouchDamage);
  }

  createAttackHitbox() {
    if (this.attackHitbox) {
      this.attackHitbox.destroy();
      this.attackHitbox = null;
    }

    const width = 40;
    const height = 30;
    const offset = 34;
    let x = this.player.x;
    let y = this.player.y;
    const facing = this.player.getFacing();

    if (facing === "left") {
      x -= offset;
    } else if (facing === "right") {
      x += offset;
    } else if (facing === "up") {
      y -= offset;
    } else {
      y += offset;
    }

    this.attackHitbox = this.add.rectangle(x, y, width, height, 0xffffff, 0.15);
    this.physics.add.existing(this.attackHitbox);
    this.attackHitbox.body.setAllowGravity(false);
    this.attackHitbox.body.setImmovable(true);
    this.attackHitbox.setVisible(false);
    this.attackHitbox.hitTargets = new Set();

    this.slimes.forEach((slime) => {
      if (slime && slime.active) {
        this.physics.add.overlap(this.attackHitbox, slime, this.handleAttackHit, null, this);
      }
    });

    this.time.delayedCall(120, () => {
      if (this.attackHitbox) {
        this.attackHitbox.destroy();
        this.attackHitbox = null;
      }
    });
  }

  handleAttackHit(hitbox, slime) {
    if (!hitbox || !slime || !slime.active) {
      return;
    }

    if (hitbox.hitTargets && hitbox.hitTargets.has(slime)) {
      return;
    }

    if (hitbox.hitTargets) {
      hitbox.hitTargets.add(slime);
    }

    this.damageSlime(slime, this.attackDamage);
  }

  damageSlime(slime, amount) {
    if (!slime || !slime.active) {
      return;
    }

    slime.hp = Math.max(0, slime.hp - amount);
    this.showDamageText(slime.x, slime.y - 34, `-${amount}`);

    if (slime.hp <= 0) {
      this.destroySlime(slime);
    }
  }

  destroySlime(slime) {
    const slimeIndex = this.slimes.indexOf(slime);
    if (slimeIndex !== -1) {
      this.slimes.splice(slimeIndex, 1);
    }

    if (slime.hpBarBg) {
      slime.hpBarBg.destroy();
    }

    if (slime.hpBarFill) {
      slime.hpBarFill.destroy();
    }

    slime.destroy();
  }

  showDamageText(x, y, text) {
    const damageText = this.add.text(x, y, text, {
      fontSize: "18px",
      color: "#ff3b3b",
      fontStyle: "bold",
    });

    damageText.setOrigin(0.5, 0.5);
    damageText.setDepth(100);

    this.tweens.add({
      targets: damageText,
      y: y - 24,
      alpha: 0,
      duration: 650,
      ease: "Cubic.easeOut",
      onComplete: () => damageText.destroy(),
    });
  }

  onDialogueFinished() {
    if (this.sceneOptions.nextSceneKey) {
      this.scene.start(this.sceneOptions.nextSceneKey);
    }
  }

  update() {
    if (Phaser.Input.Keyboard.JustDown(this.spaceKey)) {
      if (this.dialogueUI.isOpen()) {
        const stillOpen = this.dialogueUI.advance();
        if (!stillOpen) {
          this.player.setMovementEnabled(true);
          this.onDialogueFinished();
          return;
        }
      } else {
        const distanceToNpc = Phaser.Math.Distance.Between(
          this.player.x,
          this.player.y,
          this.npc.x,
          this.npc.y
        );

        if (distanceToNpc < 60 && this.dialogueUI.open()) {
          this.player.setMovementEnabled(false);
        }
      }
    }

    if (!this.dialogueUI.isOpen() && Phaser.Input.Keyboard.JustDown(this.attackKey)) {
      if (this.time.now >= this.nextAttackTime) {
        this.nextAttackTime = this.time.now + this.attackCooldown;
        this.createAttackHitbox();
      }
    }

    this.player.update(this.cursors);
    this.updateSlimeBars();
    this.updatePlayerHud();
  }
}
