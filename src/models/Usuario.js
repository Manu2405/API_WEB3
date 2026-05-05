const { DataTypes } = require('sequelize');
const bcrypt = require('bcryptjs');

module.exports = (sequelize) => {
    const Usuario = sequelize.define('Usuario', {
        id_usuario: {
            type: DataTypes.INTEGER,
            primaryKey: true,
            autoIncrement: true
        },
        nombre: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        email: {
            type: DataTypes.STRING(100),
            allowNull: false
        },
        password: {
            type: DataTypes.STRING(255),
            allowNull: false
        },
        telefono: {
            type: DataTypes.STRING(20)
        },
        direccion: {
            type: DataTypes.STRING(200)
        },
        rol: {
            type: DataTypes.STRING(20)
            // Sin defaultValue aquí para evitar problemas
        },
        foto_url: {
            type: DataTypes.STRING(500)
        },
        created_at: {
            type: DataTypes.DATE
        }
    }, {
        tableName: 'Usuarios',
        timestamps: false,
        hooks: {
            beforeCreate: async (user) => {
                if (user.password) {
                    user.password = await bcrypt.hash(user.password, 10);
                }
                if (!user.rol) {
                    user.rol = 'Cliente';
                }
                if (!user.created_at) {
                    user.created_at = new Date();
                }
            },
            beforeUpdate: async (user) => {
                if (user.changed('password')) {
                    user.password = await bcrypt.hash(user.password, 10);
                }
            }
        }
    });

    Usuario.prototype.comparePassword = async function(password) {
        return await bcrypt.compare(password, this.password);
    };

    return Usuario;
};