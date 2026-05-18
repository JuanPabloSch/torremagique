class Jugador extends Phaser.GameObjects.Rectangle {
    constructor(scene, x, y) {
        // Llamamos al constructor de Phaser.Rectangle (escena, x, y, ancho, alto, color)
        super(scene, x, y, 32, 32, 0x0000ff);

        // Agregamos el jugador visualmente a la escena
        scene.add.existing(this);
        // Le activamos las físicas Arcade
        scene.physics.add.existing(this, false);

        // Guardamos la referencia de la escena para usarla adentro de la clase
        this.escena = scene;

        // Configuraciones de físicas básicas
        this.body.setCollideWorldBounds(true);

        // Atributos de las mecánicas (Tu lógica de vida y caídas)
        this.vidaMaxima = 100;
        this.vidaActual = 100;
        this.jugadorCayendo = false;
        this.alturaInicioCaida = 0;

        // Registramos los controles acá adentro
        this.teclas = this.escena.input.keyboard.createCursorKeys();
    }

    // Toda la lógica que antes corría en el update() de la escena sobre el jugador
    update() {
        // Movimiento Horizontal
        if (this.teclas.left.isDown) {
            this.body.setVelocityX(-200);
        } else if (this.teclas.right.isDown) {
            this.body.setVelocityX(200);
        } else {
            this.body.setVelocityX(0);
        }

        // Salto (Corregido con "this.teclas")
        if (this.teclas.up.isDown && this.body.touching.down) {
            this.body.setVelocityY(-650); // Fuerza del salto máximo
        }

        // Corte Sensitivo (Corregido con "this.teclas")
        // Si suelta la tecla de arriba MIENTRAS está subiendo, recortamos la velocidad
        if (Phaser.Input.Keyboard.JustUp(this.teclas.up) && this.body.velocity.y < 0) {
            // Multiplicamos por 0.4 para frenarlo a menos de la mitad inmediatamente
            this.body.setVelocityY(this.body.velocity.y * 0.4); 
        }

        // Control de daño por caída libre
        if (this.body.velocity.y > 0 && !this.jugadorCayendo) {
            this.jugadorCayendo = true;
            this.alturaInicioCaida = this.y;
        }
        
        if (this.body.touching.down && this.jugadorCayendo) {
            let distanciaCaida = this.y - this.alturaInicioCaida;
            if (distanciaCaida > 850) {
                this.escena.scene.restart(); // Reinicia la escena
            }
            this.jugadorCayendo = false;
        }
    } // <-- Acordate de cerrar siempre la llave del método

    // Métodos de interacción (Daño y cura)
    recibirDanio(puntos, origenX) {
        this.vidaActual -= puntos;
        
        // Ejecutamos la verificación de muerte de la escena
        this.escena.verificarMuerte(this.vidaActual);

        // Knockback (Empuje)
        this.body.setVelocityY(-250);
        if (this.x < origenX) {
            this.body.setVelocityX(-300);
        } else {
            this.body.setVelocityX(300);
        }

        // Efecto visual de parpadeo por daño
        this.setFillStyle(0xffffff);
        this.escena.time.delayedCall(150, () => { this.setFillStyle(0x0000ff); });
    }

    recogerCuracion(puntos) {
        this.vidaActual += puntos;
        if (this.vidaActual > this.vidaMaxima) {
            this.vidaActual = this.vidaMaxima;
        }

        // Efecto visual de parpadeo verde por curación
        this.setFillStyle(0x00ff00);
        this.escena.time.delayedCall(100, () => { this.setFillStyle(0x0000ff); });
    }
}