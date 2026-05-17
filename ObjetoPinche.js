class ObjetoPinche extends Phaser.GameObjects.Rectangle {
    constructor(scene, x, y) {
        super(scene, x, y, 20, 20, 0xcccccc); // Cuadrado gris de 20x20
        
        scene.add.existing(this);
        scene.physics.add.existing(this, true); // TRUE para que sea un objeto estático (fijo)
        
        this.esPinche = true; // Flag para identificarlo en las colisiones
    }
}