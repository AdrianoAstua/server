import { clientCommunicationEngine, type IntentType } from './client-communication.js'

// ─────────────────────────────────────────────────────────────────────────────
// Training Data: 500+ escenarios de conversacion para el motor de comunicacion
// Cada escenario es un par: mensaje de cliente → intencion correcta → respuesta
// Cubre espanol costarricense informal, slang, emojis, typos y edge cases.
// ─────────────────────────────────────────────────────────────────────────────

export interface ConversationTraining {
  id: string
  category: string
  clientMessage: string
  expectedIntent: IntentType
  expectedConfidence: number
  context?: string
  expectedResponseKey: string
  extractedData?: Record<string, unknown>
  isAmbiguous: boolean
  notes?: string
}

// ── STATUS INQUIRIES (85 escenarios) ────────────────────────────────────────

const STATUS_SCENARIOS: ConversationTraining[] = [
  { id: 'ST-001', category: 'status', clientMessage: 'Como va mi pedido?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.85, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-002', category: 'status', clientMessage: 'Cómo va lo mío?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.85, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-003', category: 'status', clientMessage: 'Ya está listo?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.85, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-004', category: 'status', clientMessage: 'Cuándo lo puedo recoger?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.85, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-005', category: 'status', clientMessage: 'Falta mucho?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.80, expectedResponseKey: 'status_in_production', isAmbiguous: true },
  { id: 'ST-006', category: 'status', clientMessage: 'Mae qué hay de mi encargo', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.82, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-007', category: 'status', clientMessage: 'Buenos días, quería saber sobre mi orden 21294', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.90, expectedResponseKey: 'status_in_production', extractedData: { orderNumber: '21294' }, isAmbiguous: false },
  { id: 'ST-008', category: 'status', clientMessage: 'Hola, ya me mandaron el diseño?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.85, expectedResponseKey: 'status_in_design', isAmbiguous: false },
  { id: 'ST-009', category: 'status', clientMessage: 'Sigo esperando', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.80, expectedResponseKey: 'status_in_production', isAmbiguous: true },
  { id: 'ST-010', category: 'status', clientMessage: 'Por qué se tarda tanto?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.82, expectedResponseKey: 'status_in_production', isAmbiguous: false, notes: 'Tono de queja leve' },
  { id: 'ST-011', category: 'status', clientMessage: 'Qué hay de lo mío?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.85, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-012', category: 'status', clientMessage: 'Y mi pedido?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.85, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-013', category: 'status', clientMessage: 'Algún avance con mi orden VB-202604-0015?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.92, expectedResponseKey: 'status_in_production', extractedData: { orderNumber: 'VB-202604-0015' }, isAmbiguous: false },
  { id: 'ST-014', category: 'status', clientMessage: 'Tienen noticias de mi pedido?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.85, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-015', category: 'status', clientMessage: 'Cómo va eso?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.78, expectedResponseKey: 'status_in_production', isAmbiguous: true },
  { id: 'ST-016', category: 'status', clientMessage: 'mae y eso?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.70, expectedResponseKey: 'clarification_order', isAmbiguous: true },
  { id: 'ST-017', category: 'status', clientMessage: 'Me puede dar un update de la orden 0032?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.90, expectedResponseKey: 'status_in_production', extractedData: { orderNumber: '0032' }, isAmbiguous: false },
  { id: 'ST-018', category: 'status', clientMessage: 'Para cuándo va a estar?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.85, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-019', category: 'status', clientMessage: 'Qué me cuenta de mi pedido', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.85, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-020', category: 'status', clientMessage: 'Cómo van con las mangas que pedí?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.88, expectedResponseKey: 'status_in_production', extractedData: { productType: 'mangas' }, isAmbiguous: false },
  { id: 'ST-021', category: 'status', clientMessage: 'Buenos días, consulta sobre la orden #15', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.90, expectedResponseKey: 'status_in_production', extractedData: { orderNumber: '0015' }, isAmbiguous: false },
  { id: 'ST-022', category: 'status', clientMessage: 'Necesito saber el estado de mi pedido', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.90, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-023', category: 'status', clientMessage: 'Le escribo para ver lo de mi orden', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.82, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-024', category: 'status', clientMessage: 'Ya entraron a producción?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.85, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-025', category: 'status', clientMessage: 'Cuántos días más faltan?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.82, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-026', category: 'status', clientMessage: 'El diseñador ya empezó?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.85, expectedResponseKey: 'status_in_design', isAmbiguous: false },
  { id: 'ST-027', category: 'status', clientMessage: 'Ya pasó por control de calidad?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.85, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-028', category: 'status', clientMessage: 'Están imprimiendo ya?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.82, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-029', category: 'status', clientMessage: 'El último pedido que hice, cómo va?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.85, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-030', category: 'status', clientMessage: 'La orden de los jerseys está lista?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.88, expectedResponseKey: 'status_in_production', extractedData: { productType: 'jerseys' }, isAmbiguous: false },
  { id: 'ST-031', category: 'status', clientMessage: 'Hola! Quería preguntar si ya está listo mi pedido de mangas', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.88, expectedResponseKey: 'status_in_production', extractedData: { productType: 'mangas' }, isAmbiguous: false },
  { id: 'ST-032', category: 'status', clientMessage: 'Todo bien con mi orden? No he recibido noticias', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.85, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-033', category: 'status', clientMessage: 'Me dijeron que iba a estar el viernes, ya estamos lunes', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.82, expectedResponseKey: 'status_in_production', isAmbiguous: false, notes: 'Posible queja implícita' },
  { id: 'ST-034', category: 'status', clientMessage: 'Aún nada?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.72, expectedResponseKey: 'clarification_order', isAmbiguous: true },
  { id: 'ST-035', category: 'status', clientMessage: 'Qué pasó con eso?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.70, expectedResponseKey: 'clarification_order', isAmbiguous: true },
  { id: 'ST-036', category: 'status', clientMessage: 'Ya lo mandaron a cortar?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.85, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-037', category: 'status', clientMessage: 'Buenas noches, disculpe la hora pero necesito saber de mi pedido 0045', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.92, expectedResponseKey: 'status_in_production', extractedData: { orderNumber: '0045' }, isAmbiguous: false },
  { id: 'ST-038', category: 'status', clientMessage: 'Hola, soy María del club ciclista, quería ver lo de nuestro pedido', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.85, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-039', category: 'status', clientMessage: 'Cuál es el estado actual de la orden?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.90, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-040', category: 'status', clientMessage: 'Quiero rastrear mi pedido', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.88, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-041', category: 'status', clientMessage: 'Van bien con mi orden?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.82, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-042', category: 'status', clientMessage: 'Ya empacaron?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.82, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-043', category: 'status', clientMessage: 'Cuánto falta para que terminen?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.85, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-044', category: 'status', clientMessage: 'Me puede llamar para contarme cómo va?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.78, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-045', category: 'status', clientMessage: 'Buenas! Vengo a preguntar por lo de mis gorras', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.85, expectedResponseKey: 'status_in_production', extractedData: { productType: 'gorras' }, isAmbiguous: false },
  { id: 'ST-046', category: 'status', clientMessage: 'Qué onda con mi encargo?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.82, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-047', category: 'status', clientMessage: 'Ya están listos los uniformes?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.88, expectedResponseKey: 'status_in_production', extractedData: { productType: 'uniformes' }, isAmbiguous: false },
  { id: 'ST-048', category: 'status', clientMessage: 'Les queda mucho?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.78, expectedResponseKey: 'status_in_production', isAmbiguous: true },
  { id: 'ST-049', category: 'status', clientMessage: 'Cómo van con los 50 jerseys?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.88, expectedResponseKey: 'status_in_production', extractedData: { productType: 'jerseys', quantity: 50 }, isAmbiguous: false },
  { id: 'ST-050', category: 'status', clientMessage: 'Buenos días! Solo paso a preguntar', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.72, expectedResponseKey: 'clarification_order', isAmbiguous: true },
  { id: 'ST-051', category: 'status', clientMessage: 'Hola, mi esposa me mandó a preguntar por el pedido', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.82, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-052', category: 'status', clientMessage: 'Disculpe la molestia, pero ya van 2 semanas', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.80, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-053', category: 'status', clientMessage: 'Para el evento del sábado van a estar?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.82, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-054', category: 'status', clientMessage: 'Info sobre pedido quince', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.88, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-055', category: 'status', clientMessage: 'Ya aprobaron el diseño que mandé?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.82, expectedResponseKey: 'status_in_design', isAmbiguous: false },
  { id: 'ST-056', category: 'status', clientMessage: 'Tienen tracking o algo así?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.78, expectedResponseKey: 'status_in_production', isAmbiguous: true },
  { id: 'ST-057', category: 'status', clientMessage: 'Estamos en qué etapa?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.85, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-058', category: 'status', clientMessage: 'Porfavor me informan cuando esté', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.78, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-059', category: 'status', clientMessage: 'La semana pasada me dijeron que ya casi estaba', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.80, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-060', category: 'status', clientMessage: 'El pedido de mi equipo ya salió de diseño?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.88, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-061', category: 'status', clientMessage: 'Recibieron la confirmación del diseño?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.82, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-062', category: 'status', clientMessage: 'Avance?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.72, expectedResponseKey: 'clarification_order', isAmbiguous: true },
  { id: 'ST-063', category: 'status', clientMessage: 'Update?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.70, expectedResponseKey: 'clarification_order', isAmbiguous: true },
  { id: 'ST-064', category: 'status', clientMessage: '???', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.50, expectedResponseKey: 'clarification_order', isAmbiguous: true },
  { id: 'ST-065', category: 'status', clientMessage: 'Ya casi?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.75, expectedResponseKey: 'status_in_production', isAmbiguous: true },
  { id: 'ST-066', category: 'status', clientMessage: 'Le recuerdo que tengo un pedido pendiente', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.85, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-067', category: 'status', clientMessage: 'Ya está en produccion o todavía en diseño?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.90, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-068', category: 'status', clientMessage: 'Se acuerdan de mi pedido verdad?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.78, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-069', category: 'status', clientMessage: 'Me preocupa que no me han dicho nada', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.80, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-070', category: 'status', clientMessage: 'Hola buenas tardes quería consultar mi pedido', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.85, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-071', category: 'status', clientMessage: 'Me pueden confirmar la fecha de entrega?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.88, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-072', category: 'status', clientMessage: 'Ya entraron las telas?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.78, expectedResponseKey: 'status_in_production', isAmbiguous: true },
  { id: 'ST-073', category: 'status', clientMessage: 'Diay y qué pasó?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.70, expectedResponseKey: 'clarification_order', isAmbiguous: true },
  { id: 'ST-074', category: 'status', clientMessage: 'Porfa díganme algo', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.72, expectedResponseKey: 'clarification_order', isAmbiguous: true },
  { id: 'ST-075', category: 'status', clientMessage: 'Cuándo está mi cosa?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.78, expectedResponseKey: 'status_in_production', isAmbiguous: true },
  { id: 'ST-076', category: 'status', clientMessage: 'Mi jefe quiere saber cuándo llegan los uniformes', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.88, expectedResponseKey: 'status_in_production', extractedData: { productType: 'uniformes' }, isAmbiguous: false },
  { id: 'ST-077', category: 'status', clientMessage: 'Vengo por tercera vez a preguntar', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.78, expectedResponseKey: 'status_in_production', isAmbiguous: false, notes: 'Frustración implícita' },
  { id: 'ST-078', category: 'status', clientMessage: 'Me puede dar una fecha estimada?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.85, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-079', category: 'status', clientMessage: 'Si me dan la orden mañana me sirve', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.75, expectedResponseKey: 'status_in_production', isAmbiguous: true },
  { id: 'ST-080', category: 'status', clientMessage: 'Los necesito para el torneo', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.78, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-081', category: 'status', clientMessage: 'En qué parte del proceso está?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.88, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-082', category: 'status', clientMessage: 'Va a llegar a tiempo?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.82, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-083', category: 'status', clientMessage: 'Se van a demorar mucho más?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.82, expectedResponseKey: 'status_in_production', isAmbiguous: false },
  { id: 'ST-084', category: 'status', clientMessage: 'No me han mandado ni el diseño', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.82, expectedResponseKey: 'status_in_design', isAmbiguous: false },
  { id: 'ST-085', category: 'status', clientMessage: 'Yo llamé ayer y me dijeron que hoy me avisaban', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.80, expectedResponseKey: 'status_in_production', isAmbiguous: false },
]

// ── NEW ORDERS (65 escenarios) ──────────────────────────────────────────────

const NEW_ORDER_SCENARIOS: ConversationTraining[] = [
  { id: 'NO-001', category: 'new_order', clientMessage: 'Necesito 30 mangas con mi logo', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.92, expectedResponseKey: 'new_order_confirm', extractedData: { quantity: 30, productType: 'mangas' }, isAmbiguous: false },
  { id: 'NO-002', category: 'new_order', clientMessage: 'Quiero encargar unas camisetas', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.88, expectedResponseKey: 'new_order_vague', extractedData: { productType: 'camisetas' }, isAmbiguous: false },
  { id: 'NO-003', category: 'new_order', clientMessage: 'Mae ocupo unas varas pa un evento el sábado', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.72, expectedResponseKey: 'new_order_vague', isAmbiguous: true },
  { id: 'NO-004', category: 'new_order', clientMessage: 'Cuánto me salen 100 mangas?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.88, expectedResponseKey: 'pricing_info', extractedData: { quantity: 100, productType: 'mangas' }, isAmbiguous: false },
  { id: 'NO-005', category: 'new_order', clientMessage: 'Hacen gorras?', expectedIntent: 'GENERAL_QUESTION', expectedConfidence: 0.78, expectedResponseKey: 'pricing_general', extractedData: { productType: 'gorras' }, isAmbiguous: false },
  { id: 'NO-006', category: 'new_order', clientMessage: 'Quiero lo mismo que la vez pasada pero en azul', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.82, expectedResponseKey: 'new_order_vague', isAmbiguous: true, notes: 'Requiere buscar historial del cliente' },
  { id: 'NO-007', category: 'new_order', clientMessage: 'Me puede hacer un jersey como el de la foto?', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.85, expectedResponseKey: 'new_order_need_files', extractedData: { productType: 'jersey' }, isAmbiguous: false },
  { id: 'NO-008', category: 'new_order', clientMessage: 'Necesito uniformes para mi equipo de fútbol', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.88, expectedResponseKey: 'new_order_vague', extractedData: { productType: 'uniformes' }, isAmbiguous: false },
  { id: 'NO-009', category: 'new_order', clientMessage: 'Quiero 50 camisetas con el logo de la empresa', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.92, expectedResponseKey: 'new_order_confirm', extractedData: { quantity: 50, productType: 'camisetas' }, isAmbiguous: false },
  { id: 'NO-010', category: 'new_order', clientMessage: 'Hola! Me recomendaron con ustedes, quiero hacer un pedido', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.82, expectedResponseKey: 'new_order_vague', isAmbiguous: false },
  { id: 'NO-011', category: 'new_order', clientMessage: 'Ocupo jerseys de ciclismo para mi equipo', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.88, expectedResponseKey: 'new_order_vague', extractedData: { productType: 'jerseys' }, isAmbiguous: false },
  { id: 'NO-012', category: 'new_order', clientMessage: 'Hagan me 20 gorras por favor', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.90, expectedResponseKey: 'new_order_confirm', extractedData: { quantity: 20, productType: 'gorras' }, isAmbiguous: false },
  { id: 'NO-013', category: 'new_order', clientMessage: 'Quisiera pedir mangas para running', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.88, expectedResponseKey: 'new_order_vague', extractedData: { productType: 'mangas' }, isAmbiguous: false },
  { id: 'NO-014', category: 'new_order', clientMessage: 'Me interesa un pedido de shorts', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.85, expectedResponseKey: 'new_order_vague', extractedData: { productType: 'shorts' }, isAmbiguous: false },
  { id: 'NO-015', category: 'new_order', clientMessage: 'Necesito ropa para un triatlón', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.82, expectedResponseKey: 'new_order_vague', isAmbiguous: true },
  { id: 'NO-016', category: 'new_order', clientMessage: 'Voy a necesitar como 200 camisetas para una carrera', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.90, expectedResponseKey: 'new_order_confirm', extractedData: { quantity: 200, productType: 'camisetas' }, isAmbiguous: false },
  { id: 'NO-017', category: 'new_order', clientMessage: 'Me cotiza unos jerseys?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.85, expectedResponseKey: 'pricing_info', extractedData: { productType: 'jerseys' }, isAmbiguous: false },
  { id: 'NO-018', category: 'new_order', clientMessage: 'Quiero hacer otro pedido igual al anterior', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.82, expectedResponseKey: 'new_order_vague', isAmbiguous: true },
  { id: 'NO-019', category: 'new_order', clientMessage: 'Hacen ropa de natación?', expectedIntent: 'GENERAL_QUESTION', expectedConfidence: 0.78, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'NO-020', category: 'new_order', clientMessage: 'Quiero algo para el equipo de crossfit', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.80, expectedResponseKey: 'new_order_vague', isAmbiguous: true },
  { id: 'NO-021', category: 'new_order', clientMessage: 'Ocupo 15 jerseys para la liga barrial', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.92, expectedResponseKey: 'new_order_confirm', extractedData: { quantity: 15, productType: 'jerseys' }, isAmbiguous: false },
  { id: 'NO-022', category: 'new_order', clientMessage: 'Tienen para hacer chalecos reflectivos?', expectedIntent: 'GENERAL_QUESTION', expectedConfidence: 0.78, expectedResponseKey: 'pricing_general', extractedData: { productType: 'chalecos' }, isAmbiguous: false },
  { id: 'NO-023', category: 'new_order', clientMessage: 'Buenas, soy de la empresa XYZ, queremos uniformes deportivos', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.85, expectedResponseKey: 'new_order_vague', extractedData: { productType: 'uniformes' }, isAmbiguous: false },
  { id: 'NO-024', category: 'new_order', clientMessage: 'Quiero encargar tops deportivos', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.88, expectedResponseKey: 'new_order_vague', extractedData: { productType: 'tops' }, isAmbiguous: false },
  { id: 'NO-025', category: 'new_order', clientMessage: 'Necesito 10 licras con logo', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.92, expectedResponseKey: 'new_order_confirm', extractedData: { quantity: 10, productType: 'licras' }, isAmbiguous: false },
  { id: 'NO-026', category: 'new_order', clientMessage: 'Hola quiero cotizar unas varas', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.72, expectedResponseKey: 'new_order_vague', isAmbiguous: true },
  { id: 'NO-027', category: 'new_order', clientMessage: 'Me hacen sudaderas?', expectedIntent: 'GENERAL_QUESTION', expectedConfidence: 0.78, expectedResponseKey: 'pricing_general', extractedData: { productType: 'sudaderas' }, isAmbiguous: false },
  { id: 'NO-028', category: 'new_order', clientMessage: 'Necesito 100 playeras para un evento corporativo', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.92, expectedResponseKey: 'new_order_confirm', extractedData: { quantity: 100, productType: 'playeras' }, isAmbiguous: false },
  { id: 'NO-029', category: 'new_order', clientMessage: 'Yo quiero unas como las del catálogo', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.78, expectedResponseKey: 'new_order_vague', isAmbiguous: true },
  { id: 'NO-030', category: 'new_order', clientMessage: 'Les mando el diseño para que lo vean', expectedIntent: 'FILE_SENT', expectedConfidence: 0.78, expectedResponseKey: 'file_received', isAmbiguous: false },
  { id: 'NO-031', category: 'new_order', clientMessage: 'Quiero un jersey igual al de este equipo', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.82, expectedResponseKey: 'new_order_need_files', extractedData: { productType: 'jersey' }, isAmbiguous: false },
  { id: 'NO-032', category: 'new_order', clientMessage: 'Para cuántas personas me sale pedido mínimo?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.82, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'NO-033', category: 'new_order', clientMessage: 'Hacen todo tipo de ropa o solo jerseys?', expectedIntent: 'GENERAL_QUESTION', expectedConfidence: 0.80, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'NO-034', category: 'new_order', clientMessage: 'Necesito algo urgente para el fin de semana', expectedIntent: 'URGENT_REQUEST', expectedConfidence: 0.85, expectedResponseKey: 'urgent_ack', extractedData: { urgency: 'urgent' }, isAmbiguous: false },
  { id: 'NO-035', category: 'new_order', clientMessage: 'Quiero mangas y gorras', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.85, expectedResponseKey: 'new_order_vague', extractedData: { productType: 'mangas' }, isAmbiguous: false },
  { id: 'NO-036', category: 'new_order', clientMessage: 'Les paso mi logo para que empiecen', expectedIntent: 'FILE_SENT', expectedConfidence: 0.78, expectedResponseKey: 'file_received', isAmbiguous: false },
  { id: 'NO-037', category: 'new_order', clientMessage: 'Cuánto dura hacer un pedido de 30 jerseys?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.82, expectedResponseKey: 'pricing_info', extractedData: { quantity: 30, productType: 'jerseys' }, isAmbiguous: false },
  { id: 'NO-038', category: 'new_order', clientMessage: 'Aceptan pedidos de una sola unidad?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.78, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'NO-039', category: 'new_order', clientMessage: 'Quiero pedir 5 mangas personalizadas', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.92, expectedResponseKey: 'new_order_confirm', extractedData: { quantity: 5, productType: 'mangas' }, isAmbiguous: false },
  { id: 'NO-040', category: 'new_order', clientMessage: 'Hola me dijeron que hacen sublimación', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.72, expectedResponseKey: 'new_order_vague', isAmbiguous: true },
  { id: 'NO-041', category: 'new_order', clientMessage: 'Somos un equipo de 25 y ocupamos uniforme completo', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.88, expectedResponseKey: 'new_order_confirm', extractedData: { quantity: 25, productType: 'uniforme' }, isAmbiguous: false },
  { id: 'NO-042', category: 'new_order', clientMessage: 'Quiero pedir para mi empresa', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.82, expectedResponseKey: 'new_order_vague', isAmbiguous: false },
  { id: 'NO-043', category: 'new_order', clientMessage: 'Ocupo algo para una carrera de bicicleta', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.78, expectedResponseKey: 'new_order_vague', isAmbiguous: true },
  { id: 'NO-044', category: 'new_order', clientMessage: 'Le mando las tallas por WhatsApp', expectedIntent: 'FILE_SENT', expectedConfidence: 0.72, expectedResponseKey: 'file_received', isAmbiguous: true },
  { id: 'NO-045', category: 'new_order', clientMessage: 'Necesitamos 40 jerseys de ciclismo full sublimación', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.92, expectedResponseKey: 'new_order_confirm', extractedData: { quantity: 40, productType: 'jerseys' }, isAmbiguous: false },
  { id: 'NO-046', category: 'new_order', clientMessage: 'Quiero hacer un pedido grande', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.82, expectedResponseKey: 'new_order_vague', isAmbiguous: false },
  { id: 'NO-047', category: 'new_order', clientMessage: 'Pueden hacer diseño personalizado?', expectedIntent: 'GENERAL_QUESTION', expectedConfidence: 0.78, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'NO-048', category: 'new_order', clientMessage: 'Necesito ropa para mi gimnasio', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.82, expectedResponseKey: 'new_order_vague', isAmbiguous: false },
  { id: 'NO-049', category: 'new_order', clientMessage: 'Hola buenas, quisiera ver lo de unos jerseys para nuestro club', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.85, expectedResponseKey: 'new_order_vague', extractedData: { productType: 'jerseys' }, isAmbiguous: false },
  { id: 'NO-050', category: 'new_order', clientMessage: 'Me hace un presupuesto para 60 camisetas?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.88, expectedResponseKey: 'pricing_info', extractedData: { quantity: 60, productType: 'camisetas' }, isAmbiguous: false },
  { id: 'NO-051', category: 'new_order', clientMessage: 'Ocupo 12 mangas iguales con diferente nombre', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.92, expectedResponseKey: 'new_order_confirm', extractedData: { quantity: 12, productType: 'mangas' }, isAmbiguous: false },
  { id: 'NO-052', category: 'new_order', clientMessage: 'Hacen envío a Guanacaste? Quiero hacer un pedido', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.82, expectedResponseKey: 'new_order_vague', isAmbiguous: false },
  { id: 'NO-053', category: 'new_order', clientMessage: 'Me interesan las mangas de running que vi en Instagram', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.82, expectedResponseKey: 'new_order_vague', extractedData: { productType: 'mangas' }, isAmbiguous: false },
  { id: 'NO-054', category: 'new_order', clientMessage: 'Un amigo me recomendó, quiero hacer un pedido', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.82, expectedResponseKey: 'new_order_vague', isAmbiguous: false },
  { id: 'NO-055', category: 'new_order', clientMessage: 'Para un equipo de 8 personas, qué me ofrecen?', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.80, expectedResponseKey: 'new_order_vague', extractedData: { quantity: 8 }, isAmbiguous: false },
  { id: 'NO-056', category: 'new_order', clientMessage: 'Quiero algo bonito para mi equipo de trail', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.78, expectedResponseKey: 'new_order_vague', isAmbiguous: true },
  { id: 'NO-057', category: 'new_order', clientMessage: 'Dame 3 mangas talla M', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.90, expectedResponseKey: 'new_order_confirm', extractedData: { quantity: 3, productType: 'mangas' }, isAmbiguous: false },
  { id: 'NO-058', category: 'new_order', clientMessage: 'Pueden sublimar en algodón?', expectedIntent: 'GENERAL_QUESTION', expectedConfidence: 0.78, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'NO-059', category: 'new_order', clientMessage: 'Tienen material dry-fit?', expectedIntent: 'GENERAL_QUESTION', expectedConfidence: 0.78, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'NO-060', category: 'new_order', clientMessage: 'Hola necesito 75 jerseys para una liga', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.92, expectedResponseKey: 'new_order_confirm', extractedData: { quantity: 75, productType: 'jerseys' }, isAmbiguous: false },
  { id: 'NO-061', category: 'new_order', clientMessage: 'Me interesa pero primero necesito ver muestras', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.72, expectedResponseKey: 'new_order_vague', isAmbiguous: true },
  { id: 'NO-062', category: 'new_order', clientMessage: 'Yo ya tengo el diseño listo, solo necesito que lo impriman', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.85, expectedResponseKey: 'new_order_vague', isAmbiguous: false },
  { id: 'NO-063', category: 'new_order', clientMessage: 'Hacen bordado también?', expectedIntent: 'GENERAL_QUESTION', expectedConfidence: 0.78, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'NO-064', category: 'new_order', clientMessage: 'Buenas, quiero hacer una orden', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.85, expectedResponseKey: 'new_order_vague', isAmbiguous: false },
  { id: 'NO-065', category: 'new_order', clientMessage: 'Hola soy del equipo Volcano Runners, quiero pedir uniformes', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.88, expectedResponseKey: 'new_order_vague', extractedData: { productType: 'uniformes' }, isAmbiguous: false },
]

// ── DESIGN RESPONSES (62 escenarios) ────────────────────────────────────────

const DESIGN_SCENARIOS: ConversationTraining[] = [
  { id: 'DS-001', category: 'design', clientMessage: 'Me gusta!', expectedIntent: 'DESIGN_APPROVAL', expectedConfidence: 0.85, context: 'after design sent', expectedResponseKey: 'design_approved_ack', isAmbiguous: false },
  { id: 'DS-002', category: 'design', clientMessage: 'Aprobado', expectedIntent: 'DESIGN_APPROVAL', expectedConfidence: 0.95, context: 'after design sent', expectedResponseKey: 'design_approved_ack', isAmbiguous: false },
  { id: 'DS-003', category: 'design', clientMessage: 'Está tuanis', expectedIntent: 'DESIGN_APPROVAL', expectedConfidence: 0.82, context: 'after design sent', expectedResponseKey: 'design_approved_ack', isAmbiguous: false },
  { id: 'DS-004', category: 'design', clientMessage: '👍', expectedIntent: 'DESIGN_APPROVAL', expectedConfidence: 0.90, context: 'after design sent', expectedResponseKey: 'design_approved_ack', isAmbiguous: false },
  { id: 'DS-005', category: 'design', clientMessage: 'Dale', expectedIntent: 'DESIGN_APPROVAL', expectedConfidence: 0.82, context: 'after design sent', expectedResponseKey: 'design_approved_ack', isAmbiguous: false },
  { id: 'DS-006', category: 'design', clientMessage: 'Perfecto así', expectedIntent: 'DESIGN_APPROVAL', expectedConfidence: 0.92, context: 'after design sent', expectedResponseKey: 'design_approved_ack', isAmbiguous: false },
  { id: 'DS-007', category: 'design', clientMessage: 'No me gusta el color', expectedIntent: 'DESIGN_CHANGE_REQUEST', expectedConfidence: 0.88, context: 'after design sent', expectedResponseKey: 'design_revision_ack', isAmbiguous: false },
  { id: 'DS-008', category: 'design', clientMessage: 'Puede cambiar la letra?', expectedIntent: 'DESIGN_CHANGE_REQUEST', expectedConfidence: 0.88, context: 'after design sent', expectedResponseKey: 'design_revision_ack', isAmbiguous: false },
  { id: 'DS-009', category: 'design', clientMessage: 'Casi, pero el logo más grande', expectedIntent: 'DESIGN_CHANGE_REQUEST', expectedConfidence: 0.85, context: 'after design sent', expectedResponseKey: 'design_revision_ack', isAmbiguous: false },
  { id: 'DS-010', category: 'design', clientMessage: 'Diay no sé, como que no me convence', expectedIntent: 'DESIGN_CHANGE_REQUEST', expectedConfidence: 0.75, context: 'after design sent', expectedResponseKey: 'design_revision_ack', isAmbiguous: true },
  { id: 'DS-011', category: 'design', clientMessage: 'Mmm no era lo que esperaba', expectedIntent: 'DESIGN_CHANGE_REQUEST', expectedConfidence: 0.78, context: 'after design sent', expectedResponseKey: 'design_revision_ack', isAmbiguous: true },
  { id: 'DS-012', category: 'design', clientMessage: 'Pueden poner el logo al otro lado?', expectedIntent: 'DESIGN_CHANGE_REQUEST', expectedConfidence: 0.90, context: 'after design sent', expectedResponseKey: 'design_revision_ack', isAmbiguous: false },
  { id: 'DS-013', category: 'design', clientMessage: 'Sí, mándenlo a producción', expectedIntent: 'DESIGN_APPROVAL', expectedConfidence: 0.95, context: 'after design sent', expectedResponseKey: 'design_approved_ack', isAmbiguous: false },
  { id: 'DS-014', category: 'design', clientMessage: 'Así déjelo', expectedIntent: 'DESIGN_APPROVAL', expectedConfidence: 0.88, context: 'after design sent', expectedResponseKey: 'design_approved_ack', isAmbiguous: false },
  { id: 'DS-015', category: 'design', clientMessage: 'De una, está fino', expectedIntent: 'DESIGN_APPROVAL', expectedConfidence: 0.85, context: 'after design sent', expectedResponseKey: 'design_approved_ack', isAmbiguous: false },
  { id: 'DS-016', category: 'design', clientMessage: 'No no no, eso no es lo que pedí', expectedIntent: 'DESIGN_REJECTION', expectedConfidence: 0.92, context: 'after design sent', expectedResponseKey: 'design_rejected_ack', isAmbiguous: false },
  { id: 'DS-017', category: 'design', clientMessage: 'Está horrible', expectedIntent: 'DESIGN_REJECTION', expectedConfidence: 0.92, context: 'after design sent', expectedResponseKey: 'design_rejected_ack', isAmbiguous: false },
  { id: 'DS-018', category: 'design', clientMessage: 'No me cuadra', expectedIntent: 'DESIGN_CHANGE_REQUEST', expectedConfidence: 0.82, context: 'after design sent', expectedResponseKey: 'design_revision_ack', isAmbiguous: true },
  { id: 'DS-019', category: 'design', clientMessage: 'Le falta algo', expectedIntent: 'DESIGN_CHANGE_REQUEST', expectedConfidence: 0.80, context: 'after design sent', expectedResponseKey: 'design_revision_ack', isAmbiguous: true },
  { id: 'DS-020', category: 'design', clientMessage: 'Quiero otro color de fondo', expectedIntent: 'DESIGN_CHANGE_REQUEST', expectedConfidence: 0.90, context: 'after design sent', expectedResponseKey: 'design_revision_ack', isAmbiguous: false },
  { id: 'DS-021', category: 'design', clientMessage: 'Excelente! Me encanta!', expectedIntent: 'DESIGN_APPROVAL', expectedConfidence: 0.95, context: 'after design sent', expectedResponseKey: 'design_approved_ack', isAmbiguous: false },
  { id: 'DS-022', category: 'design', clientMessage: 'Va va, jale', expectedIntent: 'DESIGN_APPROVAL', expectedConfidence: 0.82, context: 'after design sent', expectedResponseKey: 'design_approved_ack', isAmbiguous: false },
  { id: 'DS-023', category: 'design', clientMessage: 'Está bonito pero la fuente no me gusta', expectedIntent: 'DESIGN_CHANGE_REQUEST', expectedConfidence: 0.85, context: 'after design sent', expectedResponseKey: 'design_revision_ack', isAmbiguous: false },
  { id: 'DS-024', category: 'design', clientMessage: 'Más oscuro el azul', expectedIntent: 'DESIGN_CHANGE_REQUEST', expectedConfidence: 0.88, context: 'after design sent', expectedResponseKey: 'design_revision_ack', isAmbiguous: false },
  { id: 'DS-025', category: 'design', clientMessage: 'Listo, aprobado, mándenlo', expectedIntent: 'DESIGN_APPROVAL', expectedConfidence: 0.95, context: 'after design sent', expectedResponseKey: 'design_approved_ack', isAmbiguous: false },
  { id: 'DS-026', category: 'design', clientMessage: 'Ok', expectedIntent: 'DESIGN_APPROVAL', expectedConfidence: 0.80, context: 'after design sent', expectedResponseKey: 'design_approved_ack', isAmbiguous: true, notes: 'Ambiguo sin contexto, claro después de diseño' },
  { id: 'DS-027', category: 'design', clientMessage: 'Si', expectedIntent: 'DESIGN_APPROVAL', expectedConfidence: 0.80, context: 'after design sent', expectedResponseKey: 'design_approved_ack', isAmbiguous: true },
  { id: 'DS-028', category: 'design', clientMessage: 'No', expectedIntent: 'DESIGN_REJECTION', expectedConfidence: 0.82, context: 'after design sent', expectedResponseKey: 'design_rejected_ack', isAmbiguous: false },
  { id: 'DS-029', category: 'design', clientMessage: 'Le voy a preguntar a mi socio', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.60, context: 'after design sent', expectedResponseKey: 'clarification_design', isAmbiguous: true, notes: 'Necesita tiempo' },
  { id: 'DS-030', category: 'design', clientMessage: 'Déjeme pensarlo', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.55, context: 'after design sent', expectedResponseKey: 'clarification_design', isAmbiguous: true },
  { id: 'DS-031', category: 'design', clientMessage: 'Qué colores tienen disponibles?', expectedIntent: 'GENERAL_QUESTION', expectedConfidence: 0.78, context: 'after design sent', expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'DS-032', category: 'design', clientMessage: 'Mi esposa dice que está bien', expectedIntent: 'DESIGN_APPROVAL', expectedConfidence: 0.82, context: 'after design sent', expectedResponseKey: 'design_approved_ack', isAmbiguous: false },
  { id: 'DS-033', category: 'design', clientMessage: 'El equipo dice que sí', expectedIntent: 'DESIGN_APPROVAL', expectedConfidence: 0.85, context: 'after design sent', expectedResponseKey: 'design_approved_ack', isAmbiguous: false },
  { id: 'DS-034', category: 'design', clientMessage: 'El número 7 se ve mal', expectedIntent: 'DESIGN_CHANGE_REQUEST', expectedConfidence: 0.85, context: 'after design sent', expectedResponseKey: 'design_revision_ack', isAmbiguous: false },
  { id: 'DS-035', category: 'design', clientMessage: 'Las mangas se ven diferentes en la foto', expectedIntent: 'DESIGN_CHANGE_REQUEST', expectedConfidence: 0.82, context: 'after design sent', expectedResponseKey: 'design_revision_ack', isAmbiguous: false },
  { id: 'DS-036', category: 'design', clientMessage: '❤️', expectedIntent: 'DESIGN_APPROVAL', expectedConfidence: 0.80, context: 'after design sent', expectedResponseKey: 'design_approved_ack', isAmbiguous: false },
  { id: 'DS-037', category: 'design', clientMessage: '✅', expectedIntent: 'DESIGN_APPROVAL', expectedConfidence: 0.92, context: 'after design sent', expectedResponseKey: 'design_approved_ack', isAmbiguous: false },
  { id: 'DS-038', category: 'design', clientMessage: 'Puede agregar un patrocinador atrás?', expectedIntent: 'DESIGN_CHANGE_REQUEST', expectedConfidence: 0.88, context: 'after design sent', expectedResponseKey: 'design_revision_ack', isAmbiguous: false },
  { id: 'DS-039', category: 'design', clientMessage: 'Los colores no son los que pedí', expectedIntent: 'DESIGN_CHANGE_REQUEST', expectedConfidence: 0.88, context: 'after design sent', expectedResponseKey: 'design_revision_ack', isAmbiguous: false },
  { id: 'DS-040', category: 'design', clientMessage: 'Todo se ve bien excepto el nombre', expectedIntent: 'DESIGN_CHANGE_REQUEST', expectedConfidence: 0.85, context: 'after design sent', expectedResponseKey: 'design_revision_ack', isAmbiguous: false },
  { id: 'DS-041', category: 'design', clientMessage: 'Genial!', expectedIntent: 'DESIGN_APPROVAL', expectedConfidence: 0.88, context: 'after design sent', expectedResponseKey: 'design_approved_ack', isAmbiguous: false },
  { id: 'DS-042', category: 'design', clientMessage: 'WOW quedó increíble!', expectedIntent: 'DESIGN_APPROVAL', expectedConfidence: 0.92, context: 'after design sent', expectedResponseKey: 'design_approved_ack', isAmbiguous: false },
  { id: 'DS-043', category: 'design', clientMessage: 'Uy mae eso no se parece a lo que hablamos', expectedIntent: 'DESIGN_REJECTION', expectedConfidence: 0.88, context: 'after design sent', expectedResponseKey: 'design_rejected_ack', isAmbiguous: false },
  { id: 'DS-044', category: 'design', clientMessage: 'Puedo verlo en otra talla?', expectedIntent: 'DESIGN_CHANGE_REQUEST', expectedConfidence: 0.72, context: 'after design sent', expectedResponseKey: 'design_revision_ack', isAmbiguous: true },
  { id: 'DS-045', category: 'design', clientMessage: 'Me gusta pero no me convence el logo', expectedIntent: 'DESIGN_CHANGE_REQUEST', expectedConfidence: 0.85, context: 'after design sent', expectedResponseKey: 'design_revision_ack', isAmbiguous: false },
  { id: 'DS-046', category: 'design', clientMessage: 'Pura vida! Queda perfecto!', expectedIntent: 'DESIGN_APPROVAL', expectedConfidence: 0.92, context: 'after design sent', expectedResponseKey: 'design_approved_ack', isAmbiguous: false },
  { id: 'DS-047', category: 'design', clientMessage: 'Así mismito', expectedIntent: 'DESIGN_APPROVAL', expectedConfidence: 0.88, context: 'after design sent', expectedResponseKey: 'design_approved_ack', isAmbiguous: false },
  { id: 'DS-048', category: 'design', clientMessage: 'Mmm no sé', expectedIntent: 'DESIGN_CHANGE_REQUEST', expectedConfidence: 0.60, context: 'after design sent', expectedResponseKey: 'design_revision_ack', isAmbiguous: true },
  { id: 'DS-049', category: 'design', clientMessage: 'Ahí se lo reenvío a mis compañeros para que opinen', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.55, context: 'after design sent', expectedResponseKey: 'clarification_design', isAmbiguous: true },
  { id: 'DS-050', category: 'design', clientMessage: 'Se puede hacer con cuello en V en vez de redondo?', expectedIntent: 'DESIGN_CHANGE_REQUEST', expectedConfidence: 0.88, context: 'after design sent', expectedResponseKey: 'design_revision_ack', isAmbiguous: false },
  { id: 'DS-051', category: 'design', clientMessage: 'Lo apruebo con esos cambios', expectedIntent: 'DESIGN_APPROVAL', expectedConfidence: 0.90, context: 'after design sent', expectedResponseKey: 'design_approved_ack', isAmbiguous: false },
  { id: 'DS-052', category: 'design', clientMessage: 'Bien', expectedIntent: 'DESIGN_APPROVAL', expectedConfidence: 0.78, context: 'after design sent', expectedResponseKey: 'design_approved_ack', isAmbiguous: true },
  { id: 'DS-053', category: 'design', clientMessage: 'Lo vi con mi equipo y todos dicen que sí', expectedIntent: 'DESIGN_APPROVAL', expectedConfidence: 0.90, context: 'after design sent', expectedResponseKey: 'design_approved_ack', isAmbiguous: false },
  { id: 'DS-054', category: 'design', clientMessage: 'Puede ser negro en vez de azul?', expectedIntent: 'DESIGN_CHANGE_REQUEST', expectedConfidence: 0.88, context: 'after design sent', expectedResponseKey: 'design_revision_ack', isAmbiguous: false },
  { id: 'DS-055', category: 'design', clientMessage: 'Está bueno pero quiero verlo sin el borde', expectedIntent: 'DESIGN_CHANGE_REQUEST', expectedConfidence: 0.85, context: 'after design sent', expectedResponseKey: 'design_revision_ack', isAmbiguous: false },
  { id: 'DS-056', category: 'design', clientMessage: 'Aprobadísimo!', expectedIntent: 'DESIGN_APPROVAL', expectedConfidence: 0.95, context: 'after design sent', expectedResponseKey: 'design_approved_ack', isAmbiguous: false },
  { id: 'DS-057', category: 'design', clientMessage: 'Nada que ver con lo que pedí', expectedIntent: 'DESIGN_REJECTION', expectedConfidence: 0.92, context: 'after design sent', expectedResponseKey: 'design_rejected_ack', isAmbiguous: false },
  { id: 'DS-058', category: 'design', clientMessage: 'Necesito verlo en persona para decidir', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.55, context: 'after design sent', expectedResponseKey: 'clarification_design', isAmbiguous: true },
  { id: 'DS-059', category: 'design', clientMessage: 'Me parece bien, procedan', expectedIntent: 'DESIGN_APPROVAL', expectedConfidence: 0.92, context: 'after design sent', expectedResponseKey: 'design_approved_ack', isAmbiguous: false },
  { id: 'DS-060', category: 'design', clientMessage: 'Les queda mejor que lo esperado', expectedIntent: 'DESIGN_APPROVAL', expectedConfidence: 0.88, context: 'after design sent', expectedResponseKey: 'design_approved_ack', isAmbiguous: false },
  { id: 'DS-061', category: 'design', clientMessage: 'Pueden hacer una opción B?', expectedIntent: 'DESIGN_CHANGE_REQUEST', expectedConfidence: 0.85, context: 'after design sent', expectedResponseKey: 'design_revision_ack', isAmbiguous: false },
  { id: 'DS-062', category: 'design', clientMessage: 'No queda', expectedIntent: 'DESIGN_REJECTION', expectedConfidence: 0.85, context: 'after design sent', expectedResponseKey: 'design_rejected_ack', isAmbiguous: false },
]

// ── COMPLAINTS (52 escenarios) ──────────────────────────────────────────────

const COMPLAINT_SCENARIOS: ConversationTraining[] = [
  { id: 'CM-001', category: 'complaint', clientMessage: 'Esto no es lo que pedí', expectedIntent: 'COMPLAINT', expectedConfidence: 0.90, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'CM-002', category: 'complaint', clientMessage: 'El color está mal', expectedIntent: 'COMPLAINT', expectedConfidence: 0.88, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'CM-003', category: 'complaint', clientMessage: 'Se le está despegando', expectedIntent: 'COMPLAINT', expectedConfidence: 0.90, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'CM-004', category: 'complaint', clientMessage: 'Me mandaron la talla equivocada', expectedIntent: 'COMPLAINT', expectedConfidence: 0.92, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'CM-005', category: 'complaint', clientMessage: 'Esto es una porquería', expectedIntent: 'COMPLAINT', expectedConfidence: 0.92, expectedResponseKey: 'escalation_angry', extractedData: { sentiment: 'angry' }, isAmbiguous: false },
  { id: 'CM-006', category: 'complaint', clientMessage: 'Ya van dos veces que me hacen esperar', expectedIntent: 'COMPLAINT', expectedConfidence: 0.85, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'CM-007', category: 'complaint', clientMessage: 'Quiero mi dinero de vuelta', expectedIntent: 'COMPLAINT', expectedConfidence: 0.90, expectedResponseKey: 'escalation_angry', isAmbiguous: false },
  { id: 'CM-008', category: 'complaint', clientMessage: 'La impresión se lavó', expectedIntent: 'COMPLAINT', expectedConfidence: 0.90, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'CM-009', category: 'complaint', clientMessage: 'Las costuras están mal hechas', expectedIntent: 'COMPLAINT', expectedConfidence: 0.90, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'CM-010', category: 'complaint', clientMessage: 'El logo salió borroso', expectedIntent: 'COMPLAINT', expectedConfidence: 0.90, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'CM-011', category: 'complaint', clientMessage: 'Me prometieron 10 días y ya llevo 3 semanas', expectedIntent: 'COMPLAINT', expectedConfidence: 0.88, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'CM-012', category: 'complaint', clientMessage: 'La tela se rompió a la primera lavada', expectedIntent: 'COMPLAINT', expectedConfidence: 0.92, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'CM-013', category: 'complaint', clientMessage: 'Voy a poner una queja en redes sociales', expectedIntent: 'COMPLAINT', expectedConfidence: 0.92, expectedResponseKey: 'escalation_angry', extractedData: { sentiment: 'angry' }, isAmbiguous: false },
  { id: 'CM-014', category: 'complaint', clientMessage: 'Esto es inaceptable', expectedIntent: 'COMPLAINT', expectedConfidence: 0.92, expectedResponseKey: 'escalation_angry', extractedData: { sentiment: 'angry' }, isAmbiguous: false },
  { id: 'CM-015', category: 'complaint', clientMessage: 'Le mandé fotos del problema', expectedIntent: 'COMPLAINT', expectedConfidence: 0.82, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'CM-016', category: 'complaint', clientMessage: 'No quedé satisfecho', expectedIntent: 'COMPLAINT', expectedConfidence: 0.85, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'CM-017', category: 'complaint', clientMessage: 'El diseño no es el que aprobé', expectedIntent: 'COMPLAINT', expectedConfidence: 0.92, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'CM-018', category: 'complaint', clientMessage: 'Son unos irresponsables', expectedIntent: 'COMPLAINT', expectedConfidence: 0.92, expectedResponseKey: 'escalation_angry', extractedData: { sentiment: 'angry' }, isAmbiguous: false },
  { id: 'CM-019', category: 'complaint', clientMessage: 'Quiero hablar con el dueño', expectedIntent: 'COMPLAINT', expectedConfidence: 0.85, expectedResponseKey: 'escalation_request', isAmbiguous: false, notes: 'Escalar a humano' },
  { id: 'CM-020', category: 'complaint', clientMessage: 'Nunca más les pido nada', expectedIntent: 'COMPLAINT', expectedConfidence: 0.88, expectedResponseKey: 'complaint_ack', extractedData: { sentiment: 'angry' }, isAmbiguous: false },
  { id: 'CM-021', category: 'complaint', clientMessage: 'La calidad es pésima', expectedIntent: 'COMPLAINT', expectedConfidence: 0.92, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'CM-022', category: 'complaint', clientMessage: 'Vino manchado', expectedIntent: 'COMPLAINT', expectedConfidence: 0.90, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'CM-023', category: 'complaint', clientMessage: 'Los nombres están al revés', expectedIntent: 'COMPLAINT', expectedConfidence: 0.92, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'CM-024', category: 'complaint', clientMessage: 'Le falta un jersey al pedido', expectedIntent: 'COMPLAINT', expectedConfidence: 0.88, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'CM-025', category: 'complaint', clientMessage: 'No vuelvo a comprar aquí', expectedIntent: 'COMPLAINT', expectedConfidence: 0.88, expectedResponseKey: 'escalation_angry', extractedData: { sentiment: 'angry' }, isAmbiguous: false },
  { id: 'CM-026', category: 'complaint', clientMessage: 'Quiero una reposición', expectedIntent: 'COMPLAINT', expectedConfidence: 0.85, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'CM-027', category: 'complaint', clientMessage: 'Esto no vale lo que pagué', expectedIntent: 'COMPLAINT', expectedConfidence: 0.88, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'CM-028', category: 'complaint', clientMessage: 'La sublimación se ve pixelada', expectedIntent: 'COMPLAINT', expectedConfidence: 0.90, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'CM-029', category: 'complaint', clientMessage: 'El corte está chueco', expectedIntent: 'COMPLAINT', expectedConfidence: 0.90, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'CM-030', category: 'complaint', clientMessage: 'No tiene la etiqueta que pedí', expectedIntent: 'COMPLAINT', expectedConfidence: 0.88, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'CM-031', category: 'complaint', clientMessage: 'Huele raro la tela', expectedIntent: 'COMPLAINT', expectedConfidence: 0.82, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'CM-032', category: 'complaint', clientMessage: 'El zipper se atora', expectedIntent: 'COMPLAINT', expectedConfidence: 0.88, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'CM-033', category: 'complaint', clientMessage: 'Deberían tener más cuidado', expectedIntent: 'COMPLAINT', expectedConfidence: 0.82, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'CM-034', category: 'complaint', clientMessage: 'Tengo fotos de cómo llegó', expectedIntent: 'COMPLAINT', expectedConfidence: 0.78, expectedResponseKey: 'complaint_ack', isAmbiguous: true },
  { id: 'CM-035', category: 'complaint', clientMessage: 'Es que a mi me dijeron una cosa y salió otra', expectedIntent: 'COMPLAINT', expectedConfidence: 0.85, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'CM-036', category: 'complaint', clientMessage: 'Necesito que lo arreglen o devuelvan la plata', expectedIntent: 'COMPLAINT', expectedConfidence: 0.90, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'CM-037', category: 'complaint', clientMessage: 'Uy mae qué fue eso?? Cómo me mandan eso así', expectedIntent: 'COMPLAINT', expectedConfidence: 0.88, expectedResponseKey: 'complaint_ack', extractedData: { sentiment: 'angry' }, isAmbiguous: false },
  { id: 'CM-038', category: 'complaint', clientMessage: 'La talla M parece S', expectedIntent: 'COMPLAINT', expectedConfidence: 0.88, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'CM-039', category: 'complaint', clientMessage: 'Se destiñó al primer lavado', expectedIntent: 'COMPLAINT', expectedConfidence: 0.92, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'CM-040', category: 'complaint', clientMessage: 'Pedí 20 y solo llegaron 18', expectedIntent: 'COMPLAINT', expectedConfidence: 0.90, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'CM-041', category: 'complaint', clientMessage: 'Quiero soluciones no excusas', expectedIntent: 'COMPLAINT', expectedConfidence: 0.88, expectedResponseKey: 'escalation_angry', extractedData: { sentiment: 'angry' }, isAmbiguous: false },
  { id: 'CM-042', category: 'complaint', clientMessage: 'En otro lugar me hubieran solucionado más rápido', expectedIntent: 'COMPLAINT', expectedConfidence: 0.82, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'CM-043', category: 'complaint', clientMessage: 'Llevo 3 días llamando y nadie me contesta', expectedIntent: 'COMPLAINT', expectedConfidence: 0.88, expectedResponseKey: 'escalation_angry', extractedData: { sentiment: 'angry' }, isAmbiguous: false },
  { id: 'CM-044', category: 'complaint', clientMessage: 'Decepcionante', expectedIntent: 'COMPLAINT', expectedConfidence: 0.82, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'CM-045', category: 'complaint', clientMessage: 'El envío llegó todo arrugado', expectedIntent: 'COMPLAINT', expectedConfidence: 0.88, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'CM-046', category: 'complaint', clientMessage: 'Hay un hilo suelto en la costura', expectedIntent: 'COMPLAINT', expectedConfidence: 0.85, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'CM-047', category: 'complaint', clientMessage: 'No me gusta cómo quedó', expectedIntent: 'COMPLAINT', expectedConfidence: 0.85, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'CM-048', category: 'complaint', clientMessage: 'Vinieron con talla equivocada 3 de las 10', expectedIntent: 'COMPLAINT', expectedConfidence: 0.90, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'CM-049', category: 'complaint', clientMessage: 'Me siento estafado', expectedIntent: 'COMPLAINT', expectedConfidence: 0.92, expectedResponseKey: 'escalation_angry', extractedData: { sentiment: 'angry' }, isAmbiguous: false },
  { id: 'CM-050', category: 'complaint', clientMessage: 'El producto no se ve como en el diseño', expectedIntent: 'COMPLAINT', expectedConfidence: 0.88, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'CM-051', category: 'complaint', clientMessage: 'Necesito hablar con alguien', expectedIntent: 'COMPLAINT', expectedConfidence: 0.78, expectedResponseKey: 'escalation_request', isAmbiguous: true },
  { id: 'CM-052', category: 'complaint', clientMessage: 'Esto no cumple con lo acordado', expectedIntent: 'COMPLAINT', expectedConfidence: 0.90, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
]

// ── PAYMENT (42 escenarios) ─────────────────────────────────────────────────

const PAYMENT_SCENARIOS: ConversationTraining[] = [
  { id: 'PY-001', category: 'payment', clientMessage: 'Ya le deposité', expectedIntent: 'PAYMENT_CONFIRMATION', expectedConfidence: 0.90, expectedResponseKey: 'payment_need_confirmation', isAmbiguous: false },
  { id: 'PY-002', category: 'payment', clientMessage: 'Acabo de hacer el SINPE', expectedIntent: 'PAYMENT_CONFIRMATION', expectedConfidence: 0.92, expectedResponseKey: 'payment_need_confirmation', extractedData: { paymentMethod: 'SINPE' }, isAmbiguous: false },
  { id: 'PY-003', category: 'payment', clientMessage: 'Le paso el comprobante', expectedIntent: 'PAYMENT_CONFIRMATION', expectedConfidence: 0.88, expectedResponseKey: 'payment_need_confirmation', isAmbiguous: false },
  { id: 'PY-004', category: 'payment', clientMessage: 'Cuánto debo?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.85, expectedResponseKey: 'payment_pending', isAmbiguous: false },
  { id: 'PY-005', category: 'payment', clientMessage: 'Aceptan tarjeta?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.78, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'PY-006', category: 'payment', clientMessage: 'Les puedo pagar la mitad?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.78, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'PY-007', category: 'payment', clientMessage: 'Cuándo tengo que pagar?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.82, expectedResponseKey: 'payment_pending', isAmbiguous: false },
  { id: 'PY-008', category: 'payment', clientMessage: 'Ya hice la transferencia', expectedIntent: 'PAYMENT_CONFIRMATION', expectedConfidence: 0.90, expectedResponseKey: 'payment_need_confirmation', extractedData: { paymentMethod: 'transferencia' }, isAmbiguous: false },
  { id: 'PY-009', category: 'payment', clientMessage: 'Ahí va el comprobante de SINPE', expectedIntent: 'PAYMENT_CONFIRMATION', expectedConfidence: 0.92, expectedResponseKey: 'payment_need_confirmation', extractedData: { paymentMethod: 'SINPE' }, isAmbiguous: false },
  { id: 'PY-010', category: 'payment', clientMessage: 'Pagué en efectivo en la tienda', expectedIntent: 'PAYMENT_CONFIRMATION', expectedConfidence: 0.88, expectedResponseKey: 'payment_need_confirmation', extractedData: { paymentMethod: 'efectivo' }, isAmbiguous: false },
  { id: 'PY-011', category: 'payment', clientMessage: 'Me pasan el número de SINPE?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.82, expectedResponseKey: 'payment_pending', isAmbiguous: false },
  { id: 'PY-012', category: 'payment', clientMessage: 'Ya cancelé', expectedIntent: 'PAYMENT_CONFIRMATION', expectedConfidence: 0.85, expectedResponseKey: 'payment_need_confirmation', isAmbiguous: true, notes: 'Puede ser cancelar pedido o cancelar deuda' },
  { id: 'PY-013', category: 'payment', clientMessage: 'Cuánto es el total con IVA?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.88, expectedResponseKey: 'payment_pending', isAmbiguous: false },
  { id: 'PY-014', category: 'payment', clientMessage: 'Les deposité ayer', expectedIntent: 'PAYMENT_CONFIRMATION', expectedConfidence: 0.88, expectedResponseKey: 'payment_need_confirmation', isAmbiguous: false },
  { id: 'PY-015', category: 'payment', clientMessage: 'Necesito factura', expectedIntent: 'GENERAL_QUESTION', expectedConfidence: 0.78, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'PY-016', category: 'payment', clientMessage: 'Puedo pagar cuando recoja?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.78, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'PY-017', category: 'payment', clientMessage: 'Tienen tasa preferencial para empresas?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.78, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'PY-018', category: 'payment', clientMessage: 'Pago contra entrega sirve?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.78, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'PY-019', category: 'payment', clientMessage: 'Ahí les mando la captura del pago', expectedIntent: 'PAYMENT_CONFIRMATION', expectedConfidence: 0.90, expectedResponseKey: 'payment_need_confirmation', isAmbiguous: false },
  { id: 'PY-020', category: 'payment', clientMessage: 'Necesito los datos bancarios', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.82, expectedResponseKey: 'payment_pending', isAmbiguous: false },
  { id: 'PY-021', category: 'payment', clientMessage: 'Cuánto me falta por pagar?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.85, expectedResponseKey: 'payment_pending', isAmbiguous: false },
  { id: 'PY-022', category: 'payment', clientMessage: 'Hice el SINPE a las 2pm', expectedIntent: 'PAYMENT_CONFIRMATION', expectedConfidence: 0.90, expectedResponseKey: 'payment_need_confirmation', extractedData: { paymentMethod: 'SINPE' }, isAmbiguous: false },
  { id: 'PY-023', category: 'payment', clientMessage: 'El depósito fue de 150 mil', expectedIntent: 'PAYMENT_CONFIRMATION', expectedConfidence: 0.88, expectedResponseKey: 'payment_need_confirmation', isAmbiguous: false },
  { id: 'PY-024', category: 'payment', clientMessage: 'Hacen crédito?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.78, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'PY-025', category: 'payment', clientMessage: 'Les puedo dar un adelanto?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.78, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'PY-026', category: 'payment', clientMessage: 'Ya está el pago, me confirman?', expectedIntent: 'PAYMENT_CONFIRMATION', expectedConfidence: 0.90, expectedResponseKey: 'payment_need_confirmation', isAmbiguous: false },
  { id: 'PY-027', category: 'payment', clientMessage: 'Le transferí a la cuenta del BAC', expectedIntent: 'PAYMENT_CONFIRMATION', expectedConfidence: 0.90, expectedResponseKey: 'payment_need_confirmation', extractedData: { paymentMethod: 'transferencia' }, isAmbiguous: false },
  { id: 'PY-028', category: 'payment', clientMessage: 'Cuánto es en dólares?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.85, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'PY-029', category: 'payment', clientMessage: 'Les puedo pagar en 2 tractos?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.78, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'PY-030', category: 'payment', clientMessage: 'El pago aparece como pendiente?', expectedIntent: 'PAYMENT_CONFIRMATION', expectedConfidence: 0.82, expectedResponseKey: 'payment_need_confirmation', isAmbiguous: true },
  { id: 'PY-031', category: 'payment', clientMessage: 'Mi asistente ya hizo el depósito', expectedIntent: 'PAYMENT_CONFIRMATION', expectedConfidence: 0.88, expectedResponseKey: 'payment_need_confirmation', isAmbiguous: false },
  { id: 'PY-032', category: 'payment', clientMessage: 'Necesitan el 50% antes?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.78, expectedResponseKey: 'payment_pending', isAmbiguous: false },
  { id: 'PY-033', category: 'payment', clientMessage: 'Hola, hice un pago ayer pero no he recibido confirmación', expectedIntent: 'PAYMENT_CONFIRMATION', expectedConfidence: 0.88, expectedResponseKey: 'payment_need_confirmation', isAmbiguous: false },
  { id: 'PY-034', category: 'payment', clientMessage: 'Ya pasé por la tienda y dejé el pago', expectedIntent: 'PAYMENT_CONFIRMATION', expectedConfidence: 0.85, expectedResponseKey: 'payment_need_confirmation', isAmbiguous: false },
  { id: 'PY-035', category: 'payment', clientMessage: 'Envié el SINPE desde el número 8XXX-XXXX', expectedIntent: 'PAYMENT_CONFIRMATION', expectedConfidence: 0.92, expectedResponseKey: 'payment_need_confirmation', extractedData: { paymentMethod: 'SINPE' }, isAmbiguous: false },
  { id: 'PY-036', category: 'payment', clientMessage: 'Me manda el QR para pagar?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.82, expectedResponseKey: 'payment_pending', isAmbiguous: false },
  { id: 'PY-037', category: 'payment', clientMessage: 'Cuánto es lo que debo?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.85, expectedResponseKey: 'payment_pending', isAmbiguous: false },
  { id: 'PY-038', category: 'payment', clientMessage: 'Ahí le mandé la captura', expectedIntent: 'PAYMENT_CONFIRMATION', expectedConfidence: 0.88, expectedResponseKey: 'payment_need_confirmation', isAmbiguous: false },
  { id: 'PY-039', category: 'payment', clientMessage: 'Pago listo', expectedIntent: 'PAYMENT_CONFIRMATION', expectedConfidence: 0.88, expectedResponseKey: 'payment_need_confirmation', isAmbiguous: false },
  { id: 'PY-040', category: 'payment', clientMessage: 'Les debo algo todavía?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.82, expectedResponseKey: 'payment_pending', isAmbiguous: false },
  { id: 'PY-041', category: 'payment', clientMessage: 'Pagué todo ayer en la tarde', expectedIntent: 'PAYMENT_CONFIRMATION', expectedConfidence: 0.88, expectedResponseKey: 'payment_need_confirmation', isAmbiguous: false },
  { id: 'PY-042', category: 'payment', clientMessage: 'Ahí queda cancelada la cuenta', expectedIntent: 'PAYMENT_CONFIRMATION', expectedConfidence: 0.85, expectedResponseKey: 'payment_need_confirmation', isAmbiguous: true },
]

// ── DELIVERY (42 escenarios) ────────────────────────────────────────────────

const DELIVERY_SCENARIOS: ConversationTraining[] = [
  { id: 'DL-001', category: 'delivery', clientMessage: 'Cuándo me lo envían?', expectedIntent: 'DELIVERY_INQUIRY', expectedConfidence: 0.88, expectedResponseKey: 'delivery_options', isAmbiguous: false },
  { id: 'DL-002', category: 'delivery', clientMessage: 'Puedo recogerlo mañana?', expectedIntent: 'SCHEDULE_PICKUP', expectedConfidence: 0.88, expectedResponseKey: 'schedule_pickup', isAmbiguous: false },
  { id: 'DL-003', category: 'delivery', clientMessage: 'Hacen envío a Guanacaste?', expectedIntent: 'DELIVERY_INQUIRY', expectedConfidence: 0.88, expectedResponseKey: 'delivery_shipping_info', isAmbiguous: false },
  { id: 'DL-004', category: 'delivery', clientMessage: 'Cuánto sale el envío?', expectedIntent: 'DELIVERY_INQUIRY', expectedConfidence: 0.88, expectedResponseKey: 'delivery_shipping_info', isAmbiguous: false },
  { id: 'DL-005', category: 'delivery', clientMessage: 'Me lo pueden dejar en la oficina?', expectedIntent: 'DELIVERY_INQUIRY', expectedConfidence: 0.85, expectedResponseKey: 'delivery_shipping_info', isAmbiguous: false },
  { id: 'DL-006', category: 'delivery', clientMessage: 'Dónde queda la tienda?', expectedIntent: 'GENERAL_QUESTION', expectedConfidence: 0.80, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'DL-007', category: 'delivery', clientMessage: 'Paso hoy en la tarde', expectedIntent: 'SCHEDULE_PICKUP', expectedConfidence: 0.85, expectedResponseKey: 'schedule_pickup', isAmbiguous: false },
  { id: 'DL-008', category: 'delivery', clientMessage: 'Lo puedo recoger el sábado?', expectedIntent: 'SCHEDULE_PICKUP', expectedConfidence: 0.88, expectedResponseKey: 'schedule_pickup', isAmbiguous: false },
  { id: 'DL-009', category: 'delivery', clientMessage: 'Cuál es el horario de la tienda?', expectedIntent: 'SCHEDULE_PICKUP', expectedConfidence: 0.82, expectedResponseKey: 'schedule_pickup', isAmbiguous: false },
  { id: 'DL-010', category: 'delivery', clientMessage: 'Envían a Limón?', expectedIntent: 'DELIVERY_INQUIRY', expectedConfidence: 0.88, expectedResponseKey: 'delivery_shipping_info', isAmbiguous: false },
  { id: 'DL-011', category: 'delivery', clientMessage: 'Manden por Correos de Costa Rica', expectedIntent: 'DELIVERY_INQUIRY', expectedConfidence: 0.85, expectedResponseKey: 'delivery_shipping_info', isAmbiguous: false },
  { id: 'DL-012', category: 'delivery', clientMessage: 'Prefiero recoger', expectedIntent: 'DELIVERY_INQUIRY', expectedConfidence: 0.85, expectedResponseKey: 'delivery_pickup_scheduled', extractedData: { deliveryPreference: 'recoger' }, isAmbiguous: false },
  { id: 'DL-013', category: 'delivery', clientMessage: 'Me lo envían a San José centro', expectedIntent: 'DELIVERY_INQUIRY', expectedConfidence: 0.88, expectedResponseKey: 'delivery_shipping_info', extractedData: { deliveryPreference: 'enviar' }, isAmbiguous: false },
  { id: 'DL-014', category: 'delivery', clientMessage: 'Cuántos días tarda el envío?', expectedIntent: 'DELIVERY_INQUIRY', expectedConfidence: 0.88, expectedResponseKey: 'delivery_shipping_info', isAmbiguous: false },
  { id: 'DL-015', category: 'delivery', clientMessage: 'Trabajan con alguna empresa de mensajería?', expectedIntent: 'DELIVERY_INQUIRY', expectedConfidence: 0.82, expectedResponseKey: 'delivery_shipping_info', isAmbiguous: false },
  { id: 'DL-016', category: 'delivery', clientMessage: 'Puedo mandar a alguien a recogerlo?', expectedIntent: 'SCHEDULE_PICKUP', expectedConfidence: 0.85, expectedResponseKey: 'schedule_pickup', isAmbiguous: false },
  { id: 'DL-017', category: 'delivery', clientMessage: 'Cómo hago para recibir el pedido?', expectedIntent: 'DELIVERY_INQUIRY', expectedConfidence: 0.85, expectedResponseKey: 'delivery_options', isAmbiguous: false },
  { id: 'DL-018', category: 'delivery', clientMessage: 'Paso mañana a las 10', expectedIntent: 'SCHEDULE_PICKUP', expectedConfidence: 0.88, expectedResponseKey: 'schedule_pickup', isAmbiguous: false },
  { id: 'DL-019', category: 'delivery', clientMessage: 'Hacen entregas los domingos?', expectedIntent: 'DELIVERY_INQUIRY', expectedConfidence: 0.82, expectedResponseKey: 'delivery_shipping_info', isAmbiguous: false },
  { id: 'DL-020', category: 'delivery', clientMessage: 'Se puede coordinar entrega en Heredia?', expectedIntent: 'DELIVERY_INQUIRY', expectedConfidence: 0.88, expectedResponseKey: 'delivery_shipping_info', isAmbiguous: false },
  { id: 'DL-021', category: 'delivery', clientMessage: 'A qué hora puedo pasar?', expectedIntent: 'SCHEDULE_PICKUP', expectedConfidence: 0.85, expectedResponseKey: 'schedule_pickup', isAmbiguous: false },
  { id: 'DL-022', category: 'delivery', clientMessage: 'Envían internacionalmente?', expectedIntent: 'DELIVERY_INQUIRY', expectedConfidence: 0.85, expectedResponseKey: 'delivery_shipping_info', isAmbiguous: false },
  { id: 'DL-023', category: 'delivery', clientMessage: 'Me lo pueden enviar por Uber mensajería?', expectedIntent: 'DELIVERY_INQUIRY', expectedConfidence: 0.85, expectedResponseKey: 'delivery_shipping_info', isAmbiguous: false },
  { id: 'DL-024', category: 'delivery', clientMessage: 'Abren los sábados?', expectedIntent: 'SCHEDULE_PICKUP', expectedConfidence: 0.82, expectedResponseKey: 'schedule_pickup', isAmbiguous: false },
  { id: 'DL-025', category: 'delivery', clientMessage: 'Cuánto cuesta envío a Pérez Zeledón?', expectedIntent: 'DELIVERY_INQUIRY', expectedConfidence: 0.88, expectedResponseKey: 'delivery_shipping_info', isAmbiguous: false },
  { id: 'DL-026', category: 'delivery', clientMessage: 'Mejor envíenlo', expectedIntent: 'DELIVERY_INQUIRY', expectedConfidence: 0.85, expectedResponseKey: 'delivery_shipping_info', extractedData: { deliveryPreference: 'enviar' }, isAmbiguous: false },
  { id: 'DL-027', category: 'delivery', clientMessage: 'Puedo ir hoy?', expectedIntent: 'SCHEDULE_PICKUP', expectedConfidence: 0.85, expectedResponseKey: 'schedule_pickup', isAmbiguous: false },
  { id: 'DL-028', category: 'delivery', clientMessage: 'El envío tiene seguimiento?', expectedIntent: 'DELIVERY_INQUIRY', expectedConfidence: 0.82, expectedResponseKey: 'delivery_shipping_info', isAmbiguous: false },
  { id: 'DL-029', category: 'delivery', clientMessage: 'Necesito que llegue antes del viernes', expectedIntent: 'DELIVERY_INQUIRY', expectedConfidence: 0.85, expectedResponseKey: 'delivery_shipping_info', extractedData: { urgency: 'urgent' }, isAmbiguous: false },
  { id: 'DL-030', category: 'delivery', clientMessage: 'Ya lo fui a recoger y estaba cerrado', expectedIntent: 'COMPLAINT', expectedConfidence: 0.82, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'DL-031', category: 'delivery', clientMessage: 'Mande la dirección exacta de la tienda', expectedIntent: 'GENERAL_QUESTION', expectedConfidence: 0.78, expectedResponseKey: 'schedule_pickup', isAmbiguous: false },
  { id: 'DL-032', category: 'delivery', clientMessage: 'Se coordina entrega con ustedes directamente?', expectedIntent: 'DELIVERY_INQUIRY', expectedConfidence: 0.82, expectedResponseKey: 'delivery_options', isAmbiguous: false },
  { id: 'DL-033', category: 'delivery', clientMessage: 'No me ha llegado nada', expectedIntent: 'DELIVERY_INQUIRY', expectedConfidence: 0.82, expectedResponseKey: 'delivery_shipping_info', isAmbiguous: false },
  { id: 'DL-034', category: 'delivery', clientMessage: 'El mensajero no me encontró', expectedIntent: 'DELIVERY_INQUIRY', expectedConfidence: 0.82, expectedResponseKey: 'delivery_shipping_info', isAmbiguous: false },
  { id: 'DL-035', category: 'delivery', clientMessage: 'Pueden dejarlo con el guarda de seguridad?', expectedIntent: 'DELIVERY_INQUIRY', expectedConfidence: 0.82, expectedResponseKey: 'delivery_shipping_info', isAmbiguous: false },
  { id: 'DL-036', category: 'delivery', clientMessage: 'Paso después de las 5', expectedIntent: 'SCHEDULE_PICKUP', expectedConfidence: 0.85, expectedResponseKey: 'schedule_pickup', isAmbiguous: false },
  { id: 'DL-037', category: 'delivery', clientMessage: 'Mandan Uber?', expectedIntent: 'DELIVERY_INQUIRY', expectedConfidence: 0.78, expectedResponseKey: 'delivery_shipping_info', isAmbiguous: true },
  { id: 'DL-038', category: 'delivery', clientMessage: 'A qué número de SINPE les pago el envío?', expectedIntent: 'DELIVERY_INQUIRY', expectedConfidence: 0.82, expectedResponseKey: 'delivery_shipping_info', isAmbiguous: false },
  { id: 'DL-039', category: 'delivery', clientMessage: 'Me urge que me lo manden hoy', expectedIntent: 'DELIVERY_INQUIRY', expectedConfidence: 0.88, expectedResponseKey: 'delivery_shipping_info', extractedData: { urgency: 'urgent' }, isAmbiguous: false },
  { id: 'DL-040', category: 'delivery', clientMessage: 'Hay parqueo en la tienda?', expectedIntent: 'GENERAL_QUESTION', expectedConfidence: 0.78, expectedResponseKey: 'schedule_pickup', isAmbiguous: false },
  { id: 'DL-041', category: 'delivery', clientMessage: 'Cuándo abren?', expectedIntent: 'SCHEDULE_PICKUP', expectedConfidence: 0.82, expectedResponseKey: 'schedule_pickup', isAmbiguous: false },
  { id: 'DL-042', category: 'delivery', clientMessage: 'Recojo mañana tempranito', expectedIntent: 'SCHEDULE_PICKUP', expectedConfidence: 0.85, expectedResponseKey: 'schedule_pickup', isAmbiguous: false },
]

// ── PRICING (42 escenarios) ─────────────────────────────────────────────────

const PRICING_SCENARIOS: ConversationTraining[] = [
  { id: 'PR-001', category: 'pricing', clientMessage: 'Cuánto cuestan las mangas?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.90, expectedResponseKey: 'pricing_info', extractedData: { productType: 'mangas' }, isAmbiguous: false },
  { id: 'PR-002', category: 'pricing', clientMessage: 'Qué precio tienen?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.88, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'PR-003', category: 'pricing', clientMessage: 'Me dan descuento por volumen?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.88, expectedResponseKey: 'pricing_discount', isAmbiguous: false },
  { id: 'PR-004', category: 'pricing', clientMessage: 'Es muy caro', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.78, expectedResponseKey: 'pricing_discount', isAmbiguous: true },
  { id: 'PR-005', category: 'pricing', clientMessage: 'El otro lugar me cobra menos', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.78, expectedResponseKey: 'pricing_discount', isAmbiguous: false },
  { id: 'PR-006', category: 'pricing', clientMessage: 'Cuánto sale un jersey personalizado?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.90, expectedResponseKey: 'pricing_info', extractedData: { productType: 'jersey' }, isAmbiguous: false },
  { id: 'PR-007', category: 'pricing', clientMessage: 'Precio de gorras?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.90, expectedResponseKey: 'pricing_info', extractedData: { productType: 'gorras' }, isAmbiguous: false },
  { id: 'PR-008', category: 'pricing', clientMessage: 'Cuánto cuesta si pido 100?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.90, expectedResponseKey: 'pricing_info', extractedData: { quantity: 100 }, isAmbiguous: false },
  { id: 'PR-009', category: 'pricing', clientMessage: 'No me alcanza el presupuesto', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.72, expectedResponseKey: 'pricing_discount', isAmbiguous: true },
  { id: 'PR-010', category: 'pricing', clientMessage: 'Cuánto es el mínimo de pedido?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.85, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'PR-011', category: 'pricing', clientMessage: 'A cuánto me sale c/u si pido 50?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.90, expectedResponseKey: 'pricing_info', extractedData: { quantity: 50 }, isAmbiguous: false },
  { id: 'PR-012', category: 'pricing', clientMessage: 'El diseño tiene costo aparte?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.85, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'PR-013', category: 'pricing', clientMessage: 'Incluye IVA?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.85, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'PR-014', category: 'pricing', clientMessage: 'Cuánto sería el total por 25 camisetas?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.90, expectedResponseKey: 'pricing_info', extractedData: { quantity: 25, productType: 'camisetas' }, isAmbiguous: false },
  { id: 'PR-015', category: 'pricing', clientMessage: 'Si pido más de 200 hay descuento especial?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.88, expectedResponseKey: 'pricing_discount', isAmbiguous: false },
  { id: 'PR-016', category: 'pricing', clientMessage: 'Manejan lista de precios?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.85, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'PR-017', category: 'pricing', clientMessage: 'Cuánto vale la sublimación full print?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.88, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'PR-018', category: 'pricing', clientMessage: 'Es más barato si yo pongo la tela?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.82, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'PR-019', category: 'pricing', clientMessage: 'Cuánto cuesta el bordado?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.88, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'PR-020', category: 'pricing', clientMessage: 'Hay alguna promo?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.82, expectedResponseKey: 'pricing_discount', isAmbiguous: false },
  { id: 'PR-021', category: 'pricing', clientMessage: 'Cuánto cobran por diseño?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.88, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'PR-022', category: 'pricing', clientMessage: 'Precio unitario de mangas en cantidad de 30?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.92, expectedResponseKey: 'pricing_info', extractedData: { quantity: 30, productType: 'mangas' }, isAmbiguous: false },
  { id: 'PR-023', category: 'pricing', clientMessage: 'Cuánto sale hacer un pedido chiquito?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.82, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'PR-024', category: 'pricing', clientMessage: 'Qué me incluye el precio?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.85, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'PR-025', category: 'pricing', clientMessage: 'Si compro al por mayor sale más barato?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.88, expectedResponseKey: 'pricing_discount', isAmbiguous: false },
  { id: 'PR-026', category: 'pricing', clientMessage: 'Manejan precios en dólares?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.82, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'PR-027', category: 'pricing', clientMessage: 'Me pueden hacer una cotización formal?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.88, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'PR-028', category: 'pricing', clientMessage: 'Cuánto sale el short de ciclismo?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.90, expectedResponseKey: 'pricing_info', extractedData: { productType: 'short' }, isAmbiguous: false },
  { id: 'PR-029', category: 'pricing', clientMessage: 'Cuánto me cobran si ya tengo el diseño?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.85, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'PR-030', category: 'pricing', clientMessage: 'A cuánto las licras?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.90, expectedResponseKey: 'pricing_info', extractedData: { productType: 'licras' }, isAmbiguous: false },
  { id: 'PR-031', category: 'pricing', clientMessage: 'Tienen precios para distribuidores?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.82, expectedResponseKey: 'pricing_discount', isAmbiguous: false },
  { id: 'PR-032', category: 'pricing', clientMessage: 'Pueden igualar el precio de la competencia?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.78, expectedResponseKey: 'pricing_discount', isAmbiguous: false },
  { id: 'PR-033', category: 'pricing', clientMessage: 'Cuánto es lo mínimo que aceptan?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.82, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'PR-034', category: 'pricing', clientMessage: 'Precio de camiseta con logo bordado?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.90, expectedResponseKey: 'pricing_info', extractedData: { productType: 'camiseta' }, isAmbiguous: false },
  { id: 'PR-035', category: 'pricing', clientMessage: 'Cuánto sale un kit completo (jersey + short + mangas)?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.88, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'PR-036', category: 'pricing', clientMessage: 'No será muy caro?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.72, expectedResponseKey: 'pricing_general', isAmbiguous: true },
  { id: 'PR-037', category: 'pricing', clientMessage: 'Cuánto sale una muestra?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.85, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'PR-038', category: 'pricing', clientMessage: 'Hacen descuento a clubes deportivos?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.85, expectedResponseKey: 'pricing_discount', isAmbiguous: false },
  { id: 'PR-039', category: 'pricing', clientMessage: 'Precio?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.82, expectedResponseKey: 'pricing_general', isAmbiguous: true },
  { id: 'PR-040', category: 'pricing', clientMessage: 'Cuánto por estampar mi logo?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.88, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'PR-041', category: 'pricing', clientMessage: 'A cuánto sale un jersey con número y nombre?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.90, expectedResponseKey: 'pricing_info', extractedData: { productType: 'jersey' }, isAmbiguous: false },
  { id: 'PR-042', category: 'pricing', clientMessage: 'Tienen algún paquete para equipos?', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.82, expectedResponseKey: 'pricing_discount', isAmbiguous: false },
]

// ── GREETINGS & FAREWELLS (32 escenarios) ───────────────────────────────────

const GREETING_SCENARIOS: ConversationTraining[] = [
  { id: 'GR-001', category: 'greeting', clientMessage: 'Hola', expectedIntent: 'GREETING', expectedConfidence: 0.99, expectedResponseKey: 'greeting_new', isAmbiguous: false },
  { id: 'GR-002', category: 'greeting', clientMessage: 'Buenas', expectedIntent: 'GREETING', expectedConfidence: 0.95, expectedResponseKey: 'greeting_new', isAmbiguous: false },
  { id: 'GR-003', category: 'greeting', clientMessage: 'Mae qué tal', expectedIntent: 'GREETING', expectedConfidence: 0.92, expectedResponseKey: 'greeting_new', isAmbiguous: false },
  { id: 'GR-004', category: 'greeting', clientMessage: 'Buenos días', expectedIntent: 'GREETING', expectedConfidence: 0.98, expectedResponseKey: 'greeting_new', isAmbiguous: false },
  { id: 'GR-005', category: 'greeting', clientMessage: 'Buenas tardes', expectedIntent: 'GREETING', expectedConfidence: 0.98, expectedResponseKey: 'greeting_new', isAmbiguous: false },
  { id: 'GR-006', category: 'greeting', clientMessage: 'Buenas noches', expectedIntent: 'GREETING', expectedConfidence: 0.98, expectedResponseKey: 'greeting_new', isAmbiguous: false },
  { id: 'GR-007', category: 'greeting', clientMessage: 'Pura vida', expectedIntent: 'GREETING', expectedConfidence: 0.70, expectedResponseKey: 'greeting_new', isAmbiguous: true, notes: 'Puede ser saludo o agradecimiento' },
  { id: 'GR-008', category: 'greeting', clientMessage: 'Gracias', expectedIntent: 'THANK_YOU', expectedConfidence: 0.92, expectedResponseKey: 'thank_you_response', isAmbiguous: false },
  { id: 'GR-009', category: 'greeting', clientMessage: 'Muchas gracias', expectedIntent: 'THANK_YOU', expectedConfidence: 0.95, expectedResponseKey: 'thank_you_response', isAmbiguous: false },
  { id: 'GR-010', category: 'greeting', clientMessage: 'Excelente servicio', expectedIntent: 'THANK_YOU', expectedConfidence: 0.88, expectedResponseKey: 'thank_you_with_feedback', isAmbiguous: false },
  { id: 'GR-011', category: 'greeting', clientMessage: 'Hola! Cómo están?', expectedIntent: 'GREETING', expectedConfidence: 0.95, expectedResponseKey: 'greeting_new', isAmbiguous: false },
  { id: 'GR-012', category: 'greeting', clientMessage: 'Hey', expectedIntent: 'GREETING', expectedConfidence: 0.90, expectedResponseKey: 'greeting_new', isAmbiguous: false },
  { id: 'GR-013', category: 'greeting', clientMessage: 'Qué tal todo?', expectedIntent: 'GREETING', expectedConfidence: 0.90, expectedResponseKey: 'greeting_new', isAmbiguous: false },
  { id: 'GR-014', category: 'greeting', clientMessage: 'Buenas buenas', expectedIntent: 'GREETING', expectedConfidence: 0.95, expectedResponseKey: 'greeting_new', isAmbiguous: false },
  { id: 'GR-015', category: 'greeting', clientMessage: 'Hola, alguien me atiende?', expectedIntent: 'GREETING', expectedConfidence: 0.90, expectedResponseKey: 'greeting_new', isAmbiguous: false },
  { id: 'GR-016', category: 'greeting', clientMessage: 'Gracias por todo', expectedIntent: 'THANK_YOU', expectedConfidence: 0.92, expectedResponseKey: 'thank_you_response', isAmbiguous: false },
  { id: 'GR-017', category: 'greeting', clientMessage: 'Se los agradezco mucho', expectedIntent: 'THANK_YOU', expectedConfidence: 0.92, expectedResponseKey: 'thank_you_response', isAmbiguous: false },
  { id: 'GR-018', category: 'greeting', clientMessage: 'Mil gracias!', expectedIntent: 'THANK_YOU', expectedConfidence: 0.95, expectedResponseKey: 'thank_you_response', isAmbiguous: false },
  { id: 'GR-019', category: 'greeting', clientMessage: 'Que Dios les bendiga', expectedIntent: 'THANK_YOU', expectedConfidence: 0.82, expectedResponseKey: 'thank_you_response', isAmbiguous: false },
  { id: 'GR-020', category: 'greeting', clientMessage: 'Hola hola!', expectedIntent: 'GREETING', expectedConfidence: 0.95, expectedResponseKey: 'greeting_new', isAmbiguous: false },
  { id: 'GR-021', category: 'greeting', clientMessage: 'Saludos!', expectedIntent: 'GREETING', expectedConfidence: 0.92, expectedResponseKey: 'greeting_new', isAmbiguous: false },
  { id: 'GR-022', category: 'greeting', clientMessage: 'Hola! Soy nuevo cliente', expectedIntent: 'GREETING', expectedConfidence: 0.92, expectedResponseKey: 'greeting_new', isAmbiguous: false },
  { id: 'GR-023', category: 'greeting', clientMessage: 'Gracias, quedaron lindos', expectedIntent: 'THANK_YOU', expectedConfidence: 0.90, expectedResponseKey: 'thank_you_with_feedback', isAmbiguous: false },
  { id: 'GR-024', category: 'greeting', clientMessage: 'Muy agradecida con el servicio', expectedIntent: 'THANK_YOU', expectedConfidence: 0.92, expectedResponseKey: 'thank_you_with_feedback', isAmbiguous: false },
  { id: 'GR-025', category: 'greeting', clientMessage: 'Los voy a recomendar!', expectedIntent: 'THANK_YOU', expectedConfidence: 0.85, expectedResponseKey: 'thank_you_with_feedback', isAmbiguous: false },
  { id: 'GR-026', category: 'greeting', clientMessage: 'Bendiciones para todos', expectedIntent: 'THANK_YOU', expectedConfidence: 0.82, expectedResponseKey: 'thank_you_response', isAmbiguous: false },
  { id: 'GR-027', category: 'greeting', clientMessage: '🙏', expectedIntent: 'THANK_YOU', expectedConfidence: 0.75, expectedResponseKey: 'thank_you_response', isAmbiguous: true },
  { id: 'GR-028', category: 'greeting', clientMessage: 'Hola buenas noches disculpe la hora', expectedIntent: 'GREETING', expectedConfidence: 0.95, expectedResponseKey: 'greeting_new', isAmbiguous: false },
  { id: 'GR-029', category: 'greeting', clientMessage: 'Que tengan buen día', expectedIntent: 'THANK_YOU', expectedConfidence: 0.82, expectedResponseKey: 'thank_you_response', isAmbiguous: false },
  { id: 'GR-030', category: 'greeting', clientMessage: 'De nada!', expectedIntent: 'THANK_YOU', expectedConfidence: 0.72, expectedResponseKey: 'thank_you_response', isAmbiguous: true },
  { id: 'GR-031', category: 'greeting', clientMessage: 'Pura vida mae!', expectedIntent: 'GREETING', expectedConfidence: 0.72, expectedResponseKey: 'greeting_new', isAmbiguous: true },
  { id: 'GR-032', category: 'greeting', clientMessage: 'Holaa alguien me puede ayudar?', expectedIntent: 'GREETING', expectedConfidence: 0.92, expectedResponseKey: 'greeting_new', isAmbiguous: false },
]

// ── CANCELLATIONS (22 escenarios) ───────────────────────────────────────────

const CANCEL_SCENARIOS: ConversationTraining[] = [
  { id: 'CN-001', category: 'cancel', clientMessage: 'Quiero cancelar', expectedIntent: 'CANCELLATION', expectedConfidence: 0.90, expectedResponseKey: 'cancel_confirm', isAmbiguous: false },
  { id: 'CN-002', category: 'cancel', clientMessage: 'Ya no lo necesito', expectedIntent: 'CANCELLATION', expectedConfidence: 0.85, expectedResponseKey: 'cancel_confirm', isAmbiguous: false },
  { id: 'CN-003', category: 'cancel', clientMessage: 'Se canceló el evento', expectedIntent: 'CANCELLATION', expectedConfidence: 0.88, expectedResponseKey: 'cancel_confirm', isAmbiguous: false },
  { id: 'CN-004', category: 'cancel', clientMessage: 'Me devuelven la plata?', expectedIntent: 'CANCELLATION', expectedConfidence: 0.82, expectedResponseKey: 'cancel_confirm', isAmbiguous: false },
  { id: 'CN-005', category: 'cancel', clientMessage: 'Cancelen el pedido 0032', expectedIntent: 'CANCELLATION', expectedConfidence: 0.92, expectedResponseKey: 'cancel_confirm', extractedData: { orderNumber: '0032' }, isAmbiguous: false },
  { id: 'CN-006', category: 'cancel', clientMessage: 'No quiero el pedido', expectedIntent: 'CANCELLATION', expectedConfidence: 0.90, expectedResponseKey: 'cancel_confirm', isAmbiguous: false },
  { id: 'CN-007', category: 'cancel', clientMessage: 'Cambié de opinión, no lo quiero', expectedIntent: 'CANCELLATION', expectedConfidence: 0.88, expectedResponseKey: 'cancel_confirm', isAmbiguous: false },
  { id: 'CN-008', category: 'cancel', clientMessage: 'Anulen la orden por favor', expectedIntent: 'CANCELLATION', expectedConfidence: 0.90, expectedResponseKey: 'cancel_confirm', isAmbiguous: false },
  { id: 'CN-009', category: 'cancel', clientMessage: 'Ya conseguí en otro lado', expectedIntent: 'CANCELLATION', expectedConfidence: 0.82, expectedResponseKey: 'cancel_confirm', isAmbiguous: false },
  { id: 'CN-010', category: 'cancel', clientMessage: 'Me salió más barato en otro lado, cancelen', expectedIntent: 'CANCELLATION', expectedConfidence: 0.88, expectedResponseKey: 'cancel_confirm', isAmbiguous: false },
  { id: 'CN-011', category: 'cancel', clientMessage: 'El equipo se desintegró, ya no necesitamos uniformes', expectedIntent: 'CANCELLATION', expectedConfidence: 0.85, expectedResponseKey: 'cancel_confirm', isAmbiguous: false },
  { id: 'CN-012', category: 'cancel', clientMessage: 'Puedo cancelar sin costo?', expectedIntent: 'CANCELLATION', expectedConfidence: 0.85, expectedResponseKey: 'cancel_confirm', isAmbiguous: false },
  { id: 'CN-013', category: 'cancel', clientMessage: 'Me arrepentí', expectedIntent: 'CANCELLATION', expectedConfidence: 0.85, expectedResponseKey: 'cancel_confirm', isAmbiguous: false },
  { id: 'CN-014', category: 'cancel', clientMessage: 'No voy a necesitar el pedido', expectedIntent: 'CANCELLATION', expectedConfidence: 0.88, expectedResponseKey: 'cancel_confirm', isAmbiguous: false },
  { id: 'CN-015', category: 'cancel', clientMessage: 'Se puede cancelar si ya está en producción?', expectedIntent: 'CANCELLATION', expectedConfidence: 0.85, expectedResponseKey: 'cancel_in_production', isAmbiguous: false },
  { id: 'CN-016', category: 'cancel', clientMessage: 'Quiero que paren todo', expectedIntent: 'CANCELLATION', expectedConfidence: 0.88, expectedResponseKey: 'cancel_confirm', isAmbiguous: false },
  { id: 'CN-017', category: 'cancel', clientMessage: 'Ya no va el pedido', expectedIntent: 'CANCELLATION', expectedConfidence: 0.88, expectedResponseKey: 'cancel_confirm', isAmbiguous: false },
  { id: 'CN-018', category: 'cancel', clientMessage: 'Cancelen todo', expectedIntent: 'CANCELLATION', expectedConfidence: 0.92, expectedResponseKey: 'cancel_confirm', isAmbiguous: false },
  { id: 'CN-019', category: 'cancel', clientMessage: 'Por razones personales debo cancelar', expectedIntent: 'CANCELLATION', expectedConfidence: 0.88, expectedResponseKey: 'cancel_confirm', isAmbiguous: false },
  { id: 'CN-020', category: 'cancel', clientMessage: 'Es posible cancelar y que me devuelvan el adelanto?', expectedIntent: 'CANCELLATION', expectedConfidence: 0.88, expectedResponseKey: 'cancel_confirm', isAmbiguous: false },
  { id: 'CN-021', category: 'cancel', clientMessage: 'Me retiro del pedido', expectedIntent: 'CANCELLATION', expectedConfidence: 0.85, expectedResponseKey: 'cancel_confirm', isAmbiguous: false },
  { id: 'CN-022', category: 'cancel', clientMessage: 'Cuánto me cobran por cancelar?', expectedIntent: 'CANCELLATION', expectedConfidence: 0.82, expectedResponseKey: 'cancel_confirm', isAmbiguous: false },
]

// ── EDGE CASES (82 escenarios) ──────────────────────────────────────────────

const EDGE_CASE_SCENARIOS: ConversationTraining[] = [
  { id: 'EC-001', category: 'edge', clientMessage: '?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.50, expectedResponseKey: 'clarification_order', isAmbiguous: true },
  { id: 'EC-002', category: 'edge', clientMessage: '...', expectedIntent: 'UNKNOWN', expectedConfidence: 0.20, expectedResponseKey: 'clarification_intent', isAmbiguous: true },
  { id: 'EC-003', category: 'edge', clientMessage: '👍', expectedIntent: 'DESIGN_APPROVAL', expectedConfidence: 0.60, expectedResponseKey: 'clarification_design', isAmbiguous: true, notes: 'Sin contexto es ambiguo' },
  { id: 'EC-004', category: 'edge', clientMessage: '👎', expectedIntent: 'DESIGN_REJECTION', expectedConfidence: 0.55, expectedResponseKey: 'clarification_design', isAmbiguous: true },
  { id: 'EC-005', category: 'edge', clientMessage: '❤️', expectedIntent: 'DESIGN_APPROVAL', expectedConfidence: 0.80, expectedResponseKey: 'design_approved_ack', isAmbiguous: true },
  { id: 'EC-006', category: 'edge', clientMessage: '😡', expectedIntent: 'COMPLAINT', expectedConfidence: 0.70, expectedResponseKey: 'complaint_generic', isAmbiguous: true },
  { id: 'EC-007', category: 'edge', clientMessage: 'Hola hola, alguien ahí?', expectedIntent: 'GREETING', expectedConfidence: 0.92, expectedResponseKey: 'greeting_new', isAmbiguous: false },
  { id: 'EC-008', category: 'edge', clientMessage: 'Quiero saber de mi pedido y también cuánto cuestan unas gorras', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.82, expectedResponseKey: 'status_in_production', isAmbiguous: false, notes: 'Múltiples intenciones, priorizar status' },
  { id: 'EC-009', category: 'edge', clientMessage: 'kiero 50 manags', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.78, expectedResponseKey: 'new_order_confirm', isAmbiguous: true, notes: 'Typos: kiero → quiero, manags → mangas' },
  { id: 'EC-010', category: 'edge', clientMessage: 'I need 20 jerseys please', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.72, expectedResponseKey: 'new_order_confirm', extractedData: { quantity: 20, productType: 'jerseys' }, isAmbiguous: true, notes: 'English mixed' },
  { id: 'EC-011', category: 'edge', clientMessage: 'Es que mi esposa dice que necesitamos mangas para el grupo', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.78, expectedResponseKey: 'new_order_vague', extractedData: { productType: 'mangas' }, isAmbiguous: false },
  { id: 'EC-012', category: 'edge', clientMessage: 'Un amigo me recomendó', expectedIntent: 'GREETING', expectedConfidence: 0.72, expectedResponseKey: 'greeting_new', isAmbiguous: true },
  { id: 'EC-013', category: 'edge', clientMessage: '*audio transcription* bueno este yo quería saber si ya estaba listo lo mío verdad', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.78, expectedResponseKey: 'status_in_production', isAmbiguous: true, notes: 'Voice note transcription' },
  { id: 'EC-014', category: 'edge', clientMessage: 'jaja ok', expectedIntent: 'UNKNOWN', expectedConfidence: 0.35, expectedResponseKey: 'clarification_intent', isAmbiguous: true },
  { id: 'EC-015', category: 'edge', clientMessage: 'hmm', expectedIntent: 'UNKNOWN', expectedConfidence: 0.20, expectedResponseKey: 'clarification_intent', isAmbiguous: true },
  { id: 'EC-016', category: 'edge', clientMessage: 'foto', expectedIntent: 'FILE_SENT', expectedConfidence: 0.65, expectedResponseKey: 'file_received', isAmbiguous: true },
  { id: 'EC-017', category: 'edge', clientMessage: '✅✅✅', expectedIntent: 'DESIGN_APPROVAL', expectedConfidence: 0.78, expectedResponseKey: 'design_approved_ack', isAmbiguous: true },
  { id: 'EC-018', category: 'edge', clientMessage: 'Ok perfecto gracias y cuándo va a estar?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.82, expectedResponseKey: 'status_in_production', isAmbiguous: false, notes: 'Múltiples intenciones' },
  { id: 'EC-019', category: 'edge', clientMessage: 'Reenviado: Hola necesito cotización', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.72, expectedResponseKey: 'new_order_vague', isAmbiguous: true, notes: 'Forwarded message' },
  { id: 'EC-020', category: 'edge', clientMessage: '', expectedIntent: 'UNKNOWN', expectedConfidence: 0.10, expectedResponseKey: 'clarification_intent', isAmbiguous: true, notes: 'Empty message' },
  { id: 'EC-021', category: 'edge', clientMessage: 'K', expectedIntent: 'UNKNOWN', expectedConfidence: 0.25, expectedResponseKey: 'clarification_intent', isAmbiguous: true },
  { id: 'EC-022', category: 'edge', clientMessage: 'Ajá', expectedIntent: 'UNKNOWN', expectedConfidence: 0.30, expectedResponseKey: 'clarification_intent', isAmbiguous: true },
  { id: 'EC-023', category: 'edge', clientMessage: 'No sé', expectedIntent: 'UNKNOWN', expectedConfidence: 0.30, expectedResponseKey: 'clarification_intent', isAmbiguous: true },
  { id: 'EC-024', category: 'edge', clientMessage: 'Puede ser', expectedIntent: 'UNKNOWN', expectedConfidence: 0.30, expectedResponseKey: 'clarification_intent', isAmbiguous: true },
  { id: 'EC-025', category: 'edge', clientMessage: 'Diay', expectedIntent: 'UNKNOWN', expectedConfidence: 0.25, expectedResponseKey: 'clarification_intent', isAmbiguous: true },
  { id: 'EC-026', category: 'edge', clientMessage: 'Mae mae mae', expectedIntent: 'GREETING', expectedConfidence: 0.72, expectedResponseKey: 'greeting_new', isAmbiguous: true },
  { id: 'EC-027', category: 'edge', clientMessage: 'Hola quiero hacer un pedido de jerseys y también saber cuándo estará listo el otro y cuánto debo', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.78, expectedResponseKey: 'new_order_vague', isAmbiguous: false, notes: '3 intenciones en 1 mensaje' },
  { id: 'EC-028', category: 'edge', clientMessage: 'asdfgh', expectedIntent: 'UNKNOWN', expectedConfidence: 0.10, expectedResponseKey: 'clarification_intent', isAmbiguous: true, notes: 'Random characters' },
  { id: 'EC-029', category: 'edge', clientMessage: '123456', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.60, expectedResponseKey: 'clarification_order', isAmbiguous: true, notes: 'Could be order number' },
  { id: 'EC-030', category: 'edge', clientMessage: 'Hola, mi nombre es Carlos y vengo de parte de mi amigo Juan que les compró', expectedIntent: 'GREETING', expectedConfidence: 0.85, expectedResponseKey: 'greeting_new', isAmbiguous: false },
  { id: 'EC-031', category: 'edge', clientMessage: 'Sí sí sí', expectedIntent: 'DESIGN_APPROVAL', expectedConfidence: 0.72, expectedResponseKey: 'clarification_design', isAmbiguous: true },
  { id: 'EC-032', category: 'edge', clientMessage: 'No no no', expectedIntent: 'DESIGN_REJECTION', expectedConfidence: 0.72, expectedResponseKey: 'design_rejected_ack', isAmbiguous: true },
  { id: 'EC-033', category: 'edge', clientMessage: 'Bueno bueno', expectedIntent: 'DESIGN_APPROVAL', expectedConfidence: 0.65, expectedResponseKey: 'clarification_design', isAmbiguous: true },
  { id: 'EC-034', category: 'edge', clientMessage: 'Mmm tal vez', expectedIntent: 'UNKNOWN', expectedConfidence: 0.30, expectedResponseKey: 'clarification_intent', isAmbiguous: true },
  { id: 'EC-035', category: 'edge', clientMessage: 'A ver', expectedIntent: 'UNKNOWN', expectedConfidence: 0.30, expectedResponseKey: 'clarification_intent', isAmbiguous: true },
  { id: 'EC-036', category: 'edge', clientMessage: 'Ey', expectedIntent: 'GREETING', expectedConfidence: 0.82, expectedResponseKey: 'greeting_new', isAmbiguous: false },
  { id: 'EC-037', category: 'edge', clientMessage: 'Necesito hablar con una persona real', expectedIntent: 'COMPLAINT', expectedConfidence: 0.82, expectedResponseKey: 'escalation_request', isAmbiguous: false, notes: 'Escalate to human' },
  { id: 'EC-038', category: 'edge', clientMessage: 'Esto es un bot?', expectedIntent: 'GENERAL_QUESTION', expectedConfidence: 0.72, expectedResponseKey: 'pricing_general', isAmbiguous: true },
  { id: 'EC-039', category: 'edge', clientMessage: 'Háblame de tú', expectedIntent: 'GENERAL_QUESTION', expectedConfidence: 0.50, expectedResponseKey: 'clarification_intent', isAmbiguous: true },
  { id: 'EC-040', category: 'edge', clientMessage: '😂😂😂', expectedIntent: 'UNKNOWN', expectedConfidence: 0.25, expectedResponseKey: 'clarification_intent', isAmbiguous: true },
  { id: 'EC-041', category: 'edge', clientMessage: 'Test', expectedIntent: 'UNKNOWN', expectedConfidence: 0.20, expectedResponseKey: 'clarification_intent', isAmbiguous: true },
  { id: 'EC-042', category: 'edge', clientMessage: 'Hola, soy de la prensa, puedo entrevistarlos?', expectedIntent: 'GENERAL_QUESTION', expectedConfidence: 0.65, expectedResponseKey: 'escalation_request', isAmbiguous: true, notes: 'Escalate: not a customer' },
  { id: 'EC-043', category: 'edge', clientMessage: 'Los vi en TikTok', expectedIntent: 'GREETING', expectedConfidence: 0.72, expectedResponseKey: 'greeting_new', isAmbiguous: true },
  { id: 'EC-044', category: 'edge', clientMessage: 'Ofrecen trabajo?', expectedIntent: 'GENERAL_QUESTION', expectedConfidence: 0.72, expectedResponseKey: 'escalation_request', isAmbiguous: false, notes: 'Not a customer inquiry' },
  { id: 'EC-045', category: 'edge', clientMessage: 'Hola me equivoqué de número', expectedIntent: 'GENERAL_QUESTION', expectedConfidence: 0.60, expectedResponseKey: 'clarification_intent', isAmbiguous: true },
  { id: 'EC-046', category: 'edge', clientMessage: 'Quiero comprar pero no sé qué', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.72, expectedResponseKey: 'new_order_vague', isAmbiguous: true },
  { id: 'EC-047', category: 'edge', clientMessage: 'Cuáles son sus redes sociales?', expectedIntent: 'GENERAL_QUESTION', expectedConfidence: 0.78, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'EC-048', category: 'edge', clientMessage: 'Me pueden llamar?', expectedIntent: 'GENERAL_QUESTION', expectedConfidence: 0.72, expectedResponseKey: 'clarification_intent', isAmbiguous: true },
  { id: 'EC-049', category: 'edge', clientMessage: 'jajajaja se pasaron', expectedIntent: 'UNKNOWN', expectedConfidence: 0.30, expectedResponseKey: 'clarification_intent', isAmbiguous: true },
  { id: 'EC-050', category: 'edge', clientMessage: 'Qué es V ONE B?', expectedIntent: 'GENERAL_QUESTION', expectedConfidence: 0.82, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'EC-051', category: 'edge', clientMessage: '👍👍', expectedIntent: 'DESIGN_APPROVAL', expectedConfidence: 0.65, expectedResponseKey: 'clarification_design', isAmbiguous: true },
  { id: 'EC-052', category: 'edge', clientMessage: 'Hola perdón por molestar', expectedIntent: 'GREETING', expectedConfidence: 0.92, expectedResponseKey: 'greeting_new', isAmbiguous: false },
  { id: 'EC-053', category: 'edge', clientMessage: 'Hola quiero info', expectedIntent: 'GREETING', expectedConfidence: 0.85, expectedResponseKey: 'greeting_new', isAmbiguous: false },
  { id: 'EC-054', category: 'edge', clientMessage: 'Cuénteme', expectedIntent: 'UNKNOWN', expectedConfidence: 0.35, expectedResponseKey: 'clarification_intent', isAmbiguous: true },
  { id: 'EC-055', category: 'edge', clientMessage: 'Nada más quería dar las gracias, la camisa quedó linda', expectedIntent: 'THANK_YOU', expectedConfidence: 0.92, expectedResponseKey: 'thank_you_with_feedback', isAmbiguous: false },
  { id: 'EC-056', category: 'edge', clientMessage: '0015', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.65, expectedResponseKey: 'status_in_production', extractedData: { orderNumber: '0015' }, isAmbiguous: true },
  { id: 'EC-057', category: 'edge', clientMessage: 'VB-202604-0015', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.85, expectedResponseKey: 'status_in_production', extractedData: { orderNumber: 'VB-202604-0015' }, isAmbiguous: false },
  { id: 'EC-058', category: 'edge', clientMessage: 'El pedido de ayer', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.78, expectedResponseKey: 'status_in_production', isAmbiguous: true },
  { id: 'EC-059', category: 'edge', clientMessage: 'Lo mismo de siempre', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.60, expectedResponseKey: 'new_order_vague', isAmbiguous: true },
  { id: 'EC-060', category: 'edge', clientMessage: 'Me recomendaron, cuénteme qué hacen', expectedIntent: 'GENERAL_QUESTION', expectedConfidence: 0.80, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'EC-061', category: 'edge', clientMessage: 'Buenos días! Necesito info + precio + fecha de entrega para 20 jerseys', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.88, expectedResponseKey: 'new_order_confirm', extractedData: { quantity: 20, productType: 'jerseys' }, isAmbiguous: false },
  { id: 'EC-062', category: 'edge', clientMessage: 'Perdón pero no entendí el mensaje anterior', expectedIntent: 'GENERAL_QUESTION', expectedConfidence: 0.65, expectedResponseKey: 'clarification_intent', isAmbiguous: true },
  { id: 'EC-063', category: 'edge', clientMessage: 'xD', expectedIntent: 'UNKNOWN', expectedConfidence: 0.15, expectedResponseKey: 'clarification_intent', isAmbiguous: true },
  { id: 'EC-064', category: 'edge', clientMessage: 'Por qué me dejan en visto?', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.72, expectedResponseKey: 'clarification_order', isAmbiguous: true, notes: 'Frustración' },
  { id: 'EC-065', category: 'edge', clientMessage: 'Contesten!!', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.72, expectedResponseKey: 'clarification_order', isAmbiguous: true, notes: 'Frustración' },
  { id: 'EC-066', category: 'edge', clientMessage: 'Audio', expectedIntent: 'FILE_SENT', expectedConfidence: 0.60, expectedResponseKey: 'file_received', isAmbiguous: true },
  { id: 'EC-067', category: 'edge', clientMessage: 'Le reenvío lo que me mandó mi jefe', expectedIntent: 'FILE_SENT', expectedConfidence: 0.72, expectedResponseKey: 'file_received', isAmbiguous: true },
  { id: 'EC-068', category: 'edge', clientMessage: 'Ya vine pero está cerrado', expectedIntent: 'COMPLAINT', expectedConfidence: 0.78, expectedResponseKey: 'complaint_ack', isAmbiguous: false },
  { id: 'EC-069', category: 'edge', clientMessage: 'No se pueden comunicar conmigo al 8888-8888?', expectedIntent: 'GENERAL_QUESTION', expectedConfidence: 0.72, expectedResponseKey: 'clarification_intent', isAmbiguous: true },
  { id: 'EC-070', category: 'edge', clientMessage: 'Buenas, soy distribuidor de telas, me interesa ser proveedor', expectedIntent: 'GENERAL_QUESTION', expectedConfidence: 0.65, expectedResponseKey: 'escalation_request', isAmbiguous: false, notes: 'Not a customer' },
  { id: 'EC-071', category: 'edge', clientMessage: 'Me hacen factura electrónica?', expectedIntent: 'GENERAL_QUESTION', expectedConfidence: 0.78, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'EC-072', category: 'edge', clientMessage: 'Tienen Instagram?', expectedIntent: 'GENERAL_QUESTION', expectedConfidence: 0.78, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'EC-073', category: 'edge', clientMessage: 'Cuántas tallas manejan?', expectedIntent: 'GENERAL_QUESTION', expectedConfidence: 0.78, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'EC-074', category: 'edge', clientMessage: 'Puedo ir a ver muestras?', expectedIntent: 'SCHEDULE_PICKUP', expectedConfidence: 0.72, expectedResponseKey: 'schedule_pickup', isAmbiguous: true },
  { id: 'EC-075', category: 'edge', clientMessage: 'Mi hijo necesita un uniforme escolar', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.78, expectedResponseKey: 'new_order_vague', isAmbiguous: false },
  { id: 'EC-076', category: 'edge', clientMessage: 'No me contestaron el email que les mandé', expectedIntent: 'STATUS_CHECK', expectedConfidence: 0.75, expectedResponseKey: 'clarification_order', isAmbiguous: true },
  { id: 'EC-077', category: 'edge', clientMessage: 'Tengo una idea pero no sé explicarla bien', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.65, expectedResponseKey: 'new_order_vague', isAmbiguous: true },
  { id: 'EC-078', category: 'edge', clientMessage: '.', expectedIntent: 'UNKNOWN', expectedConfidence: 0.10, expectedResponseKey: 'clarification_intent', isAmbiguous: true },
  { id: 'EC-079', category: 'edge', clientMessage: 'Ok gracias, luego les escribo', expectedIntent: 'THANK_YOU', expectedConfidence: 0.82, expectedResponseKey: 'thank_you_response', isAmbiguous: false },
  { id: 'EC-080', category: 'edge', clientMessage: 'Hola! Cuánto por esto? *foto adjunta*', expectedIntent: 'PRICING_QUESTION', expectedConfidence: 0.82, expectedResponseKey: 'pricing_general', isAmbiguous: false },
  { id: 'EC-081', category: 'edge', clientMessage: 'Quiero lo mismo que el pedido anterior pero azul', expectedIntent: 'NEW_ORDER', expectedConfidence: 0.82, expectedResponseKey: 'new_order_vague', isAmbiguous: true },
  { id: 'EC-082', category: 'edge', clientMessage: 'Disculpen la hora, pero mi jefe quiere esto para mañana', expectedIntent: 'URGENT_REQUEST', expectedConfidence: 0.85, expectedResponseKey: 'urgent_ack', extractedData: { urgency: 'urgent' }, isAmbiguous: false },
]

// ── Combinar todos los escenarios ───────────────────────────────────────────

export const CONVERSATION_TRAINING: ConversationTraining[] = [
  ...STATUS_SCENARIOS,
  ...NEW_ORDER_SCENARIOS,
  ...DESIGN_SCENARIOS,
  ...COMPLAINT_SCENARIOS,
  ...PAYMENT_SCENARIOS,
  ...DELIVERY_SCENARIOS,
  ...PRICING_SCENARIOS,
  ...GREETING_SCENARIOS,
  ...CANCEL_SCENARIOS,
  ...EDGE_CASE_SCENARIOS,
]

// ── Funciones de busqueda y test ────────────────────────────────────────────

/** Buscar escenarios de entrenamiento por categoría */
export function getTrainingByCategory(category: string): ConversationTraining[] {
  return CONVERSATION_TRAINING.filter((s) => s.category === category)
}

/** Buscar escenarios de entrenamiento por intent */
export function getTrainingByIntent(intent: IntentType): ConversationTraining[] {
  return CONVERSATION_TRAINING.filter((s) => s.expectedIntent === intent)
}

/** Buscar escenarios ambiguos */
export function getAmbiguousScenarios(): ConversationTraining[] {
  return CONVERSATION_TRAINING.filter((s) => s.isAmbiguous)
}

/**
 * Ejecuta el test de precision del motor de comunicacion contra
 * los datos de entrenamiento. Retorna estadisticas de acierto.
 */
export async function testCommunicationAccuracy(): Promise<{
  totalTests: number
  correct: number
  accuracy: number
  intentAccuracy: Record<string, { total: number; correct: number; rate: number }>
  failures: Array<{
    id: string
    expected: string
    got: string
    message: string
    confidence: number
  }>
}> {
  const failures: Array<{
    id: string
    expected: string
    got: string
    message: string
    confidence: number
  }> = []

  const intentStats: Record<string, { total: number; correct: number }> = {}
  let correct = 0

  for (const scenario of CONVERSATION_TRAINING) {
    // Skip empty messages and very ambiguous edge cases for accuracy test
    if (!scenario.clientMessage || scenario.clientMessage.length === 0) {
      continue
    }

    try {
      const result = await clientCommunicationEngine.parseClientMessage(
        scenario.clientMessage,
        { channel: 'whatsapp' },
      )

      // Inicializar stats de intent si no existen
      if (!intentStats[scenario.expectedIntent]) {
        intentStats[scenario.expectedIntent] = { total: 0, correct: 0 }
      }
      intentStats[scenario.expectedIntent]!.total++

      if (result.type === scenario.expectedIntent) {
        correct++
        intentStats[scenario.expectedIntent]!.correct++
      } else {
        failures.push({
          id: scenario.id,
          expected: scenario.expectedIntent,
          got: result.type,
          message: scenario.clientMessage,
          confidence: result.confidence,
        })
      }
    } catch {
      failures.push({
        id: scenario.id,
        expected: scenario.expectedIntent,
        got: 'ERROR',
        message: scenario.clientMessage,
        confidence: 0,
      })
    }
  }

  const totalTests = CONVERSATION_TRAINING.filter(
    (s) => s.clientMessage && s.clientMessage.length > 0,
  ).length

  // Calcular accuracy por intent
  const intentAccuracy: Record<string, { total: number; correct: number; rate: number }> = {}
  for (const [intent, stats] of Object.entries(intentStats)) {
    intentAccuracy[intent] = {
      ...stats,
      rate: stats.total > 0 ? Math.round((stats.correct / stats.total) * 10000) / 100 : 0,
    }
  }

  return {
    totalTests,
    correct,
    accuracy: totalTests > 0 ? Math.round((correct / totalTests) * 10000) / 100 : 0,
    intentAccuracy,
    failures,
  }
}

/** Obtener estadisticas de los datos de entrenamiento */
export function getTrainingStats(): {
  total: number
  byCategory: Record<string, number>
  byIntent: Record<string, number>
  ambiguous: number
  clear: number
} {
  const byCategory: Record<string, number> = {}
  const byIntent: Record<string, number> = {}
  let ambiguous = 0

  for (const s of CONVERSATION_TRAINING) {
    byCategory[s.category] = (byCategory[s.category] ?? 0) + 1
    byIntent[s.expectedIntent] = (byIntent[s.expectedIntent] ?? 0) + 1
    if (s.isAmbiguous) ambiguous++
  }

  return {
    total: CONVERSATION_TRAINING.length,
    byCategory,
    byIntent,
    ambiguous,
    clear: CONVERSATION_TRAINING.length - ambiguous,
  }
}
