// --- CONFIGURAÇÕES E ESTADO GLOBAL ---
const API_URL = '/chapas/api';

// --- VARIÁVEIS GLOBAIS ---
let canvas, ctx, currentWidthInput, currentHeightInput;
let currentPlate = null;
let finishedCuts = [];
let originalCutCount = 0;

let renderScale = 1.0; // Fator de escala (mm -> pixels)
let offsetX = 0;       // Deslocamento X para centralizar
let offsetY = 0;       // Deslocamento Y para centralizar

// Estado para o desenho
let isDrawing = false;
let startPoint = null;
let snappedEdge = null;
let previewRect = null;
let isPreviewOverlapping = false;


// --- FUNÇÃO DE LÓGICA DE EMPACOTAMENTO (CORTE AUTOMÁTICO) ---
// ATUALIZADA: Agora busca o melhor encaixe por "pontuação" (Max Contact)
function findBestFitPosition(rectW, rectH) {
    if (!currentPlate) return null;

    const candidatePoints = [{ x: 0, y: 0 }];
    finishedCuts.forEach(cut => {
        if (cut && cut.length === 4 && cut[0] && cut[1] && cut[3]) {
            // Adiciona os cantos de todos os cortes existentes como pontos de partida
            candidatePoints.push({ x: cut[1].x, y: cut[0].y }); // Canto superior direito
            candidatePoints.push({ x: cut[0].x, y: cut[3].y }); // Canto inferior esquerdo
            candidatePoints.push({ x: cut[1].x, y: cut[3].y }); // Canto inferior direito
        }
    });

    let bestFit = null;
    let highestScore = -1; // Procuramos a MAIOR pontuação de contato
    
    const orientations = [{ w: rectW, h: rectH }, { w: rectH, h: rectW }];

    for (const point of candidatePoints) {
        for (const dim of orientations) {
            const candidateRect = { x: point.x, y: point.y, w: dim.w, h: dim.h };

            // 1. Checa se está dentro da chapa
            if (candidateRect.x + candidateRect.w > currentPlate.original_width_mm + 0.1 ||
                candidateRect.y + candidateRect.h > currentPlate.original_height_mm + 0.1) {
                continue; // Fora da chapa
            }

            // 2. Checa colisão com cortes existentes
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
                continue; // Sobrepõe outro corte
            }

            // 3. (NOVO) Se é um local válido, calcula sua pontuação
            const score = calculateContactScore(candidateRect, finishedCuts, currentPlate);

            // 4. (NOVO) Compara a pontuação
            // Se a pontuação for maior, este é o novo "bestFit"
            if (score > highestScore) {
                highestScore = score;
                bestFit = candidateRect;
            } 
            // Se for igual, usamos a regra antiga (menor Y, menor X) para desempatar
            else if (score === highestScore) {
                if (!bestFit || candidateRect.y < bestFit.y || (candidateRect.y === bestFit.y && candidateRect.x < bestFit.x)) {
                    bestFit = candidateRect;
                }
            }
        }
    }
    
    // Se não encontrou nenhum lugar com pontuação > -1 (ou seja, nenhum lugar)
    // bestFit ainda será null.
    // Caso contrário, retorna o corte válido com a maior pontuação de contato.
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
    if (!canvas || !ctx) return;

    // 1. Define o tamanho do bitmap para o tamanho de exibição (CSS)
    const displayWidth = canvas.clientWidth;
    const displayHeight = canvas.clientHeight;

    if (displayWidth === 0 || displayHeight === 0) return; // Canvas não está visível

    canvas.width = displayWidth;
    canvas.height = displayHeight;

    // Limpa com a cor de fundo padrão
    ctx.fillStyle = '#f4f7fa';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    if (!currentPlate) {
        return; // Nada para desenhar
    }

    // --- LÓGICA DE ESCALA ---
    const plateWidth = currentPlate.original_width_mm;
    const plateHeight = currentPlate.original_height_mm;

    // 2. Calcula a melhor escala para caber na tela, com 2% de padding
    // A MUDANÇA ESTÁ AQUI: 0.95 foi alterado para 0.98
    const scaleX = (canvas.width / plateWidth) * 0.98;
    const scaleY = (canvas.height / plateHeight) * 0.98;
    renderScale = Math.min(scaleX, scaleY); // Usa a menor escala para caber

    // 3. Calcula o tamanho em pixels e o offset para centralizar
    const scaledWidth = plateWidth * renderScale;
    const scaledHeight = plateHeight * renderScale;
    offsetX = (canvas.width - scaledWidth) / 2;
    offsetY = (canvas.height - scaledHeight) / 2;

    // 4. Salva o estado, limpa transformações, e aplica a nova
    ctx.save();
    ctx.setTransform(1, 0, 0, 1, 0, 0); // Reseta
    ctx.translate(offsetX, offsetY);    // Move a origem (0,0)
    ctx.scale(renderScale, renderScale);  // Aplica a escala

    // --- DESENHA OS ELEMENTOS EM COORDENADAS LÓGICAS (mm) ---

    // Desenha o fundo da chapa
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, plateWidth, plateHeight);

    // Desenha a borda da chapa (linha de 1px visual)
    ctx.strokeStyle = '#AAAAAA';
    ctx.lineWidth = 1 / renderScale; // Largura da linha "ao contrário"
    ctx.strokeRect(0, 0, plateWidth, plateHeight);

    // Desenha os cortes finalizados (linha de 2px visual)
    const standardLineWidth = 2 / renderScale;
    ctx.strokeStyle = 'blue';
    ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
    ctx.lineWidth = standardLineWidth;

    finishedCuts.forEach(cut => {
        if (cut && cut.length === 4 && cut[0] && cut[1] && cut[3]) {
            const start = cut[0];
            const width = cut[1].x - start.x;
            const height = cut[3].y - start.y;
            // Coordenadas já estão em mm, o canvas cuida de escalar
            ctx.fillRect(start.x, start.y, width, height);
            ctx.strokeRect(start.x, start.y, width, height);
        } else {
            console.warn("Corte inválido encontrado ao desenhar:", cut);
        }
    });

    // Desenha o retângulo de pré-visualização (se estiver desenhando)
    if (previewRect) {
        ctx.lineWidth = standardLineWidth;
        ctx.strokeStyle = isPreviewOverlapping ? '#FF8C00' : 'red';
        ctx.strokeRect(previewRect.x, previewRect.y, previewRect.w, previewRect.h);
    }

    // Restaura o contexto para o estado normal
    ctx.restore();
}

