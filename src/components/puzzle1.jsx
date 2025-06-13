import { useState, useRef, useEffect, useCallback } from "react";

let numRows = 4;
let numColumns = 4;
const BOARD_WIDTH = 500;
const BOARD_HEIGHT = 500;
const WORKSPACE_PADDING = 100;
const WORKSPACE_SIZE = BOARD_WIDTH + WORKSPACE_PADDING * 2;

const Puzzle1 = () => {
  const [started, setStarted] = useState(false);
  const [pieces, setPieces] = useState([]);
  const [selectedPiece, setSelectedPiece] = useState(null);
  const [hoveredPiece, setHoveredPiece] = useState(null);
  const [backgroundLoaded, setBackgroundLoaded] = useState(false);
  const [pictureLoaded, setPictureLoaded] = useState(false);
  const [draggedPiece, setDraggedPiece] = useState(null);
  const [dragOffset, setDragOffset] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [focusedPiece, setFocusedPiece] = useState(null);
  const [isShiftPressed, setIsShiftPressed] = useState(false);
  const [keyboardDragMode, setKeyboardDragMode] = useState(false);
  const [keyboardDraggedPiece, setKeyboardDraggedPiece] = useState(null);
  const [lastClickTime, setLastClickTime] = useState(0);
  const [lastClickedPiece, setLastClickedPiece] = useState(null);
  const [gameHistory, setGameHistory] = useState([]);
  const [historyIndex, setHistoryIndex] = useState(-1);
  const [showPictureWindow, setShowPictureWindow] = useState(false);
  const [windowPosition, setWindowPosition] = useState({ x: 100, y: 100 });
  const [isDraggingWindow, setIsDraggingWindow] = useState(false);
  const [dragStartPos, setDragStartPos] = useState({ x: 0, y: 0 });
  const [justFinishedDragging, setJustFinishedDragging] = useState(false);
  const [isPuzzleSolved, setIsPuzzleSolved] = useState(false);
  const [showCongratulations, setShowCongratulations] = useState(false);
  const [animationPhase, setAnimationPhase] = useState("none"); // 'none', 'checking', 'celebrating'
  const [showSettings, setShowSettings] = useState(false);
  const [showPictureSelector, setShowPictureSelector] = useState(false);

  const [longPressTimer, setLongPressTimer] = useState(null);
  const [animatedNeighbors, setAnimatedNeighbors] = useState([]);
  const [isLongPressing, setIsLongPressing] = useState(false);
  const [isTouchDevice, setIsTouchDevice] = useState(false);

  const [imageList, setImageList] = useState([
    { filename: "picture.jpg", displayName: "Default Picture" },
  ]);
  const [settingsData, setSettingsData] = useState({
    filename: "picture.jpg",
    rows: 4,
    columns: 4,
    rotationOn: true,
    automaticAttraction: true,
    // automaticAttraction: false,
    showBoundaries: true,
    showConnections: false,
  });
  // const [imageList, setImageList] = useState([]);
  const [tempSettings, setTempSettings] = useState({});

  const updateGridDimensions = useCallback(() => {
    numRows = settingsData.rows;
    numColumns = settingsData.columns;
  }, [settingsData]);

  const workspaceRef = useRef(null);
  const boardRef = useRef(null);

  // Helper function to find all neighbors of a piece in the solved puzzle state
  const findNeighborsInSolvedState = (piece) => {
    const neighbors = [];
    const { originalRow, originalCol } = piece;

    // Check all four directions (up, down, left, right)
    const directions = [
      { row: -1, col: 0 }, // up
      { row: 1, col: 0 }, // down
      { row: 0, col: -1 }, // left
      { row: 0, col: 1 }, // right
    ];

    directions.forEach(({ row, col }) => {
      const neighborRow = originalRow + row;
      const neighborCol = originalCol + col;

      // Check if neighbor position is within bounds
      if (
        neighborRow >= 0 &&
        neighborRow < numRows &&
        neighborCol >= 0 &&
        neighborCol < numColumns
      ) {
        const neighbor = pieces.find(
          (p) => p.originalRow === neighborRow && p.originalCol === neighborCol
        );
        if (neighbor) {
          neighbors.push(neighbor.id);
        }
      }
    });

    return neighbors;
  };

  // Handle long press start
  const handleTouchStart = (e, piece) => {
    e.preventDefault();
    setIsTouchDevice(true); // Mark that we're in touch mode

    // Clear keyboard focus when using touch
    setFocusedPiece(null);

    // Start long press timer
    const timer = setTimeout(() => {
      // Long press detected - animate neighbors
      const neighbors = findNeighborsInSolvedState(piece);
      setAnimatedNeighbors([piece.id, ...neighbors]);
      setIsLongPressing(true);

      // Clear any existing drag state since we're doing a long press
      setDraggedPiece(null);
      setIsDragging(false);

      // Clear animation after 2 seconds
      setTimeout(() => {
        setAnimatedNeighbors([]);
        setIsLongPressing(false);
        setIsTouchDevice(false); // Reset touch mode after long press
      }, 2000);
    }, 800);

    setLongPressTimer(timer);

    // Start normal drag only if not already in long press mode
    if (!isLongPressing) {
      handleDragStart(e, piece);
    }
  };

  // Handle touch end
  const handleTouchEnd = (e, piece) => {
    e.preventDefault();

    // Clear long press timer if it exists
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    // If we're in long press mode, clear drag state and exit
    if (isLongPressing) {
      setDraggedPiece(null);
      setIsDragging(false);
      return;
    }

    // Normal drop handling for non-long-press touches
    if (draggedPiece && draggedPiece.id !== piece.id) {
      handleDrop(e, piece);
    } else {
      // If no drag or same piece, treat as click
      setDraggedPiece(null);
      setIsDragging(false);
      handlePieceClickWithRotation(piece.id);
      setFocusedPiece(piece.id);
    }

    // Reset touch mode after a short delay to prevent mouse events
    setTimeout(() => {
      setIsTouchDevice(false);
    }, 300);
  };

  // Load image data from json AND load images
  useEffect(() => {
    const loadImageData = async () => {
      try {
        const response = await fetch("/img-data.json");
        const data = await response.json();
        setImageList(data.images || []);
      } catch (error) {
        console.error("Failed to load img-data.json", error);
        setImageList([
          { filename: "picture.jpg", displayName: "Default Picture" },
        ]);
      }
    };

    const loadImages = () => {
      // Load background image
      const bgImg = new Image();
      bgImg.onload = () => setBackgroundLoaded(true);
      bgImg.onerror = () => console.error("Failed to load background.jpg");
      bgImg.src = "/background.jpg";

      // Load picture image based on settings
      const picImg = new Image();
      picImg.onload = () => setPictureLoaded(true);
      picImg.onerror = () =>
        console.error(`Failed to load ${settingsData.filename}`);
      picImg.src = `/img/${settingsData.filename}`;
    };

    loadImageData();
    loadImages();
    updateGridDimensions(); // Add this line
  }, [
    updateGridDimensions,
    settingsData.filename,
    settingsData.rows,
    settingsData.columns,
  ]);

  // Initialize the puzzle pieces
  // Initialize the puzzle pieces
  const initializePuzzle = () => {
    setStarted(true);
    setIsPuzzleSolved(false);
    setShowCongratulations(false);
    setAnimationPhase("none");

    const currentRows = settingsData.rows;
    const currentColumns = settingsData.columns;
    const pieceWidth = BOARD_WIDTH / currentColumns;
    const pieceHeight = BOARD_HEIGHT / currentRows;

    const newPieces = [];

    for (let row = 0; row < currentRows; row++) {
      for (let col = 0; col < currentColumns; col++) {
        const pieceId = row * currentColumns + col;

        const piece = {
          id: pieceId,
          originalRow: row,
          originalCol: col,
          currentRow: row,
          currentCol: col,
          x: WORKSPACE_PADDING + col * pieceWidth,
          y: WORKSPACE_PADDING + row * pieceHeight,
          width: pieceWidth,
          height: pieceHeight,
          clipX: col * pieceWidth,
          clipY: row * pieceHeight,
          rotation: 0,
          solvedRotation: 0,
        };

        newPieces.push(piece);
      }
    }

    setPieces(newPieces);

    // Initialize history with starting state
    setGameHistory([JSON.parse(JSON.stringify(newPieces))]);
    setHistoryIndex(0);
  };

  // CSS animations
  const celebrationStyles = `
  @keyframes pulse {
    0%, 100% { transform: scale(1); }
    50% { transform: scale(1.05); }
  }
  
  @keyframes bounce {
    0%, 20%, 50%, 80%, 100% { transform: translateY(0); }
    40% { transform: translateY(-10px); }
    60% { transform: translateY(-5px); }
  }
  
  @keyframes rainbow {
    0% { filter: hue-rotate(0deg); }
    25% { filter: hue-rotate(90deg); }
    50% { filter: hue-rotate(180deg); }
    75% { filter: hue-rotate(270deg); }
    100% { filter: hue-rotate(360deg); }
  }

    @keyframes neighborGlow {
    0%, 100% { 
      box-shadow: 0 0 0 3px rgba(255, 215, 0, 0);
      transform: scale(1);
    }
    50% { 
      box-shadow: 0 0 0 6px rgba(255, 215, 0, 0.8);
      transform: scale(1.03);
    }
  }
  
  .celebration-animation {
    animation: pulse 0.6s ease-in-out infinite, rainbow 2s linear infinite;
  }
  
  .congratulations-window {
    animation: bounce 0.8s ease-out;
  }

  .neighbor-animation {
    animation: neighborGlow 0.6s ease-in-out infinite;
  }  
`;

  // Handle piece click - cancel previous selection and set new one
  const handlePieceClick = useCallback(
    (pieceId) => {
      // Always clear previous selection first, then set new one
      if (selectedPiece === pieceId) {
        setSelectedPiece(null); // Deselect if clicking the same piece
      } else {
        setSelectedPiece(pieceId); // Select new piece (cancels previous selection)
      }
    },
    [selectedPiece]
  );

  // Handle piece hover
  const handlePieceHover = (pieceId) => {
    setHoveredPiece(pieceId);
  };

  const handlePieceLeave = () => {
    setHoveredPiece(null);
  };

  // Get piece at specific row/column
  const getPieceAt = (row, col) => {
    return pieces.find(
      (piece) => piece.currentRow === row && piece.currentCol === col
    );
  };

  // Check for puzzle completion after any move
  const checkForCompletion = useCallback(
    (newPieces) => {
      if (!isPuzzleSolved && checkPuzzleSolved(newPieces)) {
        handlePuzzleCompletion();
      }
    },
    [isPuzzleSolved]
  );

  // Update piece position
  const updatePiecePosition = (pieceId, newRow, newCol) => {
    setPieces((prevPieces) =>
      prevPieces.map((piece) =>
        piece.id === pieceId
          ? { ...piece, currentRow: newRow, currentCol: newCol }
          : piece
      )
    );
  };

  // Handle drag start
  const handleDragStart = (e, piece) => {
    // If this is a mouse event but we're in touch mode or long pressing, ignore it
    if (!e.touches && (isTouchDevice || isLongPressing)) {
      return;
    }

    e.preventDefault();
    // Clear keyboard focus when dragging
    setFocusedPiece(null);

    setDraggedPiece(piece);
    setIsDragging(true);

    const rect = boardRef.current.getBoundingClientRect();
    const clientX = e.touches ? e.touches[0].clientX : e.clientX;
    const clientY = e.touches ? e.touches[0].clientY : e.clientY;

    setDragOffset({
      x: clientX - rect.left - piece.currentCol * piece.width,
      y: clientY - rect.top - piece.currentRow * piece.height,
    });
  };

  // Check if two pieces are neighbors in the solved puzzle
  const areNeighbors = (piece1, piece2) => {
    const rowDiff = Math.abs(piece1.originalRow - piece2.originalRow);
    const colDiff = Math.abs(piece1.originalCol - piece2.originalCol);
    console.log(
      `Checking neighbors: piece ${piece1.id} vs ${piece2.id}, rowDiff: ${rowDiff}, colDiff: ${colDiff}`
    );
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  };

  // Calculate where targetPiece should be positioned relative to draggedPiece for attraction
  const calculateAttractionPosition = useCallback(
    (draggedPiece, targetPiece) => {
      console.log("=== ATTRACTION DEBUG START ===");
      console.log(
        "Settings attraction enabled:",
        settingsData.automaticAttraction
      );
      console.log(
        "Dragged piece:",
        draggedPiece.id,
        "Target piece:",
        targetPiece.id
      );

      if (!areNeighbors(draggedPiece, targetPiece)) {
        console.log("Not neighbors - no attraction");
        return null;
      }

      console.log("Pieces are neighbors - calculating target's new position");

      // Determine original relative position (target relative to dragged in solved state)
      const originalRowDiff =
        targetPiece.originalRow - draggedPiece.originalRow;
      const originalColDiff =
        targetPiece.originalCol - draggedPiece.originalCol;
      console.log(
        "Original relative position of target from dragged (dx, dy):",
        originalColDiff,
        originalRowDiff
      );

      // Account for dragged piece rotation to determine where target piece should go
      const draggedRotation = draggedPiece.rotation;
      let finalRowOffset = 0;
      let finalColOffset = 0;

      // Apply rotation transformation to the relative position
      switch (draggedRotation) {
        case 0: // No rotation
          finalRowOffset = originalRowDiff;
          finalColOffset = originalColDiff;
          break;
        case 1: // 90° clockwise
          finalRowOffset = originalColDiff;
          finalColOffset = -originalRowDiff;
          break;
        case 2: // 180°
          finalRowOffset = -originalRowDiff;
          finalColOffset = -originalColDiff;
          break;
        case 3: // 270° clockwise
          finalRowOffset = -originalColDiff;
          finalColOffset = originalRowDiff;
          break;
      }

      // Calculate target's new position relative to where dragged piece will be (target's current position)
      const newRow = targetPiece.currentRow + finalRowOffset;
      const newCol = targetPiece.currentCol + finalColOffset;
      console.log("Target piece's new calculated position:", newRow, newCol);

      // Check if position is valid (on board)
      if (
        newRow < 0 ||
        newRow >= numRows ||
        newCol < 0 ||
        newCol >= numColumns
      ) {
        console.log("Target's new position out of bounds");
        return null;
      }

      // Target inherits dragged piece's rotation
      const newRotation = draggedPiece.rotation;
      console.log(
        "draggedPiece.rotation targetPiece.rotation New targetPiece rotation:",
        draggedPiece.rotation,
        targetPiece.rotation,
        newRotation
      );

      return {
        row: newRow,
        col: newCol,
        rotation: newRotation,
      };
    },
    [settingsData]
  );

  // Save current state to history
  const saveToHistory = useCallback(
    (currentPieces) => {
      const newHistory = gameHistory.slice(0, historyIndex + 1);
      newHistory.push(JSON.parse(JSON.stringify(currentPieces))); // Deep copy
      setGameHistory(newHistory);
      setHistoryIndex(newHistory.length - 1);
    },
    [gameHistory, historyIndex]
  );

  // Perform horizontal shift
  const performHorizontalShift = useCallback(
    (piecesArray, draggedPieceRef, row, fromCol, toCol) => {
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

      setTimeout(() => checkForCompletion(newPieces), 100);
      return newPieces;
    },
    [checkForCompletion]
  );

  const performVerticalShift = useCallback(
    (piecesArray, draggedPieceRef, col, fromRow, toRow) => {
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

      setTimeout(() => checkForCompletion(newPieces), 100);
      return newPieces;
    },
    [checkForCompletion]
  );

  // Rotate piece clockwise (0 -> 1 -> 2 -> 3 -> 0)
  const rotatePiece = useCallback(
    (pieceId) => {
      // Save current state before rotation
      saveToHistory(pieces);

      const newPieces = pieces.map((piece) =>
        piece.id === pieceId
          ? { ...piece, rotation: (piece.rotation + 1) % 4 }
          : piece
      );

      setPieces(newPieces);

      // Clear all selections after rotation
      setSelectedPiece(null);
      setHoveredPiece(null);
      setDraggedPiece(null);
      setKeyboardDraggedPiece(null);
      setKeyboardDragMode(false);
      setIsDragging(false);

      // Check if puzzle is solved
      setTimeout(() => checkForCompletion(newPieces), 100);
    },
    [
      pieces,
      checkForCompletion,
      saveToHistory,
      // handleDrop
    ]
  );

  // ============== Handle drop
  const handleDrop = useCallback(
    (e, targetPiece) => {
      // If this is a mouse event but we're in touch mode or long pressing, ignore it
      if (!e.touches && (isTouchDevice || isLongPressing)) {
        return;
      }

      console.log("=== DROP TRIGGERED ===");
      console.log("Attraction setting:", settingsData.automaticAttraction);

      if (!draggedPiece || !targetPiece || draggedPiece.id === targetPiece.id) {
        setDraggedPiece(null);
        setIsDragging(false);
        return;
      }

      saveToHistory(pieces);

      // Try automatic attraction if enabled
      if (settingsData.automaticAttraction) {
        const attractionPos = calculateAttractionPosition(
          draggedPiece,
          targetPiece
        );
        if (attractionPos) {
          console.log("Using attraction - new swap logic");

          // Find the piece currently at the target's new position
          const pieceAtTargetNewPosition = pieces.find(
            (p) =>
              p.currentRow === attractionPos.row &&
              p.currentCol === attractionPos.col
          );

          const newPieces = pieces.map((piece) => {
            if (piece.id === draggedPiece.id) {
              // Dragged piece goes to target's current position (no rotation change)
              return {
                ...piece,
                currentRow: targetPiece.currentRow,
                currentCol: targetPiece.currentCol,
              };
            } else if (piece.id === targetPiece.id) {
              // Target piece goes to calculated position with dragged piece's rotation
              return {
                ...piece,
                currentRow: attractionPos.row,
                currentCol: attractionPos.col,
                rotation: attractionPos.rotation,
              };
            } else if (
              pieceAtTargetNewPosition &&
              piece.id === pieceAtTargetNewPosition.id
            ) {
              // Piece at target's new position goes to dragged piece's original position
              return {
                ...piece,
                currentRow: draggedPiece.currentRow,
                currentCol: draggedPiece.currentCol,
              };
            }
            // All other pieces stay where they are
            return piece;
          });

          setPieces(newPieces);
          setDraggedPiece(null);
          setIsDragging(false);

          // Check if puzzle is solved after move
          setTimeout(() => checkForCompletion(newPieces), 100);
          return;
        }
      }

      // Fall back to normal drop behavior (no attraction)
      let finalDropRow = targetPiece.currentRow;
      let finalDropCol = targetPiece.currentCol;
      let workingPieces = [...pieces];

      const dragRow = draggedPiece.currentRow;
      const dragCol = draggedPiece.currentCol;

      const deltaX = finalDropCol - dragCol;
      const deltaY = finalDropRow - dragRow;

      const updatedDraggedPiece = workingPieces.find(
        (p) => p.id === draggedPiece.id
      );

      // Normal shifting logic for non-neighbor drops
      if (deltaX !== 0 && deltaY !== 0) {
        workingPieces = performHorizontalShift(
          workingPieces,
          updatedDraggedPiece,
          dragRow,
          dragCol,
          finalDropCol
        );
        setPieces(workingPieces);
        setTimeout(() => {
          const currentPieces = [...workingPieces];
          const finalPieces = performVerticalShift(
            currentPieces,
            updatedDraggedPiece,
            finalDropCol,
            dragRow,
            finalDropRow
          );
          setPieces(finalPieces);
        }, 100);
      } else if (deltaX !== 0) {
        workingPieces = performHorizontalShift(
          workingPieces,
          updatedDraggedPiece,
          dragRow,
          dragCol,
          finalDropCol
        );
        setPieces(workingPieces);
      } else if (deltaY !== 0) {
        workingPieces = performVerticalShift(
          workingPieces,
          updatedDraggedPiece,
          dragCol,
          dragRow,
          finalDropRow
        );
        setPieces(workingPieces);
      }

      setDraggedPiece(null);
      setIsDragging(false);
    },
    [
      draggedPiece,
      isTouchDevice,
      isLongPressing,
      pieces,
      settingsData.automaticAttraction,
      saveToHistory,
      calculateAttractionPosition,
      performVerticalShift,
      performHorizontalShift,
      checkForCompletion,
    ]
  );

  // Handle double click detection
  const handlePieceClickWithRotation = (pieceId) => {
    const currentTime = Date.now();
    const timeDiff = currentTime - lastClickTime;

    // Double click detection (within 300ms and same piece)
    if (timeDiff < 300 && lastClickedPiece === pieceId) {
      // Double click - rotate piece and clear all selections
      rotatePiece(pieceId);
      setLastClickTime(0); // Reset to prevent triple click
      setLastClickedPiece(null);
      // Note: rotatePiece already clears selections, so no need to do it here
    } else {
      // Single click - normal selection behavior
      if (selectedPiece === pieceId) {
        setSelectedPiece(null);
      } else {
        setSelectedPiece(pieceId);
      }
      setLastClickTime(currentTime);
      setLastClickedPiece(pieceId);
    }
  };

  // Handle keyboard navigation and actions
  const handleKeyDown = useCallback(
    (e) => {
      if (!started || pieces.length === 0) return;

      // If no piece is focused, focus the first piece
      let currentFocusedPiece = focusedPiece;
      if (currentFocusedPiece === null && pieces.length > 0) {
        currentFocusedPiece = pieces[0].id;
        setFocusedPiece(currentFocusedPiece);
      }

      const currentPiece = pieces.find((p) => p.id === currentFocusedPiece);
      if (!currentPiece) return;
      // Track shift key state
      if (e.key === "Shift") {
        setIsShiftPressed(true);
        return;
      }

      // const currentPiece = pieces.find((p) => p.id === focusedPiece);
      // if (!currentPiece) return;

      let newFocusedPiece = null;
      let shouldDrop = false;
      let shouldStartDrag = false;

      switch (e.key) {
        case "ArrowLeft":
        case "4": // Numpad 4
          e.preventDefault();
          // Find piece to the left
          newFocusedPiece = pieces.find(
            (p) =>
              p.currentRow === currentPiece.currentRow &&
              p.currentCol === currentPiece.currentCol - 1
          );

          if (isShiftPressed && !keyboardDragMode && newFocusedPiece) {
            shouldStartDrag = true;
          } else if (
            selectedPiece === focusedPiece &&
            newFocusedPiece &&
            !isShiftPressed
          ) {
            shouldDrop = true;
          }
          break;

        case "ArrowRight":
        case "6": // Numpad 6
          e.preventDefault();
          newFocusedPiece = pieces.find(
            (p) =>
              p.currentRow === currentPiece.currentRow &&
              p.currentCol === currentPiece.currentCol + 1
          );

          if (isShiftPressed && !keyboardDragMode && newFocusedPiece) {
            shouldStartDrag = true;
          } else if (
            selectedPiece === focusedPiece &&
            newFocusedPiece &&
            !isShiftPressed
          ) {
            shouldDrop = true;
          }
          break;

        case "ArrowUp":
        case "8": // Numpad 8
          e.preventDefault();
          newFocusedPiece = pieces.find(
            (p) =>
              p.currentRow === currentPiece.currentRow - 1 &&
              p.currentCol === currentPiece.currentCol
          );

          if (isShiftPressed && !keyboardDragMode && newFocusedPiece) {
            shouldStartDrag = true;
          } else if (
            selectedPiece === focusedPiece &&
            newFocusedPiece &&
            !isShiftPressed
          ) {
            shouldDrop = true;
          }
          break;

        case "ArrowDown":
        case "2": // Numpad 2
          e.preventDefault();
          newFocusedPiece = pieces.find(
            (p) =>
              p.currentRow === currentPiece.currentRow + 1 &&
              p.currentCol === currentPiece.currentCol
          );

          if (isShiftPressed && !keyboardDragMode && newFocusedPiece) {
            shouldStartDrag = true;
          } else if (
            selectedPiece === focusedPiece &&
            newFocusedPiece &&
            !isShiftPressed
          ) {
            shouldDrop = true;
          }
          break;

        case "5": // Numpad 5 - Rotate focused piece
          e.preventDefault();
          rotatePiece(focusedPiece);
          return;

        case " ": // Space bar
          e.preventDefault();
          handlePieceClick(focusedPiece);
          return;

        default:
          return;
      }

      // Handle drag start
      if (shouldStartDrag && newFocusedPiece) {
        setKeyboardDragMode(true);
        setKeyboardDraggedPiece(currentPiece);
        setDraggedPiece(currentPiece);
        // Keep existing selection if piece was already selected
        // Only select if not already selected
        if (selectedPiece !== currentPiece.id) {
          setSelectedPiece(currentPiece.id);
        }
        setFocusedPiece(newFocusedPiece.id);
        return;
      }

      // Normal navigation OR continued navigation during keyboard drag mode
      if (newFocusedPiece && (!isShiftPressed || keyboardDragMode)) {
        setFocusedPiece(newFocusedPiece.id);
      }
    },
    [
      started,
      pieces,
      focusedPiece,
      selectedPiece,
      isShiftPressed,
      keyboardDragMode,
      // keyboardDraggedPiece,
      // handleDrop,
      rotatePiece,
      handlePieceClick,
    ]
  );

  // Handle shift key release
  const handleKeyUp = useCallback(
    (e) => {
      if (e.key === "Shift") {
        setIsShiftPressed(false);

        // If we were in keyboard drag mode, perform the drop
        if (keyboardDragMode && keyboardDraggedPiece) {
          const dropTargetPiece = pieces.find((p) => p.id === focusedPiece);
          if (
            dropTargetPiece &&
            keyboardDraggedPiece.id !== dropTargetPiece.id
          ) {
            handleDrop(e, dropTargetPiece);
          }

          // Reset keyboard drag state but preserve selection
          setKeyboardDragMode(false);
          setKeyboardDraggedPiece(null);
          setDraggedPiece(null);
        }
      }
    },
    [keyboardDragMode, keyboardDraggedPiece, focusedPiece, pieces, handleDrop]
  );

  // Get rotation angle in degrees
  const getRotationAngle = (rotationState) => {
    return rotationState * 90; // 0°, 90°, 180°, 270°
  };

  // Get transform origin for rotation (center of piece)
  const getTransformOrigin = (piece) => {
    const centerX = piece.currentCol * piece.width + piece.width / 2;
    const centerY = piece.currentRow * piece.height + piece.height / 2;
    return `${centerX} ${centerY}`;
  };

  // Shuffle pieces to random positions
  // Shuffle pieces to random positions
  const shufflePieces = () => {
    if (!started || pieces.length === 0) return;

    // Save current state before shuffle
    saveToHistory(pieces);

    const currentRows = settingsData.rows;
    const currentColumns = settingsData.columns;

    // Create array of all grid positions
    const positions = [];
    for (let row = 0; row < currentRows; row++) {
      for (let col = 0; col < currentColumns; col++) {
        positions.push({ row, col });
      }
    }

    // Shuffle the positions array
    for (let i = positions.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [positions[i], positions[j]] = [positions[j], positions[i]];
    }

    // Apply shuffled positions and random rotations to pieces
    const newPieces = pieces.map((piece, index) => {
      const newPosition = positions[index];
      // Only apply random rotation if rotation is enabled in settings
      const randomRotation = settingsData.rotationOn
        ? Math.floor(Math.random() * 4)
        : 0;

      return {
        ...piece,
        currentRow: newPosition.row,
        currentCol: newPosition.col,
        rotation: randomRotation,
      };
    });

    setPieces(newPieces);

    // Clear all selections after shuffle
    setSelectedPiece(null);
    setHoveredPiece(null);
    setDraggedPiece(null);
    setKeyboardDraggedPiece(null);
    setKeyboardDragMode(false);
    setIsDragging(false);

    // Reset puzzle solved state
    setIsPuzzleSolved(false);
    setShowCongratulations(false);
    setAnimationPhase("none");
  };

  // Handle window dragging
  const handleWindowMouseDown = (e) => {
    setIsDraggingWindow(true);
    setDragStartPos({
      x: e.clientX - windowPosition.x,
      y: e.clientY - windowPosition.y,
    });
  };

  const handleWindowMouseMove = useCallback(
    (e) => {
      if (isDraggingWindow) {
        setWindowPosition({
          x: e.clientX - dragStartPos.x,
          y: e.clientY - dragStartPos.y,
        });
      }
    },
    [dragStartPos, isDraggingWindow]
  );

  const handleWindowMouseUp = () => {
    setIsDraggingWindow(false);
  };

  // Close window on any user action, except after dragging
  const closeShowPictureWindow = useCallback(() => {
    if (!isDraggingWindow && !justFinishedDragging) {
      setShowPictureWindow(false);
    }
  }, [isDraggingWindow, justFinishedDragging]);

  // Add a new handler for mouse down that includes long press detection
  const handlePieceMouseDown = (e, piece) => {
    e.preventDefault();

    // Clear keyboard focus when using mouse
    setFocusedPiece(null);

    // Start long press timer
    const timer = setTimeout(() => {
      // Long press detected - animate neighbors
      const neighbors = findNeighborsInSolvedState(piece);
      setAnimatedNeighbors([piece.id, ...neighbors]);
      setIsLongPressing(true);

      // Clear any existing drag state
      setDraggedPiece(null);
      setIsDragging(false);

      // Clear animation after 2 seconds
      setTimeout(() => {
        setAnimatedNeighbors([]);
        setIsLongPressing(false);
      }, 2000);
    }, 800);

    setLongPressTimer(timer);

    // Don't start drag immediately - wait to see if it's a long press
    // Store the initial drag data but don't set isDragging yet
    const rect = boardRef.current.getBoundingClientRect();
    setDragOffset({
      x: e.clientX - rect.left - piece.currentCol * piece.width,
      y: e.clientY - rect.top - piece.currentRow * piece.height,
    });
    setDraggedPiece(piece); // Store which piece might be dragged
  };

  const handlePieceMouseUp = (e, piece) => {
    // Clear long press timer if it exists
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    // If we're in long press mode, don't do anything else
    if (isLongPressing) {
      setDraggedPiece(null);
      setIsDragging(false);
      return;
    }

    // If we have a dragged piece and moved to a different piece, handle drop
    if (draggedPiece && draggedPiece.id !== piece.id && !isLongPressing) {
      handleDrop(e, piece);
    } else if (!isLongPressing) {
      // Otherwise treat as click
      setDraggedPiece(null);
      setIsDragging(false);
      handlePieceClickWithRotation(piece.id);
      setFocusedPiece(piece.id);
    }
  };

  const handlePieceMouseMove = (e, piece) => {
    // If we have a potential drag but haven't started dragging yet
    if (draggedPiece && !isDragging && !isLongPressing && longPressTimer) {
      // Calculate distance moved
      const rect = boardRef.current.getBoundingClientRect();
      const currentX = e.clientX - rect.left;
      const currentY = e.clientY - rect.top;
      const startX =
        draggedPiece.currentCol * draggedPiece.width + dragOffset.x;
      const startY =
        draggedPiece.currentRow * draggedPiece.height + dragOffset.y;

      const distance = Math.sqrt(
        Math.pow(currentX - startX, 2) + Math.pow(currentY - startY, 2)
      );

      // If moved more than threshold, cancel long press and start drag
      if (distance > 5) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
        setIsDragging(true);
      }
    }
  };

  // Add event listeners for closing window
  useEffect(() => {
    if (showPictureWindow) {
      const handleAnyClick = (e) => {
        // Don't close if clicking on the window itself or if just finished dragging
        if (!isDraggingWindow && !justFinishedDragging) {
          closeShowPictureWindow();
        }
      };

      const handleAnyKey = (e) => {
        // Don't close if currently dragging or just finished dragging
        if (!isDraggingWindow && !justFinishedDragging) {
          closeShowPictureWindow();
        }
      };

      // Add slight delay to prevent immediate closing
      const timer = setTimeout(() => {
        document.addEventListener("click", handleAnyClick);
        document.addEventListener("keydown", handleAnyKey);
      }, 100);

      return () => {
        clearTimeout(timer);
        document.removeEventListener("click", handleAnyClick);
        document.removeEventListener("keydown", handleAnyKey);
      };
    }
  }, [
    closeShowPictureWindow,
    showPictureWindow,
    isDraggingWindow,
    justFinishedDragging,
  ]);

  // Add window drag listeners
  useEffect(() => {
    if (isDraggingWindow) {
      document.addEventListener("mousemove", handleWindowMouseMove);
      document.addEventListener("mouseup", handleWindowMouseUp);

      return () => {
        document.removeEventListener("mousemove", handleWindowMouseMove);
        document.removeEventListener("mouseup", handleWindowMouseUp);
      };
    }
  }, [handleWindowMouseMove, isDraggingWindow, dragStartPos, windowPosition]);

  // Undo last change
  const undoLastChange = () => {
    if (historyIndex > 0) {
      const previousState = gameHistory[historyIndex - 1];
      setPieces(JSON.parse(JSON.stringify(previousState))); // Deep copy
      setHistoryIndex(historyIndex - 1);

      // Clear all selections after undo
      setSelectedPiece(null);
      setHoveredPiece(null);
      setFocusedPiece(previousState[0]?.id || null);
      setDraggedPiece(null);
      setKeyboardDraggedPiece(null);
      setKeyboardDragMode(false);
      setIsDragging(false);
    }
  };

  // Check if puzzle is solved
  const checkPuzzleSolved = (currentPieces) => {
    // Check if all pieces are in their original positions with correct rotation
    for (const piece of currentPieces) {
      if (
        piece.currentRow !== piece.originalRow ||
        piece.currentCol !== piece.originalCol ||
        piece.rotation !== piece.solvedRotation
      ) {
        return false;
      }
    }
    return true;
  };

  // Handle puzzle completion
  const handlePuzzleCompletion = () => {
    setIsPuzzleSolved(true);
    setAnimationPhase("celebrating");

    // Show congratulations after a short delay
    setTimeout(() => {
      setShowCongratulations(true);
    }, 1000);
  };

  // Keyboard event listeners
  useEffect(() => {
    if (started) {
      window.addEventListener("keydown", handleKeyDown);
      window.addEventListener("keyup", handleKeyUp);
      return () => {
        window.removeEventListener("keydown", handleKeyDown);
        window.removeEventListener("keyup", handleKeyUp);
      };
    }
  }, [
    started,
    pieces,
    focusedPiece,
    selectedPiece,
    isShiftPressed,
    keyboardDragMode,
    keyboardDraggedPiece,
    handleKeyDown,
    handleKeyUp,
  ]);

  // Cleanup long press timer on unmount
  useEffect(() => {
    return () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
      }
    };
  }, [longPressTimer]);

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      if (longPressTimer) {
        clearTimeout(longPressTimer);
        setLongPressTimer(null);
      }
      if (!isLongPressing && draggedPiece && !isDragging) {
        setDraggedPiece(null);
      }
    };

    document.addEventListener("mouseup", handleGlobalMouseUp);

    return () => {
      document.removeEventListener("mouseup", handleGlobalMouseUp);
    };
  }, [longPressTimer, isLongPressing, draggedPiece, isDragging]);

  return (
    <div
      className="flex flex-col items-center"
      style={{ width: `${WORKSPACE_SIZE + 20}px`, margin: "0 auto" }}
    >
      <div className="flex flex-col items-center">
        {/* Title */}
        <h1 className="text-3xl font-bold text-center mb-4">PUZZLE1</h1>

        {/* Buttons */}
        <div className="flex justify-center mb-4">
          <div className="flex flex-wrap justify-center gap-2 sm:gap-4">
            <button
              onClick={initializePuzzle}
              tabIndex="-1"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-3 sm:px-4 rounded text-sm sm:text-base"
            >
              Start
            </button>
            <button
              onClick={shufflePieces}
              disabled={!started}
              className={`font-bold py-2 px-3 sm:px-4 rounded text-sm sm:text-base ${
                !started
                  ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                  : "bg-purple-500 hover:bg-purple-700 text-white"
              }`}
            >
              Shuffle
            </button>
            <button
              onClick={undoLastChange}
              disabled={!started || historyIndex <= 0}
              className={`font-bold py-2 px-3 sm:px-4 rounded text-sm sm:text-base ${
                !started || historyIndex <= 0
                  ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                  : "bg-orange-500 hover:bg-orange-700 text-white"
              }`}
            >
              Undo
            </button>
            <button
              onClick={() => setShowPictureWindow(true)}
              disabled={!started}
              className={`font-bold py-2 px-3 sm:px-4 rounded text-sm sm:text-base ${
                !started
                  ? "bg-gray-400 text-gray-700 cursor-not-allowed"
                  : "bg-green-500 hover:bg-green-700 text-white"
              }`}
            >
              Show Picture
            </button>

            <button
              onClick={() => {
                setTempSettings({ ...settingsData });
                setShowSettings(true);
              }}
              className="bg-teal-500 hover:bg-teal-700 text-white font-bold py-2 px-3 sm:px-4 rounded text-sm sm:text-base"
            >
              Settings
            </button>
          </div>
        </div>

        {/* External frame (workspace) */}
        <div
          ref={workspaceRef}
          className="relative border-2 border-gray-400 rounded-lg overflow-hidden"
          style={{
            width: `${WORKSPACE_SIZE}px`,
            height: `${WORKSPACE_SIZE}px`,
            backgroundColor: "#f0f0f0",
          }}
        >
          {/* Background image div */}
          {backgroundLoaded && (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: "url(/background.jpg)",
                backgroundSize: "cover",
                backgroundPosition: "center",
                opacity: 0.3, // Adjust this value
              }}
            />
          )}
          {/* Board frame */}
          <div
            ref={boardRef}
            className={`absolute shadow-lg bg-white ${
              animationPhase === "celebrating" ? "celebration-animation" : ""
            }`}
            style={{
              width: `${BOARD_WIDTH}px`,
              height: `${BOARD_HEIGHT}px`,
              top: `${WORKSPACE_PADDING}px`,
              left: `${WORKSPACE_PADDING}px`,
              // border: "5px solid navy",
              // borderRadius: "4px", // Optional: adds slight rounding to match modern look
              // overflow: "hidden", // Hide everything outside the board
            }}
          >
            {/* SVG for grid and pieces */}
            <svg
              width={BOARD_WIDTH}
              height={BOARD_HEIGHT}
              className="absolute inset-0"
              viewBox={`-5 -5 ${BOARD_WIDTH + 10} ${BOARD_HEIGHT + 10}`} // Add padding for borders
              // viewBox={`-3 -3 ${BOARD_WIDTH + 6} ${BOARD_HEIGHT + 6}`} // Add padding for borders
              style={{
                width: `${BOARD_WIDTH}px`,
                height: `${BOARD_HEIGHT}px`,
              }}
            >
              <defs>
                {/* Clip paths for each piece */}
                {pieces.map((piece) => (
                  <clipPath id={`clip-${piece.id}`} key={`clip-${piece.id}`}>
                    <rect
                      x={piece.currentCol * piece.width}
                      y={piece.currentRow * piece.height}
                      width={piece.width}
                      height={piece.height}
                    />
                  </clipPath>
                ))}
              </defs>

              {/* Show complete picture when not started */}
              {pictureLoaded && !started && (
                <image
                  href={`/img/${settingsData.filename}`}
                  x="0"
                  y="0"
                  width={BOARD_WIDTH}
                  height={BOARD_HEIGHT}
                  opacity="0.8"
                />
              )}

              {/* Grid lines - always show when started, rendered ABOVE images */}
              {started && (
                <g stroke="#FFFFFF" strokeWidth="2" fill="none">
                  {/* Vertical lines */}
                  {Array.from({ length: numColumns + 1 }, (_, i) => (
                    <line
                      key={`v-${i}`}
                      x1={i * (BOARD_WIDTH / numColumns)}
                      y1={0}
                      x2={i * (BOARD_WIDTH / numColumns)}
                      y2={BOARD_HEIGHT}
                    />
                  ))}
                  {/* Horizontal lines */}
                  {Array.from({ length: numRows + 1 }, (_, i) => (
                    <line
                      key={`h-${i}`}
                      x1={0}
                      y1={i * (BOARD_HEIGHT / numRows)}
                      x2={BOARD_WIDTH}
                      y2={i * (BOARD_HEIGHT / numRows)}
                    />
                  ))}
                </g>
              )}

              {/* Show connections between correctly positioned neighbors */}
              {started &&
                settingsData.showConnections &&
                pieces.map((piece) => {
                  const connections = [];
                  // Check right neighbor
                  const rightNeighbor = pieces.find(
                    (p) =>
                      p.originalRow === piece.originalRow &&
                      p.originalCol === piece.originalCol + 1 &&
                      p.currentRow === piece.currentRow &&
                      p.currentCol === piece.currentCol + 1
                  );
                  if (rightNeighbor) {
                    connections.push(
                      <line
                        key={`${piece.id}-right`}
                        x1={(piece.currentCol + 1) * piece.width}
                        y1={piece.currentRow * piece.height + piece.height / 2}
                        x2={(piece.currentCol + 1) * piece.width}
                        y2={
                          (piece.currentRow + 1) * piece.height -
                          piece.height / 2
                        }
                        stroke="green"
                        strokeWidth="4"
                      />
                    );
                  }
                  // Check bottom neighbor
                  const bottomNeighbor = pieces.find(
                    (p) =>
                      p.originalRow === piece.originalRow + 1 &&
                      p.originalCol === piece.originalCol &&
                      p.currentRow === piece.currentRow + 1 &&
                      p.currentCol === piece.currentCol
                  );
                  if (bottomNeighbor) {
                    connections.push(
                      <line
                        key={`${piece.id}-bottom`}
                        x1={piece.currentCol * piece.width + piece.width / 2}
                        y1={(piece.currentRow + 1) * piece.height}
                        x2={
                          (piece.currentCol + 1) * piece.width - piece.width / 2
                        }
                        y2={(piece.currentRow + 1) * piece.height}
                        stroke="green"
                        strokeWidth="4"
                      />
                    );
                  }
                  return connections;
                })}

              {/* Show piece boundaries */}
              {started &&
                settingsData.showBoundaries &&
                pieces.map((piece) => (
                  <rect
                    key={`boundary-${piece.id}`}
                    x={piece.currentCol * piece.width}
                    y={piece.currentRow * piece.height}
                    width={piece.width}
                    height={piece.height}
                    fill="none"
                    stroke="red"
                    strokeWidth="2"
                    strokeDasharray="5,5"
                  />
                ))}

              {/* Picture pieces */}
              {pictureLoaded &&
                started &&
                pieces.map((piece) => (
                  <g key={piece.id}>
                    {/* Piece image with rotation */}
                    <image
                      href={`/img/${settingsData.filename}`}
                      x={piece.currentCol * piece.width - piece.clipX}
                      y={piece.currentRow * piece.height - piece.clipY}
                      width={BOARD_WIDTH}
                      height={BOARD_HEIGHT}
                      clipPath={`url(#clip-${piece.id})`}
                      opacity={
                        selectedPiece === piece.id
                          ? 0.6
                          : hoveredPiece === piece.id
                          ? 0.8
                          : 1
                      }
                      style={{
                        cursor: isDragging ? "grabbing" : "grab",
                        transformOrigin: getTransformOrigin(piece),
                      }}
                      transform={`rotate(${getRotationAngle(
                        piece.rotation
                      )} ${getTransformOrigin(piece)})`}
                    />
                  </g>
                ))}

              {/* Piece overlays for interaction - rendered AFTER all images */}
              {pictureLoaded &&
                started &&
                pieces.map((piece) => (
                  <g key={`overlay-${piece.id}`}>
                    {/* Piece overlay for interaction */}
                    <rect
                      x={piece.currentCol * piece.width}
                      y={piece.currentRow * piece.height}
                      width={piece.width}
                      height={piece.height}
                      fill={
                        selectedPiece === piece.id
                          ? "rgba(0,0,0,0.4)"
                          : "transparent"
                      }
                      stroke={
                        animatedNeighbors.includes(piece.id)
                          ? "#00ffff"
                          : keyboardDraggedPiece?.id === piece.id
                          ? "#ff00ff"
                          : focusedPiece === piece.id
                          ? "#00ffff"
                          : hoveredPiece === piece.id
                          ? "#ff0000"
                          : isDragging && draggedPiece?.id === piece.id
                          ? "#00ff00"
                          : "transparent"
                      }
                      strokeWidth={
                        animatedNeighbors.includes(piece.id)
                          ? "6"
                          : selectedPiece === piece.id
                          ? "6"
                          : hoveredPiece === piece.id
                          ? "6"
                          : keyboardDraggedPiece?.id === piece.id
                          ? "5"
                          : focusedPiece === piece.id
                          ? "6"
                          : "3"
                      }
                      strokeDasharray={
                        animatedNeighbors.includes(piece.id)
                          ? "10,5"
                          : keyboardDraggedPiece?.id === piece.id
                          ? "8,4"
                          : focusedPiece === piece.id
                          ? "5,3"
                          : "none"
                      }
                      className={
                        animatedNeighbors.includes(piece.id)
                          ? "neighbor-animation"
                          : ""
                      }
                      style={{ cursor: isDragging ? "grabbing" : "grab" }}
                      // REMOVE THIS onClick handler - it's causing double execution
                      // onClick={() => {
                      //   handlePieceClickWithRotation(piece.id);
                      //   setFocusedPiece(piece.id);
                      // }}
                      onMouseEnter={() => handlePieceHover(piece.id)}
                      onMouseLeave={() => {
                        handlePieceLeave();
                        if (longPressTimer && !isDragging) {
                          clearTimeout(longPressTimer);
                          setLongPressTimer(null);
                          setDraggedPiece(null);
                        }
                      }}
                      onMouseDown={(e) => handlePieceMouseDown(e, piece)}
                      onMouseUp={(e) => handlePieceMouseUp(e, piece)}
                      onMouseMove={(e) => handlePieceMouseMove(e, piece)}
                      onTouchStart={(e) => handleTouchStart(e, piece)}
                      onTouchEnd={(e) => handleTouchEnd(e, piece)}
                      transform={`rotate(${getRotationAngle(
                        piece.rotation
                      )} ${getTransformOrigin(piece)})`}
                    />
                    {/* Piece number with rotation */}
                    <text
                      x={piece.currentCol * piece.width + piece.width / 2}
                      y={piece.currentRow * piece.height + piece.height / 2}
                      fontSize="16"
                      fill="white"
                      textAnchor="middle"
                      dominantBaseline="middle"
                      fontWeight="bold"
                      style={{
                        pointerEvents: "none",
                        textShadow: "2px 2px 4px rgba(0,0,0,0.8)",
                      }}
                      transform={`rotate(${getRotationAngle(
                        piece.rotation
                      )} ${getTransformOrigin(piece)})`}
                    >
                      {piece.id + 1}
                    </text>
                  </g>
                ))}

              {/* Show complete picture when not started */}
              {pictureLoaded && !started && (
                <image
                  href={`/img/${settingsData.filename}`}
                  x="0"
                  y="0"
                  width={BOARD_WIDTH}
                  height={BOARD_HEIGHT}
                  opacity="0.8"
                />
              )}

              {/* Grid lines - render AFTER images so they appear on top */}
              {started && (
                <g
                  stroke="white"
                  strokeWidth="2"
                  strokeDasharray="10,5"
                  fill="none"
                >
                  {/* Vertical lines */}
                  {Array.from({ length: numColumns + 1 }, (_, i) => (
                    <line
                      key={`v-${i}`}
                      x1={i * (BOARD_WIDTH / numColumns)}
                      y1={0}
                      x2={i * (BOARD_WIDTH / numColumns)}
                      y2={BOARD_HEIGHT}
                    />
                  ))}
                  {/* Horizontal lines */}
                  {Array.from({ length: numRows + 1 }, (_, i) => (
                    <line
                      key={`h-${i}`}
                      x1={0}
                      y1={i * (BOARD_HEIGHT / numRows)}
                      x2={BOARD_WIDTH}
                      y2={i * (BOARD_HEIGHT / numRows)}
                    />
                  ))}
                </g>
              )}
            </svg>

            {/* Instructions overlay */}
            {!started && (
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-30 text-white">
                <p className="text-lg font-bold text-center">
                  Click Start to begin the puzzle
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Info display */}
        {started && (
          <div className="text-center mt-4">
            <p>Click pieces to select/deselect them</p>
            <p>Double-click or press numpad 5 to rotate pieces</p>
            <p>Long press (touch) a piece to see its neighbors</p>
            <p>
              Use Arrow Keys (or numpad 2,4,6,8) to navigate, SPACE to select
            </p>
            <p>
              Hold SHIFT + Arrow Keys for drag and drop: SHIFT down = drag
              start, SHIFT up = drop
            </p>
            <p>
              Pieces: {numRows} × {numColumns} = {pieces.length}
            </p>
            {/* Rest of the existing info display */}
          </div>
        )}
      </div>

      {/* Show Picture Window */}
      {showPictureWindow && pictureLoaded && (
        <div
          className="fixed bg-white border-2 border-gray-600 rounded-lg shadow-lg z-50"
          style={{
            left: `${windowPosition.x}px`,
            top: `${windowPosition.y}px`,
            width: `${BOARD_WIDTH / 2}px`,
            height: `${BOARD_HEIGHT / 2 + 30}px`,
          }}
          onMouseDown={(e) => e.stopPropagation()} // Prevent immediate closing
          onClick={(e) => e.stopPropagation()} // Prevent closing when clicking inside window
        >
          {/* Title bar for dragging */}
          <div
            className="bg-gray-200 p-2 cursor-move border-b border-gray-400 rounded-t-lg"
            onMouseDown={handleWindowMouseDown}
          >
            <span className="font-bold text-sm">Original Picture</span>
          </div>

          {/* Picture content */}
          <div className="relative">
            <svg
              width={BOARD_WIDTH / 2}
              height={BOARD_HEIGHT / 2}
              viewBox={`0 0 ${BOARD_WIDTH} ${BOARD_HEIGHT}`}
            >
              {/* Original picture */}
              <image
                href={`/img/${settingsData.filename}`}
                x="0"
                y="0"
                width={BOARD_WIDTH}
                height={BOARD_HEIGHT}
                opacity="1"
              />

              {/* Grid lines */}
              <g
                stroke="blue"
                strokeWidth="4"
                strokeDasharray="20,10"
                fill="none"
              >
                {/* Vertical lines */}
                {Array.from({ length: numColumns + 1 }, (_, i) => (
                  <line
                    key={`v-${i}`}
                    x1={i * (BOARD_WIDTH / numColumns)}
                    y1={0}
                    x2={i * (BOARD_WIDTH / numColumns)}
                    y2={BOARD_HEIGHT}
                  />
                ))}
                {/* Horizontal lines */}
                {Array.from({ length: numRows + 1 }, (_, i) => (
                  <line
                    key={`h-${i}`}
                    x1={0}
                    y1={i * (BOARD_HEIGHT / numRows)}
                    x2={BOARD_WIDTH}
                    y2={i * (BOARD_HEIGHT / numRows)}
                  />
                ))}
              </g>
            </svg>
          </div>
        </div>
      )}

      {/* Congratulations Window */}
      {showCongratulations && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-8 text-center shadow-2xl congratulations-window max-w-md mx-4">
            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-green-600 mb-4">
              Congratulations!
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              You solved the puzzle!
              <br />
              Well done! 🎊
            </p>
            <div className="flex space-x-4 justify-center">
              {/* <button
                onClick={() => {
                  setShowCongratulations(false);
                  setIsPuzzleSolved(false);
                  setAnimationPhase("none");
                }}
                className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
              >
                Continue Playing
              </button> */}
              <button
                onClick={() => {
                  setShowCongratulations(false);
                  setStarted(false);
                  setPieces([]);
                  setIsPuzzleSolved(false);
                  setAnimationPhase("none");
                  setSelectedPiece(null);
                  setFocusedPiece(null);
                  setGameHistory([]);
                  setHistoryIndex(-1);
                }}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                New Game
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add the CSS styles */}
      <style>{celebrationStyles}</style>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto">
            {/* Header */}
            <div className="bg-gray-100 px-6 py-4 border-b rounded-t-lg">
              <h2 className="text-xl sm:text-2xl font-bold text-center">
                Settings
              </h2>
            </div>

            {/* Content */}
            <div className="p-4 sm:p-6 space-y-6">
              {/* Picture Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">
                  Picture
                </h3>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Filename
                  </label>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={tempSettings.filename || settingsData.filename}
                      readOnly
                      className="flex-1 p-2 border border-gray-300 rounded-md bg-gray-50 text-sm sm:text-base"
                    />
                    <button
                      onClick={() => setShowPictureSelector(true)}
                      className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-3 rounded text-sm"
                    >
                      Select
                    </button>
                  </div>
                </div>
              </div>
              {/* Configuration Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">
                  Configuration
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Rows
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="10"
                      value={tempSettings.rows}
                      onChange={(e) =>
                        setTempSettings({
                          ...tempSettings,
                          rows: parseInt(e.target.value),
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Columns
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="10"
                      value={tempSettings.columns}
                      onChange={(e) =>
                        setTempSettings({
                          ...tempSettings,
                          columns: parseInt(e.target.value),
                        })
                      }
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    />
                  </div>
                </div>
              </div>

              {/* Difficulty Level Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">
                  Difficulty Level
                </h3>
                <div className="space-y-3">
                  {/* Rotation */}
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-2">
                      Rotation
                    </span>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="rotation"
                          checked={tempSettings.rotationOn === true}
                          onChange={() =>
                            setTempSettings({
                              ...tempSettings,
                              rotationOn: true,
                            })
                          }
                          className="mr-2"
                        />
                        <span className="text-sm">On</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="rotation"
                          checked={tempSettings.rotationOn === false}
                          onChange={() =>
                            setTempSettings({
                              ...tempSettings,
                              rotationOn: false,
                            })
                          }
                          className="mr-2"
                        />
                        <span className="text-sm">Off</span>
                      </label>
                    </div>
                  </div>

                  {/* Automatic Attraction */}
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-2">
                      Automatic Attraction
                    </span>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="attraction"
                          checked={tempSettings.automaticAttraction === true}
                          onChange={() =>
                            setTempSettings({
                              ...tempSettings,
                              automaticAttraction: true,
                            })
                          }
                          className="mr-2"
                        />
                        <span className="text-sm">On</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="attraction"
                          checked={tempSettings.automaticAttraction === false}
                          onChange={() =>
                            setTempSettings({
                              ...tempSettings,
                              automaticAttraction: false,
                            })
                          }
                          className="mr-2"
                        />
                        <span className="text-sm">Off</span>
                      </label>
                    </div>
                  </div>

                  {/* Show Boundaries */}
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-2">
                      Show Boundaries
                    </span>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="boundaries"
                          checked={tempSettings.showBoundaries === true}
                          onChange={() =>
                            setTempSettings({
                              ...tempSettings,
                              showBoundaries: true,
                            })
                          }
                          className="mr-2"
                        />
                        <span className="text-sm">On</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="boundaries"
                          checked={tempSettings.showBoundaries === false}
                          onChange={() =>
                            setTempSettings({
                              ...tempSettings,
                              showBoundaries: false,
                            })
                          }
                          className="mr-2"
                        />
                        <span className="text-sm">Off</span>
                      </label>
                    </div>
                  </div>

                  {/* Show Connections */}
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-2">
                      Show Connections
                    </span>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="connections"
                          checked={tempSettings.showConnections === true}
                          onChange={() =>
                            setTempSettings({
                              ...tempSettings,
                              showConnections: true,
                            })
                          }
                          className="mr-2"
                        />
                        <span className="text-sm">On</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="connections"
                          checked={tempSettings.showConnections === false}
                          onChange={() =>
                            setTempSettings({
                              ...tempSettings,
                              showConnections: false,
                            })
                          }
                          className="mr-2"
                        />
                        <span className="text-sm">Off</span>
                      </label>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Footer Buttons */}
            <div className="bg-gray-50 px-4 sm:px-6 py-4 border-t rounded-b-lg">
              <div className="flex flex-col sm:flex-row gap-2 sm:gap-4 justify-end">
                <button
                  onClick={() => {
                    setTempSettings({});
                    setShowSettings(false);
                  }}
                  className="w-full sm:w-auto bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded text-sm sm:text-base"
                >
                  Cancel
                </button>
                <button
                  onClick={() => {
                    setSettingsData({ ...tempSettings });
                    updateGridDimensions();
                    setShowSettings(false);
                    // If filename OR grid dimensions changed, restart game
                    if (
                      tempSettings.filename !== settingsData.filename ||
                      tempSettings.rows !== settingsData.rows ||
                      tempSettings.columns !== settingsData.columns
                    ) {
                      setStarted(false);
                      setPieces([]);
                      setIsPuzzleSolved(false);
                      setShowCongratulations(false);
                      setAnimationPhase("none");
                      setSelectedPiece(null);
                      setFocusedPiece(null);
                      setGameHistory([]);
                      setHistoryIndex(-1);
                    }
                  }}
                  className="w-full sm:w-auto bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm sm:text-base"
                >
                  Apply
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Picture Selector Window */}
      {showPictureSelector && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-y-auto">
            <div className="bg-gray-100 px-6 py-4 border-b rounded-t-lg">
              <h2 className="text-xl font-bold text-center">
                Select the picture
              </h2>
            </div>

            <div className="p-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
                {imageList.map((image, index) => (
                  <div
                    key={index}
                    onClick={() => {
                      setTempSettings({
                        ...tempSettings,
                        filename: image.filename,
                      });
                      setShowPictureSelector(false);
                    }}
                    className={`cursor-pointer border-2 rounded-lg p-2 hover:shadow-lg transition-all ${
                      (tempSettings.filename || settingsData.filename) ===
                      image.filename
                        ? "border-blue-500 bg-blue-50"
                        : "border-gray-200 hover:border-gray-400"
                    }`}
                  >
                    <img
                      src={`/img/${image.filename}`}
                      alt={image.displayName}
                      className="w-full h-48 object-cover rounded mb-2"
                      onError={(e) => {
                        e.target.style.display = "none";
                        e.target.nextSibling.style.display = "flex";
                      }}
                    />
                    <div className="hidden w-full h-48 bg-gray-200 rounded mb-2 items-center justify-center text-gray-500">
                      No Image
                    </div>
                    <p className="text-sm text-center font-medium">
                      {image.displayName}
                    </p>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-gray-50 px-6 py-4 border-t rounded-b-lg text-center">
              <button
                onClick={() => setShowPictureSelector(false)}
                className="bg-gray-500 hover:bg-gray-700 text-white font-bold py-2 px-4 rounded"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Puzzle1;
