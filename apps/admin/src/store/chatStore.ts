import { create } from 'zustand';
import type { ChatState, Conversation, Customer, Message, Order, Product, SenderType, MessageType, OrderModalState } from '@/types';

// Productos V ONE B
export const products: Product[] = [
  { id: 'P001', name: 'Jersey Giro PRO-01', price: 30000, category: 'ciclismo', emoji: '🚴', sizes: { 'S': 2, 'M': 4, 'L': 1, 'XL': 0 } },
  { id: 'P002', name: 'Jersey Giro PRO-02', price: 30000, category: 'ciclismo', emoji: '🚴', sizes: { 'S': 3, 'M': 5, 'L': 0, 'XL': 2 } },
  { id: 'P003', name: 'Licra Performance', price: 25000, category: 'ciclismo', emoji: '🚴', sizes: { 'S': 5, 'M': 3, 'L': 4, 'XL': 2 } },
  { id: 'P004', name: 'Chaleco Windbreaker', price: 18000, category: 'ciclismo', emoji: '🚴', sizes: { 'S': 2, 'M': 3, 'L': 2, 'XL': 1 } },
  { id: 'P005', name: 'Camisa Trail Runner', price: 12000, category: 'running', emoji: '🏃', sizes: { 'S': 4, 'M': 6, 'L': 3, 'XL': 2 } },
  { id: 'P006', name: 'Camisa Ultra Light', price: 13000, category: 'running', emoji: '🏃', sizes: { 'S': 3, 'M': 4, 'L': 5, 'XL': 3 } },
  { id: 'P007', name: 'Licra Flare', price: 23000, category: 'running', emoji: '🏃', sizes: { 'S': 2, 'M': 4, 'L': 3, 'XL': 1 } },
  { id: 'P008', name: 'Pantaloneta Running', price: 15000, category: 'running', emoji: '🏃', sizes: { 'S': 5, 'M': 4, 'L': 3, 'XL': 2 } },
  { id: 'P009', name: 'Vestido Baño Pro', price: 28000, category: 'natacion', emoji: '🏊', sizes: { 'S': 3, 'M': 4, 'L': 2, 'XL': 1 } },
  { id: 'P010', name: 'Pantaloneta Surf', price: 16000, category: 'natacion', emoji: '🏄', sizes: { 'S': 4, 'M': 5, 'L': 3, 'XL': 2 } },
  { id: 'P011', name: 'Gorra V-One-B', price: 6000, category: 'accesorios', emoji: '🧢', sizes: { 'U': 15 } },
  { id: 'P012', name: 'Guantes Ciclismo', price: 8000, category: 'accesorios', emoji: '🧤', sizes: { 'S': 3, 'M': 5, 'L': 4, 'XL': 2 } },
  { id: 'P013', name: 'Medias Camino CR', price: 5000, category: 'accesorios', emoji: '🧦', sizes: { 'S': 8, 'M': 10, 'L': 6, 'XL': 4 } },
  { id: 'P014', name: 'Mangas UV', price: 7000, category: 'accesorios', emoji: '💪', sizes: { 'S': 4, 'M': 6, 'L': 3, 'XL': 2 } },
  { id: 'P015', name: 'Bolso Deportivo', price: 22000, category: 'accesorios', emoji: '🎒', sizes: { 'U': 5 } },
  { id: 'P016', name: 'Bandana Multiuso', price: 4500, category: 'accesorios', emoji: '🧣', sizes: { 'U': 12 } },
  { id: 'P017', name: 'Top Deportivo Basic', price: 9000, category: 'tops', emoji: '👕', sizes: { 'S': 5, 'M': 7, 'L': 4, 'XL': 2 } },
  { id: 'P018', name: 'Crop Top Pro', price: 15000, category: 'tops', emoji: '👕', sizes: { 'S': 3, 'M': 5, 'L': 3, 'XL': 1 } },
  { id: 'P019', name: 'Enterizo Ciclismo', price: 45000, category: 'ciclismo', emoji: '🚴', sizes: { 'S': 2, 'M': 3, 'L': 1, 'XL': 0 } },
  { id: 'P020', name: 'Sombrero Aventura', price: 12000, category: 'accesorios', emoji: '🤠', sizes: { 'U': 6 } },
];

