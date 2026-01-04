// game.js
document.addEventListener('DOMContentLoaded', () => {
    // Game instance
    const game = new Game();
    let currentLayer = 0; // Track currently visible layer

    // DOM Elements
    const mainMenu = document.getElementById('main-menu');
    const difficultyMenu = document.getElementById('difficulty-menu');
    const gameScreen = document.getElementById('game-screen');
    const rulesModal = document.getElementById('rules-modal');
    const gameoverModal = document.getElementById('gameover-modal');
    
    // Buttons
    const singleplayerBtn = document.getElementById('singleplayer-btn');
    const multiplayerBtn = document.getElementById('multiplayer-btn');
    const rulesBtn = document.getElementById('rules-btn');
    const easyBtn = document.getElementById('easy-btn');
    const difficultBtn = document.getElementById('difficult-btn');
    const insaneBtn = document.getElementById('insane-btn');
    const backBtn = document.getElementById('back-btn');
    const resetBtn = document.getElementById('reset-btn');
    const mainMenuBtn = document.getElementById('main-menu-btn');
    const closeRulesBtn = document.getElementById('close-rules-btn');
    const playAgainBtn = document.getElementById('play-again-btn');
    const returnMenuBtn = document.getElementById('return-menu-btn');

    // Game elements
    const turnIndicator = document.getElementById('turn-indicator');
    const thinkingIndicator = document.getElementById('thinking-indicator');
    const gameoverTitle = document.getElementById('gameover-title');
    const gameoverSubtitle = document.getElementById('gameover-subtitle');

    // Initialize the board UI
    function initializeBoard() {
        const layers = document.querySelectorAll('.board-layer');
        layers.forEach((layer, z) => {
            layer.innerHTML = ''; // Clear existing cells
            
            for (let y = 0; y < game.SIZE; y++) {
                for (let x = 0; x < game.SIZE; x++) {
                    const cell = document.createElement('div');
                    cell.className = 'cell';
                    cell.dataset.x = x;
                    cell.dataset.y = y;
                    cell.dataset.z = z;
                    
                    cell.addEventListener('click', () => handleCellClick(x, y, z));
                    layer.appendChild(cell);
                }
            }
        });
    }

    // Update the board display
    function updateBoard(winningLine = []) {
        const cells = document.querySelectorAll('.cell');
        cells.forEach(cell => {
            const x = parseInt(cell.dataset.x);
            const y = parseInt(cell.dataset.y);
            const z = parseInt(cell.dataset.z);
            
            const value = game.board.at(x, y, z);
            cell.textContent = value === '-' ? '' : value;
            cell.className = 'cell';
            
            if (value === game.HUMAN) cell.classList.add('x');
            if (value === game.COMPUTER) cell.classList.add('o');
            
            // Highlight winning cells
            const isWinningCell = winningLine.some(pos => 
                pos[0] === x && pos[1] === y && pos[2] === z
            );
            if (isWinningCell) cell.classList.add('winning-cell');
        });
        
        // Update turn indicator
        if (!game.gameEnded) {
            turnIndicator.textContent = `PLAYER ${game.currentPlayer} TURN`;
            turnIndicator.className = game.currentPlayer === game.HUMAN ? 'x-turn' : 'o-turn';
        }
    }

    // Handle cell clicks
    async function handleCellClick(x, y, z) {
        if (game.gameEnded || game.currentPlayer === game.COMPUTER) return;
        
        try {
            // Human move (add 1 to convert to 1-based input)
            const moveResult = await game.playMove(x + 1, y + 1, z + 1);
            updateBoard();
            
            if (moveResult) {
                showGameOver(game.currentPlayer);
            } else if (game.vsComputer && game.currentPlayer === game.COMPUTER) {
                // Computer's turn
                thinkingIndicator.style.display = 'flex';
                await game.playMove();
                thinkingIndicator.style.display = 'none';
                updateBoard();
                
                const winnerCheck = game.checkWinner(game.COMPUTER);
                if (winnerCheck.result) {
                    showGameOver(game.COMPUTER, winnerCheck.line);
                } else if (game.isTie()) {
                    showGameOver(null);
                }
            }
        } catch (error) {
            alert(error.message);
        }
    }

    // Show game over modal
    function showGameOver(winner, winningLine = []) {
        if (winningLine.length > 0) {
            updateBoard(winningLine);
        }
        
        if (winner) {
            gameoverTitle.textContent = `${winner === game.COMPUTER ? 'COMPUTER' : 'PLAYER ' + winner} WINS!`;
            
            // Detect win type for subtitle
            const [x1, y1, z1] = winningLine[0];
            const [x2, y2, z2] = winningLine[winningLine.length - 1];
            
            if (x1 !== x2 && y1 !== y2 && z1 !== z2) {
                gameoverSubtitle.textContent = '3D Diagonal Victory!';
            } else if (z1 === z2) {
                gameoverSubtitle.textContent = 'Layer ' + (z1 + 1) + ' Victory';
            } else {
                gameoverSubtitle.textContent = 'Multi-Layer Victory';
            }
        } else {
            gameoverTitle.textContent = "IT'S A TIE!";
            gameoverSubtitle.textContent = 'Board is full';
        }
        
        gameoverModal.style.display = 'flex';
    }

    // Switch between layers
    function setupLayerButtons() {
        const layerButtons = document.querySelectorAll('.layer-btn');
        const layers = document.querySelectorAll('.board-layer');
        
        layerButtons.forEach(button => {
            button.addEventListener('click', () => {
                const layerIndex = parseInt(button.dataset.layer);
                
                // Update active button
                layerButtons.forEach(btn => btn.classList.remove('active'));
                button.classList.add('active');
                
                // Show selected layer
                layers.forEach(layer => layer.classList.remove('active'));
                layers[layerIndex].classList.add('active');
                
                currentLayer = layerIndex;
            });
        });
    }

    // Screen navigation functions
    function showScreen(screen) {
        document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
        screen.classList.add('active');
    }

    function startNewGame(mode, difficulty) {
        game.startGame(mode, difficulty);
        initializeBoard();
        updateBoard();
        showScreen(gameScreen);
    }

    // Event listeners
    singleplayerBtn.addEventListener('click', () => showScreen(difficultyMenu));
    multiplayerBtn.addEventListener('click', () => startNewGame(1, 0));
    
    easyBtn.addEventListener('click', () => startNewGame(2, 1));
    difficultBtn.addEventListener('click', () => startNewGame(2, 2));
    insaneBtn.addEventListener('click', () => startNewGame(2, 3));
    
    backBtn.addEventListener('click', () => showScreen(mainMenu));
    rulesBtn.addEventListener('click', () => rulesModal.style.display = 'flex');
    closeRulesBtn.addEventListener('click', () => rulesModal.style.display = 'none');
    
    resetBtn.addEventListener('click', () => {
        game.startGame(game.vsComputer ? 2 : 1, game.maxDepth);
        initializeBoard();
        updateBoard();
    });
    
    mainMenuBtn.addEventListener('click', () => showScreen(mainMenu));
    playAgainBtn.addEventListener('click', () => {
        gameoverModal.style.display = 'none';
        game.startGame(game.vsComputer ? 2 : 1, game.maxDepth);
        initializeBoard();
        updateBoard();
    });
    
    returnMenuBtn.addEventListener('click', () => {
        gameoverModal.style.display = 'none';
        showScreen(mainMenu);
    });

    // Close modals when clicking outside
    window.addEventListener('click', (e) => {
        if (e.target === rulesModal) rulesModal.style.display = 'none';
        if (e.target === gameoverModal) gameoverModal.style.display = 'none';
    });

    // Initialize
    initializeBoard();
    setupLayerButtons();
});

