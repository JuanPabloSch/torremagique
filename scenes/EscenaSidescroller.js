class EscenaSidescroller extends Phaser.Scene {
    constructor() {
        super({ key: 'EscenaSidescroller' });
    }

    init(data) {
        // Recibimos la vida con la que el jugador terminó la Boss Fight
        this.vidaActual = data.vidaHeredada || 100;
        this.vidaMaxima = 100;
    }

    preload() {
        // Reutilizamos el fondo de estrellas para tener algo de textura de fondo
        this.load.image('estrellas', 'background/fondo_estrellas.png');
    }

    create() {
        // 1. DIMENSIONES DEL MUNDO HORIZONTAL
        // El mapa va a tener 3200 píxeles de ancho (4 pantallas de largo) y 600 de alto
        this.physics.world.setBounds(0, 0, 3200, 600);

        // 2. FONDO EN PARALLAX HORIZONTAL
        // Usamos un tileSprite para que se repita a lo largo de todo el camino derecho
        this.fondoHorizontal = this.add.tileSprite(0, 0, 3200, 600, 'estrellas');
        this.fondoHorizontal.setOrigin(0, 0);
        this.fondoHorizontal.setScrollFactor(0); // Se queda fijo con la cámara para moverlo por código
        this.fondoHorizontal.setDepth(-2);

        // 3. LÍNEA DE REFERENCIA VISUAL (Para notar el movimiento del fondo)
        // Dibujamos una línea blanca punteada en el medio del cielo para ver cómo avanza
        this.lineaReferencia = this.add.graphics();
        this.lineaReferencia.lineStyle(4, 0xffffff, 0.3);
        // Dibujamos marcas cada 200 píxeles a lo largo del mapa
        for (let i = 0; i < 3200; i += 200) {
            this.lineaReferencia.lineBetween(i, 200, i + 50, 200);
        }

        // 4. GRUPO DE PLATAFORMAS (El piso)
        this.plataformas = this.physics.add.staticGroup();

        // Creamos un piso larguísimo verde que cubra todo el ancho del nuevo mundo
        let pisoLargo = this.add.rectangle(1600, 580, 3200, 32, 0x00ff00);
        this.plataformas.add(pisoLargo);
        pisoLargo.body.updateFromGameObject();

        // 5. JUGADOR
        // Lo spawneamos al principio a la izquierda (X: 100)
        this.jugador = new Jugador(this, 100, 500);

        // 6. CÁMARA RECTÁNGULO (Configuración Sidescroller)
        // Le decimos a la cámara que no se pase de los límites del mundo horizontal
        this.cameras.main.setBounds(0, 0, 3200, 600);
        // Hacemos que la cámara siga al jugador en su eje X
        this.cameras.main.startFollow(this.jugador, true, 0.1, 0.1);

        // 7. COLISIONES
        this.physics.add.collider(this.jugador, this.plataformas);

        // 8. CONTROLES
        this.teclas = this.input.keyboard.createCursorKeys();
        
        // Texto de aviso temporal
        this.add.text(50, 50, 'NIVEL 2: SIDESCROLLER', { fontSize: '20px', fill: '#00ffff', fontWeight: 'bold' }).setScrollFactor(0);
    }

    update() {
        // Actualizamos los movimientos del jugador
        if (this.jugador && this.jugador.active) {
            this.jugador.update(this.teclas);
        }

        // EFECTO PARALLAX HORIZONTAL:
        // Movemos la textura del fondo en base a la posición X de la cámara (muy despacito)
        this.fondoHorizontal.tilePositionX = this.cameras.main.scrollX * 0.2;
    }
}