const canvas = document.getElementById('pong');
const ctx = canvas.getContext('2d');

// UI Elements
const playerScoreSpan = document.getElementById('player-score');
const aiScoreSpan = document.getElementById('ai-score');
const gameOverDiv = document.getElementById('game-over');
const gameOverMessage = document.getElementById('game-over-message');
const restartBtn = document.getElementById('restart-btn');
const difficultySelect = document.getElementById('difficulty');
const pauseBtn = document.getElementById('pause-btn');

// Game settings
const WIDTH = canvas.width;
const HEIGHT = canvas.height;
const PADDLE_WIDTH = 12;
const PADDLE_HEIGHT = 90;
const PADDLE_MARGIN = 20;
const BALL_SIZE = 14;
const WIN_SCORE = 5;

// Difficulty levels
const DIFFICULTY = {
  easy:   { aiSpeed: 3, ballSpeed: 5 },
  medium: { aiSpeed: 5, ballSpeed: 6 },
  hard:   { aiSpeed: 8, ballSpeed: 8 }
};

let currentDifficulty = 'medium';
let PADDLE_SPEED = DIFFICULTY[currentDifficulty].aiSpeed;
let BALL_SPEED = DIFFICULTY[currentDifficulty].ballSpeed;

// Paddle positions
let leftPaddleY = (HEIGHT - PADDLE_HEIGHT) / 2;
let rightPaddleY = (HEIGHT - PADDLE_HEIGHT) / 2;

// Ball position and velocity
let ballX, ballY, ballVX, ballVY;

// Scores
let playerScore = 0;
let aiScore = 0;

// Game state
let isGameOver = false;
let isPaused = false;

// ==== SOUND EFFECTS ====
function playBeep(frequency, duration = 80, volume = 0.1) {
  try {
    const ctx = new (window.AudioContext || window.webkitAudioContext)();
    const oscillator = ctx.createOscillator();
    const gain = ctx.createGain();
    oscillator.type = 'square';
    oscillator.frequency.value = frequency;
    gain.gain.value = volume;
    oscillator.connect(gain);
    gain.connect(ctx.destination);
    oscillator.start();
    setTimeout(() => {
      oscillator.stop();
      ctx.close();
    }, duration);
  } catch (e) {}
}
function soundPaddle() { playBeep(400); }
function soundWall()   { playBeep(220); }
function soundScore()  { playBeep(100, 180, 0.2); }

// POWER-UP variables and functions
let powerUpActive = false;
let powerUp = null;
let powerUpType = "";
let powerUpTimer = 0;
let lastPowerUpTime = 0;
const POWER_UP_DURATION = 4000; // ms
const POWER_UP_RESPAWN_MIN = 4000; // ms
const POWER_UP_RESPAWN_MAX = 9000; // ms

function spawnPowerUp() {
  const marginX = 100;
  const marginY = 30;
  powerUp = {
    x: Math.random() * (WIDTH - 2 * marginX) + marginX,
    y: Math.random() * (HEIGHT - 2 * marginY) + marginY,
    radius: 16,
  };
  powerUpType = "speed";
  powerUpActive = true;
}

function drawPowerUp() {
  if (!powerUpActive || !powerUp) return;
  ctx.save();
  ctx.beginPath();
  ctx.arc(powerUp.x, powerUp.y, powerUp.radius, 0, Math.PI * 2);
  ctx.fillStyle = powerUpType === "speed" ? "#fd0" : "#0fd";
  ctx.shadowColor = "#fd0";
  ctx.shadowBlur = 12;
  ctx.fill();
  ctx.restore();
}

function checkPowerUpCollision() {
  if (!powerUpActive || !powerUp) return;
  const dx = (ballX + BALL_SIZE / 2) - powerUp.x;
  const dy = (ballY + BALL_SIZE / 2) - powerUp.y;
  const dist = Math.sqrt(dx * dx + dy * dy);
  if (dist < powerUp.radius + BALL_SIZE / 2) {
    triggerPowerUp(powerUpType);
    powerUpActive = false;
    powerUp = null;
    lastPowerUpTime = performance.now();
  }
}

function triggerPowerUp(type) {
  if (type === "speed") {
    BALL_SPEED *= 1.5;
    setBallSpeedFromDirection();
    powerUpTimer = performance.now();
  }
}

function updatePowerUpEffect() {
  if (BALL_SPEED > DIFFICULTY[currentDifficulty].ballSpeed) {
    if (performance.now() - powerUpTimer > POWER_UP_DURATION) {
      BALL_SPEED = DIFFICULTY[currentDifficulty].ballSpeed;
      setBallSpeedFromDirection();
    }
  }
}

function maybeSpawnPowerUp() {
  if (powerUpActive) return;
  if (performance.now() - lastPowerUpTime >
      (Math.random() * (POWER_UP_RESPAWN_MAX - POWER_UP_RESPAWN_MIN) + POWER_UP_RESPAWN_MIN)) {
    spawnPowerUp();
  }
}

function setBallSpeedFromDirection() {
  const direction = Math.sign(ballVX) || 1;
  const angle = Math.atan2(ballVY, ballVX);
  ballVX = BALL_SPEED * direction * Math.cos(angle);
  ballVY = BALL_SPEED * Math.sin(angle);
}

