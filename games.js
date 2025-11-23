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
  let gravity = 0.36;
  const baseGravity = 0.34;
  const flapForce = -7.6;
  let pipeSpeed = 2.4;
  const basePipeSpeed = 2.2;
  let pipeGap = 170;
  let lastPipeX = null;
  const minGap = 135;
  const minSpacingRatio = 0.52;

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
        if (pipeGap > minGap) pipeGap = Math.max(minGap, pipeGap - 1.5);
        pipeSpeed = Math.min(3.6, pipeSpeed + 0.04);
        gravity = Math.min(0.5, gravity + 0.006);
      }
      const collideX = cell.x + 18 > p.x && cell.x - 18 < p.x + p.width;
      const collideY = cell.y - 18 < p.top || cell.y + 18 > p.bottom;
      if (collideX && collideY) {
        endGame();
        return;
      }
    }

    if (cell.y + 20 > canvas.height || cell.y - 20 < 0) {
      endGame();
    }
  }

  function drawBackground() {
    const g = ctx.createLinearGradient(0, 0, 0, canvas.height);
    g.addColorStop(0, '#0f2a18');
    g.addColorStop(1, '#0b1c10');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.strokeStyle = 'rgba(69,204,51,0.08)';
    ctx.lineWidth = 1;
    for (let y = 0; y < canvas.height; y += 40) {
      ctx.beginPath();
      ctx.moveTo(0, y + 0.5);
      ctx.lineTo(canvas.width, y + 0.5);
      ctx.stroke();
    }
    ctx.restore();
  }

  function drawPipe(pipe) {
    const g = ctx.createLinearGradient(pipe.x, 0, pipe.x + pipe.width, 0);
    g.addColorStop(0, '#26a644');
    g.addColorStop(1, '#45cc33');
    ctx.fillStyle = g;
    ctx.fillRect(pipe.x, 0, pipe.width, pipe.top);
    ctx.fillRect(pipe.x, pipe.bottom, pipe.width, canvas.height - pipe.bottom);

    ctx.fillStyle = '#0c1c11';
    ctx.fillRect(pipe.x, pipe.top - 10, pipe.width, 10);
    ctx.fillRect(pipe.x, pipe.bottom, pipe.width, 10);
  }

  function drawCell() {
    const radius = 18;
    const grad = ctx.createRadialGradient(cell.x - 6, cell.y - 6, 6, cell.x, cell.y, 26);
    grad.addColorStop(0, '#9ff69a');
    grad.addColorStop(1, '#45cc33');
    ctx.save();
    ctx.shadowColor = 'rgba(69,204,51,0.6)';
    ctx.shadowBlur = 12;
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(cell.x, cell.y, radius, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = '#0b1c10';
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(cell.x - 14, cell.y + i * 4);
      ctx.lineTo(cell.x + 14, cell.y + i * 4);
      ctx.stroke();
    }
    ctx.restore();

    ctx.save();
    ctx.strokeStyle = '#ffe066';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cell.x - 6, cell.y - 10);
    ctx.lineTo(cell.x + 3, cell.y + 1);
    ctx.lineTo(cell.x - 8, cell.y + 1);
    ctx.lineTo(cell.x + 6, cell.y + 14);
    ctx.stroke();
    ctx.restore();
  }

  function drawStartPose() {
    const bob = Math.sin(frame / 25) * 10;
    cell.y = canvas.height / 2 + bob;
    drawCell();
  }

  function drawScoreboard() {
    ctx.save();
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = '#ecfaeb';
    ctx.textAlign = 'left';
    ctx.fillText(score, 18, 42);
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

  canvas.addEventListener('pointerdown', flap);
  window.addEventListener('keydown', (e) => { if (e.code === 'Space') { e.preventDefault(); flap(); } });
  resetBtn.addEventListener('click', () => { resetGame(); });
  window.addEventListener('resize', () => { setCanvasSize(); });

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
  const paddle = { w: 14, h: 96, speed: 5.4 };
  let playerY = (canvas.height - paddle.h) / 2;
  let aiY = playerY;
  let inputDir = 0;
  let ball = { x: canvas.width / 2, y: canvas.height / 2, vx: 0, vy: 0, speed: 5 };
  let rally = 0;
  let difficulty = 'medium';

  function applyDifficulty() {
    modeEl.textContent = difficulty.charAt(0).toUpperCase() + difficulty.slice(1);
    if (difficulty === 'easy') {
      paddle.h = 104;
    } else if (difficulty === 'hard') {
      paddle.h = 92;
    } else {
      paddle.h = 96;
    }
  }

  function setCanvasSize() {
    const w = window.innerWidth;
    const h = window.innerHeight;
    let targetW = 720;
    let targetH = 420;
    if (w <= 480) { targetW = 360; targetH = 320; paddle.h = 100; }
    else if (w <= 900) { targetW = 560; targetH = 360; }
    applyDifficulty();
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
    const baseSpeed = difficulty === 'hard' ? 4.8 : difficulty === 'easy' ? 4.0 : 4.3;
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

    // keyboard move
    playerY += inputDir * paddle.speed * 5 * scale;

    // ball move
    ball.x += ball.vx * 5 * scale;
    ball.y += ball.vy * 5 * scale;

    // player paddle bounds
    playerY = clamp(playerY, 0, canvas.height - paddle.h);

    // AI follows ball with easing
    const aiCenter = aiY + paddle.h / 2;
    const targetY = clamp(ball.y - paddle.h / 2, 0, canvas.height - paddle.h);
    const diff = targetY - aiY;
    const aiBase = difficulty === 'hard' ? 4.5 : difficulty === 'easy' ? 3.2 : 4.0;
    const aiMax = aiBase + Math.min(1.6, rally * 0.07);
    aiY += clamp(diff, -aiMax * scale, aiMax * scale);

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
        ball.vx = Math.abs(ball.vx) + 0.08 + rally * 0.035;
        ball.vy = offset * (3.9 + rally * 0.09);
        rally++;
      }
    }
    // right paddle
    if (ball.x > canvas.width - 40 && ball.x < canvas.width - 20) {
      if (ball.y > aiY && ball.y < aiY + paddle.h) {
        ball.x = canvas.width - 40;
        const offset = (ball.y - (aiY + paddle.h / 2)) / (paddle.h / 2);
        ball.vx = -Math.abs(ball.vx) - 0.08 - rally * 0.028;
        ball.vy = offset * (3.6 + rally * 0.085);
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
    const g = ctx.createLinearGradient(0, 0, canvas.width, 0);
    g.addColorStop(0, '#0f1f12');
    g.addColorStop(1, '#0c130c');
    ctx.fillStyle = g;
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    ctx.save();
    ctx.strokeStyle = 'rgba(69,204,51,0.18)';
    ctx.setLineDash([10, 14]);
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(canvas.width / 2, 10);
    ctx.lineTo(canvas.width / 2, canvas.height - 10);
    ctx.stroke();
    ctx.restore();
  }

  function drawPaddle(x, y, color) {
    ctx.save();
    ctx.fillStyle = color;
    ctx.shadowColor = 'rgba(69,204,51,0.45)';
    ctx.shadowBlur = 10;
    ctx.fillRect(x, y, paddle.w, paddle.h);
    ctx.restore();
  }

  function drawBall() {
    ctx.save();
    ctx.fillStyle = '#ffe066';
    ctx.shadowColor = 'rgba(255,224,102,0.55)';
    ctx.shadowBlur = 14;
    ctx.beginPath();
    ctx.arc(ball.x, ball.y, 8, 0, Math.PI * 2);
    ctx.fill();
    ctx.restore();
  }

  function drawScore() {
    ctx.save();
    ctx.font = 'bold 28px Arial';
    ctx.fillStyle = '#ecfaeb';
    ctx.textAlign = 'center';
    ctx.fillText(playerScore, canvas.width / 2 - 40, 36);
    ctx.fillText(aiScore, canvas.width / 2 + 40, 36);
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
  canvas.addEventListener('pointerdown', () => { if (state === 'serve') startPlay(); });
  window.addEventListener('keydown', (e) => {
    if (e.key === 'w' || e.key === 'ArrowUp') { inputDir = -1; startPlay(); }
    if (e.key === 's' || e.key === 'ArrowDown') { inputDir = 1; startPlay(); }
  });
  window.addEventListener('keyup', (e) => {
    if (['w','s','ArrowUp','ArrowDown'].includes(e.key)) inputDir = 0;
  });
  resetBtn.addEventListener('click', resetMatch);
  window.addEventListener('resize', setCanvasSize);
  easyBtn.addEventListener('click', () => { difficulty = 'easy'; setCanvasSize(); resetMatch(); });
  midBtn.addEventListener('click', () => { difficulty = 'medium'; setCanvasSize(); resetMatch(); });
  hardBtn.addEventListener('click', () => { difficulty = 'hard'; setCanvasSize(); resetMatch(); });

  setCanvasSize();
  resetMatch();
  loop(last);
};

// ====== Energy Poker ======
window.initPoker = function() {
  const mount = document.getElementById('poker-game');
  if (!mount) return;
  mount.innerHTML = '';

  const shell = document.createElement('div');
  shell.className = 'game-shell';
  shell.innerHTML = `
    <div class="game-hud">
      <div class="hud-group">
        <div class="hud-pill"><span>You</span><strong id="poker-player-score">0</strong></div>
        <div class="hud-pill"><span>Dealer</span><strong id="poker-dealer-score">0</strong></div>
        <div class="hud-pill"><span>Ties</span><strong id="poker-ties">0</strong></div>
        <div class="hud-pill"><span>Charge</span><strong id="poker-charge">0</strong></div>
        <div class="hud-pill"><span>Best Streak</span><strong id="poker-best">${bestStreak}</strong></div>
      </div>
      <div class="hud-group">
        <button class="ghost-btn primary" id="poker-deal">Deal</button>
        <button class="ghost-btn" id="poker-overcharge">Overcharge (1)</button>
      </div>
    </div>
    <div class="poker-table">
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
    <div class="poker-actions">
      <span class="poker-tip" id="poker-tip">Pairs, straights, and flushes pay off. Best five-card hand wins.</span>
    </div>
  `;

  const playerEl = shell.querySelector('#poker-player-score');
  const dealerEl = shell.querySelector('#poker-dealer-score');
  const tiesEl = shell.querySelector('#poker-ties');
  const chargeEl = shell.querySelector('#poker-charge');
  const bestEl = shell.querySelector('#poker-best');
  const dealBtn = shell.querySelector('#poker-deal');
  const overchargeBtn = shell.querySelector('#poker-overcharge');
  const playerCardsEl = shell.querySelector('#player-cards');
  const dealerCardsEl = shell.querySelector('#dealer-cards');
  const playerResultEl = shell.querySelector('#player-result');
  const dealerResultEl = shell.querySelector('#dealer-result');
  const tipEl = shell.querySelector('#poker-tip');

  mount.appendChild(shell);

  const ranks = ['2','3','4','5','6','7','8','9','10','J','Q','K','A'];
  const suits = ['♠','♥','♦','♣'];
  const rankValue = { '2':2,'3':3,'4':4,'5':5,'6':6,'7':7,'8':8,'9':9,'10':10,'J':11,'Q':12,'K':13,'A':14 };

  let scores = { player: 0, dealer: 0, ties: 0 };
  let streak = Number(localStorage.getItem('poker_streak')) || 0;
  let bestStreak = Number(localStorage.getItem('poker_best_streak')) || 0;
  let autoDealTimer = null;
  let charge = Number(localStorage.getItem('poker_charge')) || 0;

  function updateStreak(winDelta) {
    if (winDelta > 0) streak += 1;
    else if (winDelta < 0) streak = 0;
    // ties do not change streak
    if (streak > bestStreak) {
      bestStreak = streak;
      localStorage.setItem('poker_best_streak', bestStreak);
    }
    localStorage.setItem('poker_streak', streak);
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
    hand.forEach(card => {
      const cardEl = document.createElement('div');
      const red = card.suit === '♥' || card.suit === '♦';
      cardEl.className = 'card' + (red ? ' red' : '');
      cardEl.innerHTML = `
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
      tipEl.textContent = `You win! Streak: ${streak + 1}. Charge +1 (now ${charge}).`;
      updateStreak(1);
    } else if (result < 0) {
      scores.dealer++;
      charge = Math.max(0, charge - 1);
      tipEl.textContent = 'Dealer takes it. Charge -1 and streak resets.';
      updateStreak(-1);
    } else {
      scores.ties++;
      tipEl.textContent = 'Tie. No charge change.';
    }
    playerEl.textContent = scores.player;
    dealerEl.textContent = scores.dealer;
    tiesEl.textContent = scores.ties;
    localStorage.setItem('poker_charge', charge);
    updateMeta();
    scheduleAutoDeal();
  }

  function applyOvercharge() {
    if (charge < 1) return;
    charge -= 1;
    localStorage.setItem('poker_charge', charge);
    tipEl.textContent = 'Overcharged: +20% hand strength this round.';
    overchargeBtn.classList.add('active');
    return 1.2;
  }

  overchargeBtn.addEventListener('click', () => {
    if (charge < 1) { overchargeBtn.disabled = true; return; }
    overchargeBtn.disabled = false;
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
