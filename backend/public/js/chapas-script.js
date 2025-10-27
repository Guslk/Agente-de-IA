// --- CONFIGURAÇÕES E ESTADO GLOBAL ---
const API_URL = '/chapas/api';
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

const SNAP_DISTANCE = 10;

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
        candidatePoints.push({ x: cut[1].x, y: cut[0].y });
        candidatePoints.push({ x: cut[0].x, y: cut[3].y });
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
                const finishedRect = {
                    x: cut[0].x, y: cut[0].y,
                    w: cut[1].x - cut[0].x, h: cut[3].y - cut[0].y
                };
                if (rectsOverlap(candidateRect, finishedRect)) {
                    hasCollision = true;
                    break;
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
    return {
        x: rect.w > 0 ? rect.x : rect.x + rect.w,
        y: rect.h > 0 ? rect.y : rect.y + rect.h,
        w: Math.abs(rect.w),
        h: Math.abs(rect.h)
    };
}

function rectsOverlap(rectA, rectB) {
    if (
        rectA.x + rectA.w <= rectB.x ||
        rectA.x >= rectB.x + rectB.w ||
        rectA.y + rectA.h <= rectB.y ||
        rectA.y >= rectB.y + rectB.h
    ) {
        return false;
    }
    return true;
}


// --- FUNÇÕES DE DESENHO ---
function redrawCanvas() {
    canvas.width = currentPlate ? currentPlate.original_width_mm : 800;
    canvas.height = currentPlate ? currentPlate.original_height_mm : 600;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    ctx.strokeStyle = 'blue';
    ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
    ctx.lineWidth = 2;
    finishedCuts.forEach(cut => {
        const start = cut[0];
        const width = cut[1].x - start.x;
        const height = cut[3].y - start.y;
        ctx.fillRect(start.x, start.y, width, height);
        ctx.strokeRect(start.x, start.y, width, height);
    });

    if (isDrawing && previewRect) {
        ctx.strokeStyle = isPreviewOverlapping ? '#FF8C00' : 'red';
        ctx.lineWidth = 2;
        ctx.strokeRect(previewRect.x, previewRect.y, previewRect.w, previewRect.h);
        ctx.fillStyle = isPreviewOverlapping ? '#FF8C00' : 'black';
        ctx.font = '16px Arial';
        ctx.textAlign = 'center';
        const widthText = `${Math.abs(previewRect.w).toFixed(1)}mm`;
        const heightText = `${Math.abs(previewRect.h).toFixed(1)}mm`;
        const textX = previewRect.x + previewRect.w / 2;
        let textY = previewRect.y + previewRect.h / 2;
        if (textY < 20) textY = 20;
        ctx.fillText(`${widthText} x ${heightText}`, textX, textY);
    }
}


// --- LÓGICA DE DESENHO MANUAL COM RESTRIÇÃO DE BORDAS ---
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
        const [p0, p1, p2, p3] = cut;
        edges.push({ p1: p0, p2: p1, type: 'horizontal' });
        edges.push({ p1: p3, p2: p2, type: 'horizontal' });
        edges.push({ p1: p0, p2: p3, type: 'vertical' });
        edges.push({ p1: p1, p2: p2, type: 'vertical' });
    });
    return edges;
}

function findClosestEdge(point) {
    let closestEdge = null;
    let minDistance = SNAP_DISTANCE;
    const edges = getAllAvailableEdges();
    for (const edge of edges) {
        let distance;
        if (edge.type === 'horizontal') {
            const isWithinX = point.x >= Math.min(edge.p1.x, edge.p2.x) && point.x <= Math.max(edge.p1.x, edge.p2.x);
            if (isWithinX) {
                distance = Math.abs(point.y - edge.p1.y);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestEdge = edge;
                }
            }
        } else {
            const isWithinY = point.y >= Math.min(edge.p1.y, edge.p2.y) && point.y <= Math.max(edge.p1.y, edge.p2.y);
            if (isWithinY) {
                distance = Math.abs(point.x - edge.p1.x);
                if (distance < minDistance) {
                    minDistance = distance;
                    closestEdge = edge;
                }
            }
        }
    }
    return closestEdge;
}

