const SEQ_TRIAL = ["G","G","G","N","G","G","G","N","G","G","G","N","G","G","N","G","G","G","G","G"];
const SEQ_OFICIAL = ["G","G","G","G","N","G","N","G","G","N","G","G","G","G","G","G","N","G","G","G","G","N","G","G","G","G","G","G","N","G","G","G","G","G","N","G","G","G","N","G","G","G","N","G","N","N","G","N","G","G","G","G","G","N","G","G","G","G","G","G","G","G","G","N","G","G","N","N","N","G","G","G","N","G","G","G","N","G","G","G","N","G","G","N","G","G","G","G","G","N","G","G","G","G","N","N","G","N","G","G","N","N","G","G","G","G","G","G","N","G","G","G","N","G","G","G","G","G","N","G","N","G","N","G","G","N","N","G","G","G","G","G","G","G","G","N","G","G","N","G","G","N","G","N","N","G","G","G","G","G","N","G","G","G","G","G","N","G","G","G","N","G","G","G","N","G","G","G","G","N","G","G","G","G","G","G","N","G","N","N","G","G","N","G","N","G","G","N","G","G","G","G","G","G","N","N","N","G","G","G","G","G","N","G","N","G","G","N","G","G","G","G","N","N","G","G","G","G","G","G","N","G","G","G","G","G","N","G","G","G","G","G","G","N","G","G","N","G","G","G","G","G","G","N","G","G","N","G","G","G","G","N","G","G","G","G","G","G","N","G","N","N","G","G","G","G","G","N","N","G","G","N","G","G","G","G","G","N","G","G","G","G","G","G","N","N","G","G","G","G","G","G","G","G","N","G","G","G","G","G"];

let state = { 
    idx: 0, logs: [], active: false, start: 0, reacted: false, 
    seq: [], timeoutEstimulo: null, timeoutCiclo: null 
};

const area = document.getElementById('stimulus-area');
const cross = document.getElementById('fixation-cross');

const show = id => {
    document.querySelectorAll('.screen, .full-black-screen').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.replace('hidden', 'active');
};

const runTest = (seq) => {
    state.idx = 0; state.logs = []; state.seq = seq;
    show('screen-test');
    setTimeout(cycle, 1500);
};

document.getElementById('btn-trial').onclick = () => runTest(SEQ_TRIAL);
document.getElementById('btn-start').onclick = () => runTest(SEQ_OFICIAL);

function cycle() {
    if (state.idx >= state.seq.length) return finish();
    state.reacted = false; state.active = true; state.start = Date.now();
    area.style.display = 'none'; cross.style.display = 'none';

    area.className = state.seq[state.idx] === 'G' ? 'stimulus-go' : 'stimulus-nogo';
    area.style.display = 'block'; 

    state.timeoutEstimulo = setTimeout(() => { 
        area.style.display = 'none'; 
        cross.style.display = 'block'; 
        state.timeoutCiclo = setTimeout(() => {
            if (!state.reacted) record(null);
            state.active = false; state.idx++; cycle();
        }, 1500);
    }, 500);
}

window.onkeydown = e => {
    if (e.repeat || !state.active || state.reacted || e.code !== 'Space') return;
    state.reacted = true;
    const rt = Date.now() - state.start;
    record(rt);
    area.style.setProperty('display', 'none', 'important');
    cross.style.display = 'block';
};

function record(rt) {
    const type = state.seq[state.idx];
    let status = type === 'G' ? (rt ? "A" : "O") : (rt ? "E" : "OK");
    state.logs.push({ type, rt, status });
}

function finish() {
    clearTimeout(state.timeoutEstimulo); clearTimeout(state.timeoutCiclo);
    show('screen-estimation');
}

document.getElementById('btn-submit-est').onclick = () => {
    show('screen-results');
    renderResults();
};

function renderResults() {
    const hits = state.logs.filter(l => l.status === "A");
    const avg = hits.length ? (hits.reduce((a,b) => a + b.rt, 0) / hits.length).toFixed(0) : 0;
    const o = state.logs.filter(l => l.status === "O").length;
    const e = state.logs.filter(l => l.status === "E").length;
    const f30 = state.logs.slice(0, 30).filter(l => l.status === "O" || l.status === "E").length;
    const l30 = state.logs.slice(-30).filter(l => l.status === "O" || l.status === "E").length;

    document.getElementById('res-hits').innerText = hits.length;
    document.getElementById('res-avg-time').innerText = avg + 'ms';
    document.getElementById('res-omission').innerText = o;
    document.getElementById('res-action').innerText = e;

    document.getElementById('detalhes-resultados').innerHTML = `
        <div class="panel" style="font-size: 0.85rem; text-align: left;">
            <p><strong>Decréscimo Vigilância:</strong> ${l30 - f30}</p>
            <p style="margin-top:10px;"><strong>Tempos Individuais (Go):</strong></p>
            <div style="display:grid; grid-template-columns: repeat(auto-fill, minmax(65px, 1fr)); gap:5px; margin-top:5px; color:var(--text-dim);">
                ${hits.map((l, i) => `<span>#${i+1}: ${l.rt}ms</span>`).join("")}
            </div>
        </div>
    `;
    drawChart();
}

function drawChart() {
    const svg = document.getElementById('rt-chart');
    const container = svg.parentElement;
    const w = container.clientWidth, h = container.clientHeight;
    svg.innerHTML = '';
    const padL = 45, padB = 30, chartH = h - 60, chartW = w - 65;

    [100, 200, 300, 400, 500].forEach(val => {
        const y = h - padB - ((val - 100) / 400 * chartH);
        const txt = document.createElementNS("http://www.w3.org/2000/svg", "text");
        txt.setAttribute("x", padL - 8); txt.setAttribute("y", y + 4);
        txt.setAttribute("fill", "#94a3b8"); txt.setAttribute("font-size", "10");
        txt.setAttribute("text-anchor", "end"); txt.textContent = val + "ms";
        svg.appendChild(txt);
    });

    let points = [];
    state.logs.forEach((l, i) => {
        const x = padL + (i * (chartW / (state.logs.length - 1)));
        let y, color;
        if (l.status === "A") {
            color = "var(--green)";
            y = h - padB - ((Math.min(Math.max(l.rt, 100), 500) - 100) / 400 * chartH);
            points.push(`${x},${y}`);
        } else if (l.status === "O") { color = "#facc15"; y = 20; }
        else if (l.status === "E") { color = "var(--red)"; y = h - padB; }

        if (color) {
            const c = document.createElementNS("http://www.w3.org/2000/svg", "circle");
            c.setAttribute("cx", x); c.setAttribute("cy", y); c.setAttribute("r", "3.5");
            c.setAttribute("fill", color); svg.appendChild(c);
        }
    });

    if (points.length > 1) {
        const p = document.createElementNS("http://www.w3.org/2000/svg", "polyline");
        p.setAttribute("points", points.join(" ")); p.setAttribute("fill", "none");
        p.setAttribute("stroke", "rgba(59, 130, 246, 0.6)"); p.setAttribute("stroke-width", "2");
        svg.prepend(p);
    }
}