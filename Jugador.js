class EscenaSidescroller extends Phaser.Scene {
    constructor() {
        super({ key: 'EscenaSidescroller' });
    }

    init(data) {
        this.vidaActual = data.vidaHeredada || 100;
        this.vidaMaxima = 100;
    }

    preload() {
        this.load.image('fondo_l2', 'background/fondo_l2.png');   
        this.load.image('fondo_l21', 'background/fondo_l21.png'); 
        
        // Caminata de Benedict (90x100)
        this.load.spritesheet('benedict_walk', 'assets/benedict_walk.png', { 
            frameWidth: 90, 
            frameHeight: 100 
        });
        
        // CORREGIDO: Ajustado a tus nuevas medidas de 112 de ancho (448/4 aprox) y 108 de alto
        this.load.spritesheet('benedict_attack', 'assets/benedict_attack.png', { 
            frameWidth: 112, 
            frameHeight: 108 
        });
    }

    create() {
        // 1. DIMENSIONES DEL MUNDO
        this.physics.world.setBounds(0, 0, 12800, 600);

        // 2. PARALLAX
        this.fondoHorizontal = this.add.tileSprite(0, 0, 800, 600, 'fondo_l2');
        this.fondoHorizontal.setOrigin(0, 0).setScrollFactor(0).setDepth(-3);

        this.capaNubes = this.add.tileSprite(0, 0, 800, 600, 'fondo_l21');
        this.capaNubes.setOrigin(0, 0).setScrollFactor(0).setDepth(-2);

        // 3. FABRICACIÓN DE ANIMACIONES
        this.anims.create({
            key: 'caminar_benedict',
            frames: this.anims.generateFrameNumbers('benedict_walk', { start: 0, end: 4 }),
            frameRate: 10, 
            repeat: -1
        });

        this.anims.create({
            key: 'quieto_benedict',
            frames: [{ key: 'benedict_walk', frame: 0 }], 
            frameRate: 1
        });

        // Configurada para tus 4 frames nuevos de ataque
        this.anims.create({
            key: 'latigazo_benedict',
            frames: this.anims.generateFrameNumbers('benedict_attack', { start: 0, end: 3 }),
            frameRate: 12, // Un toque más lento para que se note la secuencia del látigo
            repeat: 0      
        });

        // 4. GRUPO DE PLATAFORMAS
        this.plataformas = this.physics.add.staticGroup();

        this.crearPisoSólido(0, 1500); 
        this.crearPisoSólido(1800, 4150); 
        this.crearPisoSólido(4450, 8000); 
        this.crearPisoSólido(8500, 12800);

        this.crearMuroLadrillos(800, 495, 60, 110); 
        this.crearPlataformaFlotante(1650, 460, 120, 20); 
        this.crearPlataformaFlotante(2300, 480, 150, 20); 
        this.crearMuroLadrillos(2500, 450, 50, 200);      
        this.crearPlataformaFlotante(2500, 350, 200, 20); 

        this.crearPlataformaFlotante(4220, 470, 90, 20); 
        this.crearPlataformaFlotante(4300, 440, 90, 20); 
        this.crearPlataformaFlotante(4380, 470, 90, 20); 

        this.crearMuroLadrillos(6000, 510, 40, 90);
        this.crearMuroLadrillos(6300, 470, 120, 160); 
        this.crearMuroLadrillos(6600, 510, 40, 90);

        // 5. JUGADOR
        this.jugador = new Jugador(this, 100, 480);

        // 6. CÁMARA
        this.cameras.main.setBounds(0, 0, 12800, 600);
        this.cameras.main.startFollow(this.jugador, true, 0.1, 0.1);

        // 7. COLISIONES
        this.physics.add.collider(this.jugador, this.plataformas);
        
        this.add.text(50, 50, 'NIVEL 2: SIDESCROLLER', { fontSize: '20px', fill: '#00ffff', fontWeight: 'bold' }).setScrollFactor(0);
        this.add.text(12500, 450, '🏁 META', { fontSize: '24px', fill: '#ffff00', fontWeight: 'bold' });
    }

    update() {
        if (this.jugador && this.jugador.active) {
            this.jugador.update(); 
        }

        this.fondoHorizontal.tilePositionX = this.cameras.main.scrollX * 0.2;
        this.capaNubes.tilePositionX = this.cameras.main.scrollX * 0.55;

        if (this.jugador.y > 620) {
            this.scene.start('EscenaSidescroller', { vidaHeredada: this.vidaActual });
        }

        if (this.jugador.x >= 12600) {
            this.jugador.body.setVelocity(0, 0);
            this.add.text(this.cameras.main.scrollX + 200, 250, '¡NIVEL COMPLETADO!', { fontSize: '40px', fill: '#00ff00', fontWeight: 'bold' });
            this.physics.world.shutdown();
        }
    }

    crearPisoSólido(inicioX, finX) {
        let ancho = finX - inicioX;
        let centroX = inicioX + (ancho / 2);
        let bloquePiso = this.add.rectangle(centroX, 580, ancho, 32, 0x00ff00);
        this.plataformas.add(bloquePiso);
        bloquePiso.body.updateFromGameObject();
    }

    crearPlataformaFlotante(x, y, ancho, alto) {
        let plat = this.add.rectangle(x, y, ancho, alto, 0x00ff00);
        this.plataformas.add(plat);
        plat.body.updateFromGameObject();
    }

    crearMuroLadrillos(x, y, ancho, alto) {
        let muro = this.add.rectangle(x, y, ancho, alto, 0xaaaaaa);
        this.plataformas.add(muro);
        muro.body.updateFromGameObject();
    }
}