function getCanvasCoordinates(event) {
    const rect = canvas.getBoundingClientRect();
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
        if (snappedEdge.type === 'horizontal') {
            startPoint = { x: mousePos.x, y: snappedEdge.p1.y };
        } else {
            startPoint = { x: snappedEdge.p1.x, y: mousePos.y };
        }
    } else {
        setStatusMessage('Clique perto de uma borda para iniciar um novo corte.', 'orange');
    }
}

function handleMouseMove(event) {
    if (!isDrawing) return;
    const currentMousePos = getCanvasCoordinates(event);
    const x1 = startPoint.x, y1 = startPoint.y, x2 = currentMousePos.x, y2 = currentMousePos.y;
    let rectX, rectY, rectW, rectH;

    if (snappedEdge.type === 'horizontal') {
        rectX = x1; rectY = snappedEdge.p1.y; rectW = x2 - x1; rectH = y2 - rectY;
    } else {
        rectX = snappedEdge.p1.x; rectY = y1; rectW = x2 - rectX; rectH = y2 - y1;
    }
    previewRect = { x: rectX, y: rectY, w: rectW, h: rectH };

    isPreviewOverlapping = false;
    const normalizedPreview = normalizeRect(previewRect);

    if (normalizedPreview.w < 1 || normalizedPreview.h < 1) {
        isPreviewOverlapping = true;
    } else {
        for (const cut of finishedCuts) {
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
    redrawCanvas();
}

function handleMouseUp() {
    if (!isDrawing) return;
    isDrawing = false;

    if (isPreviewOverlapping) {
        setStatusMessage('Corte inválido: sobrepõe um corte existente ou tem tamanho nulo.', 'red');
        previewRect = null;
        snappedEdge = null;
        redrawCanvas();
        return;
    }

    if (!previewRect || Math.abs(previewRect.w) < 5 || Math.abs(previewRect.h) < 5) {
        previewRect = null;
        redrawCanvas();
        return;
    }

    const finalRect = normalizeRect(previewRect);
    const newRectangle = [
        { x: finalRect.x, y: finalRect.y },
        { x: finalRect.x + finalRect.w, y: finalRect.y },
        { x: finalRect.x + finalRect.w, y: finalRect.y + finalRect.h },
        { x: finalRect.x, y: finalRect.y + finalRect.h }
    ];
    finishedCuts.push(newRectangle);
    setStatusMessage('Corte adicionado. Clique em "Salvar" para persistir.', 'blue');
    previewRect = null;
    snappedEdge = null;
    redrawCanvas();
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
    statusEl.textContent = message;
    statusEl.style.color = color;
}


// --- FUNÇÕES DE API ---
async function fetchPlates() {
    try {
        const response = await fetch(`${API_URL}/plates`);
        const result = await response.json();
        const selector = document.getElementById('plate-selector');
        selector.innerHTML = '<option value="">-- Selecione uma chapa --</option>';
        result.data.forEach(plate => {
            const option = document.createElement('option');
            option.value = plate.id;
            option.textContent = `${plate.name} (${plate.original_width_mm}mm x ${plate.original_height_mm}mm)`;
            option.dataset.width = plate.original_width_mm;
            option.dataset.height = plate.original_height_mm;
            selector.appendChild(option);
        });
    } catch (error) {
        setStatusMessage('Erro ao carregar chapas.', 'red');
    }
}

// --- FUNÇÃO CORRIGIDA ---
async function loadCutsForPlate(plateId) {
    try {
        const response = await fetch(`${API_URL}/plates/${plateId}/cuts`);
        const result = await response.json();

        // CORREÇÃO: Garante que as coordenadas sejam objetos, não strings.
        finishedCuts = result.data.map(dbEntry => {
            // Se a coordenada for uma string (vinda do SQLite antigo, por exemplo), faz o parse.
            // Se já for um objeto (vinda do MySQL novo), usa diretamente.
            if (typeof dbEntry.coordinates === 'string') {
                return JSON.parse(dbEntry.coordinates);
            }
            return dbEntry.coordinates; // Já está no formato correto
        });

        redrawCanvas();
    } catch (error) {
        console.error("Erro ao carregar ou processar os cortes:", error);
        setStatusMessage('Erro ao carregar os cortes da chapa.', 'red');
    }
}

async function handleSaveCuts() {
    if (!currentPlate) {
        setStatusMessage('Nenhuma chapa selecionada.', 'red');
        return;
    }
    if (isDrawing) {
        setStatusMessage('Finalize o desenho atual antes de salvar.', 'orange');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/plates/${currentPlate.id}/cuts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ cuts: finishedCuts })
        });
        if (!response.ok) throw new Error('Falha na resposta da API.');
        const result = await response.json();
        setStatusMessage(result.message, 'green');
    } catch (error) {
        setStatusMessage('Erro ao salvar os cortes.', 'red');
    }
}

