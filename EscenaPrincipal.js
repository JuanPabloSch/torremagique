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

        // GENERADOR DE TORRE (Ahora reparte entre los 4 tipos de enemigos)
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
                    
                    let azar = Math.random();
                    if (azar < 0.25) {
                        this.crearTorretaDirecta(xEnemigo, altoY);
                    } else if (azar < 0.50) {
                        this.crearKamikazeDirecto(xEnemigo, altoY); 
                    } else if (azar < 0.75) {
                        this.crearLanzallamasDirecto(xEnemigo, altoY); // <--- NUEVO
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
                    let azar = Math.random();
                    if (azar < 0.25) {
                        this.crearTorretaDirecta(xAleatoria, altoY);
                    } else if (azar < 0.50) {
                        this.crearKamikazeDirecto(xAleatoria, altoY);
                    } else if (azar < 0.75) {
                        this.crearLanzallamasDirecto(xAleatoria, altoY); // <--- NUEVO
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
            if (enemigo && enemigo.update) {
                enemigo.update();
            }
        });
    }

    crearEnemigo(x, y) {
        let enemigo = new Enemigo(this, x, y);
        this.enemigos.add(enemigo);
    }

    crearTorretaDirecta(x, y) {
        let torreta = this.add.rectangle(x, y - 30, 30, 30, 0xff00ff);
        this.enemigos.add(torreta);
        this.physics.add.existing(torreta);
        
        torreta.body.setAllowGravity(false); 
        torreta.body.setImmovable(true);     
        torreta.body.setCollideWorldBounds(true);

        let reloj = this.time.addEvent({
            delay: 1000, // Cada 1 segundo
            loop: true,
            callback: () => {
                if (!torreta.active || !this.jugador || !this.jugador.active) {
                    reloj.destroy();
                    return;
                }
                let bala = this.add.rectangle(torreta.x, torreta.y, 10, 10, 0xff0000);
                this.balasEnemigas.add(bala);
                this.physics.moveToObject(bala, this.jugador, 300);
            }
        });
    }

    crearKamikazeDirecto(x, y) {
        let kamikaze = this.add.rectangle(x, y - 25, 22, 22, 0xffff00); 
        this.enemigos.add(kamikaze);
        this.physics.add.existing(kamikaze);
        kamikaze.body.setCollideWorldBounds(true);
        kamikaze.body.setAllowGravity(false); 
        
        kamikaze.esKamikaze = true;
        kamikaze.cargando = false;

        kamikaze.update = () => {
            if (!kamikaze.active || !this.jugador || !this.jugador.active) return;

            let distancia = Phaser.Math.Distance.Between(kamikaze.x, kamikaze.y, this.jugador.x, this.jugador.y);

            if (distancia < 450 || kamikaze.cargando) {
                kamikaze.cargando = true;
                this.physics.moveToObject(kamikaze, this.jugador, 280);
                
                if (this.time.now % 200 < 100) {
                    kamikaze.setFillStyle(0xff0000);
                } else {
                    kamikaze.setFillStyle(0xffff00);
                }
            } else {
                kamikaze.body.setVelocity(0, 0);
            }
        };
    }

    // NUEVO MÉTODO DIRECTO: El enemigo Lanzallamas (Bordó)
// MÉTODO LANZALLAMAS CORREGIDO (Sin errores de tipeo y con físicas reales)
    crearLanzallamasDirecto(x, y) {
        let pyromaniac = this.add.rectangle(x, y - 30, 28, 28, 0x990000); // Bordó
        this.enemigos.add(pyromaniac);
        this.physics.add.existing(pyromaniac);
        
        // Físicas terrestres obligatorias
        pyromaniac.body.setCollideWorldBounds(true);
        pyromaniac.body.setGravityY(300); // ◄--- Tiene gravedad, cae a las plataformas
        
        // Hacemos que colisione con el suelo para que no lo atraviese
        this.physics.add.collider(pyromaniac, this.plataformas);

        // Propiedades de patrullaje
        pyromaniac.velocidadPatrulla = 80;
        pyromaniac.body.setVelocityX(pyromaniac.velocidadPatrulla);

        // Reloj rápido de fuego continuo
        let relojFuego = this.time.addEvent({
            delay: 100,
            loop: true,
            callback: () => {
                if (!pyromaniac.active) {
                    relojFuego.destroy();
                    return;
                }

                let direccionX = pyromaniac.body.velocity.x > 0 ? 1 : -1;
                let colorFuego = Math.random() < 0.5 ? 0xff6600 : 0xff3300;
                let flama = this.add.rectangle(pyromaniac.x + (direccionX * 15), pyromaniac.y, 8, 8, colorFuego);
                this.balasEnemigas.add(flama);

                flama.body.setVelocityX(pyromaniac.body.velocity.x + (direccionX * 250));
                flama.body.setVelocityY(Phaser.Math.Between(-40, 40));

                this.time.delayedCall(400, () => {
                    if (flama.active) flama.destroy();
                });
            }
        });

        // Lógica de patrullaje e inteligencia para no flotar ni caerse solo
        pyromaniac.update = () => {
            if (!pyromaniac.active || !pyromaniac.body) return;

            // Si choca contra una pared del mundo o el borde de la pantalla, da la vuelta (CORREGIDO EL TYPO)
            if (pyromaniac.body.blocked.left || pyromaniac.body.left <= 0) {
                pyromaniac.velocidadPatrulla = 80;
                pyromaniac.body.setVelocityX(pyromaniac.velocidadPatrulla);
            } else if (pyromaniac.body.blocked.right || pyromaniac.body.right >= 800) {
                pyromaniac.velocidadPatrulla = -80;
                pyromaniac.body.setVelocityX(pyromaniac.velocidadPatrulla);
            }

            // Si por alguna razón se cae de su plataforma, que camine normal en donde caiga
            if (!pyromaniac.body.touching.down && !pyromaniac.body.blocked.down) {
                // Mientras esté en el aire reduce un poco la velocidad para que caiga bien
                pyromaniac.body.setVelocityX(pyromaniac.velocidadPatrulla * 0.5);
            } else {
                // En el suelo mantiene su velocidad de patrulla
                pyromaniac.body.setVelocityX(pyromaniac.velocidadPatrulla);
            }
        };
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
        // Las flamas individuales hacen un poco menos de daño (8) porque vienen muchas juntas en ráfaga
        // Detectamos si es una flama por su tamaño (miden 8x8, las balas comunes miden 10 o 12)
        let danio = (bala.width === 8) ? 8 : 25;

        this.vidaActual -= danio; 
        this.verificarMuerte();
        bala.destroy(); 
    }
}