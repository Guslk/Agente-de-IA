// --- CONFIGURAÇÕES E ESTADO GLOBAL ---
const API_URL = '/chapas/api';

// --- VARIÁVEIS GLOBAIS ---
// Definidas como 'let' e serão atribuídas no DOMContentLoaded
let canvas, ctx, currentWidthInput, currentHeightInput;
let currentPlate = null;
let finishedCuts = [];

// Estado para o desenho
let isDrawing = false;
let startPoint = null;
let snappedEdge = null;
let previewRect = null;
let isPreviewOverlapping = false;


// --- FUNÇÃO DE LÓGICA DE EMPACOTAMENTO (CORTE AUTOMÁTICO) ---
function findBestFitPosition(rectW, rectH) {
    if (!currentPlate) return null;

    const candidatePoints = [{ x: 0, y: 0 }];
    finishedCuts.forEach(cut => {
        if (cut && cut.length === 4 && cut[0] && cut[1] && cut[3]) {
            candidatePoints.push({ x: cut[1].x, y: cut[0].y }); // Canto superior direito
            candidatePoints.push({ x: cut[0].x, y: cut[3].y }); // Canto inferior esquerdo
        }
    });

    let bestFit = null;
    const orientations = [{ w: rectW, h: rectH }, { w: rectH, h: rectW }];

    for (const point of candidatePoints) {
        for (const dim of orientations) {
            const candidateRect = { x: point.x, y: point.y, w: dim.w, h: dim.h };

            if (candidateRect.x + candidateRect.w > currentPlate.original_width_mm + 0.1 ||
                candidateRect.y + candidateRect.h > currentPlate.original_height_mm + 0.1) {
                continue;
            }

            let hasCollision = false;
            for (const cut of finishedCuts) {
                if (cut && cut.length === 4 && cut[0] && cut[1] && cut[3]) {
                    const finishedRect = {
                        x: cut[0].x, y: cut[0].y,
                        w: cut[1].x - cut[0].x, h: cut[3].y - cut[0].y
                    };
                    if (rectsOverlap(candidateRect, finishedRect)) {
                        hasCollision = true;
                        break;
                    }
                }
            }
            if (hasCollision) {
                continue;
            }

            if (!bestFit || candidateRect.y < bestFit.y || (candidateRect.y === bestFit.y && candidateRect.x < bestFit.x)) {
                bestFit = candidateRect;
            }
        }
    }
    return bestFit;
}


// --- FUNÇÕES DE DETECÇÃO DE COLISÃO ---
function normalizeRect(rect) {
    if (!rect) return { x: 0, y: 0, w: 0, h: 0 };
    return {
        x: rect.w > 0 ? rect.x : rect.x + rect.w,
        y: rect.h > 0 ? rect.y : rect.y + rect.h,
        w: Math.abs(rect.w),
        h: Math.abs(rect.h)
    };
}

function rectsOverlap(rectA, rectB) {
    if (!rectA || !rectB) return false;
    const tolerance = 0.1;
    if (
        rectA.x + rectA.w <= rectB.x + tolerance ||
        rectA.x >= rectB.x + rectB.w - tolerance ||
        rectA.y + rectA.h <= rectB.y + tolerance ||
        rectA.y >= rectB.y + rectB.h - tolerance
    ) {
        return false;
    }
    return true;
}