// Your existing Game and Board3D classes remain unchanged below
class Board3D {
    constructor() {
        this.SIZE = 4;
        this.LAYER_SIZE = this.SIZE * this.SIZE;
        this.board = Array(this.SIZE * this.SIZE * this.SIZE).fill('-');
    }

    at(x, y, z) {
        return this.board[x + y * this.SIZE + z * this.LAYER_SIZE];
    }

    setAt(x, y, z, value) {
        this.board[x + y * this.SIZE + z * this.LAYER_SIZE] = value;
    }

    isCellEmpty(x, y, z) {
        return this.at(x, y, z) === '-';
    }

    clear() {
        this.board.fill('-');
    }

    getCellPriority(x, y, z) {
        const center = Math.floor(this.SIZE / 2);
        return -(Math.abs(x - center) + Math.abs(y - center) + Math.abs(z - center));
    }
}

class Game {
    constructor() {
        this.COMPUTER = 'O';
        this.HUMAN = 'X';
        this.SIZE = 4;
        this.board = new Board3D();
        this.currentPlayer = this.HUMAN;
        this.gameEnded = false;
        this.vsComputer = false;
        this.maxDepth = 2;
    }

    printBoard(winningLine = []) {
        console.log("\n3D Tic-Tac-Toe Board (4x4x4):");
        for (let z = 0; z < this.SIZE; z++) {
            console.log(`\nLayer ${z + 1}:`);
            for (let y = 0; y < this.SIZE; y++) {
                let row = '';
                for (let x = 0; x < this.SIZE; x++) {
                    const isWinningCell = winningLine.some(cell => 
                        cell[0] === x && cell[1] === y && cell[2] === z
                    );
                    const cellValue = this.board.at(x, y, z);
                    row += isWinningCell ? `[${cellValue}]` : ` ${cellValue} `;
                    if (x < this.SIZE - 1) row += "|";
                }
                console.log(row);
                
                if (y < this.SIZE - 1) {
                    console.log(Array(this.SIZE).fill("---").join(""));
                }
            }
        }
        console.log();
    }

