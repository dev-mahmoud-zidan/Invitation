document.addEventListener('DOMContentLoaded', () => {
    const trigger = document.getElementById('envelope-trigger');
    const envelope = document.getElementById('envelope');
    const heroSection = document.getElementById('hero-envelope');
    const mainContent = document.getElementById('main-content');
    const bgMusic = document.getElementById('bg-music');
    const musicToggle = document.getElementById('music-toggle');

    let isAnimating = false;

    if (trigger && envelope) {
        trigger.addEventListener('click', () => {
            if (isAnimating) return;
            isAnimating = true;

            envelope.classList.add('open');

            requestAnimationFrame(() => {
                setTimeout(() => {
                    if (bgMusic) {
                        bgMusic.play().catch(() => {});
                        if (musicToggle) {
                            musicToggle.classList.remove('hidden');
                        }
                    }

                    if (mainContent) {
                        mainContent.classList.add('show-content');
                    }

                    if (heroSection) {
                        heroSection.classList.add('fade-out');
                    }

                    document.body.style.overflowY = 'auto';

                    setTimeout(() => {
                        if (heroSection) {
                            heroSection.style.display = 'none';
                        }
                        if (document.getElementById('mazeCanvas')) {
                            initMazeGame();
                        }
                    }, 1500);
                }, 2000);
            });
        });
    }

    if (musicToggle && bgMusic) {
        musicToggle.addEventListener('click', () => {
            if (bgMusic.paused) {
                bgMusic.play();
                musicToggle.classList.remove('muted');
            } else {
                bgMusic.pause();
                musicToggle.classList.add('muted');
            }
        });
    }
});

