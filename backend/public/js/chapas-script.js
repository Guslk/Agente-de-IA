// --- CONFIGURAÇÕES E ESTADO GLOBAL ---
const API_URL = '/chapas/api';
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// NOVO: Referências para os campos de dimensão
const currentWidthInput = document.getElementById('current-cut-width');
const currentHeightInput = document.getElementById('current-cut-height');

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
    if (!currentPlate) {
        canvas.width = 800;
        canvas.height = 600;
        ctx.fillStyle = '#f4f7fa'; 
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
    }

    canvas.width = currentPlate.original_width_mm;
    canvas.height = currentPlate.original_height_mm;

    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.strokeStyle = '#000000';
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return; 
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const visualScale = Math.max(scaleX, scaleY);

    const standardLineWidth = 2 * visualScale; 
    
    ctx.strokeStyle = 'blue';
    ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
    ctx.lineWidth = standardLineWidth;
    finishedCuts.forEach(cut => {
        const start = cut[0];
        const width = cut[1].x - start.x;
        const height = cut[3].y - start.y;
        ctx.fillRect(start.x, start.y, width, height);
        ctx.strokeRect(start.x, start.y, width, height);
    });

    // O desenho do 'previewRect' e do 'texto' foi movido para handleMouseMove
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
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0 || canvas.width === 0) return null;
    
    const scaleX = canvas.width / rect.width; 
    const scaleY = canvas.height / rect.height;
    const visualScale = Math.max(scaleX, scaleY);
    
    const SNAP_DISTANCE_LOGICAL = 10 * visualScale; 
    
    let closestEdge = null;
    let minDistance = SNAP_DISTANCE_LOGICAL;
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
        // NOVO: Limpa os campos de dimensão ao iniciar o desenho
        if(currentWidthInput) currentWidthInput.value = '0.0';
        if(currentHeightInput) currentHeightInput.value = '0.0';
    } else {
        setStatusMessage('Clique perto de uma borda para iniciar um novo corte.', 'orange');
    }
}

function handleMouseMove(event) {
    if (!isDrawing) return;

    redrawCanvas(); // Desenha a base

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

    // Desenha a pré-visualização (retângulo)
    const rect = canvas.getBoundingClientRect();
    if (rect.width === 0 || rect.height === 0) return;
    
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const visualScale = Math.max(scaleX, scaleY);

    ctx.lineWidth = 2 * visualScale;
    ctx.strokeStyle = isPreviewOverlapping ? '#FF8C00' : 'red';
    ctx.strokeRect(previewRect.x, previewRect.y, previewRect.w, previewRect.h);
    
    // --- ATUALIZAÇÃO DOS CAMPOS DE TEXTO ---
    // Removemos toda a lógica de ctx.fillText, ctx.setTransform, etc.
    if(currentWidthInput) currentWidthInput.value = Math.abs(previewRect.w).toFixed(1);
    if(currentHeightInput) currentHeightInput.value = Math.abs(previewRect.h).toFixed(1);

    // Nota: Não precisamos mais de ctx.save() e ctx.restore() aqui
}

function handleMouseUp() {
    if (!isDrawing) return;
    isDrawing = false;

    if (isPreviewOverlapping) {
        setStatusMessage('Corte inválido: sobrepõe um corte existente ou tem tamanho nulo.', 'red');
    } else if (!previewRect || Math.abs(previewRect.w) < 5 || Math.abs(previewRect.h) < 5) {
        // Corte muito pequeno, apenas ignora
    } else {
        const finalRect = normalizeRect(previewRect);
        const newRectangle = [
            { x: finalRect.x, y: finalRect.y },
            { x: finalRect.x + finalRect.w, y: finalRect.y },
            { x: finalRect.x + finalRect.w, y: finalRect.y + finalRect.h },
            { x: finalRect.x, y: finalRect.y + finalRect.h }
        ];
        finishedCuts.push(newRectangle);
        setStatusMessage('Corte adicionado. Clique em "Salvar" para persistir.', 'blue');
    }
    
    // Limpa a pré-visualização e redesenha tudo
    previewRect = null;
    snappedEdge = null;
    redrawCanvas();
    
    // NOVO: Limpa os campos de dimensão ao finalizar o desenho
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
    if (statusEl) { // Adiciona verificação se o elemento existe
        statusEl.textContent = message;
        statusEl.style.color = color;
    } else {
        console.warn("Elemento #status-message não encontrado.");
    }
}


