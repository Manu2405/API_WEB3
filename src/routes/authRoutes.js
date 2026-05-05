const express = require('express');
const { body } = require('express-validator');
const { register, login, getProfile } = require('../controllers/authController');
const { protect } = require('../middleware/authMiddleware');

const router = express.Router();

router.post(
    '/register',
    [
        body('nombre').notEmpty().withMessage('El nombre es requerido'),
        body('email').isEmail().withMessage('Email inválido'),
        body('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
        body('telefono').optional().isMobilePhone('any').withMessage('Teléfono inválido')
    ],
    register
);

router.post(
    '/login',
    [
        body('email').isEmail().withMessage('Email inválido'),
        body('password').notEmpty().withMessage('Contraseña requerida')
    ],
    login
);

router.get('/profile', protect, getProfile);

module.exports = router;