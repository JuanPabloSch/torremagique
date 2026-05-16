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

        // Suelo Base
        let sueloBase = this.add.rectangle(400, 9950, 800, 32, 0x00ff00);
        this.plataformas.add(sueloBase);
        sueloBase.body.updateFromGameObject();

        // GENERADOR DE TORRE (Ahora decide qué tipo de enemigo poner)
        for (let altoY = 9650; altoY > 200; altoY -= 300) {
            let esPartida = Math.random() < 0.5;

            if (esPartida) {
                let parteIzquierda = this.add.rectangle(150, altoY, 250, 32, 0x00ff00);
                let parteDerecha = this.add.rectangle(650, altoY, 250, 32, 0x00ff00);
                
                this.plataformas.addMultiple([parteIzquierda, parteDerecha]);
                parteIzquierda.body.updateFromGameObject();
                parteDerecha.body.updateFromGameObject();

                if (Math.random() < 0.6) {
                    let xEnemigo = Math.random() < 0.5 ? Phaser.Math.Between(50, 230) : Phaser.Math.Between(570, 750);
                    // 50% de chance de que sea torreta inteligente en plataformas partidas
                    if (Math.random() < 0.5) {
                        this.crearTorreta(xEnemigo, altoY);
                    } else {
                        this.crearEnemigo(xEnemigo, altoY);
                    }
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
                let xAleatoria = Phaser.Math.Between(300, 500);
                let pisoNormal = this.add.rectangle(xAleatoria, altoY, 450, 32, 0x00ff00);
                
                this.plataformas.add(pisoNormal);
                pisoNormal.body.updateFromGameObject();

                if (Math.random() < 0.7) {
                    // 40% de chance de que sea torreta inteligente en pisos largos
                    if (Math.random() < 0.4) {
                        this.crearTorreta(xAleatoria, altoY);
                    } else {
                        this.crearEnemigo(xAleatoria, altoY);
                    }
                } else if (Math.random() < 1.0) { 
                    let cura = this.add.rectangle(xAleatoria, altoY - 25, 14, 14, 0x00ffff);
                    this.physics.add.existing(cura, true);
                    this.physics.add.overlap(this.jugador, cura, () => {
                        this.vidaActual = Math.min(this.vidaMaxima, this.vidaActual + 20);
                        cura.destroy();
                    });
                }
            }
        }

        // COLISIONES
        this.physics.add.collider(this.jugador, this.plataformas);
        this.physics.add.collider(this.enemigos, this.plataformas); 
        
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
            if (enemigo) enemigo.update();
        });
    }

    crearEnemigo(x, y) {
        let enemigo = new Enemigo(this, x, y);
        this.enemigos.add(enemigo);
    }

    // NUEVO MÉTODO: Instancia la torreta y la mete al mismo grupo de enemigos 
    // para que tus balas también la puedan destruir y sume al contador de bajas
    crearTorreta(x, y) {
        let torreta = new EnemigoTorreta(this, x, y);
        this.enemigos.add(torreta);
    }

    destruirEnemigo(poder, enemigo) {
        poder.destroy();   
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
        this.vidaActual -= 15; 
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
        this.vidaActual -= 25; 
        this.verificarMuerte();
        bala.destroy(); 
    }
}