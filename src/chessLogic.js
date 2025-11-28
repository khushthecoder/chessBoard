
export const colors = {
  WHITE: 'white',
  BLACK: 'black'
};

export const pieces = {
  PAWN: 'pawn',
  ROOK: 'rook',
  KNIGHT: 'knight',
  BISHOP: 'bishop',
  QUEEN: 'queen',
  KING: 'king'
};

let _gameState = {
  board: [],
  turn: colors.WHITE,
  enPassant: null,
  moveHistory: [],
  castlingRights: {
    [colors.WHITE]: { kingSide: true, queenSide: true },
    [colors.BLACK]: { kingSide: true, queenSide: true }
  }
};

export const gameState = _gameState;

export function setGameState(newState) {
  Object.assign(_gameState, newState);
}

export function getGameState() {
  return _gameState;
}

const initialBoard = (() => {
  const board = [];
  for (let r = 0; r < 8; r++) {
    const row = [];
    for (let c = 0; c < 8; c++) row.push(null);
    board.push(row);
  }

  for (let col = 0; col < 8; col++) {
    board[1][col] = { type: pieces.PAWN, color: colors.BLACK };
    board[6][col] = { type: pieces.PAWN, color: colors.WHITE };
  }

  const pieceOrder = [
    pieces.ROOK, pieces.KNIGHT, pieces.BISHOP, pieces.QUEEN,
    pieces.KING, pieces.BISHOP, pieces.KNIGHT, pieces.ROOK
  ];

  for (let col = 0; col < 8; col++) {
    board[0][col] = { type: pieceOrder[col], color: colors.BLACK };
    board[7][col] = { type: pieceOrder[col], color: colors.WHITE };
  }

  return board;
})();

setGameState({
  board: initialBoard,
  turn: colors.WHITE,
  enPassant: null,
  moveHistory: [],
  castlingRights: {
    [colors.WHITE]: { kingSide: true, queenSide: true },
    [colors.BLACK]: { kingSide: true, queenSide: true }
  }
});

export function initializeBoard() {
  return JSON.parse(JSON.stringify(initialBoard));
}

setGameState({
  board: initializeBoard(),
  turn: colors.WHITE,
  enPassant: null,
  moveHistory: [],
  castlingRights: {
    [colors.WHITE]: { kingSide: true, queenSide: true },
    [colors.BLACK]: { kingSide: true, queenSide: true }
  }
});

function isSquareAttacked(board, square, byColor) {
  const pawnDir = byColor === colors.WHITE ? -1 : 1;
  const pawnRow = square.row - pawnDir;
  if (pawnRow >= 0 && pawnRow < 8) {
    for (const dc of [-1, 1]) {
      const col = square.col + dc;
      if (col >= 0 && col < 8) {
        const piece = board[pawnRow][col];
        if (piece && piece.color === byColor && piece.type === pieces.PAWN) return true;
      }
    }
  }

  const knightMoves = [
    [1, 2], [1, -2], [2, 1], [2, -1],
    [-1, 2], [-1, -2], [-2, 1], [-2, -1]
  ];
  for (const [dr, dc] of knightMoves) {
    const r = square.row + dr, c = square.col + dc;
    if (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const piece = board[r][c];
      if (piece && piece.color === byColor && piece.type === pieces.KNIGHT) return true;
    }
  }

  for (let dr = -1; dr <= 1; dr++) {
    for (let dc = -1; dc <= 1; dc++) {
      if (dr === 0 && dc === 0) continue;
      const r = square.row + dr, c = square.col + dc;
      if (r >= 0 && r < 8 && c >= 0 && c < 8) {
        const piece = board[r][c];
        if (piece && piece.color === byColor && piece.type === pieces.KING) return true;
      }
    }
  }

  const directions = [
    { dr: 1, dc: 0, types: [pieces.ROOK, pieces.QUEEN] },
    { dr: -1, dc: 0, types: [pieces.ROOK, pieces.QUEEN] },
    { dr: 0, dc: 1, types: [pieces.ROOK, pieces.QUEEN] },
    { dr: 0, dc: -1, types: [pieces.ROOK, pieces.QUEEN] },
    { dr: 1, dc: 1, types: [pieces.BISHOP, pieces.QUEEN] },
    { dr: 1, dc: -1, types: [pieces.BISHOP, pieces.QUEEN] },
    { dr: -1, dc: 1, types: [pieces.BISHOP, pieces.QUEEN] },
    { dr: -1, dc: -1, types: [pieces.BISHOP, pieces.QUEEN] }
  ];

  for (const { dr, dc, types } of directions) {
    let r = square.row + dr;
    let c = square.col + dc;
    while (r >= 0 && r < 8 && c >= 0 && c < 8) {
      const piece = board[r][c];
      if (piece) {
        if (piece.color === byColor && types.includes(piece.type)) return true;
        break;
      }
      r += dr;
      c += dc;
    }
  }

  return false;
}