    showInstructions() {
        console.log("\nWelcome to 3D Tic-Tac-Toe (4x4x4)!");
        console.log("Enter moves as three numbers (x y z) between 1-4");
        console.log("Example: '2 3 1' means column 2, row 3, layer 1\n");
    }

    checkLine(player, x, y, z, dx, dy, dz) {
        const winningLine = [];
        for (let i = 0; i < this.SIZE; i++) {
            const nx = x + i * dx;
            const ny = y + i * dy;
            const nz = z + i * dz;
            
            if (this.board.at(nx, ny, nz) !== player) {
                return { result: false, line: [] };
            }
            winningLine.push([nx, ny, nz]);
        }
        return { result: true, line: winningLine };
    }

    checkWinner(player) {
        // Check straight lines (x, y, z axes)
        for (let i = 0; i < this.SIZE; i++) {
            for (let j = 0; j < this.SIZE; j++) {
                let result = this.checkLine(player, 0, i, j, 1, 0, 0);
                if (result.result) return result;
                
                result = this.checkLine(player, i, 0, j, 0, 1, 0);
                if (result.result) return result;
                
                result = this.checkLine(player, i, j, 0, 0, 0, 1);
                if (result.result) return result;
            }
        }
        
        // Check 3D diagonals
        let result = this.checkLine(player, 0, 0, 0, 1, 1, 1);
        if (result.result) return result;
        
        result = this.checkLine(player, 0, this.SIZE-1, 0, 1, -1, 1);
        if (result.result) return result;
        
        result = this.checkLine(player, this.SIZE-1, 0, 0, -1, 1, 1);
        if (result.result) return result;
        
        result = this.checkLine(player, this.SIZE-1, this.SIZE-1, 0, -1, -1, 1);
        if (result.result) return result;
        
        // Check face diagonals
        for (let z = 0; z < this.SIZE; z++) {
            result = this.checkLine(player, 0, 0, z, 1, 1, 0);
            if (result.result) return result;
            
            result = this.checkLine(player, 0, this.SIZE-1, z, 1, -1, 0);
            if (result.result) return result;
        }
        
        return { result: false, line: [] };
    }

    isTie() {
        for (let x = 0; x < this.SIZE; x++) {
            for (let y = 0; y < this.SIZE; y++) {
                for (let z = 0; z < this.SIZE; z++) {
                    if (this.board.isCellEmpty(x, y, z)) return false;
                }
            }
        }
        return true;
    }

    playerMove(x, y, z) {
        // Convert to 0-based index
        x--;
        y--;
        z--;
        
        if (x < 0 || x >= this.SIZE || y < 0 || y >= this.SIZE || z < 0 || z >= this.SIZE) {
            throw new Error("Invalid coordinates. Please enter three numbers between 1 and 4.");
        }
        
        if (!this.board.isCellEmpty(x, y, z)) {
            throw new Error("That cell is already occupied. Try again.");
        }
        
        this.board.setAt(x, y, z, this.currentPlayer);
        return true;
    }

    evaluate() {
        const computerWin = this.checkWinner(this.COMPUTER).result;
        const humanWin = this.checkWinner(this.HUMAN).result;
        
        if (computerWin) return +1000;
        if (humanWin) return -1000;
        return 0;
    }

