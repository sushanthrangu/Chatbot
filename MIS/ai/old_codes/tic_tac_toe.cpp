#include <iostream>
#include <vector>
#include <limits>
#include <algorithm>
#include <cstdlib>  
#include <ctime>    
#include <tuple> // Include for using tuple
using namespace std;

class TicTacToe3D {
private:
    vector<vector<vector<char>>> board; // 4x4x4 board
    char playerSymbol, computerSymbol;
    int difficultyDepth; // Depth for Minimax (2, 4, or 6)

public:
    TicTacToe3D(int depth) : difficultyDepth(depth) {
        // Initialize 4x4x4 board with '-'
        board = vector<vector<vector<char>>>(4, vector<vector<char>>(4, vector<char>(4, '-')));
        playerSymbol = 'X';
        computerSymbol = 'O';
    }

    // Display the 3D board
    string displayBoard() {
        string boardState;
        for (int layer = 0; layer < 4; layer++) {
            boardState += "Layer " + to_string(layer + 1) + ":\n";
            for (int row = 0; row < 4; row++) {
                for (int col = 0; col < 4; col++) {
                    boardState += board[layer][row][col];
                    boardState += " ";
                }
                boardState += "\n";
            }
            boardState += "\n";
        }
        return boardState;
    }

    // Check if a move is valid
    bool isMoveValid(int layer, int row, int col) {
        return layer >= 0 && layer < 4 && row >= 0 && row < 4 && col >= 0 && col < 4 &&
               board[layer][row][col] == '-';
    }

    // Make a move
    void makeMove(int layer, int row, int col, char symbol) {
        if (isMoveValid(layer, row, col)) {
            board[layer][row][col] = symbol;
        } else {
            throw invalid_argument("Invalid move");
        }
    }

    // Player's move
    void playerMove() {
        int layer, row, col;
        cout << "Enter your move (layer, row, and column: 1 2 3): ";
        while (true) {
            cin >> layer >> row >> col;
            layer--; row--; col--; // Convert to 0-based indexing
            if (isMoveValid(layer, row, col)) {
                board[layer][row][col] = playerSymbol;
                break;
            } else {
                cout << "Invalid move. Try again: ";
            }
        }
    }

    // Check if a player has won
    bool isWinner(char symbol) {
        // Check all possible lines in 3D (rows, columns, layers, and diagonals)
        for (int i = 0; i < 4; i++) {
            for (int j = 0; j < 4; j++) {
                // Check rows in each layer
                if (board[i][j][0] == symbol && board[i][j][1] == symbol &&
                    board[i][j][2] == symbol && board[i][j][3] == symbol)
                    return true;
                // Check columns in each layer
                if (board[i][0][j] == symbol && board[i][1][j] == symbol &&
                    board[i][2][j] == symbol && board[i][3][j] == symbol)
                    return true;
            }
            // Check layers vertically
            if (board[0][i][0] == symbol && board[1][i][0] == symbol &&
                board[2][i][0] == symbol && board[3][i][0] == symbol)
                return true;
        }

        // Check diagonals within layers and across layers
        for (int i = 0; i < 4; i++) {
            // Layer diagonals
            if (board[i][0][0] == symbol && board[i][1][1] == symbol &&
                board[i][2][2] == symbol && board[i][3][3] == symbol)
                return true;
            if (board[i][0][3] == symbol && board[i][1][2] == symbol &&
                board[i][2][1] == symbol && board[i][3][0] == symbol)
                return true;
        }

        // Cross-layer diagonals
        if (board[0][0][0] == symbol && board[1][1][1] == symbol &&
            board[2][2][2] == symbol && board[3][3][3] == symbol)
            return true;
        if (board[0][3][0] == symbol && board[1][2][1] == symbol &&
            board[2][1][2] == symbol && board[3][0][3] == symbol)
            return true;

        return false;
    }

    // Check if the board is full
    bool isBoardFull() {
        for (int layer = 0; layer < 4; layer++) {
            for (int row = 0; row < 4; row++) {
                for (int col = 0; col < 4; col++) {
                    if (board[layer][row][col] == '-')
                        return false;
                }
            }
        }
        return true;
    }

    // Evaluate the board for Minimax
    int evaluateBoard() {
        if (isWinner(computerSymbol)) return 10;
        if (isWinner(playerSymbol)) return -10;
        return 0;
    }