// Clientes
const customers: Customer[] = [
  {
    id: 'C001',
    name: 'Laura Salazar',
    phone: '+506 7012-3456',
    email: 'laura.salazar@gmail.com',
    address: 'Cartago, Tres Ríos',
    city: 'Cartago',
    customerSince: new Date('2025-02-15'),
    totalOrders: 7,
    totalSpent: 156000,
    lastOrderDate: new Date('2026-03-20'),
    sports: ['Ciclismo', 'Running'],
    frequentProducts: [
      { name: 'Jerseys', count: 3, emoji: '🚴' },
      { name: 'Medias', count: 5, emoji: '🧦' },
      { name: 'Guantes', count: 2, emoji: '🧤' },
    ],
    activeOrders: [],
  },
  {
    id: 'C002',
    name: 'Carlos Mora',
    phone: '+506 8345-6789',
    email: 'carlos.mora@pedalpower.cr',
    address: 'San José, Escazú',
    city: 'San José',
    customerSince: new Date('2024-08-10'),
    totalOrders: 3,
    totalSpent: 89000,
    lastOrderDate: new Date('2026-02-15'),
    sports: ['Ciclismo'],
    frequentProducts: [
      { name: 'Jerseys', count: 2, emoji: '🚴' },
      { name: 'Licras', count: 2, emoji: '🚴' },
    ],
    activeOrders: [],
  },
  {
    id: 'C003',
    name: 'Roberto Chaves',
    phone: '+506 6123-4567',
    email: 'roberto.chaves@yahoo.com',
    address: 'Heredia, San Pablo',
    city: 'Heredia',
    customerSince: new Date('2025-06-20'),
    totalOrders: 4,
    totalSpent: 112000,
    lastOrderDate: new Date('2026-03-15'),
    sports: ['Running', 'Senderismo'],
    frequentProducts: [
      { name: 'Camisas', count: 3, emoji: '🏃' },
      { name: 'Pantalonetas', count: 2, emoji: '🏃' },
    ],
    activeOrders: [],
  },
  {
    id: 'C004',
    name: 'Melissa Quesada',
    phone: '+506 7234-5678',
    email: 'melissa.q@gmail.com',
    address: 'Alajuela, San Rafael',
    city: 'Alajuela',
    customerSince: new Date('2024-11-05'),
    totalOrders: 12,
    totalSpent: 245000,
    lastOrderDate: new Date('2026-03-22'),
    sports: ['Running', 'Yoga'],
    frequentProducts: [
      { name: 'Licras', count: 6, emoji: '🏃' },
      { name: 'Tops', count: 4, emoji: '👕' },
      { name: 'Medias', count: 8, emoji: '🧦' },
    ],
    activeOrders: [],
  },
  {
    id: 'C005',
    name: 'Diego Fernández',
    phone: '+506 8456-7890',
    email: undefined,
    address: undefined,
    city: undefined,
    customerSince: new Date(),
    totalOrders: 0,
    totalSpent: 0,
    lastOrderDate: undefined,
    sports: [],
    frequentProducts: [],
    activeOrders: [],
  },
  {
    id: 'C006',
    name: 'Andrea Villalobos',
    phone: '+506 7567-8901',
    email: 'andrea.v@hotmail.com',
    address: 'San José, Curridabat',
    city: 'San José',
    customerSince: new Date('2025-01-10'),
    totalOrders: 5,
    totalSpent: 134000,
    lastOrderDate: new Date('2026-03-10'),
    sports: ['Natación', 'Surf'],
    frequentProducts: [
      { name: 'Vestidos baño', count: 3, emoji: '🏊' },
      { name: 'Pantalonetas', count: 2, emoji: '🏄' },
    ],
    activeOrders: [],
  },
  {
    id: 'C007',
    name: 'José Mora',
    phone: '+506 6678-9012',
    email: 'jose.mora@gmail.com',
    address: 'Cartago, El Tejar',
    city: 'Cartago',
    customerSince: new Date('2024-09-15'),
    totalOrders: 8,
    totalSpent: 178000,
    lastOrderDate: new Date('2026-03-18'),
    sports: ['Ciclismo'],
    frequentProducts: [
      { name: 'Jerseys', count: 4, emoji: '🚴' },
      { name: 'Chalecos', count: 2, emoji: '🚴' },
      { name: 'Gorras', count: 3, emoji: '🧢' },
    ],
    activeOrders: [],
  },
  {
    id: 'C008',
    name: 'Sofía Rojas',
    phone: '+506 7789-0123',
    email: 'sofia.rojas@outlook.com',
    address: 'San José, Santa Ana',
    city: 'San José',
    customerSince: new Date('2025-04-20'),
    totalOrders: 2,
    totalSpent: 45000,
    lastOrderDate: new Date('2026-02-28'),
    sports: ['Senderismo'],
    frequentProducts: [
      { name: 'Medias', count: 2, emoji: '🧦' },
      { name: 'Gorras', count: 1, emoji: '🧢' },
    ],
    activeOrders: [],
  },
];

