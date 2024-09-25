const hitSound = document.getElementById('hit-sound');
const missSound = document.getElementById('miss-sound');
const killSound = document.getElementById('kill-sound');

// Воспроизведение звука попадания
function playHitSound() {
    hitSound.pause(); 
    hitSound.currentTime = 0;
    hitSound.play();
}

// Воспроизведение звука промаха
function playMissSound() {
    missSound.pause(); 
    missSound.currentTime = 0;
    missSound.play();
}

function playKillSound() {
    killSound.pause(); 
    killSound.currentTime = 0;
    killSound.play();
}



const playerBoard = document.getElementById('player-board');
const computerBoard = document.getElementById('computer-board');
const placeShipsButton = document.getElementById('place-ships');
const startGameButton = document.getElementById('start-game');
const turnInfo = document.getElementById('turn-info');
const remainingShipsInfo = document.getElementById('remaining-ships');

const BOARD_SIZE = 10;
const SHIP_SIZES = [4, 3, 3, 2, 2, 2, 1, 1, 1, 1];

let playerShips = [];
let computerShips = [];
let gameStarted = false;
let playerTurn = true;
let playerHits = 0;
let computerHits = 0;
let totalPlayerShips = 10;
let totalComputerShips = 10;

// Создание пустого поля 10x10
function createBoard(boardElement) {
    boardElement.innerHTML = '';
    for (let i = 0; i < BOARD_SIZE * BOARD_SIZE; i++) {
        const cell = document.createElement('div');
        cell.classList.add('cell');
        boardElement.appendChild(cell);
    }
}

// Получить клетки доски как массив
function getCells(boardElement) {
    return Array.from(boardElement.querySelectorAll('.cell'));
}

// Расставить корабли случайным образом
function placeShipsRandomly() {
    const ships = [];
    const board = Array.from({ length: BOARD_SIZE }, () => Array(BOARD_SIZE).fill(null));

    for (let size of SHIP_SIZES) {
        let placed = false;
        while (!placed) {
            let x = Math.floor(Math.random() * BOARD_SIZE);
            let y = Math.floor(Math.random() * BOARD_SIZE);
            let direction = Math.random() < 0.5 ? 'horizontal' : 'vertical';
            
            if (canPlaceShip(x, y, size, direction, board)) {
                placeShip(x, y, size, direction, board);
                ships.push({ x, y, size, direction, hits: 0 });
                placed = true;
            }
        }
    }
    return { board, ships };
}

// Проверить, можно ли разместить корабль в данной точке
function canPlaceShip(x, y, size, direction, board) {
    if (direction === 'horizontal') {
        if (y + size > BOARD_SIZE) return false;
        for (let i = 0; i < size; i++) {
            if (board[x][y + i] !== null || hasAdjacentShip(x, y + i, board)) return false;
        }
    } else {
        if (x + size > BOARD_SIZE) return false;
        for (let i = 0; i < size; i++) {
            if (board[x + i][y] !== null || hasAdjacentShip(x + i, y, board)) return false;
        }
    }
    return true;
}

// Проверить, есть ли рядом с клеткой другой корабль
function hasAdjacentShip(x, y, board) {
    const adjacentOffsets = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];
    return adjacentOffsets.some(([dx, dy]) => {
        const newX = x + dx;
        const newY = y + dy;
        return newX >= 0 && newX < BOARD_SIZE && newY >= 0 && newY < BOARD_SIZE && board[newX][newY] !== null;
    });
}

// Разместить корабль на поле
function placeShip(x, y, size, direction, board) {
    if (direction === 'horizontal') {
        for (let i = 0; i < size; i++) {
            board[x][y + i] = 'ship';
        }
    } else {
        for (let i = 0; i < size; i++) {
            board[x + i][y] = 'ship';
        }
    }
}

// Отобразить корабли игрока
function displayPlayerShips() {
    const playerCells = getCells(playerBoard);
    playerCells.forEach((cell, index) => {
        const row = Math.floor(index / BOARD_SIZE);
        const col = index % BOARD_SIZE;
        if (playerShips.board[row][col] === 'ship') {
            cell.classList.add('ship');
        }
    });
}

// Проверить, убит ли корабль
function isShipSunk(ship) {
    return ship.hits >= ship.size;
}

