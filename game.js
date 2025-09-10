// =================================================================
// GAME CONFIGURATION
// =================================================================

const FONT_STYLE = { fontFamily: '"Trebuchet MS", Arial, sans-serif', fontSize: '24px', fill: '#ffffff' };
const CONTINUE_COST = 25;
const PLAYER_COLORS = [0xffffff, 0x00a8f3, 0xf300bf, 0x93f300, 0xf3a800];
let currentPlayerColorIndex = 0;
let highscore = localStorage.getItem('ascensoZenHighscore') || 0;
let totalFichas = parseInt(localStorage.getItem('ascensoZenFichas') || '0');
let music;

// =================================================================
// SECRET MESSAGE SYSTEM
// =================================================================
const SECRET_MESSAGE = [
    "Entonces aparecerá\nla señal...",
    "..del Hijo del Hombre\nen el cielo;",
    "y entonces \nlamentarán...",
    "...todas las tribus\nde la tierra,",
    "y verán al Hijo\ndel Hombre...",
    "..viniendo sobre las nubes\ndel cielo,",
    "con poder y \ngran gloria.",
    "Y enviará a \nsus ángeles...",
    "...con gran voz\nde trompeta,",
    "y juntarán a \nsus escogidos…",
    "XXII.D.MMXXVI"
];
let unlockedClues = JSON.parse(localStorage.getItem('ascensoZenClues')) || [];

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

        this.load.image('background_vertical', 'assets/background_vertical.png');
        this.load.image('particle', 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAABAAAAAQCAYAAAAf8/9hAAAAAXNSR0IArs4c6QAAAERlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAA6ABAAMAAAABAAEAAKACAAQAAAABAAAAEKADAAQAAAABAAAAEAAAAAA0VX1wAAABJklEQVQ4EbXQvUoDQRSG4f+7Z3d2dYknaOFN7CSiIO8gu02ws/YBCwstfIuV/gtbCVhYKIoIBoVIkNiZzc7M7p4pyJtCu6Te+Xw4nB9ESAznV0dC8XzxbPEjRB7vj2S9vGTE5418xMREDq9jK+rj5Dk5w9n5eYxUe3EaCeXp1dM3C2v16w+vG2A4pUv0+kMpbS3V69XajL17NIr35904ZlZV5vVagjजबPnkfA6n/mh+Yc4E5k2Zs3ry8YQDOzsws7MnM4MjA0MO0xd3d3YVTmF9b4HnFWlbXVwG4Q3tLS9t7e0tbW4uXmxtzc3d3d7e3t7e5uXlxcXF+fn5+bm7u7e3t6urq4uLi8vLysrKysqurq5ubm7u7e3t7e4vL64uLi/v7A+Hz12d2bdxTAAAAAElFTSuQmCC');
        this.load.image('player_medusa', 'assets/medusa.png');
        this.load.image('obstacle_cangrejo', 'assets/cangrejo.png');
        this.load.image('cangrejo_cerrado', 'assets/cangrejo_cerrado.png');
        this.load.image('collectible_almeja', 'assets/almeja.png');
        this.load.audio('music', 'audio/music.mp3');
        this.load.audio('collect_sfx', 'audio/collect.wav');
        this.load.audio('gameover_sfx', 'audio/gameover.wav');
        this.load.audio('click_sfx', 'audio/click.wav');
        this.load.audio('impulse_sfx', 'audio/impulso.mp3');
    }
}

// =================================================================
// SCENE: MAIN MENU
// =================================================================
class MainMenuScene extends Phaser.Scene {
    constructor() { super('MainMenuScene'); }
    create() {
        this.background = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'background_vertical').setOrigin(0,0);
        this.background.setTileScale(this.scale.width / this.background.width);
        if (!music || !music.isPlaying) { music = this.sound.add('music', { loop: true, volume: 0.4 }); music.play(); }

        const title = this.add.text(this.scale.width / 2, this.scale.height * 0.2, 'Ascenso Zen', { fontFamily: 'Impact, "Arial Black", sans-serif', fontSize: '80px', stroke: '#001a33', strokeThickness: 8, shadow: { offsetX: 5, offsetY: 5, color: '#000000', blur: 8, stroke: true, fill: true } }).setOrigin(0.5);
        const gradient = title.context.createLinearGradient(0, 0, 0, title.height);
        gradient.addColorStop(0, '#87CEEB'); gradient.addColorStop(1, '#00BFFF');
        title.setFill(gradient);
        
        const playButton = this.add.text(this.scale.width / 2, this.scale.height * 0.45, 'JUGAR', { ...FONT_STYLE, fontSize: '32px', backgroundColor: '#3d006b', padding: { x: 20, y: 10 } }).setOrigin(0.5).setInteractive();
        playButton.on('pointerdown', () => { this.sound.play('click_sfx'); this.scene.start('GameScene', { score: 0, fichas: 0, hasContinued: false }); });

