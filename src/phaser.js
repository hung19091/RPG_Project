const Phaser = globalThis.Phaser;

if (!Phaser) {
    throw new Error("Phaser has not been loaded. Make sure the CDN script is included before the module entry.");
}

export default Phaser;
