/*
  Power Grid Serpent (Energy Flow Snake)
  - Infinite wrapping grid
  - Renewable energy food (adds 10 MWh)
  - Inefficiency Blocks and Demand Spikes act as hazards
  - Speed increases every 5 foods captured

  Clear variable names aligned to energy theme:
  - powerFlow: snake segments array
  - renewableSource: current food
  - inefficiencyBlocks & demandSpikes: obstacle arrays
  - gridBoundary: columns/rows
*/

(() => {
  const canvas = document.getElementById('gridCanvas');
  const ctx = canvas.getContext('2d');
  const energyEl = document.getElementById('energy');
  const pauseBtn = document.getElementById('pauseBtn');
  const restartBtn = document.getElementById('restartBtn');
  const gameOverOverlay = document.getElementById('gameOverOverlay');
  const gameOverMessage = document.getElementById('gameOverMessage');
  const gameOverRestart = document.getElementById('gameOverRestart');
  // (victory overlay removed for infinite-wrapping gameplay)

  // Grid configuration (dynamic, computed per-device)
  // We'll compute these at runtime so the grid fits the available viewport/container.
  let cellSize = 40; // will be recalculated
  let cols = 12;
  let rows = 12;
  const MIN_CELL = 20; // don't make cells too small
  const MAX_CELL = 78; // allow slightly larger cells so there are fewer squares
  const MIN_COLS = 6;
  const MAX_COLS = 12;
  let gridBoundary = { cols, rows };
  let resizeTimer = null;
  const clamp = (v, min, max) => Math.max(min, Math.min(max, v));

  // Compute grid configuration based on the available width of the canvas wrapper
  function computeGridConfig() {
    const wrapEl = document.querySelector('.canvas-wrap') || document.body;
    // available rectangle: use most of the viewport but leave room for header/controls
    const wrapWidth = wrapEl.clientWidth || Math.floor(window.innerWidth * 0.92);
    const wrapHeight = Math.max(260, Math.floor(window.innerHeight * 0.82));
    const availW = Math.max(240, wrapWidth);
    const availH = Math.max(240, wrapHeight);

    // Responsive behavior:
    // - On narrow screens, keep a compact grid
    // - On larger screens, scale independently for width/height so any rectangle fills
    const MOBILE_BREAKPOINT = 720;
    const targetCell = wrapWidth < MOBILE_BREAKPOINT ? 48 : 58;

    let newCols = clamp(Math.round(availW / targetCell), MIN_COLS, MAX_COLS);
    let newRows = clamp(Math.round(availH / targetCell), MIN_COLS, MAX_COLS);

    // Compute cell size to fit the rectangle (integer pixels)
    let newCellW = Math.max(MIN_CELL, Math.min(MAX_CELL, Math.floor(availW / newCols)));
    let newCellH = Math.max(MIN_CELL, Math.min(MAX_CELL, Math.floor(availH / newRows)));
    let newCell = Math.min(newCellW, newCellH);
    // Ensure canvas fits inside both dimensions
    while ((newCell * newCols) > availW && newCols > MIN_COLS) newCols--;
    while ((newCell * newRows) > availH && newRows > MIN_COLS) newRows--;

    const changed = (newCell !== cellSize) || (newCols !== cols) || (newRows !== rows);
    cellSize = newCell;
    cols = newCols;
    rows = newRows;
    gridBoundary = { cols, rows };

    // Back to classic behavior: set canvas backing buffer to exact grid pixels
    // (width = cols * cellSize) so drawing uses straightforward integer coordinates.
    const cssWidth = cols * cellSize;
    const cssHeight = rows * cellSize;
    canvas.style.width = cssWidth + 'px';
    canvas.style.height = cssHeight + 'px';
    canvas.width = cssWidth;
    canvas.height = cssHeight;
    // Reset any transforms so drawing uses CSS pixel coordinates directly
    ctx.setTransform(1, 0, 0, 1, 0, 0);

    // Update CSS variable for any styles that reference cell size
    const wrap = document.querySelector('.canvas-wrap');
    if (wrap) wrap.style.setProperty('--cell-size', `${cellSize}px`);

    return changed;
  }

  // Debounced resize handler
  function scheduleResize() {
    if (resizeTimer) clearTimeout(resizeTimer);
    resizeTimer = setTimeout(() => {
      const changed = computeGridConfig();
      if (changed) {
        // reinitialize game to avoid out-of-bounds segments
        initGame();
      } else {
        draw();
      }
    }, 120);
  }

  // Game constants
  const ENERGY_PER_FOOD = 10; // MWh per RE unit
  // Slow initial speed for easier play: increased interval by ~25% (slower)
  const INITIAL_SPEED_MS = 200; // base logic interval in ms (slower start)
  const SPEED_STEP_MS = 12; // decrease logic delay every SPEED_UP_FOOD_COUNT
  const SPEED_UP_FOOD_COUNT = 5; // every 5 foods, increase speed
  const MIN_DELAY_MS = 100; // cap: do not allow interval faster than this (ms)
  const INITIAL_SNAKE_LENGTH = 4;
  // Frame timing: higher-frequency render loop while logic updates run every N frames
  const FRAME_MS = 40; // render frame interval (ms) -> ~25 FPS
  let frameTimer = null;
  let frameCounter = 0;

  // Theme objects
  let powerFlow = []; // snake segments [{x,y}, ...] head at index 0
  let direction = { x: 1, y: 0 }; // moving right initially
  let queuedDirection = null; // buffer direction changes
  let renewableSource = null; // {x,y}

  let energyCaptured = 0; // total MWh
  let foodCaptured = 0; // number of foods taken
  let moveInterval = INITIAL_SPEED_MS;
  let moveTimer = null;
  let running = false;
  let gameOver = false;
  let highScore = Number(localStorage.getItem('highScoreEnergy')) || 0;

  // Utility: random integer in [0, n)
  const rand = n => Math.floor(Math.random() * n);

  // Initialize or reset game state
  function initGame() {
    powerFlow = [];
    const startX = Math.floor(cols / 3);
    const startY = Math.floor(rows / 2);
    for (let i = 0; i < INITIAL_SNAKE_LENGTH; i++) {
      powerFlow.push({ x: startX - i, y: startY });
    }
    direction = { x: 1, y: 0 };
    queuedDirection = null;
    energyCaptured = 0;
    foodCaptured = 0;
    moveInterval = INITIAL_SPEED_MS;
    running = false;
    gameOver = false;
    placeRenewableSource();
    updateDisplay();
    // hide DOM overlay if present
    if (gameOverOverlay) gameOverOverlay.setAttribute('aria-hidden', 'true');
    draw();
  }

  // initial compute of grid and attach resize listener
  computeGridConfig();
  // ensure layout responds to viewport changes
  window.addEventListener('resize', scheduleResize);

  // Place renewableSource (food) ensuring it doesn't collide with snake or obstacles
  function placeRenewableSource() {
    let tries = 0;
    while (tries < 1000) {
      const x = rand(cols);
      const y = rand(rows);
      if (isOccupied(x, y)) { tries++; continue; }
      renewableSource = { x, y };
      return;
    }
    // fallback: no space
    renewableSource = null;
  }

  // Create obstacles: inefficiencyBlocks and demandSpikes
  // (Obstacles removed — simplified minigame)

  // Check if a cell is occupied by snake, food, or obstacles
  function isOccupied(x, y) {
    if (renewableSource && renewableSource.x === x && renewableSource.y === y) return true;
    for (const s of powerFlow) if (s.x === x && s.y === y) return true;
    return false;
  }

  // Move snake with wrapping and collision detection
  function step() {
    if (!running || gameOver) return;
    // apply queued direction if valid
    if (queuedDirection) {
      const nd = queuedDirection;
      // prevent reversing onto itself
      if (!(nd.x === -direction.x && nd.y === -direction.y)) direction = nd;
      queuedDirection = null;
    }

      // Compute new head WITH wrapping (infinite grid)
      const head = {
        x: (powerFlow[0].x + direction.x + cols) % cols,
        y: (powerFlow[0].y + direction.y + rows) % rows
      };

      // Will we grow this tick? If we will NOT grow, the tail will be removed
      // so moving into the current tail cell is allowed. Only check collision
      // against the body segments that will remain after the move.
      const willGrow = renewableSource && head.x === renewableSource.x && head.y === renewableSource.y;
      const checkLen = willGrow ? powerFlow.length : Math.max(0, powerFlow.length - 1);
      for (let i = 0; i < checkLen; i++) {
        const seg = powerFlow[i];
        if (seg.x === head.x && seg.y === head.y) {
          endGame('Short circuit! You hit the transmission line.');
          return;
        }
      }

    // No obstacle collisions — only self-collision ends the round

    // Move: add head
    powerFlow.unshift(head);

    // Eating renewableSource?
    if (renewableSource && head.x === renewableSource.x && head.y === renewableSource.y) {
      energyCaptured += ENERGY_PER_FOOD;
      foodCaptured += 1;
      // Update high score if needed
      if (energyCaptured > highScore) {
        highScore = energyCaptured;
        try { localStorage.setItem('highScoreEnergy', String(highScore)); } catch(e) {}
      }
      updateDisplay();
      // speed up every SPEED_UP_FOOD_COUNT foods, but cap to MIN_DELAY_MS
      if (foodCaptured % SPEED_UP_FOOD_COUNT === 0) {
        moveInterval = Math.max(MIN_DELAY_MS, moveInterval - SPEED_STEP_MS);
        restartMover();
      }
      // spawn new food
      placeRenewableSource();

      // (No win condition — infinite wrapping gameplay is score-based only)
    } else {
      // normal move: remove tail
      powerFlow.pop();
    }

    // draw() is invoked by the frame loop for smoother rendering
  }

  // Frame loop: runs at FRAME_MS and calls logic (step) only every framesPerStep frames
  function frameTick() {
    if (gameOver) return;
    frameCounter++;
    // compute frames per logic tick based on desired logic interval (enforce MIN_DELAY_MS cap)
    const effectiveMoveInterval = Math.max(moveInterval, MIN_DELAY_MS);
    const framesPerStep = Math.max(1, Math.round(effectiveMoveInterval / FRAME_MS));
    if (frameCounter >= framesPerStep) {
      frameCounter = 0;
      step();
      // draw after logic update
      draw();
    } else {
      // redraw current state for smoother visuals
      draw();
    }
  }

  function endGame(reason) {
    gameOver = true;
    running = false;
    clearInterval(frameTimer);
    frameTimer = null;
    // ensure the canvas is in the final state
    draw();
    // show DOM overlay (preferred) with a concise message
    if (gameOverMessage) gameOverMessage.textContent = 'GAME OVER — ' + reason;
    if (gameOverOverlay) gameOverOverlay.setAttribute('aria-hidden', 'false');
    // attach restart handler (idempotent)
    if (gameOverRestart) {
      gameOverRestart.onclick = () => {
        if (gameOverOverlay) gameOverOverlay.setAttribute('aria-hidden', 'true');
        initGame();
        startGame();
      };
    }
  }

  // Drawing
  function draw() {
    // clear
    ctx.clearRect(0,0,canvas.width,canvas.height);
    // draw grid lines first so they sit behind food and snake
    drawGrid();
    // Do not paint an opaque background here so the underlying CSS grid lines remain visible.
    // draw renewableSource
    if (renewableSource) drawFood(renewableSource.x, renewableSource.y);

    // draw snake (powerFlow)
    for (let i = powerFlow.length - 1; i >= 0; i--) {
      const s = powerFlow[i];
      if (i === 0) {
        drawHead(s.x, s.y);
      } else {
        drawSnakeSegment(s.x, s.y, 0.75);
      }
    }
  }

  // Draw a distinct head so players can identify direction quickly
  function drawHead(x, y) {
    const px = x * cellSize; const py = y * cellSize;
    ctx.save();
    // glow effect for head
    ctx.shadowBlur = Math.max(6, Math.floor(cellSize * 0.15));
    ctx.shadowColor = 'rgba(255,220,120,0.9)';
    // brighter gradient
    const g = ctx.createLinearGradient(px, py, px+cellSize, py+cellSize);
    g.addColorStop(0, '#fff8b0');
    g.addColorStop(0.4, '#ffd24a');
    g.addColorStop(1, '#ffb84d');
    ctx.fillStyle = g;
    ctx.fillRect(px+2, py+2, cellSize-4, cellSize-4);
    // white outline for clear contrast
    ctx.lineWidth = Math.max(1, Math.floor(cellSize * 0.06));
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.strokeRect(px+2, py+2, cellSize-4, cellSize-4);
    ctx.restore();
  }

  // Draw a subtle grid using exact cellSize and cols/rows so visuals align 1:1 with logic
  function drawGrid() {
    ctx.save();
    // subtle greenish lines, thin and crisp
    ctx.strokeStyle = 'rgba(106,214,92,0.12)';
    ctx.lineWidth = Math.max(1, Math.floor(cellSize * 0.03));
    ctx.beginPath();
    // vertical lines
    for (let x = 0; x <= cols; x++) {
      const px = x * cellSize + 0.5; // half-pixel for crisp 1px lines
      ctx.moveTo(px, 0);
      ctx.lineTo(px, canvas.height);
    }
    // horizontal lines
    for (let y = 0; y <= rows; y++) {
      const py = y * cellSize + 0.5;
      ctx.moveTo(0, py);
      ctx.lineTo(canvas.width, py);
    }
    ctx.stroke();
    ctx.restore();
  }

  function drawCell(x, y, fill, label) {
    const px = x * cellSize; const py = y * cellSize;
    ctx.fillStyle = fill;
    ctx.fillRect(px+1, py+1, cellSize-2, cellSize-2);
    if (label) {
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.font = '10px Arial';
      ctx.textAlign = 'center';
      ctx.fillText(label, px + cellSize/2, py + cellSize/2 + 3);
    }
  }

  function drawFood(x, y) {
    const px = x * cellSize + cellSize/2;
    const py = y * cellSize + cellSize/2;
    ctx.beginPath();
    // Attractive smooth green circle without text
    const grad = ctx.createRadialGradient(px - cellSize*0.12, py - cellSize*0.12, cellSize*0.05, px, py, cellSize*0.4);
    grad.addColorStop(0, '#9ff69a');
    grad.addColorStop(0.4, '#45cc33');
    grad.addColorStop(1, '#2a7a1e');
    ctx.fillStyle = grad;
    ctx.arc(px, py, cellSize*0.38, 0, Math.PI*2);
    ctx.fill();
    // subtle highlight
    ctx.beginPath();
    ctx.fillStyle = 'rgba(255,255,255,0.12)';
    ctx.ellipse(px - cellSize*0.08, py - cellSize*0.12, cellSize*0.12, cellSize*0.08, -0.6, 0, Math.PI*2);
    ctx.fill();
  }

  function drawSnakeSegment(x, y, intensity=1) {
    const px = x * cellSize; const py = y * cellSize;
    // gradient segment to look like conductor
    const g = ctx.createLinearGradient(px, py, px+cellSize, py+cellSize);
    g.addColorStop(0, `rgba(255,94,58,${0.9*intensity})`);
    g.addColorStop(0.6, `rgba(243,156,18,${0.9*intensity})`);
    ctx.fillStyle = g;
    ctx.fillRect(px+2, py+2, cellSize-4, cellSize-4);
    // small inner shine
    ctx.fillStyle = `rgba(255,255,255,${0.08*intensity})`;
    ctx.fillRect(px+4, py+4, cellSize-8, cellSize-8);
  }

  // Input handling
  window.addEventListener('keydown', (e) => {
    const map = {
      ArrowUp: {x:0,y:-1}, ArrowDown:{x:0,y:1}, ArrowLeft:{x:-1,y:0}, ArrowRight:{x:1,y:0},
      w:{x:0,y:-1}, s:{x:0,y:1}, a:{x:-1,y:0}, d:{x:1,y:0}
    };
    const key = e.key.length === 1 ? e.key.toLowerCase() : e.key;
    const nd = map[key];
    if (nd) {
      e.preventDefault();
      // start the game on the first direction key press
      if (!running && !gameOver) startGame();
      queuedDirection = nd;
    }
  });

  // Touch swipe support for mobile: simple swipe detection on the canvas
  let touchStartX = null;
  let touchStartY = null;
  const SWIPE_MIN = 30; // pixels
  // Prevent touch gestures on the canvas from scrolling the page.
  canvas.addEventListener('touchstart', (ev) => {
    // preventDefault to stop page scroll/zoom gestures when touching the game
    if (ev.cancelable) ev.preventDefault();
    if (!ev.touches || !ev.touches[0]) return;
    touchStartX = ev.touches[0].clientX;
    touchStartY = ev.touches[0].clientY;
  }, {passive: false});

  canvas.addEventListener('touchmove', (ev) => {
    // cancel page scrolling while swiping on the game area
    if (ev.cancelable) ev.preventDefault();
  }, {passive: false});

  canvas.addEventListener('touchend', (ev) => {
    if (ev.cancelable) ev.preventDefault();
    if (touchStartX === null || touchStartY === null) return;
    const touch = ev.changedTouches && ev.changedTouches[0];
    if (!touch) return;
    const dx = touch.clientX - touchStartX;
    const dy = touch.clientY - touchStartY;
    if (Math.abs(dx) < SWIPE_MIN && Math.abs(dy) < SWIPE_MIN) {
      // tap — optionally start game
      if (!running && !gameOver) startGame();
    } else {
      let nd = null;
      if (Math.abs(dx) > Math.abs(dy)) {
        nd = dx > 0 ? {x:1,y:0} : {x:-1,y:0};
      } else {
        nd = dy > 0 ? {x:0,y:1} : {x:0,y:-1};
      }
      if (nd) {
        // start game if not already
        if (!running && !gameOver) startGame();
        queuedDirection = nd;
      }
    }
    touchStartX = null; touchStartY = null;
  }, {passive: false});

  // Buttons
  // Start button removed (game now begins on first key press or when Restart is used)
  if (pauseBtn) pauseBtn.addEventListener('click', () => { if (running) pauseGame(); else if (!gameOver) startGame(); });
  if (restartBtn) restartBtn.addEventListener('click', () => { initGame(); startGame(); });

  function startGame() {
    if (gameOver) return;
    running = true;
    if (!frameTimer) {
      frameCounter = 0;
      frameTimer = setInterval(frameTick, FRAME_MS);
    }
  }

  function pauseGame() {
    running = false;
    clearInterval(frameTimer);
    frameTimer = null;
  }

  function restartMover() {
    // when logic speed changes, restart the frame timer so framesPerStep is recalculated cleanly
    if (frameTimer) {
      clearInterval(frameTimer);
      frameCounter = 0;
      frameTimer = setInterval(frameTick, FRAME_MS);
    }
  }

  function updateDisplay() {
    energyEl.textContent = energyCaptured;
    const highEl = document.getElementById('highScore');
    if (highEl) highEl.textContent = highScore;
  }

  // Victory overlay removed — no win handler for infinite wrapping gameplay

  // Start
  // Update wrapper grid spacing to match cellSize (visual grid lines)
  const wrap = document.querySelector('.canvas-wrap');
  if (wrap) {
    // set CSS variable used by snake.css so both gradient layers match exactly
    wrap.style.setProperty('--cell-size', `${cellSize}px`);
  }

  initGame();

  // expose for debugging (optional)
  window.powerGridSerpent = { initGame, startGame, pauseGame };
})();
