
// ====== Flappy Cell (Energy Theme) ======

window.initFlappyCell = function() {
  const el = document.getElementById('flappycell-game');
  el.innerHTML = '';
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 600;
  canvas.style.background = 'var(--background-100)';
  canvas.style.display = 'block';
  canvas.style.margin = '0 auto';
  canvas.style.border = '2px solid var(--primary-600)';
  el.appendChild(canvas);


  // Game variables
  const ctx = canvas.getContext('2d');
  let cellY = canvas.height / 2;
  let cellX = 80;
  let velocity = 0;
  let gravity = 0.5;
  let flapPower = -8;
  let pipes = [];
  let frame = 0;
  let score = 0;
  let gameOver = false;
  let started = false;
  let bestScore = Number(localStorage.getItem('flappycell_best')) || 0;

  // Energy theme: cell is a green solar cell, pipes are battery bars, background has energy icons
  function drawCell() {
    ctx.save();
    ctx.beginPath();
    ctx.arc(cellX, cellY, 20, 0, Math.PI * 2);
    ctx.fillStyle = 'var(--primary-500)';
    ctx.shadowColor = 'var(--accent-600)';
    ctx.shadowBlur = 10;
    ctx.fill();
    ctx.restore();
    // Draw solar panel lines
    ctx.save();
    ctx.strokeStyle = 'var(--accent-400)';
    ctx.lineWidth = 2;
    for (let i = -2; i <= 2; i++) {
      ctx.beginPath();
      ctx.moveTo(cellX-15, cellY+i*4);
      ctx.lineTo(cellX+15, cellY+i*4);
      ctx.stroke();
    }
    ctx.restore();
    // Draw lightning bolt
    ctx.save();
    ctx.strokeStyle = 'var(--accent-500)';
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(cellX-5, cellY-10);
    ctx.lineTo(cellX+2, cellY);
    ctx.lineTo(cellX-8, cellY);
    ctx.lineTo(cellX+5, cellY+10);
    ctx.stroke();
    ctx.restore();
  }

  function drawPipe(pipe) {
    ctx.save();
    ctx.fillStyle = 'var(--secondary-600)';
    // Top battery
    ctx.fillRect(pipe.x, 0, pipe.width, pipe.top);
    // Bottom battery
    ctx.fillRect(pipe.x, pipe.bottom, pipe.width, canvas.height - pipe.bottom);
    // Battery caps
    ctx.fillStyle = 'var(--secondary-400)';
    ctx.fillRect(pipe.x, pipe.top-8, pipe.width, 8);
    ctx.fillRect(pipe.x, pipe.bottom, pipe.width, 8);
    // Draw energy icon on pipe
    ctx.save();
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = 'var(--accent-500)';
    ctx.fillText('🔋', pipe.x+10, pipe.top-12);
    ctx.fillText('🔋', pipe.x+10, pipe.bottom+24);
    ctx.restore();
    ctx.restore();
  }

  function drawScore() {
    ctx.save();
    ctx.font = 'bold 32px Arial';
    ctx.fillStyle = 'var(--primary-700)';
    ctx.textAlign = 'center';
    ctx.fillText(score, canvas.width/2, 60);
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = 'var(--accent-700)';
    ctx.fillText('Best: ' + bestScore, canvas.width/2, 90);
    ctx.restore();
  }

  function drawStartScreen() {
    ctx.save();
    ctx.fillStyle = 'var(--background-200)';
    ctx.globalAlpha = 0.95;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
    ctx.font = 'bold 38px Arial';
    ctx.fillStyle = 'var(--primary-700)';
    ctx.textAlign = 'center';
    ctx.fillText('Flappy Cell', canvas.width/2, 180);
    ctx.font = 'bold 22px Arial';
    ctx.fillStyle = 'var(--accent-600)';
    ctx.fillText('Energy Engineering Edition', canvas.width/2, 220);
    ctx.font = '18px Arial';
    ctx.fillStyle = 'var(--text-900)';
    ctx.fillText('Click or press Space to start', canvas.width/2, 270);
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = 'var(--primary-600)';
    ctx.fillText('Tip: Avoid battery bars!', canvas.width/2, 320);
    ctx.restore();
    // Draw cell preview
    ctx.save();
    ctx.translate(canvas.width/2, 370);
    drawCell();
    ctx.restore();
  }

  function drawGameOver() {
    ctx.save();
    ctx.fillStyle = 'var(--background-200)';
    ctx.globalAlpha = 0.95;
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalAlpha = 1;
    ctx.font = 'bold 40px Arial';
    ctx.fillStyle = 'var(--accent-700)';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', canvas.width/2, 180);
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = 'var(--primary-700)';
    ctx.fillText('Score: ' + score, canvas.width/2, 230);
    ctx.font = 'bold 18px Arial';
    ctx.fillStyle = 'var(--accent-700)';
    ctx.fillText('Best: ' + bestScore, canvas.width/2, 260);
    ctx.font = '16px Arial';
    ctx.fillStyle = 'var(--text-900)';
    ctx.fillText('Click or press Space to restart', canvas.width/2, 300);
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = 'var(--primary-600)';
    ctx.fillText('Tip: Avoid battery bars!', canvas.width/2, 340);
    ctx.restore();
    // Draw cell preview
    ctx.save();
    ctx.translate(canvas.width/2, 400);
    drawCell();
    ctx.restore();
  }

  function drawBackground() {
    // Draw subtle energy icons in background
    ctx.save();
    ctx.globalAlpha = 0.08;
    ctx.font = 'bold 80px Arial';
    ctx.fillStyle = 'var(--accent-600)';
    for (let i = 0; i < 5; i++) {
      ctx.fillText('⚡', 60 + i*70, 120);
      ctx.fillText('🔋', 30 + i*80, 500);
    }
    ctx.globalAlpha = 1;
    ctx.restore();
  }

  function resetGame() {
    cellY = canvas.height / 2;
    velocity = 0;
    pipes = [];
    frame = 0;
    score = 0;
    gameOver = false;
    started = false;
  }

  function addPipe() {
    const gap = 130;
    const minHeight = 60;
    const maxHeight = canvas.height - gap - minHeight;
    const top = Math.floor(Math.random() * (maxHeight - minHeight + 1)) + minHeight;
    pipes.push({
      x: canvas.width,
      width: 50,
      top: top,
      bottom: top + gap,
      passed: false
    });
  }

  function update() {
    if (!started || gameOver) return;
    velocity += gravity;
    cellY += velocity;
    frame++;

    // Add pipes
    if (frame % 90 === 0) addPipe();

    // Move pipes
    for (let pipe of pipes) {
      pipe.x -= 3;
    }
    // Remove off-screen pipes
    pipes = pipes.filter(pipe => pipe.x + pipe.width > 0);

    // Collision
    for (let pipe of pipes) {
      if (
        cellX + 20 > pipe.x && cellX - 20 < pipe.x + pipe.width &&
        (cellY - 20 < pipe.top || cellY + 20 > pipe.bottom)
      ) {
        gameOver = true;
        if (score > bestScore) {
          bestScore = score;
          localStorage.setItem('flappycell_best', bestScore);
        }
      }
      // Score
      if (!pipe.passed && pipe.x + pipe.width < cellX) {
        score++;
        pipe.passed = true;
      }
    }
    // Out of bounds
    if (cellY + 20 > canvas.height || cellY - 20 < 0) {
      gameOver = true;
      if (score > bestScore) {
        bestScore = score;
        localStorage.setItem('flappycell_best', bestScore);
      }
    }
  }

  function draw() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    drawBackground();
    if (!started) {
      drawStartScreen();
      return;
    }
    for (let pipe of pipes) drawPipe(pipe);
    drawCell();
    drawScore();
    if (gameOver) drawGameOver();
  }

  function loop() {
    update();
    draw();
    requestAnimationFrame(loop);
  }

  function flap() {
    if (!started) {
      started = true;
      velocity = flapPower;
      return;
    }
    if (gameOver) {
      resetGame();
      started = true;
      velocity = flapPower;
      return;
    }
    velocity = flapPower;
  }

  canvas.addEventListener('mousedown', flap);
  window.addEventListener('keydown', function(e) {
    if (e.code === 'Space') {
      flap();
    }
  });

  resetGame();
  loop();
};

// ====== Snake Stub ======
window.initSnake = function() {
  const el = document.getElementById('snake-game');
  el.innerHTML = '<p>Snake game coming soon!</p>';
};

// ====== Energy Pong Stub ======
window.initEnergyPong = function() {
  const el = document.getElementById('energypong-game');
  el.innerHTML = '<p>Energy Pong game coming soon!</p>';
};


// ====== Poker Stub ======
window.initPoker = function() {
  const el = document.getElementById('poker-game');
  el.innerHTML = '<p>Poker game coming soon!</p>';
};
