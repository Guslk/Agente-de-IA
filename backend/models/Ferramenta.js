// models/Ferramenta.js

const Historico = require('./Historico'); // <-- IMPORTANTE: Importa o model do histórico

const ferramentas = [
    { id: 1, nome: 'Furadeira de Impacto Bosch', status: 'disponivel', retiradoPor: null, dataRetirada: null },
    { id: 2, nome: 'Serra Circular Makita', status: 'retirada', retiradoPor: 'Maria Oliveira', dataRetirada: '2025-09-26T10:15:00' },
    { id: 3, nome: 'Lixadeira Orbital DeWalt', status: 'disponivel', retiradoPor: null, dataRetirada: null },
    { id: 4, nome: 'Multímetro Digital Minipa', status: 'disponivel', retiradoPor: null, dataRetirada: null },
    { id: 5, nome: 'Alicate de Crimpagem', status: 'retirada', retiradoPor: 'Pedro Martins', dataRetirada: '2025-09-25T16:30:00' },
];

const Ferramenta = {
    findDisponiveis: () => ferramentas.filter(f => f.status === 'disponivel'),
    findRetiradas: () => ferramentas.filter(f => f.status === 'retirada'),
    findById: (id) => ferramentas.find(f => f.id === parseInt(id)),

    retirar: (id, nomePessoa) => {
        const ferramenta = Ferramenta.findById(id);
        if (ferramenta) {
            ferramenta.status = 'retirada';
            ferramenta.retiradoPor = nomePessoa;
            ferramenta.dataRetirada = new Date().toISOString();
            
            // Registra a ação no histórico
            Historico.registrarRetirada(ferramenta, nomePessoa); 

            return ferramenta;
        }
        return null;
    },

    devolver: (id) => {
        const ferramenta = Ferramenta.findById(id);
        if (ferramenta) {
            
            // Registra a ação no histórico ANTES de limpar os dados
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