// === PARTICLE SYSTEM ===
const particles = [];

function spawnParticles(x, y, color = "#fff", count = 12) {
  for (let i = 0; i < count; i++) {
    const angle = Math.random() * Math.PI * 2;
    const speed = Math.random() * 3 + 2;
    particles.push({
      x,
      y,
      vx: Math.cos(angle) * speed,
      vy: Math.sin(angle) * speed,
      alpha: 1,
      color,
      radius: Math.random() * 2.5 + 1
    });
  }
}

function updateParticles() {
  for (let i = particles.length - 1; i >= 0; i--) {
    const p = particles[i];
    p.x += p.vx;
    p.y += p.vy;
    p.vx *= 0.96;
    p.vy *= 0.96;
    p.alpha *= 0.92;
    if (p.alpha < 0.05) {
      particles.splice(i, 1);
    }
  }
}

function drawParticles() {
  for (const p of particles) {
    ctx.save();
    ctx.globalAlpha = p.alpha;
    ctx.beginPath();
    ctx.arc(p.x, p.y, p.radius, 0, Math.PI * 2);
    ctx.fillStyle = p.color;
    ctx.fill();
    ctx.restore();
  }
}

// Mouse control for left paddle
canvas.addEventListener('mousemove', (e) => {
  if (isGameOver || isPaused) return;
  const rect = canvas.getBoundingClientRect();
  const mouseY = e.clientY - rect.top;
  leftPaddleY = mouseY - PADDLE_HEIGHT / 2;
  clampPaddles();
});

// TOUCH SUPPORT for mobile
canvas.addEventListener('touchstart', handleTouch, {passive: false});
canvas.addEventListener('touchmove', handleTouch, {passive: false});
function handleTouch(e) {
  if (isGameOver || isPaused) return;
  e.preventDefault();
  const rect = canvas.getBoundingClientRect();
  let touch = e.touches[0];
  let touchY = touch.clientY - rect.top;
  leftPaddleY = touchY - PADDLE_HEIGHT / 2;
  clampPaddles();
}

// Difficulty selection
difficultySelect.addEventListener('change', (e) => {
  currentDifficulty = e.target.value;
  PADDLE_SPEED = DIFFICULTY[currentDifficulty].aiSpeed;
  BALL_SPEED = DIFFICULTY[currentDifficulty].ballSpeed;
  restartGame();
});

// PAUSE/RESUME logic
pauseBtn.addEventListener('click', () => {
  if (isGameOver) return;
  isPaused = !isPaused;
  pauseBtn.textContent = isPaused ? "Resume" : "Pause";
});
document.addEventListener('keydown', (e) => {
  if (e.code === "Space" && !isGameOver) {
    isPaused = !isPaused;
    pauseBtn.textContent = isPaused ? "Resume" : "Pause";
  }
});

// Keep paddles inside the field
function clampPaddles() {
  leftPaddleY = Math.max(0, Math.min(HEIGHT - PADDLE_HEIGHT, leftPaddleY));
  rightPaddleY = Math.max(0, Math.min(HEIGHT - PADDLE_HEIGHT, rightPaddleY));
}

// Simple AI for right paddle
function updateAIPaddle() {
  if (isGameOver || isPaused) return;
  const paddleCenter = rightPaddleY + PADDLE_HEIGHT / 2;
  if (ballY + BALL_SIZE / 2 < paddleCenter - 8) {
    rightPaddleY -= PADDLE_SPEED;
  } else if (ballY + BALL_SIZE / 2 > paddleCenter + 8) {
    rightPaddleY += PADDLE_SPEED;
  }
  clampPaddles();
}

// Draw everything
function draw() {
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Draw net
  ctx.setLineDash([8, 16]);
  ctx.strokeStyle = '#fff4';
  ctx.beginPath();
  ctx.moveTo(WIDTH / 2, 0);
  ctx.lineTo(WIDTH / 2, HEIGHT);
  ctx.stroke();
  ctx.setLineDash([]);

  // Draw paddles
  ctx.fillStyle = "#fff";
  ctx.fillRect(PADDLE_MARGIN, leftPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT);
  ctx.fillRect(WIDTH - PADDLE_MARGIN - PADDLE_WIDTH, rightPaddleY, PADDLE_WIDTH, PADDLE_HEIGHT);

  // Draw ball
  ctx.beginPath();
  ctx.arc(ballX + BALL_SIZE / 2, ballY + BALL_SIZE / 2, BALL_SIZE / 2, 0, Math.PI * 2);
  ctx.fill();

  // Draw power-up
  drawPowerUp();

  // Draw particles
  drawParticles();

  // Draw pause overlay
  if (isPaused && !isGameOver) {
    ctx.save();
    ctx.globalAlpha = 0.6;
    ctx.fillStyle = "#111";
    ctx.fillRect(0, 0, WIDTH, HEIGHT);
    ctx.globalAlpha = 1;
    ctx.fillStyle = "#fff";
    ctx.font = "48px Arial";
    ctx.textAlign = "center";
    ctx.fillText("Paused", WIDTH / 2, HEIGHT / 2);
    ctx.restore();
  }
}

