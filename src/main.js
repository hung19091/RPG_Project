import Phaser from "./phaser.js";
import GrassScene from "./scenes/GrassScene.js";
import DesertScene from "./scenes/DesertScene.js";

const config = {
    type: Phaser.AUTO,
    parent: "game-container",
    backgroundColor: "#000000",
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        width: 1280,
        height: 720,
    },
    physics: {
        default: "arcade",
        arcade: {
            debug: false,
        },
    },
    scene: [GrassScene, DesertScene],
};

new Phaser.Game(config);
