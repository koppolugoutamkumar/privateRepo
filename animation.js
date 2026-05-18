/* ── Birthday Pipeline Animation ── */

let _runCount = 0;

const RAW_WORDS = [
    'ppyha','dbithray','01001000','Hppay','0x48 0x42',
    'Btirhdya','48 61 70','yppha','1010 0000','wishi!',
    '62 64 61','010010','brday','01101000','xyzqr',
    'tset!','0xFF','bd@y','wrng_data','##??'
];

const WISH = `Happy Birthday! 🎉\n\nOn this special day, may your pipelines run green, your queries execute fast, and your dashboards always tell the story you need. You bring so much data-driven energy and creativity to everything you do — here's to another year of transforming raw data into beautiful insights!\n\nWishing you all the joy, success, and growth you deserve. Keep building amazing things. Happy Birthday! 🎂`;

function startPipeline() {
    _runCount++;
    const isErrorRun = (_runCount % 2 === 0);
    const landing = document.getElementById('landing');
    landing.classList.add('fading');
    setTimeout(() => {
        landing.classList.add('hidden');
        landing.classList.remove('fading');
        document.getElementById('pipeline').classList.remove('hidden');
        initPipeline(isErrorRun);
    }, 650);
}

function resetPage() {
    const pipeline = document.getElementById('pipeline');
    const dashboard = document.getElementById('dashboard');
    const landing = document.getElementById('landing');

    dashboard.classList.add('hidden');
    pipeline.classList.add('hidden');

    // Reset metrics
    document.querySelectorAll('.metric-value').forEach(el => {
        el.textContent = el.dataset.target === 'inf' ? '0' : '0';
    });

    // Reset bars
    document.querySelectorAll('.bar-fill').forEach(el => {
        el.style.height = '0px';
    });

    // Reset sparkline
    const sparkLine = document.querySelector('.spark-line');
    const sparkArea = document.querySelector('.spark-area');
    const sparkDot  = document.querySelector('.spark-dot');
    if (sparkLine) sparkLine.classList.remove('drawn');
    if (sparkArea) sparkArea.classList.remove('drawn');
    if (sparkDot)  sparkDot.classList.remove('shown');

    // Reset wish text
    document.getElementById('wishText').textContent = '';

    // Reset status
    const pipeStatus = document.getElementById('pipeStatus');
    pipeStatus.textContent = '$ dbt run --select birthday_model';
    pipeStatus.style.color = '';

    // Show landing
    landing.classList.remove('hidden');
}

/* ───────────────────────── CANVAS PIPELINE ───────────────────────── */

let animFrame;
let particles = [];
let dbError = false;
let gearAngle = 0;
let layout = {};

