// ====== Flappy Cell (Energy Theme) ======

window.initFlappyCell = function() {
  const el = document.getElementById('flappycell-game');
  el.innerHTML = '';
  // Create canvas
  const canvas = document.createElement('canvas');
  canvas.width = 400;
  canvas.height = 600;
  canvas.style.background = 'var(--cell-bg)';
  canvas.style.display = 'block';
  canvas.style.margin = '0 auto';
  canvas.style.border = '4px solid var(--cell-border)';
  canvas.style.borderRadius = '18px';
  canvas.style.outline = '2.5px solid #0e2a0e';
  el.appendChild(canvas);

  // Game variables
  const ctx = canvas.getContext('2d');
  let cellY = canvas.height / 2;
  let cellX = 80;
  let velocity = 0;
  let gravity = 0.38; // easier gravity
  let flapPower = -7.5; // easier flap
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
        ctx.fillStyle = '#ffe066'; // yellow ball
  function drawStartScreen() {
        ctx.shadowColor = '#f7c948';
        ctx.shadowBlur = 16;
    // Vibrant green background
    ctx.fillStyle = '#184c19';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 44px Arial';
    ctx.fillStyle = '#ecfaeb';
    ctx.textAlign = 'center';
    ctx.fillText('Flappy Cell', canvas.width/2, 170);
    ctx.font = 'bold 24px Arial';
    ctx.fillStyle = '#daf5d6';
    ctx.fillText('Energy Engineering Edition', canvas.width/2, 210);
    ctx.font = '18px Arial';
    ctx.fillStyle = '#daf5d6';
    ctx.fillText('Click or press Space to start', canvas.width/2, 260);
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#6ad65c';
    ctx.fillText('Tip: Avoid battery bars!', canvas.width/2, 300);
    // Draw cell preview
    ctx.save();
    ctx.translate(canvas.width/2, 370);
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.fillStyle = '#45cc33';
    ctx.shadowColor = '#6ad65c';
    ctx.shadowBlur = 16;
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }
        ctx.fillStyle = '#26a644'; // vibrant green pipes
  function drawGameOver() {
    ctx.save();
    // Vibrant green background
    ctx.fillStyle = '#184c19';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.font = 'bold 44px Arial';
    ctx.fillStyle = '#ecfaeb';
    ctx.textAlign = 'center';
    ctx.fillText('Game Over!', canvas.width/2, 170);
    ctx.font = 'bold 26px Arial';
    ctx.fillStyle = '#daf5d6';
    ctx.fillText('Score: ' + score, canvas.width/2, 220);
    ctx.font = 'bold 20px Arial';
    ctx.fillStyle = '#6ad65c';
        ctx.fillStyle = '#184c19';
    ctx.font = '18px Arial';
    ctx.fillStyle = '#daf5d6';
    ctx.fillText('Click or press Space to restart', canvas.width/2, 295);
    ctx.font = 'bold 16px Arial';
    ctx.fillStyle = '#6ad65c';
    ctx.fillText('Tip: Try to beat your best score!', canvas.width/2, 330);
    // Draw cell preview
    ctx.save();
    ctx.translate(canvas.width/2, 400);
    ctx.beginPath();
    ctx.arc(0, 0, 28, 0, Math.PI * 2);
    ctx.fillStyle = '#45cc33';
    ctx.shadowColor = '#6ad65c';
    ctx.shadowBlur = 16;
    ctx.fill();
    ctx.restore();
    ctx.restore();
  }

  function drawBackground() {
    // Solid green background for gameplay
    ctx.save();
    ctx.fillStyle = '#184c19';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    // Also set body background to green
    document.body.style.background = '#184c19';
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
    const gap = 170; // easier gap
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
    if (frame % 110 === 0) addPipe(); // slower pipe spawn

    // Move pipes
    for (let pipe of pipes) {
      pipe.x -= 2.2; // slower pipe speed
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