        const secretButton = this.add.text(this.scale.width / 2, this.scale.height * 0.60, 'VER SECRETO', { ...FONT_STYLE, fontSize: '26px', backgroundColor: '#a88f00', padding: { x: 15, y: 8 } }).setOrigin(0.5).setInteractive();
        secretButton.on('pointerdown', () => { this.sound.play('click_sfx'); this.scene.start('SecretScene'); });

        this.add.text(this.scale.width / 2, this.scale.height - 100, `MÁXIMA PUNTUACIÓN: ${highscore}`, FONT_STYLE).setOrigin(0.5);
        this.add.text(this.scale.width / 2, this.scale.height - 50, `FICHAS TOTALES: ${totalFichas}`, FONT_STYLE).setOrigin(0.5);
    }

    update() {
        this.background.tilePositionY -= 0.5;
    }
}

// =================================================================
// SCENE: GAME
// =================================================================
class GameScene extends Phaser.Scene {
    constructor() { super('GameScene'); }
    init(data) { this.score = data.score || 0; this.fichas = data.fichas || 0; this.hasContinued = data.hasContinued || false; }
    create() {
        this.background = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'background_vertical').setOrigin(0,0);
        this.background.setTileScale(this.scale.width / this.background.width);
        this.obstacles = this.physics.add.group({ immovable: true, allowGravity: false });
        this.fichasGroup = this.physics.add.group({ allowGravity: false });

        this.player = this.physics.add.sprite(this.scale.width / 2, this.scale.height * 0.8, 'player_medusa');
        if (PLAYER_COLORS[currentPlayerColorIndex] !== 0xffffff) { this.player.setTint(PLAYER_COLORS[currentPlayerColorIndex]); }
        this.player.body.setSize(48, 48).setAllowGravity(false);
        this.player.setCollideWorldBounds(true).setDepth(10);
        
        this.tweens.add({ targets: this.player, scaleX: 1.15, scaleY: 0.85, duration: 700, yoyo: true, repeat: -1, ease: 'Sine.easeInOut' });
        this.anims.create({ key: 'crab_pinch', frames: [ { key: 'obstacle_cangrejo' }, { key: 'cangrejo_cerrado' } ], frameRate: 2, repeat: -1 });
        this.input.on('pointerdown', () => { this.sound.play('impulse_sfx', { volume: 0.05 }); });

        if (this.hasContinued) {
            this.player.setAlpha(0.5);
            this.time.delayedCall(2000, () => { this.player.setAlpha(1.0); this.physics.add.collider(this.player, this.obstacles, this.gameOver, null, this); });
        } else {
            this.physics.add.collider(this.player, this.obstacles, this.gameOver, null, this);
        }
        
        this.physics.add.overlap(this.player, this.fichasGroup, this.collectFicha, null, this);
        
        const uiStyle = { ...FONT_STYLE, fontSize: '28px', stroke: '#000', strokeThickness: 5 };
        this.add.image(35, 35, 'collectible_almeja').setScale(0.8).setDepth(100);
        this.fichasText = this.add.text(70, 35, `${this.fichas}`, uiStyle).setOrigin(0, 0.5).setDepth(100);
        this.scoreText = this.add.text(this.scale.width / 2, 35, `${this.score}`, { ...uiStyle, fontSize: '36px' }).setOrigin(0.5).setDepth(100);
        this.add.text(this.scale.width - 75, 35, `🏆`, { fontSize: '28px' }).setDepth(100);
        this.highscoreText = this.add.text(this.scale.width - 35, 35, `${highscore}`, uiStyle).setOrigin(1, 0.5).setDepth(100);

        // --- INICIO DE LA CORRECCIÓN ---
        // Se elimina la función separada y se vuelve a poner la lógica directamente
        // en el timer usando una función de flecha `() => {}`, que es la forma más segura
        // de mantener el contexto `this` y evitar el bloqueo.
        this.time.addEvent({ 
            delay: 100, 
            callback: () => {
                this.score++;
                this.scoreText.setText(this.score);
                if (this.score > highscore) {
                    this.highscoreText.setText(this.score);
                    this.highscoreText.setFill('#f3a800');
                }
            }, 
            loop: true 
        });
        // --- FIN DE LA CORRECCIÓN ---
        
