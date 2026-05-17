class EscenaPrincipal extends Phaser.Scene {
    constructor() {
        super({ key: 'EscenaPrincipal' });
    }

    preload() {}

    create() {
        // 1. LÍMITES DEL MUNDO
        this.physics.world.setBounds(0, 0, 800, 10000);
        this.cameras.main.setBounds(0, 0, 800, 10000);

        // Sistema de juego
        this.vidaMaxima = 100;
        this.vidaActual = 100;
        this.jugadorCayendo = false;
        this.alturaInicioCaida = 0;
        this.alturaMaximaAlcanzada = 9800; 
        this.enemigosBajas = 0; 

        // FONDO
        this.lineasFondo = this.add.graphics();
        this.lineasFondo.lineStyle(4, 0x333333, 1);
        for (let i = 0; i < 600; i += 150) {
            this.lineasFondo.lineBetween(0, i, 800, i);
        }
        this.lineasFondo.setScrollFactor(0); 
        this.lineasFondo.setDepth(-1);       

        // JUGADOR
        this.jugador = new Jugador(this, 400, 9800);

        // INTERFAZ
        this.interfazVida = this.add.graphics();
        this.interfazVida.setDepth(10); 

        this.textoAltura = this.add.text(20, 20, 'ALTURA: 0m', {
            fontFamily: 'Arial',
            fontSize: '24px',
            fontWeight: 'bold',
            fill: '#ffffff'
        });
        this.textoAltura.setScrollFactor(0);
        this.textoAltura.setDepth(11);

        this.recordGuardado = localStorage.getItem('torre_max_record') ? parseInt(localStorage.getItem('torre_max_record')) : 0;

        this.textoRecord = this.add.text(20, 50, 'RÉCORD: ' + this.recordGuardado + 'm', {
            fontFamily: 'Arial',
            fontSize: '18px',
            fontWeight: 'bold',
            fill: '#ffcc00'
        });
        this.textoRecord.setScrollFactor(0);
        this.textoRecord.setDepth(11);

        this.textoBajas = this.add.text(580, 20, 'KILLS: 0', {
            fontFamily: 'Arial',
            fontSize: '24px',
            fontWeight: 'bold',
            fill: '#ff3333'
        });
        this.textoBajas.setScrollFactor(0);
        this.textoBajas.setDepth(11);

        // GRUPOS
        this.plataformas = this.physics.add.staticGroup();
        this.poderes = this.physics.add.group({ allowGravity: false }); 
        this.balasEnemigas = this.physics.add.group({ allowGravity: false }); 
        this.enemigos = this.physics.add.group();
        this.pinches = this.physics.add.staticGroup();

        // Suelo Base
        let sueloBase = this.add.rectangle(400, 9950, 800, 32, 0x00ff00);
        this.plataformas.add(sueloBase);
        sueloBase.body.updateFromGameObject();

// GENERADOR DE TORRE (Estructura limpia completa)
        for (let altoY = 9650; altoY > 200; altoY -= 300) {
            let esPartida = Math.random() < 0.5;

            if (esPartida) {
                // Plataformas de los costados
                let parteIzquierda = this.add.rectangle(150, altoY, 250, 32, 0x00ff00);
                let parteDerecha = this.add.rectangle(650, altoY, 250, 32, 0x00ff00);
                
                this.plataformas.addMultiple([parteIzquierda, parteDerecha]);
                parteIzquierda.body.updateFromGameObject();
                parteDerecha.body.updateFromGameObject();

                if (Math.random() < 0.6) {
                    let xEnemigo = Math.random() < 0.5 ? Phaser.Math.Between(50, 230) : Phaser.Math.Between(570, 750);
                    this.invocarEnemigoAleatorio(xEnemigo, altoY);
                } else if (Math.random() < 1.0) { 
                    let xCura = Math.random() < 0.5 ? Phaser.Math.Between(50, 230) : Phaser.Math.Between(570, 750);
                    let cura = this.add.rectangle(xCura, altoY - 25, 14, 14, 0x00ffff);
                    this.physics.add.existing(cura, true);
                    this.physics.add.overlap(this.jugador, cura, () => {
                        this.vidaActual = Math.min(this.vidaMaxima, this.vidaActual + 20);
                        cura.destroy();
                    });
                }
            } else {
                // Plataforma única central
                let xAleatoria = Phaser.Math.Between(300, 500);
                let pisoNormal = this.add.rectangle(xAleatoria, altoY, 450, 32, 0x00ff00);
                
                this.plataformas.add(pisoNormal);
                pisoNormal.body.updateFromGameObject();

                // 40% de chances de crear una hilera de pinches abajo del piso central
                if (Math.random() < 0.4) {
                    let inicioX = xAleatoria - 100; 
                    for (let i = 0; i < 5; i++) {
                        let posX = inicioX + (i * 20);
                        let pinche = new ObjetoPinche(this, posX, altoY + 26); 
                        this.pinches.add(pinche);
                    }
                }

                if (Math.random() < 0.7) {
                    this.invocarEnemigoAleatorio(xAleatoria, altoY);
                } else if (Math.random() < 1.0) { 
                    let cura = this.add.rectangle(xAleatoria, altoY - 25, 14, 14, 0x00ffff);
                    this.physics.add.existing(cura, true);
                    this.physics.add.overlap(this.jugador, cura, () => {
                        this.vidaActual = Math.min(this.vidaMaxima, this.vidaActual + 20);
                        cura.destroy();
                    });
                }
            }

            // INDEPENDIENTE: 35% de chances de una calavera flotando en el aire (para cualquier tipo de piso)
            if (Math.random() < 0.35) {
                let xAire = Phaser.Math.Between(100, 700);
                let yAire = altoY + 150; // A mitad de camino en el vacío
                
                let calavera = new EnemigoCalavera(this, xAire, yAire);
                this.enemigos.add(calavera); 
            }
        }

        // COLISIONES
        this.physics.add.collider(this.jugador, this.plataformas);
        this.physics.add.collider(this.enemigos, this.plataformas); 
        this.physics.add.overlap(this.jugador, this.pinches, this.tocarPinches, null, this); // ◄--- NUEVO
        this.physics.add.overlap(this.jugador, this.enemigos, this.recibirDanio, null, this);
        // Podés verificar que reaccione al tocarla. Como está en el grupo "enemigos", 
        // ya le va a hacer el daño base de 15 por defecto al tocarla.

        this.physics.add.collider(this.poderes, this.plataformas, (bala) => { bala.destroy(); });
        this.physics.add.collider(this.balasEnemigas, this.plataformas, (bala) => { bala.destroy(); });

        this.physics.add.overlap(this.poderes, this.enemigos, this.destruirEnemigo, null, this);
        this.physics.add.overlap(this.jugador, this.enemigos, this.recibirDanio, null, this);
        this.physics.add.overlap(this.jugador, this.balasEnemigas, this.recibirDanioBala, null, this);

        // CÁMARA Y CONTROLES
        this.cameras.main.startFollow(this.jugador, true, 0.05, 0.05);
        this.teclas = this.input.keyboard.createCursorKeys();
        
        this.input.on('pointerdown', (pointer) => {
            let mouseX = pointer.worldX;
            let mouseY = pointer.worldY;

            let disparo = this.add.rectangle(this.jugador.x, this.jugador.y, 12, 12, 0xffff00);
            this.poderes.add(disparo); 
            this.physics.moveTo(disparo, mouseX, mouseY, 600); 
        });
    }

    update() {
        this.actualizarBarraVida();

        if (this.jugador.y < this.alturaMaximaAlcanzada) {
            this.alturaMaximaAlcanzada = this.jugador.y; 
        }
        let metrosEscalados = Math.floor((9800 - this.alturaMaximaAlcanzada) / 10);
        this.textoAltura.setText('ALTURA: ' + metrosEscalados + 'm');

        if (metrosEscalados > this.recordGuardado) {
            this.recordGuardado = metrosEscalados;
            this.textoRecord.setText('RÉCORD: ' + this.recordGuardado + 'm');
            localStorage.setItem('torre_max_record', this.recordGuardado);
        }

        if (this.jugador.body.velocity.y !== 0) {
            this.lineasFondo.y -= this.jugador.body.velocity.y * 0.002;
        }
        this.lineasFondo.y = this.lineasFondo.y % 150;

        this.jugador.update();

        this.enemigos.children.iterate((enemigo) => {
            if (enemigo && enemigo.update) {
                enemigo.update();
            }
        });
    }

    tocarPinches(jugador, pinche) {
        // Te saca 20 de vida y te empuja hacia abajo con fuerza
        this.vidaActual -= 20;
        this.verificarMuerte();

        // Retroceso violento hacia abajo por pincharte la cabeza
        jugador.body.setVelocityY(250);
        
        // Destello blanco de daño
        jugador.setFillStyle(0xffffff);
        this.time.delayedCall(150, () => { jugador.setFillStyle(0x0000ff); });
    }

    // Sistema limpio para decidir qué clase instanciar
    invocarEnemigoAleatorio(x, y) {
        let azar = Math.random();
        let nuevoEnemigo;

        if (azar < 0.25) {
            nuevoEnemigo = new EnemigoTorreta(this, x, y);
        } else if (azar < 0.50) {
            nuevoEnemigo = new EnemigoKamikaze(this, x, y);
        } else if (azar < 0.75) {
            nuevoEnemigo = new EnemigoLanzallamas(this, x, y);
        } else {
            nuevoEnemigo = new Enemigo(this, x, y);
        }

        this.enemigos.add(nuevoEnemigo);
    }

    destruirEnemigo(poder, enemigo) {
        poder.destroy();   
        
        if (enemigo.esKamikaze) {
            let exp = this.add.circle(enemigo.x, enemigo.y, 30, 0xffaa00);
            this.time.delayedCall(100, () => exp.destroy());
        }

        enemigo.destroy(); 
        this.enemigosBajas += 1;
        this.textoBajas.setText('KILLS: ' + this.enemigosBajas);
    }

    actualizarBarraVida() {
        this.interfazVida.clear();
        this.interfazVida.fillStyle(0x000000);
        this.interfazVida.fillRect(this.jugador.x - 20, this.jugador.y - 30, 40, 6);

        let colorBarra = (this.vidaActual > 35) ? 0x00ff00 : 0xff0000;
        this.interfazVida.fillStyle(colorBarra);
        
        let anchoCalculado = (this.vidaActual / this.vidaMaxima) * 40;
        this.interfazVida.fillRect(this.jugador.x - 20, this.jugador.y - 30, anchoCalculado, 6);
    }

    verificarMuerte() {
        if (this.vidaActual <= 0) {
            this.scene.restart(); 
        }
    }

    recibirDanio(jugador, enemigo) {
        if (enemigo.esKamikaze) {
            this.vidaActual -= 35; 
            let explosion = this.add.circle(enemigo.x, enemigo.y, 45, 0xff3300);
            this.time.delayedCall(150, () => explosion.destroy());
            enemigo.destroy(); 
        } else {
            this.vidaActual -= 15; 
        }

        this.verificarMuerte();

        jugador.body.setVelocityY(-300);
        if (jugador.x < enemigo.x) {
            jugador.body.setVelocityX(-350);
        } else {
            jugador.body.setVelocityX(350);
        }
        jugador.setFillStyle(0xffffff);
        this.time.delayedCall(150, () => { jugador.setFillStyle(0x0000ff); });
    }

    recibirDanioBala(jugador, bala) {
        let danio = (bala.width === 8) ? 8 : 25;
        this.vidaActual -= danio; 
        this.verificarMuerte();
        bala.destroy(); 
    }
}