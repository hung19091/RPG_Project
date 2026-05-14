import BaseScene from "./BaseScene.js";
import grassDialogue from "../data/dialogues/grassDialogue.js";

export default class GrassScene extends BaseScene {
    constructor() {
        super("MainScene", {
            theme: "grass",
            nextSceneKey: "DesertScene",
            slimeCount: 3,
            usePlayerSprite: true,
            useNpcSprite: false,
            cameraZoomDesktop: 1,
            cameraZoomMobile: 2.2,
            dialogueLines: grassDialogue,
        });
    }
}
