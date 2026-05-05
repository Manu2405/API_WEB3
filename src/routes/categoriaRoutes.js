const express = require('express');
const { body } = require('express-validator');
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getCategorias,
    getCategoriaById,
    createCategoria,
    updateCategoria,
    deleteCategoria
} = require('../controllers/categoriaController');

const router = express.Router();

router.get('/', getCategorias);
router.get('/:id', getCategoriaById);
router.post('/', 
    protect, 
    admin,
    [
        body('nombre').notEmpty().withMessage('El nombre es requerido'),
        body('nombre').isLength({ min: 2, max: 100 }).withMessage('El nombre debe tener entre 2 y 100 caracteres')
    ],
    createCategoria
);
router.put('/:id', protect, admin, updateCategoria);
router.delete('/:id', protect, admin, deleteCategoria);

module.exports = router;