// --- FUNÇÕES DE DESENHO (CHAPAS) ---
function redrawCanvas() {
    if (!canvas || !ctx) return; // Proteção: Não faz nada se o canvas não foi encontrado

    if (!currentPlate) {
        const defaultWidth = canvas.clientWidth || 800;
        const defaultHeight = defaultWidth * 0.75;
        canvas.width = defaultWidth;
        canvas.height = defaultHeight;
        ctx.fillStyle = '#f4f7fa';
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
    }

    canvas.width = currentPlate.original_width_mm;
    canvas.height = currentPlate.original_height_mm;

    const rect = canvas.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const visualScaleForBorder = Math.min(scaleX, scaleY);
    const visualScale = Math.max(scaleX, scaleY);

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#AAAAAA';
    ctx.lineWidth = 1 * visualScaleForBorder;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    const standardLineWidth = 2 * visualScale;
    ctx.strokeStyle = 'blue';
    ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
    ctx.lineWidth = standardLineWidth;
    finishedCuts.forEach(cut => {
        if (cut && cut.length === 4 && cut[0] && cut[1] && cut[3]) {
            const start = cut[0];
            const width = cut[1].x - start.x;
            const height = cut[3].y - start.y;
            ctx.fillRect(start.x, start.y, width, height);
            ctx.strokeRect(start.x, start.y, width, height);
        } else {
            console.warn("Corte inválido encontrado ao desenhar:", cut);
        }
    });
}


// --- LÓGICA DE DESENHO MANUAL (CHAPAS) ---
function getAllAvailableEdges() {
    const edges = [];
    if (!currentPlate) return edges;
    const w = currentPlate.original_width_mm;
    const h = currentPlate.original_height_mm;
    edges.push({ p1: {x:0, y:0}, p2: {x:w, y:0}, type: 'horizontal' });
    edges.push({ p1: {x:0, y:h}, p2: {x:w, y:h}, type: 'horizontal' });
    edges.push({ p1: {x:0, y:0}, p2: {x:0, y:h}, type: 'vertical' });
    edges.push({ p1: {x:w, y:0}, p2: {x:w, y:h}, type: 'vertical' });
    finishedCuts.forEach(cut => {
        if (cut && cut.length === 4 && cut[0] && cut[1] && cut[2] && cut[3]) {
            const [p0, p1, p2, p3] = cut;
            edges.push({ p1: p0, p2: p1, type: 'horizontal' });
            edges.push({ p1: p3, p2: p2, type: 'horizontal' });
            edges.push({ p1: p0, p2: p3, type: 'vertical' });
            edges.push({ p1: p1, p2: p2, type: 'vertical' });
        } else {
             console.warn("getAllAvailableEdges encontrou um corte inválido:", cut);
        }
    });
    return edges;
}

function findClosestEdge(point) {
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0 || canvas.width === 0 || canvas.height === 0) return null;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const SNAP_X_LOGICAL = 10 * scaleX;
    const SNAP_Y_LOGICAL = 10 * scaleY;

    let closestEdge = null;
    let minDistanceRatio = 1.0;

    const edges = getAllAvailableEdges();
    for (const edge of edges) {
        if (!edge || !edge.p1 || !edge.p2) continue;
        let distance, snapThreshold, distanceRatio;

        if (edge.type === 'horizontal') {
            const minX = Math.min(edge.p1.x, edge.p2.x) - SNAP_X_LOGICAL;
            const maxX = Math.max(edge.p1.x, edge.p2.x) + SNAP_X_LOGICAL;
            if (point.x >= minX && point.x <= maxX) {
                distance = Math.abs(point.y - edge.p1.y);
                snapThreshold = SNAP_Y_LOGICAL;
                 if (snapThreshold > 0) {
                     distanceRatio = distance / snapThreshold;
                    if (distance < snapThreshold && distanceRatio < minDistanceRatio) {
                        minDistanceRatio = distanceRatio;
                        closestEdge = edge;
                    }
                }
            }
        } else { // Vertical
            const minY = Math.min(edge.p1.y, edge.p2.y) - SNAP_Y_LOGICAL;
            const maxY = Math.max(edge.p1.y, edge.p2.y) + SNAP_Y_LOGICAL;
             if (point.y >= minY && point.y <= maxY) {
                distance = Math.abs(point.x - edge.p1.x);
                snapThreshold = SNAP_X_LOGICAL;
                if (snapThreshold > 0) {
                    distanceRatio = distance / snapThreshold;
                    if (distance < snapThreshold && distanceRatio < minDistanceRatio) {
                        minDistanceRatio = distanceRatio;
                        closestEdge = edge;
                    }
                }
            }
        }
    }
    return closestEdge;
}