function isRectOutOfBounds(rect, plate) {
    if (!rect || !plate) return true;
    const tolerance = 0.1; // Pequena tolerância para problemas de ponto flutuante

    // Checa se o retângulo (que já é normalizado) está fora dos limites
    if (rect.x < -tolerance ||
        rect.y < -tolerance ||
        rect.x + rect.w > plate.original_width_mm + tolerance ||
        rect.y + rect.h > plate.original_height_mm + tolerance) 
    {
        return true; // Está fora
    }
    return false; // Está dentro
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
    if (!canvas || renderScale === 0) return null; // Proteção

    // Define a distância de "snap" como 10 pixels visuais,
    // e converte para a unidade lógica (mm)
    const SNAP_LOGICAL = 10 / renderScale;

    let closestEdge = null;
    let minDistanceRatio = 1.0;

    const edges = getAllAvailableEdges();
    for (const edge of edges) {
        if (!edge || !edge.p1 || !edge.p2) continue;
        let distance, snapThreshold, distanceRatio;

        if (edge.type === 'horizontal') {
            // Expande a área de snap em X também
            const minX = Math.min(edge.p1.x, edge.p2.x) - SNAP_LOGICAL;
            const maxX = Math.max(edge.p1.x, edge.p2.x) + SNAP_LOGICAL;
            if (point.x >= minX && point.x <= maxX) {
                distance = Math.abs(point.y - edge.p1.y);
                snapThreshold = SNAP_LOGICAL; // Snap em Y
                if (snapThreshold > 0) {
                    distanceRatio = distance / snapThreshold;
                    if (distance < snapThreshold && distanceRatio < minDistanceRatio) {
                        minDistanceRatio = distanceRatio;
                        closestEdge = edge;
                    }
                }
            }
        } else { // Vertical
            // Expande a área de snap em Y
            const minY = Math.min(edge.p1.y, edge.p2.y) - SNAP_LOGICAL;
            const maxY = Math.max(edge.p1.y, edge.p2.y) + SNAP_LOGICAL;
            if (point.y >= minY && point.y <= maxY) {
                distance = Math.abs(point.x - edge.p1.x);
                snapThreshold = SNAP_LOGICAL; // Snap em X
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

    // Proteção contra divisão por zero se a escala for 0
    if (!rect || rect.width === 0 || rect.height === 0 || renderScale === 0) {
        return { x: 0, y: 0 };
    }

    // 1. Pega a posição do mouse em *pixels* relativos ao canvas
    const pixelX = event.clientX - rect.left;
    const pixelY = event.clientY - rect.top;

    // 2. Converte de pixels para coordenadas lógicas (mm)
    // (pixelX = logicalX * renderScale + offsetX) ->
    // logicalX = (pixelX - offsetX) / renderScale
    const logicalX = (pixelX - offsetX) / renderScale;
    const logicalY = (pixelY - offsetY) / renderScale;

    return { x: logicalX, y: logicalY };
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
    if (!canvas) return;

    if (isDrawing) {
        // --- LÓGICA DE DESENHO (QUANDO O MOUSE ESTÁ PRESSIONADO) ---
        if (!startPoint || !snappedEdge) return; // Proteção

        const currentMousePos = getCanvasCoordinates(event); // Pega coords LÓGICAS
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
        } else if (isRectOutOfBounds(normalizedPreview, currentPlate)) {
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

        if(previewRect) {
            if(currentWidthInput) currentWidthInput.value = Math.abs(previewRect.w).toFixed(1);
            if(currentHeightInput) currentHeightInput.value = Math.abs(previewRect.h).toFixed(1);
        } else {
             if(currentWidthInput) currentWidthInput.value = '0.0';
             if(currentHeightInput) currentHeightInput.value = '0.0';
        }

        redrawCanvas();

    } else {
        // --- LÓGICA DE HOVER (QUANDO O MOUSE ESTÁ SOLTO) ---
        const currentMousePos = getCanvasCoordinates(event); // Pega coords LÓGICAS
        const hoveredEdge = findClosestEdge(currentMousePos);

        if (hoveredEdge) {
            if (hoveredEdge.type === 'horizontal') {
                canvas.style.cursor = 'ns-resize'; // Cursor Vertical (Norte-Sul)
            } else {
                canvas.style.cursor = 'ew-resize'; // Cursor Horizontal (Leste-Oeste)
            }
        } else {
            canvas.style.cursor = 'crosshair'; // Cursor Padrão de Desenho
        }
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
            if (newRectangle.every(p => p && typeof p.x === 'number' && typeof p.y === 'number')) {
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
    
    if (finishedCuts.length > originalCutCount) {
        finishedCuts.pop();
        setStatusMessage('Último corte (novo) desfeito.', 'orange');
        redrawCanvas();
    } else {
        setStatusMessage('Não é possível desfazer cortes que já estavam salvos.', 'red');
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
        if(setStatusMessage) setStatusMessage('Erro ao carregar chapas.', 'red');
    }
}

async function loadCutsForPlate(plateId) {
    if (!plateId) {
        finishedCuts = [];
        originalCutCount = 0;
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
            originalCutCount = finishedCuts.length;
        } else {
            console.warn("API retornou dados de cortes inválidos:", result);
            finishedCuts = [];
            originalCutCount = 0;
        }

        redrawCanvas();
    } catch (error) {
        console.error("Erro ao carregar ou processar os cortes:", error);
        setStatusMessage('Erro ao carregar os cortes da chapa.', 'red');
        finishedCuts = [];
        originalCutCount = 0;
        redrawCanvas();
    }
}

async function loadPlateHistory(plateId) {
    const tableBody = document.getElementById('plate-history-tablebody');
    const container = document.getElementById('plate-history-container');
    if (!tableBody || !container) return;

    // Use o colspan correto (5)
    const colspan = 5;

    if (!plateId) {
        tableBody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center;">Selecione uma chapa para ver o histórico.</td></tr>`;
        container.style.display = 'none';
        return;
    }
    
    try {
        tableBody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center;">Carregando histórico...</td></tr>`;
        container.style.display = 'block';

        const response = await fetch(`${API_URL}/plates/${plateId}/history`); 
        if (!response.ok) throw new Error('Falha ao carregar histórico de peças.');
        
        const result = await response.json();
        
        if (result.data && result.data.length > 0) {
            tableBody.innerHTML = ''; 
            result.data.forEach(item => {
                // Extrai dimensões
                const dimMatch = item.description.match(/Peça de (.*?) \(/);
                const dimensions = dimMatch ? dimMatch[1] : 'N/A';
                
                // Extrai data do código
                let creationDate = "Data N/A";
                if (item.code) {
                    const parts = item.code.split('-');
                    if (parts.length >= 3) {
                        const timestamp = Number(parts[2]);
                        if (!isNaN(timestamp)) {
                            creationDate = new Date(timestamp).toLocaleString('pt-BR', {
                                dateStyle: 'short', 
                                timeStyle: 'short'
                            });
                        }
                    }
                }
                
                // --- INÍCIO DA NOVA LÓGICA (EXTRAIR USUÁRIO) ---
                const userMatch = item.description.match(/Criado por: (.*?)\./);
                const userName = userMatch ? userMatch[1] : 'N/A';
                // --- FIM DA NOVA LÓGICA ---
                
                tableBody.innerHTML += `
                    <tr>
                        <td>${creationDate}</td>
                        <td>${item.name}</td>
                        <td>${dimensions}</td>
                        <td>${userName}</td> <td><code>${item.code}</code></td>
                    </tr>
                `;
            });
        } else {
            tableBody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center;">Nenhuma peça de estoque foi criada a partir desta chapa.</td></tr>`;
        }
    } catch (error) {
        console.error("Erro ao carregar histórico da chapa:", error);
        tableBody.innerHTML = `<tr><td colspan="${colspan}" style="text-align: center; color: red;">${error.message}</td></tr>`;
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

    const createItemsCheckbox = document.getElementById('plate-create-item-check');
    const shouldCreateItems = createItemsCheckbox ? createItemsCheckbox.checked : false;

    let payload = {
        cuts: finishedCuts, // Sempre envia a lista completa de cortes para salvar
        createItems: false,
        cutsToCreateItemsFor: [] // Por padrão, não cria itens
    };

    if (shouldCreateItems) {
        // Pega apenas os cortes que foram adicionados *depois* dos que foram carregados
        const newCuts = finishedCuts.slice(originalCutCount);
        
        if (newCuts.length === 0) {
            setStatusMessage('Você marcou "Criar itens", mas não há novos cortes para adicionar.', 'orange');
            // Continua para salvar (caso o usuário tenha desfeito cortes), mas sem criar itens
            payload.createItems = false;
        } else {
            payload.createItems = true;
            payload.cutsToCreateItemsFor = newCuts;
            // O backend saberá que precisa criar "newCuts.length" itens
        }
    }

    try {
        const response = await fetch(`${API_URL}/plates/${currentPlate.id}/cuts`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // CORRIGIDO: Envia o objeto 'payload' completo
            body: JSON.stringify(payload)
        });
        if (!response.ok) {
             const errorData = await response.json().catch(() => ({ error: 'Falha na resposta da API sem JSON.' }));
             throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        const result = await response.json();
        if (payload.createItems && payload.cutsToCreateItemsFor.length > 0) {
             originalCutCount = finishedCuts.length; 
        }
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
    const costInput = document.getElementById('plate-cost'); // <-- 1. Ler o novo input

    const name = nameInput ? nameInput.value : null;
    const width = widthInput ? parseFloat(widthInput.value) : NaN;
    const height = heightInput ? parseFloat(heightInput.value) : NaN;
    const cost = (costInput && costInput.value) ? parseFloat(costInput.value) : 0; // <-- 2. Obter o valor

    if (!name || isNaN(width) || isNaN(height) || width <= 0 || height <= 0) {
        setStatusMessage('Por favor, preencha todos os campos com valores válidos.', 'red');
        return;
    }

    try {
        const response = await fetch(`${API_URL}/plates`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, width, height, cost }) // <-- 3. Enviar o custo
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


// --- FUNÇÕES DE API (BARRAS) ---

function setBarStatusMessage(message, color = 'green') {
    const statusEl = document.getElementById('bar-status-message');
    if (statusEl) {
        statusEl.textContent = message;
        statusEl.style.color = color;
    }
}

async function fetchBars() {
    try {
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
                option.textContent = `${bar.name} (Restante: ${bar.remaining_length_mm}mm)`;
                option.dataset.remaining = bar.remaining_length_mm;
                selector.appendChild(option);
            });
        }
    } catch (error) {
        console.error("Erro ao carregar barras:", error);
        setBarStatusMessage('Erro ao carregar barras.', 'red');
    }
}

// --- NOVA FUNÇÃO ---
// Submete o formulário de cadastro de barra
async function handleNewBarSubmit(event) {
    event.preventDefault();
    const nameInput = document.getElementById('bar-name');
    const lengthInput = document.getElementById('bar-length');
    const diameterInput = document.getElementById('bar-diameter');
    const materialInput = document.getElementById('bar-material');
    const costInput = document.getElementById('bar-cost'); // <-- 1. Ler o novo input

    const name = nameInput ? nameInput.value : null;
    const length = lengthInput ? parseFloat(lengthInput.value) : NaN;
    const diameter = diameterInput && diameterInput.value ? parseFloat(diameterInput.value) : null;
    const material = materialInput ? materialInput.value : null;
    const cost = (costInput && costInput.value) ? parseFloat(costInput.value) : 0; // <-- 2. Obter o valor

    if (!name || isNaN(length) || length <= 0) {
        // Usa a mensagem de status da aba de barras
        setBarStatusMessage('Nome e Comprimento Original são obrigatórios.', 'red'); 
        return;
    }

    try {
        // Nova rota da API
        const response = await fetch(`${API_URL}/bars`, { 
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ 
                name, 
                length, 
                diameter: isNaN(diameter) ? null : diameter, 
                material,
                cost // <-- 3. Enviar o custo
            })
        });
        if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Erro ao criar barra.' }));
            throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        setBarStatusMessage('Barra cadastrada com sucesso!', 'green');

        const form = document.getElementById('new-bar-form');
        if(form) form.reset();

        const modal = document.getElementById('new-bar-modal');
        if (modal) modal.style.display = 'none';

        fetchBars(); // Atualiza a lista de barras na aba de consumo
    } catch (error) {
        console.error("Erro na requisição de criar barra:", error);
        // Mostra o erro no status da aba de barras
        setBarStatusMessage(`Erro ao criar barra: ${error.message}`, 'red');
    }
}

async function handleConsumeBar(event) {
    event.preventDefault();
    
    const selector = document.getElementById('bar-selector');
    const lengthInput = document.getElementById('bar-consume-length');
    
    const barId = selector ? selector.value : null;
    const lengthToConsume = lengthInput ? parseFloat(lengthInput.value) : NaN;
    
    if (!barId) {
        setBarStatusMessage('Por favor, selecione uma barra.', 'red');
        return;
    }
    if (isNaN(lengthToConsume) || lengthToConsume <= 0) {
        setBarStatusMessage('Por favor, insira um comprimento válido para consumir.', 'red');
        return;
    }
    
    const selectedOption = selector.options[selector.selectedIndex];
    if (!selectedOption || !selectedOption.dataset || !selectedOption.dataset.remaining) {
         setBarStatusMessage('Erro ao ler dados da barra selecionada.', 'red');
         return;
    }
    
    const remainingLength = parseFloat(selectedOption.dataset.remaining);
    if (lengthToConsume > remainingLength) {
         setBarStatusMessage(`Erro: Consumo (${lengthToConsume}mm) é maior que o restante (${remainingLength}mm).`, 'red');
         return;
    }

    const createItemCheckbox = document.getElementById('bar-create-item-check');
    const shouldCreateItem = createItemCheckbox ? createItemCheckbox.checked : false;

    try {
        const response = await fetch(`${API_URL}/bars/consume`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            // 2. ADICIONE O "createItem" AO BODY
            body: JSON.stringify({ 
                barId: barId, 
                consumedLength: lengthToConsume,
                createItem: shouldCreateItem
            })
        });
        
        if (!response.ok) {
             const errorData = await response.json().catch(() => ({ error: 'Falha na resposta da API sem JSON.' }));
             throw new Error(errorData.error || `HTTP error! status: ${response.status}`);
        }
        
        const result = await response.json();
        setBarStatusMessage(result.message || 'Consumo registrado com sucesso!', 'green');
        
        const barForm = document.getElementById('bar-consume-form');
        if(barForm) barForm.reset();

        if(createItemCheckbox) createItemCheckbox.checked = false;
        
        await fetchBars(); // Espera as barras recarregarem
        
        if(selector) selector.value = barId; // Mantém a barra selecionada
        
        loadBarHistory(barId); // Recarrega o histórico

    } catch (error) {
         console.error("Erro ao consumir barra:", error);
         setBarStatusMessage(`Erro: ${error.message}`, 'red');
    }
}

function calculateContactScore(rect, allCuts, plate) {
    let score = 0;
    const tolerance = 0.1; // Tolerância para comparação de floats

    // 1. Contato com as bordas da chapa
    // (Math.abs(num) < tolerance) é uma forma segura de checar (num === 0)
    if (Math.abs(rect.x) < tolerance) score += rect.h; // Borda Esquerda
    if (Math.abs(rect.y) < tolerance) score += rect.w; // Borda Superior
    if (Math.abs(rect.x + rect.w - plate.original_width_mm) < tolerance) score += rect.h; // Borda Direita
    if (Math.abs(rect.y + rect.h - plate.original_height_mm) < tolerance) score += rect.w; // Borda Inferior

    // 2. Contato com outros cortes
    for (const cut of allCuts) {
        if (!cut || cut.length !== 4 || !cut[0] || !cut[1] || !cut[3]) continue;
        
        const existing = {
            x: cut[0].x, y: cut[0].y,
            w: cut[1].x - cut[0].x, h: cut[3].y - cut[0].y
        };

        // O novo [rect] está tocando à DIREITA do [existing]?
        if (Math.abs(rect.x - (existing.x + existing.w)) < tolerance) {
            // Calcula o quanto da borda vertical eles compartilham
            const overlap = Math.max(0, Math.min(rect.y + rect.h, existing.y + existing.h) - Math.max(rect.y, existing.y));
            score += overlap;
        }
        // O novo [rect] está tocando à ESQUERDA do [existing]?
        if (Math.abs((rect.x + rect.w) - existing.x) < tolerance) {
            const overlap = Math.max(0, Math.min(rect.y + rect.h, existing.y + existing.h) - Math.max(rect.y, existing.y));
            score += overlap;
        }
        // O novo [rect] está tocando ABAIXO do [existing]?
        if (Math.abs(rect.y - (existing.y + existing.h)) < tolerance) {
            // Calcula o quanto da borda horizontal eles compartilham
            const overlap = Math.max(0, Math.min(rect.x + rect.w, existing.x + existing.w) - Math.max(rect.x, existing.x));
            score += overlap;
        }
        // O novo [rect] está tocando ACIMA do [existing]?
        if (Math.abs((rect.y + rect.h) - existing.y) < tolerance) {
            const overlap = Math.max(0, Math.min(rect.x + rect.w, existing.x + existing.w) - Math.max(rect.x, existing.x));
            score += overlap;
        }
    }
    return score;
}

async function loadBarHistory(barId) {
    const tableBody = document.getElementById('bar-history-tablebody');
    if (!tableBody) return;

    if (!barId) {
        tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Selecione uma barra para ver o histórico.</td></tr>';
        return;
    }
    
    try {
        tableBody.innerHTML = '<tr><td colspan="3" style="text-align: center;">Carregando...</td></tr>';
        const response = await fetch(`${API_URL}/bars/${barId}/history`); 
        if (!response.ok) throw new Error('Falha ao carregar histórico.');
        
        const result = await response.json();
        
        if (result.data && result.data.length > 0) {
            tableBody.innerHTML = ''; 
            result.data.forEach(entry => {
                tableBody.innerHTML += `
                    <tr>
                        <td>${new Date(entry.date).toLocaleString('pt-BR')}</td>
                        <td>${entry.consumed_length_mm} mm</td>
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
    window.addEventListener('resize', redrawCanvas);

    // Atribuição robusta
    canvas = document.getElementById('canvas');
    ctx = canvas ? canvas.getContext('2d') : null;
    currentWidthInput = document.getElementById('current-cut-width');
    currentHeightInput = document.getElementById('current-cut-height');

    // --- LÓGICA DE NAVEGAÇÃO DE ABAS ---
    const btnViewChapas = document.getElementById('btn-view-chapas');
    const btnViewBarras = document.getElementById('btn-view-barras');
    const chapasView = document.getElementById('chapas-view');
    const barrasView = document.getElementById('barras-view');
    const btnAddChapa = document.getElementById('open-plate-modal-btn'); // ID Alterado
    const btnAddBarra = document.getElementById('open-bar-modal-btn');
    const plateHistoryContainer = document.getElementById('plate-history-container');

    if (btnViewChapas && btnViewBarras && chapasView && barrasView) {
        btnViewChapas.addEventListener('click', () => {
            chapasView.style.display = 'block';
            barrasView.style.display = 'none';
            btnViewChapas.classList.add('active');
            btnViewBarras.classList.remove('active');
            
            if(btnAddChapa) btnAddChapa.style.display = 'inline-flex';
            if(btnAddBarra) btnAddBarra.style.display = 'none';
            const plateSelector = document.getElementById('plate-selector');
            if (plateHistoryContainer && plateSelector && plateSelector.value) {
                plateHistoryContainer.style.display = 'block';}
        });

        btnViewBarras.addEventListener('click', () => {
            chapasView.style.display = 'none';
            barrasView.style.display = 'block';
            btnViewChapas.classList.remove('active');
            btnViewBarras.classList.add('active');
            
            if(btnAddChapa) btnAddChapa.style.display = 'none';
            if(btnAddBarra) btnAddBarra.style.display = 'inline-flex';
            if (plateHistoryContainer) {
                plateHistoryContainer.style.display = 'none';
            }

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

        // NOVO: Define o cursor padrão 'crosshair' ao entrar no canvas
        canvas.addEventListener('mouseenter', () => {
            if (canvas) canvas.style.cursor = 'crosshair';
        });

        // ATUALIZADO: Reseta o cursor ao sair e cancela o desenho
        canvas.addEventListener('mouseleave', () => {
            // Reseta o cursor para o padrão do navegador
            if (canvas) canvas.style.cursor = 'default'; 

            if (isDrawing) {
                isDrawing = false;
                previewRect = null;
                snappedEdge = null;
                startPoint = null;
                redrawCanvas(); 
                if(currentWidthInput) currentWidthInput.value = '0.0';
                if(currentHeightInput) currentHeightInput.value = '0.0';
                if(setStatusMessage) setStatusMessage('Desenho cancelado (mouse fora da área).', 'orange');
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
                originalCutCount = 0;
                redrawCanvas();
                if(currentWidthInput) currentWidthInput.value = '0.0';
                if(currentHeightInput) currentHeightInput.value = '0.0';
                loadPlateHistory(null);
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
                loadPlateHistory(currentPlate.id);
            } else {
                 console.error("Opção selecionada não contém dimensões:", selectedOption);
                 currentPlate = null;
                 finishedCuts = [];
                 redrawCanvas();
                 if(setStatusMessage) setStatusMessage("Erro ao ler dimensões da chapa selecionada.", "red");
                 loadPlateHistory(null);
            }
        });
    } else {
         console.warn("Seletor #plate-selector não encontrado.");
    }
    
    redrawCanvas(); // Desenha o canvas vazio inicial

    // Modal de Cadastro de Chapas
    const plateModal = document.getElementById('new-plate-modal');
    const openPlateBtn = document.getElementById('open-plate-modal-btn'); // ID Alterado
    const closePlateBtn = document.getElementById('close-plate-modal-btn'); // ID Alterado
    if (plateModal && openPlateBtn && closePlateBtn) {
        openPlateBtn.onclick = () => { plateModal.style.display = 'flex'; };
        closePlateBtn.onclick = () => { plateModal.style.display = 'none'; };
        window.addEventListener('click', (event) => {
            if (event.target == plateModal) {
                plateModal.style.display = 'none';
            }
        });
    } else {
        console.warn("Elementos do modal de cadastro de CHAPAS não encontrados.");
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
                if (newRectangle.every(p => p && typeof p.x === 'number' && typeof p.y === 'number')) {
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

    // NOVO: Modal de Cadastro de Barras
    const barModal = document.getElementById('new-bar-modal');
    const openBarBtn = document.getElementById('open-bar-modal-btn');
    const closeBarBtn = document.getElementById('close-bar-modal-btn');
    if (barModal && openBarBtn && closeBarBtn) {
        openBarBtn.onclick = () => { barModal.style.display = 'flex'; };
        closeBarBtn.onclick = () => { barModal.style.display = 'none'; };
        window.addEventListener('click', (event) => {
            if (event.target == barModal) {
                barModal.style.display = 'none';
            }
        });
    } else {
        console.warn("Elementos do modal de cadastro de BARRAS não encontrados.");
    }

    // NOVO: Formulário de cadastro de Barra
    const newBarForm = document.getElementById('new-bar-form');
    if(newBarForm) {
        newBarForm.addEventListener('submit', handleNewBarSubmit);
    } else {
         console.warn("Formulário #new-bar-form não encontrado.");
    }

    // Formulário de consumo de Barra
    const barConsumeForm = document.getElementById('bar-consume-form');
    if (barConsumeForm) {
        barConsumeForm.addEventListener('submit', handleConsumeBar);
    } else {
        console.warn("Formulário #bar-consume-form não encontrado.");
    }

    // Seletor de Barras
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