switch (
  e.code // Use e.code instead of e.key
) {
  case "ArrowLeft":
  case "Numpad4":
    e.preventDefault();
    newFocusedPiece = pieces.find(
      (p) =>
        p.currentRow === currentPiece.currentRow &&
        p.currentCol === currentPiece.currentCol - 1
    );
    // Use e.shiftKey directly from the event
    if (e.shiftKey && !keyboardDragMode && newFocusedPiece) {
      shouldStartDrag = true;
    }
    break;

  case "ArrowRight":
  case "Numpad6":
    e.preventDefault();
    newFocusedPiece = pieces.find(
      (p) =>
        p.currentRow === currentPiece.currentRow &&
        p.currentCol === currentPiece.currentCol + 1
    );
    if (e.shiftKey && !keyboardDragMode && newFocusedPiece) {
      shouldStartDrag = true;
    }
    break;

  case "ArrowUp":
  case "Numpad8":
    e.preventDefault();
    newFocusedPiece = pieces.find(
      (p) =>
        p.currentRow === currentPiece.currentRow - 1 &&
        p.currentCol === currentPiece.currentCol
    );
    if (e.shiftKey && !keyboardDragMode && newFocusedPiece) {
      shouldStartDrag = true;
    }
    break;

  case "ArrowDown":
  case "Numpad2":
    e.preventDefault();
    newFocusedPiece = pieces.find(
      (p) =>
        p.currentRow === currentPiece.currentRow + 1 &&
        p.currentCol === currentPiece.currentCol
    );
    if (e.shiftKey && !keyboardDragMode && newFocusedPiece) {
      shouldStartDrag = true;
    }
    break;

  case "Numpad5":
    e.preventDefault();
    rotatePiece(focusedPiece);
    return;

  case "Space":
    e.preventDefault();
    if (focusedPiece !== null) {
      const currentPiece = pieces.find((p) => p.id === focusedPiece);
      if (currentPiece) {
        console.log(
          "Showing neighbors for piece:",
          currentPiece.id,
          "at original position:",
          currentPiece.originalRow,
          currentPiece.originalCol
        );
        const neighbors = findNeighborsInSolvedState(currentPiece);
        console.log("Found neighbors:", neighbors);
        setAnimatedNeighbors([currentPiece.id, ...neighbors]);

        setTimeout(() => {
          setAnimatedNeighbors([]);
        }, 2000);
      }
    }
    return;

  default:
    return;
}
