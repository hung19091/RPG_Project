import Phaser from "../phaser.js";
import Player from "../entities/Player.js";
import Npc from "../entities/Npc.js";
import DialogueUI from "../ui/DialogueUI.js";
import PlayerHud from "../ui/PlayerHud.js";

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
            cameraZoom: null,
            cameraZoomDesktop: 1,
            cameraZoomMobile: 2.2,
            ...sceneOptions,
        };

        this.cameraZoom = this.sceneOptions.cameraZoomDesktop;

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

        this.playerHud = null;

        this.cursors = null;
        this.spaceKey = null;
        this.attackKey = null;

        this.activeMovePointer = null;
        this.pointerDownTimestamp = 0;
        this.pointerDownOnNpc = false;
        this.tapAttackThresholdMs = 200;
        this.touchStopDistance = 10;

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

        this.scale.on("resize", this.onResize, this);
        this.events.once("shutdown", this.handleSceneShutdown, this);
        this.events.once("destroy", this.handleSceneShutdown, this);
        this.onResize(this.scale.gameSize);
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

        this.npc.setInteractive({ useHandCursor: true });
        this.npc.on("pointerdown", this.handleNpcPointerDown, this);
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

        this.input.on("pointerdown", this.handlePointerDown, this);
        this.input.on("pointermove", this.handlePointerMove, this);
        this.input.on("pointerup", this.handlePointerUp, this);
    }

    isPlayerNearNpc(maxDistance = 60) {
        return Phaser.Math.Distance.Between(this.player.x, this.player.y, this.npc.x, this.npc.y) < maxDistance;
    }

    tryOpenDialogue() {
        if (this.dialogueUI.isOpen()) {
            return true;
        }

        if (this.isPlayerNearNpc(60) && this.dialogueUI.open()) {
            this.player.setMovementEnabled(false);
            this.player.stopMovement();
            return true;
        }

        return false;
    }

    performAttackIfReady() {
        if (this.time.now < this.nextAttackTime) {
            return;
        }

        this.nextAttackTime = this.time.now + this.attackCooldown;
        this.createAttackHitbox();
    }

    isPointerOnNpc(pointer) {
        if (!this.npc || !this.npc.active) {
            return false;
        }

        const bounds = this.npc.getBounds();
        return Phaser.Geom.Rectangle.Contains(bounds, pointer.worldX, pointer.worldY);
    }

    handleNpcPointerDown(pointer, _localX, _localY, event) {
        this.pointerDownOnNpc = true;

        if (this.dialogueUI.isOpen()) {
            return;
        }

        this.tryOpenDialogue();

        if (event && typeof event.stopPropagation === "function") {
            event.stopPropagation();
        }
    }

    handlePointerDown(pointer) {
        if (this.dialogueUI.isOpen()) {
            const stillOpen = this.dialogueUI.advance();
            if (!stillOpen) {
                this.player.setMovementEnabled(true);
                this.onDialogueFinished();
            }

            return;
        }

        this.pointerDownTimestamp = this.time.now;
        this.pointerDownOnNpc = this.isPointerOnNpc(pointer);

        if (this.pointerDownOnNpc) {
            this.tryOpenDialogue();
            return;
        }

        this.activeMovePointer = pointer;
    }

    handlePointerMove(pointer) {
        if (!this.activeMovePointer) {
            return;
        }

        if (this.dialogueUI.isOpen()) {
            return;
        }

        if (pointer.id === this.activeMovePointer.id && pointer.isDown) {
            this.activeMovePointer = pointer;
        }
    }

    handlePointerUp(pointer) {
        const isCurrentMovePointer = this.activeMovePointer && pointer.id === this.activeMovePointer.id;

        if (isCurrentMovePointer) {
            this.activeMovePointer = null;
            this.player.stopMovement();
        }

        if (this.dialogueUI.isOpen()) {
            return;
        }

        const pressDuration = this.time.now - this.pointerDownTimestamp;
        const isTapAttack =
            pressDuration < this.tapAttackThresholdMs &&
            !this.pointerDownOnNpc;

        if (isTapAttack) {
            this.performAttackIfReady();
        }
    }

    createCamera() {
        this.cameras.main.setBounds(0, 0, this.mapWidth, this.mapHeight);
        this.onResize(this.scale.gameSize);
    }

    getAdaptiveCameraZoom(gameSize) {
        if (typeof this.sceneOptions.cameraZoom === "number") {
            return this.sceneOptions.cameraZoom;
        }

        const isDesktopMode = this.sys.game.device.os.desktop === true;
        if (isDesktopMode) {
            return this.sceneOptions.cameraZoomDesktop;
        }

        return this.sceneOptions.cameraZoomMobile;
    }

    onResize(gameSize) {
        this.cameraZoom = this.getAdaptiveCameraZoom(gameSize);
        this.cameras.main.setSize(gameSize.width, gameSize.height);
        this.cameras.main.setZoom(this.cameraZoom);
        this.cameras.main.startFollow(this.player, true, 0.1, 0.1);
    }

    handleSceneShutdown() {
        this.scale.off("resize", this.onResize, this);

        if (this.playerHud) {
            this.playerHud.destroy();
            this.playerHud = null;
        }
    }

    createPlayerHud() {
        this.playerHud = new PlayerHud(this, {
            x: 20,
            textY: 16,
            barY: 46,
            barWidth: 220,
            barHeight: 18,
            depth: 2000,
        });
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
        if (!this.playerHud) {
            return;
        }

        this.playerHud.setHp(this.playerHp, this.maxPlayerHp);
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
                this.tryOpenDialogue();
            }
        }

        if (!this.dialogueUI.isOpen() && Phaser.Input.Keyboard.JustDown(this.attackKey)) {
            this.performAttackIfReady();
        }

        if (!this.dialogueUI.isOpen() && this.activeMovePointer && this.activeMovePointer.isDown) {
            this.player.moveToward(
                this.activeMovePointer.worldX,
                this.activeMovePointer.worldY,
                this.touchStopDistance
            );
        } else if (!this.dialogueUI.isOpen()) {
            this.player.update(this.cursors);
        }

        this.updateSlimeBars();
    }
}
