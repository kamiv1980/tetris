const PLAYFIELD_COLUMNS = 15;
const PLAYFIELD_ROWS = 25;
let playfield;
let cells;
let isPaused = false;
let isGameOver = false;
let gameStarted = false;
let score = 0;
let level = 0;
let currentTetromino;
let intervalId;
let nextTetromino;
let nextTetrominoElement;
let moveSound;
let rotateSound;
let clearSound;

// DOM elements
const overlay = document.querySelector('.overlay');
const scoreElement = document.querySelector('.score');
const levelElement = document.querySelector('.level');
const btnRestart = document.querySelector('.btn-restart');
const btnUp = document.querySelector('.btn-up');
const btnLeft = document.querySelector('.btn-left');
const btnRight = document.querySelector('.btn-right');
const btnDown = document.querySelector('.btn-down');
const messageElement = document.querySelector('.message');

// Tetromino names and their shapes
const TETROMINO_NAMES = [
    'O',
    'L',
    'J',
    'S',
    'Z',
    'I',
    'T',
    'X'
];

const TETROMINOES = {
    'X': [
        [0, 1, 0],
        [1, 1, 1],
        [0, 1, 0]
    ],
    'O': [
        [1, 1],
        [1, 1]
    ],
    'L': [
        [0, 0, 1],
        [1, 1, 1],
        [0, 0, 0]
    ],
    'J': [
        [0, 1, 1],
        [0, 1, 0],
        [0, 1, 0]
    ],
    'S': [
        [0, 1, 1],
        [1, 1, 0],
        [0, 0, 0]
    ],
    'Z': [
        [1, 1, 0],
        [0, 1, 1],
        [0, 0, 0]
    ],
    'I': [
        [0, 0, 0, 0],
        [1, 1, 1, 1],
        [0, 0, 0, 0],
        [0, 0, 0, 0],
    ],
    'T': [
        [1, 1, 1],
        [0, 1, 0],
        [0, 0, 0]
    ],
};

// Initialize the game
function init() {
    score = 0;
    level = 0;
    scoreElement.innerHTML = score;
    levelElement.innerHTML = level;
    isGameOver = false;
    isPaused = false;
    moveSound = new sound("sounds/pop-sound.mp3")
    rotateSound = new sound("sounds/rotation.mp3")
    clearSound = new sound("sounds/clear.mp3")
    generatePlayfield();
    cells = document.querySelectorAll('.tetris div');
    nextTetrominoElement = document.querySelector('.next-tetromino-preview');
    generateTetromino();
    generateNextTetromino();
    draw();
    if (!gameStarted){
        showOverlay('start');
    }
}

// Sounds
function sound(src) {
    this.sound = document.createElement("audio");
    this.sound.src = src;
    this.sound.setAttribute("preload", "auto");
    this.sound.setAttribute("controls", "none");
    this.sound.style.display = "none";
    document.body.appendChild(this.sound);
    this.play = function(){
        this.sound.play();
    }
    this.stop = function(){
        this.sound.pause();
    }
}

// Generate the playfield
function generatePlayfield() {
    const tetrisDiv = document.querySelector('.tetris');
    tetrisDiv.innerHTML = '';
    for (let i = 0; i < PLAYFIELD_COLUMNS * PLAYFIELD_ROWS; i++) {
        const div = document.createElement('div');
        tetrisDiv.appendChild(div);
    }
    playfield = Array.from({ length: PLAYFIELD_ROWS }, () => Array(PLAYFIELD_COLUMNS).fill(0));
}

// Generate the current Tetromino
function generateTetromino() {
    if (nextTetromino) {
        currentTetromino = { ...nextTetromino, column: Math.floor((PLAYFIELD_COLUMNS - nextTetromino.matrix[0].length) / 2), row: -2 };
    } else {
        const name = TETROMINO_NAMES[Math.floor(Math.random() * TETROMINO_NAMES.length)];
        const matrix = TETROMINOES[name];
        currentTetromino = { name, matrix, column: Math.floor((PLAYFIELD_COLUMNS - matrix[0].length) / 2), row: -2 };
    }
    generateNextTetromino();

    if (!isValid()) {
        isGameOver = true;
        stopGameLoop();
        showOverlay('restart');
    }
}

// Generate the next Tetromino
function generateNextTetromino() {
    const name = TETROMINO_NAMES[Math.floor(Math.random() * TETROMINO_NAMES.length)];
    nextTetromino = { name, matrix: TETROMINOES[name] };
    drawNextTetromino();
}

// Get the game loop interval based on the level
function getInterval(){
    const interval = 700 - level * 50;
    return interval > 100 ? interval : 100;
}

// Start the game loop
function startGameLoop() {
    if (intervalId) {
        clearInterval(intervalId);
    }
    intervalId = setInterval(() => {
        if (!isPaused) {
            moveTetrominoDown();
            draw();
        }
    }, getInterval());
    hideOverlay();
}

// Stop the game loop
function stopGameLoop() {
    clearInterval(intervalId);
}

// Draw the game state
function draw() {
    clearCells();
    drawPlayfield();
    drawTetromino();
}

// Clear all cells
function clearCells() {
    cells.forEach(cell => cell.className = '');
}

// Draw the playfield
function drawPlayfield() {
    playfield.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            if (cell) {
                const cellIndex = rowIndex * PLAYFIELD_COLUMNS + colIndex;
                cells[cellIndex].classList.add(cell);
            }
        });
    });
}

