class EscenaSidescroller extends Phaser.Scene {
    constructor() {
        super({ key: 'EscenaSidescroller' });
    }

    preload() {
        // Fondos
        this.load.image('fondo_l2', 'background/fondo_l2.png');   
        this.load.image('fondo_l21', 'background/fondo_l21.png'); 
        
        // Caminata (único spritesheet que usaremos)
        this.load.spritesheet('benedict_walk', 'assets/benedict_walk.png', { 
            frameWidth: 90, 
            frameHeight: 100 
        });

        this.load.spritesheet('benedict_attack', 'assets/benedict_attack.png', { 
        frameWidth: 230, 
        frameHeight: 108 
    });
    }

    create() {
        // Límites del mundo largos para probar
        this.physics.world.setBounds(0, 0, 3000, 600);

        // Fondos con Parallax (quedan igual)
        this.fondoHorizontal = this.add.tileSprite(0, 0, 800, 600, 'fondo_l2').setOrigin(0, 0).setScrollFactor(0).setDepth(-3);
        this.capaNubes = this.add.tileSprite(0, 0, 800, 600, 'fondo_l21').setOrigin(0, 0).setScrollFactor(0).setDepth(-2);

        // Animaciones basadas en 'benedict_walk'
        this.anims.create({
            key: 'caminar_benedict',
            frames: this.anims.generateFrameNumbers('benedict_walk', { start: 0, end: 4 }),
            frameRate: 10, 
            repeat: -1
        });

        this.anims.create({
            key: 'quieto_benedict',
            frames: [{ key: 'benedict_walk', frame: 0 }], // Frame parado
            frameRate: 1
        });

        this.anims.create({
            key: 'latigazo_benedict',
            frames: this.anims.generateFrameNumbers('benedict_attack', { start: 0, end: 3 }),
            frameRate: 12, // Velocidad para que se note la secuencia
            repeat: 0      
        });

        // Piso plano y largo
        this.plataformas = this.physics.add.staticGroup();
        let piso = this.add.rectangle(1500, 580, 3000, 32, 0x00ff00);
        this.plataformas.add(piso);
        piso.body.updateFromGameObject();

        // Creamos al jugador
        this.jugador = new Jugador(this, 100, 480);

        // Cámara
        this.cameras.main.setBounds(0, 0, 3000, 600);
        this.cameras.main.startFollow(this.jugador, true, 0.1, 0.1);

        // Activar colisión
        this.physics.add.collider(this.jugador, this.plataformas);
    }

    update() {
        if (this.jugador && this.jugador.active) {
            this.jugador.update(); 
        }

        // Mover fondos con la cámara
        this.fondoHorizontal.tilePositionX = this.cameras.main.scrollX * 0.2;
        this.capaNubes.tilePositionX = this.cameras.main.scrollX * 0.55;
    }
}