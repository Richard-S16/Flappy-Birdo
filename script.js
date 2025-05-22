// Game Canvas and Context
const canvas = document.getElementById('game-canvas');
const ctx = canvas.getContext('2d');

// Game Elements
const startScreen = document.getElementById('start-screen');
const startButton = document.getElementById('start-button');
const scoreDisplay = document.getElementById('score');

// Game Variables
let score = 0;
let gameStarted = false;
const FPS_TARGET = 60; // Target FPS for consistent speed calculations

let gameSpeedPerSecond = 2 * FPS_TARGET; // Pipes and background speed in pixels per second
let currentPipeFrequencyFrames = 100; // How often new pipes are generated (in terms of original frame counts for logic)
let pipeSpawnIntervalSeconds = currentPipeFrequencyFrames / FPS_TARGET;
let pipeSpawnTimer = 0;

let lastTime; // For delta time calculation

// Load bird image
const birdImage = new Image();
birdImage.src = 'fish.png'; // Path to your PNG file

// Load sound effect
const scoreSound = new Audio('ScoreEffect.mp3');
let soundLoaded = false;
scoreSound.addEventListener('canplaythrough', () => {
    soundLoaded = true;
});
scoreSound.load(); // Start loading the sound

// Bird Properties
const bird = {
    x: 50,
    y: 150,
    width: 40,
    height: 30,
    gravity: 0.6 * FPS_TARGET * FPS_TARGET, // pixels/sec^2
    lift: -10 * FPS_TARGET, // pixels/sec (velocity change on flap)
    velocity: 0, // pixels/sec
    draw: function() {
        ctx.drawImage(birdImage, this.x, this.y, this.width, this.height);
    },
    update: function(dt) { // dt is delta time in seconds
        this.velocity += this.gravity * dt;
        this.y += this.velocity * dt;

        if (this.y < 0) {
            this.y = 0;
            this.velocity = 0;
        }

        if (this.y + this.height > canvas.height) {
            this.y = canvas.height - this.height;
            this.velocity = 0;
            gameOver();
        }
    },
    flap: function() {
        this.velocity = this.lift;
    }
};

// Pipe Properties
let pipes = [];
const pipeWidth = 50;
const pipeGap = 150;

function drawPipes() {
    ctx.fillStyle = 'green';
    for (let i = 0; i < pipes.length; i++) {
        const pipe = pipes[i];
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight);
        ctx.fillRect(pipe.x, canvas.height - pipe.bottomHeight, pipeWidth, pipe.bottomHeight);
    }
}

function updatePipes(dt) { // dt is delta time in seconds
    for (let i = 0; i < pipes.length; i++) {
        const pipe = pipes[i];
        pipe.x -= gameSpeedPerSecond * dt;

        if (
            bird.x < pipe.x + pipeWidth &&
            bird.x + bird.width > pipe.x &&
            (bird.y < pipe.topHeight || bird.y + bird.height > canvas.height - pipe.bottomHeight)
        ) {
            gameOver();
            return; // Stop further pipe processing if game over
        }

        if (pipe.x + pipeWidth < bird.x && !pipe.scored) {
            if (soundLoaded) {
                scoreSound.currentTime = 0;
                scoreSound.play();
            } else {
                console.log("Score sound not ready yet.");
            }
            score++;
            scoreDisplay.textContent = `Score: ${score}`;
            pipe.scored = true;
            if (score % 5 === 0) {
                gameSpeedPerSecond += (0.2 * FPS_TARGET);
                if (currentPipeFrequencyFrames > 60) {
                    currentPipeFrequencyFrames -= 5;
                    pipeSpawnIntervalSeconds = currentPipeFrequencyFrames / FPS_TARGET;
                }
            }
        }
    }

    pipes = pipes.filter(pipe => pipe.x + pipeWidth > 0);

    pipeSpawnTimer += dt;
    if (pipeSpawnTimer >= pipeSpawnIntervalSeconds) {
        const topHeight = Math.random() * (canvas.height - pipeGap - 50) + 25;
        const bottomHeight = canvas.height - topHeight - pipeGap;
        pipes.push({
            x: canvas.width,
            topHeight: topHeight,
            bottomHeight: bottomHeight,
            scored: false
        });
        pipeSpawnTimer = 0; // Reset timer
    }
}

// Game Loop
function gameLoop(currentTime) {
    if (!gameStarted) return;

    if (lastTime === undefined) {
        lastTime = currentTime;
        requestAnimationFrame(gameLoop);
        return;
    }

    const deltaTime = (currentTime - lastTime) / 1000; // seconds
    lastTime = currentTime;

    // Clamp deltaTime to prevent large jumps (e.g., if tab was inactive)
    const dt = Math.min(deltaTime, 1 / 30); // Max step of 1/30th of a second

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw bird
    bird.update(dt);
    bird.draw();

    // Update and draw pipes
    updatePipes(dt);
    drawPipes();

    requestAnimationFrame(gameLoop);
}

// Game Over
function gameOver() {
    gameStarted = false;
    startScreen.style.display = 'flex';
}

// Event Listeners
function handleInput() {
    if (gameStarted) {
        bird.flap();
    }
}

function startGame() {
    startScreen.style.display = 'none';
    resetGame();
    gameStarted = true;
    lastTime = undefined; // Reset lastTime for the new game session
    requestAnimationFrame(gameLoop);
}

document.addEventListener('keydown', function(event) {
    if (event.code === 'Space') {
        if (!gameStarted && startScreen.style.display !== 'none') {
            startGame();
        } else if (gameStarted) {
            handleInput();
        }
    }
});

canvas.addEventListener('click', () => {
    if (!gameStarted && startScreen.style.display !== 'none') {
        startGame();
    } else {
        handleInput();
    }
});

startButton.addEventListener('click', startGame);

// Reset Game
function resetGame() {
    bird.x = canvas.width / 4; // Position bird further to the right
    bird.y = canvas.height / 4; // Reset bird's y position relative to canvas height
    bird.velocity = 0;
    pipes.length = 0;
    score = 0;
    scoreDisplay.textContent = 'Score: 0';
    
    gameSpeedPerSecond = 2 * FPS_TARGET;
    currentPipeFrequencyFrames = 100;
    pipeSpawnIntervalSeconds = currentPipeFrequencyFrames / FPS_TARGET;
    pipeSpawnTimer = 0;
    lastTime = undefined; // Ensure timing is reset for the game loop
}

// Initialize Canvas Size
function init() {
    if (window.innerWidth <= 1024) {
        canvas.width = window.innerWidth;
        canvas.height = window.innerHeight;
    } else {
        canvas.width = 400; // Fixed width for larger screens
        canvas.height = window.innerHeight; // Full height
    }

    scoreDisplay.textContent = 'Score: 0';
    // Call resetGame here if you want bird position and other game vars initialized
    // based on canvas size immediately, though startGame already calls it.
    // For now, bird's initial state before game start is from its object definition.
    // If bird needs to be drawn pre-game at a scaled position, resetGame() and bird.draw() could be here.
}

// Start
init();
// Add resize listener if you want the canvas to adjust on window resize dynamically
window.addEventListener('resize', init);
