const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    parent: 'game-container',
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 0 },
            debug: true // Activado para ver que la caja no vibre
        }
    },
    scene: [EscenaSidescroller]
};

const game = new Phaser.Game(config);