function initMazeGame() {
    const canvas = document.getElementById('mazeCanvas');
    const ctx = canvas.getContext('2d');
    const upBtn = document.getElementById('maze-up');
    const downBtn = document.getElementById('maze-down');
    const leftBtn = document.getElementById('maze-left');
    const rightBtn = document.getElementById('maze-right');
    const modal = document.getElementById('maze-modal');
    const continueBtn = document.getElementById('continue-to-next');
    const replayBtn = document.getElementById('replay-maze-btn');
    const storySection = document.getElementById('story-section');
    const mazeWrapper = document.getElementById('maze-game-wrapper');
    const startOverlay = document.getElementById('maze-start-overlay');
    const startBtn = document.getElementById('start-maze-btn');
    const hintBtn = document.getElementById('maze-hint-btn');
    const resetBtn = document.getElementById('maze-reset-btn');
    const solveBtn = document.getElementById('maze-solve-btn');
    const diffBtns = document.querySelectorAll('.diff-btn');

    const timerEl = document.getElementById('maze-timer');
    const movesEl = document.getElementById('maze-moves');
    const heartsEl = document.getElementById('maze-hearts');
    const heartsTotalEl = document.getElementById('maze-hearts-total');
    const scoreEl = document.getElementById('maze-score');
    const finalTimeEl = document.getElementById('final-time');
    const finalMovesEl = document.getElementById('final-moves');
    const finalHeartsEl = document.getElementById('final-hearts');
    const finalScoreEl = document.getElementById('final-score');

    const DIFFICULTY = {
        easy: { size: 7, hearts: 2 },
        medium: { size: 11, hearts: 4 },
        hard: { size: 15, hearts: 6 }
    };

    let currentDifficulty = 'easy';
    let gridSize = DIFFICULTY[currentDifficulty].size;
    let cellSize = 25;
    let maze = [];
    let playerPos = { x: 0, y: 0 };
    let playerDisplayPos = { x: 0, y: 0 };
    let endPos = { x: 0, y: 0 };
    let hearts = [];
    let heartsCollected = 0;
    let trail = [];
    let moves = 0;
    let score = 0;
    let timerInterval = null;
    let startTime = null;
    let elapsedSeconds = 0;
    let gameStarted = false;
    let gameEnded = false;
    let solutionPath = [];
    let showSolution = false;
    let hintCell = null;
    let hintTimeout = null;
    let particles = [];
    let animFrame = null;
    let mazeSection = document.getElementById('maze-section');
    let mazeVisible = true;
    let pageHidden = false;
    let cachedBgGrad = null;
    let cachedBgGradSize = { w: 0, h: 0 };
    let cachedWallGrad = null;
    let cachedWallGradSize = 0;
    let lastDrawTime = 0;
    const MIN_DRAW_INTERVAL = 16;

    const groomImg = new Image();
    groomImg.src = './image/1.jpg';
    
    const brideImg = new Image();
    brideImg.src = './image/2.jpg';

    function generateMaze(size) {
        const cellCount = size;
        const cells = [];
        for (let y = 0; y < cellCount; y++) {
            cells[y] = [];
            for (let x = 0; x < cellCount; x++) {
                cells[y][x] = {
                    visited: false,
                    walls: { top: true, right: true, bottom: true, left: true }
                };
            }
        }

        const stack = [];
        const startX = 0, startY = 0;
        cells[startY][startX].visited = true;
        stack.push({ x: startX, y: startY });

        while (stack.length > 0) {
            const current = stack[stack.length - 1];
            const neighbors = [];
            const dirs = [
                { dx: 0, dy: -1, wall: 'top', opposite: 'bottom' },
                { dx: 1, dy: 0, wall: 'right', opposite: 'left' },
                { dx: 0, dy: 1, wall: 'bottom', opposite: 'top' },
                { dx: -1, dy: 0, wall: 'left', opposite: 'right' }
            ];

            for (const dir of dirs) {
                const nx = current.x + dir.dx;
                const ny = current.y + dir.dy;
                if (nx >= 0 && nx < cellCount && ny >= 0 && ny < cellCount && !cells[ny][nx].visited) {
                    neighbors.push({ x: nx, y: ny, dir });
                }
            }

            if (neighbors.length > 0) {
                const next = neighbors[Math.floor(Math.random() * neighbors.length)];
                cells[current.y][current.x].walls[next.dir.wall] = false;
                cells[next.y][next.x].walls[next.dir.opposite] = false;
                cells[next.y][next.x].visited = true;
                stack.push({ x: next.x, y: next.y });
            } else {
                stack.pop();
            }
        }

        const mazeGrid = [];
        const gridDim = cellCount * 2 + 1;
        for (let y = 0; y < gridDim; y++) {
            mazeGrid[y] = new Array(gridDim).fill(1);
        }

        for (let y = 0; y < cellCount; y++) {
            for (let x = 0; x < cellCount; x++) {
                const gx = x * 2 + 1;
                const gy = y * 2 + 1;
                mazeGrid[gy][gx] = 0;
                if (!cells[y][x].walls.top) mazeGrid[gy - 1][gx] = 0;
                if (!cells[y][x].walls.right) mazeGrid[gy][gx + 1] = 0;
                if (!cells[y][x].walls.bottom) mazeGrid[gy + 1][gx] = 0;
                if (!cells[y][x].walls.left) mazeGrid[gy][gx - 1] = 0;
            }
        }

        return mazeGrid;
    }

    function findPath(mazeGrid, start, end) {
        const rows = mazeGrid.length;
        const cols = mazeGrid[0].length;
        const queue = [{ x: start.x, y: start.y, path: [{ x: start.x, y: start.y }] }];
        const visited = new Set();
        visited.add(`${start.x},${start.y}`);

        while (queue.length > 0) {
            const current = queue.shift();
            if (current.x === end.x && current.y === end.y) {
                return current.path;
            }
            const dirs = [[0, -1], [1, 0], [0, 1], [-1, 0]];
            for (const [dx, dy] of dirs) {
                const nx = current.x + dx;
                const ny = current.y + dy;
                const key = `${nx},${ny}`;
                if (nx >= 0 && nx < cols && ny >= 0 && ny < rows && mazeGrid[ny][nx] === 0 && !visited.has(key)) {
                    visited.add(key);
                    queue.push({ x: nx, y: ny, path: [...current.path, { x: nx, y: ny }] });
                }
            }
        }
        return [];
    }

    function placeHearts() {
        hearts = [];
        const count = DIFFICULTY[currentDifficulty].hearts;
        const pathCells = [];
        for (let y = 0; y < maze.length; y++) {
            for (let x = 0; x < maze[0].length; x++) {
                if (maze[y][x] === 0 && !(x === playerPos.x && y === playerPos.y) && !(x === endPos.x && y === endPos.y)) {
                    pathCells.push({ x, y });
                }
            }
        }
        const shuffled = pathCells.sort(() => Math.random() - 0.5);
        for (let i = 0; i < Math.min(count, shuffled.length); i++) {
            hearts.push({ ...shuffled[i], collected: false, pulse: Math.random() * Math.PI * 2 });
        }
    }

    function initGame() {
        gridSize = DIFFICULTY[currentDifficulty].size;
        maze = generateMaze(gridSize);
        const actualSize = maze.length;
        playerPos = { x: 1, y: 1 };
        playerDisplayPos = { x: 1, y: 1 };
        endPos = { x: actualSize - 2, y: actualSize - 2 };
        trail = [{ x: 1, y: 1 }];
        moves = 0;
        heartsCollected = 0;
        score = 0;
        elapsedSeconds = 0;
        gameStarted = false;
        gameEnded = false;
        showSolution = false;
        hintCell = null;
        particles = [];

        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }

        placeHearts();
        solutionPath = findPath(maze, playerPos, endPos);

        resizeCanvas();
        updateHUD();
        startOverlay.classList.remove('hidden');
        drawMaze();
    }

    function startGame() {
        if (gameStarted) return;
        gameStarted = true;
        startTime = Date.now();
        startOverlay.classList.add('hidden');
        timerInterval = setInterval(() => {
            elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
            updateHUD();
        }, 1000);
    }

    function resizeCanvas() {
        const containerWidth = mazeWrapper.clientWidth;
        const availableWidth = Math.min(containerWidth - 40, 450);
        cellSize = Math.max(12, Math.floor(availableWidth / maze.length));
        canvas.width = maze.length * cellSize;
        canvas.height = maze.length * cellSize;
        cachedBgGrad = null;
        cachedWallGrad = null;
        drawMaze();
    }

    let resizeTimer = null;
    window.addEventListener('resize', () => {
        if (resizeTimer) clearTimeout(resizeTimer);
        resizeTimer = setTimeout(resizeCanvas, 120);
    }, { passive: true });

    function formatTime(sec) {
        const m = Math.floor(sec / 60).toString().padStart(2, '0');
        const s = (sec % 60).toString().padStart(2, '0');
        return `${m}:${s}`;
    }

    function updateHUD() {
        if (timerEl) timerEl.textContent = formatTime(elapsedSeconds);
        if (movesEl) movesEl.textContent = moves;
        if (heartsEl) heartsEl.textContent = heartsCollected;
        if (heartsTotalEl) heartsTotalEl.textContent = hearts.length;
        if (scoreEl) scoreEl.textContent = score;
    }

    function getBgGradient() {
        if (cachedBgGrad && cachedBgGradSize.w === canvas.width && cachedBgGradSize.h === canvas.height) {
            return cachedBgGrad;
        }
        cachedBgGrad = ctx.createLinearGradient(0, 0, canvas.width, canvas.height);
        cachedBgGrad.addColorStop(0, '#04111c');
        cachedBgGrad.addColorStop(0.5, '#082034');
        cachedBgGrad.addColorStop(1, '#04111c');
        cachedBgGradSize = { w: canvas.width, h: canvas.height };
        return cachedBgGrad;
    }

    function drawMaze() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);

        ctx.fillStyle = getBgGradient();
        ctx.fillRect(0, 0, canvas.width, canvas.height);

        if (showSolution && solutionPath.length > 0) {
            ctx.fillStyle = 'rgba(197, 168, 128, 0.15)';
            for (const cell of solutionPath) {
                ctx.fillRect(cell.x * cellSize, cell.y * cellSize, cellSize, cellSize);
            }
        }

        if (hintCell) {
            ctx.fillStyle = 'rgba(255, 215, 0, 0.3)';
            ctx.fillRect(hintCell.x * cellSize, hintCell.y * cellSize, cellSize, cellSize);
            ctx.strokeStyle = '#ffd700';
            ctx.lineWidth = 2;
            ctx.strokeRect(hintCell.x * cellSize + 1, hintCell.y * cellSize + 1, cellSize - 2, cellSize - 2);
        }

        if (trail.length > 1) {
            ctx.strokeStyle = 'rgba(197, 168, 128, 0.35)';
            ctx.lineWidth = Math.max(2, cellSize * 0.25);
            ctx.lineCap = 'round';
            ctx.lineJoin = 'round';
            ctx.beginPath();
            for (let i = 0; i < trail.length; i++) {
                const px = trail[i].x * cellSize + cellSize / 2;
                const py = trail[i].y * cellSize + cellSize / 2;
                if (i === 0) ctx.moveTo(px, py);
                else ctx.lineTo(px, py);
            }
            ctx.stroke();
        }

        ctx.fillStyle = '#124c68';
        for (let y = 0; y < maze.length; y++) {
            for (let x = 0; x < maze[0].length; x++) {
                if (maze[y][x] === 1) {
                    const wx = x * cellSize;
                    const wy = y * cellSize;
                    ctx.fillRect(wx + 1, wy + 1, cellSize - 2, cellSize - 2);
                }
            }
        }

        ctx.shadowBlur = 3;
        ctx.shadowColor = '#00c3ff';
        ctx.strokeStyle = 'rgba(0, 195, 255, 0.55)';
        ctx.lineWidth = 1;
        for (let y = 0; y < maze.length; y++) {
            for (let x = 0; x < maze[0].length; x++) {
                if (maze[y][x] === 1) {
                    const wx = x * cellSize;
                    const wy = y * cellSize;
                    ctx.strokeRect(wx + 1, wy + 1, cellSize - 2, cellSize - 2);
                }
            }
        }
        ctx.shadowBlur = 0;

        for (const heart of hearts) {
            if (heart.collected) continue;
            heart.pulse += 0.08;
            const scale = 1 + Math.sin(heart.pulse) * 0.15;
            const hx = heart.x * cellSize + cellSize / 2;
            const hy = heart.y * cellSize + cellSize / 2;
            const hr = (cellSize * 0.3) * scale;

            ctx.save();
            ctx.translate(hx, hy);
            ctx.shadowBlur = 8;
            ctx.shadowColor = '#ff4d6d';
            ctx.fillStyle = '#ff4d6d';
            ctx.beginPath();
            ctx.moveTo(0, hr * 0.3);
            ctx.bezierCurveTo(-hr, -hr * 0.3, -hr, -hr, 0, -hr * 0.3);
            ctx.bezierCurveTo(hr, -hr, hr, -hr * 0.3, 0, hr * 0.3);
            ctx.fill();
            ctx.restore();
        }

        drawParticles();

        const endX = endPos.x * cellSize + cellSize / 2;
        const endY = endPos.y * cellSize + cellSize / 2;
        const glowR = cellSize / 2 + 4 + Math.sin(Date.now() / 300) * 3;
        const endGrad = ctx.createRadialGradient(endX, endY, 0, endX, endY, glowR);
        endGrad.addColorStop(0, 'rgba(197, 168, 128, 0.4)');
        endGrad.addColorStop(1, 'rgba(197, 168, 128, 0)');
        ctx.fillStyle = endGrad;
        ctx.fillRect(endPos.x * cellSize - cellSize, endPos.y * cellSize - cellSize, cellSize * 3, cellSize * 3);
        drawCircularImage(brideImg, endX, endY, cellSize / 2 - 1, '#C5A880');

        const px = playerDisplayPos.x * cellSize + cellSize / 2;
        const py = playerDisplayPos.y * cellSize + cellSize / 2;
        const pGrad = ctx.createRadialGradient(px, py, 0, px, py, cellSize * 0.7);
        pGrad.addColorStop(0, 'rgba(0, 195, 255, 0.35)');
        pGrad.addColorStop(1, 'rgba(0, 195, 255, 0)');
        ctx.fillStyle = pGrad;
        ctx.fillRect(playerDisplayPos.x * cellSize - cellSize, playerDisplayPos.y * cellSize - cellSize, cellSize * 3, cellSize * 3);
        drawCircularImage(groomImg, px, py, cellSize / 2 - 1, '#00c3ff');
    }

    function drawCircularImage(img, x, y, radius, borderColor) {
        ctx.save();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.closePath();
        ctx.clip();
        if (img.complete) {
            ctx.drawImage(img, x - radius, y - radius, radius * 2, radius * 2);
        } else {
            ctx.fillStyle = borderColor || '#C5A880';
            ctx.fill();
        }
        ctx.restore();
        ctx.beginPath();
        ctx.arc(x, y, radius, 0, Math.PI * 2);
        ctx.strokeStyle = borderColor || '#C5A880';
        ctx.lineWidth = 2;
        ctx.shadowBlur = 8;
        ctx.shadowColor = borderColor || '#C5A880';
        ctx.stroke();
        ctx.shadowBlur = 0;
    }

    function spawnParticles(x, y, color, count = 8) {
        for (let i = 0; i < count; i++) {
            const angle = (Math.PI * 2 / count) * i + Math.random() * 0.5;
            const speed = 1 + Math.random() * 2;
            particles.push({
                x: x * cellSize + cellSize / 2,
                y: y * cellSize + cellSize / 2,
                vx: Math.cos(angle) * speed,
                vy: Math.sin(angle) * speed,
                life: 1,
                color: color,
                size: 2 + Math.random() * 3
            });
        }
    }

    function drawParticles() {
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            p.x += p.vx;
            p.y += p.vy;
            p.vy += 0.05;
            p.life -= 0.03;
            if (p.life <= 0) {
                particles.splice(i, 1);
                continue;
            }
            ctx.globalAlpha = p.life;
            ctx.fillStyle = p.color;
            ctx.beginPath();
            ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2);
            ctx.fill();
            ctx.globalAlpha = 1;
        }
    }

    function animate() {
        animFrame = requestAnimationFrame(animate);
        if (!mazeVisible || pageHidden) return;

        const now = performance.now();
        if (now - lastDrawTime < MIN_DRAW_INTERVAL) return;
        lastDrawTime = now;

        const lerp = 0.25;
        playerDisplayPos.x += (playerPos.x - playerDisplayPos.x) * lerp;
        playerDisplayPos.y += (playerPos.y - playerDisplayPos.y) * lerp;
        drawMaze();
    }

    function animateStop() {
        if (animFrame) {
            cancelAnimationFrame(animFrame);
            animFrame = null;
        }
    }

    function setupMazeVisibilityObserver() {
        if (!mazeSection || !('IntersectionObserver' in window)) return;
        const visObs = new IntersectionObserver((entries) => {
            for (const e of entries) {
                mazeVisible = e.isIntersecting;
                if (mazeVisible) {
                    mazeSection.classList.add('in-view');
                    lastDrawTime = 0;
                    drawMaze();
                } else {
                    mazeSection.classList.remove('in-view');
                }
            }
        }, { threshold: 0.1, rootMargin: '100px' });
        visObs.observe(mazeSection);

        document.addEventListener('visibilitychange', () => {
            pageHidden = document.hidden;
            if (!pageHidden && mazeVisible) {
                lastDrawTime = 0;
                drawMaze();
            }
        }, { passive: true });
    }

    function canMove(nx, ny) {
        return nx >= 0 && nx < maze[0].length && ny >= 0 && ny < maze.length && maze[ny][nx] === 0;
    }

    function movePlayer(dx, dy) {
        if (!gameStarted || gameEnded) return;

        const newX = playerPos.x + dx;
        const newY = playerPos.y + dy;

        if (canMove(newX, newY)) {
            playerPos.x = newX;
            playerPos.y = newY;
            moves++;

            const lastTrail = trail[trail.length - 1];
            if (!lastTrail || lastTrail.x !== newX || lastTrail.y !== newY) {
                trail.push({ x: newX, y: newY });
                if (trail.length > 100) trail.shift();
            }

            for (const heart of hearts) {
                if (!heart.collected && heart.x === newX && heart.y === newY) {
                    heart.collected = true;
                    heartsCollected++;
                    score += 100;
                    spawnParticles(newX, newY, '#ff4d6d', 12);
                }
            }

            const distToEnd = Math.abs(endPos.x - newX) + Math.abs(endPos.y - newY);
            if (distToEnd <= 2) {
                spawnParticles(newX, newY, '#00c3ff', 6);
            }

            updateHUD();
            checkWin();
        }
    }

    function checkWin() {
        if (playerPos.x === endPos.x && playerPos.y === endPos.y && !gameEnded) {
            gameEnded = true;
            if (timerInterval) {
                clearInterval(timerInterval);
                timerInterval = null;
            }

            const timeBonus = Math.max(0, 500 - elapsedSeconds * 2);
            const moveBonus = Math.max(0, 300 - moves * 2);
            score += timeBonus + moveBonus + 500;

            if (finalTimeEl) finalTimeEl.textContent = formatTime(elapsedSeconds);
            if (finalMovesEl) finalMovesEl.textContent = moves;
            if (finalHeartsEl) finalHeartsEl.textContent = `${heartsCollected}/${hearts.length}`;
            if (finalScoreEl) finalScoreEl.textContent = score;

            updateHUD();
            createHearts();
            spawnParticles(endPos.x, endPos.y, '#C5A880', 20);

            setTimeout(() => {
                modal.classList.add('show');
                document.body.style.overflow = 'hidden';
            }, 600);
        }
    }

    function createHearts() {
        const heartCount = 40;
        const colors = ['#ff4d6d', '#c9184a', '#ffb3c1', '#C5A880', '#ff758f'];
        const heartSVG = `<svg viewBox="0 0 32 32"><path d="M16,28.261c0,0-14-7.941-14-16.246c0-4.332,3.512-7.844,7.844-7.844c2.583,0,4.868,1.248,6.156,3.156c1.288-1.908,3.573-3.156,6.156-3.156c4.332,0,7.844,3.512,7.844,7.844C30,20.32,16,28.261,16,28.261z"/></svg>`;
        const fragment = document.createDocumentFragment();
        const cleanupScheduled = [];

        for (let i = 0; i < heartCount; i++) {
            const heartContainer = document.createElement('div');
            heartContainer.className = 'heart-particle';
            const size = Math.random() * 25 + 15;
            const color = colors[Math.floor(Math.random() * colors.length)];
            const floatDuration = Math.random() * 4 + 4;
            const swayDuration = Math.random() * 2 + 2;
            const swayAmount = Math.random() * 40 + 20;
            const delay = i * 120;
            heartContainer.style.setProperty('--heart-size', size + 'px');
            heartContainer.style.setProperty('--heart-color', color);
            heartContainer.style.setProperty('--heart-glow', color + '66');
            heartContainer.style.setProperty('--float-duration', floatDuration + 's');
            heartContainer.style.setProperty('--sway-duration', swayDuration + 's');
            heartContainer.style.setProperty('--sway-amount', swayAmount + 'px');
            heartContainer.style.left = Math.random() * 100 + 'vw';
            heartContainer.style.animationDelay = delay + 'ms';
            heartContainer.innerHTML = heartSVG;
            fragment.appendChild(heartContainer);
            cleanupScheduled.push({ el: heartContainer, removeAt: delay + floatDuration * 1000 });
        }

        requestAnimationFrame(() => {
            document.body.appendChild(fragment);
            cleanupScheduled.forEach(item => {
                setTimeout(() => item.el.remove(), item.removeAt);
            });
        });
    }

    function showHint() {
        if (!gameStarted || gameEnded) return;
        if (hintTimeout) clearTimeout(hintTimeout);
        const currentPath = findPath(maze, playerPos, endPos);
        if (currentPath.length > 3) {
            hintCell = currentPath[Math.min(3, currentPath.length - 1)];
            score = Math.max(0, score - 25);
            updateHUD();
            hintTimeout = setTimeout(() => {
                hintCell = null;
            }, 2500);
        }
    }

    function toggleSolution() {
        if (!gameStarted || gameEnded) return;
        showSolution = !showSolution;
        if (showSolution) {
            score = Math.max(0, score - 100);
            updateHUD();
            setTimeout(() => { showSolution = false; }, 4000);
        }
    }

    function resetPlayer() {
        playerPos = { x: 1, y: 1 };
        playerDisplayPos = { x: 1, y: 1 };
        trail = [{ x: 1, y: 1 }];
        moves = 0;
        heartsCollected = 0;
        for (const h of hearts) h.collected = false;
        score = Math.max(0, score - 50);
        elapsedSeconds = 0;
        if (timerInterval) {
            clearInterval(timerInterval);
            timerInterval = null;
        }
        if (gameStarted) {
            startTime = Date.now();
            timerInterval = setInterval(() => {
                elapsedSeconds = Math.floor((Date.now() - startTime) / 1000);
                updateHUD();
            }, 1000);
        }
        gameEnded = false;
        particles = [];
        hintCell = null;
        showSolution = false;
        updateHUD();
    }

    function newMaze() {
        initGame();
    }

    upBtn.addEventListener('click', () => movePlayer(0, -1));
    downBtn.addEventListener('click', () => movePlayer(0, 1));
    leftBtn.addEventListener('click', () => movePlayer(-1, 0));
    rightBtn.addEventListener('click', () => movePlayer(1, 0));

    window.addEventListener('keydown', (e) => {
        if (modal.classList.contains('show')) return;
        if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'w', 'a', 's', 'd', 'W', 'A', 'S', 'D'].includes(e.key)) {
            e.preventDefault();
        }
        if (!gameStarted && (e.key.startsWith('Arrow') || 'wasdWASD'.includes(e.key))) {
            startGame();
        }
        switch (e.key) {
            case 'ArrowUp': case 'w': case 'W': movePlayer(0, -1); break;
            case 'ArrowDown': case 's': case 'S': movePlayer(0, 1); break;
            case 'ArrowLeft': case 'a': case 'A': movePlayer(-1, 0); break;
            case 'ArrowRight': case 'd': case 'D': movePlayer(1, 0); break;
        }
    });

    let touchStartX = 0, touchStartY = 0;
    canvas.addEventListener('touchstart', (e) => {
        if (e.touches.length === 1) {
            touchStartX = e.touches[0].clientX;
            touchStartY = e.touches[0].clientY;
        }
    }, { passive: true });

    canvas.addEventListener('touchend', (e) => {
        if (e.changedTouches.length === 1) {
            const dx = e.changedTouches[0].clientX - touchStartX;
            const dy = e.changedTouches[0].clientY - touchStartY;
            const absX = Math.abs(dx);
            const absY = Math.abs(dy);
            if (Math.max(absX, absY) < 20) return;
            if (!gameStarted) startGame();
            if (absX > absY) movePlayer(dx > 0 ? 1 : -1, 0);
            else movePlayer(0, dy > 0 ? 1 : -1);
        }
    }, { passive: true });

    let mouseStartX = 0, mouseStartY = 0, mouseDown = false;
    canvas.addEventListener('mousedown', (e) => {
        mouseDown = true;
        mouseStartX = e.clientX;
        mouseStartY = e.clientY;
    });
    canvas.addEventListener('mouseup', (e) => {
        if (!mouseDown) return;
        mouseDown = false;
        const dx = e.clientX - mouseStartX;
        const dy = e.clientY - mouseStartY;
        const absX = Math.abs(dx);
        const absY = Math.abs(dy);
        if (Math.max(absX, absY) < 30) return;
        if (!gameStarted) startGame();
        if (absX > absY) movePlayer(dx > 0 ? 1 : -1, 0);
        else movePlayer(0, dy > 0 ? 1 : -1);
    });
    canvas.addEventListener('mouseleave', () => { mouseDown = false; });

    startBtn.addEventListener('click', startGame);
    hintBtn.addEventListener('click', showHint);
    resetBtn.addEventListener('click', resetPlayer);
    solveBtn.addEventListener('click', toggleSolution);

    diffBtns.forEach(btn => {
        btn.addEventListener('click', () => {
            diffBtns.forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            currentDifficulty = btn.dataset.diff;
            newMaze();
        });
    });

    replayBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        newMaze();
    });

    continueBtn.addEventListener('click', () => {
        modal.classList.remove('show');
        document.body.style.overflow = 'auto';
        const gatedContent = document.getElementById('gated-content');
        if (gatedContent) {
            gatedContent.classList.add('reveal-gated');
            setTimeout(() => {
                if (storySection) {
                    storySection.scrollIntoView({ behavior: 'smooth' });
                }
                initCountdown();
            }, 100);
        }
    });

    groomImg.onload = drawMaze;
    brideImg.onload = drawMaze;

    initGame();
    setupMazeVisibilityObserver();
    animate();
}

