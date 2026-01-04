const express = require("express");
const path = require("path");
const { exec } = require("child_process");
const cors = require("cors");

const app = express();
const port = 3000;

// Middleware to parse JSON requests
app.use(express.json());

// Enable CORS for all routes
app.use(cors());

// Serve static files (e.g., index.html, styles.css, script.js)
app.use(express.static(path.join(__dirname, "public")));

// Route for the root URL ("/")
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// Endpoint to start the game
app.post("/start-game", (req, res) => {
    const difficulty = req.body.difficulty || 2; // Default to Easy (depth 2)
    console.log(`Starting game with difficulty: ${difficulty}`);

    // Call the C++ executable with the selected difficulty
    exec(`./tic_tac_toe start ${difficulty}`, (error, stdout, stderr) => {
        if (error) {
            console.error("Error starting game:", stderr);
            return res.status(500).json({ message: "Error starting game", error: stderr });
        }
        console.log("Game started successfully:", stdout);
        res.json({ message: "Game started", output: stdout });
    });
});

// Endpoint to make a move
// Endpoint to make a move
app.post("/make-move", (req, res) => {
    const move = req.body.move || ""; // Expected format: "layer row col"
    console.log(`Making move: ${move}`);

    // Call the C++ executable with the move
    exec(`./tic_tac_toe move ${move}`, (error, stdout, stderr) => {
        if (error) {
            console.error("Error making move:", stderr);
            return res.status(500).json({ message: "Error making move", error: stderr });
        }
        console.log("Move made successfully:", stdout);
        res.json({ message: "Move made", output: stdout });
    });
});

// Endpoint to reset the game
app.post("/reset-game", (req, res) => {
    console.log("Resetting game");

    // Call the C++ executable to reset the game
    exec("./tic_tac_toe reset", (error, stdout, stderr) => {
        if (error) {
            console.error("Error resetting game:", stderr);
            return res.status(500).json({ message: "Error resetting game", error: stderr });
        }
        console.log("Game reset successfully:", stdout);
        res.json({ message: "Game reset", output: stdout });
    });
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});