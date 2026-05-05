const express = require('express');
const { protect, admin } = require('../middleware/authMiddleware');
const {
    getEnvioByVenta,
    updateEnvioEstado,
    trackingEnvio
} = require('../controllers/envioController');

const router = express.Router();

router.get('/venta/:id_venta', protect, getEnvioByVenta);
router.get('/tracking/:tracking', trackingEnvio);
router.put('/:id_envio', protect, admin, updateEnvioEstado);

module.exports = router;