function getCanvasCoordinates(event) {
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
     if (!rect || rect.width === 0 || rect.height === 0) return { x: 0, y: 0 };
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return { x: (event.clientX - rect.left) * scaleX, y: (event.clientY - rect.top) * scaleY };
}

function handleMouseDown(event) {
    if (!currentPlate) {
        setStatusMessage('Selecione uma chapa antes de desenhar.', 'red');
        return;
    }
    const mousePos = getCanvasCoordinates(event);
    snappedEdge = findClosestEdge(mousePos);
    if (snappedEdge) {
        isDrawing = true;
        if (snappedEdge.p1 && snappedEdge.p2) {
            if (snappedEdge.type === 'horizontal') {
                startPoint = { x: mousePos.x, y: snappedEdge.p1.y };
            } else {
                startPoint = { x: snappedEdge.p1.x, y: mousePos.y };
            }
            if(currentWidthInput) currentWidthInput.value = '0.0';
            if(currentHeightInput) currentHeightInput.value = '0.0';
        } else {
             console.error("Borda inválida encontrada no snap:", snappedEdge);
             isDrawing = false;
        }
    } else {
        setStatusMessage('Clique perto de uma borda para iniciar um novo corte.', 'orange');
    }
}

function handleMouseMove(event) {
    if (!isDrawing || !startPoint || !snappedEdge || !canvas) return;

    redrawCanvas();

    const currentMousePos = getCanvasCoordinates(event);
    const x1 = startPoint.x, y1 = startPoint.y, x2 = currentMousePos.x, y2 = currentMousePos.y;
    let rectX, rectY, rectW, rectH;

    if (snappedEdge.p1) {
        if (snappedEdge.type === 'horizontal') {
            rectX = x1; rectY = snappedEdge.p1.y; rectW = x2 - x1; rectH = y2 - rectY;
        } else {
            rectX = snappedEdge.p1.x; rectY = y1; rectW = x2 - rectX; rectH = y2 - y1;
        }
        previewRect = { x: rectX, y: rectY, w: rectW, h: rectH };
    } else {
        console.error("snappedEdge sem p1 em handleMouseMove:", snappedEdge);
        previewRect = null;
        return;
    }

    isPreviewOverlapping = false;
    const normalizedPreview = normalizeRect(previewRect);
    if (normalizedPreview.w < 1 || normalizedPreview.h < 1) {
        isPreviewOverlapping = true;
    } else {
        for (const cut of finishedCuts) {
            if (cut && cut.length === 4 && cut[0] && cut[1] && cut[3]) {
                const finishedRect = {
                    x: cut[0].x, y: cut[0].y,
                    w: cut[1].x - cut[0].x, h: cut[3].y - cut[0].y
                };
                if (rectsOverlap(normalizedPreview, finishedRect)) {
                    isPreviewOverlapping = true;
                    break;
                }
            }
        }
    }

    const rect = canvas.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const visualScale = Math.max(scaleX, scaleY);

    ctx.lineWidth = 2 * visualScale;
    ctx.strokeStyle = isPreviewOverlapping ? '#FF8C00' : 'red';
    if(previewRect) {
        ctx.strokeRect(previewRect.x, previewRect.y, previewRect.w, previewRect.h);
    }

    if(previewRect) {
        if(currentWidthInput) currentWidthInput.value = Math.abs(previewRect.w).toFixed(1);
        if(currentHeightInput) currentHeightInput.value = Math.abs(previewRect.h).toFixed(1);
    } else {
         if(currentWidthInput) currentWidthInput.value = '0.0';
         if(currentHeightInput) currentHeightInput.value = '0.0';
    }
}

