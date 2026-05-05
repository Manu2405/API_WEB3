const { DataTypes } = require('sequelize');

module.exports = (sequelize) => {
    const Categoria = sequelize.define('Categoria', {
        id_categoria: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nombre: {
            type: DataTypes.STRING(100),
            allowNull: false
            // ⚠️ QUITAMOS unique: true de aquí
        },
        descripcion: {
            type: DataTypes.STRING(200)
        }
    }, {
        tableName: 'Categorias',
        timestamps: false
    });

    return Categoria;
};