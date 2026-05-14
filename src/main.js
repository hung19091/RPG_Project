import Phaser from "./phaser.js";
import GrassScene from "./scenes/GrassScene.js";
import DesertScene from "./scenes/DesertScene.js";

const config = {
    type: Phaser.AUTO,
    parent: "game-container",
    width: 800,
    height: 600,
    scale: {
        mode: Phaser.Scale.FIT,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    backgroundColor: "#000000",
    physics: {
        default: "arcade",
        arcade: {
            debug: false,
        },
    },
    scene: [GrassScene, DesertScene],
};

new Phaser.Game(config);
