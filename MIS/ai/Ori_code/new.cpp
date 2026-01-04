#include <iostream>
#include <vector>
#include <limits>
#include <chrono>
#include <thread>
#include <algorithm>
#include <random>
using namespace std;

#define COMPUTER 'O'
#define HUMAN 'X'
#define SIZE 4
#define LAYER_SIZE (SIZE * SIZE)

class Board3D {
private:
    vector<char> board;
    
public:
    Board3D() : board(SIZE * SIZE * SIZE, '-') {}
    
    char& at(int x, int y, int z) {
        return board[x + y * SIZE + z * LAYER_SIZE];
    }
    
    const char& at(int x, int y, int z) const {
        return board[x + y * SIZE + z * LAYER_SIZE];
    }
    
    bool isCellEmpty(int x, int y, int z) const {
        return at(x, y, z) == '-';
    }
    
    void clear() {
        fill(board.begin(), board.end(), '-');
    }
    
    // Heuristic: Center cells are more valuable
    int getCellPriority(int x, int y, int z) const {
        int center = SIZE / 2;
        return -(abs(x - center) + abs(y - center) + abs(z - center));
    }
};

void printBoard(const Board3D &board, const vector<vector<int>>& winningLine = {}) {
    cout << "\n3D Tic-Tac-Toe Board (4x4x4):\n";
    for (int z = 0; z < SIZE; z++) {
        cout << "\nLayer " << z + 1 << ":\n";
        for (int y = 0; y < SIZE; y++) {
            for (int x = 0; x < SIZE; x++) {
                bool isWinningCell = false;
                for (const auto& cell : winningLine) {
                    if (cell[0] == x && cell[1] == y && cell[2] == z) {
                        isWinningCell = true;
                        break;
                    }
                }
                if (isWinningCell) cout << "[" << board.at(x, y, z) << "]";
                else cout << " " << board.at(x, y, z) << " ";
                if (x < SIZE - 1) cout << "|";
            }
            cout << "\n";
            if (y < SIZE - 1) {
                for (int x = 0; x < SIZE; x++) cout << "---";
                cout << "\n";
            }
        }
    }
    cout << "\n";
}

void showInstructions() {
    cout << "\nWelcome to 3D Tic-Tac-Toe (4x4x4)!\n";
    cout << "Enter moves as three numbers (x y z) between 1-4\n";
    cout << "Example: '2 3 1' means column 2, row 3, layer 1\n\n";
}

bool checkLine(const Board3D &board, char player, int x, int y, int z, int dx, int dy, int dz, vector<vector<int>>& winningLine) {
    winningLine.clear();
    for (int i = 0; i < SIZE; i++) {
        if (board.at(x + i*dx, y + i*dy, z + i*dz) != player) {
            winningLine.clear();
            return false;
        }
        winningLine.push_back({x + i*dx, y + i*dy, z + i*dz});
    }
    return true;
}

bool checkWinner(const Board3D &board, char player, vector<vector<int>>& winningLine) {
    // Check straight lines (x, y, z axes)
    for (int i = 0; i < SIZE; i++) {
        for (int j = 0; j < SIZE; j++) {
            if (checkLine(board, player, 0, i, j, 1, 0, 0, winningLine)) return true;
            if (checkLine(board, player, i, 0, j, 0, 1, 0, winningLine)) return true;
            if (checkLine(board, player, i, j, 0, 0, 0, 1, winningLine)) return true;
        }
    }
    
    // Check 3D diagonals
    if (checkLine(board, player, 0, 0, 0, 1, 1, 1, winningLine)) return true;
    if (checkLine(board, player, 0, SIZE-1, 0, 1, -1, 1, winningLine)) return true;
    if (checkLine(board, player, SIZE-1, 0, 0, -1, 1, 1, winningLine)) return true;
    if (checkLine(board, player, SIZE-1, SIZE-1, 0, -1, -1, 1, winningLine)) return true;
    
    // Check face diagonals
    for (int z = 0; z < SIZE; z++) {
        if (checkLine(board, player, 0, 0, z, 1, 1, 0, winningLine)) return true;
        if (checkLine(board, player, 0, SIZE-1, z, 1, -1, 0, winningLine)) return true;
    }
    
    return false;
}

