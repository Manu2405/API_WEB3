const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
    getProductos,
    getProductoById,
    createProducto,
    updateProducto,
    deleteProducto
} = require('../controllers/productoController');

const router = express.Router();

router.get('/', getProductos);
router.get('/:id', getProductoById);
router.post('/', protect, admin, upload.single('imagen'), createProducto);
router.put('/:id', protect, admin, upload.single('imagen'), updateProducto);
router.delete('/:id', protect, admin, deleteProducto);

module.exports = router;