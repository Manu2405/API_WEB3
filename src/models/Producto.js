const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Producto = sequelize.define('Producto', {
        id_producto: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nombre: {
            type: DataTypes.STRING(150),
            allowNull: false
        },
        descripcion: {
            type: DataTypes.STRING(500)
        },
        precio: {
            type: DataTypes.DECIMAL(10, 2),
            allowNull: false
        },
        stock: {
            type: DataTypes.INTEGER,
            allowNull: false
            // ⚠️ QUITAR defaultValue: 0
        },
        marca: {
            type: DataTypes.STRING(100)
        },
        imagen_url: {
            type: DataTypes.STRING(500)
        },
        id_categoria: {
            type: DataTypes.INTEGER,
            allowNull: false
        },
        created_at: {
            type: DataTypes.DATE
            // ⚠️ QUITAR defaultValue: DataTypes.NOW
        }
    }, {
        tableName: 'Productos',
        timestamps: false,
        hooks: {
            beforeCreate: (producto) => {
                if (producto.stock === undefined) producto.stock = 0;
                if (!producto.created_at) producto.created_at = new Date();
            }
        }
    });

    return Producto;
};