bool isTie(const Board3D &board) {
    for (int x = 0; x < SIZE; x++)
        for (int y = 0; y < SIZE; y++)
            for (int z = 0; z < SIZE; z++)
                if (board.at(x, y, z) == '-') return false;
    return true;
}

void playerMove(Board3D &board, char player) {
    int x, y, z;
    while (true) {
        cout << "Player " << player << ", enter your move (x y z, 1-4): ";
        cin >> x >> y >> z;
        if (cin.fail() || x < 1 || x > SIZE || y < 1 || y > SIZE || z < 1 || z > SIZE) {
            cin.clear(); 
            cin.ignore(numeric_limits<streamsize>::max(), '\n');
            cout << "Invalid coordinates. Please enter three numbers between 1 and 4.\n";
        } else if (!board.isCellEmpty(x-1, y-1, z-1)) {
            cout << "That cell is already occupied. Try again.\n";
        } else {
            board.at(x-1, y-1, z-1) = player;
            break;
        }
    }
}

int evaluate(const Board3D &board) {
    vector<vector<int>> dummy;
    if (checkWinner(board, COMPUTER, dummy)) return +1000;
    if (checkWinner(board, HUMAN, dummy)) return -1000;
    return 0;
}

struct Move {
    int x, y, z, score;
    bool operator<(const Move& other) const {
        return score > other.score; // Sort by score descending
    }
};

int minimax(Board3D &board, int depth, bool isMax, int alpha, int beta, int maxDepth, bool& abortSearch) {
    vector<vector<int>> dummy;
    int score = evaluate(board);
    if (score == 1000 || score == -1000 || isTie(board) || depth == maxDepth)
        return score;

    // Generate all possible moves with priorities
    vector<Move> moves;
    for (int x = 0; x < SIZE; x++) {
        for (int y = 0; y < SIZE; y++) {
            for (int z = 0; z < SIZE; z++) {
                if (board.isCellEmpty(x, y, z)) {
                    int priority = board.getCellPriority(x, y, z);
                    moves.push_back({x, y, z, priority});
                }
            }
        }
    }
    
    // Sort moves by priority (best moves first)
    sort(moves.begin(), moves.end());

    if (isMax) {
        int best = numeric_limits<int>::min();
        for (const auto& move : moves) {
            if (abortSearch) return best;
            
            board.at(move.x, move.y, move.z) = COMPUTER;
            int current = minimax(board, depth + 1, false, alpha, beta, maxDepth, abortSearch);
            board.at(move.x, move.y, move.z) = '-';
            
            best = max(best, current);
            alpha = max(alpha, best);
            if (beta <= alpha) break;
        }
        return best;
    } else {
        int best = numeric_limits<int>::max();
        for (const auto& move : moves) {
            if (abortSearch) return best;
            
            board.at(move.x, move.y, move.z) = HUMAN;
            int current = minimax(board, depth + 1, true, alpha, beta, maxDepth, abortSearch);
            board.at(move.x, move.y, move.z) = '-';
            
            best = min(best, current);
            beta = min(beta, best);
            if (beta <= alpha) break;
        }
        return best;
    }
}

int addRandomnessToScore(int score) {
    static std::random_device rd;
    static std::mt19937 gen(rd());
    static std::uniform_int_distribution<> dis(-50, 50); // Random factor between -50 and 50
    return score + dis(gen);
}

