const express = require('express');
const { body } = require('express-validator');
const { protect, admin } = require('../middleware/authMiddleware');
const upload = require('../middleware/uploadMiddleware');
const {
    getSucursales,
    getSucursalById,
    createSucursal,
    updateSucursal,
    deleteSucursal,
    getSucursalesCercanas
} = require('../controllers/sucursalController');

const router = express.Router();

router.get('/', getSucursales);
router.get('/cercanas', getSucursalesCercanas);
router.get('/:id', getSucursalById);
router.post('/', 
    protect, 
    admin,
    upload.single('foto'),
    [
        body('nombre').notEmpty().withMessage('El nombre es requerido'),
        body('direccion').notEmpty().withMessage('La dirección es requerida')
    ],
    createSucursal
);
router.put('/:id', protect, admin, upload.single('foto'), updateSucursal);
router.delete('/:id', protect, admin, deleteSucursal);

module.exports = router;