
// Códigos de departamento generados dinámicamente
let DEPT_CODES = {}; // { DEPT001: "NombreDepto", ... }
const ADMIN_CODE = "Haraujo1324";


// Inicializar: primero intentar cargar códigos públicos, luego comprobar archivo persistente
(async function initPersistence() {
    try {
        await fetchPublicDeptCodes();
    } catch (e) { /* ignore */ }
    try {
        await checkStoredOnLoad();
    } catch (err) { console.warn('checkStoredOnLoad error', err); }
})();
let reportData = []; // Aquí guardaremos los datos del Excel
let evaluations = []; // Aquí guardaremos lo que el gerente elija

// Al cargar la página, restaurar datos si existen en localStorage
if (localStorage.getItem('reportData')) {
    try {
        reportData = JSON.parse(localStorage.getItem('reportData'));
    } catch (e) { reportData = []; }
}
if (localStorage.getItem('DEPT_CODES')) {
    try {
        DEPT_CODES = JSON.parse(localStorage.getItem('DEPT_CODES'));
    } catch (e) { DEPT_CODES = {}; }
}

// Restaurar evaluaciones si existen en localStorage
if (localStorage.getItem('evaluations')) {
    try {
        evaluations = JSON.parse(localStorage.getItem('evaluations'));
    } catch (e) { evaluations = []; }
}

