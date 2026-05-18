class EnemigoLanzallamas extends Phaser.GameObjects.Rectangle {
    constructor(scene, x, y) {
        super(scene, x, y - 30, 28, 28, 0x990000); // Bordó
        
        scene.add.existing(this);
        scene.physics.add.existing(this);
        
        this.body.setCollideWorldBounds(true);
        this.body.setGravityY(300); // Cae por gravedad
        
        // Hacemos que colisione con las plataformas desde adentro de su clase
        scene.physics.add.collider(this, scene.plataformas);
        
        this.escena = scene;
        this.velocidadPatrulla = 80;
        this.body.setVelocityX(this.velocidadPatrulla);

        // El bucle de fuego continuo se maneja acá adentro
        this.relojFuego = scene.time.addEvent({
            delay: 100,
            loop: true,
            callback: this.escupirFuego,
            callbackScope: this
        });
    }

    escupirFuego() {
        if (!this.active || !this.body) {
            if (this.relojFuego) this.relojFuego.destroy();
            return;
        }

        let direccionX = this.body.velocity.x > 0 ? 1 : -1;
        let colorFuego = Math.random() < 0.5 ? 0xff6600 : 0xff3300;
        
        let flama = this.escena.add.rectangle(this.x + (direccionX * 15), this.y, 8, 8, colorFuego);
        this.escena.balasEnemigas.add(flama);

        flama.body.setVelocityX(this.body.velocity.x + (direccionX * 250));
        flama.body.setVelocityY(Phaser.Math.Between(-40, 40));

        this.escena.time.delayedCall(400, () => {
            if (flama.active) flama.destroy();
        });
    }

    // Si destruyen al bicho, limpiamos su reloj para que no quede tirando flamas fantasmas
    destroy(fromScene) {
        if (this.relojFuego) this.relojFuego.destroy();
        super.destroy(fromScene);
    }

    update() {
        if (!this.active || !this.body) return;

        // 1. REBOTES EN PAREDES O BORDES DE LA PANTALLA
        if (this.body.blocked.left || this.body.left <= 0) {
            this.velocidadPatrulla = 80;
            this.body.setVelocityX(this.velocidadPatrulla);
        } else if (this.body.blocked.right || this.body.right >= 800) {
            this.velocidadPatrulla = -80;
            this.body.setVelocityX(this.velocidadPatrulla);
        }

        // 2. DETECTOR DE ABISMOS (Para que no se tire de las plataformas)
        // Solo chequeamos si está efectivamente apoyado en el suelo
        if (this.body.touching.down || this.body.blocked.down) {
            this.body.setVelocityX(this.velocidadPatrulla);

            // Calculamos un punto justo adelante de los pies del enemigo según hacia dónde camina
            let direccionX = this.body.velocity.x > 0 ? 1 : -1;
            let checkX = this.x + (direccionX * 20);
            let checkY = this.y + 20; // Un pelín más abajo de sus pies

            // Le preguntamos al sistema de físicas si hay alguna plataforma en esa posición exacta
            let hayPlataformaAdelante = this.escena.plataformas.getChildren().some(plataforma => {
                return plataforma.getBounds().contains(checkX, checkY);
            });

            // Si no hay plataforma adelante... ¡Pega la vuelta antes de caerse!
            if (!hayPlataformaAdelante) {
                this.velocidadPatrulla *= -1; // Invierte la dirección (si era 80 pasa a -80, y viceversa)
                this.body.setVelocityX(this.velocidadPatrulla);
            }
        } else {
            // Si por alguna razón está en el aire (ej. lo empujaste), cae más lento
            this.body.setVelocityX(this.velocidadPatrulla * 0.5);
        }
    }
}