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

        // GENERADOR DE TORRE (Ahora reparte entre los 3 tipos de enemigos)
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
                    if (azar < 0.35) {
                        this.crearTorretaDirecta(xEnemigo, altoY);
                    } else if (azar < 0.70) {
                        this.crearKamikazeDirecto(xEnemigo, altoY); // <--- NUEVO: Kamikaze en partida
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
                    if (azar < 0.35) {
                        this.crearTorretaDirecta(xAleatoria, altoY);
                    } else if (azar < 0.70) {
                        this.crearKamikazeDirecto(xAleatoria, altoY); // <--- NUEVO: Kamikaze en normal
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

        // RECORREMOS TODOS LOS ENEMIGOS ACTIVOS
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

// MÉTODO TORRETA CORREGIDO (Ya no se caen del cielo)
    crearTorretaDirecta(x, y) {
        let torreta = this.add.rectangle(x, y - 30, 30, 30, 0xff00ff);
        this.enemigos.add(torreta);
        this.physics.add.existing(torreta);
        
        // ¡ESTAS DOS LÍNEAS SALVAN A LA TORRETA DE LA CAÍDA!
        torreta.body.setAllowGravity(false); // <--- Le apaga la gravedad para que no se caiga
        torreta.body.setImmovable(true);     // <--- La deja fija contra empujones
        
        torreta.body.setCollideWorldBounds(true);

        // Le metemos un temporizador para que dispare al jugador cada 2 segundos
        let reloj = this.time.addEvent({
            delay: 2000,
            loop: true,
            callback: () => {
                if (!torreta.active || !this.jugador || !this.jugador.active) {
                    reloj.destroy();
                    return;
                }
                // Crea la bala roja
                let bala = this.add.rectangle(torreta.x, torreta.y, 10, 10, 0xff0000);
                this.balasEnemigas.add(bala);
                
                // Apunta directo a la posición del jugador en ese instante
                this.physics.moveToObject(bala, this.jugador, 300);
            }
        });
    }

    // NUEVO MÉTODO DIRECTO: Crea el enemigo Kamikaze amarillo
    crearKamikazeDirecto(x, y) {
        let kamikaze = this.add.rectangle(x, y - 25, 22, 22, 0xffff00); // Amarillo peligro
        this.enemigos.add(kamikaze);
        this.physics.add.existing(kamikaze);
        kamikaze.body.setCollideWorldBounds(true);
        kamikaze.body.setAllowGravity(false); // Vuela, ignora la gravedad
        
        // Marcamos una propiedad personalizada para saber que ES un kamikaze
        kamikaze.esKamikaze = true;
        kamikaze.cargando = false;

        // Le inyectamos su propia lógica de persecución en tiempo real
        kamikaze.update = () => {
            if (!kamikaze.active || !this.jugador || !this.jugador.active) return;

            // Calculamos la distancia entre el kamikaze y el jugador
            let distancia = Phaser.Math.Distance.Between(kamikaze.x, kamikaze.y, this.jugador.x, this.jugador.y);

            // Si el jugador entra en su rango de detección (450 píxeles) o ya empezó a cargar
            if (distancia < 450 || kamikaze.cargando) {
                kamikaze.cargando = true;
                
                // Hace una carga rápida y directa hacia donde se mueva el jugador
                this.physics.moveToObject(kamikaze, this.jugador, 280);
                
                // Efecto visual: parpadea rápido entre amarillo y rojo avisando que va a explotar
                if (this.time.now % 200 < 100) {
                    kamikaze.setFillStyle(0xff0000);
                } else {
                    kamikaze.setFillStyle(0xffff00);
                }
            } else {
                // Si estás lejos, se queda flotando en su lugar patrullando lento
                kamikaze.body.setVelocity(0, 0);
            }
        };
    }

    destruirEnemigo(poder, enemigo) {
        poder.destroy();   
        
        // Si destruís un kamikaze a tiros, hacemos un mini efecto de explosión visual antes de borrarlo
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
        // Si nos chocamos con un Kamikaze, ¡el daño es mucho mayor (35) y explota!
        if (enemigo.esKamikaze) {
            this.vidaActual -= 35; // Alto daño por explosión
            
            // Efecto visual de explosión circular en la cara del jugador
            let explosion = this.add.circle(enemigo.x, enemigo.y, 45, 0xff3300);
            this.time.delayedCall(150, () => explosion.destroy());
            
            enemigo.destroy(); // Se inmola
        } else {
            // Daño normal por tocar un enemigo común o torreta (15)
            this.vidaActual -= 15; 
        }

        this.verificarMuerte();

        // Retroceso por el impacto
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