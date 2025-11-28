import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, Dimensions, TouchableOpacity } from 'react-native';
import { ChessBishop, ChessKing, ChessKnight, ChessPawn, ChessRook, ChessQueen } from 'lucide-react-native';
import { initializeBoard, colors, pieces } from './chessLogic';

const { width } = Dimensions.get('window')
const BOARD_SIZE = width - 20;
const SQUARE_SIZE = BOARD_SIZE / 8;

const PieceIcon = ({ type, color }) => {
    const props = { size: SQUARE_SIZE * 0.8, color: color === colors.WHITE ? 'white' : 'black' };
    switch (type) {
        case pieces.PAWN:
            return <ChessPawn {...props} />

        case pieces.ROOK:
            return <ChessRook {...props} />

        case pieces.KNIGHT:
            return <ChessKnight {...props} />

        case pieces.BISHOP:
            return <ChessBishop {...props} />

        case pieces.QUEEN:
            return <ChessQueen {...props} />

        case pieces.KING:
            return <ChessKing {...props} />
        default:
            return null;
    }
};


export default function ChessBoard() {
    const [board, setBoard] = useState(initializeBoard());
    const [vertical, setVertical] = useState(null)
    const [horizontal, setHorizontal] = useState(null)
    const [selectedPiece, setSelectedPiece] = useState(null);

    const movePiece = (from, toRow, toCol) => {
        const piece = board[from.row][from.col];

        board[toRow][toCol] = piece;
        board[from.row][from.col] = {
            type: null,
            color: null
        };
        setBoard(board);

    };
    const handlePieceSelect = (rowIndex, colIndex) => {
        const piece = board[rowIndex][colIndex];

        if (!selectedPiece) {
            if (!piece || !piece.type) return alert("Please select a piece first")
            setSelectedPiece({
                row: rowIndex,
                col: colIndex,
                type: piece.type,
                color: piece.color
            });
            return;
        }
        if (selectedPiece.row === rowIndex && selectedPiece.col === colIndex) {
            setSelectedPiece(null);
            return;
        }
        movePiece(selectedPiece, rowIndex, colIndex);
        setSelectedPiece(null);
    };
    console.log(vertical, horizontal)



    return (
        <View style={styles.container}>
            <Text style={styles.statusText}>Black Player</Text>

            <View style={styles.board}>
                {board.map((row, rowIndex) => (
                    <View key={rowIndex} style={styles.row}>
                        {row.map((piece, colIndex) => (
                            <TouchableOpacity
                                onPress={() => {
                                    setVertical(rowIndex);
                                    setHorizontal(colIndex);
                                    handlePieceSelect(rowIndex, colIndex);
                                }}
                                key={colIndex}
                                style={[
                                    styles.square,
                                    { backgroundColor: (rowIndex + colIndex) % 2 === 0 ? '#d3971dff' : '#45584aff' },
                                    selectedPiece?.row === rowIndex && selectedPiece?.col === colIndex
                                        ? { borderWidth: 4, borderColor: 'yellow' }
                                        : null
                                ]}
                            >
                                {piece && <PieceIcon type={piece.type} color={piece.color} />}
                            </TouchableOpacity>
                        ))}
                    </View>
                ))}
            </View>
            <Text style={styles.statusText}>White Player</Text>
        </View>
    );
}

const styles = StyleSheet.create({
    square: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    row: {
        flex: 1,
        flexDirection: 'row',
    },
    board: {
        width: BOARD_SIZE,
        height: BOARD_SIZE,
        borderWidth: 2,
        borderColor: '#333',
    },
    statusText: {
        fontSize: 20,
        fontWeight: 'bold',
        margin: 10,
        alignSelf: 'center',
    },

});