        this.time.addEvent({ delay: 1500, callback: this.addObstacleRow, callbackScope: this, loop: true });
        this.time.addEvent({ delay: 3100, callback: this.addFicha, callbackScope: this, loop: true });
    }

    update() {
        this.background.tilePositionY -= 1.0;
        if (this.input.activePointer.isDown) { this.player.body.velocity.x = 280; } else { this.player.body.velocity.x = -280; }
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
        const randomDelay = Phaser.Math.Between(0, 500);
        this.time.delayedCall(randomDelay, () => { if (crab.active) { crab.play('crab_pinch'); } });
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
        this.sound.play('collect_sfx', { volume: 0.7 });
        const emitter = this.add.particles(ficha.x, ficha.y, 'particle', { speed: { min: -100, max: 100 }, angle: { min: 0, max: 360 }, scale: { start: 0.8, end: 0 }, blendMode: 'ADD', lifespan: 500, tint: 0xf3a800 });
        emitter.explode(10);
        ficha.destroy();
        this.fichas++;
        this.fichasText.setText(this.fichas);

        if (this.fichas > 0 && this.fichas % 100 === 0) {
            const nextClueIndex = unlockedClues.length;
            if (nextClueIndex < SECRET_MESSAGE.length) {
                unlockedClues.push(SECRET_MESSAGE[nextClueIndex]);
                localStorage.setItem('ascensoZenClues', JSON.stringify(unlockedClues));
                this.showClueReveal(SECRET_MESSAGE[nextClueIndex]);
            }
        }
    }

    showClueReveal(clue) {
        const revealText = this.add.text(
            this.scale.width / 2, this.scale.height * 0.20, `${clue}`,
            { ...FONT_STYLE, fontSize: '48px', align: 'center', stroke: '#000000', strokeThickness: 6 }
        ).setOrigin(0.5).setDepth(100);
        this.tweens.add({ targets: revealText, alpha: 0, duration: 3500, ease: 'Power2', onComplete: () => { revealText.destroy(); } });
    }

    gameOver() {
        this.sound.play('gameover_sfx');
        this.physics.pause();
        this.player.setTint(0xff0000);
        this.cameras.main.shake(300, 0.01);
        
        if (this.score > highscore) { highscore = this.score; localStorage.setItem('ascensoZenHighscore', highscore); }
        totalFichas += this.fichas;
        localStorage.setItem('ascensoZenFichas', totalFichas);
        this.time.delayedCall(1000, () => { this.scene.start('GameOverScene', { score: this.score, hasContinued: this.hasContinued }); });
    }
}

// =================================================================
// SCENE: SECRET MESSAGE
// =================================================================
class SecretScene extends Phaser.Scene {
    constructor() { super('SecretScene'); }
    create() {
        this.background = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'background_vertical').setOrigin(0,0);
        this.background.setTileScale(this.scale.width / this.background.width);

        this.add.text(this.scale.width / 2, this.scale.height * 0.1, 'El Secreto', { ...FONT_STYLE, fontSize: '42px' }).setOrigin(0.5);

        let revealedMessage = '';
        for (let i = 0; i < SECRET_MESSAGE.length; i++) {
            if (i < unlockedClues.length) {
                revealedMessage += unlockedClues[i] + ' ';
            } else {
                revealedMessage += '??? ';
            }
        }

        this.add.text(this.scale.width / 2, this.scale.height / 2, revealedMessage, { ...FONT_STYLE, fontSize: '28px', align: 'center', wordWrap: { width: this.scale.width * 0.9 } }).setOrigin(0.5);

        const backButton = this.add.text(this.scale.width / 2, this.scale.height * 0.9, 'VOLVER', { ...FONT_STYLE, fontSize: '32px', backgroundColor: '#3d006b', padding: { x: 20, y: 10 } }).setOrigin(0.5).setInteractive();
        backButton.on('pointerdown', () => { this.sound.play('click_sfx'); this.scene.start('MainMenuScene'); });
    }
    update() {
        this.background.tilePositionY -= 0.5;
    }
}


// =================================================================
// SCENE: GAME OVER & CONTINUE
// =================================================================
class GameOverScene extends Phaser.Scene {
    constructor() { super('GameOverScene'); }
    init(data) { this.score = data.score; this.hasContinued = data.hasContinued; }
    create() {
        this.background = this.add.tileSprite(0, 0, this.scale.width, this.scale.height, 'background_vertical').setOrigin(0,0);
        this.background.setTileScale(this.scale.width / this.background.width);

        this.add.text(this.scale.width / 2, this.scale.height * 0.2, 'FIN DE LA PARTIDA', { ...FONT_STYLE, fontSize: '42px' }).setOrigin(0.5);
        this.add.text(this.scale.width / 2, this.scale.height * 0.35, `Puntos: ${this.score}`, FONT_STYLE).setOrigin(0.5);

        if (!this.hasContinued) { this.createContinueOptions(); } 
        else { this.createEndGameButtons(); }
    }

    update() { this.background.tilePositionY -= 0.5; }
    
