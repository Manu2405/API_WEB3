const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const DetalleVenta = sequelize.define('DetalleVenta', {
        id_detalle: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        id_venta: {
            type: DataTypes.INTEGER,
            allowNull: false,
            references: {
                model: 'Ventas',
                key: 'id_venta'
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
        },
        precio_unitario: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: 0
            }
        },
        subtotal: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false,
            validate: {
                min: 0
            }
        }
    }, {
        tableName: 'DetalleVentas',
        timestamps: false
    });

    return DetalleVenta;
};