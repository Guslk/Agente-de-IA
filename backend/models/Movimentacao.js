
const movimentacoes = [
    { tipo: 'Entrada', data: '02/09/2025', item: 'SSD NVMe 256GB', qtd: 50, funcionario: 'João da Silva', detalhe: 'NF-e 123456' },
    { tipo: 'Saída', data: '01/09/2025', item: 'Mouse Gamer Logitech G203', qtd: 5, funcionario: 'Maria Oliveira', detalhe: 'Setor de TI' },
    { tipo: 'Entrada', data: '31/08/2025', item: 'Memória RAM DDR4 8GB', qtd: 20, funcionario: 'João da Silva', detalhe: 'NF-e 123123' },
    { tipo: 'Saída', data: '30/08/2025', item: 'Teclado Dell KB216', qtd: 10, funcionario: 'Maria Oliveira', detalhe: 'Setor Administrativo' }
];

const Movimentacao = {
    findAll: () => {
        return movimentacoes;
    }
};

module.exports = Movimentacao;