// Ball movement and collisions
function updateBall() {
  if (isGameOver || isPaused) return;
  ballX += ballVX;
  ballY += ballVY;

  // Top/bottom collision
  if (ballY <= 0) {
    ballY = 0;
    ballVY *= -1;
    soundWall();
    spawnParticles(ballX + BALL_SIZE / 2, BALL_SIZE / 2, "#00f");
  }
  if (ballY + BALL_SIZE >= HEIGHT) {
    ballY = HEIGHT - BALL_SIZE;
    ballVY *= -1;
    soundWall();
    spawnParticles(ballX + BALL_SIZE / 2, HEIGHT - BALL_SIZE / 2, "#00f");
  }

  // Left paddle collision
  if (
    ballX <= PADDLE_MARGIN + PADDLE_WIDTH &&
    ballY + BALL_SIZE >= leftPaddleY &&
    ballY <= leftPaddleY + PADDLE_HEIGHT
  ) {
    ballX = PADDLE_MARGIN + PADDLE_WIDTH;
    ballVX *= -1.05;
    ballVY += ((ballY + BALL_SIZE/2) - (leftPaddleY + PADDLE_HEIGHT/2)) * 0.15;
    setBallSpeedFromDirection();
    soundPaddle();
    spawnParticles(PADDLE_MARGIN + PADDLE_WIDTH, ballY + BALL_SIZE / 2, "#fff");
  }

  // Right paddle collision
  if (
    ballX + BALL_SIZE >= WIDTH - PADDLE_MARGIN - PADDLE_WIDTH &&
    ballY + BALL_SIZE >= rightPaddleY &&
    ballY <= rightPaddleY + PADDLE_HEIGHT
  ) {
    ballX = WIDTH - PADDLE_MARGIN - PADDLE_WIDTH - BALL_SIZE;
    ballVX *= -1.05;
    ballVY += ((ballY + BALL_SIZE/2) - (rightPaddleY + PADDLE_HEIGHT/2)) * 0.15;
    setBallSpeedFromDirection();
    soundPaddle();
    spawnParticles(WIDTH - PADDLE_MARGIN - PADDLE_WIDTH, ballY + BALL_SIZE / 2, "#fff");
  }

  // Power-up collision
  checkPowerUpCollision();

  // Scoring
  if (ballX < -BALL_SIZE) {
    aiScore++;
    updateScoreboard();
    checkGameOver();
    soundScore();
    resetBall(-1);
    spawnParticles(ballX + BALL_SIZE / 2, ballY + BALL_SIZE / 2, "#fd0", 24);
  } else if (ballX > WIDTH + BALL_SIZE) {
    playerScore++;
    updateScoreboard();
    checkGameOver();
    soundScore();
    resetBall(1);
    spawnParticles(ballX + BALL_SIZE / 2, ballY + BALL_SIZE / 2, "#fd0", 24);
  }
}

function updateScoreboard() {
  playerScoreSpan.textContent = playerScore;
  aiScoreSpan.textContent = aiScore;
}

function checkGameOver() {
  if (playerScore >= WIN_SCORE || aiScore >= WIN_SCORE) {
    isGameOver = true;
    showGameOver();
  }
}

function showGameOver() {
  canvas.style.opacity = "0.3";
  gameOverDiv.style.display = "block";
  if (playerScore > aiScore) {
    gameOverMessage.textContent = "You Win! 🎉";
  } else {
    gameOverMessage.textContent = "AI Wins! 🤖";
  }
}

function hideGameOver() {
  canvas.style.opacity = "1";
  gameOverDiv.style.display = "none";
}

// Reset game state
function restartGame() {
  playerScore = 0;
  aiScore = 0;
  leftPaddleY = (HEIGHT - PADDLE_HEIGHT) / 2;
  rightPaddleY = (HEIGHT - PADDLE_HEIGHT) / 2;
  isGameOver = false;
  isPaused = false;
  pauseBtn.textContent = "Pause";
  updateScoreboard();
  hideGameOver();
  resetBall(1);
}

restartBtn.addEventListener('click', restartGame);

function resetBall(direction = 1) {
  ballX = WIDTH / 2 - BALL_SIZE / 2;
  ballY = HEIGHT / 2 - BALL_SIZE / 2;
  let angle = Math.random() * Math.PI / 4 - Math.PI / 8;
  let speed = BALL_SPEED;
  ballVX = speed * direction * Math.cos(angle);
  ballVY = speed * (Math.random() > 0.5 ? 1 : -1) * Math.abs(Math.sin(angle));
}

// Main game loop
function loop() {
  updateAIPaddle();
  updateBall();
  updatePowerUpEffect();
  maybeSpawnPowerUp();
  updateParticles();
  draw();
  requestAnimationFrame(loop);
}

// Initialize difficulty and start game
PADDLE_SPEED = DIFFICULTY[currentDifficulty].aiSpeed;
BALL_SPEED = DIFFICULTY[currentDifficulty].ballSpeed;
updateScoreboard();
restartGame();
loop();
