export const colors = { WHITE: 'white', BLACK: 'black' };
export const pieces = { PAWN: 'pawn', ROOK: 'rook', KNIGHT: 'knight', BISHOP: 'bishop', QUEEN: 'queen', KING: 'king' };

let _gameState = { board: [], turn: colors.WHITE, enPassant: null, moveHistory: [], castlingRights: { [colors.WHITE]: { kingSide: true, queenSide: true }, [colors.BLACK]: { kingSide: true, queenSide: true } } };
export const gameState = _gameState;
export const setGameState = s => Object.assign(_gameState, s);
export const getGameState = () => _gameState;

const clone = o => JSON.parse(JSON.stringify(o));
const getPiece = (b, r, c) => (r >= 0 && r < 8 && c >= 0 && c < 8) ? b[r][c] : null;

const initialBoard = (() => {
  const b = Array(8).fill(null).map(() => Array(8).fill(null));
  const order = [pieces.ROOK, pieces.KNIGHT, pieces.BISHOP, pieces.QUEEN, pieces.KING, pieces.BISHOP, pieces.KNIGHT, pieces.ROOK];
  for (let c = 0; c < 8; c++) {
    b[1][c] = { type: pieces.PAWN, color: colors.BLACK }; b[6][c] = { type: pieces.PAWN, color: colors.WHITE };
    b[0][c] = { type: order[c], color: colors.BLACK }; b[7][c] = { type: order[c], color: colors.WHITE };
  }
  return b;
})();

export const initializeBoard = () => clone(initialBoard);
export const newGame = () => (setGameState({ board: initializeBoard(), turn: colors.WHITE, enPassant: null, moveHistory: [], castlingRights: { [colors.WHITE]: { kingSide: true, queenSide: true }, [colors.BLACK]: { kingSide: true, queenSide: true } } }), _gameState);
newGame();

function isSquareAttacked(board, { row, col }, byColor) {
  const pawnDir = byColor === colors.WHITE ? -1 : 1;
  if ([-1, 1].some(dc => getPiece(board, row - pawnDir, col + dc)?.type === pieces.PAWN && getPiece(board, row - pawnDir, col + dc)?.color === byColor)) return true;

  const steps = [[1, 2], [1, -2], [2, 1], [2, -1], [-1, 2], [-1, -2], [-2, 1], [-2, -1]];
  if (steps.some(([dr, dc]) => getPiece(board, row + dr, col + dc)?.type === pieces.KNIGHT && getPiece(board, row + dr, col + dc)?.color === byColor)) return true;

  const dirs = [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
  if (dirs.some(([dr, dc]) => getPiece(board, row + dr, col + dc)?.type === pieces.KING && getPiece(board, row + dr, col + dc)?.color === byColor)) return true;

  return dirs.some(([dr, dc], i) => {
    const types = i < 4 ? [pieces.ROOK, pieces.QUEEN] : [pieces.BISHOP, pieces.QUEEN];
    for (let k = 1; k < 8; k++) {
      const p = getPiece(board, row + dr * k, col + dc * k);
      if (p) return p.color === byColor && types.includes(p.type);
    }
  });
}

function wouldLeaveKingInCheck(board, move, color) {
  const tmp = clone(board);
  tmp[move.to.row][move.to.col] = tmp[move.from.row][move.from.col]; tmp[move.from.row][move.from.col] = null;
  if (move.isEnPassant) tmp[move.to.row - (color === colors.WHITE ? -1 : 1)][move.to.col] = null;

  let king;
  tmp.forEach((r, ri) => r.forEach((p, ci) => { if (p?.type === pieces.KING && p?.color === color) king = { row: ri, col: ci }; }));
  return !king || isSquareAttacked(tmp, king, color === colors.WHITE ? colors.BLACK : colors.WHITE);
}

export function getLegalMoves(board, from) {
  const { row, col } = from, p = board[row][col];
  if (!p) return [];
  const moves = [], add = (r, c, s = {}) => {
    if (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r][c]?.color !== p.color) { moves.push({ from, to: { row: r, col: c }, ...s }); return !board[r][c]; }
    return false;
  };

  if (p.type === pieces.PAWN) {
    const d = p.color === colors.WHITE ? -1 : 1, start = p.color === colors.WHITE ? 6 : 1;
    if (!board[row + d]?.[col]) {
      moves.push({ from, to: { row: row + d, col } });
      if (row === start && !board[row + 2 * d]?.[col]) moves.push({ from, to: { row: row + 2 * d, col } });
    }
    [-1, 1].forEach(dc => {
      if (board[row + d]?.[col + dc]?.color && board[row + d]?.[col + dc]?.color !== p.color) moves.push({ from, to: { row: row + d, col: col + dc } });
      if (_gameState.enPassant?.row === row + d && _gameState.enPassant?.col === col + dc) moves.push({ from, to: { row: row + d, col: col + dc }, isEnPassant: true });
    });
  } else if (p.type === pieces.KNIGHT) {
    [[1, 2], [1, -2], [2, 1], [2, -1], [-1, 2], [-1, -2], [-2, 1], [-2, -1]].forEach(([dr, dc]) => add(row + dr, col + dc));
  } else if (p.type === pieces.KING) {
    [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]].forEach(([dr, dc]) => add(row + dr, col + dc));
    const rights = _gameState.castlingRights?.[p.color] || {}, opp = p.color === colors.WHITE ? colors.BLACK : colors.WHITE;
    if (rights.kingSide && !board[row][col + 1] && !board[row][col + 2] && !isSquareAttacked(board, from, opp) && !isSquareAttacked(board, { row, col: col + 1 }, opp) && !isSquareAttacked(board, { row, col: col + 2 }, opp)) moves.push({ from, to: { row, col: col + 2 }, isCastling: 'king' });
    if (rights.queenSide && !board[row][col - 1] && !board[row][col - 2] && !board[row][col - 3] && !isSquareAttacked(board, from, opp) && !isSquareAttacked(board, { row, col: col - 1 }, opp) && !isSquareAttacked(board, { row, col: col - 2 }, opp)) moves.push({ from, to: { row, col: col - 2 }, isCastling: 'queen' });
  } else {
    const dirs = p.type === pieces.BISHOP ? [[1, 1], [1, -1], [-1, 1], [-1, -1]] : p.type === pieces.ROOK ? [[1, 0], [-1, 0], [0, 1], [0, -1]] : [[1, 0], [-1, 0], [0, 1], [0, -1], [1, 1], [1, -1], [-1, 1], [-1, -1]];
    dirs.forEach(([dr, dc]) => { for (let i = 1; i < 8; i++) if (!add(row + dr * i, col + dc * i)) break; });
  }
  return moves.filter(m => !wouldLeaveKingInCheck(board, m, p.color));
}

