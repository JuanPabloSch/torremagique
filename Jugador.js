class Jugador extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'benedict_walk');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.escena = scene;

        this.body.setCollideWorldBounds(true);
        this.body.setGravityY(600); 

        // Mantenemos la caja de colisión del cuerpo base
        this.body.setSize(35, 75);
        this.body.setOffset(12, 5);

        this.vidaMaxima = 100;
        this.vidaActual = 100;
        this.jugadorCayendo = false;
        this.alturaInicioCaida = 0;

        // NUEVA VARIABLE: Para saber si está en medio de la animación del látigo
        this.estaAtacando = false;

        this.teclas = this.escena.input.keyboard.createCursorKeys();
        // Agregamos la barra espaciadora para el ataque
        this.teclaEspacio = this.escena.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    update() {
        // FRENO DE ATAQUE: Si está tirando el latigazo, no se puede mover ni saltar
        if (this.estaAtacando) {
            return; 
        }

        // MOVIMIENTO HORIZONTAL
        if (this.teclas.left.isDown) {
            this.body.setVelocityX(-200);
            this.setFlipX(true); 
            if (this.body.blocked.down || this.body.touching.down) {
                this.anims.play('caminar_benedict', true);
            }
        } else if (this.teclas.right.isDown) {
            this.body.setVelocityX(200);
            this.setFlipX(false); 
            if (this.body.blocked.down || this.body.touching.down) {
                this.anims.play('caminar_benedict', true);
            }
        } else {
            this.body.setVelocityX(0);
            if (this.body.blocked.down || this.body.touching.down) {
                this.anims.play('quieto_benedict', true);
            }
        }

        if (!this.body.blocked.down && !this.body.touching.down) {
            this.anims.stop(); 
        }

        // SALTO
        if (this.teclas.up.isDown && (this.body.touching.down || this.body.blocked.down)) {
            this.body.setVelocityY(-650); 
        }

        // CORTE SENSITIVO
        if (Phaser.Input.Keyboard.JustUp(this.teclas.up) && this.body.velocity.y < 0) {
            this.body.setVelocityY(this.body.velocity.y * 0.4); 
        }

        // NUEVA MECÁNICA: DISPARAR LATIGAZO CON ESPACIO (CORREGIDO EL DESFASAJE)
        if (Phaser.Input.Keyboard.JustDown(this.teclaEspacio) && (this.body.blocked.down || this.body.touching.down)) {
            this.body.setVelocityX(0); // Lo clavamos al piso
            this.estaAtacando = true;

            // --- TRUCO DE COMPENSACIÓN DE EJE ---
            // Desplazamos el origen horizontal para que el cuerpo se quede quieto y el látigo sume espacio hacia adelante.
            // Si mira a la derecha (flipX = false), el origen se mueve a la izquierda (0.25). 
            // Si mira a la izquierda (flipX = true), se mueve a la derecha (0.75).
            if (this.flipX) {
                this.setOrigin(0.75, 0.5);
            } else {
                this.setOrigin(0.25, 0.5);
            }

            this.anims.play('latigazo_benedict');

            // Cuando la animación del latigazo termine, reseteamos el eje y desbloqueamos
            this.once('animationcomplete', (anim) => {
                if (anim.key === 'latigazo_benedict') {
                    this.setOrigin(0.5, 0.5); // Volvemos al centro perfecto para caminar
                    this.estaAtacando = false;
                }
            });
        }

        // DAÑO POR CAÍDA LIBRE
        if (this.body.velocity.y > 0 && !this.jugadorCayendo) {
            this.jugadorCayendo = true;
            this.alturaInicioCaida = this.y;
        }
        
        if ((this.body.touching.down || this.body.blocked.down) && this.jugadorCayendo) {
            let distanciaCaida = this.y - this.alturaInicioCaida;
            if (distanciaCaida > 850) {
                this.escena.scene.restart(); 
            }
            this.jugadorCayendo = false;
        }
    }

    recibirDanio(puntos, origenX) {
        this.vidaActual -= puntos;
        this.escena.verificarMuerte(this.vidaActual);

        this.body.setVelocityY(-250);
        if (this.x < origenX) {
            this.body.setVelocityX(-300);
        } else {
            this.body.setVelocityX(300);
        }

        this.setTint(0xff0000); 
        this.escena.time.delayedCall(150, () => { this.clearTint(); }); 
    }

    recogerCuracion(puntos) {
        this.vidaActual += puntos;
        if (this.vidaActual > this.vidaMaxima) {
            this.vidaActual = this.vidaMaxima;
        }
        this.setTint(0x00ff00); 
        this.escena.time.delayedCall(100, () => { this.clearTint(); }); 
    }
}