void findBestMove(Board3D &board, int maxDepth, int& bestX, int& bestY, int& bestZ) {
    bool abortSearch = false;
    int bestVal = numeric_limits<int>::min();
    vector<Move> moves;

    // Generate all possible moves with priorities
    for (int x = 0; x < SIZE; x++) {
        for (int y = 0; y < SIZE; y++) {
            for (int z = 0; z < SIZE; z++) {
                if (board.isCellEmpty(x, y, z)) {
                    int priority = board.getCellPriority(x, y, z);
                    moves.push_back({x, y, z, priority});
                }
            }
        }
    }

    // Sort moves by priority (best moves first)
    sort(moves.begin(), moves.end(), [](const Move &a, const Move &b) {
        return a.score > b.score;  // Sort descending by score
    });

    // Declare calculationDone and loadingThread
    std::atomic<bool> calculationDone(false);
   auto start = std::chrono::steady_clock::now();

// Start loading message in a separate thread
std::thread loadingThread([&]() {
    while (!calculationDone) {
        auto now = std::chrono::steady_clock::now();
        auto elapsed = std::chrono::duration_cast<std::chrono::seconds>(now - start).count();

        if (elapsed > 2) {
            cout << "\rComputer is thinking..." << flush;
            std::this_thread::sleep_for(std::chrono::milliseconds(500));
            cout << "\r                        \r" << flush;
            std::this_thread::sleep_for(std::chrono::milliseconds(500));
        } else {
            std::this_thread::sleep_for(std::chrono::milliseconds(100));
        }
    }
});



    // Iterative Deepening: Try different depths
    for (int depth = 1; depth <= maxDepth; ++depth) {
    int bestMoveScore = std::numeric_limits<int>::min();
    for (const auto& move : moves) {
        board.at(move.x, move.y, move.z) = COMPUTER;
        int moveVal = minimax(board, 0, false, std::numeric_limits<int>::min(), std::numeric_limits<int>::max(), depth, abortSearch);
        moveVal = addRandomnessToScore(moveVal);
        board.at(move.x, move.y, move.z) = '-';

        moveVal = addRandomnessToScore(moveVal);

        if (moveVal > bestMoveScore) {
            bestX = move.x;
            bestY = move.y;
            bestZ = move.z;
            bestMoveScore = moveVal;
        }

        if (bestMoveScore == 1000) break;
    }
    if (bestMoveScore != std::numeric_limits<int>::min()) {
        break;
    }
}


    // Mark calculation as done and join the thread
    calculationDone = true;
    loadingThread.join();
    auto end = std::chrono::steady_clock::now();
std::chrono::duration<double> elapsed = end - start;
cout << "Move calculated in " << elapsed.count() << " seconds.\n";
}

void computerMove(Board3D &board, int maxDepth) {
    cout << "Computer's turn...\n";
    int x, y, z;
    findBestMove(board, maxDepth, x, y, z);
    board.at(x, y, z) = COMPUTER;
    cout << "Computer plays at (" << x+1 << ", " << y+1 << ", " << z+1 << ")\n";
}

void playGame(bool vsComputer, int maxDepth) {
    Board3D board;
    char currentPlayer = HUMAN;
    bool gameEnded = false;

    showInstructions();
    printBoard(board);

    while (!gameEnded) {
        if (vsComputer && currentPlayer == COMPUTER) {
            computerMove(board, maxDepth);
        } else {
            playerMove(board, currentPlayer);
        }

        vector<vector<int>> winningLine;
        if (checkWinner(board, currentPlayer, winningLine)) {
            printBoard(board, winningLine);
            cout << (currentPlayer == COMPUTER ? "Computer" : "Player " + string(1, currentPlayer)) << " wins!\n";
            gameEnded = true;
        } else if (isTie(board)) {
            printBoard(board);
            cout << "It's a tie!\n";
            gameEnded = true;
        } else {
            printBoard(board);
            currentPlayer = (currentPlayer == HUMAN) ? COMPUTER : HUMAN;
        }
    }
}

int main() {
    srand(time(0)); // For any random elements we might add
    
    int mode, difficulty, maxDepth;
    cout << "Select Mode:\n1. Human vs Human\n2. Human vs Computer\nEnter your choice (1 or 2): ";
    cin >> mode;

    if (mode == 1) {
        playGame(false, 0);
    } else if (mode == 2) {
        cout << "Select Difficulty:\n1. Easy (α-β depth=2)\n2. Difficult (α-β depth=4)\n3. Insane (α-β depth=6)\nEnter your choice: ";
        cin >> difficulty;
        switch (difficulty) {
            case 1: maxDepth = 2; break;
            case 2: maxDepth = 4; break;
            case 3: maxDepth = 6; break;
            default: cout << "Invalid difficulty. Defaulting to Easy.\n"; maxDepth = 2;
        }
        playGame(true, maxDepth);
    } else {
        cout << "Invalid choice. Exiting...\n";
    }
    
    cout << "\nThanks for playing!\n";
    return 0;
}




