const jwt = require('jsonwebtoken');
const { Usuario, Carrito } = require('../models');
const { validationResult } = require('express-validator');

const generateToken = (id, email, rol, nombre) => {
    return jwt.sign(
        { id, email, rol, nombre },
        process.env.JWT_SECRET,
        { expiresIn: process.env.JWT_EXPIRE }
    );
};

// Registro de usuario
const register = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { nombre, email, password, telefono, direccion } = req.body;

        // Verificar si el usuario ya existe
        const userExists = await Usuario.findOne({ where: { email } });
        if (userExists) {
            return res.status(400).json({ message: 'El email ya está registrado' });
        }

        // Crear usuario
        const usuario = await Usuario.create({
            nombre,
            email,
            password,
            telefono,
            direccion,
            rol: 'Cliente'
        });

        // Crear carrito automáticamente
        await Carrito.create({ id_usuario: usuario.id_usuario });

        // Generar token
        const token = generateToken(usuario.id_usuario, usuario.email, usuario.rol, usuario.nombre);

        res.status(201).json({
            success: true,
            token,
            user: {
                id: usuario.id_usuario,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

// Login
const login = async (req, res) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { email, password } = req.body;

        const usuario = await Usuario.findOne({ where: { email } });
        
        if (!usuario || !(await usuario.comparePassword(password))) {
            return res.status(401).json({ message: 'Credenciales inválidas' });
        }

        const token = generateToken(usuario.id_usuario, usuario.email, usuario.rol, usuario.nombre);

        res.json({
            success: true,
            token,
            user: {
                id: usuario.id_usuario,
                nombre: usuario.nombre,
                email: usuario.email,
                rol: usuario.rol,
                foto_url: usuario.foto_url
            }
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

// Perfil de usuario (protegido)
const getProfile = async (req, res) => {
    try {
        const usuario = await Usuario.findByPk(req.user.id, {
            attributes: { exclude: ['password'] }
        });
        
        if (!usuario) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }

        res.json(usuario);
    } catch (error) {
        res.status(500).json({ message: 'Error en el servidor' });
    }
};

module.exports = { register, login, getProfile };