function handleMouseUp() {
    if (!isDrawing) return;
    isDrawing = false;

    if (isPreviewOverlapping) {
        setStatusMessage('Corte inválido: sobrepõe um corte existente ou tem tamanho nulo.', 'red');
    } else if (!previewRect || Math.abs(previewRect.w) < 5 || Math.abs(previewRect.h) < 5) {
        // Ignora
    } else {
        const finalRect = normalizeRect(previewRect);
        if (!isNaN(finalRect.x) && !isNaN(finalRect.y) && !isNaN(finalRect.w) && !isNaN(finalRect.h)) {
            const newRectangle = [
                { x: finalRect.x, y: finalRect.y },
                { x: finalRect.x + finalRect.w, y: finalRect.y },
                { x: finalRect.x + finalRect.w, y: finalRect.y + finalRect.h },
                { x: finalRect.x, y: finalRect.y + finalRect.h }
            ];
            if (newRectangle.every(p => typeof p.x === 'number' && typeof p.y === 'number')) {
                finishedCuts.push(newRectangle);
                setStatusMessage('Corte adicionado. Clique em "Salvar" para persistir.', 'blue');
            } else {
                console.error("Tentativa de adicionar retângulo com coordenadas inválidas:", newRectangle);
                 setStatusMessage('Erro ao registrar corte (coordenadas inválidas).', 'red');
            }
        } else {
            console.error("Tentativa de normalizar retângulo inválido:", previewRect);
            setStatusMessage('Erro ao calcular dimensões do corte.', 'red');
        }
    }

    previewRect = null;
    snappedEdge = null;
    startPoint = null;
    redrawCanvas();

    if(currentWidthInput) currentWidthInput.value = '0.0';
    if(currentHeightInput) currentHeightInput.value = '0.0';
}

function undoLastCut() {
    if (finishedCuts.length > 0) {
        finishedCuts.pop();
        setStatusMessage('Último corte desfeito.', 'orange');
        redrawCanvas();
    }
}

function setStatusMessage(message, color = 'green') {
    const statusEl = document.getElementById('status-message');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.style.color = color;
    }
}


// --- FUNÇÕES DE API (CHAPAS) ---
async function fetchPlates() {
    try {
        const response = await fetch(`${API_URL}/plates`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        const selector = document.getElementById('plate-selector');
        if (!selector) return;
        selector.innerHTML = '<option value="">-- Selecione uma chapa --</option>';
        if (result.data && Array.isArray(result.data)) {
            result.data.forEach(plate => {
                const option = document.createElement('option');
                option.value = plate.id;
                option.textContent = `${plate.name} (${plate.original_width_mm}mm x ${plate.original_height_mm}mm)`;
                option.dataset.width = plate.original_width_mm;
                option.dataset.height = plate.original_height_mm;
                selector.appendChild(option);
            });
        }
    } catch (error) {
        console.error("Erro ao carregar chapas:", error);
        setStatusMessage('Erro ao carregar chapas.', 'red');
    }
}

async function loadCutsForPlate(plateId) {
    if (!plateId) {
        finishedCuts = [];
        redrawCanvas();
        return;
    }
    try {
        const response = await fetch(`${API_URL}/plates/${plateId}/cuts`);
         if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();

        if (result.data && Array.isArray(result.data)) {
            finishedCuts = result.data.map(dbEntry => {
                let coordinates = dbEntry.coordinates;
                 if (typeof coordinates === 'string') {
                    try {
                        coordinates = JSON.parse(coordinates);
                    } catch (e) {
                        console.error("Erro ao parsear coordenadas:", coordinates, e);
                        return null;
                    }
                }
                if (Array.isArray(coordinates) && coordinates.length === 4 && coordinates.every(p => p && typeof p.x === 'number' && typeof p.y === 'number')) {
                     return coordinates;
                } else {
                     console.warn("Coordenadas inválidas recebidas do DB:", dbEntry.coordinates);
                     return null;
                }
            }).filter(cut => cut !== null);
        } else {
            console.warn("API retornou dados de cortes inválidos:", result);
            finishedCuts = [];
        }

        redrawCanvas();
    } catch (error) {
        console.error("Erro ao carregar ou processar os cortes:", error);
        setStatusMessage('Erro ao carregar os cortes da chapa.', 'red');
        finishedCuts = [];
        redrawCanvas();
    }
}

async function handleSaveCuts() {
    if (!currentPlate || !currentPlate.id) {
        setStatusMessage('Nenhuma chapa selecionada.', 'red');
        return;
    }
    if (isDrawing) {
        setStatusMessage('Finalize o desenho atual antes de salvar.', 'orange');
        return;
    }
    if (!Array.isArray(finishedCuts)) {
        console.error("finishedCuts não é um array:", finishedCuts);
        setStatusMessage('Erro interno ao preparar dados para salvar.', 'red');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/plates/${currentPlate.id}/cuts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cuts: finishedCuts })
        });
        if (!response.ok) {
             const errorData = await response.json().catch(() => ({ error: 'Falha na resposta da API sem JSON.' }));
             throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        setStatusMessage(result.message || 'Cortes salvos com sucesso!', 'green');
    } catch (error) {
        console.error("Erro ao salvar cortes:", error);
        setStatusMessage(`Erro ao salvar os cortes: ${error.message}`, 'red');
    }
}

