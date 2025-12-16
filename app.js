// Lightweight SPA controls + UI for HallMatrix
const API_BASE = (location.origin) + '/api'; // server should serve client or set CORS

const state = { halls: [], students: [], allocations: null, themeDark: false };

// Simple view templates
function renderDashboard(){
  return `
    <div>
      <div class="card">
        <h3>Quick Actions</h3>
        <div class="form-row">
          <input id="quickExam" class="input" placeholder="Exam label, e.g. CS101 - Dec 2026" />
          <button id="btnQuickRun" class="btn">Run Allocation</button>
        </div>
      </div>

      <div class="card">
        <h3>Summary</h3>
        <div style="display:flex; gap:16px">
          <div style="flex:1">
            <div style="font-size:12px; color:var(--muted)">Halls</div>
            <div style="font-weight:700; font-size:18px">${state.halls.length}</div>
          </div>
          <div style="flex:1">
            <div style="font-size:12px; color:var(--muted)">Students</div>
            <div style="font-weight:700; font-size:18px">${state.students.length}</div>
          </div>
        </div>
      </div>

      <div class="card">
        <h3>Last Allocation</h3>
        <pre id="lastAlloc">${state.allocations ? JSON.stringify(state.allocations, null, 2) : 'No allocation yet'}</pre>
      </div>
    </div>
  `;
}

function renderImport(){
  return `
    <div>
      <div class="card">
        <h3>Import Students (CSV)</h3>
        <p>CSV format: regNo,name,program,year,roll,specialNeeds</p>
        <input type="file" id="csvFile" accept=".csv" />
        <div style="margin-top:8px">
          <button id="btnUpload" class="btn">Upload CSV</button>
          <span id="uploadMsg" style="margin-left:10px;color:var(--muted)"></span>
        </div>
      </div>

      <div class="card">
        <h3>Student List (sample)</h3>
        <textarea id="sampleArea" rows="6" style="width:100%">${state.students.slice(0,10).map(s=>s.regNo+' - '+s.name).join('\n')}</textarea>
      </div>
    </div>
  `;
}

function renderHalls(){
  return `
    <div>
      <div class="card">
        <h3>Create Hall</h3>
        <div class="form-row">
          <input id="hallName" class="input" placeholder="Hall name" />
          <input id="hallRows" class="input" placeholder="Rows" type="number" />
          <input id="hallCols" class="input" placeholder="Cols" type="number" />
          <input id="hallAccessible" class="input" placeholder="Accessible seats (R1C1,R1C2)" />
          <button id="btnAddHall" class="btn">Add</button>
        </div>
      </div>

      <div class="card">
        <h3>Halls</h3>
        <div id="hallsGrid">${state.halls.map(h=>`<div style="padding:8px;border-radius:8px;background:#f8fafc;margin-bottom:8px">${h.name} — ${h.rows}x${h.cols}</div>`).join('')}</div>
      </div>
    </div>
  `;
}

function renderPlanner(){
  const hallOptions = state.halls.map(h=>`<option value="${h._id}">${h.name}</option>`).join('');
  return `
    <div>
      <div class="card">
        <h3>Allocate</h3>
        <div class="form-row">
          <select id="hallSelect" multiple style="min-width:300px">${hallOptions}</select>
          <input id="examLabel" class="input" placeholder="Exam Label" />
          <button id="btnRunAlloc" class="btn">Run</button>
        </div>
      </div>

      <div class="card">
        <h3>Preview</h3>
        <div id="previewArea">Select halls and run allocation to preview</div>
      </div>
    </div>
  `;
}

// Router
function setView(view){
  const content = document.getElementById('content');
  if (view === 'dashboard') content.innerHTML = renderDashboard();
  if (view === 'import') content.innerHTML = renderImport();
  if (view === 'halls') content.innerHTML = renderHalls();
  if (view === 'planner') content.innerHTML = renderPlanner();
  bindViewEvents(view);
  document.querySelectorAll('.nav-btn').forEach(b=>b.classList.toggle('active', b.dataset.view===view));
}

