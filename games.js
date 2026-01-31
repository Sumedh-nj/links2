// Mini arcade collection: Flappy Cell, Energy Pong, and Energy Poker
// Each game is self contained and mounts into its matching #*-game element.

function createOverlay(messageId, headline, copy) {
  const overlay = document.createElement('div');
  overlay.className = 'center-callout';
  overlay.innerHTML = `
    <div class="message" id="${messageId}">
      <h2>${headline}</h2>
      <p>${copy}</p>
    </div>
  `;
  return overlay;
}

// ====== Flappy Cell (Energy Theme) ======
window.initFlappyCell = function() {
  const mount = document.getElementById('flappycell-game');
  if (!mount) return;
  mount.innerHTML = '';

  let bestScore = Number(localStorage.getItem('flappycell_best')) || 0;

  const shell = document.createElement('div');
  shell.className = 'game-shell';
  const hud = document.createElement('div');
  hud.className = 'game-hud';
  hud.innerHTML = `
    <div class="hud-group">
      <div class="hud-pill"><span>Score</span><strong id="fc-score">0</strong></div>
      <div class="hud-pill"><span>Best</span><strong id="fc-best">${bestScore}</strong></div>
    </div>
    <div class="hud-group">
      <button class="ghost-btn" id="fc-reset">Reset</button>
    </div>
  `;

  const canvas = document.createElement('canvas');
  canvas.className = 'game-canvas flappy-canvas';
  const overlay = createOverlay('fc-msg', 'Tap to launch', 'Space or click to flap between the battery stacks.');

  shell.appendChild(hud);
  shell.appendChild(canvas);
  shell.appendChild(overlay);
  mount.appendChild(shell);

  const ctx = canvas.getContext('2d');
  const scoreEl = hud.querySelector('#fc-score');
  const bestEl = hud.querySelector('#fc-best');
  const resetBtn = hud.querySelector('#fc-reset');
  const overlayMsg = overlay.querySelector('#fc-msg');

  let state = 'ready'; // ready | play | gameover
  let score = 0;
  let frame = 0;
  let cell = { x: 86, y: canvas.height / 2, vy: 0 };
  let pipes = [];
  let gravity = 0.28;
  const baseGravity = 0.26;
  const flapForce = -6.8;
  let pipeSpeed = 1.9;
  const basePipeSpeed = 1.8;
  let pipeGap = 200;
  let lastPipeX = null;
  const minGap = 165;
  const minSpacingRatio = 0.58;

  function setMessage(title, text) {
    overlayMsg.querySelector('h2').textContent = title;
    overlayMsg.querySelector('p').textContent = text;
  }

  function updateHud() {
    scoreEl.textContent = score;
    bestEl.textContent = bestScore;
  }

  function setCanvasSize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    let targetW = 560;
    let targetH = 780;
    if (w <= 480) { targetW = 340; targetH = 520; }
    else if (w <= 900) { targetW = 440; targetH = 640; }
    targetH = Math.min(targetH, Math.floor(h * 0.78));
    canvas.width = targetW;
    canvas.height = targetH;
    cell.x = Math.min(cell.x, canvas.width * 0.26);
  }

  function spawnPipe() {
    // keep horizontal spacing reasonable to avoid unfair clusters
    const minSpacing = Math.max(220, canvas.width * minSpacingRatio);
    if (lastPipeX !== null && lastPipeX > canvas.width - minSpacing) return;
    const gap = pipeGap;
    const minHeight = 70;
    const maxTop = canvas.height - gap - minHeight;
    const top = Math.floor(Math.random() * (maxTop - minHeight + 1)) + minHeight;
    const x = canvas.width + 40;
    pipes.push({ x, width: 64, top, bottom: top + gap, passed: false });
    lastPipeX = x;
  }

  function resetGame() {
    score = 0;
    frame = 0;
    gravity = baseGravity;
    pipeSpeed = basePipeSpeed;
    pipeGap = 170;
    lastPipeX = null;
    cell = { x: Math.floor(canvas.width * 0.25), y: canvas.height / 2, vy: 0 };
    pipes = [];
    state = 'ready';
    updateHud();
    overlay.style.display = 'grid';
    setMessage('Tap to launch', 'Space or click to flap between the battery stacks.');
  }

  function startGame() {
    if (state === 'play') return;
    state = 'play';
    overlay.style.display = 'none';
    if (!pipes.length) spawnPipe();
  }

  function endGame() {
    state = 'gameover';
    overlay.style.display = 'grid';
    setMessage('Grid overload!', 'Click or press Space to try again.');
    if (score > bestScore) {
      bestScore = score;
      localStorage.setItem('flappycell_best', bestScore);
      updateHud();
    }
  }

  function flap() {
    if (state === 'ready') startGame();
    if (state === 'gameover') {
      resetGame();
      startGame();
    }
    if (state === 'play') {
      cell.vy = flapForce;
    }
  }

  function update(dt) {
    if (state !== 'play') {
      frame++;
      return;
    }
    frame++;
    const speedScale = Math.min(dt, 1.6);
    cell.vy += gravity * speedScale * 1.12;
    cell.y += cell.vy * speedScale;

    if (frame % 90 === 0) spawnPipe();

    pipes.forEach(p => { p.x -= pipeSpeed * speedScale * 1.12; });
    pipes = pipes.filter(p => p.x + p.width > -30);
    if (pipes.length) lastPipeX = pipes[pipes.length - 1].x;

    for (const p of pipes) {
      if (!p.passed && p.x + p.width < cell.x) {
        p.passed = true;
        score++;
        if (score > bestScore) {
          bestScore = score;
          localStorage.setItem('flappycell_best', bestScore);
        }
        updateHud();
        // ramp difficulty gradually
        if (pipeGap > minGap) pipeGap = Math.max(minGap, pipeGap - 1.0);
        pipeSpeed = Math.min(3.2, pipeSpeed + 0.025);
        gravity = Math.min(0.42, gravity + 0.004);
      }
      const collideX = cell.x + 14 > p.x && cell.x - 14 < p.x + p.width;
      const collideY = cell.y - 14 < p.top || cell.y + 14 > p.bottom;
      if (collideX && collideY) {
        endGame();
        return;
      }
    }

    if (cell.y + 16 > canvas.height || cell.y - 16 < 0) {
      endGame();
    }
  }

  function drawBackground() {
    // Bright, vibrant sky gradient like daytime
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    const time = frame * 0.01;
    g.addColorStop(0, `hsl(${200 + Math.sin(time) * 10}, 75%, 65%)`);
    g.addColorStop(0.5, `hsl(${180 + Math.cos(time * 0.7) * 10}, 70%, 55%)`);
    g.addColorStop(1, `hsl(${170}, 65%, 48%)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Add bright floating particles for depth
    ctx.save();
    ctx.fillStyle = 'rgba(120,255,100,0.4)';
    for (let i = 0; i < 8; i++) {
      const x = ((frame * (0.3 + i * 0.1)) % (canvas.width + 40)) - 20;
      const y = (i * canvas.height / 8) + Math.sin(frame * 0.05 + i) * 15;
      ctx.shadowColor = 'rgba(120,255,100,0.6)';
      ctx.shadowBlur = 8;
      ctx.beginPath();
      ctx.arc(x, y, 3 + i * 0.5, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = 'rgba(120,255,100,0.3)';
    ctx.lineWidth = 1.5;
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(canvas.width, y + 0.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPipe(pipe) {
    // Bright main pipe body with 3D gradient
    const g = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipe.width, 0);
    g.addColorStop(0, '#2fd077');
    g.addColorStop(0.3, '#7fff00');
    g.addColorStop(0.7, '#45cc33');
    g.addColorStop(1, '#2fd077');
    ctx.fillStyle = g;
    ctx.fillRect(pipe.x, 0, pipe.width, pipe.top);
    ctx.fillRect(pipe.x, pipe.bottom, pipe.width, canvas.height - pipe.bottom);

    // Strong glow effect on edges
    ctx.save();
    ctx.shadowColor = 'rgba(120,255,100,0.8)';
    ctx.shadowBlur = 18;
    ctx.strokeStyle = '#7fff00';
    ctx.lineWidth = 3;
    ctx.strokeRect(pipe.x, 0, pipe.width, pipe.top);
    ctx.strokeRect(pipe.x, pipe.bottom, pipe.width, canvas.height - pipe.bottom);
    ctx.restore();

    // Bright caps with gradient
    const capGrad = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipe.width, 0);
    capGrad.addColorStop(0, '#1a7a2e');
    capGrad.addColorStop(0.5, '#26a644');
    capGrad.addColorStop(1, '#1a7a2e');
    ctx.fillStyle = capGrad;
    ctx.fillRect(pipe.x, pipe.top - 12, pipe.width, 12);
    ctx.fillRect(pipe.x, pipe.bottom, pipe.width, 12);

    // Bright highlight on caps
    ctx.fillStyle = 'rgba(255,255,255,0.4)';
    ctx.fillRect(pipe.x, pipe.top - 11, pipe.width, 3);
    ctx.fillRect(pipe.x, pipe.bottom + 1, pipe.width, 3);
  }

  function drawCell() {
    const size = 22;
    const pulse = Math.sin(frame * 0.15) * 0.2 + 0.8;
    
    ctx.save();
    
    // Main body - rounded square with gradient
    const bodyGrad = ctx.createLinearGradient(cell.x - size, cell.y - size, cell.x + size, cell.y + size);
    bodyGrad.addColorStop(0, '#7fff00');
    bodyGrad.addColorStop(0.5, '#45cc33');
    bodyGrad.addColorStop(1, '#2ea01d');
    
    ctx.shadowColor = `rgba(120,255,100,${0.9 * pulse})`;
    ctx.shadowBlur = 25 * pulse;
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    // Rounded square body
    ctx.roundRect(cell.x - size, cell.y - size, size * 2, size * 2, 8);
    ctx.fill();
    
    // White border for definition
    ctx.strokeStyle = 'rgba(255,255,255,0.5)';
    ctx.lineWidth = 2;
    ctx.stroke();
    
    // Solar panel grid pattern (3x3)
    ctx.strokeStyle = 'rgba(255,255,255,0.3)';
    ctx.lineWidth = 1.5;
    // Vertical lines
    ctx.beginPath();
    ctx.moveTo(cell.x - size/3, cell.y - size + 4);
    ctx.lineTo(cell.x - size/3, cell.y + size - 4);
    ctx.moveTo(cell.x + size/3, cell.y - size + 4);
    ctx.lineTo(cell.x + size/3, cell.y + size - 4);
    // Horizontal lines
    ctx.moveTo(cell.x - size + 4, cell.y - size/3);
    ctx.lineTo(cell.x + size - 4, cell.y - size/3);
    ctx.moveTo(cell.x - size + 4, cell.y + size/3);
    ctx.lineTo(cell.x + size - 4, cell.y + size/3);
    ctx.stroke();
    
    // Cute eyes
    ctx.fillStyle = '#ffffff';
    ctx.shadowBlur = 0;
    // Left eye
    ctx.beginPath();
    ctx.arc(cell.x - 8, cell.y - 5, 4, 0, Math.PI * 2);
    ctx.fill();
    // Right eye
    ctx.beginPath();
    ctx.arc(cell.x + 8, cell.y - 5, 4, 0, Math.PI * 2);
    ctx.fill();
    
    // Eye pupils
    ctx.fillStyle = '#000000';
    ctx.beginPath();
    ctx.arc(cell.x - 7, cell.y - 4, 2, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(cell.x + 9, cell.y - 4, 2, 0, Math.PI * 2);
    ctx.fill();
    
    // Cute smile
    ctx.strokeStyle = '#ffffff';
    ctx.lineWidth = 2;
    ctx.lineCap = 'round';
    ctx.beginPath();
    ctx.arc(cell.x, cell.y + 6, 8, 0.2, Math.PI - 0.2);
    ctx.stroke();
    
    // Small energy indicator on top
    ctx.fillStyle = '#ffff00';
    ctx.shadowColor = 'rgba(255,255,100,0.9)';
    ctx.shadowBlur = 8;
    ctx.beginPath();
    ctx.arc(cell.x, cell.y - size - 5, 3, 0, Math.PI * 2);
    ctx.fill();
    
    ctx.restore();
  }

  function drawStartPose() {
    const bob = Math.sin(frame / 25) * 10;
    cell.y = canvas.height / 2 + bob;
    drawCell();
  }

  function drawScoreboard() {
    ctx.save();
    ctx.font = 'bold 32px Arial';
    ctx.shadowColor = 'rgba(69,204,51,0.6)';
    ctx.shadowBlur = 10;
    ctx.fillStyle = '#ecfaeb';
    ctx.textAlign = 'left';
    ctx.fillText(score, 20, 44);
    
    // Add glow outline
    ctx.strokeStyle = 'rgba(69,204,51,0.4)';
    ctx.lineWidth = 2;
    ctx.strokeText(score, 20, 44);
    ctx.restore();
  }

  function draw() {
    drawBackground();
    pipes.forEach(drawPipe);
    if (state === 'ready') {
      drawStartPose();
    } else {
      drawCell();
    }
    drawScoreboard();
  }

  let last = performance.now();
  function loop(now) {
    const dt = (now - last) / 16.67;
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault(); // prevent double-tap zoom on mobile
    flap();
  });
  window.addEventListener('keydown', (e) => { 
    if (e.code === 'Space') { 
      e.preventDefault(); 
      flap(); 
    } 
  });
  resetBtn.addEventListener('click', () => { resetGame(); });
  window.addEventListener('resize', () => { setCanvasSize(); });

  // Mobile viewport fix
  const updateViewport = () => {
    document.documentElement.style.setProperty('--vh', `${window.innerHeight * 0.01}px`);
  };
  updateViewport();
  window.addEventListener('resize', updateViewport);

  setCanvasSize();
  resetGame();
  loop(last);
};

// ====== Energy Pong ======
window.initEnergyPong = function() {
  const mount = document.getElementById('energypong-game');
  if (!mount) return;
  mount.innerHTML = '';

  const shell = document.createElement('div');
  shell.className = 'game-shell';
  const hud = document.createElement('div');
  hud.className = 'game-hud';
  hud.innerHTML = `
    <div class="hud-group">
      <div class="hud-pill"><span>You</span><strong id="pong-player">0</strong></div>
      <div class="hud-pill"><span>Grid AI</span><strong id="pong-ai">0</strong></div>
      <div class="hud-pill"><span>Mode</span><strong id="pong-mode">Medium</strong></div>
    </div>
    <div class="hud-group">
      <button class="ghost-btn" id="pong-easy">Easy</button>
      <button class="ghost-btn" id="pong-mid">Medium</button>
      <button class="ghost-btn" id="pong-hard">Hard</button>
      <button class="ghost-btn" id="pong-reset">New Match</button>
    </div>
  `;

  const canvas = document.createElement('canvas');
  canvas.className = 'game-canvas pong-canvas';
  const overlay = createOverlay('pong-msg', 'Click to serve', 'Move with your mouse or W/S keys.');

  shell.appendChild(hud);
  shell.appendChild(canvas);
  shell.appendChild(overlay);
  mount.appendChild(shell);

  const ctx = canvas.getContext('2d');
  const playerEl = hud.querySelector('#pong-player');
  const aiEl = hud.querySelector('#pong-ai');
  const modeEl = hud.querySelector('#pong-mode');
  const easyBtn = hud.querySelector('#pong-easy');
  const midBtn = hud.querySelector('#pong-mid');
  const hardBtn = hud.querySelector('#pong-hard');
  const resetBtn = hud.querySelector('#pong-reset');
  const overlayMsg = overlay.querySelector('#pong-msg');

  let state = 'serve'; // serve | play
  let playerScore = 0;
  let aiScore = 0;
  const paddle = { w: 14, h: 110, speed: 5.4 };
  let playerY = (canvas.height - paddle.h) / 2;
  let aiY = playerY;
  let inputDir = 0;
  let ball = { x: canvas.width / 2, y: canvas.height / 2, vx: 0, vy: 0, speed: 5 };
  let rally = 0;
  let difficulty = 'medium';
  let ballTrail = [];
  const maxTrailLength = 8;

  function applyDifficulty() {
    modeEl.textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    if (difficulty === 'easy') {
      paddle.h = 120;
    } else if (difficulty === 'hard') {
      paddle.h = 100;
    } else {
      paddle.h = 110;
    }
  }

  function setCanvasSize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    let targetW = 720;
    let targetH = 420;
    if (w <= 480) { 
      targetW = Math.min(360, w * 0.95); 
      targetH = Math.min(320, h * 0.5); 
      paddle.h = 120; // larger paddle on mobile
    }
    else if (w <= 900) { 
      targetW = Math.min(560, w * 0.92); 
      targetH = Math.min(360, h * 0.55); 
      paddle.h = 115; // slightly larger on tablet
    }
    else {
      applyDifficulty();
    }
    targetH = Math.min(targetH, Math.floor(h * 0.65));
    canvas.width = targetW;
    canvas.height = targetH;
    playerY = Math.min(playerY, canvas.height - paddle.h);
    aiY = Math.min(aiY, canvas.height - paddle.h);
  }

  function setMessage(title, text) {
    overlayMsg.querySelector('h2').textContent = title;
    overlayMsg.querySelector('p').textContent = text;
  }

  function serve(direction = 1) {
    ball.x = canvas.width / 2;
    ball.y = canvas.height / 2;
    rally = 0;
    const angle = (Math.random() * 0.4 - 0.2) + (direction < 0 ? Math.PI : 0);
    const baseSpeed = 3.8; // slower start speed
    const speed = baseSpeed;
    ball.vx = Math.cos(angle) * speed;
    ball.vy = Math.sin(angle) * speed;
    state = 'serve';
    overlay.style.display = 'grid';
    setMessage('Click to serve', 'First to react keeps the grid balanced.');
  }

  function startPlay() {
    if (state === 'play') return;
    state = 'play';
    overlay.style.display = 'none';
  }

  function resetMatch() {
    playerScore = 0;
    aiScore = 0;
    playerY = (canvas.height - paddle.h) / 2;
    aiY = playerY;
    serve(Math.random() > 0.5 ? 1 : -1);
    updateHud();
  }

  function updateHud() {
    playerEl.textContent = playerScore;
    aiEl.textContent = aiScore;
  }

  function clamp(val, min, max) { return Math.max(min, Math.min(max, val)); }

  function update(dt) {
    if (state !== 'play') return;
    const scale = Math.min(dt, 1.5);
    const diffFactor = difficulty === 'hard' ? 2.5 : difficulty === 'easy' ? 0.6 : 0.8;

    // keyboard move
    playerY += inputDir * paddle.speed * 5 * scale;

    // ball move
    ball.x += ball.vx * 5 * scale;
    ball.y += ball.vy * 5 * scale;

    // player paddle bounds
    playerY = clamp(playerY, 0, canvas.height - paddle.h);

    // AI follows ball - perfect tracking on hard mode
    const aiCenter = aiY + paddle.h / 2;
    const targetY = clamp(ball.y - paddle.h / 2, 0, canvas.height - paddle.h);
    const diff = targetY - aiY;
    
    if (difficulty === 'hard') {
      // Hard mode: AI is nearly perfect, instantly locks onto ball
      aiY = targetY;
    } else {
      // Easy/Medium: AI uses easing
      const aiBase = 2.8 * diffFactor;
      const aiMax = aiBase + Math.min(1.5 * diffFactor, rally * 0.05 * diffFactor);
      aiY += clamp(diff, -aiMax * scale, aiMax * scale);
    }

    // walls
    if (ball.y < 6 || ball.y > canvas.height - 6) {
      ball.vy *= -1;
      ball.y = clamp(ball.y, 6, canvas.height - 6);
    }

    // left paddle
    if (ball.x < 40 && ball.x > 20) {
      if (ball.y > playerY && ball.y < playerY + paddle.h) {
        ball.x = 40;
        const offset = (ball.y - (playerY + paddle.h / 2)) / (paddle.h / 2);
        ball.vx = Math.abs(ball.vx) + (0.06 + rally * 0.02) * diffFactor;
        ball.vy = offset * (3.2 + rally * 0.06) * diffFactor;
        rally++;
      }
    }
    // right paddle
    if (ball.x > canvas.width - 40 && ball.x < canvas.width - 20) {
      if (ball.y > aiY && ball.y < aiY + paddle.h) {
        ball.x = canvas.width - 40;
        const offset = (ball.y - (aiY + paddle.h / 2)) / (paddle.h / 2);
        ball.vx = -Math.abs(ball.vx) - (0.06 + rally * 0.018) * diffFactor;
        ball.vy = offset * (3.0 + rally * 0.055) * diffFactor;
        rally++;
      }
    }

    // scoring
    if (ball.x < -12) {
      aiScore++;
      updateHud();
      serve(1);
    } else if (ball.x > canvas.width + 12) {
      playerScore++;
      updateHud();
      serve(-1);
    }
  }

  function drawBackground() {
    // Vibrant animated gradient background like Google Doodles
    const time = performance.now() * 0.0005;
    const g = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
    g.addColorStop(0, `hsl(${145 + Math.sin(time) * 10}, 65%, 35%)`);
    g.addColorStop(0.5, `hsl(${140}, 60%, 28%)`);
    g.addColorStop(1, `hsl(${135 + Math.cos(time) * 10}, 58%, 32%)`);
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // Bright glowing center line with pulse
    const pulse = Math.sin(time * 2) * 0.3 + 0.7;
    ctx.save();
    ctx.shadowColor = `rgba(120,255,100,${0.9 * pulse})`;
    ctx.shadowBlur = 20 * pulse;
    ctx.strokeStyle = `rgba(120,255,100,${0.8 * pulse})`;
    ctx.setLineDash([12, 16]);
    ctx.lineWidth = 4;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 10);
    ctx.lineTo(canvas.width / 2, canvas.height - 10);
    ctx.stroke();
    ctx.restore();

    // Add bright court glow zones
    ctx.save();
    const leftGlow = ctx.createRadialGradient(canvas.width * 0.25, canvas.height / 2, 0, canvas.width * 0.25, canvas.height / 2, canvas.width * 0.3);
    leftGlow.addColorStop(0, 'rgba(69,204,51,0.15)');
    leftGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = leftGlow;
    ctx.fillRect(0, 0, canvas.width / 2, canvas.height);

    const rightGlow = ctx.createRadialGradient(canvas.width * 0.75, canvas.height / 2, 0, canvas.width * 0.75, canvas.height / 2, canvas.width * 0.3);
    rightGlow.addColorStop(0, 'rgba(95,226,156,0.15)');
    rightGlow.addColorStop(1, 'transparent');
    ctx.fillStyle = rightGlow;
    ctx.fillRect(canvas.width / 2, 0, canvas.width / 2, canvas.height);
    ctx.restore();
  }

  function drawPaddle(x, y, color) {
    ctx.save();
    // Intense neon glow effect
    const brightColor = color === '#45cc33' ? '#7fff00' : '#00ff7f';
    ctx.shadowColor = brightColor;
    ctx.shadowBlur = 25;
    
    // Bright 3D gradient for paddle
    const g = ctx.createLinearGradient(x, y, x + paddle.w, y);
    g.addColorStop(0, brightColor);
    g.addColorStop(0.5, '#ffffff');
    g.addColorStop(1, brightColor);
    ctx.fillStyle = g;
    ctx.fillRect(x, y, paddle.w, paddle.h);
    
    // Bright inner highlight
    ctx.fillStyle = 'rgba(255,255,255,0.5)';
    ctx.fillRect(x + 2, y + 2, paddle.w - 4, paddle.h * 0.3);
    
    // Bright edge glow
    ctx.strokeStyle = 'rgba(255,255,255,0.9)';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, paddle.w, paddle.h);
    ctx.restore();
  }

  function drawBall() {
    // Add current position to trail
    ballTrail.push({x: ball.x, y: ball.y});
    if (ballTrail.length > maxTrailLength) ballTrail.shift();

    ctx.save();
    // Draw trail
    ballTrail.forEach((pos, i) => {
      const alpha = (i / ballTrail.length) * 0.4;
      const size = 6 + (i / ballTrail.length) * 2;
      ctx.fillStyle = `rgba(255,224,102,${alpha})`;
      ctx.beginPath();
      ctx.arc(pos.x, pos.y, size, 0, Math.PI * 2);
      ctx.fill();
    });

    // Main ball with super intense glow
    const pulse = Math.sin(performance.now() * 0.01) * 0.3 + 0.7;
    ctx.shadowColor = `rgba(255,255,100,${pulse})`;
    ctx.shadowBlur = 35 * pulse;
    
    const grad = ctx.createRadialGradient(ball.x - 3, ball.y - 3, 2, ball.x, ball.y, 11);
    grad.addColorStop(0, '#ffffff');
    grad.addColorStop(0.3, '#ffff66');
    grad.addColorStop(1, '#ffd700');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 10, 0, Math.PI * 2);
    ctx.fill();
    
    // Bright outer energy ring
    ctx.strokeStyle = `rgba(255,255,150,${0.9 * pulse})`;
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 14, 0, Math.PI * 2);
    ctx.stroke();
    ctx.restore();
  }

  function drawScore() {
    ctx.save();
    ctx.font = 'bold 32px Arial';
    ctx.textAlign = 'center';
    
    // Player score (left) with green glow
    ctx.shadowColor = 'rgba(69,204,51,0.8)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ecfaeb';
    ctx.fillText(playerScore, canvas.width / 2 - 50, 40);
    ctx.strokeStyle = 'rgba(69,204,51,0.5)';
    ctx.lineWidth = 2;
    ctx.strokeText(playerScore, canvas.width / 2 - 50, 40);
    
    // AI score (right) with cyan glow
    ctx.shadowColor = 'rgba(95,226,156,0.8)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = '#ecfaeb';
    ctx.fillText(aiScore, canvas.width / 2 + 50, 40);
    ctx.strokeStyle = 'rgba(95,226,156,0.5)';
    ctx.lineWidth = 2;
    ctx.strokeText(aiScore, canvas.width / 2 + 50, 40);
    
    ctx.restore();
  }

  function draw() {
    drawBackground();
    drawPaddle(20, playerY, '#45cc33');
    drawPaddle(canvas.width - 34, aiY, '#26a644');
    drawBall();
    drawScore();
  }

  let last = performance.now();
  function loop(now) {
    const dt = (now - last) / 16.67;
    last = now;
    update(dt);
    draw();
    requestAnimationFrame(loop);
  }

  canvas.addEventListener('pointermove', (e) => {
    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    playerY = Math.max(0, Math.min(canvas.height - paddle.h, y - paddle.h / 2));
  });
  
  // Touch tap to position paddle (alternative to drag)
  canvas.addEventListener('pointerdown', (e) => {
    e.preventDefault(); // prevent text selection
    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;
    playerY = Math.max(0, Math.min(canvas.height - paddle.h, y - paddle.h / 2));
    if (state === 'serve') startPlay();
  });
  
  window.addEventListener('keydown', (e) => {
    if (e.key === 'w' || e.key === 'ArrowUp') { inputDir = -1; startPlay(); }
    if (e.key === 's' || e.key === 'ArrowDown') { inputDir = 1; startPlay(); }
  });
  window.addEventListener('keyup', (e) => {
    if (['w','s','ArrowUp','ArrowDown'].includes(e.key)) inputDir = 0;
  });
  resetBtn.addEventListener('click', resetMatch);
  window.addEventListener('resize', setCanvasSize);
  function setActiveDifficulty(btn) {
    [easyBtn, midBtn, hardBtn].forEach(b => b.classList.remove('active'));
    if (btn) btn.classList.add('active');
  }

  easyBtn.addEventListener('click', () => { difficulty = 'easy'; applyDifficulty(); setCanvasSize(); resetMatch(); setActiveDifficulty(easyBtn); });
  midBtn.addEventListener('click', () => { difficulty = 'medium'; applyDifficulty(); setCanvasSize(); resetMatch(); setActiveDifficulty(midBtn); });
  hardBtn.addEventListener('click', () => { difficulty = 'hard'; applyDifficulty(); setCanvasSize(); resetMatch(); setActiveDifficulty(hardBtn); });

  applyDifficulty();
  setActiveDifficulty(midBtn);
  setCanvasSize();
  resetMatch();
  loop(last);
};

// ====== Grid Gambit (Color Guessing Game) ======
window.initGridGambit = function() {
  const mount = document.getElementById('gambit-game');
  if (!mount) return;
  mount.innerHTML = '';

  let score = Number(localStorage.getItem('gambit_score')) || 0;
  let streak = 0;
  let bestStreak = 0; // Don't load from storage to fix the bug
  let safeScore = 0; // half of your score that you can't lose
  let totalGuesses = 0;
  let correctGuesses = 0;
  let isDoubleOrNothingActive = false;
  let donCountdown = -1; // Countdown to next double-or-nothing
  let chatMessages = [];
  let godUser = null;
  let godUserClimbTimer = null;
  
  // Realistic usernames
  const usernamePool = [
    'xXDarkLord67Xx', 'ProGamer420', 'NoobMaster69', 'ShadowHunter88',
    'CryptoKing99', 'MemeLord42', 'TryHard360', 'LuckyPlayer777',
    'EpicGamer2024', 'SkillIssue404', 'YoloSwag123', 'NinjaPro56',
    'GamerGirl33', 'MLGPlayer91', 'SniperElite47', 'QuickScope22',
    'RageQuit101', 'EZClap999', 'HighRoller85', 'BigWin247'
  ];
  
  // Annoying chat messages - massive variety
  const chatPool = [
    'OMG SO LUCKY!!!', 'ez win lol', 'cant believe i won again',
    'this game is rigged for me haha', 'streak of 15 lets gooo',
    'yall are trash im up 500', 'just won 800 points lmaooo',
    'im on fire today 🔥🔥🔥', 'too easy fr', 'gg ez',
    'cant stop winning 😂', 'best player here ngl', 'yall losing?',
    'doubled my score twice!', 'luck is on my side today',
    'how do i keep winning', 'another W for me', 'im built different',
    'green gang 💚', 'blue crew 💙', 'almost at 1k points',
    'noobs everywhere lol', 'skill gap is crazy', 'just passed 600 score',
    'my lucky day fr fr', 'undefeated rn', 'god mode activated',
    'anyone else struggling? just me winning?', 'wrong color again smh',
    'finally hit 400!', 'on a 8 streak rn', 'that was close',
    'this is addicting ngl', 'one more win...', 'so close to beating leader',
    'lets goooo', 'W after W', 'no losses today', 'on a hot streak',
    'blue never fails me', 'green is my color', 'called it!',
    'knew it was blue', 'predicted that', 'easy guess',
    'told yall green', 'clutch guess right there', 'another correct pick',
    'im unstoppable rn', 'cant lose if i tried', 'too good at this',
    'where the competition at?', 'yall even trying?', 'make it harder devs',
    'this game needs hard mode', 'way too easy for me', 'born for this',
    'guessing games are my thing', 'color master reporting', 'professional guesser',
    'just hit my high score!', 'new personal best', 'cant top this score',
    'almost doubled my points', 'safe score going crazy', 'accuracy at 90%',
    'never guessed wrong today', 'perfect streak incoming', '10 in a row baby',
    'luckiest player alive', 'the odds love me', 'rng is my friend',
    'how is this even possible', 'probability gods favor me', 'statistically blessed',
    'yall sleeping on blue', 'green supremacy', 'blue is meta',
    'green gang rise up', 'team blue forever', 'color wars',
    'wrong again lol', 'oops missed that one', 'that hurt my streak',
    'back to zero streak sad', 'lost my combo', 'streak broken gg',
    'gonna make a comeback', 'just a warmup loss', 'fluke guess',
    'rematch with the wheel', 'spin again pls', 'double or nothing time',
    'risk it for the biscuit', 'yolo mode activated', 'all in baby',
    'playing it safe', 'not risking it', 'smart plays only',
    'calculated risk', 'gotta secure the bag', 'profit secured',
    'leader board incoming', 'top 3 soon', 'bout to be #1',
    'climbing fast', 'watch me rise', 'overtaking everyone',
    'they cant catch me', 'too far ahead', 'lead is safe',
    'who even is #1 rn', 'whats the top score?', 'leader seems afk',
    'ima pass first place', 'first place = me soon', 'crown mine',
    'GG to second place', 'yall fighting for 2nd', 'race for silver',
    'close game ngl', 'sweating bullets here', 'intense round',
    'heart racing rn', 'palms sweaty', 'nail biter moment',
    'needed that win bad', 'clutch or kick', 'pressure is real',
    'vibing with green today', 'blue hitting different', 'color sense tingling',
    'my gut says green', 'feeling blue vibes', 'intuition on point',
    'trust the process', 'manifestation working', 'positive energy only'
  ];
  
  const usedMessages = new Map(); // Track recent messages per user
  const globalUsedMessages = []; // Track last 5 messages globally
  
  let leaderboard = [];
  
  // Initialize fake leaderboard with realistic scores
  function initLeaderboard() {
    leaderboard = [];
    for (let i = 0; i < 10; i++) {
      leaderboard.push({
        name: usernamePool[Math.floor(Math.random() * usernamePool.length)],
        score: Math.floor(Math.random() * 600) + 100, // Max ~700
        trend: 0
      });
    }
    leaderboard.sort((a, b) => b.score - a.score);
    
    // Select a god user who will dominate
    const godIndex = Math.floor(Math.random() * 3) + 5; // Pick from middle-low players
    if (leaderboard[godIndex]) {
      godUser = leaderboard[godIndex].name;
    }
  }
  
  initLeaderboard();

  const shell = document.createElement('div');
  shell.className = 'game-shell';
  shell.innerHTML = `
    <div class="game-hud">
      <div class="hud-group">
        <div class="hud-pill" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #ffffff;">
          <span>💰 Score</span><strong id="gambit-score">${score}</strong>
        </div>
        <div class="hud-pill">
          <span>🔥 Streak</span><strong id="gambit-streak">0</strong>
        </div>
        <div class="hud-pill">
          <span>🏆 Best</span><strong id="gambit-best">0</strong>
        </div>
        <div class="hud-pill" style="background: linear-gradient(135deg, #4ade80 0%, #22c55e 100%); color: #000;">
          <span>🛡️ Safe</span><strong id="gambit-safe">0</strong>
        </div>
      </div>
      <div class="hud-group">
        <div class="hud-pill" style="font-size: 0.85rem;">
          <span>Accuracy</span><strong id="gambit-accuracy">0%</strong>
        </div>
        <div class="hud-pill" id="don-countdown-pill" style="background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%); color: #000; display: none;">
          <span>🎰 Next Event</span><strong id="don-countdown">3</strong>
        </div>
      </div>
    </div>
    
    <div class="gambit-game-area">
      <div class="gambit-main">
        <div class="gambit-question">
          <h2 id="gambit-question-text">Which color will appear?</h2>
          <div class="gambit-multiplier" id="gambit-multiplier">+10 points</div>
        </div>
        
        <div class="gambit-color-display" id="gambit-color-display">
          <div class="gambit-mystery">?</div>
        </div>
        
        <div class="gambit-choices">
          <button class="gambit-choice blue" id="choice-blue">
            <span class="choice-icon">💙</span>
            <span class="choice-label">BLUE</span>
          </button>
          <button class="gambit-choice green" id="choice-green">
            <span class="choice-icon">💚</span>
            <span class="choice-label">GREEN</span>
          </button>
        </div>
        
        <div class="gambit-message" id="gambit-message"></div>
      </div>
      
      <div class="gambit-sidebar">
        <div class="gambit-leaderboard">
          <h3>🏆 Live Leaderboard</h3>
          <div class="leaderboard-list" id="leaderboard-list"></div>
        </div>
        <div class="gambit-chat">
          <h3>💬 Live Chat</h3>
          <div class="chat-messages" id="chat-messages"></div>
        </div>
      </div>
    </div>
    
    <div class="double-or-nothing-overlay" id="don-overlay" style="display: none;">
      <div class="don-modal">
        <div class="don-header">
          <h2>🎰 DOUBLE OR NOTHING!</h2>
          <p>Risk <strong>ALL ${score} points</strong> for a chance to <strong>DOUBLE</strong> them!</p>
          <div class="don-timer" id="don-timer">Time to decide: <strong>10s</strong></div>
        </div>
        <div class="don-wheel-container">
          <div class="don-pointer">▼</div>
          <canvas id="don-wheel" width="300" height="300"></canvas>
        </div>
        <div class="don-result" id="don-result"></div>
        <div class="don-buttons" id="don-buttons">
          <button class="don-btn accept" id="don-accept">
            <span class="btn-icon">🎰</span>
            <span class="btn-text">SPIN IT!</span>
          </button>
          <button class="don-btn decline" id="don-decline">
            <span class="btn-icon">🛡️</span>
            <span class="btn-text">Play Safe</span>
          </button>
        </div>
      </div>
    </div>
  `;

  mount.appendChild(shell);

  const scoreEl = shell.querySelector('#gambit-score');
  const streakEl = shell.querySelector('#gambit-streak');
  const bestEl = shell.querySelector('#gambit-best');
  const safeEl = shell.querySelector('#gambit-safe');
  const accuracyEl = shell.querySelector('#gambit-accuracy');
  const questionEl = shell.querySelector('#gambit-question-text');
  const multiplierEl = shell.querySelector('#gambit-multiplier');
  const colorDisplayEl = shell.querySelector('#gambit-color-display');
  const messageEl = shell.querySelector('#gambit-message');
  const blueBtn = shell.querySelector('#choice-blue');
  const greenBtn = shell.querySelector('#choice-green');
  const leaderboardEl = shell.querySelector('#leaderboard-list');
  const chatEl = shell.querySelector('#chat-messages');
  const donOverlay = shell.querySelector('#don-overlay');
  const donWheel = shell.querySelector('#don-wheel');
  const donResult = shell.querySelector('#don-result');
  const donButtons = shell.querySelector('#don-buttons');
  const donAccept = shell.querySelector('#don-accept');
  const donDecline = shell.querySelector('#don-decline');
  const donCountdownEl = shell.querySelector('#don-countdown');
  const donCountdownPill = shell.querySelector('#don-countdown-pill');
  const donTimer = shell.querySelector('#don-timer');

  let currentColor = null;
  let isAnimating = false;
  let donTimerInterval = null;

  function updateDisplay() {
    scoreEl.textContent = score;
    streakEl.textContent = streak;
    bestEl.textContent = bestStreak;
    safeEl.textContent = safeScore;
    
    const accuracy = totalGuesses > 0 ? Math.round((correctGuesses / totalGuesses) * 100) : 0;
    accuracyEl.textContent = accuracy + '%';
    
    // Update countdown display
    if (donCountdown >= 0 && donCountdown <= 3) {
      donCountdownPill.style.display = 'flex';
      donCountdownEl.textContent = donCountdown;
      if (donCountdown === 0) {
        donCountdownEl.textContent = 'NOW!';
      }
    } else {
      donCountdownPill.style.display = 'none';
    }
    
    // Calculate next points
    const basePoints = 10;
    const nextPoints = streak >= 10 ? basePoints * Math.pow(2, Math.floor(streak / 2)) : basePoints * (streak + 1);
    multiplierEl.textContent = `+${nextPoints} points`;
    
    localStorage.setItem('gambit_score', score);
    localStorage.setItem('gambit_best_streak', bestStreak);
  }

  function addChatMessage(username, message) {
    // Prevent same user from sending same message consecutively
    const lastMsg = usedMessages.get(username);
    
    // Get available messages (not used by this user recently, not in last 8 global messages)
    let availableMessages = chatPool.filter(m => 
      m !== lastMsg && !globalUsedMessages.includes(m)
    );
    
    // If we filtered out everything, just avoid the last message
    if (availableMessages.length === 0) {
      availableMessages = chatPool.filter(m => m !== lastMsg);
    }
    
    // If still nothing, use full pool
    if (availableMessages.length === 0) {
      availableMessages = chatPool;
    }
    
    // Pick a random message from available ones
    message = availableMessages[Math.floor(Math.random() * availableMessages.length)];
    
    usedMessages.set(username, message);
    globalUsedMessages.push(message);
    if (globalUsedMessages.length > 8) globalUsedMessages.shift(); // Increased from 5 to 8
    
    chatMessages.unshift({ username, message, time: Date.now() });
    if (chatMessages.length > 8) chatMessages = chatMessages.slice(0, 8);
    
    chatEl.innerHTML = chatMessages.map(msg => `
      <div class="chat-item">
        <span class="chat-user">${msg.username}:</span>
        <span class="chat-text">${msg.message}</span>
      </div>
    `).join('');
  }
  
  function updateLeaderboard() {
    // Animate fake players
    leaderboard.forEach(player => {
      if (player.name === godUser && Math.random() > 0.3) {
        // God user climbs aggressively
        const change = Math.floor(Math.random() * 150) + 100;
        player.score += change;
        player.trend = change;
        if (Math.random() > 0.6) {
          const msg = chatPool[Math.floor(Math.random() * chatPool.length)];
          addChatMessage(godUser, msg);
        }
      } else if (Math.random() > 0.75) {
        const change = Math.floor(Math.random() * 80) + 20;
        player.score += change;
        player.trend = change;
        if (Math.random() > 0.85) {
          const msg = chatPool[Math.floor(Math.random() * chatPool.length)];
          addChatMessage(player.name, msg);
        }
      } else {
        player.trend = 0;
      }
    });
    
    // Add player to leaderboard if not there
    const playerIndex = leaderboard.findIndex(p => p.name === 'YOU');
    if (playerIndex === -1 && score > 0) {
      leaderboard.push({ name: 'YOU', score: score, trend: 0, isPlayer: true });
    } else if (playerIndex !== -1) {
      const oldScore = leaderboard[playerIndex].score;
      leaderboard[playerIndex].score = score;
      leaderboard[playerIndex].trend = score - oldScore;
    }
    
    leaderboard.sort((a, b) => b.score - a.score);
    
    // Render leaderboard
    leaderboardEl.innerHTML = leaderboard.slice(0, 10).map((player, i) => {
      const trendIcon = player.trend > 0 ? '📈' : '';
      const trendText = player.trend > 0 ? `+${player.trend}` : '';
      const highlight = player.isPlayer ? 'style="background: rgba(255,215,0,0.2); font-weight: bold;"' : '';
      return `
        <div class="leaderboard-item" ${highlight}>
          <span class="rank">#${i + 1}</span>
          <span class="name">${player.name}</span>
          <span class="score">${player.score.toLocaleString()} ${trendIcon}</span>
          ${trendText ? `<span class="trend">${trendText}</span>` : ''}
        </div>
      `;
    }).join('');
  }

  function nextRound() {
    if (isAnimating) return;
    
    currentColor = null; // Will be set when player makes guess
    colorDisplayEl.innerHTML = '<div class="gambit-mystery">?</div>';
    colorDisplayEl.className = 'gambit-color-display';
    messageEl.textContent = '';
    messageEl.className = 'gambit-message';
    
    blueBtn.disabled = false;
    greenBtn.disabled = false;
    blueBtn.classList.remove('correct', 'wrong');
    greenBtn.classList.remove('correct', 'wrong');
  }

  function makeGuess(guess) {
    if (isAnimating) return;
    isAnimating = true;
    totalGuesses++;
    
    blueBtn.disabled = true;
    greenBtn.disabled = true;
    
    // 60% chance player's guess is correct, 40% wrong
    const shouldWin = Math.random() < 0.6;
    currentColor = shouldWin ? guess : (guess === 'blue' ? 'green' : 'blue');
    
    // Animate reveal
    colorDisplayEl.classList.add('revealing');
    
    setTimeout(() => {
      const colorClass = currentColor === 'blue' ? 'show-blue' : 'show-green';
      colorDisplayEl.className = `gambit-color-display ${colorClass}`;
      colorDisplayEl.innerHTML = `<div class="gambit-color-circle"></div>`;
      
      const correct = guess === currentColor;
      
      if (correct) {
        correctGuesses++;
        streak++;
        
        // Calculate points with doubling after streak 10
        const basePoints = 10;
        let points;
        if (streak >= 10) {
          points = basePoints * Math.pow(2, Math.floor(streak / 2));
        } else {
          points = basePoints * streak;
        }
        
        score += points;
        
        // Update safe score at certain thresholds - every 3 correct
        if (streak % 3 === 0 && streak > 0) {
          safeScore = Math.floor(score / 2);
          messageEl.innerHTML = `🎉 Correct! +${points} points<br><span style="color: #4ade80;">🛡️ Safe score updated to ${safeScore}!</span>`;
        } else {
          messageEl.textContent = `✅ Correct! +${points} points`;
        }
        messageEl.className = 'gambit-message correct';
        
        if (streak > bestStreak) {
          bestStreak = streak;
        }
        
        const btn = guess === 'blue' ? blueBtn : greenBtn;
        btn.classList.add('correct');
        
      } else {
        // Wrong answer - lose points down to safe score
        const pointsLost = Math.max(0, score - safeScore);
        score = safeScore;
        streak = 0;
        
        messageEl.innerHTML = `❌ Wrong! The color was ${currentColor.toUpperCase()}<br><span style="color: #ef4444;">Lost ${pointsLost} points (saved by safe score)</span>`;
        messageEl.className = 'gambit-message wrong';
        
        const btn = guess === 'blue' ? blueBtn : greenBtn;
        btn.classList.add('wrong');
      }
      
      updateDisplay();
      updateLeaderboard();
      
      setTimeout(() => {
        isAnimating = false;
        
        // Countdown and trigger double-or-nothing (starts after 10 points)
        if (correct && score >= 10 && !isDoubleOrNothingActive) {
          if (donCountdown < 0) {
            // Start countdown (triggers in 8-12 correct guesses = ~20-30 seconds)
            donCountdown = Math.floor(Math.random() * 5) + 8;
          } else if (donCountdown > 0) {
            donCountdown--;
            updateDisplay();
          }
          
          if (donCountdown === 0) {
            donCountdown = -1; // Reset
            showDoubleOrNothing();
            return;
          }
        }
        
        nextRound();
      }, 1500); // Reduced from 2500ms
      
    }, 600);
  }
  
  function showDoubleOrNothing() {
    isDoubleOrNothingActive = true;
    donCountdown = -1;
    updateDisplay();
    donOverlay.style.display = 'flex';
    donResult.textContent = '';
    donButtons.style.display = 'flex';
    
    // Update score in the message
    const headerP = shell.querySelector('.don-header p');
    if (headerP) {
      headerP.innerHTML = `Risk <strong>ALL ${score} points</strong> for a chance to <strong>DOUBLE</strong> them!`;
    }
    
    // Start 10 second countdown timer
    let timeLeft = 10;
    donTimer.innerHTML = `Time to decide: <strong>${timeLeft}s</strong>`;
    
    if (donTimerInterval) clearInterval(donTimerInterval);
    donTimerInterval = setInterval(() => {
      timeLeft--;
      if (timeLeft > 0) {
        donTimer.innerHTML = `Time to decide: <strong>${timeLeft}s</strong>`;
        if (timeLeft <= 3) {
          donTimer.style.color = '#ef4444';
          donTimer.style.animation = 'pulse 0.5s ease-in-out infinite';
        }
      } else {
        clearInterval(donTimerInterval);
        donTimer.innerHTML = '<strong style="color: #ef4444;">Time\'s up! Playing safe...</strong>';
        setTimeout(() => spinWheel(false), 1000);
      }
    }, 1000);
  }
  
  function spinWheel(accept) {
    if (donTimerInterval) {
      clearInterval(donTimerInterval);
      donTimerInterval = null;
    }
    
    if (!accept) {
      donOverlay.style.display = 'none';
      isDoubleOrNothingActive = false;
      donCountdown = -1;
      nextRound();
      return;
    }
    
    donButtons.style.display = 'none';
    const ctx = donWheel.getContext('2d');
    const centerX = 150;
    const centerY = 150;
    const radius = 140;
    
    let rotation = 0;
    const spinDuration = 3000;
    const startTime = Date.now();
    const spins = 5 + Math.random() * 3;
    const winChance = 0.48; // 48% win
    const willWin = Math.random() < winChance;
    const targetRotation = spins * 360 + (willWin ? 90 : 270); // Land on green or red
    
    function animate() {
      const elapsed = Date.now() - startTime;
      const progress = Math.min(elapsed / spinDuration, 1);
      const eased = 1 - Math.pow(1 - progress, 3); // Ease out
      
      rotation = targetRotation * eased;
      
      ctx.clearRect(0, 0, 300, 300);
      
      // Draw wheel segments
      for (let i = 0; i < 4; i++) {
        ctx.beginPath();
        ctx.arc(centerX, centerY, radius, 
          (rotation + i * 90) * Math.PI / 180,
          (rotation + (i + 1) * 90) * Math.PI / 180);
        ctx.lineTo(centerX, centerY);
        ctx.fillStyle = i % 2 === 0 ? '#10b981' : '#ef4444'; // Green or Red
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 3;
        ctx.stroke();
      }
      
      // Draw center circle
      ctx.beginPath();
      ctx.arc(centerX, centerY, 30, 0, 2 * Math.PI);
      ctx.fillStyle = '#1a1a1a';
      ctx.fill();
      ctx.strokeStyle = '#ffd700';
      ctx.lineWidth = 4;
      ctx.stroke();
      
      if (progress < 1) {
        requestAnimationFrame(animate);
      } else {
        // Show result
        if (willWin) {
          score *= 2;
          donResult.innerHTML = '<span style="color: #10b981; font-size: 1.5rem; font-weight: 800;">🎉 DOUBLED! 🎉</span>';
          addChatMessage('YOU', 'OMG I DOUBLED MY SCORE!!!');
        } else {
          score = 0;
          safeScore = 0;
          streak = 0;
          donResult.innerHTML = '<span style="color: #ef4444; font-size: 1.5rem; font-weight: 800;">💔 LOST IT ALL 💔</span>';
        }
        updateDisplay();
        updateLeaderboard();
        
        setTimeout(() => {
          donOverlay.style.display = 'none';
          isDoubleOrNothingActive = false;
          donCountdown = -1;
          donTimer.style.color = '';
          donTimer.style.animation = '';
          if (donTimerInterval) {
            clearInterval(donTimerInterval);
            donTimerInterval = null;
          }
          updateDisplay();
          nextRound();
        }, 2000);
      }
    }
    
    animate();
  }

  blueBtn.addEventListener('click', () => makeGuess('blue'));
  greenBtn.addEventListener('click', () => makeGuess('green'));
  donAccept.addEventListener('click', () => spinWheel(true));
  donDecline.addEventListener('click', () => spinWheel(false));

  updateDisplay();
  updateLeaderboard();
  nextRound();
  
  // Update leaderboard periodically
  setInterval(updateLeaderboard, 2500);
  
  // Add random chat messages with more spacing
  setInterval(() => {
    if (Math.random() > 0.6) { // Reduced from 0.7 to make it more active
      const randomPlayer = leaderboard[Math.floor(Math.random() * leaderboard.length)];
      if (randomPlayer && randomPlayer.name !== 'YOU') {
        const msg = chatPool[Math.floor(Math.random() * chatPool.length)];
        addChatMessage(randomPlayer.name, msg);
      }
    }
  }, 6000); // Increased from 4000ms to spread out messages more
};

// Optional stub if someone mounts #snake-game inside another page.
window.initSnake = function() {
  const el = document.getElementById('snake-game');
  if (el) el.innerHTML = '<p style="color:#ecfaeb;text-align:center">Snake is available on its own page.</p>';
};

// Backward compatibility if any page still calls initPoker
window.initPoker = window.initGridGambit;
