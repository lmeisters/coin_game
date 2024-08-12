// Game State Variables
let coins = 10000;
let blockCost = 1;
const cells = document.querySelectorAll(".cell");
const coinCountElement = document.getElementById("coin-count");
const blockCostElement = document.getElementById("block-cost");
const resetButton = document.getElementById("reset");
const placeDepositButton = document.getElementById("place-deposit");
const placeConveyorButton = document.getElementById("place-conveyor");
const deleteBlockButton = document.getElementById("delete-block");
let intervals = [];
let placingDeposit = false;
let placingConveyor = false;
let deleteMode = false;
let depositPlaced = false;
let coinCounter = 0; // To give unique IDs to coins

// Directions for the conveyors and coin blocks
const directions = {
    0: { dx: 1, dy: 0 }, // Right
    1: { dx: -1, dy: 0 }, // Left
    2: { dx: 0, dy: -1 }, // Up
    3: { dx: 0, dy: 1 }, // Down
};

// Function to create and animate coin movement
function createAndMoveCoin(startCell, direction) {
    const coinElement = document.createElement("div");
    coinElement.classList.add("coin");
    coinElement.id = `coin-${coinCounter++}`; // Unique ID for each coin
    document.body.appendChild(coinElement);

    // Initialize coin position
    const startRect = startCell.getBoundingClientRect();
    coinElement.style.left = `${startRect.left + startRect.width / 2 - 10}px`;
    coinElement.style.top = `${startRect.top + startRect.height / 2 - 10}px`;
    coinElement.style.display = "block";

    moveCoin(coinElement, startCell, direction);
}

// Function to move a coin in the specified direction
function moveCoin(coinElement, startCell, direction) {
    const cellIndex = parseInt(startCell.dataset.id);
    const row = Math.floor(cellIndex / 3);
    const col = cellIndex % 3;

    const nextRow = row + direction.dy;
    const nextCol = col + direction.dx;
    const nextIndex = nextRow * 3 + nextCol;

    if (nextRow >= 0 && nextRow < 3 && nextCol >= 0 && nextCol < 3) {
        const nextCell = cells[nextIndex];

        // Animate coin movement
        const startRect = startCell.getBoundingClientRect();
        const endRect = nextCell.getBoundingClientRect();

        setTimeout(() => {
            coinElement.style.transform = `translate(${
                endRect.left +
                endRect.width / 2 -
                startRect.left -
                startRect.width / 2
            }px, ${
                endRect.top +
                endRect.height / 2 -
                startRect.top -
                startRect.height / 2
            }px)`;
        }, 100);

        // After movement, check the next cell's state
        // After movement, check the next cell's state
        setTimeout(() => {
            if (nextCell.classList.contains("deposit")) {
                // If the coin reaches a deposit, add to coins and remove coin element
                coins += 1;
                coinCountElement.textContent = coins;
                document.body.removeChild(coinElement);
            } else if (nextCell.classList.contains("conveyor")) {
                // Move the coin one block in the conveyor's direction
                coinElement.style.transform = "translate(0, 0)";
                coinElement.style.left = `${
                    endRect.left + endRect.width / 1 - 10
                }px`;
                coinElement.style.top = `${
                    endRect.top + endRect.height / 1 - 10
                }px`;

                // Continue moving in the conveyor's direction
                const nextDirection = parseInt(nextCell.dataset.direction);
                setTimeout(() => {
                    moveCoin(coinElement, nextCell, directions[nextDirection]);
                }, 100); // Allow some time for the visual move before continuing
            } else {
                // If the cell is empty, the coin stays there
                coinElement.style.transform = "translate(0, 0)";
                coinElement.style.left = `${
                    endRect.left + endRect.width / 2 - 10
                }px`;
                coinElement.style.top = `${
                    endRect.top + endRect.height / 2 - 10
                }px`;
            }
        }, 3100);
    } else {
        // If out of bounds, stop the coin
        coinElement.style.transform = "translate(0, 0)";
    }
}