function initPipeline(isErrorRun) {
    const canvas = document.getElementById('pipeCanvas');
    const ctx = canvas.getContext('2d');

    particles = [];
    dbError = false;
    gearAngle = 0;

    let phase = 'particles'; // particles | sucking | rail1 | db | rail2 | done

    function resize() {
        canvas.width  = window.innerWidth;
        canvas.height = window.innerHeight;
        buildLayout(canvas.width, canvas.height);
    }
    window.addEventListener('resize', resize);
    resize();

    // Spawn raw word particles
    for (let i = 0; i < 22; i++) {
        spawnParticle(canvas.width, canvas.height);
    }

    let rail1Progress = 0;
    let rail2Progress = 0;
    let packetOnRail1 = false;
    let packetOnRail2 = false;
    let showDB = false;
    let showDashboard = false;
    let blinkTimer = 0;
    let beltOffset = 0;

    // Timeline
    setTimeout(() => setStatus('› connecting to source_raw...'), 300);
    setTimeout(() => setStatus('› scanning schema...'), 900);
    setTimeout(() => { phase = 'sucking'; setStatus('› ingesting raw records...'); }, 1800);
    setTimeout(() => {
        phase = 'rail1'; packetOnRail1 = true;
        particles = [];
        setStatus('› dbt run: birthday_model');
    }, 4200);
    setTimeout(() => { showDB = true; setStatus('› loading into warehouse...'); }, 6400);

    if (!isErrorRun) {
        // Normal run
        setTimeout(() => {
            packetOnRail2 = true;
            setStatus('› materializing semantic layer...');
        }, 9600);
        setTimeout(() => {
            showDashboard = true;
            revealDashboard();
        }, 11800);
    } else {
        // Error run
        setTimeout(() => {
            dbError = true;
            setStatus('✗ ERROR: schema_mismatch detected', '#ef4444');
        }, 8200);
        setTimeout(() => setStatus('› fixing: ALTER TABLE birthday_model...'), 9800);
        setTimeout(() => setStatus('› re-running dbt build...'), 11600);
        setTimeout(() => { dbError = false; setStatus('› schema patched. retrying...'); }, 13400);
        setTimeout(() => { packetOnRail2 = true; setStatus('› materializing semantic layer...'); }, 14800);
        setTimeout(() => {
            showDashboard = true;
            revealDashboard();
        }, 17200);
    }

    if (animFrame) cancelAnimationFrame(animFrame);

    function loop() {
        if (showDashboard) return;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        drawDotGrid(ctx, canvas.width, canvas.height);

        const L = layout;

        // Floating particles
        for (let i = particles.length - 1; i >= 0; i--) {
            const p = particles[i];
            if (phase === 'sucking') {
                const mouth = funnelMouth();
                const dx = mouth.x - p.x;
                const dy = mouth.y - p.y;
                const dist = Math.sqrt(dx * dx + dy * dy);
                if (dist < 10) { particles.splice(i, 1); continue; }
                const speed = Math.max(5, 350 / (dist + 5));
                p.x += (dx / dist) * speed;
                p.y += (dy / dist) * speed;
                p.opacity = Math.min(1, dist / 80);
            } else {
                p.x += p.vx;
                p.y += p.vy;
                const f = layout.funnel || {};
                const mouthX = (f.x || 0) + (f.w || 0) / 2;
                const zoneW  = (f.w || 100) * 1.6;
                const zoneH  = Math.max((f.y || 60) - 20, 60);
                const outX = p.x < mouthX - zoneW || p.x > mouthX + zoneW;
                const outY = p.y < 0 || p.y > (f.y || canvas.height);
                if ((outX || outY) && phase === 'particles') spawnParticle(canvas.width, canvas.height, p);
            }
            ctx.save();
            ctx.font = `${p.size}px 'JetBrains Mono', monospace`;
            ctx.fillStyle = `rgba(167,139,250,${p.opacity * 0.7})`;
            ctx.fillText(p.word, p.x, p.y);
            ctx.restore();
        }

        // Landing zone
        drawLandingZone(ctx, L.funnel);

        beltOffset++;

        // Rail 1: landing zone → DB
        if (packetOnRail1) {
            rail1Progress = Math.min(1, rail1Progress + 0.004);
            drawConveyorRail(ctx, L.rail1.x1, L.rail1.y1, L.rail1.x2, L.rail1.y2, rail1Progress, beltOffset);
            if (rail1Progress < 1) {
                const px = L.rail1.x1 + (L.rail1.x2 - L.rail1.x1) * rail1Progress;
                const py = L.rail1.y1 + (L.rail1.y2 - L.rail1.y1) * rail1Progress;
                drawPacket(ctx, px, py, dbError ? 'MISMATCH ✗' : '01001000 →', dbError ? '#ef4444' : '#34d399');
            }
        }

        // DB
        if (showDB) {
            gearAngle += 0.02;
            drawDB(ctx, L.db.x, L.db.y, gearAngle, dbError, blinkTimer, L.db.r);
            blinkTimer++;
            if (dbError && blinkTimer % 30 < 15) {
                ctx.font = '1.4rem serif';
                ctx.fillText('⚠', L.db.x - 10, L.db.y - (L.db.r + 16));
            }
        }

        // Rail 2: DB → dashboard zone
        if (packetOnRail2) {
            rail2Progress = Math.min(1, rail2Progress + 0.004);
            drawConveyorRail(ctx, L.rail2.x1, L.rail2.y1, L.rail2.x2, L.rail2.y2, rail2Progress, beltOffset);
            if (rail2Progress < 1) {
                const px = L.rail2.x1 + (L.rail2.x2 - L.rail2.x1) * rail2Progress;
                const py = L.rail2.y1 + (L.rail2.y2 - L.rail2.y1) * rail2Progress;
                drawPacket(ctx, px, py, 'SEMANTIC_MODEL →', '#f2c811');
            }
        }

        animFrame = requestAnimationFrame(loop);
    }
    loop();
}

