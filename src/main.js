import Phaser from "./phaser.js";
import GrassScene from "./scenes/GrassScene.js";
import DesertScene from "./scenes/DesertScene.js";
import UIScene from "./scenes/UIScene.js";

const config = {
    type: Phaser.AUTO,
    parent: "game-container",
    backgroundColor: "#000000",
    // 使用裝置原生像素比渲染，防止高 DPI 手機上文字模糊
    resolution: window.devicePixelRatio ?? 1,
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
    },
    physics: {
        default: "arcade",
        arcade: {
            debug: false,
        },
    },
    // GrassScene 排第一，由 Phaser 自動啟動；
    // UIScene 排最後，由 BaseScene 以 scene.launch() 呼叫，不會自動啟動。
    scene: [GrassScene, DesertScene, UIScene],
};

new Phaser.Game(config);
