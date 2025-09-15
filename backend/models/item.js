// models/Item.js

const items = [
    { id_item: 1, nome: 'SSD NVMe 256GB', codigo_barras: '7890123456789', unidade_medida: 'unidade', quantidade_minima: 20, quantidade_atual: 52 },
    { id_item: 2, nome: 'Memória RAM DDR4 8GB', codigo_barras: '7890123456790', unidade_medida: 'unidade', quantidade_minima: 15, quantidade_atual: 14 },
    { id_item: 3, nome: 'Mouse Gamer Logitech G203', codigo_barras: '7890123456791', unidade_medida: 'unidade', quantidade_minima: 10, quantidade_atual: 35 },
    { id_item: 4, nome: 'Teclado Dell KB216', codigo_barras: '7890123456792', unidade_medida: 'unidade', quantidade_minima: 5, quantidade_atual: 0 },
];

const Item = {
    findAll: () => {
        return items;
    }
};

module.exports = Item;