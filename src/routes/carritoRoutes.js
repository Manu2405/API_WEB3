const express = require('express');
const { body } = require('express-validator');
const { protect } = require('../middleware/authMiddleware');
const {
    getCarrito,
    addToCart,
    updateCartItem,
    removeFromCart,
    clearCart
} = require('../controllers/carritoController');

const router = express.Router();

router.get('/', protect, getCarrito);
router.post('/', 
    protect,
    [
        body('id_producto').isInt().withMessage('ID de producto inválido'),
        body('cantidad').optional().isInt({ min: 1 }).withMessage('Cantidad inválida')
    ],
    addToCart
);
router.put('/:id_detalle', protect, updateCartItem);
router.delete('/:id_detalle', protect, removeFromCart);
router.delete('/', protect, clearCart);

module.exports = router;