// Окружить убитый корабль клетками "промах"
// Окружить убитый корабль клетками "промах"
function surroundShip(ship, boardElement, board) {
    const adjacentOffsets = [
        [-1, -1], [-1, 0], [-1, 1],
        [0, -1], [0, 1],
        [1, -1], [1, 0], [1, 1]
    ];

    for (let i = 0; i < ship.size; i++) {
        let startX = ship.direction === 'horizontal' ? ship.x : ship.x + i;
        let startY = ship.direction === 'horizontal' ? ship.y + i : ship.y;

        // Окружить каждую клетку корабля
        adjacentOffsets.forEach(([dx, dy]) => {
            let newX = startX + dx;
            let newY = startY + dy;

            if (newX >= 0 && newX < BOARD_SIZE && newY >= 0 && newY < BOARD_SIZE) {
                const cellIndex = newX * BOARD_SIZE + newY;
                const cell = getCells(boardElement)[cellIndex];
                if (!cell.classList.contains('hit') && !cell.classList.contains('ship')) {
                    cell.classList.add('miss');
                }
            }
        });
    }

    playKillSound();
}





// Ход компьютера
let lastHit = null; // Хранит последнее попадание
let currentDirection = null; // Направление атаки (горизонтально или вертикально)
const attackPattern = []; // Список клеток для атаки по стратегии

// Измененная функция computerMove
function computerMove() {
    let availableCells = getCells(playerBoard).filter(cell => 
        !cell.classList.contains('hit') && !cell.classList.contains('miss')
    );

    let targetCell = null;

    // Если есть последнее попадание, продолжаем атаковать в соседние клетки
    if (lastHit) {
        const [row, col] = lastHit;
        const potentialTargets = [];

        // Определяем возможные направления для атаки
        const directions = [
            { r: row - 1, c: col }, // вверх
            { r: row + 1, c: col }, // вниз
            { r: row, c: col - 1 }, // влево
            { r: row, c: col + 1 }  // вправо
        ];

        // Добавляем доступные соседние клетки в potentialTargets
        for (const { r, c } of directions) {
            if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
                const cell = playerBoard.children[r * BOARD_SIZE + c];
                if (!cell.classList.contains('hit') && !cell.classList.contains('miss')) {
                    potentialTargets.push({ r, c });
                }
            }
        }

        // Если есть доступные соседние клетки, выбираем одну из них
        if (potentialTargets.length > 0) {
            // Выбираем случайную клетку из доступных соседей
            const target = potentialTargets[Math.floor(Math.random() * potentialTargets.length)];
            targetCell = playerBoard.children[target.r * BOARD_SIZE + target.c];
        }
    }

    // Если нет доступной клетки, выбираем следующую по стратегии
    if (!targetCell) {
        targetCell = selectNextAttackCell(availableCells);
    }

    const index = Array.from(playerBoard.children).indexOf(targetCell);
    const row = Math.floor(index / BOARD_SIZE);
    const col = index % BOARD_SIZE;

    if (targetCell.classList.contains('ship')) {
        targetCell.classList.add('hit');
        computerHits++;
        playHitSound();
        lastHit = [row, col]; // Сохраняем последнее попадание

        // Логика проверки попадания
        playerShips.ships.forEach(ship => {
            if (isPartOfShip(ship, row, col)) {
                ship.hits++;
                if (isShipSunk(ship)) {
                    surroundShip(ship, playerBoard, playerShips.board);
                    totalPlayerShips--;
                }
            }
        });
        turnInfo.textContent = "Компьютер попал!";
    } else {
        targetCell.classList.add('miss');
        playMissSound();
        playerTurn = true;  // Передаем ход игроку
        lastHit = null;  // Сбрасываем последнее попадание
    }

    checkGameOver();

    // После проверки окончания игры обновляем флаг хода
    if (totalPlayerShips > 0 && totalComputerShips > 0 && !playerTurn) {
        setTimeout(computerMove, 1000);  // Если игра продолжается, компьютер снова делает ход
    }
}

// Функция для выбора следующей клетки для атаки
function selectNextAttackCell(availableCells) {
    // Сначала проверяем, есть ли заранее запланированные клетки для атаки
    if (attackPattern.length > 0) {
        return attackPattern.shift(); // Берем первую клетку из списка
    }

    // Если нет заранее запланированных клеток, выбираем случайную
    if (availableCells.length === 0) return null; // Если все клетки уже атакованы
    return availableCells[Math.floor(Math.random() * availableCells.length)];
}

