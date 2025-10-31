// models/bar.js
const { DataTypes } = require('sequelize');

// Esta função será chamada automaticamente pelo models/index.js
module.exports = (sequelize) => {
    const Bar = sequelize.define('Bar', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        original_length_mm: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        remaining_length_mm: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        diameter_mm: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: true
        },
        material: {
            type: DataTypes.STRING(100),
            allowNull: true
        }
    }, {
        tableName: 'bars', // Nome exato da tabela no MySQL
        
        // --- CORREÇÃO APLICADA AQUI ---
        // Desligamos os timestamps, pois a sua tabela 'bars' não tem as
        // colunas 'createdAt' e 'updatedAt'.
        timestamps: false, 
        updatedAt: false
    });

    Bar.associate = (models) => {
        // Uma Barra (Bar) pode ter muitos Cortes (BarCut)
        if (models.BarCut) { // Verifica se o modelo BarCut já foi inicializado
            Bar.hasMany(models.BarCut, {
                foreignKey: 'bar_id',
                as: 'cuts'
            });
        }
    };

    return Bar;
};

