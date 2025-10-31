// models/barCut.js
const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const BarCut = sequelize.define('BarCut', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        bar_id: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'bars', // Nome da tabela
                key: 'id'
            }
        },
        consumed_length_mm: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        consumed_by_user: {
            type: DataTypes.STRING(255),
            allowNull: true
        },
        date: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        },
        notes: {
            type: DataTypes.STRING(255),
            allowNull: true
        }
    }, {
        tableName: 'bar_cuts', // Nome exato da tabela
        timestamps: false // Não precisa de createdAt/updatedAt
    });

    BarCut.associate = (models) => {
        // Um Corte (BarCut) pertence a uma Barra (Bar)
        BarCut.belongsTo(models.Bar, {
            foreignKey: 'bar_id',
            as: 'bar'
        });
    };

    return BarCut;
};