/* ── Layout builder ── */
function buildLayout(W, H) {
    const mobile = W < 640;
    const cx = W / 2;
    const cy = H / 2;
    const dbR = Math.max(45, Math.min(W * 0.075, H * 0.09, 85));

    if (mobile) {
        const zoneW = W * 0.62;
        const zoneH = H * 0.22;
        const zoneX = cx - zoneW / 2;
        const zoneY = H * 0.06;

        layout = {
            funnel: { x: zoneX, y: zoneY, w: zoneW, h: zoneH },
            rail1:  { x1: cx, y1: zoneY + zoneH, x2: cx, y2: H * 0.48 },
            db:     { x: cx, y: H * 0.55, r: dbR },
            rail2:  { x1: cx, y1: H * 0.55 + dbR + 10, x2: cx, y2: H * 0.88 },
        };
    } else {
        const zoneW = W * 0.22;
        const zoneH = H * 0.34;
        const zoneX = W * 0.05;
        const zoneY = cy - zoneH / 2;
        const zoneBotY = zoneY + zoneH;

        layout = {
            funnel: { x: zoneX, y: zoneY, w: zoneW, h: zoneH },
            rail1:  { x1: zoneX + zoneW, y1: cy, x2: cx - dbR, y2: cy },
            db:     { x: cx, y: cy, r: dbR },
            rail2:  { x1: cx + dbR + 8, y1: cy, x2: W * 0.85, y2: cy },
        };
    }
}

function funnelTip() {
    const f = layout.funnel;
    return { x: f.x + f.w / 2, y: f.y + f.h };
}

function funnelMouth() {
    const f = layout.funnel;
    return { x: f.x + f.w / 2, y: f.y };
}

/* ── Draw helpers ── */
function drawDotGrid(ctx, W, H) {
    ctx.fillStyle = 'rgba(167,139,250,0.07)';
    const step = 28;
    for (let x = 0; x < W; x += step)
        for (let y = 0; y < H; y += step)
            ctx.fillRect(x, y, 1.5, 1.5);
}

function drawLandingZone(ctx, f) {
    const x = f.x, y = f.y, w = f.w, h = f.h;
    const cx = x + w / 2;

    // Background fill
    ctx.fillStyle = 'rgba(88,28,135,0.2)';
    roundRect(ctx, x, y, w, h, 5);
    ctx.fill();

    // Border
    ctx.strokeStyle = 'rgba(167,139,250,0.8)';
    ctx.lineWidth = 2;
    roundRect(ctx, x, y, w, h, 5);
    ctx.stroke();

    // Top accent bar
    ctx.fillStyle = 'rgba(167,139,250,0.55)';
    ctx.fillRect(x + 2, y + 1, w - 4, 3);

    // Header separator line
    ctx.strokeStyle = 'rgba(167,139,250,0.25)';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(x + 10, y + 34);
    ctx.lineTo(x + w - 10, y + 34);
    ctx.stroke();

    // Title
    ctx.textAlign = 'center';
    ctx.font = "bold 0.68rem 'JetBrains Mono', monospace";
    ctx.fillStyle = '#c4b5fd';
    ctx.fillText('landing_zone', cx, y + 24);

    // Subtitle
    ctx.font = "0.55rem 'JetBrains Mono', monospace";
    ctx.fillStyle = 'rgba(167,139,250,0.5)';
    ctx.fillText('format: parquet', cx, y + h * 0.5);
    ctx.fillText('s3://raw-data-bucket', cx, y + h * 0.62);

    // Simulated data rows
    const rowsY = y + h * 0.72;
    const rowH = 9;
    const rowGap = 4;
    const rowW = w - 24;
    for (let i = 0; i < 3; i++) {
        ctx.fillStyle = `rgba(167,139,250,${0.18 - i * 0.04})`;
        ctx.fillRect(x + 12, rowsY + i * (rowH + rowGap), rowW, rowH);
    }

    // Arrow label above
    ctx.font = "0.6rem 'JetBrains Mono', monospace";
    ctx.fillStyle = 'rgba(167,139,250,0.55)';
    ctx.fillText('▼ source_raw', cx, y - 8);
    ctx.textAlign = 'left';
}

