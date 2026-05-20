class Jugador extends Phaser.Physics.Arcade.Sprite {
    constructor(scene, x, y) {
        super(scene, x, y, 'benedict_walk');

        scene.add.existing(this);
        scene.physics.add.existing(this);

        this.escena = scene;

        this.body.setCollideWorldBounds(true);
        this.body.setGravityY(700); 

        this.setOrigin(0.5, 0.5);

        // Caja fija inamovible de la caminata
        this.body.setSize(40, 95);  
        this.body.setOffset(25, 5);

        // NUEVO: Candado para bloquear acciones durante el ataque
        this.estaAtacando = false;

        this.teclas = this.escena.input.keyboard.createCursorKeys();
        // NUEVO: Registrar la barra espaciadora
        this.teclaEspacio = this.escena.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);
    }

    update() {
        // Si está atacando, se frena el update para que no camine ni salte en el medio del látigo
        if (this.estaAtacando) return;

        const enSuelo = this.body.blocked.down || this.body.touching.down;

        // 1. MOVIMIENTO HORIZONTAL
        if (this.teclas.left.isDown) {
            this.body.setVelocityX(-200);
            this.setFlipX(true); 
            if (enSuelo) this.anims.play('caminar_benedict', true);
        } else if (this.teclas.right.isDown) {
            this.body.setVelocityX(200);
            this.setFlipX(false); 
            if (enSuelo) this.anims.play('caminar_benedict', true);
        } else {
            this.body.setVelocityX(0);
            if (enSuelo) this.anims.play('quieto_benedict', true);
        }

        // 2. EL SALTO (Con tu lógica de parado)
        if (this.teclas.up.isDown && enSuelo) {
            this.body.setVelocityY(-650); 
            this.anims.play('quieto_benedict', true);
        }

        if (!enSuelo) {
            this.anims.play('quieto_benedict', true);
        }

if (Phaser.Input.Keyboard.JustDown(this.teclaEspacio) && enSuelo) {

    this.body.setVelocityX(0);
    this.estaAtacando = true;

    this.x += this.flipX ? -100 : 100;

    this.setTexture('benedict_attack');

    this.anims.play('latigazo_benedict');

    this.once('animationcomplete', (anim) => {

        if (anim.key === 'latigazo_benedict') {

            this.x -= this.flipX ? -100 : 100;

            this.setTexture('benedict_walk');

            this.estaAtacando = false;
        }

    });


            this.anims.play('latigazo_benedict');

    // 3. NUEVO: DISPARAR LATIGAZO (WHIP)
if (Phaser.Input.Keyboard.JustDown(this.teclaEspacio) && enSuelo) {
    this.body.setVelocityX(0);
    this.estaAtacando = true;

    this.setTexture('benedict_attack');
    
    // Mantenemos el offset fijo para que no salte el personaje
    // Ajustá estos valores si ves que el personaje se desplaza al atacar
    const offsetAtaqueX = this.flipX ? 45 : 95; 
    this.body.setSize(40, 95);
    this.body.setOffset(offsetAtaqueX, 13); 

    this.anims.play('latigazo_benedict');

    // Usamos 'animationupdate' solo para detectar el momento del golpe, 
    // PERO sin cambiar el tamaño de la caja para evitar que se caiga.
    this.on('animationupdate', (anim, frame) => {
        if (anim.key === 'latigazo_benedict' && frame.index === 3) {
            // Solo activamos la hitbox de golpe aquí, pero mantenemos el ancho del cuerpo
            // Si necesitas detectar el golpe, usá otra variable (ej: this.estaGolpeando = true)
        }
    });

    this.once('animationcomplete', (anim) => {
        if (anim.key === 'latigazo_benedict') {
            this.setTexture('benedict_walk');
            this.body.setSize(40, 95);  
            this.body.setOffset(25, 5); // Volvemos a la caja de caminata original
            
            this.estaAtacando = false;
            this.off('animationupdate');
        }
    });
}
}
}
}   