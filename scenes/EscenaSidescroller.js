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
        this.load.spritesheet('benedict_walk', 'assets/benedict_walk.png', { 
            frameWidth: 60, 
            frameHeight: 80 
        });
        this.load.spritesheet('benedict_attack', 'assets/benedict_attack.png', { 
            frameWidth: 164, 
            frameHeight: 80 
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

        // 3. FABRICACIÓN DE ANIMACIONES (Para que las use el nuevo Jugador.js)
        this.anims.create({
            key: 'caminar_benedict',
            frames: this.anims.generateFrameNumbers('benedict_walk', { start: 0, end: 7 }),
            frameRate: 12,
            repeat: -1
        });

        this.anims.create({
            key: 'quieto_benedict',
            frames: [{ key: 'benedict_walk', frame: 0 }],
            frameRate: 1
        });

        this.anims.create({
            key: 'latigazo_benedict',
            frames: this.anims.generateFrameNumbers('benedict_attack', { start: 0, end: 3 }),
            frameRate: 15, // Velocidad rápida para el golpe
            repeat: 0      // Se ejecuta una sola vez por cada barra espaciadora
        });

        // 4. GRUPO DE PLATAFORMAS (Rediseñado para el salto de Benedict)
        this.plataformas = this.physics.add.staticGroup();

        // Tramos de suelo firme (Se quedan abajo, en Y: 580)
        this.crearPisoSólido(0, 1500); 
        this.crearPisoSólido(1800, 4150); 
        this.crearPisoSólido(4450, 8000); 
        this.crearPisoSólido(8500, 12800);

        // --- ARQUITECTURA MODIFICADA: ALTURAS CALIBRADAS ---
        
        // Primer obstáculo (Antes medía 200 de alto, ahora 110. Se salta cómodo)
        this.crearMuroLadrillos(800, 495, 60, 110); 
        
        // Primera fosa: Bajamos la plataforma de Y: 420 a Y: 460 para que caiga al alcance del salto
        this.crearPlataformaFlotante(1650, 460, 120, 20); 
        
        // El laberinto del km 2500: Bajamos todo una pantalla más cerca del piso
        this.crearPlataformaFlotante(2300, 480, 150, 20); // Escalón bajo
        this.crearMuroLadrillos(2500, 450, 50, 200);      // Muro recortado
        this.crearPlataformaFlotante(2500, 350, 200, 20); // Techo accesible para pasar por arriba

        // El gran pozo de la muerte (Entre 4150 y 4450): 
        // Bajamos las tres islas a Y: 470 y Y: 440. Llegás de un toque sin esfuerzo.
        this.crearPlataformaFlotante(4220, 470, 90, 20); // Isla 1
        this.crearPlataformaFlotante(4300, 440, 90, 20); // Isla 2 (un toque más alta tipo escalón)
        this.crearPlataformaFlotante(4380, 470, 90, 20); // Isla 3

        // Muros finales rítmicos (Recortados a un tamaño desafiante pero justo)
        this.crearMuroLadrillos(6000, 510, 40, 90);
        this.crearMuroLadrillos(6300, 470, 120, 160); // Un bloque gordo para trepar
        this.crearMuroLadrillos(6600, 510, 40, 90);


        // 5. JUGADOR (Arranca sobre el piso)
        this.jugador = new Jugador(this, 100, 500);

        // 6. CÁMARA
        this.cameras.main.setBounds(0, 0, 12800, 600);
        this.cameras.main.startFollow(this.jugador, true, 0.1, 0.1);

        // 7. COLISIONES
        this.physics.add.collider(this.jugador, this.plataformas);
        
        // Carteles informativos
        this.add.text(50, 50, 'NIVEL 2: SIDESCROLLER', { fontSize: '20px', fill: '#00ffff', fontWeight: 'bold' }).setScrollFactor(0);
        this.add.text(12500, 450, '🏁 META', { fontSize: '24px', fill: '#ffff00', fontWeight: 'bold' });
    }

    update() {
        // MODIFICADO: Ya no le pasamos "this.teclas" porque tu Jugador.js nuevo se maneja solo
        if (this.jugador && this.jugador.active) {
            this.jugador.update(); 
        }

        // Animación de fondos en Parallax
        this.fondoHorizontal.tilePositionX = this.cameras.main.scrollX * 0.2;
        this.capaNubes.tilePositionX = this.cameras.main.scrollX * 0.55;

        // Detector de caída libre al vacío
        if (this.jugador.y > 620) {
            this.scene.start('EscenaSidescroller', { vidaHeredada: this.vidaActual });
        }

        // Fin del nivel
        if (this.jugador.x >= 12600) {
            this.jugador.body.setVelocity(0, 0);
            this.add.text(this.cameras.main.scrollX + 200, 250, '¡NIVEL COMPLETADO!', { fontSize: '40px', fill: '#00ff00', fontWeight: 'bold' });
            this.physics.world.shutdown();
        }
    }

    // Métodos limpios para armado rápido
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