function wouldLeaveKingInCheck(board, move, color) {
  const tempBoard = JSON.parse(JSON.stringify(board));
  const piece = tempBoard[move.from.row][move.from.col];
  tempBoard[move.to.row][move.to.col] = piece;
  tempBoard[move.from.row][move.from.col] = null;

  if (move.isEnPassant) {
    const dir = color === colors.WHITE ? -1 : 1;
    tempBoard[move.to.row - dir][move.to.col] = null;
  }

  let kingPos = null;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const p = tempBoard[r][c];
      if (p && p.type === pieces.KING && p.color === color) {
        kingPos = { row: r, col: c };
        break;
      }
    }
    if (kingPos) break;
  }

  if (!kingPos) return true;

  return isSquareAttacked(tempBoard, kingPos, color === colors.WHITE ? colors.BLACK : colors.WHITE);
}

export function getLegalMoves(board, from) {
  const { row, col } = from;
  const piece = board[row][col];
  if (!piece) return [];

  const color = piece.color;
  const type = piece.type;
  const moves = [];

  const addMove = (r, c, special = {}) => {
    if (r < 0 || c < 0 || r >= 8 || c >= 8) return false;
    const target = board[r][c];
    if (target && target.color === color) return false;

    moves.push({ from, to: { row: r, col: c }, ...special });
    return !target;
  };

  switch (type) {
    case pieces.PAWN: {
      const dir = color === colors.WHITE ? -1 : 1;
      const startRow = color === colors.WHITE ? 6 : 1;

      if (!board[row + dir]?.[col]) {
        moves.push({ from, to: { row: row + dir, col } });
        if (row === startRow && !board[row + 2 * dir]?.[col]) {
          moves.push({ from, to: { row: row + 2 * dir, col } });
        }
      }

      for (const dc of [-1, 1]) {
        const nr = row + dir;
        const nc = col + dc;
        if (nr >= 0 && nr < 8 && nc >= 0 && nc < 8) {
          const target = board[nr][nc];
          if (target && target.color !== color) {
            moves.push({ from, to: { row: nr, col: nc } });
          }
          if (_gameState.enPassant &&
            _gameState.enPassant.row === nr &&
            _gameState.enPassant.col === nc) {
            moves.push({ from, to: { row: nr, col: nc }, isEnPassant: true });
          }
        }
      }
      break;
    }

    case pieces.KNIGHT:
      const knightOffsets = [
        [1, 2], [1, -2], [2, 1], [2, -1],
        [-1, 2], [-1, -2], [-2, 1], [-2, -1]
      ];
      for (const [dr, dc] of knightOffsets) {
        addMove(row + dr, col + dc);
      }
      break;

    case pieces.ROOK:
    case pieces.BISHOP:
    case pieces.QUEEN:
      const slidingDirs = [];
      if (type !== pieces.BISHOP) slidingDirs.push([1, 0], [-1, 0], [0, 1], [0, -1]);
      if (type !== pieces.ROOK) slidingDirs.push([1, 1], [1, -1], [-1, 1], [-1, -1]);

      for (const [dr, dc] of slidingDirs) {
        for (let i = 1; i < 8; i++) {
          if (!addMove(row + dr * i, col + dc * i)) break;
        }
      }
      break;

    case pieces.KING:
      for (let dr = -1; dr <= 1; dr++) {
        for (let dc = -1; dc <= 1; dc++) {
          if (dr === 0 && dc === 0) continue;
          addMove(row + dr, col + dc);
        }
      }

      if (_gameState.castlingRights && _gameState.castlingRights[color]) {
        const rights = _gameState.castlingRights[color];
        const opponent = color === colors.WHITE ? colors.BLACK : colors.WHITE;

        if (!isSquareAttacked(board, from, opponent)) {
          if (rights.kingSide) {
            if (!board[row][col + 1] && !board[row][col + 2] &&
              !isSquareAttacked(board, { row, col: col + 1 }, opponent) &&
              !isSquareAttacked(board, { row, col: col + 2 }, opponent)) {
              moves.push({ from, to: { row, col: col + 2 }, isCastling: 'king' });
            }
          }
          if (rights.queenSide) {
            if (!board[row][col - 1] && !board[row][col - 2] && !board[row][col - 3] &&
              !isSquareAttacked(board, { row, col: col - 1 }, opponent) &&
              !isSquareAttacked(board, { row, col: col - 2 }, opponent)) {
              moves.push({ from, to: { row, col: col - 2 }, isCastling: 'queen' });
            }
          }
        }
      }
      break;
  }

  return moves.filter(m => !wouldLeaveKingInCheck(board, m, color));
}

