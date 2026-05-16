class EnemigoTorreta extends Phaser.GameObjects.Rectangle {
    constructor(scene, x, y) {
        // Lo creamos de color magenta (0xff00ff) para diferenciarlo
        super(scene, x, y - 30, 30, 30, 0xff00ff);
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.body.setCollideWorldBounds(true);
        this.escena = scene;
        
        // Temporizador de disparo (cada 2 segundos)
        this.temporizadorDisparo = scene.time.addEvent({
            delay: 2000,
            callback: this.dispararAlJugador,
            callbackScope: this,
            loop: true
        });
    }

    dispararAlJugador() {
        // Si el enemigo o el jugador ya no existen (por reinicio), no hacemos nada
        if (!this.active || !this.escena.jugador || !this.escena.jugador.active) return;

        // Creamos la bala enemiga (un cuadradito rojo)
        let bala = this.escena.add.rectangle(this.x, this.y, 10, 10, 0xff0000);
        this.escena.balasEnemigas.add(bala);

        // ¡Acá está la magia! Phaser calcula la velocidad necesaria 
        // para mover la bala directo hacia la posición exacta del jugador
        this.escena.physics.moveToObject(bala, this.escena.jugador, 300);
    }

    // Si destruyen al enemigo, limpiamos su temporizador para que no tire errores
    destroy(fromScene) {
        if (this.temporizadorDisparo) {
            this.temporizadorDisparo.destroy();
        }
        super.destroy(fromScene);
    }

    update() {
        // Las torretas se quedan quietas custodiando su plataforma, 
        // solo se dedican a apuntar y disparar.
        this.body.setVelocityX(0);
    }
}