// Function to start generating coins
function startGeneratingCoins(cell, direction) {
    const intervalId = setInterval(() => {
        createAndMoveCoin(cell, direction);
    }, 2000);
    intervals[cell.dataset.id] = intervalId;
}

// Determine direction based on mouse click position
function determineDirection(x, y, rect) {
    const midX = rect.width / 2;
    const midY = rect.height / 2;

    if (x < midX && y < midY) return 2; // Up
    if (x >= midX && y < midY) return 0; // Right
    if (x < midX && y >= midY) return 1; // Left
    if (x >= midX && y >= midY) return 3; // Down
}

// Event listener for clicking on cells
cells.forEach((cell) => {
    cell.addEventListener("click", (event) => {
        const rect = cell.getBoundingClientRect();
        const x = event.clientX - rect.left;
        const y = event.clientY - rect.top;

        const direction = determineDirection(x, y, rect);
        console.log("Direction:", direction);

        if (deleteMode && cell.classList.contains("occupied")) {
            // Stop coin generation if block is occupied
            const cellId = cell.dataset.id;
            clearInterval(intervals[cellId]);
            delete intervals[cellId];

            // Remove block and reset the cell
            cell.classList.remove("occupied", "deposit", "conveyor");
            cell.removeAttribute("data-direction");
            deleteMode = false; // Exit delete mode after deleting a block
        } else if (deleteMode && cell.classList.contains("conveyor")) {
            // Remove conveyor belt
            cell.classList.remove("conveyor");
            cell.removeAttribute("data-direction");
            deleteMode = false; // Exit delete mode after deleting a conveyor
        } else if (
            placingDeposit &&
            !cell.classList.contains("occupied") &&
            !cell.classList.contains("deposit") &&
            !depositPlaced
        ) {
            // Place deposit block
            cell.classList.add("deposit");
            depositPlaced = true;
            placingDeposit = false;
        } else if (
            placingConveyor &&
            !cell.classList.contains("occupied") &&
            !cell.classList.contains("conveyor")
        ) {
            // Place conveyor belt and set direction based on click position
            cell.classList.add("conveyor");
            cell.dataset.direction = direction;
            placingConveyor = false;
        } else if (
            !placingDeposit &&
            !placingConveyor &&
            !deleteMode && // Prevent block placement during delete mode
            !cell.classList.contains("occupied") &&
            coins >= blockCost
        ) {
            // Place coin block and set direction based on click position
            coins -= blockCost;
            coinCountElement.textContent = coins;
            cell.classList.add("occupied");
            cell.dataset.direction = direction;
            startGeneratingCoins(cell, directions[direction]);
            blockCost *= 2;
            blockCostElement.textContent = blockCost;
        } else if (coins < blockCost) {
            alert("Not enough coins to place a block!");
        }
    });
});

// Reset game
resetButton.addEventListener("click", () => {
    // Reset coins and block cost
    coins = 100000;
    blockCost = 1;
    coinCountElement.textContent = coins;
    blockCostElement.textContent = blockCost;
    depositPlaced = false;
    deleteMode = false; // Reset delete mode on game reset

    // Clear intervals
    intervals.forEach((interval) => clearInterval(interval));
    intervals = [];

    // Remove all coins from the screen
    document.querySelectorAll(".coin").forEach((coin) => {
        document.body.removeChild(coin);
    });

    // Reset cells
    cells.forEach((cell) => {
        cell.classList.remove("occupied", "deposit", "conveyor");
        cell.removeAttribute("data-direction");
    });
});

// Place deposit block
placeDepositButton.addEventListener("click", () => {
    if (!depositPlaced) {
        placingDeposit = true;
    }
});

// Place conveyor belt
placeConveyorButton.addEventListener("click", () => {
    placingConveyor = true;
});

// Delete block
deleteBlockButton.addEventListener("click", () => {
    deleteMode = true;
});
