// models/Ferramenta.js

// Simulação de um "banco de dados" de ferramentas
const ferramentas = [
    { 
        id: 1, 
        nome: 'Furadeira de Impacto Bosch', 
        status: 'disponivel', 
        retiradoPor: null, 
        dataRetirada: null 
    },
    { 
        id: 2, 
        nome: 'Serra Circular Makita', 
        status: 'retirada', 
        retiradoPor: 'Maria Oliveira', 
        dataRetirada: '2025-09-23T10:15:00' // Formato ISO para data e hora
    },
    { 
        id: 3, 
        nome: 'Lixadeira Orbital DeWalt', 
        status: 'disponivel', 
        retiradoPor: null, 
        dataRetirada: null 
    },
    { 
        id: 4, 
        nome: 'Multímetro Digital Minipa', 
        status: 'disponivel', 
        retiradoPor: null, 
        dataRetirada: null 
    },
    { 
        id: 5, 
        nome: 'Alicate de Crimpagem', 
        status: 'retirada', 
        retiradoPor: 'Pedro Martins', 
        dataRetirada: '2025-09-22T16:30:00'
    },
];

const Ferramenta = {
    // Função que retorna apenas as ferramentas disponíveis
    findDisponiveis: () => {
        return ferramentas.filter(f => f.status === 'disponivel');
    },

    // Função que retorna apenas as ferramentas em uso (retiradas)
    findRetiradas: () => {
        return ferramentas.filter(f => f.status === 'retirada');
    }
    // No futuro: funções para retirar() e devolver() que alteram o status
};

module.exports = Ferramenta;