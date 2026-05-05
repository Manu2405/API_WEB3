const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const DetalleCarrito = sequelize.define('DetalleCarrito', {
        id_detalle: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        id_carrito: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Carritos',
                key: 'id_carrito'
            }
        },
        id_producto: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Productos',
                key: 'id_producto'
            }
        },
        cantidad: {
            type: DataTypes.INTEGER,
            allowNull: false,
            validate: {
                min: 1
            }
        }
    }, {
        tableName: 'DetalleCarritos',
        timestamps: false
    });

    return DetalleCarrito;
};