import Phaser from "./phaser.js";
import GrassScene from "./scenes/GrassScene.js";
import DesertScene from "./scenes/DesertScene.js";
import UIScene from "./scenes/UIScene.js";

const config = {
    type: Phaser.AUTO,
    parent: "game-container",
    backgroundColor: "#000000",
    pixelArt: false,  // 關閉像素風模式，啟用抗鋸齒
    antialias: true,  // 開啟反鋸齒，使文字清晰
    resolution: window.devicePixelRatio || 1,  // 根據手機螢幕密度自動提升畫布解析度
    scale: {
        mode: Phaser.Scale.RESIZE,
        autoCenter: Phaser.Scale.CENTER_BOTH,
        // 啟用高 DPI 支持（手機視網膜螢幕）
        expandParent: true,
        fullscreenTarget: "game-container",
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