export function applyMove(board, move) {
  const prev = clone(_gameState), nb = clone(board), p = nb[move.from.row][move.from.col], opp = p.color === colors.WHITE ? colors.BLACK : colors.WHITE;
  nb[move.to.row][move.to.col] = p; nb[move.from.row][move.from.col] = null;
  if (move.isEnPassant) nb[move.to.row - (p.color === colors.WHITE ? -1 : 1)][move.to.col] = null;
  if (move.isCastling) {
    const r = move.from.row, isK = move.isCastling === 'king';
    nb[r][isK ? 5 : 3] = nb[r][isK ? 7 : 0]; nb[r][isK ? 7 : 0] = null;
  }
  if (p.type === pieces.PAWN && (move.to.row === 0 || move.to.row === 7)) p.type = move.promotion || pieces.QUEEN;

  const ns = { board: nb, turn: opp, moveHistory: [..._gameState.moveHistory, { move, previousState: prev }], enPassant: null, castlingRights: clone(_gameState.castlingRights || {}) };
  if (p.type === pieces.PAWN && Math.abs(move.to.row - move.from.row) === 2) ns.enPassant = { row: (move.from.row + move.to.row) / 2, col: move.from.col };

  if (ns.castlingRights[p.color]) {
    if (p.type === pieces.KING) ns.castlingRights[p.color] = { kingSide: false, queenSide: false };
    if (p.type === pieces.ROOK) { if (move.from.col === 0) ns.castlingRights[p.color].queenSide = false; if (move.from.col === 7) ns.castlingRights[p.color].kingSide = false; }
  }
  if (move.to.row === 0 && move.to.col === 0) ns.castlingRights[colors.BLACK].queenSide = false;
  if (move.to.row === 0 && move.to.col === 7) ns.castlingRights[colors.BLACK].kingSide = false;
  if (move.to.row === 7 && move.to.col === 0) ns.castlingRights[colors.WHITE].queenSide = false;
  if (move.to.row === 7 && move.to.col === 7) ns.castlingRights[colors.WHITE].kingSide = false;
  return ns;
}

export const isInCheck = (board, color) => {
  let k; board.forEach((r, ri) => r.forEach((p, ci) => { if (p?.type === pieces.KING && p?.color === color) k = { row: ri, col: ci }; }));
  return k && isSquareAttacked(board, k, color === colors.WHITE ? colors.BLACK : colors.WHITE);
};
const hasLegalMoves = (board, color) => board.some((r, ri) => r.some((p, ci) => p?.color === color && getLegalMoves(board, { row: ri, col: ci }).length > 0));
export const isCheckmate = (board, color) => isInCheck(board, color) && !hasLegalMoves(board, color);
export const isStalemate = (board, color) => !isInCheck(board, color) && !hasLegalMoves(board, color);
export const undoLastMove = () => { if (!_gameState.moveHistory.length) return null; setGameState(_gameState.moveHistory.pop().previousState); return _gameState.board; };