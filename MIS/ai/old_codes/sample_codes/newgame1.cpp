#include <iostream>
#include <vector>
#include <cstdlib>
#include <ctime>
#include <limits>
using namespace std;

#define COMPUTER 'O'
#define HUMAN 'X'

void printBoard(const vector<char> &board) {
    cout << "\n";
    for (int i = 0; i < 9; i += 3) {
        cout << " " << board[i] << " | " << board[i+1] << " | " << board[i+2] << "\n";
        if (i < 6) cout << "---|---|---\n";
    }
    cout << "\n";
}

void showInstructions() {
    cout << "\nWelcome to Tic-Tac-Toe!\n";
    cout << "Choose a cell numbered 1 to 9 as shown:\n\n";
    cout << " 1 | 2 | 3\n";
    cout << "---|---|---\n";
    cout << " 4 | 5 | 6\n";
    cout << "---|---|---\n";
    cout << " 7 | 8 | 9\n\n";
}

bool checkWinner(const vector<char> &board, char player) {
    return (
        (board[0] == player && board[1] == player && board[2] == player) ||
        (board[3] == player && board[4] == player && board[5] == player) ||
        (board[6] == player && board[7] == player && board[8] == player) ||
        (board[0] == player && board[3] == player && board[6] == player) ||
        (board[1] == player && board[4] == player && board[7] == player) ||
        (board[2] == player && board[5] == player && board[8] == player) ||
        (board[0] == player && board[4] == player && board[8] == player) ||
        (board[2] == player && board[4] == player && board[6] == player)
    );
}

bool isTie(const vector<char> &board) {
    for (char c : board)
        if (c == '-') return false;
    return true;
}

void playerMove(vector<char> &board, char player) {
    int move;
    while (true) {
        cout << "Player " << player << ", enter your move (1-9): ";
        cin >> move;
        if (cin.fail() || move < 1 || move > 9 || board[move - 1] != '-') {
            cin.clear(); cin.ignore(10000, '\n');
            cout << "Invalid move. Try again.\n";
        } else {
            board[move - 1] = player;
            break;
        }
    }
}

// Evaluation function
int evaluate(const vector<char> &board) {
    if (checkWinner(board, COMPUTER)) return +10;
    if (checkWinner(board, HUMAN)) return -10;
    return 0;
}

// Minimax with alpha-beta pruning
int minimax(vector<char> &board, int depth, bool isMax, int alpha, int beta, int maxDepth) {
    int score = evaluate(board);
    if (score == 10 || score == -10 || isTie(board) || depth == maxDepth)
        return score;

    if (isMax) {
        int best = numeric_limits<int>::min();
        for (int i = 0; i < 9; ++i) {
            if (board[i] == '-') {
                board[i] = COMPUTER;
                best = max(best, minimax(board, depth + 1, false, alpha, beta, maxDepth));
                board[i] = '-';
                alpha = max(alpha, best);
                if (beta <= alpha) break;
            }
        }
        return best;
    } else {
        int best = numeric_limits<int>::max();
        for (int i = 0; i < 9; ++i) {
            if (board[i] == '-') {
                board[i] = HUMAN;
                best = min(best, minimax(board, depth + 1, true, alpha, beta, maxDepth));
                board[i] = '-';
                beta = min(beta, best);
                if (beta <= alpha) break;
            }
        }
        return best;
    }
}

// Find best move
int findBestMove(vector<char> &board, int maxDepth) {
    int bestVal = numeric_limits<int>::min();
    int bestMove = -1;

    for (int i = 0; i < 9; ++i) {
        if (board[i] == '-') {
            board[i] = COMPUTER;
            int moveVal = minimax(board, 0, false, numeric_limits<int>::min(), numeric_limits<int>::max(), maxDepth);
            board[i] = '-';

            if (moveVal > bestVal) {
                bestMove = i;
                bestVal = moveVal;
            }
        }
    }
    return bestMove;
}

// AI Move with difficulty
void computerMove(vector<char> &board, int maxDepth) {
    cout << "Computer's turn...\n";
    int move = findBestMove(board, maxDepth);
    board[move] = COMPUTER;
}

// Game loop
void playGame(bool vsComputer, int maxDepth) {
    vector<char> board(9, '-');
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

        printBoard(board);

        if (checkWinner(board, currentPlayer)) {
            cout << (currentPlayer == COMPUTER ? "Computer" : "Player " + string(1, currentPlayer)) << " wins!\n";
            gameEnded = true;
        } else if (isTie(board)) {
            cout << "It's a tie!\n";
            gameEnded = true;
        } else {
            currentPlayer = (currentPlayer == HUMAN) ? COMPUTER : HUMAN;
        }
    }
}

int main() {
    int mode, difficulty, maxDepth = 1;
    cout << "Select Mode:\n1. Human vs Human\n2. Human vs Computer\nEnter your choice (1 or 2): ";
    cin >> mode;

    if (mode == 1) {
        playGame(false, maxDepth);
    } else if (mode == 2) {
        cout << "Select Difficulty:\n1. Easy\n2. Difficult\n3. Insane\nEnter your choice: ";
        cin >> difficulty;
        switch (difficulty) {
            case 1: maxDepth = 1; break;  // Easy
            case 2: maxDepth = 4; break;  // Difficult
            case 3: maxDepth = 9; break;  // Insane (perfect play)
            default: cout << "Invalid difficulty. Defaulting to Easy.\n"; maxDepth = 1;
        }
        playGame(true, maxDepth);
    } else {
        cout << "Invalid choice. Exiting...\n";
    }

    return 0;
}
