// === DOM refs ===
const grid = document.getElementById('grid');
const statusEl = document.getElementById('status');
const sx = document.getElementById('sx');
const so = document.getElementById('so');
const sd = document.getElementById('sd');
const themeBtn = document.getElementById('themeBtn');
const resetAllBtn = document.getElementById('resetAllBtn');
const newRoundBtn = document.getElementById('newRoundBtn');
const undoBtn = document.getElementById('undoBtn');

const confetti = document.getElementById('confetti');
const ctx = confetti.getContext('2d');

// === Constants ===
const WINS = [
  [0,1,2], [3,4,5], [6,7,8], // rows
  [0,3,6], [1,4,7], [2,5,8], // cols
  [0,4,8], [2,4,6]           // diags
];

// === State ===
let board, current, winner, history, starts = 'X';
let score = { X: 0, O: 0, D: 0 };

// === Build cells ===
const cells = [];
for (let i = 0; i < 9; i++) {
  const b = document.createElement('button');
  b.className = 'cell';
  b.setAttribute('role', 'gridcell');
  b.setAttribute('aria-label', `Cell ${i + 1}`);
  b.dataset.idx = i;
  b.addEventListener('click', () => play(i));
  cells.push(b);
  grid.appendChild(b);
}

// === Canvas size ===
function fitCanvas() {
  const r = grid.getBoundingClientRect();
  confetti.width = r.width;
  confetti.height = r.height;
}
addEventListener('resize', fitCanvas);
new ResizeObserver(fitCanvas).observe(grid);

// === Game ===
function resetRound() {
  board = Array(9).fill(null);
  history = [];
  winner = null;
  current = starts; // alternate starters each round
  cells.forEach(c => {
    c.textContent = '';
    c.classList.remove('x', 'o', 'win');
    c.disabled = false;
  });
  stopConfetti();
  updateStatus();
}

function updateStatus() {
  if (winner === 'D') statusEl.textContent = 'Draw — well played!';
  else if (winner) statusEl.textContent = `${winner} wins — gorgeous!`;
  else statusEl.textContent = `${current} to move`;
}

function play(i) {
  if (winner || board[i]) return;
  board[i] = current;
  history.push(i);

  const cell = cells[i];
  cell.textContent = current;
  cell.classList.add(current.toLowerCase());

  const res = checkWinner();
  if (res) {
    if (res === 'D') {
      winner = 'D';
      score.D++;
      sd.textContent = score.D;
      drawGlow();
    } else {
      winner = current;
      score[winner]++;
      (winner === 'X' ? sx : so).textContent = score[winner];
      res.forEach(idx => cells[idx].classList.add('win'));
      fireConfetti();
    }
    // lock board
    cells.forEach(c => c.disabled = true);
  } else {
    current = current === 'X' ? 'O' : 'X';
  }
  updateStatus();
}

function undo() {
  if (!history.length || winner) return; // don't undo after a finished round
  const last = history.pop();
  board[last] = null;
  const c = cells[last];
  c.textContent = '';
  c.classList.remove('x', 'o');
  current = current === 'X' ? 'O' : 'X';
  updateStatus();
}

function checkWinner() {
  for (const line of WINS) {
    const [a, b, c] = line;
    const v = board[a];
    if (v && v === board[b] && v === board[c]) return line;
  }
  if (board.every(Boolean)) return 'D';
  return null;
}

function newRound() {
  starts = starts === 'X' ? 'O' : 'X';
  resetRound();
}

function resetAll() {
  score = { X: 0, O: 0, D: 0 };
  sx.textContent = so.textContent = sd.textContent = '0';
  starts = 'X';
  resetRound();
}

// === Theme ===
function setTheme(light) {
  document.body.classList.toggle('light', light);
  themeBtn.setAttribute('aria-pressed', String(light));
  themeBtn.textContent = light ? '☀️ Theme' : '🌙 Theme';
}
themeBtn.addEventListener('click', () => setTheme(!document.body.classList.contains('light')));

// === Keyboard shortcuts ===
addEventListener('keydown', (e) => {
  const k = e.key.toLowerCase();
  if (k >= '1' && k <= '9') play(Number(k) - 1);
  else if (k === 'n') newRound();
  else if (k === 'r') resetAll();
  else if (k === 'u') undo();
});

// === Confetti ===
let rafId = null, pieces = [];
function fireConfetti() {
  fitCanvas();
  pieces = Array.from({ length: 140 }, () => ({
    x: Math.random() * confetti.width,
    y: -10 - Math.random() * 40,
    r: 5 + Math.random() * 6,
    vx: -1 + Math.random() * 2,
    vy: 2 + Math.random() * 3,
    rot: Math.random() * 360,
    vr: -4 + Math.random() * 8,
    color: Math.random() > .5
      ? getComputedStyle(document.documentElement).getPropertyValue('--accent-x')
      : getComputedStyle(document.documentElement).getPropertyValue('--accent-o')
  }));
  cancelAnimationFrame(rafId);
  animateConfetti();
  setTimeout(stopConfetti, 1600);
}
function drawGlow() {
  fitCanvas();
  ctx.clearRect(0, 0, confetti.width, confetti.height);
  const g = ctx.createRadialGradient(
    confetti.width / 2, confetti.height / 2, 20,
    confetti.width / 2, confetti.height / 2, Math.max(confetti.width, confetti.height) / 2
  );
  g.addColorStop(0, 'rgba(167,255,94,0.15)');
  g.addColorStop(1, 'rgba(167,255,94,0)');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, confetti.width, confetti.height);
  setTimeout(() => ctx.clearRect(0,0,confetti.width, confetti.height), 600);
}
function animateConfetti() {
  ctx.clearRect(0, 0, confetti.width, confetti.height);
  for (const p of pieces) {
    p.x += p.vx; p.y += p.vy; p.rot += p.vr;
    ctx.save();
    ctx.translate(p.x, p.y);
    ctx.rotate(p.rot * Math.PI / 180);
    ctx.fillStyle = p.color.trim();
    ctx.fillRect(-p.r / 2, -p.r / 2, p.r, p.r * 0.6);
    ctx.restore();
  }
  rafId = requestAnimationFrame(animateConfetti);
}
function stopConfetti() {
  cancelAnimationFrame(rafId);
  ctx.clearRect(0, 0, confetti.width, confetti.height);
  pieces = [];
}

// === Wire up buttons & init ===
resetAllBtn.addEventListener('click', resetAll);
newRoundBtn.addEventListener('click', newRound);
undoBtn.addEventListener('click', undo);

setTheme(false);   // start in dark neon
fitCanvas();
resetRound();
