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
let gameSpeed = 2; // Initial speed of pipes and background
let pipeFrequency = 100; // How often new pipes are generated (in frames)
let frameCount = 0;

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
    width: 40, // Adjust width based on your Image aspect ratio
    height: 30, // Adjust height based on your Image aspect ratio
    gravity: 0.6,
    lift: -10,
    velocity: 0,
    draw: function() {
        // Draw the bird image if loaded, otherwise fallback to a rectangle
        ctx.drawImage(birdImage, this.x, this.y, this.width, this.height);
    },
    update: function() {
        this.velocity += this.gravity;
        this.y += this.velocity;

        // Prevent bird from going off screen (top)
        if (this.y < 0) {
            this.y = 0;
            this.velocity = 0;
        }

        // Game over if bird hits bottom
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
const pipeGap = 150; // Gap between upper and lower pipe

function drawPipes() {
    ctx.fillStyle = 'green';
    for (let i = 0; i < pipes.length; i++) {
        const pipe = pipes[i];
        ctx.fillRect(pipe.x, 0, pipeWidth, pipe.topHeight); // Upper pipe
        ctx.fillRect(pipe.x, canvas.height - pipe.bottomHeight, pipeWidth, pipe.bottomHeight); // Lower pipe
    }
}

function updatePipes() {
    for (let i = 0; i < pipes.length; i++) {
        const pipe = pipes[i];
        pipe.x -= gameSpeed;

        // Collision detection
        if (
            bird.x < pipe.x + pipeWidth &&
            bird.x + bird.width > pipe.x &&
            (bird.y < pipe.topHeight || bird.y + bird.height > canvas.height - pipe.bottomHeight)
        ) {
            gameOver();
        }

        // Score point
        if (pipe.x + pipeWidth < bird.x && !pipe.scored) {
            if (soundLoaded) {
                scoreSound.currentTime = 0; // Rewind to the start
                scoreSound.play();
            } else {
                // Fallback or log if sound not loaded yet, though 'canplaythrough' should handle this
                console.log("Score sound not ready yet.");
            }
            score++;
            scoreDisplay.textContent = `Score: ${score}`;
            pipe.scored = true;
            // Increase difficulty
            if (score % 5 === 0) { // Every 5 points
                gameSpeed += 0.2;
                if (pipeFrequency > 60) { // Don't make it too frequent
                    pipeFrequency -= 5;
                }
            }
        }
    }

    // Remove pipes that are off-screen
    pipes = pipes.filter(pipe => pipe.x + pipeWidth > 0);

    // Add new pipes
    if (frameCount % pipeFrequency === 0) {
        const topHeight = Math.random() * (canvas.height - pipeGap - 50) + 25; // Ensure some minimum height and not too close to edge
        const bottomHeight = canvas.height - topHeight - pipeGap;
        pipes.push({
            x: canvas.width,
            topHeight: topHeight,
            bottomHeight: bottomHeight,
            scored: false
        });
    }
}


// Game Loop
function gameLoop() {
    if (!gameStarted) return;

    // Clear canvas
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    // Update and draw bird
    bird.update();
    bird.draw();

    // Update and draw pipes
    updatePipes();
    drawPipes();


    frameCount++;
    requestAnimationFrame(gameLoop);
}

// Game Over
function gameOver() {
    gameStarted = false;
    startScreen.style.display = 'flex'; // Show start screen again
}

// Event Listeners
function handleInput() {
    if (gameStarted) {
        bird.flap();
    }
}

document.addEventListener('keydown', function(event) {
    if (event.code === 'Space') {
        if (!gameStarted && startScreen.style.display !== 'none') { // Check if start screen is visible
            startScreen.style.display = 'none';
            resetGame();
            gameStarted = true;
            gameLoop();
        } else if (gameStarted) { // Only flap if game is active
            handleInput();
        }
    }
});

canvas.addEventListener('click', () => { // Modified to ensure click also starts game if not started
    if (!gameStarted && startScreen.style.display !== 'none') {
        startScreen.style.display = 'none';
        resetGame();
        gameStarted = true;
        gameLoop();
    } else {
        handleInput();
    }
});


startButton.addEventListener('click', () => {
    startScreen.style.display = 'none';
    resetGame();
    gameStarted = true;
    gameLoop();
});

// Reset Game
function resetGame() {
    bird.y = canvas.height / 4; // Reset bird's y position relative to canvas height
    bird.velocity = 0;
    pipes.length = 0; // Clear pipes array
    score = 0;
    scoreDisplay.textContent = 'Score: 0';
    gameSpeed = 2;
    pipeFrequency = 100;
    frameCount = 0;
}

// Initialize Canvas Size (can be adjusted)
function init() {
    if(window.innerWidth >= 640) {
        canvas.width = 400;
    } else {
        canvas.width = window.innerWidth;
    }
    canvas.height = window.innerHeight;

    scoreDisplay.textContent = 'Score: 0'; // Initialize score display
    // Draw initial bird position or a static background if desired before game starts
    // bird.draw();
}

// Start
init();