// Generar un código aleatorio de 6 letras mayúsculas
function randomCode() {
    const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ';
    let code = '';
    for (let i = 0; i < 6; i++) {
        code += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return code;
}

// Sanear/normalizar URLs importadas desde el Excel
function sanitizeUrl(raw) {
    if (!raw && raw !== '') return '';
    let s = String(raw);
    // Buscar la primera aparición de http/https y devolver desde ahí (esto elimina prefijos como ": " o "file:///...:")
    const idx = s.toLowerCase().indexOf('http');
    if (idx !== -1) return s.slice(idx).trim();
    // Si no contiene http, eliminar prefijos comunes (espacios, dos puntos) y retornar
    return s.replace(/^[\s:\/\\]+/, '').trim();
}

// Mostrar una notificación tipo 'toast' en pantalla. Devuelve una Promise que se resuelve cuando desaparece.
function showNotification(message, duration = 3500) {
    return new Promise((resolve) => {
        let container = document.querySelector('.toast-container');
        if (!container) {
            container = document.createElement('div');
            container.className = 'toast-container';
            document.body.appendChild(container);
        }
        const toast = document.createElement('div');
        toast.className = 'toast';
        // Permitir saltos de línea en el mensaje
        toast.innerHTML = String(message).replace(/\n/g, '<br>');
        container.appendChild(toast);
        // Forzar reflow para activar la transición
        void toast.offsetWidth;
        toast.classList.add('show');
        // Ocultar y quitar después de `duration`
        setTimeout(() => {
            toast.classList.remove('show');
            toast.classList.add('hide');
            setTimeout(() => {
                toast.remove();
                if (container.children.length === 0) container.remove();
                resolve();
            }, 300);
        }, duration);
    });
}
// Generar códigos de departamento después de cargar el Excel
function generateDeptCodes() {
    const uniqueDepts = [...new Set(reportData.map(r => r.Departamento))];
    // Preserve existing codes: DEPT_CODES maps code -> dept
    const existingCodes = Object.assign({}, DEPT_CODES || {});
    const usedCodes = new Set(Object.keys(existingCodes));
    // Build reverse map dept -> code for quick lookup
    const deptToCode = {};
    Object.entries(existingCodes).forEach(([c, d]) => { deptToCode[d] = c; });

    // Ensure DEPT_CODES contains existing mappings, and add only new departments
    DEPT_CODES = Object.assign({}, existingCodes);
    uniqueDepts.forEach((dept) => {
        if (!deptToCode[dept]) {
            let code;
            do {
                code = randomCode();
            } while (usedCodes.has(code));
            usedCodes.add(code);
            DEPT_CODES[code] = dept;
            deptToCode[dept] = code;
        }
    });
    // Guardar en localStorage
    localStorage.setItem('DEPT_CODES', JSON.stringify(DEPT_CODES));
    console.log('Códigos de departamento generados/actualizados:', DEPT_CODES);
}

// Manejo de Login
function handleLogin() {
    const code = document.getElementById('access-code').value.trim();
    if (code === ADMIN_CODE) {
        showSection('admin-dashboard');
        document.getElementById('admin-init').classList.remove('hidden');
        // render admin summary when admin opens the dashboard
        try { renderAdminSummary(); } catch (e) { /* ignore if not available */ }
    } else if (DEPT_CODES[code]) {
        const dept = DEPT_CODES[code];
        showSection('manager-dashboard');
        loadDepartmentReports(dept);
    } else {
        alert("Código inválido");
    }
}

// Permitir enviar el formulario de login con la tecla Enter
const accessInput = document.getElementById && document.getElementById('access-code');
if (accessInput) {
    accessInput.addEventListener('keydown', function (e) {
        if (e.key === 'Enter' || e.keyCode === 13) {
            e.preventDefault();
            handleLogin();
        }
    });
}

// Render a summary table in the admin dashboard: total, evaluados, pendientes por departamento
function renderAdminSummary() {
    const container = document.getElementById('admin-summary');
    if (!container) return;
    // gather departments from reportData and DEPT_CODES
    const deptFromData = [...new Set(reportData.map(r => r.Departamento).filter(Boolean))];
    const mapped = Object.values(DEPT_CODES || {}).filter(Boolean);
    const departments = deptFromData.slice();
    mapped.forEach(d => { if (!departments.includes(d)) departments.push(d); });
    if (departments.length === 0) {
        container.innerHTML = '<div>No hay departamentos cargados.</div>';
        return;
    }
    const rows = departments.map(dept => {
        const total = reportData.filter(r => r.Departamento === dept).length;
        const evaluated = evaluations.filter(e => e.departamento === dept && e.status && e.status !== '').length;
        const pending = Math.max(0, total - evaluated);
        // find code for this department (DEPT_CODES maps code -> dept)
        const codeEntry = Object.entries(DEPT_CODES || {}).find(([c, d]) => d === dept);
        const code = codeEntry ? codeEntry[0] : '';
        return `<tr><td style="padding:6px 8px">${code}</td><td style="padding:6px 8px">${dept}</td><td style="padding:6px 8px;text-align:right">${total}</td><td style="padding:6px 8px;text-align:right">${evaluated}</td><td style="padding:6px 8px;text-align:right">${pending}</td></tr>`;
    }).join('');
    container.innerHTML = `
        <h3>Resumen por Departamento</h3>
        <table style="width:100%;border-collapse:collapse;border:1px solid rgba(0,0,0,0.06);">
            <thead><tr style="background:rgba(0,0,0,0.03)"><th style="text-align:left;padding:8px">Código</th><th style="text-align:left;padding:8px">Departamento</th><th style="padding:8px">Total</th><th style="padding:8px">Evaluados</th><th style="padding:8px">Pendientes</th></tr></thead>
            <tbody>${rows}</tbody>
        </table>
    `;
}

// IndexedDB helpers: guardar el archivo Excel como Blob de forma persistente (solo una vez)
const DB_NAME = 'persistentUploads_v1';
const STORE = 'files';
const FILE_KEY = 'excel';

function openDB() {
    return new Promise((resolve, reject) => {
        const req = indexedDB.open(DB_NAME, 1);
        req.onupgradeneeded = (e) => {
            const db = e.target.result;
            if (!db.objectStoreNames.contains(STORE)) {
                db.createObjectStore(STORE, { keyPath: 'id' });
            }
        };
        req.onsuccess = (e) => resolve(e.target.result);
        req.onerror = (e) => reject(e.target.error);
    });
}

function getStoredFile() {
    return new Promise(async (resolve, reject) => {
        try {
            const db = await openDB();
            const tx = db.transaction(STORE, 'readonly');
            const store = tx.objectStore(STORE);
            const req = store.get(FILE_KEY);
            req.onsuccess = () => resolve(req.result || null);
            req.onerror = () => resolve(null);
        } catch (err) { resolve(null); }
    });
}

function storeExcelOnce(file) {
    return new Promise(async (resolve, reject) => {
        try {
            const existing = await getStoredFile();
            if (existing) return resolve({ success: false, reason: 'exists', existing });
            const db = await openDB();
            const tx = db.transaction(STORE, 'readwrite');
            const store = tx.objectStore(STORE);
            const entry = { id: FILE_KEY, name: file.name, blob: file, size: file.size, uploadedAt: new Date().toISOString() };
            const req = store.put(entry);
            req.onsuccess = () => resolve({ success: true, entry });
            req.onerror = (e) => reject(e.target.error);
        } catch (err) { reject(err); }
    });
}

function downloadStoredExcel() {
    return new Promise(async (resolve) => {
        const rec = await getStoredFile();
        if (!rec) return resolve(false);
        const blob = rec.blob;
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = rec.name || 'archivo.xlsx';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        resolve(true);
    });
}

// Parsear ArrayBuffer de Excel al mismo proceso previo (genera reportData y lo guarda en localStorage)
function parseAndStoreWorkbook(arrayBuffer) {
    const data = new Uint8Array(arrayBuffer);
    const workbook = XLSX.read(data, { type: 'array' });
    const preferred = workbook.SheetNames.find(n => n.trim().toLowerCase() === 'powerbi_reportes' || n.trim().toLowerCase() === 'powerbi-reportes' || n.trim().toLowerCase() === 'powerbi reportes');
    const sheetName = preferred || workbook.SheetNames[0];
    if (!sheetName) throw new Error('No sheets found in workbook');
    let parsed = XLSX.utils.sheet_to_json(workbook.Sheets[sheetName]);
    if (!parsed || parsed.length === 0) throw new Error('No rows in selected sheet');
    const sample = parsed[0];
    const deptKey = Object.keys(sample).find(k => k && k.trim().toLowerCase().replace(/\s+/g,'') === 'departamento');
    if (!deptKey) throw new Error('No se encontró la columna Departamento');
    reportData = parsed.map(row => ({ ...row, Departamento: row[deptKey] }));
    localStorage.setItem('reportData', JSON.stringify(reportData));
}

// Comprobar al iniciar si ya hay archivo almacenado. Si existe, desactivar subida y ofrecer descarga.
async function checkStoredOnLoad() {
    const rec = await getStoredFile();
    const info = document.getElementById('stored-file-info');
    const input = document.getElementById('excel-file');
    if (!info) return;
    if (rec) {
        input.disabled = true;
        const sizeKb = rec.size ? Math.round(rec.size / 1024) : '';
        info.innerHTML = `<div style="display:flex;gap:0.5rem;align-items:center;flex-wrap:wrap;"><strong>Archivo almacenado:</strong> ${rec.name} ${sizeKb ? `(${sizeKb} KB)` : ''} <button onclick="downloadStoredExcel()" class="btn-outline">Descargar</button></div>`;
        // Si no hay reportData en localStorage, parsear el blob para restaurarlo
        if (!localStorage.getItem('reportData')) {
            try {
                const arrayBuffer = await rec.blob.arrayBuffer();
                parseAndStoreWorkbook(arrayBuffer);
                console.log('ReportData restaurado desde el archivo persistente.');
            } catch (e) { console.warn('No fue posible procesar el archivo persistente automáticamente.', e); }
        }
    } else {
        input.disabled = false;
        info.innerHTML = `<div style="color:rgba(0,0,0,0.6);">No hay archivo persistente. Sube el Excel una sola vez.</div>`;
    }
}

// Manejo del input: intentar almacenar el archivo solo si no existe ninguno almacenado
document.getElementById('excel-file').addEventListener('change', async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
        const res = await storeExcelOnce(file);
        if (!res.success) {
            alert('Ya existe un archivo subido. No se puede subir otro desde esta interfaz.');
            await checkStoredOnLoad();
            return;
        }
        // Si se almacenó, procesarlo y notificar al admin
        const arrayBuffer = await file.arrayBuffer();
        try {
            parseAndStoreWorkbook(arrayBuffer);
            alert('Archivo subido y guardado de forma persistente. Pulsa "Guardar datos" en Configuración de Datos para generar los códigos de departamento.');
        } catch (parseErr) {
            console.error(parseErr);
            alert('El archivo se subió, pero hubo un problema al procesarlo: ' + (parseErr.message || parseErr));
        }
        await checkStoredOnLoad();
    } catch (err) {
        console.error('Error almacenando el archivo', err);
        alert('Ocurrió un error al guardar el archivo. Revisa la consola del navegador.');
    }
});

