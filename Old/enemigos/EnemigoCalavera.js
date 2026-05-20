class EnemigoCalavera extends Phaser.GameObjects.Rectangle {
    constructor(scene, x, y) {
        super(scene, x, y, 16, 16, 0xffffff); // Cuadrado blanco chico
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.body.setAllowGravity(false); // Flota en el aire
        this.body.setImmovable(true);
        
        this.escena = scene;
        this.esCalavera = true; // Flag para identificarla

        // Guardamos su altura original para el vaivén
        this.yOriginal = y;
        
        // Le damos una velocidad inicial hacia arriba para arrancar el movimiento
        this.body.setVelocityY(-40);
    }

    update() {
        if (!this.active || !this.body) return;

        // Si sube más de 30 píxeles de su centro, empieza a bajar
        if (this.y <= this.yOriginal - 30 && this.body.velocity.y < 0) {
            this.body.setVelocityY(40);
        }
        // Si baja más de 30 píxeles de su centro, empieza a subir
        else if (this.y >= this.yOriginal + 30 && this.body.velocity.y > 0) {
            this.body.setVelocityY(-40);
        }
    }
}