export function applyMove(board, move) {
  const previousState = JSON.parse(JSON.stringify(_gameState));

  const newBoard = JSON.parse(JSON.stringify(board));
  const piece = newBoard[move.from.row][move.from.col];
  const color = piece.color;
  const opponent = color === colors.WHITE ? colors.BLACK : colors.WHITE;

  newBoard[move.to.row][move.to.col] = piece;
  newBoard[move.from.row][move.from.col] = null;

  if (move.isEnPassant) {
    const dir = color === colors.WHITE ? -1 : 1;
    newBoard[move.to.row - dir][move.to.col] = null;
  }

  if (move.isCastling) {
    const row = move.from.row;
    if (move.isCastling === 'king') {
      const rook = newBoard[row][7];
      newBoard[row][5] = rook;
      newBoard[row][7] = null;
    } else {
      const rook = newBoard[row][0];
      newBoard[row][3] = rook;
      newBoard[row][0] = null;
    }
  }

  if (piece.type === pieces.PAWN && (move.to.row === 0 || move.to.row === 7)) {
    piece.type = move.promotion || pieces.QUEEN;
  }

  const newState = {
    board: newBoard,
    turn: opponent,
    moveHistory: [..._gameState.moveHistory, { move, previousState }],
    enPassant: null,
    castlingRights: JSON.parse(JSON.stringify(_gameState.castlingRights || {}))
  };

  if (piece.type === pieces.PAWN && Math.abs(move.to.row - move.from.row) === 2) {
    newState.enPassant = {
      row: (move.from.row + move.to.row) / 2,
      col: move.from.col
    };
  }

  if (newState.castlingRights[color]) {
    if (piece.type === pieces.KING) {
      newState.castlingRights[color].kingSide = false;
      newState.castlingRights[color].queenSide = false;
    }
    if (piece.type === pieces.ROOK) {
      if (move.from.col === 0) newState.castlingRights[color].queenSide = false;
      if (move.from.col === 7) newState.castlingRights[color].kingSide = false;
    }
  }
  if (move.to.row === 0 && move.to.col === 0) newState.castlingRights[colors.BLACK].queenSide = false;
  if (move.to.row === 0 && move.to.col === 7) newState.castlingRights[colors.BLACK].kingSide = false;
  if (move.to.row === 7 && move.to.col === 0) newState.castlingRights[colors.WHITE].queenSide = false;
  if (move.to.row === 7 && move.to.col === 7) newState.castlingRights[colors.WHITE].kingSide = false;

  return newState;
}

export function isCheckmate(board, color) {
  if (!isInCheck(board, color)) return false;
  return !hasLegalMoves(board, color);
}

export function isStalemate(board, color) {
  if (isInCheck(board, color)) return false;
  return !hasLegalMoves(board, color);
}

function hasLegalMoves(board, color) {
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.color === color) {
        if (getLegalMoves(board, { row: r, col: c }).length > 0) return true;
      }
    }
  }
  return false;
}

export function isInCheck(board, color) {
  let kingPos = null;
  for (let r = 0; r < 8; r++) {
    for (let c = 0; c < 8; c++) {
      const piece = board[r][c];
      if (piece && piece.type === pieces.KING && piece.color === color) {
        kingPos = { row: r, col: c };
        break;
      }
    }
    if (kingPos) break;
  }
  if (!kingPos) return false;
  return isSquareAttacked(board, kingPos, color === colors.WHITE ? colors.BLACK : colors.WHITE);
}

export function undoLastMove() {
  if (_gameState.moveHistory.length === 0) return null;

  const lastMoveEntry = _gameState.moveHistory.pop();
  setGameState(lastMoveEntry.previousState);

  return _gameState.board;
}

export function newGame() {
  setGameState({
    board: initializeBoard(),
    turn: colors.WHITE,
    enPassant: null,
    moveHistory: [],
    castlingRights: {
      [colors.WHITE]: { kingSide: true, queenSide: true },
      [colors.BLACK]: { kingSide: true, queenSide: true }
    }

    
  });


  return _gameState;
}
