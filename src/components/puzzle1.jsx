import { useState, useRef, useEffect, useCallback } from "react";

let numRows = 4;
let numColumns = 4;
// const BOARD_WIDTH = 500;
// const BOARD_HEIGHT = 500;
const WORKSPACE_PADDING = 100;

const Puzzle1 = () => {
  const getResponsiveBoardSize = () => {
    const screenWidth = window.innerWidth;
    const screenHeight = window.innerHeight;

    // Mobile detection: screen width <= 768px
    if (screenWidth <= 768) {
      const availableWidth = screenWidth - 40; // 20px margin on each side
      const availableHeight = screenHeight - 300; // Space for buttons, info, and padding
      const maxSize = Math.min(availableWidth, availableHeight);
      return Math.max(300, Math.min(maxSize, 500)); // Min 300px, max 500px on mobile
    }

    // Desktop: use full 800px
    return 800;
  };

  const [boardSize, setBoardSize] = useState(getResponsiveBoardSize());

  // Derived constants based on board size
  const BOARD_WIDTH = boardSize;
  const BOARD_HEIGHT = boardSize;

  const WORKSPACE_SIZE = BOARD_WIDTH + WORKSPACE_PADDING * 2;

  const [started, setStarted] = useState(false);
  const [pieces, setPieces] = useState([]);
  // const [selectedPiece, setSelectedPiece] = useState(null);
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
  // const [lastClickTime, setLastClickTime] = useState(0);
  // const [lastClickedPiece, setLastClickedPiece] = useState(null);
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

  // Multi-click detection state
  const [clickCount, setClickCount] = useState(0);
  const [clickTimer, setClickTimer] = useState(null);
  const [clickedPieceId, setClickedPieceId] = useState(null);
  const clickCountRef = useRef(0); // Use ref for immediate updates

  // Multi-space detection state
  // const [spaceCount, setSpaceCount] = useState(0);
  const [spaceTimer, setSpaceTimer] = useState(null);
  const spaceCountRef = useRef(0);
  const spacePieceIdRef = useRef(null);

  const [pendingFocusPosition, setPendingFocusPosition] = useState(null);
  // const [manualShiftPressed, setManualShiftPressed] = useState(false);
  const shiftPressedRef = useRef(false);

  const [isMobileDevice, setIsMobileDevice] = useState(false);

  const [hideGridAfterSolve, setHideGridAfterSolve] = useState(false);
  const [congratsWindowPosition, setCongratsWindowPosition] = useState({
    x: 0,
    y: 0,
  });
  const [isDraggingCongratsWindow, setIsDraggingCongratsWindow] =
    useState(false);
  const [congratsDragStartPos, setCongratsDragStartPos] = useState({
    x: 0,
    y: 0,
  });

  const [imageList, setImageList] = useState([
    { filename: "picture.jpg", displayName: "Default Picture" },
  ]);
  const BASE_URL = (() => {
    // In development environment
    if (import.meta.env.DEV) {
      return "/";
    }
    // In Telegram WebApp
    // if (window.Telegram && window.Telegram.WebApp) {
    //   return "./";
    // }
    // In production site deployment
    // return "./"; // Same as Telegram for production site
    return import.meta.env.BASE_URL;
  })();

  const [settingsData, setSettingsData] = useState({
    filename: "picture.jpg",
    rows: 4,
    columns: 4,
    rotationOn: true,
    automaticAttraction: true,
    showBoundaries: true,
    showConnections: false,
    doNotHidePicture: false, // Add this new setting
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
  const findNeighborsInSolvedState = useCallback(
    (piece) => {
      const neighbors = [];
      const { originalRow, originalCol } = piece;

      console.log(
        `Finding neighbors for piece ${piece.id} at original position (${originalRow}, ${originalCol})`
      );

      const directions = [
        { row: -1, col: 0 }, // up
        { row: 1, col: 0 }, // down
        { row: 0, col: -1 }, // left
        { row: 0, col: 1 }, // right
      ];

      directions.forEach(({ row, col }) => {
        const neighborRow = originalRow + row;
        const neighborCol = originalCol + col;

        console.log(
          `Checking direction (${row}, ${col}) -> position (${neighborRow}, ${neighborCol})`
        );

        if (
          neighborRow >= 0 &&
          neighborRow < numRows &&
          neighborCol >= 0 &&
          neighborCol < numColumns
        ) {
          const neighbor = pieces.find(
            (p) =>
              p.originalRow === neighborRow && p.originalCol === neighborCol
          );
          if (neighbor) {
            console.log(`Found neighbor: piece ${neighbor.id}`);
            neighbors.push(neighbor.id);
          } else {
            console.log(
              `No piece found at position (${neighborRow}, ${neighborCol})`
            );
          }
        } else {
          console.log(
            `Position (${neighborRow}, ${neighborCol}) is out of bounds`
          );
        }
      });

      console.log(`Total neighbors found: ${neighbors}`);
      return neighbors;
    },
    [pieces]
  );

  // Add this new function after findNeighborsInSolvedState
  const findCorrectlyPlacedPieces = useCallback(() => {
    console.log("=== FINDING CORRECTLY PLACED PIECES ===");
    const correctlyPlaced = [];

    pieces.forEach((piece) => {
      const isInCorrectPosition =
        piece.currentRow === piece.originalRow &&
        piece.currentCol === piece.originalCol;
      const hasCorrectRotation = piece.rotation === piece.solvedRotation;

      if (isInCorrectPosition && hasCorrectRotation) {
        console.log(
          `Piece ${piece.id} is correctly placed at (${piece.currentRow}, ${piece.currentCol}) with rotation ${piece.rotation}`
        );
        correctlyPlaced.push(piece.id);
      }
    });

    console.log(`Total correctly placed pieces: ${correctlyPlaced.length}`);
    return correctlyPlaced;
  }, [pieces]);

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
      // If no drag or same piece, treat as touch click
      setDraggedPiece(null);
      setIsDragging(false);

      // Handle multi-touch detection
      console.log(
        `Touch detected on piece ${piece.id}, current count: ${clickCount}`
      );

      // If touching different piece or timer expired, reset count
      if (clickedPieceId !== piece.id) {
        if (clickTimer) {
          clearTimeout(clickTimer);
        }
        setClickCount(1);
        setClickedPieceId(piece.id);
        setFocusedPiece(piece.id); // Always focus on first touch
      } else {
        // Same piece touched again
        setClickCount((prevCount) => prevCount + 1);
      }

      // Clear existing timer
      if (clickTimer) {
        clearTimeout(clickTimer);
      }

      // Set new timer to process touches after 400ms of no activity
      const timer = setTimeout(() => {
        const finalCount = clickCount + (clickedPieceId === piece.id ? 0 : 1);
        console.log(`Processing ${finalCount} touches on piece ${piece.id}`);

        if (finalCount === 1) {
          // Single touch - focus (already done above)
          console.log("Single touch - piece focused");
        } else if (finalCount === 2) {
          // Double touch - rotate
          console.log("Double touch - rotating piece");
          rotatePiece(piece.id);
        } else if (finalCount >= 3) {
          // Triple+ touch - show correctly placed pieces
          console.log("Triple+ touch - showing correctly placed pieces");
          const correctlyPlaced = findCorrectlyPlacedPieces();
          setAnimatedNeighbors(correctlyPlaced);

          setTimeout(() => {
            setAnimatedNeighbors([]);
          }, 2000);
        }

        // Reset state
        setClickCount(0);
        setClickTimer(null);
        setClickedPieceId(null);
      }, 400);

      setClickTimer(timer);
    }

    // Reset touch mode after a short delay to prevent mouse events
    setTimeout(() => {
      setIsTouchDevice(false);
    }, 300);
  };

  // Detect mobile device - simplified approach
  useEffect(() => {
    const detectMobile = () => {
      // Primary detection: screen width + touch capability
      const isSmallScreen = window.innerWidth <= 768;
      const hasTouchScreen = "ontouchstart" in window;

      // Secondary detection: user agent for mobile devices
      const userAgent = navigator.userAgent.toLowerCase();
      const mobileKeywords = [
        "mobile",
        "android",
        "iphone",
        "ipad",
        "ipod",
        "blackberry",
        "windows phone",
      ];
      const isMobileUA = mobileKeywords.some((keyword) =>
        userAgent.includes(keyword)
      );

      // Desktop user agents to exclude
      const desktopKeywords = ["windows nt", "macintosh", "linux x86_64"];
      const isDesktopUA = desktopKeywords.some((keyword) =>
        userAgent.includes(keyword)
      );

      // Final decision
      let isMobile = false;

      if (isMobileUA && !isDesktopUA) {
        isMobile = true; // Definitely mobile
      } else if (isSmallScreen && hasTouchScreen) {
        isMobile = true; // Probably mobile/tablet
      } else {
        isMobile = false; // Probably desktop
      }

      console.log("Mobile Detection Result:", {
        isSmallScreen,
        hasTouchScreen,
        isMobileUA,
        isDesktopUA,
        finalResult: isMobile,
        userAgent: navigator.userAgent,
      });

      setIsMobileDevice(isMobile);
    };

    detectMobile();

    window.addEventListener("resize", detectMobile);
    return () => window.removeEventListener("resize", detectMobile);
  }, []);

  // Load image data from json AND load images
  useEffect(() => {
    const loadImageData = async () => {
      try {
        const response = await fetch(`${BASE_URL}img-data.json`); // Add BASE_URL here
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
      bgImg.src = `${BASE_URL}background.jpg`; // Add BASE_URL here

      // Load picture image based on settings
      const picImg = new Image();
      picImg.onload = () => setPictureLoaded(true);
      picImg.onerror = () =>
        console.error(`Failed to load ${settingsData.filename}`);
      picImg.src = `${BASE_URL}img/${settingsData.filename}`; // Add BASE_URL here
    };

    loadImageData();
    loadImages();
    updateGridDimensions(); // Add this line
  }, [
    updateGridDimensions,
    settingsData.filename,
    settingsData.rows,
    settingsData.columns,
    BASE_URL,
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

  // ADD THIS NEW CONSTANT RIGHT AFTER celebrationStyles:
  const responsiveStyles = `
  @media (max-width: 768px) {
    .puzzle-container {
      padding: 10px;
    }
    
    .puzzle-info {
      font-size: 12px;
      line-height: 1.3;
    }
    
    .puzzle-buttons button {
      min-width: 60px;
      white-space: nowrap;
    }
  }
  
  @media (max-width: 480px) {
    .puzzle-info p {
      margin: 2px 0;
    }
  }
`;

  // Handle piece hover
  const handlePieceHover = (pieceId) => {
    setHoveredPiece(pieceId);
    setFocusedPiece(null);
  };

  const handlePieceLeave = () => {
    setHoveredPiece(null);
  };

  // Get piece at specific row/column
  // const getPieceAt = (row, col) => {
  //   return pieces.find(
  //     (piece) => piece.currentRow === row && piece.currentCol === col
  //   );
  // };

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
  // const updatePiecePosition = (pieceId, newRow, newCol) => {
  //   setPieces((prevPieces) =>
  //     prevPieces.map((piece) =>
  //       piece.id === pieceId
  //         ? { ...piece, currentRow: newRow, currentCol: newCol }
  //         : piece
  //     )
  //   );
  // };

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
  // Check if two pieces are neighbors in the solved puzzle
  const areNeighbors = useCallback((piece1, piece2) => {
    const rowDiff = Math.abs(piece1.originalRow - piece2.originalRow);
    const colDiff = Math.abs(piece1.originalCol - piece2.originalCol);
    console.log(
      `Checking neighbors: piece ${piece1.id} vs ${piece2.id}, rowDiff: ${rowDiff}, colDiff: ${colDiff}`
    );
    return (rowDiff === 1 && colDiff === 0) || (rowDiff === 0 && colDiff === 1);
  }, []); // Empty dependency array since this function only uses the input parameters

  // Calculate where targetPiece should be positioned relative to draggedPiece for attraction
  // const calculateAttractionPosition = useCallback(
  //   (draggedPiece, targetPiece) => {
  //     console.log("=== ATTRACTION DEBUG START ===");
  //     console.log(
  //       "Settings attraction enabled:",
  //       settingsData.automaticAttraction
  //     );
  //     console.log(
  //       "Dragged piece:",
  //       draggedPiece.id,
  //       "Target piece:",
  //       targetPiece.id
  //     );

  //     if (!areNeighbors(draggedPiece, targetPiece)) {
  //       console.log("Not neighbors - no attraction");
  //       return null;
  //     }

  //     console.log("Pieces are neighbors - calculating target's new position");

  //     // Determine original relative position (target relative to dragged in solved state)
  //     const originalRowDiff =
  //       targetPiece.originalRow - draggedPiece.originalRow;
  //     const originalColDiff =
  //       targetPiece.originalCol - draggedPiece.originalCol;
  //     console.log(
  //       "Original relative position of target from dragged (dx, dy):",
  //       originalColDiff,
  //       originalRowDiff
  //     );

  //     // Account for dragged piece rotation to determine where target piece should go
  //     const draggedRotation = draggedPiece.rotation;
  //     let finalRowOffset = 0;
  //     let finalColOffset = 0;

  //     // Apply rotation transformation to the relative position
  //     switch (draggedRotation) {
  //       case 0: // No rotation
  //         finalRowOffset = originalRowDiff;
  //         finalColOffset = originalColDiff;
  //         break;
  //       case 1: // 90° clockwise
  //         finalRowOffset = originalColDiff;
  //         finalColOffset = -originalRowDiff;
  //         break;
  //       case 2: // 180°
  //         finalRowOffset = -originalRowDiff;
  //         finalColOffset = -originalColDiff;
  //         break;
  //       case 3: // 270° clockwise
  //         finalRowOffset = -originalColDiff;
  //         finalColOffset = originalRowDiff;
  //         break;
  //     }

  //     // Calculate target's new position relative to where dragged piece will be (target's current position)
  //     const newRow = targetPiece.currentRow + finalRowOffset;
  //     const newCol = targetPiece.currentCol + finalColOffset;
  //     console.log("Target piece's new calculated position:", newRow, newCol);

  //     // Check if position is valid (on board)
  //     if (
  //       newRow < 0 ||
  //       newRow >= numRows ||
  //       newCol < 0 ||
  //       newCol >= numColumns
  //     ) {
  //       console.log("Target's new position out of bounds");
  //       return null;
  //     }

  //     // Target inherits dragged piece's rotation
  //     const newRotation = draggedPiece.rotation;
  //     console.log(
  //       "draggedPiece.rotation targetPiece.rotation New targetPiece rotation:",
  //       draggedPiece.rotation,
  //       targetPiece.rotation,
  //       newRotation
  //     );

  //     return {
  //       row: newRow,
  //       col: newCol,
  //       rotation: newRotation,
  //     };
  //   },
  //   [areNeighbors, settingsData]
  // );

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
      // setSelectedPiece(null);
      setHoveredPiece(null);
      setDraggedPiece(null);
      setKeyboardDraggedPiece(null);
      setKeyboardDragMode(false);
      setIsDragging(false);

      setFocusedPiece(pieceId);

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

  // Add this new function after the areNeighbors function
  const alignRotationWithNeighbors = useCallback(
    (droppedPiece, allPieces) => {
      console.log("=== ROTATION ALIGNMENT CHECK ===");
      console.log("Checking rotation alignment for piece:", droppedPiece.id);

      // Check 4 adjacent positions in strict sequence: up-left-right-down
      const directions = [
        { row: -1, col: 0 }, // up
        { row: 0, col: -1 }, // left
        { row: 0, col: 1 }, // right
        { row: 1, col: 0 }, // down
      ];

      for (const direction of directions) {
        const adjacentRow = droppedPiece.currentRow + direction.row;
        const adjacentCol = droppedPiece.currentCol + direction.col;

        // Check if position is valid
        if (
          adjacentRow >= 0 &&
          adjacentRow < numRows &&
          adjacentCol >= 0 &&
          adjacentCol < numColumns
        ) {
          // Find piece at adjacent position
          const adjacentPiece = allPieces.find(
            (p) => p.currentRow === adjacentRow && p.currentCol === adjacentCol
          );

          if (adjacentPiece) {
            console.log(
              `Found adjacent piece ${adjacentPiece.id} at (${adjacentRow}, ${adjacentCol})`
            );

            // Check if they are neighbors in the solved state
            if (areNeighbors(droppedPiece, adjacentPiece)) {
              console.log(
                `Pieces ${droppedPiece.id} and ${adjacentPiece.id} are neighbors in solved state`
              );
              console.log(
                `Aligning rotation: ${droppedPiece.rotation} -> ${adjacentPiece.rotation}`
              );

              // Return the new rotation for the dropped piece and stop checking
              return adjacentPiece.rotation;
            }
          }
        }
      }

      console.log("No neighboring pieces found for rotation alignment");
      return droppedPiece.rotation; // Keep current rotation if no neighbors found
    },
    [areNeighbors]
  );

  // Replace the entire handleDrop function with this simplified version:
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

      let workingPieces = [...pieces];

      // Find both pieces in the working array
      const draggedPieceInArray = workingPieces.find(
        (p) => p.id === draggedPiece.id
      );
      const targetPieceInArray = workingPieces.find(
        (p) => p.id === targetPiece.id
      );

      if (draggedPieceInArray && targetPieceInArray) {
        // Simple swap of positions
        const tempRow = draggedPieceInArray.currentRow;
        const tempCol = draggedPieceInArray.currentCol;

        draggedPieceInArray.currentRow = targetPieceInArray.currentRow;
        draggedPieceInArray.currentCol = targetPieceInArray.currentCol;

        targetPieceInArray.currentRow = tempRow;
        targetPieceInArray.currentCol = tempCol;
      }

      // Helper function to apply rotation alignment if automatic attraction is ON
      const applyRotationAlignment = (finalPieces) => {
        if (settingsData.automaticAttraction) {
          const droppedPieceAfterMove = finalPieces.find(
            (p) => p.id === draggedPiece.id
          );
          if (droppedPieceAfterMove) {
            const newRotation = alignRotationWithNeighbors(
              droppedPieceAfterMove,
              finalPieces
            );

            if (newRotation !== droppedPieceAfterMove.rotation) {
              console.log("Applying rotation alignment");
              const rotationAlignedPieces = finalPieces.map((piece) =>
                piece.id === draggedPiece.id
                  ? { ...piece, rotation: newRotation }
                  : piece
              );
              setPieces(rotationAlignedPieces);
              setTimeout(() => checkForCompletion(rotationAlignedPieces), 100);
              return;
            }
          }
        }
        // If no rotation alignment needed or attraction is off, just set pieces normally
        setPieces(finalPieces);
        setTimeout(() => checkForCompletion(finalPieces), 100);
      };

      // Apply rotation alignment after position swap
      applyRotationAlignment(workingPieces);

      setDraggedPiece(null);
      setIsDragging(false);

      // Keep focus on the dropped piece after movement completes
      setTimeout(() => {
        setFocusedPiece(draggedPiece.id);
      }, 150);
    },
    [
      draggedPiece,
      isTouchDevice,
      isLongPressing,
      pieces,
      settingsData.automaticAttraction,
      saveToHistory,
      checkForCompletion,
      alignRotationWithNeighbors,
    ]
  );

  const handlePieceClick = (pieceId) => {
    console.log(
      `Click detected on piece ${pieceId}, current count: ${clickCountRef.current}`
    );

    // If clicking different piece, reset count
    if (clickedPieceId !== pieceId) {
      if (clickTimer) {
        clearTimeout(clickTimer);
      }
      clickCountRef.current = 1;
      setClickedPieceId(pieceId);
      setFocusedPiece(pieceId); // Always focus on first click
    } else {
      // Same piece clicked again - increment immediately
      clickCountRef.current += 1;
    }

    console.log(`Updated click count: ${clickCountRef.current}`);

    // Clear existing timer
    if (clickTimer) {
      clearTimeout(clickTimer);
    }

    // Set new timer to process clicks after 400ms of no activity
    const timer = setTimeout(() => {
      const finalCount = clickCountRef.current;
      console.log(`Processing ${finalCount} clicks on piece ${pieceId}`);

      if (finalCount === 1) {
        // Single click - focus (already done above)
        console.log("Single click - piece focused");
      } else if (finalCount === 2) {
        // Double click - rotate
        console.log("Double click - rotating piece");
        rotatePiece(pieceId);
      } else if (finalCount >= 3) {
        // Triple+ click - show correctly placed pieces
        console.log("Triple+ click - showing correctly placed pieces");
        const correctlyPlaced = findCorrectlyPlacedPieces();
        setAnimatedNeighbors(correctlyPlaced);

        setTimeout(() => {
          setAnimatedNeighbors([]);
        }, 2000);
      }

      // Reset state
      clickCountRef.current = 0;
      setClickTimer(null);
      setClickedPieceId(null);
    }, 400);

    setClickTimer(timer);
  };

  // Update handlePieceMouseUp:
  const handlePieceMouseUp = (e, piece) => {
    // Clear long press timer if it exists
    if (longPressTimer) {
      clearTimeout(longPressTimer);
      setLongPressTimer(null);
    }

    if (isLongPressing) {
      setDraggedPiece(null);
      setIsDragging(false);
      return;
    }

    if (draggedPiece && draggedPiece.id !== piece.id && !isLongPressing) {
      handleDrop(e, piece);
    } else if (!isLongPressing) {
      setDraggedPiece(null);
      setIsDragging(false);
      handlePieceClick(piece.id); // This will set focus and clear previous focus
    }
  };

  // Handle congratulations window dragging
  const handleCongratsWindowMouseDown = (e) => {
    setIsDraggingCongratsWindow(true);
    setCongratsDragStartPos({
      x: e.clientX - congratsWindowPosition.x,
      y: e.clientY - congratsWindowPosition.y,
    });
  };

  const handleCongratsWindowMouseMove = useCallback(
    (e) => {
      if (isDraggingCongratsWindow) {
        setCongratsWindowPosition({
          x: e.clientX - congratsDragStartPos.x,
          y: e.clientY - congratsDragStartPos.y,
        });
      }
    },
    [congratsDragStartPos, isDraggingCongratsWindow]
  );

  const handleCongratsWindowMouseUp = () => {
    setIsDraggingCongratsWindow(false);
  };

  // Add congratulations window drag listeners
  useEffect(() => {
    if (isDraggingCongratsWindow) {
      document.addEventListener("mousemove", handleCongratsWindowMouseMove);
      document.addEventListener("mouseup", handleCongratsWindowMouseUp);

      return () => {
        document.removeEventListener(
          "mousemove",
          handleCongratsWindowMouseMove
        );
        document.removeEventListener("mouseup", handleCongratsWindowMouseUp);
      };
    }
  }, [
    handleCongratsWindowMouseMove,
    isDraggingCongratsWindow,
    congratsDragStartPos,
    congratsWindowPosition,
  ]);

  // Add this useEffect to track SHIFT globally
  useEffect(() => {
    const handleGlobalKeyDown = (e) => {
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
        shiftPressedRef.current = true;
        console.log("GLOBAL: SHIFT DOWN - ref set to true");
      }
    };

    const handleGlobalKeyUp = (e) => {
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
        shiftPressedRef.current = false;
        console.log("GLOBAL: SHIFT UP - ref set to false");
      }
    };

    // Add global listeners
    document.addEventListener("keydown", handleGlobalKeyDown, true);
    document.addEventListener("keyup", handleGlobalKeyUp, true);

    return () => {
      document.removeEventListener("keydown", handleGlobalKeyDown, true);
      document.removeEventListener("keyup", handleGlobalKeyUp, true);
    };
  }, []);

  // Handle keyboard navigation and actions, with tracking SHIFT globally
  const handleKeyDown = useCallback(
    (e) => {
      console.log("Key pressed:", {
        key: e.key,
        code: e.code,
        shiftPressed: e.shiftKey,
        isShiftPressed: isShiftPressed,
        shiftPressedRef: shiftPressedRef.current,
      });

      if (!started || pieces.length === 0) return;

      // If no piece is focused, focus the first piece
      let currentFocusedPiece = focusedPiece;
      if (currentFocusedPiece === null && pieces.length > 0) {
        currentFocusedPiece = pieces[0].id;
        setFocusedPiece(currentFocusedPiece);
      }

      const currentPiece = pieces.find((p) => p.id === currentFocusedPiece);
      if (!currentPiece) return;

      let newFocusedPiece = null;
      let shouldStartDrag = false;

      switch (e.code) {
        case "ArrowLeft":
        case "Numpad4":
          e.preventDefault();
          newFocusedPiece = pieces.find(
            (p) =>
              p.currentRow === currentPiece.currentRow &&
              p.currentCol === currentPiece.currentCol - 1
          );
          if (shiftPressedRef.current && !keyboardDragMode && newFocusedPiece) {
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
          if (shiftPressedRef.current && !keyboardDragMode && newFocusedPiece) {
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
          if (shiftPressedRef.current && !keyboardDragMode && newFocusedPiece) {
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
          if (shiftPressedRef.current && !keyboardDragMode && newFocusedPiece) {
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
            const currentFocusedPiece = focusedPiece; // Capture current value
            console.log(
              `SPACE pressed on piece ${currentFocusedPiece}, current count: ${spaceCountRef.current}`
            );

            // If different piece focused, reset count
            if (spacePieceIdRef.current !== currentFocusedPiece) {
              if (spaceTimer) {
                clearTimeout(spaceTimer);
                setSpaceTimer(null);
              }
              spaceCountRef.current = 1;
              spacePieceIdRef.current = currentFocusedPiece;
              console.log("SPACE: Reset count to 1 for new piece");
            } else {
              // Same piece, increment count immediately
              spaceCountRef.current += 1;
              console.log(
                `SPACE: Incremented count to ${spaceCountRef.current}`
              );
            }

            // Clear existing timer
            if (spaceTimer) {
              clearTimeout(spaceTimer);
            }

            // Set new timer to process SPACE presses after 500ms of no activity
            const timer = setTimeout(() => {
              const finalCount = spaceCountRef.current;
              const targetPieceId = spacePieceIdRef.current;
              console.log(
                `Processing ${finalCount} SPACE presses on piece ${targetPieceId}`
              );

              if (finalCount === 1) {
                // Single SPACE - show neighbors (original behavior)
                console.log("Single SPACE - showing neighbors");
                const currentPiece = pieces.find((p) => p.id === targetPieceId);
                if (currentPiece) {
                  const neighbors = findNeighborsInSolvedState(currentPiece);
                  setAnimatedNeighbors([currentPiece.id, ...neighbors]);

                  setTimeout(() => {
                    setAnimatedNeighbors([]);
                  }, 2000);
                }
              } else if (finalCount >= 2) {
                // Double+ SPACE - show correctly placed pieces
                console.log("Double+ SPACE - showing correctly placed pieces");
                const correctlyPlaced = findCorrectlyPlacedPieces();
                setAnimatedNeighbors(correctlyPlaced);

                setTimeout(() => {
                  setAnimatedNeighbors([]);
                }, 2000);
              }

              // Reset state
              spaceCountRef.current = 0;
              spacePieceIdRef.current = null;
              setSpaceTimer(null);
              console.log("SPACE: Reset count to 0");
            }, 500);

            setSpaceTimer(timer);
          }
          return;

        default:
          return;
      }

      // Handle drag start
      if (shouldStartDrag && newFocusedPiece) {
        console.log("STARTING DRAG WITH SHIFT + NUMPAD!");
        setKeyboardDragMode(true);
        setKeyboardDraggedPiece(currentPiece);
        setDraggedPiece(currentPiece);
        setFocusedPiece(newFocusedPiece.id);
        return;
      }

      // Normal navigation OR continued navigation during keyboard drag mode
      if (newFocusedPiece && (!shiftPressedRef.current || keyboardDragMode)) {
        setFocusedPiece(newFocusedPiece.id);
        setHoveredPiece(null);
      }
    },
    [
      started,
      pieces,
      focusedPiece,
      isShiftPressed,
      keyboardDragMode,
      rotatePiece,
      findNeighborsInSolvedState,
      findCorrectlyPlacedPieces,
      spaceTimer,
    ]
  );

  // Update handleKeyUp to clear ref
  const handleKeyUp = useCallback(
    (e) => {
      if (e.code === "ShiftLeft" || e.code === "ShiftRight") {
        shiftPressedRef.current = false; // Immediate update
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

          // Reset keyboard drag state
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
    // setSelectedPiece(null);
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

  // Close window on any user action, except after dragging or when doNotHidePicture is ON
  // const closeShowPictureWindow = useCallback(() => {
  //   // Don't close if "Do not hide picture" setting is ON
  //   if (settingsData.doNotHidePicture) {
  //     return;
  //   }

  //   if (!isDraggingWindow && !justFinishedDragging) {
  //     setShowPictureWindow(false);
  //   }
  // }, [isDraggingWindow, justFinishedDragging, settingsData.doNotHidePicture]);

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

  const handlePieceMouseMove = (e) => {
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

  // Add event listeners for closing window - COMPLETELY REWRITTEN
  useEffect(() => {
    console.log("Picture window useEffect triggered:", {
      showPictureWindow,
      doNotHidePicture: settingsData.doNotHidePicture,
    });

    if (!showPictureWindow) {
      console.log("Picture window not shown, skipping event listeners");
      return;
    }

    if (settingsData.doNotHidePicture) {
      console.log("doNotHidePicture is ON - NO event listeners will be added");
      return; // Don't add ANY event listeners when setting is ON
    }

    console.log(
      "doNotHidePicture is OFF - adding event listeners for auto-close"
    );

    const handleAnyClick = (e) => {
      console.log(
        "Click event detected, checking if should close picture window"
      );

      // Check if clicking on the picture window itself
      const pictureWindow = e.target.closest(".picture-window");
      if (pictureWindow) {
        console.log("Click was on picture window itself, ignoring");
        return;
      }

      // Don't close if dragging or just finished dragging
      if (isDraggingWindow || justFinishedDragging) {
        console.log(
          "Currently dragging or just finished dragging, ignoring click"
        );
        return;
      }

      console.log("Closing picture window due to outside click");
      setShowPictureWindow(false);
    };

    const handleAnyKey = (e) => {
      console.log(
        "Key event detected, checking if should close picture window"
      );

      // Don't close if dragging or just finished dragging
      if (isDraggingWindow || justFinishedDragging) {
        console.log(
          "Currently dragging or just finished dragging, ignoring key"
        );
        return;
      }

      console.log("Closing picture window due to key press");
      setShowPictureWindow(false);
    };

    // Add event listeners after a delay
    const timer = setTimeout(() => {
      console.log("Adding event listeners for picture window auto-close");
      document.addEventListener("click", handleAnyClick, true); // Use capture phase
      document.addEventListener("keydown", handleAnyKey, true); // Use capture phase
    }, 100);

    return () => {
      console.log("Cleaning up picture window event listeners");
      clearTimeout(timer);
      document.removeEventListener("click", handleAnyClick, true);
      document.removeEventListener("keydown", handleAnyKey, true);
    };
  }, [
    showPictureWindow,
    settingsData.doNotHidePicture,
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
      // setSelectedPiece(null);
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
    setHideGridAfterSolve(true);
    setFocusedPiece(null);

    setTimeout(() => {
      setShowCongratulations(true);

      if (boardRef.current) {
        const boardRect = boardRef.current.getBoundingClientRect();

        console.log("Using Board rect:", boardRect);
        console.log("Viewport size:", window.innerWidth, window.innerHeight);

        const windowWidth = 400;
        const windowHeight = 300;

        // Calculate the center of the BOARD (not workspace)
        let centerX = boardRect.left + (boardRect.width - windowWidth) / 2;
        let centerY = boardRect.top + (boardRect.height - windowHeight) / 2;

        // Ensure the window stays fully visible in the viewport
        const margin = 20;

        // Clamp X position
        if (centerX < margin) {
          centerX = margin;
        } else if (centerX + windowWidth > window.innerWidth - margin) {
          centerX = window.innerWidth - windowWidth - margin;
        }

        // Clamp Y position
        if (centerY < margin) {
          centerY = margin;
        } else if (centerY + windowHeight > window.innerHeight - margin) {
          centerY = window.innerHeight - windowHeight - margin;
        }

        console.log("Final center position over BOARD:", {
          x: centerX,
          y: centerY,
        });

        setCongratsWindowPosition({
          x: centerX,
          y: centerY,
        });
      } else {
        // Fallback to viewport center
        setCongratsWindowPosition({
          x: (window.innerWidth - 400) / 2,
          y: (window.innerHeight - 300) / 2,
        });
      }
    }, 10000);
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
    // selectedPiece,
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

  useEffect(() => {
    if (pendingFocusPosition) {
      const pieceAtPosition = pieces.find(
        (p) =>
          p.currentRow === pendingFocusPosition.row &&
          p.currentCol === pendingFocusPosition.col
      );
      if (pieceAtPosition) {
        setFocusedPiece(pieceAtPosition.id);
      }
      setPendingFocusPosition(null);
    }
  }, [pieces, pendingFocusPosition]);

  // Cleanup timers on unmount
  useEffect(() => {
    return () => {
      if (clickTimer) {
        clearTimeout(clickTimer);
      }
      if (spaceTimer) {
        clearTimeout(spaceTimer);
      }
      // Reset refs on cleanup
      clickCountRef.current = 0;
      spaceCountRef.current = 0;
      spacePieceIdRef.current = null;
    };
  }, []); // Empty dependency array - only run on mount/unmount

  // Add event listeners for closing window - CLEAN VERSION
  useEffect(() => {
    // Only add event listeners if picture is shown AND auto-hide is enabled
    if (showPictureWindow && !settingsData.doNotHidePicture) {
      const handleAnyClick = (e) => {
        // Check if clicking on the picture window itself
        const pictureWindow = e.target.closest(".picture-window");
        if (pictureWindow) {
          return; // Don't close if clicking on the window
        }

        // Don't close if dragging
        if (isDraggingWindow || justFinishedDragging) {
          return;
        }

        // Close the window
        setShowPictureWindow(false);
      };

      const handleAnyKey = (e) => {
        // Don't close if dragging
        if (isDraggingWindow || justFinishedDragging) {
          return;
        }

        // Close the window
        setShowPictureWindow(false);
      };

      // Add event listeners after a small delay
      const timer = setTimeout(() => {
        document.addEventListener("click", handleAnyClick, true);
        document.addEventListener("keydown", handleAnyKey, true);
      }, 100);

      return () => {
        clearTimeout(timer);
        document.removeEventListener("click", handleAnyClick, true);
        document.removeEventListener("keydown", handleAnyKey, true);
      };
    }
    // If doNotHidePicture is ON, no event listeners are added
  }, [
    showPictureWindow,
    settingsData.doNotHidePicture,
    isDraggingWindow,
    justFinishedDragging,
  ]);

  // Handle window resize for responsive board sizing
  useEffect(() => {
    const handleResize = () => {
      const newSize = getResponsiveBoardSize();
      if (newSize !== boardSize) {
        setBoardSize(newSize);
        console.log(`Board size changed to: ${newSize}px`);
      }
    };

    // Throttle resize events for better performance
    let resizeTimeout;
    const throttledResize = () => {
      clearTimeout(resizeTimeout);
      resizeTimeout = setTimeout(handleResize, 150);
    };

    window.addEventListener("resize", throttledResize);
    return () => {
      window.removeEventListener("resize", throttledResize);
      clearTimeout(resizeTimeout);
    };
  }, []);

  return (
    <div
      className="flex flex-col items-center puzzle-container"
      style={{
        width: `${WORKSPACE_SIZE + 20}px`,
        maxWidth: "98vw", // Add responsive max width
        margin: "0 auto",
      }}
    >
      <div className="flex flex-col items-center">
        {/* Title */}
        <h1 className="text-3xl font-bold text-center mb-4">PUZZLE1</h1>
        {/* Buttons */}
        <div className="flex justify-center mb-4">
          <div className="flex flex-wrap justify-center gap-1 sm:gap-2 md:gap-4 px-2 puzzle-buttons">
            <button
              onClick={() => {
                initializePuzzle();
                setHideGridAfterSolve(false);
              }}
              tabIndex="-1"
              className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-1 px-2 sm:py-2 sm:px-3 md:px-4 rounded text-xs sm:text-sm md:text-base"
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
              Перемешать
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
              Показать картинку
            </button>

            <button
              onClick={() => {
                setTempSettings({ ...settingsData });
                setShowSettings(true);
              }}
              className="bg-teal-500 hover:bg-teal-700 text-white font-bold py-2 px-3 sm:px-4 rounded text-sm sm:text-base"
            >
              Настройки
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
            maxWidth: "95vw", // Add responsive constraint
            maxHeight: "95vw", // Add responsive constraint
            backgroundColor: "#f0f0f0",
          }}
        >
          {/* Background image div */}
          {backgroundLoaded && (
            <div
              className="absolute inset-0"
              style={{
                backgroundImage: `url(${BASE_URL}background.jpg)`,
                // backgroundImage: "url(/background.jpg)",
                backgroundSize: "cover",
                backgroundPosition: "center center",
                backgroundRepeat: "no-repeat",
                backgroundAttachment: "fixed",
                userSelect: "none",
                padding: "1rem",
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
              maxWidth: "calc(95vw - 200px)", // Account for workspace padding
              maxHeight: "calc(95vw - 200px)",
              top: `${WORKSPACE_PADDING}px`,
              left: `${WORKSPACE_PADDING}px`,
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
                  href={`${BASE_URL}img/${settingsData.filename}`}
                  x="0"
                  y="0"
                  width={BOARD_WIDTH}
                  height={BOARD_HEIGHT}
                  opacity="0.8"
                />
              )}

              {/* Grid lines - always show when started, rendered ABOVE images */}
              {started && !hideGridAfterSolve && (
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
                      href={`${BASE_URL}img/${settingsData.filename}`}
                      x={piece.currentCol * piece.width - piece.clipX}
                      y={piece.currentRow * piece.height - piece.clipY}
                      width={BOARD_WIDTH}
                      height={BOARD_HEIGHT}
                      clipPath={`url(#clip-${piece.id})`}
                      // opacity={
                      //   selectedPiece === piece.id
                      //     ? 0.6
                      //     : hoveredPiece === piece.id
                      //     ? 0.8
                      //     : 1
                      // }
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
                      stroke={
                        animatedNeighbors.includes(piece.id)
                          ? "#00ffff"
                          : keyboardDraggedPiece?.id === piece.id ||
                            (isDragging && draggedPiece?.id === piece.id)
                          ? "#ff00ff" // Use magenta for BOTH keyboard and regular drag
                          : focusedPiece === piece.id ||
                            hoveredPiece === piece.id
                          ? "#00ffff"
                          : "transparent"
                      }
                      fill={"transparent"}
                      strokeWidth={
                        animatedNeighbors.includes(piece.id)
                          ? "6"
                          : // : selectedPiece === piece.id
                          // ? "6"
                          hoveredPiece === piece.id
                          ? "6"
                          : keyboardDraggedPiece?.id === piece.id
                          ? "5"
                          : focusedPiece === piece.id
                          ? "6"
                          : "3"
                      }
                      strokeDasharray={
                        animatedNeighbors.includes(piece.id) ? "10,5" : "none"
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
                    {/* <text
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
                    </text> */}
                  </g>
                ))}

              {/* Show complete picture when not started */}
              {pictureLoaded && !started && (
                <image
                  href={`${BASE_URL}img/${settingsData.filename}`}
                  x="0"
                  y="0"
                  width={BOARD_WIDTH}
                  height={BOARD_HEIGHT}
                  opacity="0.8"
                />
              )}

              {/* Grid lines - render AFTER images so they appear on top */}
              {started && !hideGridAfterSolve && (
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
                  Нажмите Start для начала игры
                </p>
              </div>
            )}
          </div>
        </div>

        {/* Info display */}
        {/* {started && ( */}
        <div className="text-center mt-4">
          {isMobileDevice ? (
            // Mobile device instructions
            <div className="text-center mt-4 puzzle-info">
              <p className="font-bold text-blue-600">Touch Controls:</p>
              <p>
                • <span className="font-semibold">Tap:</span> Focus piece
              </p>
              <p>
                • <span className="font-semibold">Double-tap:</span> Rotate
                piece
              </p>
              <p>
                • <span className="font-semibold">Triple-tap:</span> Show
                correctly placed pieces
              </p>
              <p>
                • <span className="font-semibold">Long press:</span> Show
                neighbors
              </p>
              <p>
                • <span className="font-semibold">Drag:</span> Move pieces
              </p>
            </div>
          ) : (
            // Desktop/laptop instructions
            <div className="text-sm space-y-1 max-w-2xl mx-auto">
              <p className="font-bold text-blue-600">
                Управление (клавиатура и мышь)
              </p>
              <p>
                • <span className="font-semibold">Перемещение курсора:</span>{" "}
                кнопки со стрелками (2,4,6,8 на numpad) или наведение мышью
              </p>
              <p>
                • <span className="font-semibold">Перемещение кусочка:</span>{" "}
                SHIFT + стрелки (или 2,4,6,8 на numpad) или перетаскивание мышью
              </p>
              <p>
                • <span className="font-semibold">Поворот кусочка паззла:</span>{" "}
                кнопка 5 на numpad или двойной клик мыши
              </p>
              <p>
                • <span className="font-semibold">Показать соседей:</span>{" "}
                Пробел или долгий клик мыши
              </p>
              <p>
                •{" "}
                <span className="font-semibold">
                  Показать правильно стоящие кусочки:
                </span>{" "}
                Многократные нажатия на Пробел или клики мыши
              </p>
            </div>
          )}
        </div>
      </div>

      {/* Show Picture Window */}
      {showPictureWindow && pictureLoaded && (
        <div
          className="fixed bg-white border-2 border-gray-600 rounded-lg shadow-lg z-50"
          style={{
            left: `${windowPosition.x}px`,
            top: `${windowPosition.y}px`,
            width: `${Math.min(BOARD_WIDTH / 2, window.innerWidth - 40)}px`,
            height: `${Math.min(
              BOARD_HEIGHT / 2 + 30,
              window.innerHeight - 40
            )}px`,
            maxWidth: "90vw",
            maxHeight: "80vh",
          }}
          onMouseDown={(e) => e.stopPropagation()}
          onClick={(e) => e.stopPropagation()}
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
                href={`${BASE_URL}img/${settingsData.filename}`}
                x="0"
                y="0"
                width={BOARD_WIDTH}
                height={BOARD_HEIGHT}
                opacity="1"
              />

              {/* Grid lines */}
              <g
                stroke="white"
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
          <div
            className="bg-white rounded-lg p-8 text-center shadow-2xl congratulations-window max-w-md mx-4 relative cursor-move"
            style={{
              position: "fixed",
              left: `${congratsWindowPosition.x}px`,
              top: `${congratsWindowPosition.y}px`,
              transform: "none", // Override any centering transforms
            }}
            onMouseDown={handleCongratsWindowMouseDown}
          >
            {/* Drag handle indicator */}
            <div className="absolute top-2 left-1/2 transform -translate-x-1/2 w-8 h-1 bg-gray-300 rounded cursor-move"></div>

            <div className="text-6xl mb-4">🎉</div>
            <h2 className="text-3xl font-bold text-green-600 mb-4">
              Поздравляем!
            </h2>
            <p className="text-lg text-gray-700 mb-6">
              Вы собрали паззл!
              <br />
              Отлично! 🎊
            </p>
            <div className="flex space-x-4 justify-center">
              <button
                onClick={(e) => {
                  e.stopPropagation(); // Prevent drag when clicking button
                  setShowCongratulations(false);
                  setStarted(false);
                  setPieces([]);
                  setIsPuzzleSolved(false);
                  setAnimationPhase("none");
                  setHideGridAfterSolve(false); // Reset grid hiding
                  setFocusedPiece(null);
                  setGameHistory([]);
                  setHistoryIndex(-1);
                }}
                className="bg-green-500 hover:bg-green-700 text-white font-bold py-2 px-4 rounded"
              >
                Новая игра
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add the CSS styles */}
      <style>
        {celebrationStyles}
        {responsiveStyles}
      </style>

      {/* Settings Modal */}
      {showSettings && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-sm max-h-[90vh] overflow-y-auto">
            {/* <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl w-full max-w-md max-h-[90vh] overflow-y-auto"> */}
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
                  Картинка
                </h3>
                <div className="space-y-2">
                  <label className="block text-sm font-medium text-gray-700">
                    Файл
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
                      Выбрать
                    </button>
                  </div>
                </div>
              </div>
              {/* Configuration Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">
                  Конфигурация
                </h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Строк
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="10"
                      value={tempSettings.rows}
                      onChange={(e) => {
                        const newValue = parseInt(e.target.value);
                        setTempSettings({
                          ...tempSettings,
                          rows: newValue,
                          columns: newValue, // Sync columns with rows
                        });
                      }}
                      className="w-full p-2 border border-gray-300 rounded-md focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm sm:text-base"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Колонок
                    </label>
                    <input
                      type="number"
                      min="2"
                      max="10"
                      value={tempSettings.columns}
                      readOnly
                      className="w-full p-2 border border-gray-300 rounded-md bg-gray-100 text-gray-600 cursor-not-allowed text-sm sm:text-base"
                      // title="Columns automatically match the number of rows"
                    />
                  </div>
                </div>
              </div>

              {/* Difficulty Level Section */}
              <div>
                <h3 className="text-lg font-semibold mb-3 text-gray-800">
                  Упрощения
                </h3>
                <div className="space-y-3">
                  {/* Rotation */}
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-2">
                      Вращение кусочков паззла при перемешивании
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
                      Автоматический поворот кусочка при перемещении к
                      "правильному" соседу (который сверху, слева, справа или
                      внизу)
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
                  {/* <div>
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
                  </div> */}

                  {/* Show Connections */}
                  {/*<div>
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
                  </div> */}
                  {/* Do Not Hide Picture - NEW OPTION */}
                  <div>
                    <span className="block text-sm font-medium text-gray-700 mb-2">
                      Не закрывать картинку-оригинал
                    </span>
                    <div className="flex flex-col sm:flex-row gap-2">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="doNotHidePicture"
                          checked={tempSettings.doNotHidePicture === true}
                          onChange={() =>
                            setTempSettings({
                              ...tempSettings,
                              doNotHidePicture: true,
                            })
                          }
                          className="mr-2"
                        />
                        <span className="text-sm">On</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="doNotHidePicture"
                          checked={tempSettings.doNotHidePicture === false}
                          onChange={() =>
                            setTempSettings({
                              ...tempSettings,
                              doNotHidePicture: false,
                            })
                          }
                          className="mr-2"
                        />
                        <span className="text-sm">Off</span>
                      </label>
                    </div>
                    {/* <p className="text-xs text-gray-500 mt-1">
                      Не закрывать картинку-оригинал
                    </p> */}
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
                      // setSelectedPiece(null);
                      setFocusedPiece(null);
                      setGameHistory([]);
                      setHistoryIndex(-1);
                    }
                  }}
                  className="w-full sm:w-auto bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded text-sm sm:text-base"
                >
                  Применить
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
                Выберите картинку
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
                      src={`${BASE_URL}img/${image.filename}`}
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