// Pedidos activos
const orders: Order[] = [
  {
    id: 'ORD-2026-0092',
    customerId: 'C001',
    items: [{ product: products[0], size: 'M', quantity: 1 }],
    status: 'processing',
    total: 30000,
    shippingCost: 2500,
    createdAt: new Date('2026-03-22'),
    deliveryType: 'shipping',
    address: 'Cartago, Tres Ríos',
  },
  {
    id: 'ORD-2026-0089',
    customerId: 'C006',
    items: [{ product: products[8], size: 'M', quantity: 1 }, { product: products[9], size: 'L', quantity: 1 }],
    status: 'processing',
    total: 44000,
    shippingCost: 2500,
    createdAt: new Date('2026-03-20'),
    deliveryType: 'shipping',
    address: 'San José, Curridabat',
  },
  {
    id: 'ORD-2026-0087',
    customerId: 'C007',
    items: [{ product: products[1], size: 'L', quantity: 1 }, { product: products[10], size: 'U', quantity: 1 }],
    status: 'ready',
    total: 36000,
    shippingCost: 0,
    createdAt: new Date('2026-03-18'),
    deliveryType: 'pickup',
    address: 'Retiro en taller',
  },
];

// Asignar pedidos a clientes
customers[0].activeOrders = [orders[0]];
customers[5].activeOrders = [orders[1]];
customers[6].activeOrders = [orders[2]];

// Función para crear mensajes
const createMessage = (
  id: string,
  conversationId: string,
  sender: SenderType,
  content: string,
  timestamp: Date,
  senderName?: string,
  type: MessageType = 'text',
  products?: Product[],
  buttons?: { label: string; action: string }[]
): Message => ({
  id,
  conversationId,
  sender,
  senderName,
  content,
  timestamp,
  type,
  products,
  buttons,
  read: true,
});

