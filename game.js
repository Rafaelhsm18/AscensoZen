// =================================================================
// GAME CONFIGURATION
// =================================================================

const FONT_STYLE = {
    fontFamily: '"Trebuchet MS", Arial, sans-serif',
    fontSize: '24px',
    fill: '#ffffff'
};

const CONTINUE_COST = 25;

// --- FUNCIONALIDAD DE COLOR REINTEGRADA ---
const PLAYER_COLORS = [0xffffff, 0x00a8f3, 0xf300bf, 0x93f300, 0xf3a800];
let currentPlayerColorIndex = 0;
// -----------------------------------------

let highscore = localStorage.getItem('ascensoZenHighscore') || 0;
let totalFichas = parseInt(localStorage.getItem('ascensoZenFichas') || '0');


// =================================================================
// SCENE: PRELOADER
// =================================================================
class PreloaderScene extends Phaser.Scene {
    constructor() { super('PreloaderScene'); }
    preload() {
        const progressBar = this.add.graphics(), progressBox = this.add.graphics();
        progressBox.fillStyle(0x222222, 0.8).fillRect(this.scale.width / 2 - 160, this.scale.height / 2 - 30, 320, 50);
        this.load.on('progress', v => { progressBar.clear().fillStyle(0xffffff, 1).fillRect(this.scale.width / 2 - 150, this.scale.height / 2 - 20, 300 * v, 30); });
        this.load.on('complete', () => { progressBar.destroy(); progressBox.destroy(); this.scene.start('MainMenuScene'); });

        this.load.image('particle', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAEKADAAQAAAABAAAAEAAAAAA0VX1wAAABJklEQVQ4EbXQvUoDQRSG4f+7Z3d2dYknaOFN7CSiIO8gu02ws/YBCwstfIuV/gtbCVhYKIoIBoVIkNiZzc7M7p4pyJtCu6Te+Xw4nB9ESAznV0dC8XzxbPEjRB7vj2S9vGTE5418xMREDq9jK+rj5Dk5w9n5eYxUe3EaCeXp1dM3C2v16w+vG2A4pUv0+kMpbS3V69XajL17NIr35904ZlZV5vVagj2PnkfA6n/mh+Yc4E5k2Zs3ry8YQDOzsws7MnM4MjA0MO0xd3d3YVTmF9b4HnFWlbXVwG4Q3tLS9t7e0tbW4uXmxtzc3d3d7e3t7e5uXlxcXF+fn5+bm7u7e3t6urq4uLi8vLysrKysqurq5ubm7u7e3t7e4vL64uLi/v7A+Hz12d2bdxTAAAAAElFTkSuQmCC');
        this.load.image('player_medusa', 'assets/medusa.png');
        this.load.image('obstacle_cangrejo', 'assets/cangrejo.png');
        this.load.image('collectible_almeja', 'assets/almeja.png');
    }
}

// =================================================================
// SCENE: MAIN MENU
// =================================================================
class MainMenuScene extends Phaser.Scene {
    constructor() { super('MainMenuScene'); }
    create() {
        this.cameras.main.setBackgroundColor('#006994');

        // --- INICIO DEL NUEVO ESTILO PARA EL TÍTULO ---

        // 1. Creamos el objeto de texto con la configuración básica de tamaño y fuente
        const title = this.add.text(
            this.scale.width / 2, 
            this.scale.height * 0.2, 
            'Ascenso Zen', 
            {
                fontFamily: 'Impact, "Arial Black", sans-serif', // Una fuente más gruesa e impactante
                fontSize: '80px', // Un poco más grande
                stroke: '#001a33', // Un borde azul muy oscuro
                strokeThickness: 8,
                shadow: {
                    offsetX: 5,
                    offsetY: 5,
                    color: '#000000',
                    blur: 8,
                    stroke: true,
                    fill: true
                }
            }
        ).setOrigin(0.5);

        // 2. Creamos un degradado de color para el relleno del texto
        const gradient = title.context.createLinearGradient(0, 0, 0, title.height);
        gradient.addColorStop(0, '#87CEEB');   // Color superior (azul cielo claro)
        gradient.addColorStop(1, '#00BFFF');   // Color inferior (azul intenso)

        // 3. Aplicamos el degradado al texto
        title.setFill(gradient);
        
        // --- FIN DEL NUEVO ESTILO PARA EL TÍTULO ---


        // El resto del código del menú sigue igual
        const playButton = this.add.text(this.scale.width / 2, this.scale.height / 2, 'JUGAR', { ...FONT_STYLE, fontSize: '32px', backgroundColor: '#3d006b', padding: { x: 20, y: 10 } }).setOrigin(0.5).setInteractive();
        playButton.on('pointerdown', () => this.scene.start('GameScene', { score: 0, fichas: 0, hasContinued: false }));

        this.add.text(this.scale.width / 2, this.scale.height - 100, `MÁXIMA PUNTUACIÓN: ${highscore}`, FONT_STYLE).setOrigin(0.5);
        this.add.text(this.scale.width / 2, this.scale.height - 50, `FICHAS TOTALES: ${totalFichas}`, FONT_STYLE).setOrigin(0.5);
        
        this.add.particles(0, 0, 'particle', {
            x: { min: 0, max: this.scale.width },
            y: this.scale.height + 10,
            speedY: { min: -30, max: -80 },
            lifespan: { min: 4000, max: 7000 },
            scale: { min: 0.1, max: 0.7 },
            alpha: { start: 0.7, end: 0 },
            quantity: 1,
            frequency: 400,
            blendMode: 'NORMAL',
            tint: 0x102C57
        });
    }
}

// =================================================================
// SCENE: GAME
// =================================================================
class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }

    init(data) {
        this.score = data.score || 0;
        this.fichas = data.fichas || 0;
        this.hasContinued = data.hasContinued || false;
    }

    create() {
        this.cameras.main.setBackgroundColor('#006994');
        this.obstacles = this.physics.add.group({ immovable: true, allowGravity: false });
        this.fichasGroup = this.physics.add.group({ allowGravity: false });

        this.player = this.physics.add.sprite(this.scale.width / 2, this.scale.height * 0.8, 'player_medusa');
        // --- FUNCIONALIDAD DE COLOR REINTEGRADA ---
        // Aplicamos el color desbloqueado a la medusa (si no es el blanco por defecto)
        if (PLAYER_COLORS[currentPlayerColorIndex] !== 0xffffff) {
            this.player.setTint(PLAYER_COLORS[currentPlayerColorIndex]);
        }
        
        this.player.body.setSize(48, 48).setAllowGravity(false);
        this.player.setCollideWorldBounds(true).setDepth(10);
        
        if (this.hasContinued) {
            this.player.setAlpha(0.5);
            this.time.delayedCall(2000, () => {
                this.player.setAlpha(1.0);
                this.physics.add.collider(this.player, this.obstacles, this.gameOver, null, this);
            });
        } else {
            this.physics.add.collider(this.player, this.obstacles, this.gameOver, null, this);
        }
        
        this.physics.add.overlap(this.player, this.fichasGroup, this.collectFicha, null, this);

        this.scoreText = this.add.text(20, 20, `Puntos: ${this.score}`, FONT_STYLE);
        this.fichasText = this.add.text(this.scale.width - 20, 20, `Fichas: ${this.fichas}`, FONT_STYLE).setOrigin(1, 0);
        
        this.time.addEvent({ delay: 100, callback: () => { this.score++; this.scoreText.setText('Puntos: ' + this.score); }, loop: true });
        this.time.addEvent({ delay: 1500, callback: this.addObstacleRow, callbackScope: this, loop: true });
        this.time.addEvent({ delay: 3100, callback: this.addFicha, callbackScope: this, loop: true });
    }

    update() {
        if (this.input.activePointer.isDown) { this.player.body.velocity.x = 280; } 
        else { this.player.body.velocity.x = -280; }
    }
    
    addObstacleRow() {
        const gap = 220, position = Phaser.Math.Between(50 + gap / 2, this.scale.width - 50 - gap / 2);
        const leftEdge = position - gap / 2, rightEdge = position + gap / 2;
        const obstacleY = -50, crabSize = 48;
        for (let x = crabSize / 2; x < leftEdge; x += crabSize) { this.createCrab(x, obstacleY); }
        for (let x = rightEdge + crabSize / 2; x < this.scale.width; x += crabSize) { this.createCrab(x, obstacleY); }
    }

    createCrab(x, y) {
        const crab = this.obstacles.create(x, y, 'obstacle_cangrejo');
        crab.body.velocity.y = 250;
        crab.setDepth(10);
        this.time.delayedCall(5000, () => { if (crab.active) crab.destroy(); });
    }

    addFicha() {
        const x = Phaser.Math.Between(50, this.scale.width - 50);
        const ficha = this.fichasGroup.create(x, -50, 'collectible_almeja');
        ficha.body.velocity.y = 300;
        ficha.setScale(0.8);
        this.tweens.add({ targets: ficha, angle: 360, duration: 4000, repeat: -1 });
        this.time.delayedCall(5000, () => { if (ficha.active) ficha.destroy(); });
    }
    
    collectFicha(player, ficha) {
        ficha.destroy();
        this.fichas++;
        this.fichasText.setText('Fichas: ' + this.fichas);
    }

    gameOver() {
        this.physics.pause();
        this.player.setTint(0xff0000);
        this.cameras.main.shake(300, 0.01);
        
        if (this.score > highscore) {
            highscore = this.score;
            localStorage.setItem('ascensoZenHighscore', highscore);
        }
        totalFichas += this.fichas;
        localStorage.setItem('ascensoZenFichas', totalFichas);

        this.time.delayedCall(1000, () => {
            this.scene.start('GameOverScene', { score: this.score, hasContinued: this.hasContinued });
        });
    }
}