// --- FUNÇÕES DE API ---
async function fetchPlates() {
    try {
        const response = await fetch(`${API_URL}/plates`);
        if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();
        const selector = document.getElementById('plate-selector');
        if (!selector) return; // Sai se o elemento não existe
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
        console.error("Erro ao carregar chapas:", error);
        setStatusMessage('Erro ao carregar chapas.', 'red');
    }
}

async function loadCutsForPlate(plateId) {
    try {
        const response = await fetch(`${API_URL}/plates/${plateId}/cuts`);
         if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();

        finishedCuts = result.data.map(dbEntry => {
            if (typeof dbEntry.coordinates === 'string') {
                try {
                    return JSON.parse(dbEntry.coordinates);
                } catch (e) {
                    console.error("Erro ao parsear coordenadas:", dbEntry.coordinates, e);
                    return []; // Retorna array vazio em caso de erro
                }
            }
            // Verifica se já é um array antes de retornar
            return Array.isArray(dbEntry.coordinates) ? dbEntry.coordinates : [];
        }).filter(cut => cut.length > 0); // Filtra arrays vazios

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
        if (!response.ok) {
             const errorData = await response.json().catch(() => ({ error: 'Falha na resposta da API sem JSON.' }));
             throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        setStatusMessage(result.message, 'green');
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

    // Verifica se os elementos existem antes de ler o valor
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
        if(form) form.reset(); // Reseta o formulário se existir
        
        const modal = document.getElementById('new-plate-modal');
        if (modal) modal.style.display = 'none'; // Fecha o modal se existir
        
        fetchPlates(); // Atualiza a lista de chapas
    } catch (error) {
        console.error("Erro na requisição:", error);
        setStatusMessage(`Erro ao criar chapa: ${error.message}`, 'red');
    }
}


// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {
    
    // Verifica se estamos na página correta antes de rodar o script
    // (Adicione um ID único ao body da sua página de chapas, ex: <body id="page-chapas">)
    // if (!document.body.matches('#page-chapas')) {
    //     console.log("Não estamos na página de chapas, script não será executado.");
    //     return; 
    // }

    console.log("DOM carregado, iniciando script de chapas.");

    // Verifica se os elementos essenciais existem
    if (!canvas || !currentWidthInput || !currentHeightInput) {
        console.error("Elementos essenciais do canvas ou campos de dimensão não encontrados. O script não pode continuar.");
        return;
    }
    
    fetchPlates();
    redrawCanvas(); 

    // Lógica do Modal
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
        console.warn("Elementos do modal não encontrados.");
    }

    // Listener do formulário de corte automático
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
                autoCutForm.reset(); // Reseta o formulário
            } else {
                setStatusMessage(`Não foi encontrado espaço para um corte de ${width}x${height}.`, 'red');
            }
        });
    } else {
        console.warn("Formulário #auto-cut-form não encontrado.");
    }

    // Listeners de desenho manual
    canvas.addEventListener('mousedown', handleMouseDown);
    canvas.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);

    // Listeners de controles
    const plateSelector = document.getElementById('plate-selector');
    if (plateSelector) {
        plateSelector.addEventListener('change', (event) => {
            const selectedOption = event.target.options[event.target.selectedIndex];
            const plateDimensionsEl = document.getElementById('plate-dimensions'); // Pega o elemento P

            if (!selectedOption.value) {
                currentPlate = null;
                 if(plateDimensionsEl) plateDimensionsEl.textContent = ''; // Limpa o texto se existe
                finishedCuts = [];
                redrawCanvas();
                return;
            }
            currentPlate = {
                id: selectedOption.value,
                original_width_mm: parseFloat(selectedOption.dataset.width),
                original_height_mm: parseFloat(selectedOption.dataset.height)
            };
            if(plateDimensionsEl) { // Atualiza o texto se existe
               plateDimensionsEl.textContent = `Dimensões: ${currentPlate.original_width_mm}mm x ${currentPlate.original_height_mm}mm`;
            }
            loadCutsForPlate(currentPlate.id);
        });
    } else {
         console.warn("Seletor #plate-selector não encontrado.");
    }
    
    const newPlateForm = document.getElementById('new-plate-form');
    if(newPlateForm) {
        newPlateForm.addEventListener('submit', handleNewPlateSubmit);
    } else {
         console.warn("Formulário #new-plate-form não encontrado.");
    }

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

    console.log("Script de chapas inicializado com sucesso.");
});