// Conversaciones
const conversations: Conversation[] = [
  // Conversación 1: Laura - Consulta de disponibilidad
  {
    id: 'CONV001',
    customer: customers[0],
    status: 'bot',
    messages: [
      createMessage('M001', 'CONV001', 'client', 'Hola! Vi en Instagram que tienen jerseys nuevos para ciclismo. ¿Tienen en talla M?', new Date('2026-03-28T10:15:00'), undefined, 'text'),
      createMessage('M002', 'CONV001', 'bot', '🤖 ¡Hola Laura! 😊 Qué gusto verte de nuevo.\n\nSí tenemos jerseys nuevos! Te muestro la disponibilidad de los Jersey Giro PRO:\n\n🚴 Jersey Giro PRO-01\n   S ✅(2) M ✅(4) L ✅(1)\n   XL ❌ agotado\n   ₡30,000\n\n🚴 Jersey Giro PRO-02\n   S ✅(3) M ✅(5) L ❌\n   XL ✅(2)\n   ₡30,000\n\n¿Te interesa alguno?', new Date('2026-03-28T10:15:30'), undefined, 'text'),
      createMessage('M003', 'CONV001', 'client', 'El PRO-01 en M! ¿Lo puedo pedir para que me lo envíen a Cartago?', new Date('2026-03-28T10:17:00'), undefined, 'text'),
      createMessage('M004', 'CONV001', 'bot', '🤖 ¡Excelente elección! 🎉\n\nTu pedido:\n📦 Jersey Giro PRO-01 (M)\n💰 ₡30,000\n📍 Envío a Cartago\n\nLos envíos salen lunes y miércoles. Tiempo de entrega: 1-3 días hábiles.\n\n¿Confirmo el pedido?', new Date('2026-03-28T10:18:00'), undefined, 'text', undefined, [
        { label: '✅ Sí, confirmar', action: 'confirm' },
        { label: '❌ No, quiero ver más', action: 'cancel' },
      ]),
      createMessage('M005', 'CONV001', 'client', 'Sí confirmo! Usen la misma dirección de siempre', new Date('2026-03-28T10:20:00'), undefined, 'text'),
      createMessage('M006', 'CONV001', 'bot', '🤖 ¡Perfecto! ✅\n\nPedido confirmado:\n📦 ORD-2026-0092\n🚴 Jersey Giro PRO-01 (M)\n💰 ₡30,000 + ₡2,500 envío = ₡32,500\n📍 Cartago, Tres Ríos\n\nTe enviaremos confirmación por WhatsApp cuando salga el envío el lunes. ¡Gracias por tu compra Laura! 🚴‍♀️', new Date('2026-03-28T10:21:00'), undefined, 'text'),
    ],
    unreadCount: 0,
    lastMessageAt: new Date('2026-03-28T10:21:00'),
    startedAt: new Date('2026-03-28T10:15:00'),
    topic: 'Consulta de disponibilidad → Pedido',
  },
  // Conversación 2: Carlos - Esperando agente (uniformes personalizados)
  {
    id: 'CONV002',
    customer: customers[1],
    status: 'waiting',
    messages: [
      createMessage('M007', 'CONV002', 'client', 'Hola, necesito cotizar uniformes personalizados para mi equipo de ciclismo', new Date('2026-03-28T10:25:00'), undefined, 'text'),
      createMessage('M008', 'CONV002', 'bot', '🤖 ¡Hola! 👋 Bienvenido a V ONE B.\n\nPara cotizaciones personalizadas y pedidos especiales, te conecto con uno de nuestros agentes.\n\n⏳ Espera estimada: 2-3 minutos', new Date('2026-03-28T10:25:30'), undefined, 'text'),
      createMessage('M009', 'CONV002', 'client', 'Somos 8 personas, necesitamos jerseys con el logo de nuestro equipo "Pedal Power CR". También quiero saber precios al por mayor y tiempos de entrega', new Date('2026-03-28T10:27:00'), undefined, 'text'),
    ],
    unreadCount: 2,
    lastMessageAt: new Date('2026-03-28T10:27:00'),
    startedAt: new Date('2026-03-28T10:25:00'),
    topic: 'Uniformes personalizados para equipo',
  },
  // Conversación 3: Roberto - Agente ayudando con cambio de talla
  {
    id: 'CONV003',
    customer: customers[2],
    status: 'agent',
    agentName: 'Karla',
    messages: [
      createMessage('M010', 'CONV003', 'client', 'Hola, compré una camisa Trail Runner en M pero me queda grande. ¿Puedo cambiarla por una S?', new Date('2026-03-28T09:45:00'), undefined, 'text'),
      createMessage('M011', 'CONV003', 'bot', '🤖 ¡Hola Roberto! 👋\n\nPara solicitudes de cambio, te conecto con atención al cliente.\n\n⏳ Espera estimada: 1-2 minutos', new Date('2026-03-28T09:45:30'), undefined, 'text'),
      createMessage('M012', 'CONV003', 'agent', '¡Hola Roberto! Soy Karla de atención al cliente V ONE B 😊\n\nClaro que sí podemos ayudarte con el cambio de talla. ¿Tienes el número de pedido?', new Date('2026-03-28T09:47:00'), 'Karla', 'text'),
      createMessage('M013', 'CONV003', 'client', 'Es el ORD-2026-0085', new Date('2026-03-28T09:48:00'), undefined, 'text'),
      createMessage('M014', 'CONV003', 'agent', '¡Perfecto! Veo tu pedido. La Camisa Trail Runner en M puede cambiarse por talla S. Tenemos disponibilidad.\n\n¿Prefieres enviarnos la camisa o pasar al taller a hacer el cambio?', new Date('2026-03-28T09:50:00'), 'Karla', 'text'),
      createMessage('M015', 'CONV003', 'client', 'Prefiero pasar al taller. ¿En qué horario están?', new Date('2026-03-28T09:52:00'), undefined, 'text'),
      createMessage('M016', 'CONV003', 'agent', 'Estamos de lunes a viernes de 9am a 6pm y sábados de 9am a 1pm.\n\nDirección: San José, Barrio Escalante, 100m norte del Parque de la Paz.\n\nTe confirmo el envío...', new Date('2026-03-28T10:00:00'), 'Karla', 'text'),
    ],
    unreadCount: 0,
    lastMessageAt: new Date('2026-03-28T10:00:00'),
    startedAt: new Date('2026-03-28T09:45:00'),
    topic: 'Cambio de talla',
  },
  // Conversación 4: Melissa - Cliente recurrente, licras flare
  {
    id: 'CONV004',
    customer: customers[3],
    status: 'bot',
    messages: [
      createMessage('M017', 'CONV004', 'client', 'Hola! ¿Ya llegaron las licras flare nuevas que me dijeron?', new Date('2026-03-28T09:50:00'), undefined, 'text'),
      createMessage('M018', 'CONV004', 'bot', '🤖 ¡Hola Melissa! 😊 Qué gusto saludarte.\n\n¡Sí! Acaban de llegar las Licras Flare nuevas. Te muestro disponibilidad:\n\n🏃 Licra Flare - Nuevo modelo 2026\n   S ✅(2) M ✅(4) L ✅(3) XL ✅(1)\n   ₡23,000\n\n¿Te gustaría apartar la tuya?', new Date('2026-03-28T09:50:30'), undefined, 'text'),
      createMessage('M019', 'CONV004', 'client', 'Genial! La M por favor. ¿Tienen el nuevo color verde esmeralda?', new Date('2026-03-28T09:52:00'), undefined, 'text'),
      createMessage('M020', 'CONV004', 'bot', '🤖 ¡Sí! Tenemos el nuevo color Verde Esmeralda en talla M ✅\n\n🏃 Licra Flare (M) - Verde Esmeralda\n   ₡23,000\n\n¿Te la agrego a tu pedido?', new Date('2026-03-28T09:53:00'), undefined, 'text'),
      createMessage('M021', 'CONV004', 'client', 'Sí por favor! Y también unas medias del Camino de Costa Rica', new Date('2026-03-28T09:55:00'), undefined, 'text'),
    ],
    unreadCount: 1,
    lastMessageAt: new Date('2026-03-28T09:55:00'),
    startedAt: new Date('2026-03-28T09:50:00'),
    topic: 'Licras flare nuevas',
  },
  // Conversación 5: Diego - Cliente nuevo, bot recopilando datos
  {
    id: 'CONV005',
    customer: customers[4],
    status: 'bot',
    messages: [
      createMessage('M022', 'CONV005', 'client', 'Hola, vi su página y quiero comprar', new Date('2026-03-28T09:30:00'), undefined, 'text'),
      createMessage('M023', 'CONV005', 'bot', '🤖 ¡Hola! 👋 Bienvenido a V ONE B.\n\nSoy el asistente virtual y te ayudaré con tu compra.\n\nPara comenzar, ¿podrías decirme tu nombre completo?', new Date('2026-03-28T09:30:30'), undefined, 'text'),
      createMessage('M024', 'CONV005', 'client', 'Diego Fernández', new Date('2026-03-28T09:31:00'), undefined, 'text'),
      createMessage('M025', 'CONV005', 'bot', '🤖 ¡Mucho gusto Diego! 😊\n\n¿Me podrías compartir tu correo electrónico?', new Date('2026-03-28T09:31:30'), undefined, 'text'),
      createMessage('M026', 'CONV005', 'client', 'diego.fernandez@email.com', new Date('2026-03-28T09:32:00'), undefined, 'text'),
      createMessage('M027', 'CONV005', 'bot', '🤖 ¡Gracias! 📧\n\n¿Cuál es tu dirección completa para el envío? (Provincia, cantón, distrito, señas)', new Date('2026-03-28T09:32:30'), undefined, 'text'),
      createMessage('M028', 'CONV005', 'client', 'Alajuela, San Ramón, Piedades Norte. De la iglesia 200m sur casa verde.', new Date('2026-03-28T09:35:00'), undefined, 'text'),
      createMessage('M029', 'CONV005', 'bot', '🤖 ¡Perfecto! 📍\n\n¿Qué productos te interesan? Tenemos:\n\n🚴 Ciclismo\n🏃 Running/Senderismo\n🏊 Natación/Surf\n🧢 Accesorios\n👕 Tops deportivos', new Date('2026-03-28T09:36:00'), undefined, 'text'),
    ],
    unreadCount: 1,
    lastMessageAt: new Date('2026-03-28T09:36:00'),
    startedAt: new Date('2026-03-28T09:30:00'),
    topic: 'Nuevo cliente - Recopilando datos',
  },
  // Conversación 6: Andrea - Consulta de estado de pedido
  {
    id: 'CONV006',
    customer: customers[5],
    status: 'bot',
    messages: [
      createMessage('M030', 'CONV006', 'client', 'Hola, quería saber en qué estado está mi pedido ORD-2026-0089', new Date('2026-03-28T09:15:00'), undefined, 'text'),
      createMessage('M031', 'CONV006', 'bot', '🤖 ¡Hola Andrea! 😊\n\nDéjame consultar el estado de tu pedido ORD-2026-0089...\n\n📦 Pedido ORD-2026-0089\n🔄 Estado: En Proceso\n\nProductos:\n🏊 Vestido Baño Pro (M) - ₡28,000\n🏄 Pantaloneta Surf (L) - ₡16,000\n📦 Envío: ₡2,500\n💰 Total: ₡46,500\n\nTu pedido está siendo preparado. Se enviará el próximo lunes.', new Date('2026-03-28T09:15:30'), undefined, 'text'),
      createMessage('M032', 'CONV006', 'client', 'Perfecto, gracias! Y llega a Curridabat verdad?', new Date('2026-03-28T09:17:00'), undefined, 'text'),
      createMessage('M033', 'CONV006', 'bot', '🤖 ¡Sí! ✅\n\n📍 Dirección de envío:\nSan José, Curridabat\n\nEl envío a Curridabat toma 1-2 días hábiles después de que sale. Te notificaremos cuando esté en camino.', new Date('2026-03-28T09:18:00'), undefined, 'text'),
      createMessage('M034', 'CONV006', 'client', '¡Gracias, que tengan buen día!', new Date('2026-03-28T09:20:00'), undefined, 'text'),
      createMessage('M035', 'CONV006', 'bot', '🤖 ¡Gracias a ti Andrea! 🌟\n\nQuedamos atentos. ¡Que tengas un excelente día!', new Date('2026-03-28T09:21:00'), undefined, 'text'),
    ],
    unreadCount: 0,
    lastMessageAt: new Date('2026-03-28T09:21:00'),
    startedAt: new Date('2026-03-28T09:15:00'),
    topic: 'Consulta estado de pedido',
  },
  // Conversación 7: José - Pedido listo para recoger
  {
    id: 'CONV007',
    customer: customers[6],
    status: 'inactive',
    messages: [
      createMessage('M036', 'CONV007', 'bot', '🤖 ¡Hola José! 👋\n\nTu pedido ORD-2026-0087 está listo para retiro:\n\n📦 ORD-2026-0087\n✅ Listo para recoger\n\nProductos:\n🚴 Jersey Giro PRO-02 (L)\n🧢 Gorra V-One-B\n💰 Total: ₡36,000\n\nHorario de retiro: L-V 9am-6pm, Sáb 9am-1pm', new Date('2026-03-27T16:00:00'), undefined, 'text'),
      createMessage('M037', 'CONV007', 'client', '¡Excelente! Paso mañana sábado en la mañana', new Date('2026-03-27T16:30:00'), undefined, 'text'),
      createMessage('M038', 'CONV007', 'bot', '🤖 ¡Perfecto! ✅\n\nTe esperamos el sábado de 9am a 1pm.\n\n📍 Dirección: San José, Barrio Escalante, 100m norte del Parque de la Paz\n\n¡Gracias por tu compra!', new Date('2026-03-27T16:31:00'), undefined, 'text'),
      createMessage('M039', 'CONV007', 'client', 'Gracias!', new Date('2026-03-27T16:35:00'), undefined, 'text'),
    ],
    unreadCount: 0,
    lastMessageAt: new Date('2026-03-27T16:35:00'),
    startedAt: new Date('2026-03-27T16:00:00'),
    topic: 'Pedido listo para retiro',
  },
  // Conversación 8: Sofía - Medias del Camino y gorras
  {
    id: 'CONV008',
    customer: customers[7],
    status: 'bot',
    messages: [
      createMessage('M040', 'CONV008', 'client', 'Hola! Tienen las medias del Camino de Costa Rica? Y gorras?', new Date('2026-03-28T08:45:00'), undefined, 'text'),
      createMessage('M041', 'CONV008', 'bot', '🤖 ¡Hola Sofía! 👋\n\nSí, tenemos ambos productos disponibles:\n\n🧦 Medias Camino de Costa Rica\n   S ✅(8) M ✅(10) L ✅(6) XL ✅(4)\n   ₡5,000\n\n🧢 Gorra V-One-B\n   Disponible: 15 unidades\n   ₡6,000\n\n¿Te gustaría ordenar?', new Date('2026-03-28T08:45:30'), undefined, 'text'),
      createMessage('M042', 'CONV008', 'client', 'Sí! Una gorra y 2 pares de medias M', new Date('2026-03-28T08:47:00'), undefined, 'text'),
      createMessage('M043', 'CONV008', 'bot', '🤖 ¡Perfecto! 🎉\n\nTu pedido:\n🧢 Gorra V-One-B x1 - ₡6,000\n🧦 Medias Camino CR (M) x2 - ₡10,000\n📦 Subtotal: ₡16,000\n\n¿Envío o retiro en taller?', new Date('2026-03-28T08:48:00'), undefined, 'text'),
      createMessage('M044', 'CONV008', 'client', 'Envío a Santa Ana por favor', new Date('2026-03-28T08:50:00'), undefined, 'text'),
      createMessage('M045', 'CONV008', 'bot', '🤖 ¡Listo! ✅\n\n🧢 Gorra V-One-B x1\n🧦 Medias Camino CR (M) x2\n📦 Subtotal: ₡16,000\n🚚 Envío a Santa Ana: ₡2,500\n💰 Total: ₡18,500\n\n¿Confirmamos el pedido?', new Date('2026-03-28T08:51:00'), undefined, 'text', undefined, [
        { label: '✅ Confirmar', action: 'confirm' },
        { label: '❌ Modificar', action: 'modify' },
      ]),
    ],
    unreadCount: 1,
    lastMessageAt: new Date('2026-03-28T08:51:00'),
    startedAt: new Date('2026-03-28T08:45:00'),
    topic: 'Medias y gorras',
  },
];

