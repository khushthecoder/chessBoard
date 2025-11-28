
export const colors = {
    WHITE: 'white',
    BLACK: 'black',
};

export const pieces = {
    PAWN: 'pawn',
    ROOK: 'rook',
    KNIGHT: 'knight',
    BISHOP: 'bishop',
    QUEEN: 'queen',
    KING: 'king',
};
export function initializeBoard() {
    const board = [];
    for (let r = 0; r < 8; r++) {
        const row = [];
        for (let c = 0; c < 8; c++) {
            row.push(null);
        }
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
}
