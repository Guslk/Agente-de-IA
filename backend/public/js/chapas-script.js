// --- CONFIGURAÇÕES E ESTADO GLOBAL ---
const API_URL = '/chapas/api';
const canvas = document.getElementById('canvas');
const ctx = canvas.getContext('2d');

// Referências para os campos de dimensão
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
         // Adiciona verificação se 'cut' e seus pontos são válidos
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

            // Validação de limites
            if (candidateRect.x + candidateRect.w > currentPlate.original_width_mm + 0.1 ||
                candidateRect.y + candidateRect.h > currentPlate.original_height_mm + 0.1) {
                continue;
            }

            // Validação de colisão
            let hasCollision = false;
            for (const cut of finishedCuts) {
                 // Adiciona verificação se 'cut' e seus pontos são válidos
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

            // Seleção da melhor posição (Bottom-Left)
            if (!bestFit || candidateRect.y < bestFit.y || (candidateRect.y === bestFit.y && candidateRect.x < bestFit.x)) {
                bestFit = candidateRect;
            }
        }
    }
    return bestFit;
}


// --- FUNÇÕES DE DETECÇÃO DE COLISÃO ---
function normalizeRect(rect) {
     if (!rect) return { x: 0, y: 0, w: 0, h: 0 }; // Retorna um rect padrão se for nulo
    return {
        x: rect.w > 0 ? rect.x : rect.x + rect.w,
        y: rect.h > 0 ? rect.y : rect.y + rect.h,
        w: Math.abs(rect.w),
        h: Math.abs(rect.h)
    };
}

