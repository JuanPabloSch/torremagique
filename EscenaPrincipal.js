class EscenaPrincipal extends Phaser.Scene {
    constructor() {
        super({ key: 'EscenaPrincipal' });
    }

    preload() {}

    create() {
        // 1. LÍMITES DEL MUNDO
        this.physics.world.setBounds(0, 0, 800, 10000);
        this.cameras.main.setBounds(0, 0, 800, 10000);

        // Sistema de vida, caídas y altura
        this.vidaMaxima = 100;
        this.vidaActual = 100;
        this.jugadorCayendo = false;
        this.alturaInicioCaida = 0;
        this.alturaMaximaAlcanzada = 9800; 

        // FONDO
        this.lineasFondo = this.add.graphics();
        this.lineasFondo.lineStyle(4, 0x333333, 1);
        for (let i = 0; i < 600; i += 150) {
            this.lineasFondo.lineBetween(0, i, 800, i);
        }
        this.lineasFondo.setScrollFactor(0); 
        this.lineasFondo.setDepth(-1);       

        // JUGADOR (Invocamos nuestra clase personalizada)
        this.jugador = new Jugador(this, 400, 9800);

        // INTERFAZ DE VIDA
        this.interfazVida = this.add.graphics();
        this.interfazVida.setDepth(10); 

        // INTERFAZ DE TEXTOS (ALTURA Y RÉCORD)
        this.textoAltura = this.add.text(20, 20, 'ALTURA: 0m', {
            fontFamily: 'Arial',
            fontSize: '24px',
            fontWeight: 'bold',
            fill: '#ffffff'
        });
        this.textoAltura.setScrollFactor(0);
        this.textoAltura.setDepth(11);

        // Leer récord del almacenamiento local del navegador
        this.recordGuardado = localStorage.getItem('torre_max_record') ? parseInt(localStorage.getItem('torre_max_record')) : 0;

        this.textoRecord = this.add.text(20, 50, 'RÉCORD: ' + this.recordGuardado + 'm', {
            fontFamily: 'Arial',
            fontSize: '18px',
            fontWeight: 'bold',
            fill: '#ffcc00'
        });
        this.textoRecord.setScrollFactor(0);
        this.textoRecord.setDepth(11);

        // GRUPOS
        this.plataformas = this.physics.add.staticGroup();
        this.poderes = this.physics.add.group({ allowGravity: false }); 
        this.balasEnemigas = this.physics.add.group({ allowGravity: false }); 
        this.enemigos = this.physics.add.group(); 
        // Adentro de create(), donde declarás los otros grupos:
        this.balasEnemigas = this.physics.add.group({ allowGravity: false }); 
        this.enemigos = this.physics.add.group(); 
        this.curaciones = this.physics.add.group({ allowGravity: false }); // <--- NUEVO

        // Suelo Base
        let sueloBase = this.add.rectangle(400, 9950, 800, 32, 0x00ff00);
        this.plataformas.add(sueloBase);
        sueloBase.body.updateFromGameObject();

        // GENERADOR DE TORRE
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
                    this.crearEnemigo(xEnemigo, altoY);
                }
            } else {
                let xAleatoria = Phaser.Math.Between(300, 500);
                let pisoNormal = this.add.rectangle(xAleatoria, altoY, 450, 32, 0x00ff00);
                
                this.plataformas.add(pisoNormal);
                pisoNormal.body.updateFromGameObject();

                if (Math.random() < 0.7) {
                    this.crearEnemigo(xAleatoria, altoY);
                }
            }
        }

        // COLISIONES
        this.physics.add.collider(this.jugador, this.plataformas);
        this.physics.add.collider(this.enemigos, this.plataformas); 
        
        this.physics.add.collider(this.poderes, this.plataformas, (bala) => bofetadaBala(bala));
        this.physics.add.collider(this.balasEnemigas, this.plataformas, (bala) => bofetadaBala(bala));

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

        // CÁLCULO DE METROS (Una sola declaración limpia)
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

        // JUGADOR (Invocamos nuestra clase personalizada)
        this.jugador = new Jugador(this, 400, 9800);

        // Fondo
        if (this.jugador.body.velocity.y !== 0) {
            this.lineasFondo.y -= this.jugador.body.velocity.y * 0.002;
        }
        this.lineasFondo.y = this.lineasFondo.y % 150;

        // IA enemigos
        this.enemigos.children.iterate((enemigo) => {
            if (!enemigo) return;

            let diferenciaY = Math.abs(enemigo.y - this.jugador.y);

            if (diferenciaY < 40) {
                enemigo.body.setVelocityX(0);

                if (!enemigo.ultimoDisparo || this.time.now - enemigo.ultimoDisparo > 1500) {
                    enemigo.ultimoDisparo = this.time.now;

                    let bala = this.add.rectangle(enemigo.x, enemigo.y, 10, 10, 0xff0000);
                    this.balasEnemigas.add(bala); 
                    
                    let direccionBala = (this.jugador.x < enemigo.x) ? -350 : 350;
                    bala.body.setVelocityX(direccionBala);
                }
            } else {
                if (enemigo.body.velocity.x === 0) {
                    enemigo.body.setVelocityX(enemigo.direccionBase || 100);
                }

                let seVaACaer = !enemigo.body.touching.down;
                let chocoPared = enemigo.body.blocked.left || enemigo.body.blocked.right;

                if (chocoPared || seVaACaer) {
                    let nuevaVel = enemigo.body.velocity.x > 0 ? -100 : 100;
                    enemigo.body.setVelocityX(nuevaVel);
                    enemigo.direccionBase = nuevaVel; 
                    if (seVaACaer) {
                        enemigo.x += nuevaVel > 0 ? 5 : -5;
                    }
                }
            }
        });
    }

    crearEnemigo(x, y) {
        let enemigo = this.add.rectangle(x, y - 32, 24, 24, 0xff0000);
        this.physics.add.existing(enemigo, false); 
        enemigo.body.setCollideWorldBounds(true);
        
        let velInicial = Math.random() < 0.5 ? 100 : -100;
        enemigo.body.setVelocityX(velInicial);
        enemigo.direccionBase = velInicial; 
        
        this.enemigos.add(enemigo);
    }

    destruirEnemigo(poder, enemigo) {
        poder.destroy();   
        enemigo.destroy(); 
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
        let balaX = bala.x;
        bala.destroy(); 
        
        // Le avisamos al objeto jugador que sufra daño (Le pasamos 25 de daño y la X de la bala)
        jugador.recibirDanio(25, balaX);
    }

    recogerCuracion(jugador, cura) {
        cura.destroy(); 
        
        // Le avisamos al jugador que se cure 20 puntos
        jugador.recogerCuracion(20);
    }}

function bofetadaBala(bala) {
    bala.destroy();
}