function drawConveyorRail(ctx, x1, y1, x2, y2, progress, beltOffset) {
    const dx = x2 - x1;
    const dy = y2 - y1;
    const len = Math.sqrt(dx * dx + dy * dy);
    const angle = Math.atan2(dy, dx);
    const activeLen = len * progress;
    const bH = 9;
    const slotSpacing = 22;

    ctx.save();
    ctx.translate(x1, y1);
    ctx.rotate(angle);

    // Full background belt fill
    ctx.fillStyle = 'rgba(88,28,135,0.15)';
    ctx.fillRect(0, -bH, len, bH * 2);

    // Background rails
    ctx.strokeStyle = 'rgba(167,139,250,0.3)';
    ctx.lineWidth = 2;
    ctx.beginPath(); ctx.moveTo(0, -bH); ctx.lineTo(len, -bH); ctx.stroke();
    ctx.beginPath(); ctx.moveTo(0,  bH); ctx.lineTo(len,  bH); ctx.stroke();

    // Background slats (dim, static)
    ctx.strokeStyle = 'rgba(167,139,250,0.1)';
    ctx.lineWidth = 1;
    for (let sx = 0; sx < len; sx += slotSpacing) {
        ctx.beginPath(); ctx.moveTo(sx, -bH); ctx.lineTo(sx, bH); ctx.stroke();
    }

    // Active conveyor portion
    if (activeLen > 0) {
        ctx.save();
        ctx.beginPath();
        ctx.rect(0, -bH - 2, activeLen, bH * 2 + 4);
        ctx.clip();

        // Active belt tint
        ctx.fillStyle = 'rgba(52,211,153,0.07)';
        ctx.fillRect(0, -bH, activeLen, bH * 2);

        // Active rails
        ctx.strokeStyle = 'rgba(52,211,153,0.85)';
        ctx.lineWidth = 2.5;
        ctx.beginPath(); ctx.moveTo(0, -bH); ctx.lineTo(activeLen, -bH); ctx.stroke();
        ctx.beginPath(); ctx.moveTo(0,  bH); ctx.lineTo(activeLen,  bH); ctx.stroke();

        // Moving slats
        ctx.strokeStyle = 'rgba(52,211,153,0.55)';
        ctx.lineWidth = 1.5;
        const offset = beltOffset % slotSpacing;
        for (let sx = -offset; sx < activeLen + slotSpacing; sx += slotSpacing) {
            ctx.beginPath(); ctx.moveTo(sx, -bH); ctx.lineTo(sx, bH); ctx.stroke();
        }

        ctx.restore();
    }

    ctx.restore();
}

function drawPacket(ctx, x, y, label, color) {
    const pad = 6;
    ctx.font = "bold 0.62rem 'JetBrains Mono', monospace";
    const tw = ctx.measureText(label).width;
    const bw = tw + pad * 2;
    const bh = 20;

    ctx.fillStyle = 'rgba(5,5,16,0.85)';
    roundRect(ctx, x - bw / 2, y - bh / 2, bw, bh, 3);
    ctx.fill();

    ctx.strokeStyle = color;
    ctx.lineWidth = 1.5;
    roundRect(ctx, x - bw / 2, y - bh / 2, bw, bh, 3);
    ctx.stroke();

    ctx.fillStyle = color;
    ctx.textAlign = 'center';
    ctx.fillText(label, x, y + 5);
    ctx.textAlign = 'left';
}

