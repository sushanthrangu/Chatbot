#include <iostream>
#include <vector>
#include <cstdlib>
#include <ctime>
using namespace std;

#define COMPUTER 'O'
#define HUMAN 'X'

// Function to display the board
void printBoard(const vector<char> &board) {
    cout << "\n";
    for (int i = 0; i < 9; i += 3) {
        cout << " " << board[i] << " | " << board[i+1] << " | " << board[i+2] << "\n";
        if (i < 6) cout << "---|---|---\n";
    }
    cout << "\n";
}

// Function to display instructions
void showInstructions() {
    cout << "\nWelcome to Tic-Tac-Toe!\n";
    cout << "Choose a cell numbered 1 to 9 as shown:\n\n";
    cout << " 1 | 2 | 3\n";
    cout << "---|---|---\n";
    cout << " 4 | 5 | 6\n";
    cout << "---|---|---\n";
    cout << " 7 | 8 | 9\n\n";
}

// Function to check for winner
bool checkWinner(const vector<char> &board, char player) {
    // Rows, columns, diagonals
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

// Function to check for tie
bool isTie(const vector<char> &board) {
    for (char c : board)
        if (c == '-') return false;
    return true;
}

// Function to take human input
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

// Function to let computer make a move (random for now)
void computerMove(vector<char> &board) {
    cout << "Computer's turn...\n";
    vector<int> availableMoves;
    for (int i = 0; i < 9; i++)
        if (board[i] == '-') availableMoves.push_back(i);

    srand(time(0));
    int move = availableMoves[rand() % availableMoves.size()];
    board[move] = COMPUTER;
}

// Game loop
void playGame(bool vsComputer) {
    vector<char> board(9, '-');
    char currentPlayer = HUMAN;
    bool gameEnded = false;

    showInstructions();
    printBoard(board);

    while (!gameEnded) {
        if (vsComputer && currentPlayer == COMPUTER) {
            computerMove(board);
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
    int mode;
    cout << "Select Mode:\n1. Human vs Human\n2. Human vs Computer\nEnter your choice (1 or 2): ";
    cin >> mode;

    if (mode == 1) {
        playGame(false); // Human vs Human
    } else if (mode == 2) {
        playGame(true);  // Human vs Computer
    } else {
        cout << "Invalid choice. Exiting...\n";
    }

    return 0;
}