    createContinueOptions() {
        if (totalFichas >= CONTINUE_COST) {
            const continueButton = this.add.text(this.scale.width / 2, this.scale.height * 0.6, `CONTINUAR (${CONTINUE_COST} Fichas)`, { ...FONT_STYLE, fontSize: '22px', backgroundColor: '#004f27', padding: { x: 15, y: 10 } }).setOrigin(0.5).setInteractive();
            continueButton.on('pointerdown', () => { this.sound.play('click_sfx'); totalFichas -= CONTINUE_COST; localStorage.setItem('ascensoZenFichas', totalFichas); this.scene.start('GameScene', { score: this.score, fichas: 0, hasContinued: true }); });
        }
        
        const adButton = this.add.text(this.scale.width / 2, this.scale.height * 0.75, `VIDA EXTRA (Ver Anuncio)`, { ...FONT_STYLE, fontSize: '22px', backgroundColor: '#a88f00', padding: { x: 15, y: 10 } }).setOrigin(0.5).setInteractive();
        adButton.on('pointerdown', () => { this.sound.play('click_sfx'); this.simulateAd(); });
        const endButton = this.add.text(this.scale.width / 2, this.scale.height * 0.9, 'TERMINAR', { ...FONT_STYLE, fontSize: '18px' }).setOrigin(0.5).setInteractive();
        endButton.on('pointerdown', () => { this.sound.play('click_sfx'); this.createEndGameButtons(true); });
    }
    simulateAd() {
        this.children.list.forEach(child => { if(child.setInteractive) child.disableInteractive(); });
        const adBox = this.add.rectangle(this.scale.width / 2, this.scale.height / 2, this.scale.width * 0.9, 150, 0x000000, 0.8).setStrokeStyle(2, 0xffffff);
        const adText = this.add.text(this.scale.width / 2, this.scale.height / 2, 'Simulando anuncio...\nRecompensa en 3', { ...FONT_STYLE, align: 'center' }).setOrigin(0.5);
        let countdown = 3;
        this.time.addEvent({ delay: 1000, repeat: 2, callback: () => { countdown--; adText.setText(`Simulando anuncio...\nRecompensa en ${countdown}`); if (countdown === 0) { this.scene.start('GameScene', { score: this.score, fichas: 0, hasContinued: true }); } } });
    }
    createEndGameButtons(comingFromContinue = false) {
        if(comingFromContinue) { this.children.list.forEach(c => {if(c.type !== 'TileSprite') c.destroy()}); this.add.text(this.scale.width / 2, this.scale.height * 0.2, 'FIN DE LA PARTIDA', { ...FONT_STYLE, fontSize: '42px' }).setOrigin(0.5); this.add.text(this.scale.width / 2, this.scale.height * 0.35, `Puntos: ${this.score}`, FONT_STYLE).setOrigin(0.5); }
        this.add.text(this.scale.width / 2, this.scale.height * 0.45, `Máximo: ${highscore}`, { ...FONT_STYLE, fill: '#f3a800' }).setOrigin(0.5);
        const menuButton = this.add.text(this.scale.width / 2, this.scale.height * 0.6, 'MENÚ PRINCIPAL', { ...FONT_STYLE, fontSize: '28px', backgroundColor: '#3d006b', padding: { x: 15, y: 10 } }).setOrigin(0.5).setInteractive();
        menuButton.on('pointerdown', () => { this.sound.play('click_sfx'); this.scene.start('MainMenuScene'); });
        const rewardCost = 10;
        const rewardButton = this.add.text(this.scale.width / 2, this.scale.height * 0.75, `Desbloquear color (${rewardCost} Fichas)`, { ...FONT_STYLE, fontSize: '18px', align: 'center', backgroundColor: '#004f27', padding: { x: 10, y: 5 } }).setOrigin(0.5);
        if (totalFichas >= rewardCost) {
            rewardButton.setInteractive().on('pointerdown', () => { this.sound.play('click_sfx'); totalFichas -= rewardCost; localStorage.setItem('ascensoZenFichas', totalFichas); let newColorIndex; do { newColorIndex = Phaser.Math.Between(0, PLAYER_COLORS.length - 1); } while (newColorIndex === currentPlayerColorIndex); currentPlayerColorIndex = newColorIndex; rewardButton.setText('¡Color Desbloqueado!').disableInteractive().setStyle({ backgroundColor: '#333' }); });
        } else { rewardButton.setAlpha(0.5); }
    }
}

// =================================================================
// GAME INITIALIZATION
// =================================================================
const config = {
    type: Phaser.AUTO,
    scale: { mode: Phaser.Scale.FIT, autoCenter: Phaser.Scale.CENTER_BOTH, width: 450, height: 800 },
    physics: { default: 'arcade', arcade: { debug: false } },
    scene: [PreloaderScene, MainMenuScene, GameScene, SecretScene, GameOverScene],
    backgroundColor: '#0d0014'
};

const game = new Phaser.Game(config);
