const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const {
    createVenta,
    getMisVentas,
    getVentaById,
    getVentasAdmin,
    updateVentaEstado
} = require('../controllers/ventaController');

const router = express.Router();

router.post('/', protect, createVenta);
router.get('/mis-ventas', protect, getMisVentas);
router.get('/:id', protect, getVentaById);
router.get('/admin/all', protect, admin, getVentasAdmin);
router.put('/:id/estado', protect, admin, updateVentaEstado);

module.exports = router;