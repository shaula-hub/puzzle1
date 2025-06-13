// Perform horizontal shift with provided pieces array
const performHorizontalShiftWithPieces = (
  piecesArray,
  draggedPieceRef,
  row,
  fromCol,
  toCol
) => {
  const newPieces = [...piecesArray];

  if (toCol < fromCol) {
    for (let col = fromCol - 1; col >= toCol; col--) {
      const piece = newPieces.find(
        (p) => p.currentRow === row && p.currentCol === col
      );
      if (piece) {
        piece.currentCol = col + 1;
      }
    }
  } else {
    for (let col = fromCol + 1; col <= toCol; col++) {
      const piece = newPieces.find(
        (p) => p.currentRow === row && p.currentCol === col
      );
      if (piece) {
        piece.currentCol = col - 1;
      }
    }
  }

  const draggedPieceInArray = newPieces.find(
    (p) => p.id === draggedPieceRef.id
  );
  if (draggedPieceInArray) {
    draggedPieceInArray.currentCol = toCol;
  }

  // Check if puzzle is solved after move
  setTimeout(() => checkForCompletion(newPieces), 100);

  return newPieces;
};

// Perform vertical shift with provided pieces array
const performVerticalShiftWithPieces = (
  piecesArray,
  draggedPieceRef,
  col,
  fromRow,
  toRow
) => {
  const newPieces = [...piecesArray];

  if (toRow < fromRow) {
    for (let row = fromRow - 1; row >= toRow; row--) {
      const piece = newPieces.find(
        (p) => p.currentRow === row && p.currentCol === col
      );
      if (piece) {
        piece.currentRow = row + 1;
      }
    }
  } else {
    for (let row = fromRow + 1; row <= toRow; row++) {
      const piece = newPieces.find(
        (p) => p.currentRow === row && p.currentCol === col
      );
      if (piece) {
        piece.currentRow = row - 1;
      }
    }
  }

  const draggedPieceInArray = newPieces.find(
    (p) => p.id === draggedPieceRef.id
  );
  if (draggedPieceInArray) {
    draggedPieceInArray.currentRow = toRow;
  }

  // Check if puzzle is solved after move
  setTimeout(() => checkForCompletion(newPieces), 100);

  return newPieces;
};
