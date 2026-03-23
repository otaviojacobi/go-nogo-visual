/* SEQUÊNCIAS */
const SEQ_TRIAL = ["G", "G", "G", "N", "G", "G", "G", "N", "G", "G", "G", "N", "G", "G", "N", "G", "G", "G", "G", "G"];
const SEQ_OFICIAL = ["G","G","G","G","N","G","N","G","G","N","G","G","G","G","G","G","N","G","G","G","G","N","G","G","G","G","G","G","N","G","G","G","G","G","N","G","G","G","N","G","G","G","N","G","N","N","G","N","G","G","G","G","G","N","G","G","G","G","G","G","G","G","G","N","G","G","N","N","N","G","G","G","N","G","G","G","N","G","G","G","N","G","G","N","G","G","G","G","G","N","G","G","G","G","N","N","G","N","G","G","N","N","G","G","G","G","G","G","N","G","G","G","N","G","G","G","G","G","N","G","N","G","N","G","G","N","N","G","G","G","G","G","G","G","G","N","G","G","N","G","G","N","G","N","N","G","G","G","G","G","N","G","G","G","G","G","N","G","G","G","N","G","G","G","N","G","G","G","G","N","G","G","G","G","G","G","N","G","N","N","G","G","N","G","N","G","G","N","G","G","G","G","G","G","N","N","N","G","G","G","G","G","N","G","N","G","G","N","G","G","G","G","N","N","G","G","G","G","G","G","N","G","G","G","G","G","N","G","G","G","G","G","G","N","G","G","N","G","G","G","G","G","G","N","G","G","N","G","G","G","G","N","G","G","G","G","G","G","N","G","N","N","G","G","G","G","G","N","N","G","G","N","G","G","G","G","G","N","G","G","G","G","G","G","N","N","G","G","G","G","G","G","G","G","N","G","G","G","G","G"];

let state = { 
    idx: 0, logs: [], active: false, start: 0, reacted: false, 
    seq: [], isOfficial: false, isRunning: false, lockNavigation: false 
};

const area = document.getElementById('stimulus-area');
const cross = document.getElementById('fixation-cross');
const btnOfficial = document.getElementById('btn-start-official');

const show = id => {
    document.querySelectorAll('.screen, .full-black-screen').forEach(s => s.classList.add('hidden'));
    const target = document.getElementById(id);
    target.classList.remove('hidden');
    target.classList.add('active');
};

const runTest = (seq, isOfficial) => {
    if (state.isRunning || state.lockNavigation) return;
    state.isRunning = true;
    state.idx = 0; state.logs = []; state.seq = seq; state.isOfficial = isOfficial;
    
    show('screen-test');
    cross.style.display = 'block';
    area.style.display = 'none';
    
    setTimeout(cycle, 1500); 
};

/* REAÇÃO (PRESSIONAR) */
window.addEventListener('keydown', (e) => {
    if (e.code !== 'Space') return;
    if (document.getElementById('screen-test').classList.contains('active')) {
        if (state.active && !state.reacted) {
            e.preventDefault();
            state.reacted = true;
            record(Date.now() - state.start);
            area.style.display = 'none';
            cross.style.display = 'block';
        }
    }
});

/* NAVEGAÇÃO (SOLTAR) */
window.addEventListener('keyup', (e) => {
    if (e.code !== 'Space' || state.isRunning || state.lockNavigation) return;

    const intro = document.getElementById('screen-intro').classList.contains('active');
    const post = document.getElementById('screen-post-trial').classList.contains('active');

    if (intro) runTest(SEQ_TRIAL, false);
    else if (post) runTest(SEQ_OFICIAL, true);
});

/* BOTÕES */
document.getElementById('btn-trial').onclick = () => runTest(SEQ_TRIAL, false);
btnOfficial.onclick = () => runTest(SEQ_OFICIAL, true);
document.getElementById('btn-submit-est').onclick = () => { show('screen-results'); renderResults(); };

function cycle() {
    if (state.idx >= state.seq.length) return finish();
    state.reacted = false;
    state.active = true;
    cross.style.display = 'none';
    area.className = state.seq[state.idx] === 'G' ? 'stimulus-go' : 'stimulus-nogo';
    area.style.display = 'block';
    state.start = Date.now();

    setTimeout(() => {
        area.style.display = 'none';
        if (!state.reacted) record(null);
        state.active = false;
        cross.style.display = 'block';
        setTimeout(() => { state.idx++; cycle(); }, 1500);
    }, 500);
}

function record(rt) {
    const type = state.seq[state.idx];
    let status = type === 'G' ? (rt ? "A" : "O") : (rt ? "E" : "OK");
    state.logs.push({ type, rt, status });
}

function finish() {
    state.isRunning = false;
    state.active = false;
    
    if (state.isOfficial) {
        show('screen-estimation');
    } else {
        startCoolDown(); // Inicia trava de 10s antes do oficial
    }
}

/* LÓGICA DA TRAVA DE 10 SEGUNDOS */
function startCoolDown() {
    state.lockNavigation = true;
    show('screen-post-trial');
    
    let timer = 10;
    btnOfficial.disabled = true;
    btnOfficial.style.opacity = "0.5";
    btnOfficial.innerText = `AGUARDE (${timer}s)`;

    const countdown = setInterval(() => {
        timer--;
        btnOfficial.innerText = `AGUARDE (${timer}s)`;
        
        if (timer <= 0) {
            clearInterval(countdown);
            state.lockNavigation = false;
            btnOfficial.disabled = false;
            btnOfficial.style.opacity = "1";
            btnOfficial.innerText = "ESPAÇO"; // Volta ao texto original
        }
    }, 1000);
}

/* RESULTADOS (Mantidos conforme anterior) */
function renderResults() {
    const hits = state.logs.filter(l => l.status === "A");
    const avg = hits.length ? (hits.reduce((s, l) => s + l.rt, 0) / hits.length).toFixed(0) : 0;
    const o = state.logs.filter(l => l.status === "O").length;
    const e = state.logs.filter(l => l.status === "E").length;
    document.getElementById('res-hits').innerText = hits.length;
    document.getElementById('res-avg-time').innerText = avg + 'ms';
    document.getElementById('res-omission').innerText = o;
    document.getElementById('res-action').innerText = e;
    drawChart();
}

function drawChart() {
    const svg = document.getElementById('rt-chart');
    const container = svg.parentElement;
    const w = container.clientWidth, h = container.clientHeight;
    svg.innerHTML = '';
    const padL = 40, padB = 25, chartH = h - 50, chartW = w - 55;
    let points = [];
    state.logs.forEach((l, i) => {
        const x = padL + (i * (chartW / (state.logs.length - 1 || 1)));
        let y, color;
        if (l.status === "A") {
            color = "#22c55e";
            y = h - padB - ((Math.min(Math.max(l.rt, 100), 500) - 100) / 400 * chartH);
            points.push(`${x},${y}`);
        } else if (l.status === "O") { color = "#facc15"; y = 15; }
        else if (l.status === "E") { color = "#ef4444"; y = h - padB; }
        if (color) {
            const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", "2");
            c.setAttribute("fill", color); svg.appendChild(c);
        }
    });
    if (points.length > 1) {
        const p = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
        p.setAttribute("points", points.join(" "));
        p.setAttribute("fill", "none"); p.setAttribute("stroke", "rgba(34, 197, 94, 0.3)");
        svg.prepend(p);
    }
}