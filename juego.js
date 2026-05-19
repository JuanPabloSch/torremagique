// Definimos la configuración del juego directamente acá
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 600 },
            debug: false // ◄--- ¡CAMBIADO A FALSE! Chau cuadraditos verdes
        }
    },
    scene: [EscenaSidescroller, EscenaPrincipal, EscenaBoss, ] 
};

// Arrancamos el juego pasando la configuración que creamos arriba
const game = new Phaser.Game(config);