async function handleNewPlateSubmit(event) {
    event.preventDefault();
    const nameInput = document.getElementById('plate-name');
    const widthInput = document.getElementById('plate-width');
    const heightInput = document.getElementById('plate-height');

    const name = nameInput ? nameInput.value : null;
    const width = widthInput ? parseFloat(widthInput.value) : NaN;
    const height = heightInput ? parseFloat(heightInput.value) : NaN;

    if (!name || isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
        setStatusMessage('Por favor, preencha todos os campos com valores válidos.', 'red');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/plates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, width, height })
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Erro ao criar chapa sem JSON.' }));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        setStatusMessage('Chapa cadastrada com sucesso!', 'green');

        const form = document.getElementById('new-plate-form');
        if(form) form.reset();

        const modal = document.getElementById('new-plate-modal');
        if (modal) modal.style.display = 'none';

        fetchPlates();
    } catch (error) {
        console.error("Erro na requisição:", error);
        setStatusMessage(`Erro ao criar chapa: ${error.message}`, 'red');
    }
}


// --- NOVAS FUNÇÕES DE API (BARRAS) ---

// Define uma mensagem de status específica para a aba de barras
function setBarStatusMessage(message, color = 'green') {
    const statusEl = document.getElementById('bar-status-message');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.style.color = color;
    }
}

// Carrega a lista de barras disponíveis
async function fetchBars() {
    try {
        // Assume uma nova rota /api/bars
        const response = await fetch(`${API_URL}/bars`); 
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        const selector = document.getElementById('bar-selector');
        if (!selector) return;
        selector.innerHTML = '<option value="">-- Selecione uma barra --</option>';
        if (result.data && Array.isArray(result.data)) {
            result.data.forEach(bar => {
                const option = document.createElement('option');
                option.value = bar.id;
                // Exemplo: "Barra Inox (Restante: 2500mm)"
                option.textContent = `${bar.name} (Restante: ${bar.remaining_length}mm)`;
                option.dataset.remaining = bar.remaining_length;
                selector.appendChild(option);
            });
        }
    } catch (error) {
        console.error("Erro ao carregar barras:", error);
        setBarStatusMessage('Erro ao carregar barras.', 'red');
    }
}