function rectsOverlap(rectA, rectB) {
    if (!rectA || !rectB) return false; // Evita erro se algum rect for nulo
    // Adiciona uma pequena tolerância para evitar falsos positivos com linhas adjacentes
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


// --- FUNÇÕES DE DESENHO ---
function redrawCanvas() {
    if (!canvas || !ctx) return; // Garante que o canvas existe

    if (!currentPlate) {
        // Define um tamanho padrão e limpa se nenhuma chapa estiver selecionada
        const defaultWidth = canvas.clientWidth || 800; // Usa largura CSS como fallback
        const defaultHeight = defaultWidth * 0.75; // Proporção comum
        canvas.width = defaultWidth;
        canvas.height = defaultHeight;
        ctx.fillStyle = '#f4f7fa'; // Cor de fundo do tema
        ctx.fillRect(0, 0, canvas.width, canvas.height);
        return;
    }

    // Configura o canvas para o modo 1:1 (mm)
    canvas.width = currentPlate.original_width_mm;
    canvas.height = currentPlate.original_height_mm;

    // Calcula escala visual ANTES de desenhar
    const rect = canvas.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return; // Evita divisão por zero

    const scaleX = canvas.width / rect.width;   // mm por pixel horizontal
    const scaleY = canvas.height / rect.height; // mm por pixel vertical
    // Usa Math.min para garantir que a menor escala seja usada para linha fina
    const visualScaleForBorder = Math.min(scaleX, scaleY);
    // Usa Math.max para a escala geral, importante para outros cálculos
    const visualScale = Math.max(scaleX, scaleY);

    // Desenha o fundo branco
    ctx.fillStyle = '#FFFFFF';
    ctx.fillRect(0, 0, canvas.width, canvas.height);

    // --- DESENHO DA BORDA EXTERNA (CORRIGIDO) ---
    ctx.strokeStyle = '#AAAAAA'; // Cinza claro para a borda
    // Define a espessura para parecer 1 pixel na tela, usando a menor escala
    ctx.lineWidth = 1 * visualScaleForBorder;
    ctx.strokeRect(0, 0, canvas.width, canvas.height);

    // --- DESENHO DOS CORTES FINALIZADOS ---
    const standardLineWidth = 2 * visualScale; // Espessura de 2px visuais para os cortes

    ctx.strokeStyle = 'blue';
    ctx.fillStyle = 'rgba(0, 0, 255, 0.3)';
    ctx.lineWidth = standardLineWidth; // Usa a espessura padrão para os cortes
    finishedCuts.forEach(cut => {
        // Verifica se 'cut' e seus pontos são válidos
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

    // O desenho do 'previewRect' foi movido para handleMouseMove
}


// --- LÓGICA DE DESENHO MANUAL COM RESTRIÇÃO DE BORDAS ---
function getAllAvailableEdges() {
    const edges = [];
    if (!currentPlate) return edges;
    const w = currentPlate.original_width_mm;
    const h = currentPlate.original_height_mm;
    edges.push({ p1: {x:0, y:0}, p2: {x:w, y:0}, type: 'horizontal' }); // Topo
    edges.push({ p1: {x:0, y:h}, p2: {x:w, y:h}, type: 'horizontal' }); // Fundo
    edges.push({ p1: {x:0, y:0}, p2: {x:0, y:h}, type: 'vertical' });   // Esquerda
    edges.push({ p1: {x:w, y:0}, p2: {x:w, y:h}, type: 'vertical' });   // Direita
    finishedCuts.forEach(cut => {
        // Adiciona verificação para garantir que os 4 pontos existem
        if (cut && cut.length === 4 && cut[0] && cut[1] && cut[2] && cut[3]) {
            const [p0, p1, p2, p3] = cut;
            edges.push({ p1: p0, p2: p1, type: 'horizontal' }); // Topo do corte
            edges.push({ p1: p3, p2: p2, type: 'horizontal' }); // Fundo do corte
            edges.push({ p1: p0, p2: p3, type: 'vertical' });   // Esquerda do corte
            edges.push({ p1: p1, p2: p2, type: 'vertical' });   // Direita do corte
        } else {
             console.warn("getAllAvailableEdges encontrou um corte inválido:", cut);
        }
    });
    return edges;
}

function findClosestEdge(point) {
    if (!canvas) return null; // Garante que o canvas existe
    const rect = canvas.getBoundingClientRect();
    // Verifica se rect existe e tem dimensões válidas
    if (!rect || rect.width === 0 || rect.height === 0 || canvas.width === 0 || canvas.height === 0) return null;

    // --- CORREÇÃO DO SNAP ---
    // Calcula escalas X e Y separadamente
    const scaleX = canvas.width / rect.width; // mm por px horizontal
    const scaleY = canvas.height / rect.height; // mm por px vertical

    // Calcula distâncias de snap lógicas (em mm) para cada eixo (equivalente a 10px visuais)
    const SNAP_X_LOGICAL = 10 * scaleX;
    const SNAP_Y_LOGICAL = 10 * scaleY;

    let closestEdge = null;
    let minDistanceRatio = 1.0; // Usaremos uma razão para comparar distâncias em eixos diferentes

    const edges = getAllAvailableEdges();

    for (const edge of edges) {
         // Garante que os pontos da borda existem
        if (!edge || !edge.p1 || !edge.p2) continue;

        let distance;
        let snapThreshold;
        let distanceRatio;

        if (edge.type === 'horizontal') {
            // Verifica se o ponto X está dentro dos limites da borda (com tolerância)
            const minX = Math.min(edge.p1.x, edge.p2.x) - SNAP_X_LOGICAL;
            const maxX = Math.max(edge.p1.x, edge.p2.x) + SNAP_X_LOGICAL;
            if (point.x >= minX && point.x <= maxX) {
                distance = Math.abs(point.y - edge.p1.y); // Distância vertical em mm
                snapThreshold = SNAP_Y_LOGICAL;           // Limite vertical em mm
                // Verifica se snapThreshold é válido antes da divisão
                 if (snapThreshold > 0) {
                     distanceRatio = distance / snapThreshold; // Razão da distância vs limite
                    if (distance < snapThreshold && distanceRatio < minDistanceRatio) {
                        minDistanceRatio = distanceRatio;
                        closestEdge = edge;
                    }
                }
            }
        } else { // Vertical
            // Verifica se o ponto Y está dentro dos limites da borda (com tolerância)
            const minY = Math.min(edge.p1.y, edge.p2.y) - SNAP_Y_LOGICAL;
            const maxY = Math.max(edge.p1.y, edge.p2.y) + SNAP_Y_LOGICAL;
             if (point.y >= minY && point.y <= maxY) {
                distance = Math.abs(point.x - edge.p1.x); // Distância horizontal em mm
                snapThreshold = SNAP_X_LOGICAL;           // Limite horizontal em mm
                // Verifica se snapThreshold é válido antes da divisão
                if (snapThreshold > 0) {
                    distanceRatio = distance / snapThreshold; // Razão da distância vs limite
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
    if (!canvas) return { x: 0, y: 0 }; // Garante que o canvas existe
    const rect = canvas.getBoundingClientRect();
     if (!rect || rect.width === 0 || rect.height === 0) return { x: 0, y: 0 }; // Evita divisão por zero
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
    snappedEdge = findClosestEdge(mousePos); // Agora usa a lógica corrigida
    if (snappedEdge) {
        isDrawing = true;
        // Projeta o ponto inicial na borda
        if (snappedEdge.p1 && snappedEdge.p2) { // Garante que os pontos da borda existem
            if (snappedEdge.type === 'horizontal') {
                startPoint = { x: mousePos.x, y: snappedEdge.p1.y };
            } else { // Vertical
                startPoint = { x: snappedEdge.p1.x, y: mousePos.y };
            }
            // Limpa os campos de dimensão apenas se o desenho for iniciado
            if(currentWidthInput) currentWidthInput.value = '0.0';
            if(currentHeightInput) currentHeightInput.value = '0.0';
        } else {
             console.error("Borda inválida encontrada no snap:", snappedEdge);
             isDrawing = false; // Não inicia o desenho se a borda for inválida
        }
    } else {
        setStatusMessage('Clique perto de uma borda para iniciar um novo corte.', 'orange');
    }
}


function handleMouseMove(event) {
    if (!isDrawing || !startPoint || !snappedEdge) return; // Garante que estamos no estado correto

    redrawCanvas(); // Desenha a base (chapa + cortes salvos + borda correta)

    const currentMousePos = getCanvasCoordinates(event);
    const x1 = startPoint.x, y1 = startPoint.y, x2 = currentMousePos.x, y2 = currentMousePos.y;
    let rectX, rectY, rectW, rectH;

    // Calcula retângulo ancorado na borda
    // Garante que snappedEdge.p1 existe
    if (snappedEdge.p1) {
        if (snappedEdge.type === 'horizontal') {
            rectX = x1; rectY = snappedEdge.p1.y; rectW = x2 - x1; rectH = y2 - rectY;
        } else { // Vertical
            rectX = snappedEdge.p1.x; rectY = y1; rectW = x2 - rectX; rectH = y2 - y1;
        }
        previewRect = { x: rectX, y: rectY, w: rectW, h: rectH };
    } else {
        console.error("snappedEdge sem p1 em handleMouseMove:", snappedEdge);
        previewRect = null; // Reseta se a borda for inválida
        return;
    }


    // Verifica colisão
    isPreviewOverlapping = false;
    const normalizedPreview = normalizeRect(previewRect);
    if (normalizedPreview.w < 1 || normalizedPreview.h < 1) {
        isPreviewOverlapping = true;
    } else {
        for (const cut of finishedCuts) {
             // Adiciona verificação se 'cut' é válido
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

    // Desenha a pré-visualização (retângulo)
    const rect = canvas.getBoundingClientRect();
    if (!rect || rect.width === 0 || rect.height === 0) return;

    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const visualScale = Math.max(scaleX, scaleY);

    ctx.lineWidth = 2 * visualScale; // 2px visuais em mm
    ctx.strokeStyle = isPreviewOverlapping ? '#FF8C00' : 'red';
    // Desenha apenas se previewRect for válido
    if(previewRect) {
        ctx.strokeRect(previewRect.x, previewRect.y, previewRect.w, previewRect.h);
    }


    // Atualiza os campos de texto com as dimensões (apenas se previewRect for válido)
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
    isDrawing = false; // Marca como não desenhando mais

    // Verifica se previewRect existe antes de usá-lo
    if (isPreviewOverlapping) {
        setStatusMessage('Corte inválido: sobrepõe um corte existente ou tem tamanho nulo.', 'red');
    } else if (!previewRect || Math.abs(previewRect.w) < 5 || Math.abs(previewRect.h) < 5) {
        // Corte muito pequeno, ignora silenciosamente ou mostra mensagem
        // setStatusMessage('Corte muito pequeno para ser registrado.', 'orange');
    } else {
        const finalRect = normalizeRect(previewRect);
        // Verifica se as coordenadas são números válidos
        if (!isNaN(finalRect.x) && !isNaN(finalRect.y) && !isNaN(finalRect.w) && !isNaN(finalRect.h)) {
            const newRectangle = [
                { x: finalRect.x, y: finalRect.y },
                { x: finalRect.x + finalRect.w, y: finalRect.y },
                { x: finalRect.x + finalRect.w, y: finalRect.y + finalRect.h },
                { x: finalRect.x, y: finalRect.y + finalRect.h }
            ];
             // Validação final dos pontos antes de adicionar
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


    // Limpa estado e redesenha, independentemente do sucesso
    previewRect = null;
    snappedEdge = null;
    startPoint = null; // Garante que startPoint seja limpo
    redrawCanvas();

    // Limpa os campos de dimensão
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
        if (!selector) {
            console.error("Elemento #plate-selector não encontrado.");
            return;
        }
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
    // Adiciona verificação se plateId é válido
    if (!plateId) {
        console.warn("loadCutsForPlate chamado sem plateId válido.");
        finishedCuts = [];
        redrawCanvas();
        return;
    }
    try {
        const response = await fetch(`${API_URL}/plates/${plateId}/cuts`);
         if (!response.ok) throw new Error(`HTTP error! status: ${response.status}`);
        const result = await response.json();

        // Verifica se result.data existe e é um array
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
            }).filter(cut => cut !== null); // Filtra os nulos
        } else {
            console.warn("API retornou dados de cortes inválidos:", result);
            finishedCuts = []; // Define como vazio se a API retornar algo inesperado
        }

        redrawCanvas();
    } catch (error) {
        console.error("Erro ao carregar ou processar os cortes:", error);
        setStatusMessage('Erro ao carregar os cortes da chapa.', 'red');
        finishedCuts = []; // Garante que fique vazio em caso de erro
        redrawCanvas();    // Redesenha o canvas vazio
    }
}


async function handleSaveCuts() {
    if (!currentPlate || !currentPlate.id) { // Verifica também o ID
        setStatusMessage('Nenhuma chapa selecionada.', 'red');
        return;
    }
    if (isDrawing) {
        setStatusMessage('Finalize o desenho atual antes de salvar.', 'orange');
        return;
    }

    // Adiciona validação para finishedCuts
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
        setStatusMessage(result.message || 'Cortes salvos com sucesso!', 'green'); // Mensagem padrão
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

    // Garante que os inputs existem antes de pegar o valor
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

        fetchPlates(); // Recarrega a lista
    } catch (error) {
        console.error("Erro na requisição:", error);
        setStatusMessage(`Erro ao criar chapa: ${error.message}`, 'red');
    }
}


// --- EVENT LISTENERS ---
document.addEventListener('DOMContentLoaded', () => {

    console.log("DOM carregado, iniciando script de chapas.");

    // Verifica se os elementos essenciais existem
    if (!canvas || !currentWidthInput || !currentHeightInput) {
        console.error("Elementos essenciais do canvas ou campos de dimensão não encontrados. Funcionalidade de desenho pode ser afetada.");
        // Não retorna aqui, pois outras partes (modal, fetch) podem funcionar
    }

    fetchPlates();
    redrawCanvas(); // Desenha estado inicial

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
        console.warn("Elementos do modal de cadastro não encontrados.");
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
            if (bestPosition && !isNaN(bestPosition.x) && !isNaN(bestPosition.y) && !isNaN(bestPosition.w) && !isNaN(bestPosition.h)) {
                 const newRectangle = [
                    { x: bestPosition.x, y: bestPosition.y },
                    { x: bestPosition.x + bestPosition.w, y: bestPosition.y },
                    { x: bestPosition.x + bestPosition.w, y: bestPosition.y + bestPosition.h },
                    { x: bestPosition.x, y: bestPosition.y + bestPosition.h }
                ];
                 // Validação final dos pontos
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

    // Listeners de desenho manual (só anexa se o canvas existir)
    if (canvas) {
        canvas.addEventListener('mousedown', handleMouseDown);
        canvas.addEventListener('mousemove', handleMouseMove);
         // Mouseleave para cancelar desenho se sair do canvas
        canvas.addEventListener('mouseleave', () => {
             if (isDrawing) {
                 console.log("Mouse saiu do canvas durante o desenho, cancelando.");
                 isDrawing = false;
                 previewRect = null;
                 snappedEdge = null;
                 startPoint = null;
                 redrawCanvas(); // Limpa a pré-visualização
                 if(currentWidthInput) currentWidthInput.value = '0.0';
                 if(currentHeightInput) currentHeightInput.value = '0.0';
                 setStatusMessage('Desenho cancelado (mouse fora da área).', 'orange');
            }
        });
    } else {
         console.error("Elemento canvas não encontrado. Desenho manual desativado.");
    }
    // MouseUp no window para garantir que o desenho termine mesmo fora do canvas
    window.addEventListener('mouseup', handleMouseUp);


    // Listeners de controles
    const plateSelector = document.getElementById('plate-selector');
    if (plateSelector) {
        plateSelector.addEventListener('change', (event) => {
            const selectedOption = event.target.options[event.target.selectedIndex];
            const plateDimensionsEl = document.getElementById('plate-dimensions');

            if (!selectedOption || !selectedOption.value) { // Verifica a opção selecionada
                currentPlate = null;
                 if(plateDimensionsEl) plateDimensionsEl.textContent = '';
                finishedCuts = [];
                redrawCanvas();
                if(currentWidthInput) currentWidthInput.value = '0.0';
                if(currentHeightInput) currentHeightInput.value = '0.0';
                return;
            }
            // Verifica se dataset existe antes de ler
            if (selectedOption.dataset && selectedOption.dataset.width && selectedOption.dataset.height) {
                currentPlate = {
                    id: selectedOption.value,
                    original_width_mm: parseFloat(selectedOption.dataset.width),
                    original_height_mm: parseFloat(selectedOption.dataset.height)
                };
                if(plateDimensionsEl) {
                   plateDimensionsEl.textContent = `Dimensões: ${currentPlate.original_width_mm}mm x ${currentPlate.original_height_mm}mm`;
                }
                loadCutsForPlate(currentPlate.id); // Carrega os cortes
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

