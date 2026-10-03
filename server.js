const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');

const app = express();
app.use(cors());
app.use(express.json());

const server = http.createServer(app);
const io = new Server(server, { cors: { origin: '*' } });

// Mapeo en vivo de conexiones: Tiendas, Cadetes y Clientes
const connectedClients = {
  merchants: new Map(),
  drivers: new Map(),
  customers: new Map()
};

io.on('connection', (socket) => {
  console.log('⚡ Dispositivo conectado en tiempo real:', socket.id);

  socket.on('register_role', ({ role, entity_id }) => {
    socket.role = role;
    socket.entity_id = entity_id;
    if (role === 'MERCHANT') connectedClients.merchants.set(entity_id, socket.id);
    if (role === 'DRIVER') connectedClients.drivers.set(entity_id, socket.id);
    if (role === 'CUSTOMER') connectedClients.customers.set(entity_id, socket.id);
    console.log(`✅ [${role}] Conectado exitosamente ID: ${entity_id}`);
  });

  socket.on('new_order_placed', (orderData) => {
    console.log('🛎️ Nuevo pedido recibido:', orderData.order_code);
    const merchantSocket = connectedClients.merchants.get(orderData.merchant_id);
    if (merchantSocket) {
      io.to(merchantSocket).emit('play_kitchen_chime', {
        title: '¡Nueva Comanda Entrante!',
        order: orderData
      });
    }
    io.emit('driver_order_available', {
      order_id: orderData.id,
      pickup_address: orderData.merchant_address,
      delivery_fee: orderData.delivery_fee
    });
  });

  socket.on('disconnect', () => {
    if (socket.role === 'MERCHANT') connectedClients.merchants.delete(socket.entity_id);
    if (socket.role === 'DRIVER') connectedClients.drivers.delete(socket.entity_id);
    if (socket.role === 'CUSTOMER') connectedClients.customers.delete(socket.entity_id);
  });
});

app.get('/', (req, res) => {
  res.send('🚀 SwiftApp Argentina Backend Operativo al 100%');
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => {
  console.log(`Servidor SwiftApp corriendo en puerto ${PORT}`);
});