// Guardar datos: generar códigos y descargar TXT (botón en admin)
function saveData() {
    if (!reportData || reportData.length === 0) {
        alert('No hay datos cargados. Primero sube el archivo Excel.');
        return;
    }
    // Generar/actualizar códigos usando la función existente
    generateDeptCodes();
    // Mostrar la lista de códigos generados en el panel admin
    const lista = Object.entries(DEPT_CODES).map(([code, dept]) => `<li><b>${code}</b>: ${dept}</li>`).join('');
    const target = document.getElementById('codigos-lista');
    if (target) target.innerHTML = `<h4>Códigos de acceso por departamento:</h4><ul>${lista}</ul><div style="margin-top:0.5rem;"><button class="btn-success" onclick="publishCodes()">Publicar códigos (copiar JSON)</button> <button class="btn-outline" onclick="downloadStoredExcel()">Descargar Excel guardado</button></div>`;
    // Descargar TXT con los códigos
    try {
        const lines = Object.entries(DEPT_CODES).map(([code, dept]) => `${code}: ${dept}`);
        const blob = new Blob([lines.join('\n')], { type: 'text/plain;charset=utf-8' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'codigos_departamentos.txt';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        // Además generar JSON descargable para publicar en el repo/servidor
        try {
            const jsonBlob = new Blob([JSON.stringify(DEPT_CODES, null, 2)], { type: 'application/json' });
            const url2 = URL.createObjectURL(jsonBlob);
            const a2 = document.createElement('a');
            a2.href = url2;
            a2.download = 'dept_codes.json';
            document.body.appendChild(a2);
            a2.click();
            a2.remove();
            URL.revokeObjectURL(url2);
        } catch (e) { console.warn('No se pudo generar JSON de códigos', e); }
    } catch (e) { console.error('Error al generar TXT de códigos', e); }
    alert('Códigos generados y descargados en codigos_departamentos.txt');
}

// Copiar DEPT_CODES como JSON al portapapeles y mostrar instrucciones para subir a GitHub Pages
function publishCodes() {
    if (!DEPT_CODES || Object.keys(DEPT_CODES).length === 0) {
        alert('No hay códigos generados para publicar. Genera los códigos primero con "Guardar datos".');
        return;
    }
    const json = JSON.stringify(DEPT_CODES, null, 2);
    // Intentar usar Clipboard API
    if (navigator.clipboard && navigator.clipboard.writeText) {
        navigator.clipboard.writeText(json).then(() => {
            alert('Códigos copiados al portapapeles. Ahora pega el contenido en un archivo llamado dept_codes.json en la raíz del repositorio y súbelo (commit + push).\n\nInstrucción rápida:\n1) Crear archivo dept_codes.json con el contenido copiado.\n2) Commit + push al repo usado por GitHub Pages.\n3) Esperar a que Pages despliegue.');
        }).catch(() => fallbackCopy(json));
    } else {
        fallbackCopy(json);
    }
}

function fallbackCopy(text) {
    const ta = document.createElement('textarea');
    ta.value = text;
    document.body.appendChild(ta);
    ta.select();
    try {
        document.execCommand('copy');
        alert('Códigos copiados al portapapeles (método alternativo). Ahora crea dept_codes.json y súbelo al repo.');
    } catch (e) {
        // Como último recurso, ofrecer descarga
        const blob = new Blob([text], { type: 'application/json' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = 'dept_codes.json';
        document.body.appendChild(a);
        a.click();
        a.remove();
        URL.revokeObjectURL(url);
        alert('No fue posible copiar al portapapeles. Se descargó dept_codes.json; súbelo al repo.');
    }
    ta.remove();
}

// Intentar cargar un archivo público dept_codes.json desde el servidor (repo) para poblar DEPT_CODES
async function fetchPublicDeptCodes() {
    try {
        const resp = await fetch('dept_codes.json', { cache: 'no-cache' });
        if (!resp.ok) return null;
        const data = await resp.json();
        if (data && typeof data === 'object') {
            DEPT_CODES = data;
            try { localStorage.setItem('DEPT_CODES', JSON.stringify(DEPT_CODES)); } catch (e) { /* ignore */ }
            console.log('Códigos cargados desde dept_codes.json');
            // render admin summary if present
            try { renderAdminSummary(); } catch (e) { /* ignore */ }
            // update codigos-lista display if admin panel visible
            const target = document.getElementById('codigos-lista');
            if (target) {
                const lista = Object.entries(DEPT_CODES).map(([code, dept]) => `<li><b>${code}</b>: ${dept}</li>`).join('');
                target.innerHTML = `<h4>Códigos de acceso por departamento (público):</h4><ul>${lista}</ul>`;
            }
            return data;
        }
    } catch (e) { /* not found or parse error */ }
    return null;
}

function loadDepartmentReports(dept) {
    document.getElementById('dept-title').innerText = `Departamento: ${dept}`;
    const container = document.getElementById('report-list');
    container.innerHTML = "";
    const filtered = reportData.filter(r => r.Departamento === dept);
    if (filtered.length === 0) {
        container.innerHTML = '<div>No hay reportes para este departamento.</div>';
        return;
    }
    // Detectar el nombre real de la columna de reporte (puede variar por mayúsculas/minúsculas o espacios)
    const first = filtered[0];
    let reportNameKey = Object.keys(first).find(k => k.trim().toLowerCase().replace(/\s+/g,"") === "nombrereporte");
    if (!reportNameKey) reportNameKey = Object.keys(first)[1] || ""; // fallback a la segunda columna
    // Detectar columna Link (case-insensitive, ignorando espacios)
    let linkKey = Object.keys(first).find(k => k.trim().toLowerCase().replace(/\s+/g,"") === "link");
    filtered.forEach((report, index) => {
        const nombre = report[reportNameKey] || 'Reporte ' + (index+1);
        const rawLink = linkKey ? (report[linkKey] || '') : '';
        const link = sanitizeUrl(rawLink);
        const linkHtml = link ? `<a href="${link}" target="_blank" rel="noopener" style="color:var(--accent);text-decoration:underline;margin-right:1rem;">Ver reporte</a>` : `<span style="color:rgba(0,0,0,0.5);margin-right:1rem;">Sin enlace</span>`;
        const div = document.createElement('div');
        div.className = 'report-item';
        // Identificador para permitir actualizar la visualización según la clasificación
        div.dataset.reporte = nombre;
        // left content
        const left = document.createElement('div');
        left.style.display = 'flex';
        left.style.alignItems = 'center';
        left.style.gap = '0.75rem';
        left.innerHTML = `${linkHtml}<span>${nombre}</span>`;
        // select element
        const select = document.createElement('select');
        const optEmpty = document.createElement('option'); optEmpty.value = ''; optEmpty.textContent = 'Evaluar...';
        const optB = document.createElement('option'); optB.value = 'Bajo'; optB.textContent = 'Bajo';
        const optM = document.createElement('option'); optM.value = 'Medio'; optM.textContent = 'Medio';
        const optC = document.createElement('option'); optC.value = 'Critico'; optC.textContent = 'Crítico';
        select.appendChild(optEmpty); select.appendChild(optB); select.appendChild(optM); select.appendChild(optC);
        // restore previous evaluation if exists
        const existing = evaluations.find(e => e.reporte === nombre && e.departamento === dept);
        if (existing) {
            select.value = existing.status || '';
            applyStatusClassToDiv(div, existing.status || '');
        }
        // on change, save evaluation including departamento
        select.addEventListener('change', () => saveEval(nombre, select.value, dept));

        div.appendChild(left);
        div.appendChild(select);
        container.appendChild(div);
    });
}

// Aplica / remueve clases visuales en el contenedor del reporte según el estado
function applyStatusClassToDiv(div, status) {
    if (!div) return;
    div.classList.remove('status-bajo', 'status-medio', 'status-critico');
    if (!status) return;
    const s = String(status).toLowerCase();
    if (s === 'bajo' || s === 'baja') div.classList.add('status-bajo');
    else if (s === 'medio' || s === 'media') div.classList.add('status-medio');
    else if (s === 'critico' || s === 'crítico' || s === 'critico') div.classList.add('status-critico');
}

function saveEval(reportName, value, departamento) {
    const index = evaluations.findIndex(e => e.reporte === reportName && e.departamento === departamento);
    const entry = { reporte: reportName, status: value, fecha: new Date().toLocaleDateString(), departamento: departamento };
    if (index > -1) evaluations[index] = Object.assign({}, evaluations[index], entry);
    else evaluations.push(entry);
    // Persistir evaluaciones para que el admin pueda descargarlas posteriormente
    try {
        localStorage.setItem('evaluations', JSON.stringify(evaluations));
    } catch (e) { console.error('Error guardando evaluaciones en localStorage', e); }
    // Actualizar visualmente el estado del reporte en el dashboard del gerente
    try {
        const list = document.getElementById('report-list');
        if (list) {
            const div = Array.from(list.querySelectorAll('.report-item')).find(d => d.dataset.reporte === reportName);
            if (div) applyStatusClassToDiv(div, value);
        }
    } catch (e) { /* ignore UI update errors */ }
    // update admin summary if visible
    try { renderAdminSummary(); } catch (e) { /* ignore */ }
}

function downloadResults() {
    if (!evaluations || evaluations.length === 0) {
        alert('No hay evaluaciones para descargar.');
        return;
    }
    // Map to desired column order: Departamento, Reporte, Status, Fecha
    const rows = evaluations.map(e => ({ Departamento: e.departamento || '', Reporte: e.reporte || '', Status: e.status || '', Fecha: e.fecha || '' }));
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Resultados");
    XLSX.writeFile(wb, "Evaluaciones_Proyectos.xlsx");
}

function showSection(id) {
    document.querySelectorAll('section').forEach(s => s.classList.add('hidden'));
    document.getElementById(id).classList.remove('hidden');
}


function clearData() {
    if (confirm('¿Seguro que deseas borrar los datos cargados? Esto eliminará los reportes y códigos de departamento para todos los usuarios. NOTA: el archivo Excel subido permanece guardado y no se borrará desde esta interfaz.')) {
        // Sólo eliminar datos temporales (reportData, códigos y evaluaciones). El archivo persistente en IndexedDB NO se elimina.
        localStorage.removeItem('reportData');
        localStorage.removeItem('DEPT_CODES');
        localStorage.removeItem('evaluations');
        alert('Datos temporales eliminados. El archivo subido sigue guardado de forma persistente.');
        location.reload();
    }
}


// Cerrar sesión para gerente: mensaje de gracias y advertencia si hay reportes sin evaluar
function logout() {
    // Si está en el dashboard de gerente
    if (!document.getElementById('manager-dashboard').classList.contains('hidden')) {
        // Buscar reportes sin evaluar
        const dept = document.getElementById('dept-title').innerText.replace('Departamento: ', '');
        const filtered = reportData.filter(r => r.Departamento === dept);
        // Detectar el nombre real de la columna de reporte
        let reportNameKey = filtered[0] && Object.keys(filtered[0]).find(k => k.trim().toLowerCase().replace(/\s+/g,"") === "nombrereporte");
        if (!reportNameKey) reportNameKey = filtered[0] && Object.keys(filtered[0])[1] || "";
        const evaluados = evaluations.map(e => e.reporte);
        const sinEvaluar = filtered.filter(r => !evaluados.includes(r[reportNameKey]));
        let msg = 'gracias por llenar\nInteligencia de Negocio';
        if (sinEvaluar.length > 0) {
            msg += `\n\nADVERTENCIA: Dejaste ${sinEvaluar.length} reporte(s) sin evaluar.`;
        }
        // Mostrar notificación en pantalla antes de recargar
        showNotification(msg, 3500).then(() => location.reload());
        return; // evitar recargar de nuevo más abajo
    }
    // fuera del flujo de manager-dashboard, recargar
    location.reload();
}