// Функция, которая будет вызываться, когда AI попадает
function onHit() {
    // Создаем список соседних клеток для будущих атак
    const directions = [
        { r: lastHit[0] - 1, c: lastHit[1] }, // вверх
        { r: lastHit[0] + 1, c: lastHit[1] }, // вниз
        { r: lastHit[0], c: lastHit[1] - 1 }, // влево
        { r: lastHit[0], c: lastHit[1] + 1 }  // вправо
    ];

    directions.forEach(({ r, c }) => {
        if (r >= 0 && r < BOARD_SIZE && c >= 0 && c < BOARD_SIZE) {
            const cell = playerBoard.children[r * BOARD_SIZE + c];
            if (!cell.classList.contains('hit') && !cell.classList.contains('miss')) {
                attackPattern.push(cell); // Добавляем клетку в очередь для атаки
            }
        }
    });
}




///////////





// Функция для определения направления атаки
function determineDirection(lastHit, targetCell) {
    const [lastRow, lastCol] = lastHit;
    const index = Array.from(playerBoard.children).indexOf(targetCell);
    const row = Math.floor(index / BOARD_SIZE);
    const col = index % BOARD_SIZE;

    if (row === lastRow) {
        // Если в одной строке, значит направление горизонтальное
        return 'horizontal';
    } else if (col === lastCol) {
        // Если в одном столбце, значит направление вертикальное
        return 'vertical';
    }
    return null; // Если не совпадает, возвращаем null
}




// Новая функция для атаки соседних клеток
function attackAdjacentCells(row, col) {
    const adjacentOffsets = [
        [-1, 0], // вверх
        [1, 0],  // вниз
        [0, -1], // влево
        [0, 1],  // вправо
    ];

    adjacentOffsets.forEach(([dx, dy]) => {
        const newRow = row + dx;
        const newCol = col + dy;

        if (newRow >= 0 && newRow < BOARD_SIZE && newCol >= 0 && newCol < BOARD_SIZE) {
            const adjacentCell = playerBoard.children[newRow * BOARD_SIZE + newCol];
            if (!adjacentCell.classList.contains('hit') && !adjacentCell.classList.contains('miss')) {
                // Атакуем соседнюю клетку
                adjacentCell.click(); // Используем click для вызова playerMove
            }
        }
    });
}



// Проверить, находится ли клетка в корабле
function isPartOfShip(ship, row, col) {
    if (ship.direction === 'horizontal') {
        return row === ship.x && col >= ship.y && col < ship.y + ship.size;
    } else {
        return col === ship.y && row >= ship.x && row < ship.x + ship.size;
    }
}

// Проверить окончание игры
function checkGameOver() {
    if (totalPlayerShips === 0) {
        alert("Игра окончена! Компьютер победил!");
        gameStarted = false;
    } else if (totalComputerShips === 0) {
        alert("Игра окончена! Вы победили!");
        gameStarted = false;
    }
}

// Начать игру
function startGame() {
    gameStarted = true;
    startGameButton.disabled = true;
    turnInfo.textContent = "Ваш ход!";
}

// Сделать ход по клетке компьютера
function playerMove(event) {
    if (!gameStarted || !playerTurn) return;

    const cell = event.target;
    const index = Array.from(computerBoard.children).indexOf(cell);
    const row = Math.floor(index / BOARD_SIZE);
    const col = index % BOARD_SIZE;

    if (!cell.classList.contains('hit') && !cell.classList.contains('miss')) {
        if (computerShips.board[row][col] === 'ship') {
            cell.classList.add('hit');
            playerHits++;
            playHitSound();
            computerShips.ships.forEach(ship => {
                if (isPartOfShip(ship, row, col)) {
                    ship.hits++;
                    if (isShipSunk(ship)) {
                        surroundShip(ship, computerBoard, computerShips.board);
                        totalComputerShips--;
                    }
                }
            });
            turnInfo.textContent = "Попадание!";
        } else {
            cell.classList.add('miss');
            playMissSound();
            playerTurn = false;
            turnInfo.textContent = "Ход компьютера!";
            setTimeout(computerMove, 300);
        }
    }

    checkGameOver();
}

// Инициализация игры
function initGame() {
    createBoard(playerBoard);
    createBoard(computerBoard);
    
    playerShips = placeShipsRandomly();
    computerShips = placeShipsRandomly();
    
    displayPlayerShips();
    
    getCells(computerBoard).forEach(cell => {
        cell.addEventListener('click', playerMove);
    });

    turnInfo.textContent = "";
    startGameButton.disabled = false;
}

// Расставить корабли
placeShipsButton.addEventListener('click', initGame);

// Начать игру
startGameButton.addEventListener('click', startGame);

// Инициализация первой доски
initGame();