// Submete o consumo de uma barra
async function handleConsumeBar(event) {
    event.preventDefault();
    
    const selector = document.getElementById('bar-selector');
    const lengthInput = document.getElementById('bar-consume-length');
    
    const barId = selector ? selector.value : null;
    const lengthToConsume = lengthInput ? parseFloat(lengthInput.value) : NaN;
    
    // Validação
    if (!barId) {
        setBarStatusMessage('Por favor, selecione uma barra.', 'red');
        return;
    }
    if (isNaN(lengthToConsume) || lengthToConsume <= 0) {
        setBarStatusMessage('Por favor, insira um comprimento válido para consumir.', 'red');
        return;
    }
    
    const selectedOption = selector.options[selector.selectedIndex];
    if (!selectedOption || !selectedOption.dataset.remaining) {
         setBarStatusMessage('Erro ao ler dados da barra selecionada.', 'red');
         return;
    }
    
    const remainingLength = parseFloat(selectedOption.dataset.remaining);
    if (lengthToConsume > remainingLength) {
         setBarStatusMessage(`Erro: Consumo (${lengthToConsume}mm) é maior que o restante (${remainingLength}mm).`, 'red');
         return;
    }

    try {
        // Assume uma rota /api/bars/consume para registrar o consumo
        const response = await fetch(`${API_URL}/bars/consume`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                barId: barId, 
                consumedLength: lengthToConsume 
            })
        });
        
        if (!response.ok) {
             const errorData = await response.json().catch(() => ({ error: 'Falha na resposta da API sem JSON.' }));
             throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        setBarStatusMessage(result.message || 'Consumo registrado com sucesso!', 'green');
        
        // Limpa o formulário e recarrega a lista de barras
        const barForm = document.getElementById('bar-consume-form');
        if(barForm) barForm.reset();
        
        await fetchBars(); // Espera as barras recarregarem
        
        // Define o seletor para a barra que acabamos de atualizar (se ela ainda existir)
        if(selector) selector.value = barId;
        
        // Recarrega o histórico da barra
        loadBarHistory(barId);

    } catch (error) {
         console.error("Erro ao consumir barra:", error);
         setBarStatusMessage(`Erro: ${error.message}`, 'red');
    }
}

// Carrega o histórico de consumo de uma barra específica
async function loadBarHistory(barId) {
    const tableBody = document.getElementById('bar-history-tablebody');
    if (!tableBody) return;

    if (!barId) {
        tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Selecione uma barra para ver o histórico.</td></tr>';
        return;
    }
    
    try {
        tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Carregando...</td></tr>';
        // Assume rota /api/bars/:id/history
        const response = await fetch(`${API_URL}/bars/${barId}/history`); 
        if (!response.ok) throw new Error('Falha ao carregar histórico.');
        
        const result = await response.json();
        
        if (result.data && result.data.length > 0) {
            tableBody.innerHTML = ''; // Limpa a tabela
            result.data.forEach(entry => {
                tableBody.innerHTML += `
                    <tr>
                        <td>${new Date(entry.date).toLocaleString('pt-BR')}</td>
                        <td>${entry.consumed_length} mm</td>
                        <td>${entry.consumed_by_user || 'N/A'}</td>
                    </tr>
                `;
            });
        } else {
            tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Nenhum histórico de consumo para esta barra.</td></tr>';
        }
    } catch (error) {
        console.error("Erro ao carregar histórico da barra:", error);
        tableBody.innerHTML = `<tr><td colspan="3" style="text-align: center; color: red;">${error.message}</td></tr>`;
    }
}


// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {

    console.log("DOM carregado, iniciando script de chapas.");

    // --- ATRIBUIÇÃO ROBUSTA DE VARIÁVEIS DO DOM ---
    canvas = document.getElementById('canvas');
    ctx = canvas ? canvas.getContext('2d') : null;
    currentWidthInput = document.getElementById('current-cut-width');
    currentHeightInput = document.getElementById('current-cut-height');

    // --- LÓGICA DE NAVEGAÇÃO DE ABAS ---
    const btnViewChapas = document.getElementById('btn-view-chapas');
    const btnViewBarras = document.getElementById('btn-view-barras');
    const chapasView = document.getElementById('chapas-view');
    const barrasView = document.getElementById('barras-view');
    const btnAddChapa = document.getElementById('open-modal-btn');
    const btnAddBarra = document.getElementById('open-bar-modal-btn'); 

    if (btnViewChapas && btnViewBarras && chapasView && barrasView) {
        btnViewChapas.addEventListener('click', () => {
            chapasView.style.display = 'block';
            barrasView.style.display = 'none';
            btnViewChapas.classList.add('active');
            btnViewBarras.classList.remove('active');
            
            if(btnAddChapa) btnAddChapa.style.display = 'inline-flex';
            if(btnAddBarra) btnAddBarra.style.display = 'none';
        });

        btnViewBarras.addEventListener('click', () => {
            chapasView.style.display = 'none';
            barrasView.style.display = 'block';
            btnViewChapas.classList.remove('active');
            btnViewBarras.classList.add('active');
            
            if(btnAddChapa) btnAddChapa.style.display = 'none';
            if(btnAddBarra) btnAddBarra.style.display = 'inline-flex';

            const barSelector = document.getElementById('bar-selector');
            if (barSelector && barSelector.options.length <= 1) {
                fetchBars();
            }
        });
    } else {
        console.warn("Elementos de navegação Chapas/Barras não encontrados.");
    }

    // --- LÓGICA DA ABA CHAPAS ---
    if (canvas && ctx && currentWidthInput && currentHeightInput) {
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
        canvas.addEventListener('mouseleave', () => {
             if (isDrawing) {
                 isDrawing = false;
                 previewRect = null;
                 snappedEdge = null;
                 startPoint = null;
                 redrawCanvas(); 
                 if(currentWidthInput) currentWidthInput.value = '0.0';
                 if(currentHeightInput) currentHeightInput.value = '0.0';
                 setStatusMessage('Desenho cancelado (mouse fora da área).', 'orange');
            }
        });
        window.addEventListener('mouseup', handleMouseUp);
    } else {
        console.warn("Elementos do canvas de Chapas não encontrados. Desenho desabilitado.");
    }

    const plateSelector = document.getElementById('plate-selector');
    if (plateSelector) {
        fetchPlates();
        plateSelector.addEventListener('change', (event) => {
            const selectedOption = event.target.options[event.target.selectedIndex];
            const plateDimensionsEl = document.getElementById('plate-dimensions');

            if (!selectedOption || !selectedOption.value) {
                currentPlate = null;
                 if(plateDimensionsEl) plateDimensionsEl.textContent = '';
                finishedCuts = [];
                redrawCanvas();
                if(currentWidthInput) currentWidthInput.value = '0.0';
                if(currentHeightInput) currentHeightInput.value = '0.0';
                return;
            }
            if (selectedOption.dataset && selectedOption.dataset.width && selectedOption.dataset.height) {
                currentPlate = {
                    id: selectedOption.value,
                    original_width_mm: parseFloat(selectedOption.dataset.width),
                    original_height_mm: parseFloat(selectedOption.dataset.height)
                };
                if(plateDimensionsEl) {
                   plateDimensionsEl.textContent = `Dimensões: ${currentPlate.original_width_mm}mm x ${currentPlate.original_height_mm}mm`;
                }
                loadCutsForPlate(currentPlate.id);
                 if(currentWidthInput) currentWidthInput.value = '0.0';
                 if(currentHeightInput) currentHeightInput.value = '0.0';
            } else {
                 console.error("Opção selecionada não contém dimensões:", selectedOption);
                 currentPlate = null;
                 finishedCuts = [];
                 redrawCanvas();
                 setStatusMessage("Erro ao ler dimensões da chapa selecionada.", "red");
            }
        });
    } else {
         console.warn("Seletor #plate-selector não encontrado.");
    }
    
    redrawCanvas(); // Desenha o canvas vazio inicial

    // Modal de Cadastro de Chapas
    const modal = document.getElementById('new-plate-modal');
    const openBtn = document.getElementById('open-modal-btn');
    const closeBtn = document.getElementById('close-modal-btn');
    if (modal && openBtn && closeBtn) {
        openBtn.onclick = () => { modal.style.display = 'flex'; };
        closeBtn.onclick = () => { modal.style.display = 'none'; };
        window.onclick = (event) => {
            if (event.target == modal) {
                modal.style.display = 'none';
            }
        };
    } else {
        console.warn("Elementos do modal de cadastro não encontrados.");
    }

    // Formulário de corte automático (Chapas)
    const autoCutForm = document.getElementById('auto-cut-form');
    if (autoCutForm) {
        autoCutForm.addEventListener('submit', (event) => {
            event.preventDefault();
            if (!currentPlate) {
                setStatusMessage('Por favor, selecione uma chapa primeiro.', 'red');
                return;
            }
            const widthInput = document.getElementById('cut-width');
            const heightInput = document.getElementById('cut-height');
            const width = widthInput ? parseFloat(widthInput.value) : NaN;
            const height = heightInput ? parseFloat(heightInput.value) : NaN;

            if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
                setStatusMessage('Por favor, insira dimensões válidas.', 'red');
                return;
            }
            const bestPosition = findBestFitPosition(width, height);
            if (bestPosition && !isNaN(bestPosition.x) && !isNaN(bestPosition.y) && !isNaN(bestPosition.w) && !isNaN(bestPosition.h)) {
                 const newRectangle = [
                    { x: bestPosition.x, y: bestPosition.y },
                    { x: bestPosition.x + bestPosition.w, y: bestPosition.y },
                    { x: bestPosition.x + bestPosition.w, y: bestPosition.y + bestPosition.h },
                    { x: bestPosition.x, y: bestPosition.y + bestPosition.h }
                ];
                if (newRectangle.every(p => typeof p.x === 'number' && typeof p.y === 'number')) {
                    finishedCuts.push(newRectangle);
                    redrawCanvas();
                    setStatusMessage(`Corte de ${width}x${height} adicionado automaticamente!`, 'green');
                    autoCutForm.reset();
                } else {
                    console.error("Corte automático gerou coordenadas inválidas:", newRectangle);
                    setStatusMessage('Erro ao adicionar corte automático (coordenadas inválidas).', 'red');
                }
            } else {
                setStatusMessage(`Não foi encontrado espaço para um corte de ${width}x${height}.`, 'red');
            }
        });
    } else {
        console.warn("Formulário #auto-cut-form não encontrado.");
    }
    
    // Formulário de cadastro de Chapa
    const newPlateForm = document.getElementById('new-plate-form');
    if(newPlateForm) {
        newPlateForm.addEventListener('submit', handleNewPlateSubmit);
    } else {
         console.warn("Formulário #new-plate-form não encontrado.");
    }

    // Botões de controle de Chapas
    const undoBtn = document.getElementById('btn-undo-cut');
    if(undoBtn) {
        undoBtn.addEventListener('click', undoLastCut);
    } else {
        console.warn("Botão #btn-undo-cut não encontrado.");
    }

    const saveBtn = document.getElementById('btn-save-cuts');
    if(saveBtn) {
        saveBtn.addEventListener('click', handleSaveCuts);
    } else {
        console.warn("Botão #btn-save-cuts não encontrado.");
    }

    // --- LÓGICA DA ABA BARRAS ---
    const barConsumeForm = document.getElementById('bar-consume-form');
    if (barConsumeForm) {
        barConsumeForm.addEventListener('submit', handleConsumeBar);
    } else {
        console.warn("Formulário #bar-consume-form não encontrado.");
    }

    const barSelector = document.getElementById('bar-selector');
    if (barSelector) {
        barSelector.addEventListener('change', (event) => {
            const selectedOption = event.target.options[event.target.selectedIndex];
            const barDimensionsEl = document.getElementById('bar-dimensions');
            if (!selectedOption || !selectedOption.value) {
                if (barDimensionsEl) barDimensionsEl.textContent = '';
                loadBarHistory(null); // Limpa o histórico
                return;
            }
            if (selectedOption.dataset && selectedOption.dataset.remaining) {
                const remaining = selectedOption.dataset.remaining;
                if (barDimensionsEl) {
                    barDimensionsEl.textContent = `Comprimento restante: ${remaining}mm`;
                }
                loadBarHistory(selectedOption.value); // Carrega o histórico
            } else {
                 console.warn("Opção de barra selecionada não contém dados restantes:", selectedOption);
            }
        });
    } else {
        console.warn("Seletor #bar-selector não encontrado.");
    }
    
    console.log("Script de chapas inicializado com sucesso.");
});

