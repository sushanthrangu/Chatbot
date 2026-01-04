// DOM Elements
const mainScreen = document.getElementById("main-screen");
const gameScreen = document.getElementById("game-screen");
const rulesPopup = document.getElementById("rules-popup");

const easyBtn = document.getElementById("easy-btn");
const difficultBtn = document.getElementById("difficult-btn");
const insaneBtn = document.getElementById("insane-btn");
const rulesBtn = document.getElementById("rules-btn");
const gameRulesBtn = document.getElementById("game-rules-btn");
const closeRulesBtn = document.getElementById("close-rules-btn");
const resetBtn = document.getElementById("reset-btn");

const gameBoard = document.getElementById("game-board");

// Event Listeners
easyBtn.addEventListener("click", () => startGame(2));
difficultBtn.addEventListener("click", () => startGame(4));
insaneBtn.addEventListener("click", () => startGame(6));

rulesBtn.addEventListener("click", showRules);
gameRulesBtn.addEventListener("click", showRules);
closeRulesBtn.addEventListener("click", hideRules);
resetBtn.addEventListener("click", resetGame);

// Game State
let currentDifficulty = 2; // Default to Easy
let gameActive = false;

// Functions
async function startGame(depth) {
    currentDifficulty = depth;
    mainScreen.classList.add("hidden");
    gameScreen.classList.remove("hidden");
    gameActive = true;

    try {
        const response = await fetch("http://localhost:3000/start-game", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ difficulty: depth }),
        });
        const data = await response.json();
        console.log(data.message, data.output);
        renderGameBoard(data.output); // Render the initial game board
    } catch (error) {
        console.error("Error starting the game:", error);
    }
}

function showRules() {
    rulesPopup.classList.remove("hidden");
}

function hideRules() {
    rulesPopup.classList.add("hidden");
}

async function resetGame() {
    if (!gameActive) return;

    try {
        const response = await fetch("http://localhost:3000/reset-game", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
        });
        const data = await response.json();
        console.log(data.message, data.output);
        renderGameBoard(data.output); // Render the reset game board
    } catch (error) {
        console.error("Error resetting the game:", error);
    }
}

async function makeMove(layer, row, col) {
    if (!gameActive) return;

    const move = `${layer} ${row} ${col}`;
    try {
        const response = await fetch("http://localhost:3000/make-move", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ move: move }),
        });
        const data = await response.json();
        console.log(data.message, data.output);
        renderGameBoard(data.output); // Render the updated game board

        // Check for game over conditions
        if (data.output.includes("wins") || data.output.includes("draw")) {
            gameActive = false;
        }
    } catch (error) {
        console.error("Error making a move:", error);
    }
}

function renderGameBoard(boardState) {
    // Clear the existing board
    gameBoard.innerHTML = "";

    // Parse the board state and render it
    const layers = boardState.split("\n\n"); // Split into layers
    layers.forEach((layer, layerIndex) => {
        const layerDiv = document.createElement("div");
        layerDiv.className = "layer";
        layerDiv.innerHTML = `<h3>Layer ${layerIndex + 1}</h3>`;

        const rows = layer.split("\n");
        rows.forEach((row, rowIndex) => {
            const rowDiv = document.createElement("div");
            rowDiv.className = "row";

            const cells = row.split(" ");
            cells.forEach((cell, colIndex) => {
                const cellDiv = document.createElement("div");
                cellDiv.className = "cell";
                cellDiv.textContent = cell;
                cellDiv.addEventListener("click", () => {
                    if (cell === "-") {
                        makeMove(layerIndex, rowIndex, colIndex);
                    }
                });
                rowDiv.appendChild(cellDiv);
            });

            layerDiv.appendChild(rowDiv);
        });

        gameBoard.appendChild(layerDiv);
    });
}