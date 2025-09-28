// models/Historico.js

// Simulação do nosso "livro de registros" de transações
const historico = [
    { id: 1, ferramentaNome: 'Serra Circular Makita', tipo: 'Retirada', responsavel: 'Maria Oliveira', data: '2025-09-26T10:15:00' },
    { id: 2, ferramentaNome: 'Alicate de Crimpagem', tipo: 'Retirada', responsavel: 'Pedro Martins', data: '2025-09-25T16:30:00' },
];

let proximoId = 3;

const Historico = {
    findAll: () => {
        // Retorna o histórico ordenado, com o mais recente primeiro
        return historico.sort((a, b) => new Date(b.data) - new Date(a.data));
    },

    // Função para registrar uma nova retirada no histórico
    registrarRetirada: (ferramenta, nomePessoa) => {
        const novoRegistro = {
            id: proximoId++,
            ferramentaNome: ferramenta.nome,
            tipo: 'Retirada',
            responsavel: nomePessoa,
            data: new Date().toISOString()
        };
        historico.push(novoRegistro);
        console.log("Novo registro de retirada:", novoRegistro);
    },
    
    // Função para registrar uma nova devolução no histórico
    registrarDevolucao: (ferramenta) => {
        const novoRegistro = {
            id: proximoId++,
            ferramentaNome: ferramenta.nome,
            tipo: 'Devolução',
            responsavel: ferramenta.retiradoPor, // A pessoa que estava com a ferramenta
            data: new Date().toISOString()
        };
        historico.push(novoRegistro);
        console.log("Novo registro de devolução:", novoRegistro);
    }
};

module.exports = Historico;