    minimax(depth, isMax, alpha, beta, maxDepth) {
        const score = this.evaluate();
        if (score === 1000 || score === -1000 || this.isTie() || depth === maxDepth) {
            return score;
        }

        // Generate all possible moves with priorities
        const moves = [];
        for (let x = 0; x < this.SIZE; x++) {
            for (let y = 0; y < this.SIZE; y++) {
                for (let z = 0; z < this.SIZE; z++) {
                    if (this.board.isCellEmpty(x, y, z)) {
                        const priority = this.board.getCellPriority(x, y, z);
                        moves.push({ x, y, z, score: priority });
                    }
                }
            }
        }
        
        // Sort moves by priority (best moves first)
        moves.sort((a, b) => b.score - a.score);

        if (isMax) {
            let best = -Infinity;
            for (const move of moves) {
                this.board.setAt(move.x, move.y, move.z, this.COMPUTER);
                const current = this.minimax(depth + 1, false, alpha, beta, maxDepth);
                this.board.setAt(move.x, move.y, move.z, '-');
                
                best = Math.max(best, current);
                alpha = Math.max(alpha, best);
                if (beta <= alpha) break;
            }
            return best;
        } else {
            let best = Infinity;
            for (const move of moves) {
                this.board.setAt(move.x, move.y, move.z, this.HUMAN);
                const current = this.minimax(depth + 1, true, alpha, beta, maxDepth);
                this.board.setAt(move.x, move.y, move.z, '-');
                
                best = Math.min(best, current);
                beta = Math.min(beta, best);
                if (beta <= alpha) break;
            }
            return best;
        }
    }

    addRandomnessToScore(score) {
        return score + Math.floor(Math.random() * 101) - 50; // Random factor between -50 and 50
    }

    async findBestMove() {
        let bestVal = -Infinity;
        let bestX = -1, bestY = -1, bestZ = -1;
        const moves = [];

        // Generate all possible moves with priorities
        for (let x = 0; x < this.SIZE; x++) {
            for (let y = 0; y < this.SIZE; y++) {
                for (let z = 0; z < this.SIZE; z++) {
                    if (this.board.isCellEmpty(x, y, z)) {
                        const priority = this.board.getCellPriority(x, y, z);
                        moves.push({ x, y, z, score: priority });
                    }
                }
            }
        }

        // Sort moves by priority (best moves first)
        moves.sort((a, b) => b.score - a.score);

        // Iterative Deepening: Try different depths
        for (let depth = 1; depth <= this.maxDepth; depth++) {
            let bestMoveScore = -Infinity;
            for (const move of moves) {
                this.board.setAt(move.x, move.y, move.z, this.COMPUTER);
                let moveVal = this.minimax(0, false, -Infinity, Infinity, depth);
                moveVal = this.addRandomnessToScore(moveVal);
                this.board.setAt(move.x, move.y, move.z, '-');

                if (moveVal > bestMoveScore) {
                    bestX = move.x;
                    bestY = move.y;
                    bestZ = move.z;
                    bestMoveScore = moveVal;
                }

                if (bestMoveScore === 1000) break;
            }
            
            if (bestMoveScore !== -Infinity) {
                bestVal = bestMoveScore;
                break;
            }
        }

        return { x: bestX, y: bestY, z: bestZ };
    }

    async computerMove() {
        const { x, y, z } = await this.findBestMove();
        this.board.setAt(x, y, z, this.COMPUTER);
    }

    async playMove(x, y, z) {
        if (this.gameEnded) return false;

        try {
            if (this.currentPlayer === this.HUMAN) {
                this.playerMove(x, y, z);
            } else if (this.vsComputer) {
                await this.computerMove();
            }

            const winnerCheck = this.checkWinner(this.currentPlayer);
            if (winnerCheck.result) {
                console.log(`${this.currentPlayer === this.COMPUTER ? "Computer" : "Player " + this.currentPlayer} wins!`);
                this.gameEnded = true;
                return { gameOver: true, winner: this.currentPlayer, winningLine: winnerCheck.line };
            } else if (this.isTie()) {
                console.log("It's a tie!");
                this.gameEnded = true;
                return { gameOver: true, winner: null };
            } else {
                this.currentPlayer = this.currentPlayer === this.HUMAN ? this.COMPUTER : this.HUMAN;
                return { gameOver: false };
            }
        } catch (error) {
            console.log(error.message);
            return { gameOver: false, error: error.message };
        }
    }

    startGame(mode, difficulty) {
        this.board.clear();
        this.currentPlayer = this.HUMAN;
        this.gameEnded = false;
        this.vsComputer = mode === 2;

        if (this.vsComputer) {
            switch (difficulty) {
                case 1: this.maxDepth = 2; break;
                case 2: this.maxDepth = 4; break;
                case 3: this.maxDepth = 6; break;
                default: 
                    console.log("Invalid difficulty. Defaulting to Easy.");
                    this.maxDepth = 2;
            }
        }

        this.showInstructions();
    }
}