function drawDB(ctx, x, y, angle, isError, blinkT, r) {
    const ry = Math.round(r * 0.28);
    const bodyH = Math.round(r * 0.75);
    const color = isError ? '#ef4444' : '#a78bfa';
    const glow  = isError ? 'rgba(239,68,68,0.35)' : 'rgba(167,139,250,0.25)';

    // Glow
    const grad = ctx.createRadialGradient(x, y, 0, x, y, r * 1.8);
    grad.addColorStop(0, glow);
    grad.addColorStop(1, 'transparent');
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(x, y, r * 1.8, 0, Math.PI * 2);
    ctx.fill();

    // Top cap
    ctx.beginPath();
    ctx.ellipse(x, y - bodyH, r, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = 'rgba(5,5,16,0.9)';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.lineWidth = 2;
    ctx.stroke();

    // Body sides + bottom arc
    ctx.beginPath();
    ctx.moveTo(x - r, y - bodyH);
    ctx.lineTo(x - r, y + bodyH);
    ctx.ellipse(x, y + bodyH, r, ry, 0, Math.PI, Math.PI * 2, false);
    ctx.lineTo(x + r, y - bodyH);
    ctx.fillStyle = 'rgba(5,5,16,0.9)';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.stroke();

    // Bottom cap
    ctx.beginPath();
    ctx.ellipse(x, y + bodyH, r, ry, 0, 0, Math.PI * 2);
    ctx.fillStyle = '#0a0a20';
    ctx.fill();
    ctx.strokeStyle = color;
    ctx.stroke();

    // Gear (scaled)
    ctx.save();
    ctx.translate(x, y);
    ctx.rotate(angle);
    ctx.font = `${Math.round(r * 0.55)}px serif`;
    ctx.textAlign = 'center';
    ctx.fillStyle = isError ? '#ef4444' : '#a78bfa';
    ctx.fillText('⚙', 0, Math.round(r * 0.2));
    ctx.restore();

    // Label
    ctx.font = "0.6rem 'JetBrains Mono', monospace";
    ctx.fillStyle = isError ? '#ef4444' : 'rgba(167,139,250,0.8)';
    ctx.textAlign = 'center';
    ctx.fillText(isError ? 'ERROR: schema_mismatch' : 'birthday_warehouse', x, y + bodyH + ry + 16);
    ctx.textAlign = 'left';
}

function roundRect(ctx, x, y, w, h, r) {
    ctx.beginPath();
    ctx.moveTo(x + r, y);
    ctx.lineTo(x + w - r, y);
    ctx.quadraticCurveTo(x + w, y, x + w, y + r);
    ctx.lineTo(x + w, y + h - r);
    ctx.quadraticCurveTo(x + w, y + h, x + w - r, y + h);
    ctx.lineTo(x + r, y + h);
    ctx.quadraticCurveTo(x, y + h, x, y + h - r);
    ctx.lineTo(x, y + r);
    ctx.quadraticCurveTo(x, y, x + r, y);
    ctx.closePath();
}

function spawnParticle(W, H, p) {
    const obj = p || {};
    const f = layout.funnel || { x: W * 0.07, y: H * 0.2, w: W * 0.22, h: H * 0.28 };
    const mouthX = f.x + f.w / 2;
    const mouthY = f.y;
    const zoneW  = f.w * 1.6;
    const zoneH  = Math.max(mouthY - 20, 60);

    // Scatter in the staging area directly above the funnel mouth
    obj.x = mouthX + (Math.random() - 0.5) * zoneW;
    obj.y = 10 + Math.random() * zoneH;

    obj.word    = RAW_WORDS[Math.floor(Math.random() * RAW_WORDS.length)];
    obj.vx      = (Math.random() - 0.5) * 0.8;
    obj.vy      = (Math.random() - 0.5) * 0.8;
    obj.size    = 11 + Math.random() * 7;
    obj.opacity = 0.4 + Math.random() * 0.5;
    if (!p) particles.push(obj);
}

function setStatus(text, color) {
    const el = document.getElementById('pipeStatus');
    el.textContent = text;
    if (color) {
        el.style.color = color;
    } else if (text.startsWith('✗') || text.startsWith('›')) {
        el.style.color = text.startsWith('✗') ? '#ef4444' : '#a78bfa';
    } else {
        el.style.color = '#a78bfa';
    }
}

/* ── Dashboard animations ── */
function revealDashboard() {
    if (animFrame) cancelAnimationFrame(animFrame);
    document.getElementById('dashboard').classList.remove('hidden');
    animateMetrics();
    animateBars();
    animateSparkline();
    setTimeout(animateWish, 400);
}

function animateMetrics() {
    document.querySelectorAll('.metric-value').forEach(el => {
        const target = el.dataset.target;
        if (target === 'inf') {
            let n = 0;
            const iv = setInterval(() => {
                n += Math.floor(Math.random() * 99) + 1;
                el.textContent = n.toLocaleString();
                if (n >= 5000) { el.textContent = '∞'; clearInterval(iv); }
            }, 60);
            return;
        }
        const end = parseInt(target, 10);
        let current = 0;
        const step = Math.ceil(end / 40);
        const iv = setInterval(() => {
            current = Math.min(current + step, end);
            el.textContent = current;
            if (current >= end) clearInterval(iv);
        }, 30);
    });
}

function animateBars() {
    document.querySelectorAll('.bar-fill').forEach((el, i) => {
        const maxH = 72;
        const pct  = parseInt(el.dataset.h, 10) / 100;
        setTimeout(() => {
            el.style.height = (pct * maxH) + 'px';
        }, i * 120);
    });
}

function animateSparkline() {
    const line = document.querySelector('.spark-line');
    const area = document.querySelector('.spark-area');
    const dot  = document.querySelector('.spark-dot');
    setTimeout(() => { if (line) line.classList.add('drawn'); if (area) area.classList.add('drawn'); }, 100);
    setTimeout(() => { if (dot) dot.classList.add('shown'); }, 1700);
}

function animateWish() {
    const el = document.getElementById('wishText');
    el.textContent = '';
    let i = 0;
    const iv = setInterval(() => {
        el.textContent += WISH[i];
        i++;
        if (i >= WISH.length) clearInterval(iv);
    }, 16);
}
