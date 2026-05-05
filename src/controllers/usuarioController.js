const { Usuario, Carrito, Venta } = require('../models');
const bcrypt = require('bcryptjs');
const { validationResult } = require('express-validator');

// Obtener todos los usuarios (Admin)
const getUsuarios = async (req, res) => {
    try {
        const { page = 1, limit = 10, search, rol } = req.query;
        const offset = (page - 1) * limit;
        
        let where = {};
        if (search) {
            where[Op.or] = [
                { nombre: { [Op.like]: `%${search}%` } },
                { email: { [Op.like]: `%${search}%` } }
            ];
        }
        if (rol) {
            where.rol = rol;
        }
        
        const usuarios = await Usuario.findAndCountAll({
            where,
            attributes: { exclude: ['password'] },
            include: [{
                model: Carrito,
                attributes: ['id_carrito', 'fecha_creacion']
            }],
            limit: parseInt(limit),
            offset: parseInt(offset),
            order: [['created_at', 'DESC']]
        });
        
        res.json({
            success: true,
            total: usuarios.count,
            page: parseInt(page),
            totalPages: Math.ceil(usuarios.count / limit),
            usuarios: usuarios.rows
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener usuarios' });
    }
};

// Obtener usuario por ID
const getUsuarioById = async (req, res) => {
    try {
        // Solo admin puede ver otros usuarios, o el propio usuario
        if (req.user.rol !== 'Admin' && parseInt(req.user.id) !== parseInt(req.params.id)) {
            return res.status(403).json({ message: 'Acceso denegado' });
        }
        
        const usuario = await Usuario.findByPk(req.params.id, {
            attributes: { exclude: ['password'] },
            include: [
                {
                    model: Carrito,
                    attributes: ['id_carrito', 'fecha_creacion']
                },
                {
                    model: Venta,
                    attributes: ['id_venta', 'fecha', 'total', 'estado'],
                    limit: 5,
                    order: [['fecha', 'DESC']]
                }
            ]
        });
        
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        
        res.json({
            success: true,
            usuario
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al obtener usuario' });
    }
};

// Actualizar usuario
const updateUsuario = async (req, res) => {
    try {
        // Solo admin puede editar otros usuarios, o el propio usuario
        if (req.user.rol !== 'Admin' && parseInt(req.user.id) !== parseInt(req.params.id)) {
            return res.status(403).json({ message: 'Acceso denegado' });
        }
        
        const usuario = await Usuario.findByPk(req.params.id);
        
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        
        const { nombre, telefono, direccion, password, rol } = req.body;
        
        // Solo admin puede cambiar el rol
        const updateData = {
            nombre: nombre || usuario.nombre,
            telefono: telefono !== undefined ? telefono : usuario.telefono,
            direccion: direccion !== undefined ? direccion : usuario.direccion
        };
        
        if (req.user.rol === 'Admin' && rol) {
            updateData.rol = rol;
        }
        
        if (password) {
            updateData.password = await bcrypt.hash(password, 10);
        }
        
        if (req.file && req.file.path) {
            updateData.foto_url = req.file.path;
        }
        
        await usuario.update(updateData);
        
        res.json({
            success: true,
            message: 'Usuario actualizado exitosamente',
            usuario: {
                id: usuario.id_usuario,
                nombre: usuario.nombre,
                email: usuario.email,
                telefono: usuario.telefono,
                direccion: usuario.direccion,
                rol: usuario.rol,
                foto_url: usuario.foto_url
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al actualizar usuario' });
    }
};

// Eliminar usuario (Admin)
const deleteUsuario = async (req, res) => {
    try {
        // No permitir eliminar el propio usuario
        if (parseInt(req.user.id) === parseInt(req.params.id)) {
            return res.status(400).json({ message: 'No puedes eliminar tu propia cuenta' });
        }
        
        const usuario = await Usuario.findByPk(req.params.id);
        
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        
        await usuario.destroy();
        
        res.json({
            success: true,
            message: 'Usuario eliminado exitosamente'
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al eliminar usuario' });
    }
};

// Cambiar contraseña
const changePassword = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }
        
        const usuario = await Usuario.findByPk(req.user.id);
        
        const { currentPassword, newPassword } = req.body;
        
        // Verificar contraseña actual
        const isMatch = await usuario.comparePassword(currentPassword);
        if (!isMatch) {
            return res.status(401).json({ message: 'Contraseña actual incorrecta' });
        }
        
        // Actualizar contraseña
        usuario.password = await bcrypt.hash(newPassword, 10);
        await usuario.save();
        
        res.json({
            success: true,
            message: 'Contraseña actualizada exitosamente'
        });
    } catch (error) {
        res.status(500).json({ message: 'Error al cambiar contraseña' });
    }
};

module.exports = {
    getUsuarios,
    getUsuarioById,
    updateUsuario,
    deleteUsuario,
    changePassword
};