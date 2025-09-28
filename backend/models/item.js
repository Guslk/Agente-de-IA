const items = [
    { id_item: 1, nome: 'SSD NVMe 256GB', codigo_barras: '7890123456789', unidade_medida: 'unidade', quantidade_minima: 20, quantidade_atual: 52, descricao: 'SSD de alta velocidade' },
    { id_item: 2, nome: 'Memória RAM DDR4 8GB', codigo_barras: '7890123456790', unidade_medida: 'unidade', quantidade_minima: 15, quantidade_atual: 14, descricao: 'Corsair Vengeance' },
    { id_item: 3, nome: 'Mouse Gamer Logitech G203', codigo_barras: '7890123456791', unidade_medida: 'unidade', quantidade_minima: 10, quantidade_atual: 35, descricao: 'Mouse RGB' },
    { id_item: 4, nome: 'Teclado Dell KB216', codigo_barras: '7890123456792', unidade_medida: 'unidade', quantidade_minima: 5, quantidade_atual: 0, descricao: 'Teclado ABNT2' },
];

const Item = {
    findAll: () => {
        return items;
    },
    create: (itemData) => {
        const novoId = items.length > 0 ? Math.max(...items.map(i => i.id_item)) + 1 : 1;
        const novoItem = {
            id_item: novoId,
            nome: itemData.nome,
            descricao: itemData.descricao || '',
            codigo_barras: itemData.codigo_barras,
            unidade_medida: itemData.unidade_medida,
            quantidade_minima: parseInt(itemData.quantidade_minima) || 0,
            quantidade_atual: parseInt(itemData.quantidade_atual) || 0,
        };
        items.push(novoItem);
        return novoItem;
    }
};

module.exports = Item;