// models/MateriaPrima.js

const Movimentacao = require('./Movimentacao'); // Para registrar o consumo

let materiasPrimas = [
    { id: 1, tipo: 'barra', material: 'Aço 1020', descricao: 'Barra Redonda 1"', comprimento: 6.0, largura: 0, loc_fisica: 'Corredor A-1' },
    { id: 2, tipo: 'barra', material: 'Alumínio', descricao: 'Barra Quadrada 20mm', comprimento: 3.5, largura: 0, loc_fisica: 'Corredor A-2' },
    { id: 3, tipo: 'chapa', material: 'Aço Inox 304', descricao: 'Chapa Escovada 2mm', comprimento: 3.0, largura: 1.2, loc_fisica: 'Corredor B-1' },
];

let proximoId = 4;

const MateriaPrima = {
    findAll: () => {
        return [...materiasPrimas];
    },

    findById: (id) => {
        return materiasPrimas.find(mp => mp.id === parseInt(id));
    },

    create: (dados) => {
        const novoMaterial = {
            id: proximoId++,
            tipo: dados.tipo,
            material: dados.material,
            descricao: dados.descricao,
            comprimento: parseFloat(dados.comprimento) || 0,
            largura: dados.tipo === 'chapa' ? parseFloat(dados.largura) || 0 : 0,
            loc_fisica: dados.loc_fisica
        };
        materiasPrimas.push(novoMaterial);
        
        // Registra a entrada no log de movimentações
        const nomeEntrada = novoMaterial.tipo === 'chapa' 
            ? `${novoMaterial.descricao} (${novoMaterial.comprimento}m x ${novoMaterial.largura}m)`
            : `${novoMaterial.descricao} (${novoMaterial.comprimento}m)`;
            
        Movimentacao.registrarEntrada(
            { nome: nomeEntrada }, 
            { quantidade: 1, responsavel: 'Sistema', nota_fiscal_codigo: 'Cadastro Inicial' }
        );
        return novoMaterial;
    },

    // =========================================================
    // == FUNÇÃO 'CONSUMIR' ATUALIZADA COM A LÓGICA DE CORTES ==
    // =========================================================
    consumir: (id, dadosConsumo) => {
        const index = materiasPrimas.findIndex(mp => mp.id === parseInt(id));
        if (index === -1) return null;

        const original = materiasPrimas[index];
        const compConsumido = parseFloat(dadosConsumo.comprimento);
        
        // Para barras, a largura consumida é irrelevante (0). Para chapas, pegamos do formulário.
        const largConsumida = original.tipo === 'chapa' ? parseFloat(dadosConsumo.largura) : original.largura;

        // Validações
        if (compConsumido > original.comprimento || largConsumida > original.largura) {
            console.error("Consumo maior que o material disponível.");
            return { error: "Consumo maior que o material disponível." };
        }

        // Registra a saída da PEÇA CONSUMIDA no log
        const pecaConsumidaDesc = original.tipo === 'chapa' 
            ? `${original.descricao} (Peça de ${compConsumido}m x ${largConsumida}m)`
            : `${original.descricao} (Peça de ${compConsumido}m)`;

        Movimentacao.registrarSaida({ nome: pecaConsumidaDesc }, 1, dadosConsumo.responsavel);
        
        // Remove a peça original do estoque para substituí-la pelos retalhos
        materiasPrimas.splice(index, 1);

        // Calcula os novos retalhos retangulares e os (re)cadastra no estoque
        const compRestante = parseFloat((original.comprimento - compConsumido).toFixed(2));
        const largRestante = parseFloat((original.largura - largConsumida).toFixed(2));

        // Se for uma BARRA, só haverá um retalho (ou nenhum)
        if (original.tipo === 'barra' && compRestante > 0) {
            MateriaPrima.create({
                ...original, // Reutiliza os dados originais
                id: undefined, // Deixa o 'create' gerar um novo ID
                comprimento: compRestante,
                descricao: `Retalho de ${original.descricao}`
            });
        }
        
        // Se for uma CHAPA, pode haver até dois retalhos
        if (original.tipo === 'chapa') {
            // Retalho 1 (a parte maior)
            if (compRestante > 0) {
                MateriaPrima.create({
                    ...original, id: undefined,
                    comprimento: compRestante,
                    largura: original.largura, // Mantém a largura original
                    descricao: `Retalho de ${original.descricao}`
                });
            }
            // Retalho 2 (a tira menor)
            if (largRestante > 0) {
                 MateriaPrima.create({
                    ...original, id: undefined,
                    comprimento: compConsumido, // O comprimento é o da parte que foi cortada
                    largura: largRestante,
                    descricao: `Retalho de ${original.descricao}`
                });
            }
        }

        return { success: true };
    }
};

module.exports = MateriaPrima;