async function handleNewPlateSubmit(event) {
    event.preventDefault();
    const name = document.getElementById('plate-name').value;
    const width = parseFloat(document.getElementById('plate-width').value);
    const height = parseFloat(document.getElementById('plate-height').value);

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
            const errorData = await response.json();
            throw new Error(errorData.error || 'Erro ao criar chapa.');
        }
        setStatusMessage('Chapa cadastrada com sucesso!', 'green');
        document.getElementById('new-plate-form').reset();
        fetchPlates();
    } catch (error) {
        console.error("Erro na requisição:", error);
        setStatusMessage(error.message, 'red');
    }
}


// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    fetchPlates();
    redrawCanvas();
});

document.getElementById('auto-cut-form').addEventListener('submit', (event) => {
    event.preventDefault();
    if (!currentPlate) {
        setStatusMessage('Por favor, selecione uma chapa primeiro.', 'red');
        return;
    }
    const width = parseFloat(document.getElementById('cut-width').value);
    const height = parseFloat(document.getElementById('cut-height').value);
    if (isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
        setStatusMessage('Por favor, insira dimensões válidas.', 'red');
        return;
    }
    const bestPosition = findBestFitPosition(width, height);
    if (bestPosition) {
        const newRectangle = [
            { x: bestPosition.x, y: bestPosition.y },
            { x: bestPosition.x + bestPosition.w, y: bestPosition.y },
            { x: bestPosition.x + bestPosition.w, y: bestPosition.y + bestPosition.h },
            { x: bestPosition.x, y: bestPosition.y + bestPosition.h }
        ];
        finishedCuts.push(newRectangle);
        redrawCanvas();
        setStatusMessage(`Corte de ${width}x${height} adicionado automaticamente!`, 'green');
        document.getElementById('auto-cut-form').reset();
    } else {
        setStatusMessage(`Não foi encontrado espaço para um corte de ${width}x${height}.`, 'red');
    }
});

canvas.addEventListener('mousedown', handleMouseDown);
canvas.addEventListener('mousemove', handleMouseMove);
window.addEventListener('mouseup', handleMouseUp);

document.getElementById('plate-selector').addEventListener('change', (event) => {
    const selectedOption = event.target.options[event.target.selectedIndex];
    if (!selectedOption.value) {
        currentPlate = null;
        document.getElementById('plate-dimensions').textContent = '';
        finishedCuts = [];
        redrawCanvas();
        return;
    }
    currentPlate = {
        id: selectedOption.value,
        original_width_mm: parseFloat(selectedOption.dataset.width),
        original_height_mm: parseFloat(selectedOption.dataset.height)
    };
    document.getElementById('plate-dimensions').textContent = `Dimensões: ${currentPlate.original_width_mm}mm x ${currentPlate.original_height_mm}mm`;
    loadCutsForPlate(currentPlate.id);
});

document.getElementById('new-plate-form').addEventListener('submit', handleNewPlateSubmit);
document.getElementById('btn-undo-cut').addEventListener('click', undoLastCut);
document.getElementById('btn-save-cuts').addEventListener('click', handleSaveCuts);