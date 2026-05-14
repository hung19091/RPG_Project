import BaseScene from "./BaseScene.js";
import desertDialogue from "../data/dialogues/desertDialogue.js";

export default class DesertScene extends BaseScene {
    constructor() {
        super("DesertScene", {
            theme: "desert",
            nextSceneKey: "MainScene",
            slimeCount: 3,
            usePlayerSprite: true,
            useNpcSprite: false,
            dialogueLines: desertDialogue,
        });
    }
}