// Store de Zustand
export const useChatStore = create<ChatState>((set, get) => ({
  conversations,
  selectedConversationId: null,
  filter: 'all',
  searchQuery: '',
  isInfoPanelOpen: true,
  currentView: 'list',

  selectConversation: (id: string) => {
    set({ selectedConversationId: id, currentView: 'chat' });
    // Marcar como leída
    const state = get();
    const conversation = state.conversations.find(c => c.id === id);
    if (conversation && conversation.unreadCount > 0) {
      set({
        conversations: state.conversations.map(c =>
          c.id === id ? { ...c, unreadCount: 0 } : c
        ),
      });
    }
  },

  sendMessage: (content: string) => {
    const state = get();
    if (!state.selectedConversationId) return;

    const newMessage: Message = {
      id: `M${Date.now()}`,
      conversationId: state.selectedConversationId,
      sender: 'agent',
      senderName: 'Tú',
      content,
      timestamp: new Date(),
      type: 'text',
      read: true,
    };

    set({
      conversations: state.conversations.map(c =>
        c.id === state.selectedConversationId
          ? {
              ...c,
              messages: [...c.messages, newMessage],
              lastMessageAt: new Date(),
            }
          : c
      ),
    });
  },

  takeConversation: () => {
    const state = get();
    if (!state.selectedConversationId) return;

    set({
      conversations: state.conversations.map(c =>
        c.id === state.selectedConversationId
          ? { ...c, status: 'agent', agentName: 'Tú' }
          : c
      ),
    });
  },

  returnToBot: () => {
    const state = get();
    if (!state.selectedConversationId) return;

    set({
      conversations: state.conversations.map(c =>
        c.id === state.selectedConversationId
          ? { ...c, status: 'bot', agentName: undefined }
          : c
      ),
    });
  },

  setFilter: (filter: 'all' | 'bot' | 'waiting' | 'agent') => set({ filter }),

  setSearchQuery: (searchQuery: string) => set({ searchQuery }),

  toggleInfoPanel: () => set(state => ({ isInfoPanelOpen: !state.isInfoPanelOpen })),

  setView: (view: 'list' | 'chat' | 'info') => set({ currentView: view }),

  markAsRead: (conversationId: string) => {
    set(state => ({
      conversations: state.conversations.map(c =>
        c.id === conversationId ? { ...c, unreadCount: 0 } : c
      ),
    }));
  },

  getFilteredConversations: () => {
    const state = get();
    let filtered = state.conversations;

    // Aplicar filtro de estado
    if (state.filter !== 'all') {
      filtered = filtered.filter(c => c.status === state.filter);
    }

    // Aplicar búsqueda
    if (state.searchQuery) {
      const query = state.searchQuery.toLowerCase();
      filtered = filtered.filter(
        c =>
          c.customer.name.toLowerCase().includes(query) ||
          c.customer.phone.includes(query)
      );
    }

    // Ordenar: primero las que esperan agente, luego por fecha
    return filtered.sort((a, b) => {
      if (a.status === 'waiting' && b.status !== 'waiting') return -1;
      if (b.status === 'waiting' && a.status !== 'waiting') return 1;
      return b.lastMessageAt.getTime() - a.lastMessageAt.getTime();
    });
  },

  getSelectedConversation: () => {
    const state = get();
    return state.conversations.find(c => c.id === state.selectedConversationId);
  },
}));

// Store para el modal de pedidos
export const useOrderModalStore = create<OrderModalState>((set) => ({
  isOpen: false,
  selectedProducts: [],
  deliveryType: 'shipping',
  notes: '',

  openModal: () => set({ isOpen: true }),
  closeModal: () => set({ isOpen: false }),
  addProduct: (product: Product, size: string, quantity: number) =>
    set((state: { selectedProducts: { product: Product; size: string; quantity: number }[] }) => ({
      selectedProducts: [...state.selectedProducts, { product, size, quantity }],
    })),
  removeProduct: (index: number) =>
    set((state: { selectedProducts: { product: Product; size: string; quantity: number }[] }) => ({
      selectedProducts: state.selectedProducts.filter((_: unknown, i: number) => i !== index),
    })),
  setDeliveryType: (type: 'shipping' | 'pickup') => set({ deliveryType: type }),
  setNotes: (notes: string) => set({ notes }),
  clear: () => set({ selectedProducts: [], deliveryType: 'shipping', notes: '' }),
}));
