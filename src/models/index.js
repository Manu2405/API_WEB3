const sequelize = require('../config/database');

// Importar modelos
const Usuario = require('./Usuario')(sequelize);
const Producto = require('./Producto')(sequelize);
const Categoria = require('./Categoria')(sequelize);
const Sucursal = require('./Sucursal')(sequelize);
const Venta = require('./Venta')(sequelize);
const DetalleVenta = require('./DetalleVenta')(sequelize);
const Envio = require('./Envio')(sequelize);
const Carrito = require('./Carrito')(sequelize);
const DetalleCarrito = require('./DetalleCarrito')(sequelize);
const MetodoPago = require('./MetodoPago')(sequelize);

// Establecer relaciones
// Usuario -> Venta
Usuario.hasMany(Venta, { foreignKey: 'id_usuario' });
Venta.belongsTo(Usuario, { foreignKey: 'id_usuario' });

// Usuario -> Carrito
Usuario.hasOne(Carrito, { foreignKey: 'id_usuario' });
Carrito.belongsTo(Usuario, { foreignKey: 'id_usuario' });

// Categoria -> Producto
Categoria.hasMany(Producto, { foreignKey: 'id_categoria' });
Producto.belongsTo(Categoria, { foreignKey: 'id_categoria' });

// Venta -> DetalleVenta
Venta.hasMany(DetalleVenta, { foreignKey: 'id_venta' });
DetalleVenta.belongsTo(Venta, { foreignKey: 'id_venta' });

// Producto -> DetalleVenta
Producto.hasMany(DetalleVenta, { foreignKey: 'id_producto' });
DetalleVenta.belongsTo(Producto, { foreignKey: 'id_producto' });

// Venta -> Envio
Venta.hasOne(Envio, { foreignKey: 'id_venta' });
Envio.belongsTo(Venta, { foreignKey: 'id_venta' });

// Venta -> MetodoPago
MetodoPago.hasMany(Venta, { foreignKey: 'id_metodo_pago' });
Venta.belongsTo(MetodoPago, { foreignKey: 'id_metodo_pago' });

// Venta -> Sucursal
Sucursal.hasMany(Venta, { foreignKey: 'id_sucursal' });
Venta.belongsTo(Sucursal, { foreignKey: 'id_sucursal' });

// Carrito -> DetalleCarrito
Carrito.hasMany(DetalleCarrito, { foreignKey: 'id_carrito' });
DetalleCarrito.belongsTo(Carrito, { foreignKey: 'id_carrito' });

// Producto -> DetalleCarrito
Producto.hasMany(DetalleCarrito, { foreignKey: 'id_producto' });
DetalleCarrito.belongsTo(Producto, { foreignKey: 'id_producto' });

module.exports = {
    sequelize,
    Usuario,
    Producto,
    Categoria,
    Sucursal,
    Venta,
    DetalleVenta,
    Envio,
    Carrito,
    DetalleCarrito,
    MetodoPago
};