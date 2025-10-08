// models/Ferramenta.js

const Historico = require('./Historico');

let proximoId = 6; // Garante que o próximo ID seja único

const ferramentas = [
    { id: 1, codigo: 'BOS-FUR-01', nome: 'Furadeira de Impacto Bosch', status: 'disponivel', retiradoPor: null, dataRetirada: null },
    { id: 2, codigo: 'MKT-SER-05', nome: 'Serra Circular Makita', status: 'retirada', retiradoPor: 'Maria Oliveira', dataRetirada: '2025-09-26T10:15:00' },
    { id: 3, codigo: 'DEW-LIX-03', nome: 'Lixadeira Orbital DeWalt', status: 'disponivel', retiradoPor: null, dataRetirada: null },
    { id: 4, codigo: 'MIN-MUL-11', nome: 'Multímetro Digital Minipa', status: 'disponivel', retiradoPor: null, dataRetirada: null },
    { id: 5, codigo: 'GEN-ALI-02', nome: 'Alicate de Crimpagem', status: 'retirada', retiradoPor: 'Pedro Martins', dataRetirada: '2025-09-25T16:30:00' },
];

const Ferramenta = {
    findDisponiveis: () => ferramentas.filter(f => f.status === 'disponivel'),
    findRetiradas: () => ferramentas.filter(f => f.status === 'retirada'),
    findById: (id) => ferramentas.find(f => f.id === parseInt(id)),

    // NOVA FUNÇÃO para cadastrar uma nova ferramenta
    create: (dadosFerramenta) => {
        const novaFerramenta = {
            id: proximoId++,
            codigo: dadosFerramenta.codigo,
            nome: dadosFerramenta.nome,
            status: 'disponivel', // Sempre começa como disponível
            retiradoPor: null,
            dataRetirada: null
        };
        ferramentas.push(novaFerramenta);
        console.log("Nova ferramenta cadastrada:", novaFerramenta);
        return novaFerramenta;
    },

    retirar: (id, nomePessoa) => {
        const ferramenta = Ferramenta.findById(id);
        if (ferramenta) {
            ferramenta.status = 'retirada';
            ferramenta.retiradoPor = nomePessoa;
            ferramenta.dataRetirada = new Date().toISOString();
            Historico.registrarRetirada(ferramenta, nomePessoa); 
            return ferramenta;
        }
        return null;
    },

    devolver: (id) => {
        const ferramenta = Ferramenta.findById(id);
        if (ferramenta) {
            Historico.registrarDevolucao(ferramenta); 
            ferramenta.status = 'disponivel';
            ferramenta.retiradoPor = null;
            ferramenta.dataRetirada = null;
            return ferramenta;
        }
        return null;
    }
};

module.exports = Ferramenta;