let countdownIntervalId = null;
let timelineObserver = null;

function initCountdown() {
    if (countdownIntervalId) return;
    const targetDate = new Date('September 4, 2026 18:00:00').getTime();

    const daysEl = document.getElementById('days');
    const hoursEl = document.getElementById('hours');
    const minutesEl = document.getElementById('minutes');
    const secondsEl = document.getElementById('seconds');

    let lastDays = -1, lastHours = -1, lastMinutes = -1, lastSeconds = -1;

    function updateCountdown() {
        const now = Date.now();
        const distance = targetDate - now;

        if (distance < 0) {
            if (daysEl && lastDays !== 0) { daysEl.textContent = '00'; lastDays = 0; }
            if (hoursEl && lastHours !== 0) { hoursEl.textContent = '00'; lastHours = 0; }
            if (minutesEl && lastMinutes !== 0) { minutesEl.textContent = '00'; lastMinutes = 0; }
            if (secondsEl && lastSeconds !== 0) { secondsEl.textContent = '00'; lastSeconds = 0; }
            if (countdownIntervalId) clearInterval(countdownIntervalId);
            countdownIntervalId = null;
            return;
        }

        const days = Math.floor(distance / 86400000);
        const hours = Math.floor((distance % 86400000) / 3600000);
        const minutes = Math.floor((distance % 3600000) / 60000);
        const seconds = Math.floor((distance % 60000) / 1000);

        if (daysEl && lastDays !== days) { daysEl.textContent = days.toString().padStart(2, '0'); lastDays = days; }
        if (hoursEl && lastHours !== hours) { hoursEl.textContent = hours.toString().padStart(2, '0'); lastHours = hours; }
        if (minutesEl && lastMinutes !== minutes) { minutesEl.textContent = minutes.toString().padStart(2, '0'); lastMinutes = minutes; }
        if (secondsEl && lastSeconds !== seconds) { secondsEl.textContent = seconds.toString().padStart(2, '0'); lastSeconds = seconds; }
    }

    updateCountdown();
    countdownIntervalId = setInterval(updateCountdown, 1000);

    initTimelineAnimation();
}

function initTimelineAnimation() {
    if (timelineObserver) return;
    const milestones = document.querySelectorAll('.timeline-milestone');
    if (milestones.length === 0) return;

    const observerOptions = {
        threshold: 0.15,
        rootMargin: '0px 0px -50px 0px'
    };

    timelineObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
            if (entry.isIntersecting) {
                entry.target.classList.add('show');
                timelineObserver.unobserve(entry.target);
            }
        });
    }, observerOptions);

    milestones.forEach(milestone => {
        timelineObserver.observe(milestone);
    });
}
