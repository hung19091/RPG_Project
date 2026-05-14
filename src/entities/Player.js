import Phaser from "../phaser.js";

export default class Player extends Phaser.Physics.Arcade.Sprite {
    static registerAnimations(scene, textureKey, frameWidth, frameHeight, animationPrefix = "player") {
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

        this.moveSpeed = options.moveSpeed ?? 220;
        this.animationPrefix = options.animationPrefix ?? "player";
        this.hasAnimations = options.hasAnimations ?? false;
        this.movementEnabled = true;
        this.facing = options.facing ?? "down";

        this.setCollideWorldBounds(true);

        if (this.hasAnimations) {
            this.play(`${this.animationPrefix}-idle-${this.facing}`);
        }
    }

    setMovementEnabled(enabled) {
        this.movementEnabled = enabled;

        if (!enabled) {
            this.body.setVelocity(0, 0);
            this.playIdle();
        }
    }

    getFacing() {
        return this.facing;
    }

    setVelocityWithAnimation(velocityX, velocityY) {
        this.body.setVelocity(velocityX, velocityY);

        if (velocityX !== 0 && velocityY !== 0) {
            this.body.velocity.normalize().scale(this.moveSpeed);
        }

        if (velocityX < 0) {
            this.facing = "left";
            this.playWalk("left");
        } else if (velocityX > 0) {
            this.facing = "right";
            this.playWalk("right");
        } else if (velocityY < 0) {
            this.facing = "up";
            this.playWalk("up");
        } else if (velocityY > 0) {
            this.facing = "down";
            this.playWalk("down");
        } else {
            this.playIdle();
        }
    }

    stopMovement() {
        this.setVelocityWithAnimation(0, 0);
    }

    moveToward(targetX, targetY, stopDistance = 10) {
        if (!this.active || !this.movementEnabled) {
            this.stopMovement();
            return;
        }

        const distance = Phaser.Math.Distance.Between(this.x, this.y, targetX, targetY);
        if (distance < stopDistance) {
            this.stopMovement();
            return;
        }

        const angle = Phaser.Math.Angle.Between(this.x, this.y, targetX, targetY);
        const velocityX = Math.cos(angle) * this.moveSpeed;
        const velocityY = Math.sin(angle) * this.moveSpeed;

        this.setVelocityWithAnimation(velocityX, velocityY);
    }

    playIdle() {
        if (!this.hasAnimations) {
            return;
        }

        this.anims.play(`${this.animationPrefix}-idle-${this.facing}`, true);
    }

    playWalk(direction) {
        if (!this.hasAnimations) {
            return;
        }

        this.anims.play(`${this.animationPrefix}-walk-${direction}`, true);
    }

    update(cursors) {
        if (!this.active) {
            return;
        }

        if (!this.movementEnabled) {
            this.body.setVelocity(0, 0);
            this.playIdle();
            return;
        }

        let velocityX = 0;
        let velocityY = 0;

        if (cursors.left.isDown) {
            velocityX = -this.moveSpeed;
        } else if (cursors.right.isDown) {
            velocityX = this.moveSpeed;
        }

        if (cursors.up.isDown) {
            velocityY = -this.moveSpeed;
        } else if (cursors.down.isDown) {
            velocityY = this.moveSpeed;
        }

        this.setVelocityWithAnimation(velocityX, velocityY);
    }
}
