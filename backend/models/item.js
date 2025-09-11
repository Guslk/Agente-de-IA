// models/Item.js

// 1. Simulação do nosso banco de dados com dados de exemplo
const items = [
    { id_item: 1, nome: 'SSD NVMe 256GB', codigo_barras: '7890123456789', unidade_medida: 'unidade', quantidade_minima: 20, quantidade_atual: 52 },
    { id_item: 2, nome: 'Memória RAM DDR4 8GB', codigo_barras: '7890123456790', unidade_medida: 'unidade', quantidade_minima: 15, quantidade_atual: 14 },
    { id_item: 3, nome: 'Mouse Gamer Logitech G203', codigo_barras: '7890123456791', unidade_medida: 'unidade', quantidade_minima: 10, quantidade_atual: 35 },
    { id_item: 4, nome: 'Teclado Dell KB216', codigo_barras: '7890123456792', unidade_medida: 'unidade', quantidade_minima: 5, quantidade_atual: 0 },
];

// 2. Criação de um "Model" que sabe como buscar os dados
const Item = {
    // Função para buscar todos os itens (simula um SELECT * FROM items)
    findAll: () => {
        return items;
    },

    // No futuro, você teria outras funções aqui:
    // findById: (id) => { ... },
    // create: (novoItem) => { ... },
};

// 3. Exporta o Model para que outras partes da aplicação possam usá-lo
module.exports = Item;