// Draw the current Tetromino
function drawTetromino() {
    currentTetromino.matrix.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            if (cell && currentTetromino.row + rowIndex >= 0) {
                const cellIndex = (currentTetromino.row + rowIndex) * PLAYFIELD_COLUMNS + currentTetromino.column + colIndex;
                cells[cellIndex].classList.add(currentTetromino.name);
            }
        });
    });
}

// Draw the next Tetromino
function drawNextTetromino() {
    nextTetrominoElement.innerHTML = ''; // Clear the previous preview
    const size = nextTetromino.matrix.length; // Determine the size of the Tetromino

    for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 4; col++) {
            const div = document.createElement('div');
            if (row < size && col < size && nextTetromino.matrix[row][col]) {
                div.classList.add(nextTetromino.name);
            }
            nextTetrominoElement.appendChild(div);
        }
    }
}

// Move the Tetromino down
function moveTetrominoDown() {
    if (!isPaused && gameStarted) {
        moveSound.play()
        currentTetromino.row++;
        if (!isValid()) {
            currentTetromino.row--;
            placeTetromino();
        }
    }
}

// Move the Tetromino left
function moveTetrominoLeft() {
    if (!isPaused && gameStarted) {
        moveSound.play()
        currentTetromino.column--;
        if (!isValid()) currentTetromino.column++;
    }
}

// Move the Tetromino right
function moveTetrominoRight() {
    if (!isPaused && gameStarted) {
        moveSound.play()
        currentTetromino.column++;
        if (!isValid()) currentTetromino.column--;
    }
}

// Rotate the Tetromino
function rotateTetromino() {
    if (!isPaused && gameStarted) {
        const oldMatrix = currentTetromino.matrix;
        currentTetromino.matrix = rotateMatrix(currentTetromino.matrix);
        rotateSound.play()
        if (!isValid()) currentTetromino.matrix = oldMatrix;
    }
}

// Rotate a matrix (used for rotating Tetrominoes)
function rotateMatrix(matrix) {
    return matrix[0].map((_, i) => matrix.map(row => row[i])).reverse();
}

// Check if the current Tetromino's position is valid
function isValid() {
    return currentTetromino.matrix.every((row, rowIndex) => {
        return row.every((cell, colIndex) => {
            const x = currentTetromino.column + colIndex;
            const y = currentTetromino.row + rowIndex;
            return (
                !cell ||
                (x >= 0 && x < PLAYFIELD_COLUMNS && y < PLAYFIELD_ROWS && (!playfield[y] || !playfield[y][x]))
            );
        });
    });
}

// Place the Tetromino on the playfield
function placeTetromino() {
    currentTetromino.matrix.forEach((row, rowIndex) => {
        row.forEach((cell, colIndex) => {
            if (cell && currentTetromino.row + rowIndex >= 0) {
                playfield[currentTetromino.row + rowIndex][currentTetromino.column + colIndex] = currentTetromino.name;
            }
        });
    });
    clearLines();
    generateTetromino(); // Generate new Tetromino only after clearing lines
}

// Clear complete lines from the playfield
function clearLines() {
    let linesCleared = 0;
    playfield = playfield.filter(row => {
        if (row.every(cell => cell)) {
            linesCleared++;
            return false;
        }
        return true;
    });
    for (let i = 0; i < linesCleared; i++) {
        playfield.unshift(Array(PLAYFIELD_COLUMNS).fill(0));
    }
    if (linesCleared) {
        score += linesCleared * 10;
        level = Math.floor(score / 100);
        scoreElement.innerHTML = score;
        levelElement.innerHTML = level;
        clearSound.play()
        startGameLoop();
    }
}

// Handle keydown events for game controls
function onKeyDown(event) {
    switch (event.key) {
        case 'Enter':
            if (isGameOver) {
                restartGame();
                return;
            }
            if (!gameStarted) {
                gameStarted = true;
                startGameLoop();
            } else {
                togglePause();
            }
            break;
        case ' ':
            while (isValid()) currentTetromino.row++;
            currentTetromino.row--;
            break;
        case 'ArrowUp':
            rotateTetromino();
            break;
        case 'ArrowLeft':
            moveTetrominoLeft();
            break;
        case 'ArrowRight':
            moveTetrominoRight();
            break;
        case 'ArrowDown':
            moveTetrominoDown();
            break;
        case 'Escape':
            gameStarted = false;
            init();
            break;
    }
    draw();
}

// Toggle game pause
function togglePause() {
    isPaused = !isPaused;
    if (isPaused) {
        stopGameLoop();
        showOverlay('pause');
    } else {
        startGameLoop();
        hideOverlay();
    }
}

// Show overlay with a message
function showOverlay(action) {
    switch (action) {
        case 'start':
            messageElement.innerHTML = 'Press Enter to start.';
            btnRestart.innerHTML = 'Enter';
            break;
        case 'pause':
            messageElement.innerHTML = 'Game paused.';
            btnRestart.innerHTML = 'Continue';
            break;
        case 'restart':
            messageElement.innerHTML = `Game Over! Score: ${score}`;
            btnRestart.innerHTML = 'Restart';
            break;
    }
    overlay.style.display = 'flex';
}

// Hide overlay
function hideOverlay() {
    overlay.style.display = 'none';
}

// Restart the game
function restartGame() {
    hideOverlay();
    gameStarted = true;
    init();
    startGameLoop();
}

// Add event listeners
btnRestart.addEventListener('click', restartGame);
document.addEventListener('keydown', onKeyDown);
btnUp.addEventListener('click', rotateTetromino);
btnLeft.addEventListener('click', moveTetrominoLeft);
btnRight.addEventListener('click', moveTetrominoRight);
btnDown.addEventListener('click', moveTetrominoDown);

init();