// Event binding for dynamic content
function bindViewEvents(view){
  if (view === 'import'){
    const btn = document.getElementById('btnUpload');
    btn && btn.addEventListener('click', async ()=>{
      const f = document.getElementById('csvFile').files[0];
      if (!f) return alert('Choose CSV');
      const fd = new FormData(); fd.append('file', f);
      const res = await fetch(API_BASE + '/students/import', { method: 'POST', body: fd });
      const j = await res.json();
      document.getElementById('uploadMsg').innerText = j.imported ? `Imported ${j.imported}` : (j.error || 'Error');
      await loadStudents();
    });
  }
  if (view === 'halls'){
    const btn = document.getElementById('btnAddHall');
    btn && btn.addEventListener('click', async ()=>{
      const name = document.getElementById('hallName').value;
      const rows = Number(document.getElementById('hallRows').value);
      const cols = Number(document.getElementById('hallCols').value);
      const acc = document.getElementById('hallAccessible').value.split(',').map(s=>s.trim()).filter(Boolean);
      if (!name || !rows || !cols) return alert('Fill required');
      await fetch(API_BASE + '/halls', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ name, rows, cols, capacity: rows*cols, accessibleSeats: acc })});
      await loadHalls(); setView('halls');
    });
  }
  if (view === 'planner'){
    const btn = document.getElementById('btnRunAlloc');
    btn && btn.addEventListener('click', async ()=>{
      const select = document.getElementById('hallSelect');
      const selected = Array.from(select.selectedOptions).map(o=>o.value);
      const exam = document.getElementById('examLabel').value || 'Exam';
      if (!selected.length) return alert('Select halls');
      const res = await fetch(API_BASE + '/allocate/run', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ exam, hallIds: selected, options: { avoidSameProgramAdj: true } })});
      const j = await res.json();
      state.allocations = j.allocations;
      document.getElementById('previewArea').innerHTML = renderHallPreview(j.allocations, selected[0]);
    });
  }
  if (view === 'dashboard'){
    const btn = document.getElementById('btnQuickRun');
    btn && btn.addEventListener('click', ()=>{
      const label = document.getElementById('quickExam').value || 'Exam';
      const selected = state.halls.map(h=>h._id);
      if (!selected.length) return alert('Add halls first');
      fetch(API_BASE + '/allocate/run', { method: 'POST', headers: {'Content-Type':'application/json'}, body: JSON.stringify({ exam: label, hallIds: selected, options: { avoidSameProgramAdj: true } })})
        .then(r=>r.json()).then(j=>{ state.allocations = j.allocations; setView('dashboard'); });
    });
  }
}

function renderHallPreview(allocs, hallId){
  if (!allocs || !allocs[hallId]) return '<div>No data</div>';
  const items = allocs[hallId];
  let maxR=0,maxC=0; const map = {};
  items.forEach(item => {
    const m = (item.seat||'').match(/R([0-9]+)C([0-9]+)/i);
    if (!m) return; const r=Number(m[1]), c=Number(m[2]); maxR=Math.max(maxR,r); maxC=Math.max(maxC,c); map[`${r},${c}`] = item;
  });
  let html = `<div style="display:grid; grid-template-columns: repeat(${maxC}, 1fr); gap:8px">`;
  for (let r=1;r<=maxR;r++){
    for (let c=1;c<=maxC;c++){
      const key = `${r},${c}`;
      const item = map[key];
      if (!item) html += `<div class="seat empty">R${r}C${c}<div style="font-size:11px;color:var(--muted)">Empty</div></div>`;
      else html += `<div class="seat occupied">R${r}C${c}<div style="font-size:12px">${item.student.name}</div><div style="font-size:11px;color:var(--muted)">${item.student.regNo}</div></div>`;
    }
  }
  html += '</div>';
  return html;
}

// Data loaders
async function loadHalls(){ const res = await fetch(API_BASE + '/halls'); state.halls = await res.json(); }
async function loadStudents(){ const res = await fetch(API_BASE + '/students'); state.students = await res.json(); }

// Init
(async function init(){
  document.querySelectorAll('.nav-btn').forEach(b=> b.addEventListener('click', ()=> setView(b.dataset.view)));
  document.getElementById('btnTheme').addEventListener('click', ()=>{ document.documentElement.classList.toggle('dark'); state.themeDark = !state.themeDark });
  await loadHalls(); await loadStudents();
  setView('dashboard');
})();