class Jugador extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'benedict_walk');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.escena = scene;

        this.body.setCollideWorldBounds(true);
        this.body.setGravityY(600); 

        // Seteamos el origen fijo en el centro clásico para evitar saltos raros
        this.setOrigin(0.5, 0.5);

        // Caja de colisión para el estado normal (caminar/quieto)
        this.body.setSize(40, 95);  
        this.body.setOffset(25, 5);

        this.vidaMaxima = 100;
        this.vidaActual = 100;
        this.jugadorCayendo = false;
        this.alturaInicioCaida = 0;
        this.estaAtacando = false;

        this.teclas = this.escena.input.keyboard.createCursorKeys();
        this.teclaEspacio = this.escena.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    update() {
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

        // CORTE SENSITIVO DE SALTO
        if (Phaser.Input.Keyboard.JustUp(this.teclas.up) && this.body.velocity.y < 0) {
            this.body.setVelocityY(this.body.velocity.y * 0.4); 
        }

// DISPARAR LATIGAZO
        if (Phaser.Input.Keyboard.JustDown(this.teclaEspacio) && (this.body.blocked.down || this.body.touching.down)) {
            this.body.setVelocityX(0); 
            this.estaAtacando = true;

            // Cambiamos a la textura de ataque (112x108 con personaje centrado)
            this.setTexture('benedict_attack');

            // --- CONFIGURACIÓN ESTÁNDAR (PERSONAJE CENTRADO) ---
            // Como ahora el cuerpo está en el centro, el offset es el mismo para ambos lados.
            // Ajustá el primer número (36) si querés mover la caja un poquito más a la izquierda o derecha.
            this.body.setSize(40, 95);
            this.body.setOffset(36, 13); 

            this.anims.play('latigazo_benedict');

            // Frame 3 real (index 2) para el golpe
            this.on('animationupdate', (anim, frame) => {
                if (anim.key === 'latigazo_benedict' && frame.index === 2) {
                    console.log("¡GOLPE! Látigo estirado en el centro.");
                }
            });

            // Al terminar, volvemos al estado de caminata sin sacudidas
            this.once('animationcomplete', (anim) => {
                if (anim.key === 'latigazo_benedict') {
                    this.setTexture('benedict_walk');
                    
                    // Volvemos a la caja normal de caminata
                    this.body.setSize(40, 95);  
                    this.body.setOffset(25, 5);
                    
                    this.estaAtacando = false;
                    this.off('animationupdate'); 
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
        if (this.x < origenX) this.body.setVelocityX(-300);
        else this.body.setVelocityX(300);
        this.setTint(0xff0000); 
        this.escena.time.delayedCall(150, () => { this.clearTint(); }); 
    }

    recogerCuracion(puntos) {
        this.vidaActual += puntos;
        if (this.vidaActual > this.vidaMaxima) this.vidaActual = this.vidaMaxima;
        this.setTint(0x00ff00); 
        this.escena.time.delayedCall(100, () => { this.clearTint(); }); 
    }
}