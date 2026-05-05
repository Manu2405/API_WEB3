const express = require('express');
const { body } = require('express-validator');
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getMetodosPago,
    getMetodoPagoById,
    createMetodoPago,
    updateMetodoPago,
    deleteMetodoPago,
    initMetodosPago
} = require('../controllers/metodoPagoController');

const router = express.Router();

router.get('/', getMetodosPago);
router.get('/init', initMetodosPago);
router.get('/:id', getMetodoPagoById);
router.post('/', 
    protect, 
    admin,
    [
        body('tipo').notEmpty().withMessage('El tipo es requerido'),
        body('tipo').isIn(['Tarjeta', 'Efectivo', 'Transferencia', 'PayPal']).withMessage('Tipo inválido')
    ],
    createMetodoPago
);
router.put('/:id', protect, admin, updateMetodoPago);
router.delete('/:id', protect, admin, deleteMetodoPago);

module.exports = router;