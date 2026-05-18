class EscenaBoss extends Phaser.Scene {
    constructor() {
        super({ key: 'EscenaBoss' });
    }

    init(data) {
        // Heredamos la vida que traía el jugador desde la torre
        this.vidaJugador = data.vidaHeredada || 100;
        this.vidaMaximaJugador = 100;
        
        // Configuración del Jefe
        this.vidaMaxBoss = 500; // ¡Tiene bastante vida!
        this.vidaActualBoss = 500;
    }

    preload() {
        // Cargamos el fondo de estrellas para mantener la estética de la cima
        this.load.image('estrellas', 'background/fondo_estrellas.png');
    }

    create() {
        // 1. FONDO (Estático porque acá no hay scroll)
        let fondo = this.add.image(400, 300, 'estrellas');
        fondo.setDepth(-2);

        // 2. GRUPOS DE FÍSICAS
        this.plataformas = this.physics.add.staticGroup();
        this.poderesJugador = this.physics.add.group({ allowGravity: false });
        this.balasBoss = this.physics.add.group({ allowGravity: false });

        // 3. DISEÑO DE LA ARENA (Estilo Tumblepop / Pantalla Fija)
        // Suelo bajo
        let suelo = this.add.rectangle(400, 580, 800, 32, 0x00ff00);
        this.plataformas.add(suelo);
        suelo.body.updateFromGameObject();

        // Plataformas flotantes para poder trepar y esquivar
        let plat1 = this.add.rectangle(200, 420, 200, 20, 0x00ff00);
        let plat2 = this.add.rectangle(600, 420, 200, 20, 0x00ff00);
        let plat3 = this.add.rectangle(400, 260, 300, 20, 0x00ff00);
        this.plataformas.addMultiple([plat1, plat2, plat3]);
        plat1.body.updateFromGameObject();
        plat2.body.updateFromGameObject();
        plat3.body.updateFromGameObject();

        // 4. JUGADOR (Instanciamos uno nuevo pero con la vida que traía)
        // Usamos la misma clase Jugador.js que ya tenés hecha
        this.jugador = new Jugador(this, 100, 500);
        this.vidaActual = this.vidaJugador; // Seteamos su vida real
        this.vidaMaxima = this.vidaMaximaJugador;

        // 5. EL BOSS (Cuadrado grande rojo)
        this.boss = this.add.rectangle(400, 150, 80, 80, 0xff0000);
        this.physics.add.existing(this.boss);
        this.boss.body.setAllowGravity(false);
        this.boss.body.setImmovable(true);
        
        // Movimiento de vaivén horizontal para el Jefe
        this.boss.body.setVelocityX(150);

        // 6. INTERFAZ DE VIDA (Jugador y Boss)
        this.interfazGrafica = this.add.graphics();
        this.textoBoss = this.add.text(350, 20, 'JEFE DE LA TORRE', { fontSize: '18px', fill: '#ff0000', fontWeight: 'bold' });

        // 7. COLISIONES
        this.physics.add.collider(this.jugador, this.plataformas);
        this.physics.add.collider(this.poderesJugador, this.plataformas, (b) => b.destroy());
        this.physics.add.collider(this.balasBoss, this.plataformas, (b) => b.destroy());

        // Daño al Boss con nuestros disparos
        this.physics.add.overlap(this.poderesJugador, this.boss, this.danioAlBoss, null, this);
        // Daño al Jugador con las balas del Boss
        this.physics.add.overlap(this.jugador, this.balasBoss, this.recibirDanioBoss, null, this);
        // Daño si tocás el cuerpo del Boss directamente
        this.physics.add.overlap(this.jugador, this.boss, () => { this.recibirDanioDirecto(0.5); }, null, this);

        // 8. CONTROLES DE DISPARO (Igual que en la torre)
        this.teclas = this.input.keyboard.createCursorKeys();
        this.input.on('pointerdown', (pointer) => {
            let disparo = this.add.rectangle(this.jugador.x, this.jugador.y, 12, 12, 0xffff00);
            this.poderesJugador.add(disparo); 
            this.physics.moveTo(disparo, pointer.x, pointer.y, 600); 
        });

        // 9. TEMPORIZADOR DE ATAQUES DEL BOSS (Ataca cada 1.2 segundos)
        this.time.addEvent({
            delay: 1200,
            callback: this.ataqueDelBoss,
            callbackScope: this,
            loop: true
        });
    }

    update() {
        // Actualizamos controles del jugador
        if (this.jugador && this.jugador.active) {
            this.jugador.update(this.teclas);
        }

        // Rebote del jefe en los bordes de la pantalla (0 a 800)
        if (this.boss && this.boss.active) {
            if (this.boss.x >= 700) this.boss.body.setVelocityX(-150);
            if (this.boss.x <= 100) this.boss.body.setVelocityX(150);
        }

        this.dibujarBarrasVida();
    }

    ataqueDelBoss() {
        if (!this.boss || !this.boss.active) return;

        // Elige un ataque aleatorio: 0 = Ráfaga hacia el jugador, 1 = Lluvia de balas
        let tipoAtaque = Math.random() < 0.5 ? 0 : 1;

        if (tipoAtaque === 0) {
            // Disparo teledirigido al jugador
            let bala = this.add.rectangle(this.boss.x, this.boss.y + 40, 16, 16, 0xff5500);
            this.balasBoss.add(bala);
            this.physics.moveToObject(bala, this.jugador, 300);
        } else {
            // Lluvia de 3 balas en abanico hacia abajo
            let velocidadesX = [-100, 0, 100];
            velocidadesX.forEach(vx => {
                let bala = this.add.rectangle(this.boss.x, this.boss.y + 40, 14, 14, 0xff00ff);
                this.balasBoss.add(bala);
                bala.body.setVelocity(vx, 250);
            });
        }
    }

    danioAlBoss(boss, disparo) {
        disparo.destroy();
        this.vidaActualBoss -= 10; // Le sacamos 10 de vida por tiro

        if (this.vidaActualBoss <= 0) {
            this.boss.destroy();
            this.physics.world.shutdown(); // Frenamos las físicas
            
            this.add.text(250, 300, '¡JEFE DERROTADO!', { fontSize: '32px', fill: '#00ff00', fontWeight: 'bold' });
            
            // Esperamos 3 segundos y pasamos a la escena horizontal (la crearemos después)
            this.time.delayedCall(3000, () => {
                alert("¡Acá va a arrancar el nivel Sidescroller Horizontal!");
                // this.scene.start('EscenaSidescroller', { vidaHeredada: this.vidaActual });
            });
        }
    }

    recibirDanioBoss(jugador, bala) {
        bala.destroy();
        this.vidaActual -= 15; // Las balas sacan 15
        if (this.vidaActual <= 0) this.recibirMuerte();
    }

    recibirDanioDirecto(cantidad) {
        this.vidaActual -= cantidad; // Tocarlo directamente drena vida rápido
        if (this.vidaActual <= 0) this.recibirMuerte();
    }

    recibirMuerte() {
        this.scene.start('EscenaPrincipal'); // Si morís en el Boss, volvés a empezar la torre
    }

    dibujarBarrasVida() {
        this.interfazGrafica.clear();

        // Barra del Jugador (Esquina inferior izquierda)
        this.interfazGrafica.fillStyle(0x333333, 1);
        this.interfazGrafica.fillRect(20, 540, 200, 15);
        if (this.vidaActual > 0) {
            this.interfazGrafica.fillStyle(0x00ff00, 1);
            this.interfazGrafica.fillRect(20, 540, (this.vidaActual / this.vidaMaxima) * 200, 15);
        }

        // Barra del Boss (Arriba en el centro)
        this.interfazGrafica.fillStyle(0x333333, 1);
        this.interfazGrafica.fillRect(250, 45, 300, 20);
        if (this.vidaActualBoss > 0) {
            this.interfazGrafica.fillStyle(0xff0000, 1);
            this.interfazGrafica.fillRect(250, 45, (this.vidaActualBoss / this.vidaMaxBoss) * 300, 20);
        }
    }
}