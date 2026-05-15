// Definimos la configuración del juego directamente acá
const config = {
    type: Phaser.AUTO,
    width: 800,
    height: 600,
    physics: {
        default: 'arcade',
        arcade: {
            gravity: { y: 600 },
            debug: true // Cambialo a false si no querés ver los recuadros verdes de las cajas de colisión
        }
    },
    scene: [EscenaPrincipal] // Le avisamos que use la clase que está en EscenaPrincipal.js
};

// Arrancamos el juego pasando la configuración que creamos arriba
const game = new Phaser.Game(config);