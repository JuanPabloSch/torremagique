class EnemigoKamikaze extends Phaser.GameObjects.Rectangle {
    constructor(scene, x, y) {
        super(scene, x, y - 25, 22, 22, 0xffff00); // Amarillo peligro
        
        // Lo metemos en la escena y le activamos las físicas
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.body.setCollideWorldBounds(true);
        this.body.setAllowGravity(false); // Vuela
        
        this.escena = scene;
        this.esKamikaze = true; // Flag para identificarlo en las colisiones
        this.cargando = false;
    }

    update() {
        if (!this.active || !this.escena.jugador || !this.escena.jugador.active) return;

        let distancia = Phaser.Math.Distance.Between(this.x, this.y, this.escena.jugador.x, this.escena.jugador.y);

        // Lógica de detección y carga
        if (distancia < 450 || this.cargando) {
            this.cargando = true;
            this.escena.physics.moveToObject(this, this.escena.jugador, 280);
            
            // Parpadeo visual de peligro
            if (this.escena.time.now % 200 < 100) {
                this.setFillStyle(0xff0000);
            } else {
                this.setFillStyle(0xffff00);
            }
        } else {
            this.body.setVelocity(0, 0);
        }
    }
}