    // Minimax algorithm with depth limit
    int minimax(int depth, bool isMax) {
        int score = evaluateBoard();
        if (score == 10 || score == -10) return score;
        if (isBoardFull() || depth == 0) return 0;

        int bestScore = isMax ? -1000 : 1000;

        for (int layer = 0; layer < 4; layer++) {
            for (int row = 0; row < 4; row++) {
                for (int col = 0; col < 4; col++) {
                    if (board[layer][row][col] == '-') {
                        board[layer][row][col] = isMax ? computerSymbol : playerSymbol;
                        int currentScore = minimax(depth - 1, !isMax);
                        board[layer][row][col] = '-';
                        bestScore = isMax ? max(bestScore, currentScore) : min(bestScore, currentScore);
                    }
                }
            }
        }
        return bestScore;
    }

    // Computer's move based on difficulty
    void computerMove() {
        srand(time(0));  // Initialize random seed

        int bestScore = -1000, bestLayer = -1, bestRow = -1, bestCol = -1;
        vector<tuple<int, int, int>> bestMoves;  // Use tuple for storing moves

        // Find all possible moves and their scores
        for (int layer = 0; layer < 4; layer++) {
            for (int row = 0; row < 4; row++) {
                for (int col = 0; col < 4; col++) {
                    if (board[layer][row][col] == '-') {
                        board[layer][row][col] = computerSymbol;
                        int moveScore = minimax(difficultyDepth - 1, false);
                        board[layer][row][col] = '-';

                        // If this move has a higher score, reset the best moves list
                        if (moveScore > bestScore) {
                            bestScore = moveScore;
                            bestMoves.clear();
                            bestMoves.push_back(make_tuple(layer, row, col));
                        }
                        // If this move has the same score, add to the best moves list
                        else if (moveScore == bestScore) {
                            bestMoves.push_back(make_tuple(layer, row, col));
                        }
                    }
                }
            }
        }

        // Randomly select from the best moves
        int randomIndex = rand() % bestMoves.size();
        bestLayer = get<0>(bestMoves[randomIndex]);
        bestRow = get<1>(bestMoves[randomIndex]);
        bestCol = get<2>(bestMoves[randomIndex]);

        board[bestLayer][bestRow][bestCol] = computerSymbol;
        cout << "Computer chooses: Layer " << bestLayer + 1 << ", Row " << bestRow + 1 << ", Col " << bestCol + 1 << endl;
    }

    // Main game loop
    void playGame() {
        cout << "3D Tic-Tac-Toe Game!\n";
        displayBoard();
        while (true) {
            playerMove();
            displayBoard();
            if (isWinner(playerSymbol)) {
                cout << "Congratulations! You win!\n";
                break;
            }
            if (isBoardFull()) {
                cout << "It's a draw!\n";
                break;
            }

            computerMove();
            displayBoard();
            if (isWinner(computerSymbol)) {
                cout << "Computer wins! Better luck next time.\n";
                break;
            }
            if (isBoardFull()) {
                cout << "It's a draw!\n";
                break;
            }
        }
    }
};

int main(int argc, char* argv[]) {
    static TicTacToe3D* game = nullptr;  // Game object will persist

    string command;
    while (true) {
        cout << "Enter command (start <difficulty>, move <layer> <row> <col>, reset, exit): ";
        cin >> command;

        if (command == "start") {
            int difficulty;
            cin >> difficulty;

            game = new TicTacToe3D(difficulty);
            cout << "Game started with difficulty: " << difficulty << endl;
            cout << game->displayBoard();  // Print the initial game board
        } 
        else if (command == "move") {
            if (game == nullptr) {
                cout << "Error: No game started. Please use 'start' to begin a new game." << endl;
                continue;
            }

            int layer, row, col;
            cin >> layer >> row >> col;
            try {
                game->makeMove(layer - 1, row - 1, col - 1, 'X');
                cout << game->displayBoard();  // Print updated game board after player move

                if (game->isWinner('X')) {
                    cout << "Congratulations! You win!" << endl;
                    continue;
                }

                if (!game->isBoardFull()) {
                    game->computerMove();
                    cout << game->displayBoard();  // Print updated board after computer move
                }
            } catch (const invalid_argument& e) {
                cout << "Error: " << e.what() << endl;
            }
        }
        else if (command == "reset") {
            if (game != nullptr) {
                delete game;  // Free the old game instance
            }
            game = nullptr;
            cout << "Game reset!" << endl;
        }
        else if (command == "exit") {
            if (game != nullptr) {
                delete game;
            }
            break;
        } 
        else {
            cout << "Error: Unknown command" << endl;
        }
    }

    return 0;
}
