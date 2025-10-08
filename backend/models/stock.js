const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Stock = sequelize.define('Stock', {
        id: {
            type: DataTypes.INTEGER,
            autoIncrement: true,
            primaryKey: true
        },
        name: {
            type: DataTypes.STRING,
            allowNull: false,
            unique: true
        },
        description: {
            type: DataTypes.TEXT,
            allowNull: true
        }
    });

    return Stock;
};