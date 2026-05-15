class Enemigo extends Phaser.GameObjects.Rectangle {
    constructor(scene, x, y) {
        // Inicializamos el rectángulo rojo del enemigo (escena, x, y, ancho, alto, color)
        super(scene, x, y - 32, 24, 24, 0xff0000);

        // Lo sumamos a la escena y le damos físicas
        scene.add.existing(this);
        scene.physics.add.existing(this, false);

        this.escena = scene;

        // Configuración física base
        this.body.setCollideWorldBounds(true);
        
        // Dirección inicial aleatoria (izquierda o derecha)
        this.direccionBase = Math.random() < 0.5 ? 100 : -100;
        this.body.setVelocityX(this.direccionBase);

        // Temporizador para los disparos
        this.ultimoDisparo = 0;
    }

    update() {
        // Guardamos la distancia con el jugador en el eje Y
        let diferenciaY = Math.abs(this.y - this.escena.jugador.y);

        // IA: MODO DISPARO (Si está a la misma altura que el jugador)
        if (diferenciaY < 40) {
            this.body.setVelocityX(0); // Se frena para apuntar

            // Dispara cada 1.5 segundos (1500 ms)
            if (this.escena.time.now - this.ultimoDisparo > 1500) {
                this.ultimoDisparo = this.escena.time.now;

                let bala = this.escena.add.rectangle(this.x, this.y, 10, 10, 0xff0000);
                this.escena.balasEnemigas.add(bala); 
                
                // Si el jugador está a la izquierda dispara a la izquierda (-350), sino a la derecha (350)
                let direccionBala = (this.escena.jugador.x < this.x) ? -350 : 350;
                bala.body.setVelocityX(direccionBala);
            }
        } 
        // IA: MODO PATRULLA (Caminar por la plataforma sin caerse)
        else {
            // Si por frenarse a disparar quedó en 0, reanuda su caminata
            if (this.body.velocity.x === 0) {
                this.body.setVelocityX(this.direccionBase);
            }

            let seVaACaer = !this.body.touching.down;
            let chocoPared = this.body.blocked.left || this.body.blocked.right;

            // Si choca una pared o detecta que no hay más suelo adelante, da la vuelta
            if (chocoPared || seVaACaer) {
                this.direccionBase = this.body.velocity.x > 0 ? -100 : 100;
                this.body.setVelocityX(this.direccionBase);
                
                // Pequeño empujón manual si se va a caer para evitar que quede tildado vibrando en el borde
                if (seVaACaer) {
                    this.x += this.direccionBase > 0 ? 5 : -5;
                }
            }
        }
    }
}