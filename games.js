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

// ====== Grid Gambit (Energy card duel) ======
window.initGridGambit = function() {
  const mount = document.getElementById('gambit-game');
  if (!mount) return;
  mount.innerHTML = '';

  // Stored meta before building HUD
  let scores = { player: 0, dealer: 0, ties: 0 };
  let streak = Number(localStorage.getItem('gambit_streak')) || 0;
  let bestStreak = Number(localStorage.getItem('gambit_best_streak')) || 0;
  let autoDealTimer = null;
  let charge = Number(localStorage.getItem('gambit_charge')) || 0;

  const shell = document.createElement('div');
  shell.className = 'game-shell';
  shell.innerHTML = `
    <div class="game-hud">
      <div class="hud-group">
        <div class="hud-pill"><span>You</span><strong id="gambit-player-score">0</strong></div>
        <div class="hud-pill"><span>Dealer</span><strong id="gambit-dealer-score">0</strong></div>
        <div class="hud-pill"><span>Ties</span><strong id="gambit-ties">0</strong></div>
        <div class="hud-pill" style="background: linear-gradient(135deg, #ffd700 0%, #ffed4e 100%);"><span>⚡ Charge</span><strong id="gambit-charge">0</strong></div>
        <div class="hud-pill"><span>🏆 Best Streak</span><strong id="gambit-best">${bestStreak}</strong></div>
      </div>
      <div class="hud-group">
        <button class="ghost-btn primary" id="gambit-deal">Deal Cards</button>
        <button class="ghost-btn" id="gambit-overcharge" style="position: relative;">⚡ Overcharge (costs 1)</button>
      </div>
    </div>
    <div class="gambit-table">
      <div class="hand">
        <div class="hand-label">Your hand</div>
        <div class="card-row" id="player-cards"></div>
        <div class="hand-result" id="player-result"></div>
      </div>
      <div class="hand">
        <div class="hand-label">Dealer</div>
        <div class="card-row" id="dealer-cards"></div>
        <div class="hand-result" id="dealer-result"></div>
      </div>
    </div>
    <div class="gambit-actions">
      <span class="gambit-tip" id="gambit-tip">Win hands to build charge. Use Overcharge BEFORE dealing to boost your next hand by +20%. Pairs, straights, and flushes score higher.</span>
    </div>
  `;

  const playerEl = shell.querySelector('#gambit-player-score');
  const dealerEl = shell.querySelector('#gambit-dealer-score');
  const tiesEl = shell.querySelector('#gambit-ties');
  const chargeEl = shell.querySelector('#gambit-charge');
  const bestEl = shell.querySelector('#gambit-best');
  const dealBtn = shell.querySelector('#gambit-deal');
  const overchargeBtn = shell.querySelector('#gambit-overcharge');
  const playerCardsEl = shell.querySelector('#player-cards');
  const dealerCardsEl = shell.querySelector('#dealer-cards');
  const playerResultEl = shell.querySelector('#player-result');
  const dealerResultEl = shell.querySelector('#dealer-result');
  const tipEl = shell.querySelector('#gambit-tip');

  mount.appendChild(shell);

  const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  const suits = ['♠','♥','♦','♣'];
  const rankValue = { '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14 };

  function updateStreak(winDelta) {
    if (winDelta > 0) streak += 1;
    else if (winDelta < 0) streak = 0;
    // ties do not change streak
    if (streak > bestStreak) {
      bestStreak = streak;
      localStorage.setItem('gambit_best_streak', bestStreak);
    }
    localStorage.setItem('gambit_streak', streak);
  }

  function updateMeta() {
    chargeEl.textContent = charge;
    bestEl.textContent = bestStreak;
    overchargeBtn.disabled = charge < 1;
  }

  function buildDeck() {
    const deck = [];
    for (const r of ranks) for (const s of suits) deck.push({ rank: r, suit: s });
    for (let i = deck.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [deck[i], deck[j]] = [deck[j], deck[i]];
    }
    return deck;
  }

  function renderHand(container, hand) {
    container.innerHTML = '';
    hand.forEach((card, index) => {
      const cardEl = document.createElement('div');
      const red = card.suit === '♥' || card.suit === '♦';
      cardEl.className = 'card' + (red ? ' red' : '');
      cardEl.style.animation = `cardDeal 0.4s ease-out ${index * 0.08}s both`;
      cardEl.innerHTML = `
        <div class="card-shine"></div>
        <div class="rank">${card.rank}</div>
        <div class="suit">${card.suit}</div>
        <div class="rank bottom">${card.rank}</div>
      `;
      container.appendChild(cardEl);
    });
  }

  function detectStraight(values) {
    const uniq = Array.from(new Set(values)).sort((a,b) => a - b);
    if (uniq.length < 5) return false;
    // Wheel straight (A-2-3-4-5)
    if (uniq.join(',') === '2,3,4,5,14') return 5;
    const first = uniq[0];
    const isStraight = uniq.every((v, i) => v === first + i);
    return isStraight ? uniq[uniq.length - 1] : false;
  }

  function evaluateHand(hand) {
    const counts = {};
    const suitsCount = {};
    const values = hand.map(c => rankValue[c.rank]).sort((a,b) => b - a);
    hand.forEach(c => {
      counts[c.rank] = (counts[c.rank] || 0) + 1;
      suitsCount[c.suit] = (suitsCount[c.suit] || 0) + 1;
    });
    const flushSuit = Object.keys(suitsCount).find(s => suitsCount[s] === 5);
    const isFlush = Boolean(flushSuit);
    const straightHigh = detectStraight(values.slice().sort((a,b) => a - b));
    const countEntries = Object.entries(counts).sort((a, b) => {
      const diff = b[1] - a[1];
      if (diff !== 0) return diff;
      return rankValue[b[0]] - rankValue[a[0]];
    });

    const valuesDesc = values.slice().sort((a,b) => b - a);
    let score = 0;
    let name = 'High Card';
    let tiebreak = valuesDesc.slice();

    const bestCount = countEntries[0][1];
    const secondCount = countEntries[1] ? countEntries[1][1] : 0;

    if (straightHigh && isFlush) {
      score = 8; name = 'Straight Flush'; tiebreak = [straightHigh];
    } else if (bestCount === 4) {
      const fourRank = rankValue[countEntries[0][0]];
      const kicker = valuesDesc.find(v => v !== fourRank) || fourRank;
      score = 7; name = 'Four of a Kind'; tiebreak = [fourRank, kicker];
    } else if (bestCount === 3 && secondCount === 2) {
      const threeVal = rankValue[countEntries[0][0]];
      const pairVal = rankValue[countEntries[1][0]];
      score = 6; name = 'Full House'; tiebreak = [threeVal, pairVal];
    } else if (isFlush) {
      score = 5; name = 'Flush'; tiebreak = valuesDesc;
    } else if (straightHigh) {
      score = 4; name = 'Straight'; tiebreak = [straightHigh];
    } else if (bestCount === 3) {
      const threeVal = rankValue[countEntries[0][0]];
      const kickers = valuesDesc.filter(v => v !== threeVal);
      score = 3; name = 'Three of a Kind'; tiebreak = [threeVal, ...kickers];
    } else if (bestCount === 2 && secondCount === 2) {
      const pairVals = countEntries.filter(e => e[1] === 2).map(e => rankValue[e[0]]).sort((a,b)=>b-a);
      const kicker = valuesDesc.find(v => !pairVals.includes(v)) || pairVals[0];
      score = 2; name = 'Two Pair'; tiebreak = [...pairVals, kicker];
    } else if (bestCount === 2) {
      const pairVal = rankValue[countEntries[0][0]];
      const kickers = valuesDesc.filter(v => v !== pairVal);
      score = 1; name = 'One Pair'; tiebreak = [pairVal, ...kickers];
    }

    return { score, name, tiebreak };
  }

  function compareHands(a, b) {
    if (a.score !== b.score) return a.score - b.score;
    const len = Math.max(a.tiebreak.length, b.tiebreak.length);
    for (let i = 0; i < len; i++) {
      const diff = (a.tiebreak[i] || 0) - (b.tiebreak[i] || 0);
      if (diff !== 0) return diff;
    }
    return 0;
  }

  function scheduleAutoDeal() {
    if (autoDealTimer) clearTimeout(autoDealTimer);
    autoDealTimer = setTimeout(() => deal(), 1200);
  }

  function handPower(evaluation) {
    const kickerSum = evaluation.tiebreak.reduce((a,b)=>a+b,0);
    return evaluation.score * 1000 + kickerSum;
  }

  function deal() {
    if (autoDealTimer) { clearTimeout(autoDealTimer); autoDealTimer = null; }
    overchargeBtn.dataset.boost = '1';
    const deck = buildDeck();
    const playerHand = deck.slice(0, 5);
    const dealerHand = deck.slice(5, 10);
    const playerEval = evaluateHand(playerHand);
    const dealerEval = evaluateHand(dealerHand);
    const boost = charge > 0 && overchargeBtn.classList.contains('active') ? 1.2 : 1;
    overchargeBtn.classList.remove('active');
    overchargeBtn.textContent = '⚡ Overcharge (costs 1)';
    overchargeBtn.style.background = '';
    overchargeBtn.style.color = '';
    // Compare numeric power with optional boost
    const playerPower = handPower(playerEval) * boost;
    const dealerPower = handPower(dealerEval);
    let result = 0;
    if (playerPower > dealerPower) result = 1;
    else if (playerPower < dealerPower) result = -1;

    renderHand(playerCardsEl, playerHand);
    renderHand(dealerCardsEl, dealerHand);
    playerResultEl.textContent = playerEval.name;
    dealerResultEl.textContent = dealerEval.name;

    if (result > 0) {
      scores.player++;
      charge = Math.min(9, charge + 1); // cap charge to keep choices tight
      tipEl.textContent = `🎉 You win with ${playerEval.name}! Streak: ${streak + 1}. ⚡ Charge +1 (now ${charge}).`;
      updateStreak(1);
    } else if (result < 0) {
      scores.dealer++;
      // Don't lose charge on loss, only on use
      tipEl.textContent = `Dealer wins with ${dealerEval.name}. Your streak resets, but you keep your charge.`;
      updateStreak(-1);
    } else {
      scores.ties++;
      tipEl.textContent = `Tie! Both had ${playerEval.name}. No charge change.`;
    }
    playerEl.textContent = scores.player;
    dealerEl.textContent = scores.dealer;
    tiesEl.textContent = scores.ties;
    localStorage.setItem('gambit_charge', charge);
    updateMeta();
    scheduleAutoDeal();
  }

  function applyOvercharge() {
    if (charge < 1) return;
    charge -= 1;
    localStorage.setItem('gambit_charge', charge);
    tipEl.textContent = '⚡ OVERCHARGED! Your next hand gets +20% boost. Deal now to use it!';
    overchargeBtn.classList.add('active');
    overchargeBtn.textContent = '⚡ ACTIVE!';
    overchargeBtn.style.background = 'linear-gradient(135deg, #ffd700 0%, #ffed4e 100%)';
    overchargeBtn.style.color = '#000';
    return 1.2;
  }

  overchargeBtn.addEventListener('click', () => {
    if (charge < 1) { 
      tipEl.textContent = '⚠️ Not enough charge! Win hands to build up charge first.';
      return; 
    }
    if (overchargeBtn.classList.contains('active')) {
      tipEl.textContent = '⚡ Overcharge already active! Deal cards to use the boost.';
      return;
    }
    applyOvercharge();
    updateMeta();
  });

  dealBtn.addEventListener('click', () => { deal(); });
  updateMeta();
  deal();
};

// Optional stub if someone mounts #snake-game inside another page.
window.initSnake = function() {
  const el = document.getElementById('snake-game');
  if (el) el.innerHTML = '<p style="color:#ecfaeb;text-align:center">Snake is available on its own page.</p>';
};

// Backward compatibility if any page still calls initPoker
window.initPoker = window.initGridGambit;