// =================================================================
// SCENE: GAME OVER & CONTINUE
// =================================================================
class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }

    init(data) {
        this.score = data.score;
        this.hasContinued = data.hasContinued;
    }

    create() {
        this.cameras.main.setBackgroundColor('#006994');
        this.add.text(this.scale.width / 2, this.scale.height * 0.2, 'FIN DE LA PARTIDA', { ...FONT_STYLE, fontSize: '42px' }).setOrigin(0.5);
        this.add.text(this.scale.width / 2, this.scale.height * 0.35, `Puntos: ${this.score}`, FONT_STYLE).setOrigin(0.5);

        if (!this.hasContinued && totalFichas >= CONTINUE_COST) {
            this.createContinueButtons();
        } else {
            this.createEndGameButtons();
        }
    }
    
    createContinueButtons() {
        this.add.text(this.scale.width / 2, this.scale.height * 0.5, `¿VIDA EXTRA?`, { ...FONT_STYLE, fill: '#f3a800' }).setOrigin(0.5);

        const continueButton = this.add.text(this.scale.width / 2, this.scale.height * 0.65, `CONTINUAR (${CONTINUE_COST} Fichas)`, { ...FONT_STYLE, fontSize: '22px', backgroundColor: '#004f27', padding: { x: 15, y: 10 } }).setOrigin(0.5).setInteractive();
        continueButton.on('pointerdown', () => {
            totalFichas -= CONTINUE_COST;
            localStorage.setItem('ascensoZenFichas', totalFichas);
            this.scene.start('GameScene', { score: this.score, fichas: 0, hasContinued: true });
        });

        const endButton = this.add.text(this.scale.width / 2, this.scale.height * 0.8, 'TERMINAR PARTIDA', { ...FONT_STYLE, fontSize: '22px', backgroundColor: '#8b0000', padding: { x: 15, y: 10 } }).setOrigin(0.5).setInteractive();
        endButton.on('pointerdown', () => this.scene.start('MainMenuScene'));
    }

    createEndGameButtons() {
        this.add.text(this.scale.width / 2, this.scale.height * 0.45, `Máximo: ${highscore}`, { ...FONT_STYLE, fill: '#f3a800' }).setOrigin(0.5);
        
        const menuButton = this.add.text(this.scale.width / 2, this.scale.height * 0.6, 'MENÚ PRINCIPAL', { ...FONT_STYLE, fontSize: '28px', backgroundColor: '#3d006b', padding: { x: 15, y: 10 } }).setOrigin(0.5).setInteractive();
        menuButton.on('pointerdown', () => this.scene.start('MainMenuScene'));

        // --- FUNCIONALIDAD DE COLOR REINTEGRADA ---
        const rewardCost = 10;
        const rewardText = `Desbloquear color (${rewardCost} Fichas)`;
        const rewardButton = this.add.text(this.scale.width / 2, this.scale.height * 0.75, rewardText, { ...FONT_STYLE, fontSize: '18px', align: 'center', backgroundColor: '#004f27', padding: { x: 10, y: 5 } }).setOrigin(0.5);

        if (totalFichas >= rewardCost) {
            rewardButton.setInteractive().on('pointerdown', () => {
                totalFichas -= rewardCost;
                localStorage.setItem('ascensoZenFichas', totalFichas);
                let newColorIndex;
                do { newColorIndex = Phaser.Math.Between(0, PLAYER_COLORS.length - 1); }
                while (newColorIndex === currentPlayerColorIndex);
                currentPlayerColorIndex = newColorIndex;
                rewardButton.setText('¡Color Desbloqueado!').disableInteractive().setStyle({ backgroundColor: '#333' });
            });
        } else {
            rewardButton.setAlpha(0.5);
        }
        // ---------------------------------------------

        if (!this.hasContinued && totalFichas < CONTINUE_COST) {
            this.add.text(this.scale.width / 2, this.scale.height * 0.9, `Necesitas ${CONTINUE_COST} fichas para una vida extra`, { ...FONT_STYLE, fontSize: '16px' }).setOrigin(0.5);
        }
    }
}

// =================================================================
// GAME INITIALIZATION
// =================================================================
const config = {
    type: Phaser.AUTO,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 450, height: 800 },
    physics: { default: 'arcade', arcade: { debug: false } },
    scene: [PreloaderScene, MainMenuScene, GameScene, GameOverScene],
    backgroundColor: '#0d0014'
};

const game = new Phaser.Game(config);