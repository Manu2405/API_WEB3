const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Carrito = sequelize.define('Carrito', {
        id_carrito: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        id_usuario: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Usuarios',
                key: 'id_usuario'
            }
        },
        fecha_creacion: {
            type: DataTypes.DATE,
            defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'Carritos',
        timestamps: false
    });

    return Carrito;
};