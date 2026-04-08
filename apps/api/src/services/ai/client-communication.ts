import { getDatabase } from '@voneb/database'

// ─────────────────────────────────────────────────────────────────────────────
// Motor de Comunicacion con Clientes
// Procesa TODOS los mensajes de clientes (WhatsApp, email, telefono, presencial)
// Detecta intencion, extrae datos y genera respuestas inteligentes en
// espanol costarricense con tono profesional y calido.
// ─────────────────────────────────────────────────────────────────────────────

// ── Interfaces ──────────────────────────────────────────────────────────────

export type IntentType =
  | 'STATUS_CHECK'
  | 'NEW_ORDER'
  | 'DESIGN_APPROVAL'
  | 'DESIGN_REJECTION'
  | 'DESIGN_CHANGE_REQUEST'
  | 'COMPLAINT'
  | 'PAYMENT_CONFIRMATION'
  | 'DELIVERY_INQUIRY'
  | 'PRICING_QUESTION'
  | 'GENERAL_QUESTION'
  | 'GREETING'
  | 'THANK_YOU'
  | 'URGENT_REQUEST'
  | 'CANCELLATION'
  | 'MODIFICATION_REQUEST'
  | 'FILE_SENT'
  | 'SCHEDULE_PICKUP'
  | 'UNKNOWN'

export interface ClientIntent {
  type: IntentType
  confidence: number
  extractedData: {
    orderNumber?: string
    productType?: string
    quantity?: number
    urgency?: 'normal' | 'urgent'
    sentiment?: 'positive' | 'neutral' | 'negative' | 'angry'
    fileAttached?: boolean
    paymentMethod?: string
    deliveryPreference?: string
  }
  rawMessage: string
  ambiguityLevel: 'clear' | 'somewhat_ambiguous' | 'very_ambiguous'
  needsClarification: boolean
  clarificationQuestion?: string
}

export interface ClientContext {
  clientId?: string
  clientName?: string
  workOrderId?: string
  channel: 'whatsapp' | 'email' | 'phone' | 'in_person'
  previousMessages?: string[]
  activeOrders?: Array<{
    id: string
    workOrderNumber: string
    status: string
    productType?: string
  }>
  lastDesignSent?: boolean
  awaitingPayment?: boolean
}

export interface ClientResponse {
  message: string
  actions: string[]
  followUp?: {
    delayHours: number
    message: string
    condition: string
  }
  attachments?: string[]
  internalNote?: string
  escalateToHuman?: boolean
  escalationReason?: string
}

// ── Slang costarricense para parseo ─────────────────────────────────────────

const CR_SLANG: Record<string, string[]> = {
  // Positivo / aprobacion
  tuanis: ['good', 'approved', 'ok'],
  'pura vida': ['great', 'thanks', 'greeting'],
  jale: ['lets_go', 'approved', 'proceed'],
  dale: ['ok', 'approved', 'proceed'],
  'de una': ['immediately', 'approved', 'yes'],
  'está bien': ['approved', 'ok'],
  perfecto: ['approved'],
  listo: ['approved', 'ready'],
  va: ['ok', 'approved'],
  'todo bien': ['approved', 'ok'],
  buenísimo: ['approved'],
  genial: ['approved'],
  excelente: ['approved'],
  bacán: ['approved', 'good'],

  // Negativo / rechazo
  'no me cuadra': ['not_satisfied', 'change_request'],
  'no me gusta': ['rejection', 'change_request'],
  'está feo': ['rejection'],
  'mae no': ['rejection'],
  'diay no': ['rejection', 'unsure'],
  'qué pereza': ['complaint', 'frustration'],
  'está chunche': ['low_quality', 'complaint'],
  'no sirve': ['rejection', 'complaint'],
  malísimo: ['rejection', 'complaint'],
  'qué cochinada': ['complaint', 'angry'],

  // Urgencia
  urgente: ['urgent'],
  'ya mismo': ['urgent', 'immediately'],
  'para ayer': ['very_urgent'],
  'es pa ya': ['urgent'],
  'ocupo ya': ['urgent', 'need_now'],
  'necesito rápido': ['urgent'],
  'es para mañana': ['urgent'],
  apúrense: ['urgent'],

  // Saludo
  mae: ['informal_greeting', 'attention'],
  buenas: ['greeting'],
  'qué tal': ['greeting'],
  'cómo estamos': ['greeting'],
  'qué me cuenta': ['greeting', 'status_check'],

  // Consulta de estado
  'cómo va eso': ['status_check'],
  'ya está': ['status_check'],
  'qué hay de lo mío': ['status_check'],
  'y mi pedido': ['status_check'],
  'falta mucho': ['status_check', 'urgency'],
  'cómo va mi encargo': ['status_check'],

  // Pago
  'ya le deposité': ['payment_confirmation'],
  'ya hice el SINPE': ['payment_confirmation'],
  'le paso el comprobante': ['payment_confirmation'],
  'cuánto es': ['pricing_question'],
  'cuánto sale': ['pricing_question'],
  'qué precio': ['pricing_question'],
  'cuánto me cobra': ['pricing_question'],

  // Pedido
  'necesito unas varas': ['new_order', 'vague'],
  'quiero encargar': ['new_order'],
  'me puede hacer': ['new_order'],
  'cuánto me sale': ['pricing_question', 'new_order'],
  ocupo: ['need', 'new_order'],
  'quiero pedir': ['new_order'],
  'me cotiza': ['pricing_question', 'new_order'],
}

// ── Patrones de intencion ───────────────────────────────────────────────────

interface IntentPattern {
  type: IntentType
  patterns: RegExp[]
  keywords: string[]
  baseConfidence: number
}

const INTENT_PATTERNS: IntentPattern[] = [
  {
    type: 'GREETING',
    patterns: [
      /^hola\b/i,
      /^buenas?\b/i,
      /^buenos?\s+(d[ií]as?|tardes?|noches?)/i,
      /^qu[eé]\s+tal/i,
      /^mae\b/i,
      /^buen[ao]s?\s+(d[ií]as?|tardes?|noches?)/i,
      /^hey\b/i,
      /^hi\b/i,
    ],
    keywords: ['hola', 'buenas', 'buenos', 'saludos', 'hey'],
    baseConfidence: 0.95,
  },
  {
    type: 'STATUS_CHECK',
    patterns: [
      /c[oó]mo\s+va\s+(mi|el|la|lo)/i,
      /estado\s+de\s+(mi|el|la)/i,
      /ya\s+est[aá]\s+list/i,
      /cu[aá]ndo\s+(est[aá]|lo|me|va)/i,
      /falta\s+mucho/i,
      /qu[eé]\s+hay\s+de\s+(lo\s+m[ií]o|mi)/i,
      /y\s+mi\s+(pedido|orden|encargo)/i,
      /sigo\s+esperando/i,
      /por\s+qu[eé]\s+se\s+tarda/i,
      /ya\s+me\s+mandaron/i,
      /tienen\s+noticias/i,
      /alg[uú]n\s+avance/i,
      /\?\s*$/,
    ],
    keywords: [
      'estado', 'pedido', 'orden', 'listo', 'avance', 'esperando',
      'falta', 'tarda', 'cuándo', 'noticias', 'encargo',
    ],
    baseConfidence: 0.85,
  },
  {
    type: 'NEW_ORDER',
    patterns: [
      /necesito\s+\d+/i,
      /quiero\s+(pedir|encargar|hacer|ordenar)/i,
      /me\s+puede(n)?\s+hacer/i,
      /ocupo\s+\d+/i,
      /quiero\s+\d+/i,
      /hag[aá]n?me\s+\d+/i,
      /quisiera\s+(pedir|encargar)/i,
      /me\s+interesa(n)?\s+(unas?|unos?|las?|los?)/i,
    ],
    keywords: [
      'necesito', 'quiero', 'encargar', 'pedido nuevo', 'ocupo',
      'ordenar', 'cotización', 'cotizar',
    ],
    baseConfidence: 0.85,
  },
  {
    type: 'DESIGN_APPROVAL',
    patterns: [
      /aprueb[oa]/i,
      /aprob(ado|ada)/i,
      /me\s+gusta/i,
      /est[aá]\s+(perfecto|bien|tuanis|genial|excelente|lindo|bonito)/i,
      /as[ií]\s+(est[aá]\s+bien|me\s+gusta|d[eé]jelo)/i,
      /^dale$/i,
      /^va$/i,
      /^listo$/i,
      /^de una$/i,
      /^jale$/i,
      /^sí$/i,
      /^si$/i,
      /^ok$/i,
      /^👍$/,
      /manden?\s*a\s*(produccion|imprimir|hacer)/i,
    ],
    keywords: [
      'apruebo', 'aprobado', 'gusta', 'perfecto', 'bien',
      'excelente', 'tuanis', 'dale', 'producción',
    ],
    baseConfidence: 0.80,
  },
  {
    type: 'DESIGN_REJECTION',
    patterns: [
      /no\s+me\s+gusta/i,
      /est[aá]\s+feo/i,
      /no\s+lo\s+apruebo/i,
      /rech(azo|azado|azada)/i,
      /no\s+es\s+lo\s+que\s+ped[ií]/i,
      /nada\s+que\s+ver/i,
    ],
    keywords: ['no gusta', 'feo', 'rechazo', 'rechazado', 'horrible'],
    baseConfidence: 0.88,
  },
  {
    type: 'DESIGN_CHANGE_REQUEST',
    patterns: [
      /cambi(ar|e|en)\s+(el|la|los|las)/i,
      /puede(n)?\s+(cambiar|mover|ajustar|modificar)/i,
      /m[aá]s\s+(grande|peque[nñ]o|claro|oscuro|a la|arriba|abajo)/i,
      /casi[\s,]+pero/i,
      /no\s+me\s+convence/i,
      /le\s+falta/i,
      /podr[ií]a(n)?\s+(ser|estar)/i,
      /otro\s+color/i,
      /diferente/i,
    ],
    keywords: [
      'cambiar', 'mover', 'ajustar', 'modificar', 'otro color',
      'más grande', 'más pequeño', 'diferente', 'cambio',
    ],
    baseConfidence: 0.82,
  },
  {
    type: 'COMPLAINT',
    patterns: [
      /no\s+era\s+lo\s+que\s+ped[ií]/i,
      /el\s+color\s+(est[aá]\s+)?mal/i,
      /se\s+(est[aá]\s+)?(despega|pelando|rompiendo|deshaciendo)/i,
      /talla\s+(equivocada|incorrecta|mal)/i,
      /quiero\s+(mi\s+)?dinero/i,
      /est[aá]\s+(mal|da[nñ]ado|roto|manchado)/i,
      /qu[eé]\s+porquer[ií]a/i,
      /qu[eé]\s+cochinada/i,
      /inaceptable/i,
      /devoluci[oó]n/i,
      /reclamo/i,
    ],
    keywords: [
      'mal', 'dañado', 'roto', 'manchado', 'equivocado', 'queja',
      'reclamo', 'devolución', 'devolver', 'inaceptable',
    ],
    baseConfidence: 0.85,
  },
  {
    type: 'PAYMENT_CONFIRMATION',
    patterns: [
      /ya\s+(le\s+)?(deposit[eé]|pagu[eé]|transfer[ií]|hice\s+el\s+SINPE)/i,
      /comprobante/i,
      /recibo\s+de\s+pago/i,
      /le\s+paso\s+el\s+(comprobante|recibo)/i,
      /ya\s+cancel[eé]/i,
      /hice\s+(la\s+)?transferencia/i,
      /SINPE/i,
    ],
    keywords: [
      'deposité', 'pagué', 'transferí', 'SINPE', 'comprobante',
      'recibo', 'transferencia', 'pago',
    ],
    baseConfidence: 0.88,
  },
  {
    type: 'DELIVERY_INQUIRY',
    patterns: [
      /cu[aá]ndo\s+(me\s+)?lo\s+env[ií]an/i,
      /puedo\s+recoger/i,
      /hacen\s+env[ií]o/i,
      /cu[aá]nto\s+sale\s+el\s+env[ií]o/i,
      /me\s+lo\s+pueden\s+(enviar|mandar|dejar)/i,
      /d[oó]nde\s+lo\s+recojo/i,
      /env[ií]o\s+a/i,
      /recoger\s+(en|el)/i,
    ],
    keywords: [
      'envío', 'enviar', 'recoger', 'entrega', 'delivery',
      'mandar', 'correo', 'mensajería',
    ],
    baseConfidence: 0.87,
  },
  {
    type: 'PRICING_QUESTION',
    patterns: [
      /cu[aá]nto\s+(cuesta|vale|sale|cobra|es)/i,
      /qu[eé]\s+precio/i,
      /precio\s+de/i,
      /dan\s+descuento/i,
      /es\s+(muy\s+)?caro/i,
      /tienen\s+promoci[oó]n/i,
      /cu[aá]nto\s+por\s+\d+/i,
      /me\s+cotiza/i,
    ],
    keywords: [
      'precio', 'cuesta', 'vale', 'cotización', 'descuento',
      'promoción', 'caro', 'barato', 'cotizar',
    ],
    baseConfidence: 0.90,
  },
  {
    type: 'CANCELLATION',
    patterns: [
      /quiero\s+cancelar/i,
      /ya\s+no\s+(lo\s+)?necesito/i,
      /cancel(ar|e|en)\s+(el|mi|la)/i,
      /se\s+cancel[oó]\s+(el\s+)?evento/i,
      /me\s+devuelven\s+(la\s+)?plata/i,
      /no\s+quiero\s+el\s+pedido/i,
    ],
    keywords: ['cancelar', 'cancelación', 'devolver', 'ya no'],
    baseConfidence: 0.88,
  },
  {
    type: 'THANK_YOU',
    patterns: [
      /gracias/i,
      /muchas\s+gracias/i,
      /se\s+los?\s+agradezco/i,
      /excelente\s+servicio/i,
      /muy\s+amable/i,
      /bendiciones/i,
    ],
    keywords: ['gracias', 'agradezco', 'amable', 'bendiciones'],
    baseConfidence: 0.92,
  },
  {
    type: 'URGENT_REQUEST',
    patterns: [
      /es\s+urgente/i,
      /lo\s+necesito\s+(ya|hoy|para\s+ma[nñ]ana)/i,
      /para\s+ayer/i,
      /es\s+pa\s+ya/i,
      /ap[uú]r(ese|ense)/i,
      /emergencia/i,
    ],
    keywords: ['urgente', 'emergencia', 'ya', 'rápido', 'apúrense'],
    baseConfidence: 0.90,
  },
  {
    type: 'FILE_SENT',
    patterns: [
      /ah[ií]\s+(le|les)\s+(mando|env[ií]o|va)/i,
      /le\s+(adjunto|env[ií]o|mando)\s+(el|la|un)/i,
      /ah[ií]\s+va\s+(el|la|mi)/i,
      /foto/i,
      /archivo/i,
      /logo/i,
      /imagen/i,
    ],
    keywords: ['adjunto', 'archivo', 'foto', 'imagen', 'logo', 'envío'],
    baseConfidence: 0.75,
  },
  {
    type: 'SCHEDULE_PICKUP',
    patterns: [
      /paso\s+(a\s+recoger|ma[nñ]ana|hoy|el\s+lunes)/i,
      /puedo\s+pasar\s+(hoy|ma[nñ]ana|el)/i,
      /a\s+qu[eé]\s+hora\s+(puedo|abren|cierran)/i,
      /horario\s+de\s+atenci[oó]n/i,
      /cu[aá]ndo\s+puedo\s+ir/i,
    ],
    keywords: ['recoger', 'pasar', 'horario', 'tienda', 'ir'],
    baseConfidence: 0.85,
  },
  {
    type: 'MODIFICATION_REQUEST',
    patterns: [
      /cambiar\s+(la\s+)?cantidad/i,
      /agregar\s+(m[aá]s|\d+)/i,
      /quitar\s+\d+/i,
      /cambiar\s+(a|el|la)\s+talla/i,
      /en\s+vez\s+de/i,
      /cambiar\s+el\s+pedido/i,
    ],
    keywords: ['cambiar', 'agregar', 'quitar', 'modificar', 'en vez de'],
    baseConfidence: 0.82,
  },
  {
    type: 'GENERAL_QUESTION',
    patterns: [
      /qu[eé]\s+hacen/i,
      /qu[eé]\s+productos/i,
      /qu[eé]\s+servicios/i,
      /d[oó]nde\s+est[aá]n/i,
      /tienen\s+p[aá]gina/i,
      /tienen\s+cat[aá]logo/i,
      /c[oó]mo\s+funciona/i,
      /qu[eé]\s+materiales/i,
    ],
    keywords: ['productos', 'servicios', 'catálogo', 'ubicación', 'materiales'],
    baseConfidence: 0.80,
  },
]

// ── Templates de respuesta ──────────────────────────────────────────────────

const RESPONSE_TEMPLATES: Record<string, string> = {
  // Estado del pedido
  status_in_design:
    'Hola {nombre}! Su pedido {orden} esta en diseno. El disenador ya esta trabajando en el. Le avisamos cuando este listo para su aprobacion 🎨',
  status_awaiting_approval:
    'Su pedido {orden} tiene el diseno listo! Esta pendiente de su aprobacion. Se lo reenvio?',
  status_in_production:
    'Su pedido {orden} ya entro a produccion! Esta en la etapa de {etapa}. Estimamos tenerlo listo el {fecha} 📦',
  status_ready:
    'Excelente noticia! Su pedido {orden} ya esta listo. Prefiere que se lo enviemos o pasa a recogerlo? 📦✅',
  status_shipped:
    'Su pedido {orden} ya va en camino! Estimamos que llega el {fecha} 🚚',
  status_not_found:
    'No encontre un pedido con esa referencia. Me puede confirmar el numero de orden? Lo busco rapidito 🔍',
  status_multiple:
    'Hola {nombre}! Tiene {count} pedidos activos:\n{orderList}\nCual le interesa?',

  // Nuevos pedidos
  new_order_confirm:
    'Perfecto! Para su pedido de {cantidad} {producto}, necesitariamos:\n1. Su logo en formato PNG o AI (alta resolucion)\n2. Colores deseados\n3. Tallas\nNos puede enviar esa informacion?',
  new_order_need_files:
    'Con gusto! Para iniciar su pedido necesitamos el archivo de su logo. Lo puede enviar en formato PNG, AI o PDF? Resolucion minima 300 DPI para mejor calidad 🎨',
  new_order_received:
    'Recibido! Su pedido {orden} ha sido registrado:\n- {cantidad}x {producto}\n- Estimado: {fecha}\nLe enviaremos el diseno para su aprobacion pronto ✅',
  new_order_vague:
    'Con gusto le ayudo! Para darle una cotizacion necesito:\n1. Que producto le interesa? (jerseys, mangas, gorras, etc.)\n2. Cuantas unidades?\n3. Lleva diseno personalizado?\nCuenteme!',

  // Aprobacion de diseno
  design_sent:
    'Hola {nombre}! El diseno de su pedido {orden} esta listo para revision. Que le parece? Si esta bien, me confirma y lo mandamos a produccion 🎨',
  design_approved_ack:
    'Perfecto! Diseno aprobado ✅ Su pedido {orden} entra a produccion ahora. Le avisamos cuando este listo!',
  design_revision_ack:
    'Entendido, hacemos los cambios. Me puede detallar que le gustaria diferente? Asi el disenador lo ajusta exactamente como usted quiere 🎨',
  design_rejected_ack:
    'Entendido. Quiere que replanteemos el diseno desde cero o prefiere indicarnos que ajustes hacer?',

  // Quejas
  complaint_ack:
    'Lamento mucho el inconveniente {nombre}. Voy a revisar su pedido {orden} inmediatamente. Me puede describir el problema con mas detalle o enviar una foto? Lo resolvemos lo antes posible 🙏',
  complaint_generic:
    'Lamento mucho escuchar eso. Cuenteme exactamente que sucedio y su numero de orden para poder ayudarle lo antes posible 🙏',
  complaint_resolved:
    'Hola {nombre}! Ya revisamos su caso. {resolucion}. Disculpe las molestias, queremos que quede 100% satisfecho ✅',

  // Pagos
  payment_received:
    'Pago recibido! ✅ Muchas gracias {nombre}. Su pedido {orden} ya esta confirmado.',
  payment_pending:
    'Su pedido {orden} esta pendiente de pago. El total es {monto}. Puede pagar por:\n- SINPE Movil: {telefono}\n- Transferencia: {cuenta}\nTiene alguna duda?',
  payment_need_confirmation:
    'Gracias! Para verificar el pago, me puede enviar el comprobante o captura de pantalla?',

  // Entregas
  delivery_options:
    'Su pedido esta listo! Como prefiere recibirlo?\n1. 📍 Recoger en tienda (sin costo)\n2. 🚚 Envio ({costo_envio})\nSolo digame y lo coordinamos',
  delivery_pickup_scheduled:
    'Perfecto! Lo esperamos en la tienda. Horario: Lunes a Viernes 9am-6pm, Sabado 9am-12pm. Recuerde su numero de orden: {orden} 📍',
  delivery_shipping_info:
    'Hacemos envio a todo el pais! El costo varia segun la zona. A donde seria el envio?',

  // Precios
  pricing_info:
    'Con gusto! Los precios varian segun el producto y cantidad. Para {producto}:\n- 1-10 unidades: {precio_individual} c/u\n- 11-50 unidades: {precio_mayoreo} c/u\n- 50+ unidades: Cotizacion especial\nLe interesa alguna cantidad especifica?',
  pricing_general:
    'Los precios dependen del producto, cantidad y personalizacion. Que producto le interesa? Asi le doy un precio exacto 💰',
  pricing_discount:
    'Claro! Manejamos descuentos por volumen. Cuantas unidades necesita? Asi le doy el mejor precio posible.',

  // Clarificacion
  clarification_order:
    'Disculpe, no estoy seguro de entender. Me podria indicar su numero de orden? Lo encuentro rapidito 🔍',
  clarification_intent:
    'Hola! En que le puedo ayudar? Puedo:\n1. 📋 Ver el estado de un pedido\n2. 🆕 Hacer un pedido nuevo\n3. 💰 Consultar precios\n4. 📦 Coordinar entrega\nSolo digame!',
  clarification_design:
    'Me confirma si el diseno esta aprobado o si quiere algun cambio? Asi avanzamos con su pedido ✅',
  clarification_context:
    'Disculpe, me podria dar un poco mas de contexto? Asi le ayudo mejor.',

  // Saludos
  greeting_new:
    'Hola! Bienvenido/a a V ONE B 🎽 En que le podemos ayudar?',
  greeting_returning:
    'Hola {nombre}! Gusto de saludarle. En que le puedo ayudar hoy?',
  greeting_with_active_order:
    'Hola {nombre}! Veo que tiene un pedido activo ({orden}, {estado}). Quiere saber como va o necesita algo mas?',

  // Agradecimiento
  thank_you_response:
    'A la orden! Si necesita algo mas, aqui estamos. Que tenga un excelente dia! ✅',
  thank_you_with_feedback:
    'Muchas gracias por su confianza! Si le gusto nuestro trabajo, nos encantaria que nos recomiende 🙏',

  // Urgente
  urgent_ack:
    'Entendido, es urgente. Voy a priorizar su solicitud inmediatamente. Un momento por favor ⚡',
  urgent_with_order:
    'Entendido, marco su pedido {orden} como urgente. El equipo lo va a priorizar ⚡',

  // Cancelacion
  cancel_confirm:
    'Entendido. Para cancelar el pedido {orden} necesito confirmar con el equipo. Me puede indicar el motivo? Lo proceso lo mas rapido posible.',
  cancel_in_production:
    'Su pedido {orden} ya esta en produccion. La cancelacion en esta etapa puede tener un costo. Desea que consulte con el supervisor las opciones?',
  cancel_no_order:
    'Para procesar la cancelacion necesito el numero de orden. Me lo puede indicar?',

  // Archivos
  file_received:
    'Archivo recibido! ✅ Lo paso al equipo de diseno. Le avisamos cuando tengamos el mockup listo.',
  file_need_better:
    'Recibimos su archivo, pero la resolucion es muy baja para impresion. Tiene una version en mayor resolucion (minimo 300 DPI)? Formatos ideales: PNG, AI, PDF vectorial 🎨',

  // Seguimientos
  followup_approval_reminder:
    'Hola {nombre}! Le recordamos que el diseno de su pedido {orden} esta pendiente de aprobacion. Tuvo oportunidad de revisarlo? 🎨',
  followup_payment_reminder:
    'Hola {nombre}! Su pedido {orden} esta pendiente de pago ({monto}). Necesita los datos de pago nuevamente?',
  followup_pickup_reminder:
    'Hola {nombre}! Su pedido {orden} esta listo para recoger en tienda. Cuando pasa por el? 📦',
  followup_feedback:
    'Hola {nombre}! Recibio su pedido {orden} bien? Nos encantaria saber si quedo satisfecho 🙏',

  // Horarios y pickup
  schedule_pickup:
    'Perfecto! Nuestro horario es Lunes a Viernes 9am-6pm, Sabado 9am-12pm. Cuando le queda bien pasar? 📍',

  // Escalamiento
  escalation_angry:
    'Entiendo su frustracion y me disculpo sinceramente. Voy a escalar su caso con nuestro supervisor para resolverlo lo antes posible. Le contacta en breve.',
  escalation_request:
    'Claro, le comunico con un asesor. Un momento por favor.',
}

// ── Patrones para extraccion de datos ───────────────────────────────────────

const ORDER_NUMBER_PATTERNS = [
  /VB-\d{6}-\d{4}/i,
  /\b0*(\d{1,5})\b/,
  /orden\s*#?\s*(\d+)/i,
  /pedido\s*#?\s*(\d+)/i,
  /numero\s*(\d+)/i,
]

const QUANTITY_PATTERN = /(\d+)\s*(unidades?|mangas?|jerseys?|gorras?|camisetas?|piezas?|playeras?)/i
const PRODUCT_TYPES = [
  'manga', 'mangas', 'jersey', 'jerseys', 'gorra', 'gorras',
  'camiseta', 'camisetas', 'playera', 'playeras', 'short', 'shorts',
  'licra', 'licras', 'uniforme', 'uniformes', 'sudadera', 'sudaderas',
  'chaleco', 'chalecos', 'top', 'tops',
]

// ── Status labels en espanol ────────────────────────────────────────────────

const STATUS_LABELS: Record<string, string> = {
  RECIBIDO: 'recibido',
  ORDEN_CONFIRMADA: 'confirmado',
  EN_COLA_DISENO: 'en cola de diseno',
  EN_DISENO: 'en diseno',
  DISENO_EN_REVISION: 'diseno en revision',
  ESPERANDO_APROBACION_CLIENTE: 'esperando su aprobacion',
  APROBADO_PARA_PRODUCCION: 'aprobado para produccion',
  EN_IMPRESION: 'en impresion',
  EN_CORTE: 'en corte',
  EN_ARMADO: 'en armado',
  EN_CONTROL_CALIDAD: 'en control de calidad',
  EN_EMPAQUE: 'en empaque',
  LISTO_PARA_ENTREGA: 'listo para entrega',
  EN_ENVIO: 'en envio',
  ENTREGADO: 'entregado',
  CERRADO: 'cerrado',
  CANCELADO: 'cancelado',
}

// ── Clase principal ─────────────────────────────────────────────────────────

class ClientCommunicationEngine {
  // ─── Core: Entender que quiere el cliente ──────────────────────────────

  /**
   * Parsea CUALQUIER mensaje de cliente y extrae la intencion.
   * Funciona con WhatsApp, email, transcripciones de voz, etc.
   */
  async parseClientMessage(
    message: string,
    context?: {
      clientId?: string
      workOrderId?: string
      channel: 'whatsapp' | 'email' | 'phone' | 'in_person'
      previousMessages?: string[]
    },
  ): Promise<ClientIntent> {
    const normalized = this.normalizeMessage(message)
    const sentiment = this.detectSentiment(normalized)
    const urgency = this.detectUrgency(normalized)

    // Extraer datos del mensaje
    const orderNumber = this.extractOrderNumber(normalized)
    const quantity = this.extractQuantity(normalized)
    const productType = this.extractProductType(normalized)
    const paymentMethod = this.extractPaymentMethod(normalized)
    const deliveryPreference = this.extractDeliveryPreference(normalized)
    const fileAttached = this.detectFileReference(normalized)

    // Detectar intencion por patrones
    let bestIntent: IntentType = 'UNKNOWN'
    let bestConfidence = 0

    for (const pattern of INTENT_PATTERNS) {
      let score = 0

      // Verificar patrones regex
      for (const regex of pattern.patterns) {
        if (regex.test(normalized)) {
          score = Math.max(score, pattern.baseConfidence)
          break
        }
      }

      // Verificar keywords
      const keywordMatches = pattern.keywords.filter((kw) =>
        normalized.toLowerCase().includes(kw.toLowerCase()),
      ).length
      if (keywordMatches > 0) {
        const keywordScore = Math.min(
          pattern.baseConfidence,
          0.5 + keywordMatches * 0.15,
        )
        score = Math.max(score, keywordScore)
      }

      // Verificar slang costarricense
      for (const [slang, meanings] of Object.entries(CR_SLANG)) {
        if (normalized.toLowerCase().includes(slang)) {
          const relevantMeaning = this.slangMatchesIntent(meanings, pattern.type)
          if (relevantMeaning) {
            score = Math.max(score, pattern.baseConfidence * 0.9)
          }
        }
      }

      if (score > bestConfidence) {
        bestConfidence = score
        bestIntent = pattern.type
      }
    }

    // Contexto: usar mensajes previos para desambiguar
    if (context?.previousMessages && context.previousMessages.length > 0) {
      const contextAdjusted = this.adjustIntentWithContext(
        bestIntent,
        bestConfidence,
        normalized,
        context.previousMessages,
        context.workOrderId,
      )
      bestIntent = contextAdjusted.type
      bestConfidence = contextAdjusted.confidence
    }

    // Casos especiales: mensajes muy cortos o emojis
    if (normalized.length <= 3 || /^[👍👎❤️😡🙏✅]+$/.test(normalized.trim())) {
      const emojiResult = this.interpretEmoji(
        normalized.trim(),
        context?.previousMessages,
        context?.workOrderId,
      )
      if (emojiResult.confidence > bestConfidence) {
        bestIntent = emojiResult.type
        bestConfidence = emojiResult.confidence
      }
    }

    // Determinar nivel de ambiguedad
    let ambiguityLevel: 'clear' | 'somewhat_ambiguous' | 'very_ambiguous' = 'clear'
    if (bestConfidence < 0.5) ambiguityLevel = 'very_ambiguous'
    else if (bestConfidence < 0.75) ambiguityLevel = 'somewhat_ambiguous'

    const needsClarification = bestConfidence < 0.6 || bestIntent === 'UNKNOWN'
    let clarificationQuestion: string | undefined

    if (needsClarification) {
      clarificationQuestion = this.generateClarificationQuestion(
        normalized,
        bestIntent,
        context,
      )
    }

    return {
      type: bestIntent,
      confidence: Math.round(bestConfidence * 100) / 100,
      extractedData: {
        orderNumber: orderNumber ?? undefined,
        productType: productType ?? undefined,
        quantity: quantity ?? undefined,
        urgency,
        sentiment,
        fileAttached,
        paymentMethod: paymentMethod ?? undefined,
        deliveryPreference: deliveryPreference ?? undefined,
      },
      rawMessage: message,
      ambiguityLevel,
      needsClarification,
      clarificationQuestion,
    }
  }

  /**
   * Genera la respuesta perfecta basada en intencion + contexto.
   * Consulta datos reales del sistema antes de responder.
   */
  async generateResponse(
    intent: ClientIntent,
    context: ClientContext,
  ): Promise<ClientResponse> {
    switch (intent.type) {
      case 'STATUS_CHECK':
        return this.handleStatusInquiry(
          context.clientId ?? '',
          intent.extractedData.orderNumber,
        )
      case 'NEW_ORDER':
        return this.handleNewOrderRequest(intent.rawMessage, context.clientId)
      case 'DESIGN_APPROVAL':
        return this.handleDesignResponse(intent.rawMessage, context.workOrderId ?? '')
      case 'DESIGN_REJECTION':
        return this.handleDesignResponse(intent.rawMessage, context.workOrderId ?? '')
      case 'DESIGN_CHANGE_REQUEST':
        return this.handleDesignResponse(intent.rawMessage, context.workOrderId ?? '')
      case 'COMPLAINT':
        return this.handleComplaint(intent.rawMessage, context.clientId ?? '')
      case 'PAYMENT_CONFIRMATION':
        return this.handlePaymentConfirmation(intent.rawMessage, context.clientId ?? '')
      case 'DELIVERY_INQUIRY':
        return this.handleDeliveryInquiry(context.clientId ?? '')
      case 'PRICING_QUESTION':
        return this.handlePricingQuestion(intent.rawMessage)
      case 'CANCELLATION':
        return this.handleCancellation(intent, context)
      case 'GREETING':
        return this.handleGreeting(context)
      case 'THANK_YOU':
        return this.handleThankYou(context)
      case 'URGENT_REQUEST':
        return this.handleUrgentRequest(intent, context)
      case 'FILE_SENT':
        return this.handleFileSent(context)
      case 'SCHEDULE_PICKUP':
        return this.handleSchedulePickup(context)
      case 'MODIFICATION_REQUEST':
        return this.handleModificationRequest(intent, context)
      case 'GENERAL_QUESTION':
        return this.handleGeneralQuestion(intent.rawMessage)
      default:
        return this.handleUnknown(intent, context)
    }
  }

  // ─── Handlers especificos ─────────────────────────────────────────────

  async handleStatusInquiry(
    clientId: string,
    orderRef?: string,
  ): Promise<ClientResponse> {
    const db = getDatabase()

    // Si tenemos referencia de orden, buscar directamente
    if (orderRef) {
      const order = await db.workOrder.findFirst({
        where: {
          OR: [
            { workOrderNumber: { contains: orderRef } },
            { id: orderRef },
          ],
        },
        select: {
          id: true,
          workOrderNumber: true,
          status: true,
          promisedDate: true,
          customer: { select: { firstName: true, lastName: true } },
        },
      })

      if (order) {
        const statusLabel = STATUS_LABELS[order.status] ?? order.status
        const nombre = order.customer?.firstName ?? ''
        const fecha = order.promisedDate
          ? order.promisedDate.toLocaleDateString('es-CR')
          : 'por confirmar'

        const templateKey = this.getStatusTemplate(order.status)
        const message = this.fillTemplate(RESPONSE_TEMPLATES[templateKey] ?? RESPONSE_TEMPLATES['status_in_production']!, {
          nombre,
          orden: order.workOrderNumber,
          estado: statusLabel,
          etapa: statusLabel,
          fecha,
        })

        return {
          message,
          actions: ['log_status_inquiry'],
          followUp: order.status === 'ESPERANDO_APROBACION_CLIENTE'
            ? {
                delayHours: 24,
                message: this.fillTemplate(RESPONSE_TEMPLATES['followup_approval_reminder']!, { nombre, orden: order.workOrderNumber }),
                condition: 'if no response',
              }
            : undefined,
        }
      }

      return {
        message: RESPONSE_TEMPLATES['status_not_found']!,
        actions: ['log_status_inquiry_not_found'],
      }
    }

    // Sin referencia: buscar pedidos activos del cliente
    if (clientId) {
      const orders = await db.workOrder.findMany({
        where: {
          customerId: clientId,
          status: { notIn: ['CERRADO', 'CANCELADO', 'ENTREGADO'] },
        },
        select: {
          workOrderNumber: true,
          status: true,
          promisedDate: true,
        },
        orderBy: { createdAt: 'desc' },
        take: 5,
      })

      if (orders.length === 1) {
        const order = orders[0]!
        const statusLabel = STATUS_LABELS[order.status] ?? order.status
        const fecha = order.promisedDate
          ? order.promisedDate.toLocaleDateString('es-CR')
          : 'por confirmar'

        const templateKey = this.getStatusTemplate(order.status)
        return {
          message: this.fillTemplate(RESPONSE_TEMPLATES[templateKey] ?? RESPONSE_TEMPLATES['status_in_production']!, {
            orden: order.workOrderNumber,
            estado: statusLabel,
            etapa: statusLabel,
            fecha,
          }),
          actions: ['log_status_inquiry'],
        }
      }

      if (orders.length > 1) {
        const orderList = orders
          .map((o) => `- ${o.workOrderNumber}: ${STATUS_LABELS[o.status] ?? o.status}`)
          .join('\n')
        return {
          message: this.fillTemplate(RESPONSE_TEMPLATES['status_multiple']!, {
            count: String(orders.length),
            orderList,
          }),
          actions: ['log_status_inquiry_multiple'],
        }
      }
    }

    return {
      message: RESPONSE_TEMPLATES['clarification_order']!,
      actions: ['log_status_inquiry_no_match'],
    }
  }

  async handleNewOrderRequest(
    message: string,
    clientId?: string,
  ): Promise<ClientResponse> {
    const normalized = this.normalizeMessage(message)
    const quantity = this.extractQuantity(normalized)
    const productType = this.extractProductType(normalized)

    if (quantity && productType) {
      return {
        message: this.fillTemplate(RESPONSE_TEMPLATES['new_order_confirm']!, {
          cantidad: String(quantity),
          producto: productType,
        }),
        actions: ['create_draft_order', 'request_design_files'],
        internalNote: `Cliente solicita ${quantity} ${productType}. Pendiente: archivos de diseno.`,
      }
    }

    if (productType && !quantity) {
      return {
        message: `Con gusto! Cuantas unidades de ${productType} necesita?`,
        actions: ['log_new_order_inquiry'],
      }
    }

    return {
      message: RESPONSE_TEMPLATES['new_order_vague']!,
      actions: ['log_new_order_vague'],
    }
  }

  async handleComplaint(
    message: string,
    clientId: string,
  ): Promise<ClientResponse> {
    const sentiment = this.detectSentiment(message)
    const orderNumber = this.extractOrderNumber(message)

    // Si esta muy enojado, escalar
    if (sentiment === 'angry') {
      return {
        message: RESPONSE_TEMPLATES['escalation_angry']!,
        actions: ['create_incident', 'notify_supervisor', 'log_complaint'],
        escalateToHuman: true,
        escalationReason: 'Cliente enojado — sentimiento: angry',
        internalNote: `QUEJA URGENTE: Cliente ${clientId} enojado. Mensaje: "${message.substring(0, 200)}"`,
      }
    }

    if (orderNumber) {
      return {
        message: this.fillTemplate(RESPONSE_TEMPLATES['complaint_ack']!, {
          orden: orderNumber,
        }),
        actions: ['create_incident', 'log_complaint'],
        internalNote: `Queja sobre orden ${orderNumber}: "${message.substring(0, 200)}"`,
      }
    }

    return {
      message: RESPONSE_TEMPLATES['complaint_generic']!,
      actions: ['log_complaint'],
      internalNote: `Queja general: "${message.substring(0, 200)}"`,
    }
  }

  async handleDesignResponse(
    message: string,
    workOrderId: string,
  ): Promise<ClientResponse> {
    const normalized = this.normalizeMessage(message)
    const isApproval = this.isDesignApproval(normalized)
    const isRejection = this.isDesignRejection(normalized)

    if (isApproval) {
      return {
        message: this.fillTemplate(RESPONSE_TEMPLATES['design_approved_ack']!, {
          orden: workOrderId,
        }),
        actions: ['approve_design', 'move_to_production', 'log_design_response'],
        internalNote: 'Cliente aprobo el diseno. Mover a produccion.',
      }
    }

    if (isRejection) {
      return {
        message: RESPONSE_TEMPLATES['design_rejected_ack']!,
        actions: ['reject_design', 'log_design_response'],
        internalNote: `Cliente rechazo el diseno: "${message.substring(0, 200)}"`,
      }
    }

    // Change request
    return {
      message: RESPONSE_TEMPLATES['design_revision_ack']!,
      actions: ['request_design_revision', 'log_design_response'],
      internalNote: `Cliente solicita cambios: "${message.substring(0, 200)}"`,
    }
  }

  async handlePaymentConfirmation(
    message: string,
    clientId: string,
  ): Promise<ClientResponse> {
    const paymentMethod = this.extractPaymentMethod(message)

    return {
      message: RESPONSE_TEMPLATES['payment_need_confirmation']!,
      actions: ['log_payment_claim', 'notify_accounting'],
      internalNote: `Cliente reporta pago${paymentMethod ? ` por ${paymentMethod}` : ''}. Verificar.`,
      followUp: {
        delayHours: 2,
        message: 'Ya pudimos verificar su pago! ✅ Todo en orden.',
        condition: 'if payment verified',
      },
    }
  }

  async handleDeliveryInquiry(clientId: string): Promise<ClientResponse> {
    if (!clientId) {
      return {
        message: RESPONSE_TEMPLATES['delivery_shipping_info']!,
        actions: ['log_delivery_inquiry'],
      }
    }

    const db = getDatabase()
    const readyOrders = await db.workOrder.findMany({
      where: {
        customerId: clientId,
        status: 'LISTO_PARA_ENTREGA',
      },
      select: { workOrderNumber: true },
      take: 3,
    })

    if (readyOrders.length > 0) {
      return {
        message: this.fillTemplate(RESPONSE_TEMPLATES['delivery_options']!, {
          costo_envio: 'segun zona',
        }),
        actions: ['log_delivery_inquiry'],
      }
    }

    return {
      message: RESPONSE_TEMPLATES['delivery_shipping_info']!,
      actions: ['log_delivery_inquiry'],
    }
  }

  async handlePricingQuestion(message: string): Promise<ClientResponse> {
    const productType = this.extractProductType(message)
    const quantity = this.extractQuantity(message)

    if (productType) {
      return {
        message: this.fillTemplate(RESPONSE_TEMPLATES['pricing_info']!, {
          producto: productType,
          precio_individual: 'consultar',
          precio_mayoreo: 'consultar',
        }),
        actions: ['log_pricing_inquiry'],
      }
    }

    if (quantity) {
      return {
        message: RESPONSE_TEMPLATES['pricing_discount']!,
        actions: ['log_pricing_inquiry'],
      }
    }

    return {
      message: RESPONSE_TEMPLATES['pricing_general']!,
      actions: ['log_pricing_inquiry'],
    }
  }

  async handleGeneralQuestion(message: string): Promise<ClientResponse> {
    return {
      message:
        'V ONE B es una marca de ropa deportiva personalizada en Costa Rica. Hacemos jerseys, mangas, gorras, y mas con su diseno. Quiere saber precios o hacer un pedido? 🎽',
      actions: ['log_general_question'],
    }
  }

  // ─── Handlers adicionales ─────────────────────────────────────────────

  private async handleCancellation(
    intent: ClientIntent,
    context: ClientContext,
  ): Promise<ClientResponse> {
    const orderNumber = intent.extractedData.orderNumber

    if (!orderNumber && !context.workOrderId) {
      return {
        message: RESPONSE_TEMPLATES['cancel_no_order']!,
        actions: ['log_cancellation_request'],
      }
    }

    const ref = orderNumber ?? context.workOrderId ?? ''

    // Verificar si esta en produccion
    const db = getDatabase()
    const order = await db.workOrder.findFirst({
      where: {
        OR: [
          { workOrderNumber: { contains: ref } },
          { id: ref },
        ],
      },
      select: { status: true, workOrderNumber: true },
    })

    if (order) {
      const inProduction = [
        'EN_IMPRESION', 'EN_CORTE', 'EN_ARMADO',
        'EN_CONTROL_CALIDAD', 'EN_EMPAQUE',
      ].includes(order.status)

      if (inProduction) {
        return {
          message: this.fillTemplate(RESPONSE_TEMPLATES['cancel_in_production']!, {
            orden: order.workOrderNumber,
          }),
          actions: ['log_cancellation_request', 'notify_supervisor'],
          escalateToHuman: true,
          escalationReason: 'Solicitud de cancelacion con orden en produccion',
        }
      }

      return {
        message: this.fillTemplate(RESPONSE_TEMPLATES['cancel_confirm']!, {
          orden: order.workOrderNumber,
        }),
        actions: ['log_cancellation_request', 'process_cancellation'],
      }
    }

    return {
      message: RESPONSE_TEMPLATES['cancel_no_order']!,
      actions: ['log_cancellation_request'],
    }
  }

  private async handleGreeting(context: ClientContext): Promise<ClientResponse> {
    if (context.clientName && context.activeOrders && context.activeOrders.length > 0) {
      const order = context.activeOrders[0]!
      const statusLabel = STATUS_LABELS[order.status] ?? order.status
      return {
        message: this.fillTemplate(RESPONSE_TEMPLATES['greeting_with_active_order']!, {
          nombre: context.clientName,
          orden: order.workOrderNumber,
          estado: statusLabel,
        }),
        actions: ['log_greeting'],
      }
    }

    if (context.clientName) {
      return {
        message: this.fillTemplate(RESPONSE_TEMPLATES['greeting_returning']!, {
          nombre: context.clientName,
        }),
        actions: ['log_greeting'],
      }
    }

    return {
      message: RESPONSE_TEMPLATES['greeting_new']!,
      actions: ['log_greeting'],
    }
  }

  private async handleThankYou(context: ClientContext): Promise<ClientResponse> {
    return {
      message: RESPONSE_TEMPLATES['thank_you_response']!,
      actions: ['log_thank_you'],
    }
  }

  private async handleUrgentRequest(
    intent: ClientIntent,
    context: ClientContext,
  ): Promise<ClientResponse> {
    if (context.workOrderId || intent.extractedData.orderNumber) {
      return {
        message: this.fillTemplate(RESPONSE_TEMPLATES['urgent_with_order']!, {
          orden: intent.extractedData.orderNumber ?? context.workOrderId ?? '',
        }),
        actions: ['mark_urgent', 'notify_supervisor', 'log_urgent_request'],
        internalNote: 'Cliente solicita urgencia. Priorizar.',
      }
    }

    return {
      message: RESPONSE_TEMPLATES['urgent_ack']!,
      actions: ['log_urgent_request'],
    }
  }

  private async handleFileSent(context: ClientContext): Promise<ClientResponse> {
    return {
      message: RESPONSE_TEMPLATES['file_received']!,
      actions: ['process_attachment', 'log_file_received'],
    }
  }

  private async handleSchedulePickup(context: ClientContext): Promise<ClientResponse> {
    return {
      message: RESPONSE_TEMPLATES['schedule_pickup']!,
      actions: ['log_pickup_inquiry'],
    }
  }

  private async handleModificationRequest(
    intent: ClientIntent,
    context: ClientContext,
  ): Promise<ClientResponse> {
    const orderRef = intent.extractedData.orderNumber ?? context.workOrderId

    if (orderRef) {
      return {
        message: `Entendido, quiere modificar el pedido ${orderRef}. Me detalla que cambio necesita? Asi lo coordino con el equipo.`,
        actions: ['log_modification_request', 'notify_team'],
        internalNote: `Solicitud de modificacion en orden ${orderRef}: "${intent.rawMessage.substring(0, 200)}"`,
      }
    }

    return {
      message: 'Para modificar un pedido necesito el numero de orden. Me lo puede indicar?',
      actions: ['log_modification_request'],
    }
  }

  private async handleUnknown(
    intent: ClientIntent,
    context: ClientContext,
  ): Promise<ClientResponse> {
    // Si tiene clarificacion sugerida, usarla
    if (intent.clarificationQuestion) {
      return {
        message: intent.clarificationQuestion,
        actions: ['log_unknown_intent'],
        internalNote: `Mensaje no clasificado (confianza: ${intent.confidence}): "${intent.rawMessage.substring(0, 200)}"`,
      }
    }

    return {
      message: RESPONSE_TEMPLATES['clarification_intent']!,
      actions: ['log_unknown_intent'],
    }
  }

  // ─── Metodos internos ─────────────────────────────────────────────────

  /** Normaliza el mensaje: quita acentos extras, espacios, etc. */
  private normalizeMessage(message: string): string {
    return message
      .trim()
      .replace(/\s+/g, ' ')
      .replace(/[""]/g, '"')
      .replace(/['']/g, "'")
  }

  /** Detecta sentimiento del mensaje */
  private detectSentiment(
    message: string,
  ): 'positive' | 'neutral' | 'negative' | 'angry' {
    const lower = message.toLowerCase()

    const angryWords = [
      'porquería', 'cochinada', 'inaceptable', 'basura', 'inútil',
      'estafa', 'robo', 'incompetentes', 'nunca más', 'demanda',
      'estúpido', 'idiota', 'asco', '😡', '🤬',
    ]
    if (angryWords.some((w) => lower.includes(w))) return 'angry'

    const negativeWords = [
      'mal', 'feo', 'no me gusta', 'decepcionado', 'molesto',
      'tardó', 'atrasado', 'problema', 'error', 'queja',
      'reclamo', 'no sirve', 'dañado', 'roto',
    ]
    if (negativeWords.some((w) => lower.includes(w))) return 'negative'

    const positiveWords = [
      'excelente', 'perfecto', 'genial', 'tuanis', 'pura vida',
      'me encanta', 'buenísimo', 'gracias', 'feliz', 'contento',
      'increíble', 'bacán', '❤️', '👍', '😍',
    ]
    if (positiveWords.some((w) => lower.includes(w))) return 'positive'

    return 'neutral'
  }

  /** Detecta si el mensaje es urgente */
  private detectUrgency(message: string): 'normal' | 'urgent' {
    const lower = message.toLowerCase()
    const urgentWords = [
      'urgente', 'ya mismo', 'para ayer', 'es pa ya', 'ocupo ya',
      'emergencia', 'apúrense', 'rápido', 'hoy mismo',
      'lo necesito hoy', 'para mañana', 'necesito rápido',
    ]
    return urgentWords.some((w) => lower.includes(w)) ? 'urgent' : 'normal'
  }

  /** Extrae numero de orden del mensaje */
  private extractOrderNumber(message: string): string | null {
    for (const pattern of ORDER_NUMBER_PATTERNS) {
      const match = message.match(pattern)
      if (match) {
        // Si es formato completo VB-XXXXXX-XXXX
        if (match[0]?.startsWith('VB-') || match[0]?.startsWith('vb-')) {
          return match[0].toUpperCase()
        }
        // Si es solo un numero, formatearlo
        const num = match[1] ?? match[0]
        if (num && /^\d+$/.test(num)) {
          return num.padStart(4, '0')
        }
      }
    }
    return null
  }

  /** Extrae cantidad del mensaje */
  private extractQuantity(message: string): number | null {
    const match = message.match(QUANTITY_PATTERN)
    if (match && match[1]) return parseInt(match[1], 10)

    // Buscar patrones simples como "necesito 50"
    const simpleMatch = message.match(/(necesito|quiero|ocupo|dame|hagame)\s+(\d+)/i)
    if (simpleMatch && simpleMatch[2]) return parseInt(simpleMatch[2], 10)

    return null
  }

  /** Extrae tipo de producto del mensaje */
  private extractProductType(message: string): string | null {
    const lower = message.toLowerCase()
    for (const type of PRODUCT_TYPES) {
      if (lower.includes(type)) return type
    }
    return null
  }

  /** Extrae metodo de pago del mensaje */
  private extractPaymentMethod(message: string): string | null {
    const lower = message.toLowerCase()
    if (lower.includes('sinpe')) return 'SINPE'
    if (lower.includes('transferencia')) return 'transferencia'
    if (lower.includes('tarjeta')) return 'tarjeta'
    if (lower.includes('efectivo')) return 'efectivo'
    if (lower.includes('deposito') || lower.includes('depósito')) return 'depósito'
    return null
  }

  /** Extrae preferencia de entrega del mensaje */
  private extractDeliveryPreference(message: string): string | null {
    const lower = message.toLowerCase()
    if (lower.includes('recoger') || lower.includes('paso a') || lower.includes('tienda')) {
      return 'recoger'
    }
    if (lower.includes('enviar') || lower.includes('envío') || lower.includes('mandar')) {
      return 'enviar'
    }
    return null
  }

  /** Detecta si el mensaje hace referencia a un archivo */
  private detectFileReference(message: string): boolean {
    const lower = message.toLowerCase()
    const fileWords = [
      'adjunto', 'archivo', 'foto', 'imagen', 'logo',
      'png', 'jpg', 'pdf', 'ai', '.ai', '.pdf', '.png',
      'le mando', 'le envío', 'ahí va', 'ahí le va',
    ]
    return fileWords.some((w) => lower.includes(w))
  }

  /** Verifica si un significado de slang coincide con un tipo de intencion */
  private slangMatchesIntent(meanings: string[], intentType: IntentType): boolean {
    const intentMapping: Record<string, IntentType[]> = {
      approved: ['DESIGN_APPROVAL'],
      ok: ['DESIGN_APPROVAL', 'GREETING'],
      greeting: ['GREETING'],
      thanks: ['THANK_YOU'],
      status_check: ['STATUS_CHECK'],
      rejection: ['DESIGN_REJECTION'],
      change_request: ['DESIGN_CHANGE_REQUEST'],
      complaint: ['COMPLAINT'],
      urgent: ['URGENT_REQUEST'],
      payment_confirmation: ['PAYMENT_CONFIRMATION'],
      new_order: ['NEW_ORDER'],
      pricing_question: ['PRICING_QUESTION'],
      need: ['NEW_ORDER'],
    }

    for (const meaning of meanings) {
      const mappedIntents = intentMapping[meaning]
      if (mappedIntents && mappedIntents.includes(intentType)) {
        return true
      }
    }
    return false
  }

  /** Ajusta la intencion usando contexto de mensajes previos */
  private adjustIntentWithContext(
    currentIntent: IntentType,
    currentConfidence: number,
    message: string,
    previousMessages: string[],
    workOrderId?: string,
  ): { type: IntentType; confidence: number } {
    const lastMessage = previousMessages[previousMessages.length - 1]?.toLowerCase() ?? ''
    const lower = message.toLowerCase()

    // "ok" o "si" o "👍" despues de enviar diseno → aprobacion
    if (
      (lower === 'ok' || lower === 'si' || lower === 'sí' || lower === '👍' || lower === 'dale' || lower === 'va') &&
      (lastMessage.includes('diseño') || lastMessage.includes('diseno') ||
       lastMessage.includes('aprobación') || lastMessage.includes('aprobacion') ||
       lastMessage.includes('mockup') || lastMessage.includes('qué le parece'))
    ) {
      return { type: 'DESIGN_APPROVAL', confidence: 0.88 }
    }

    // "ok" o "si" despues de pedir pago → confirmacion de pago
    if (
      (lower === 'ok' || lower === 'si' || lower === 'sí' || lower === 'listo') &&
      (lastMessage.includes('pago') || lastMessage.includes('sinpe') ||
       lastMessage.includes('transferencia') || lastMessage.includes('total'))
    ) {
      return { type: 'PAYMENT_CONFIRMATION', confidence: 0.72 }
    }

    // Si hay workOrderId activo y dice algo corto positivo, probablemente es sobre el diseno
    if (
      workOrderId &&
      (lower === 'ok' || lower === 'va' || lower === 'dale' || lower === '👍') &&
      currentConfidence < 0.7
    ) {
      return { type: 'DESIGN_APPROVAL', confidence: 0.75 }
    }

    return { type: currentIntent, confidence: currentConfidence }
  }

  /** Interpreta emojis y mensajes muy cortos */
  private interpretEmoji(
    message: string,
    previousMessages?: string[],
    workOrderId?: string,
  ): { type: IntentType; confidence: number } {
    const hasDesignContext = previousMessages?.some((m) => {
      const lower = m.toLowerCase()
      return lower.includes('diseño') || lower.includes('diseno') || lower.includes('mockup')
    })

    switch (message) {
      case '👍':
        return hasDesignContext
          ? { type: 'DESIGN_APPROVAL', confidence: 0.90 }
          : { type: 'DESIGN_APPROVAL', confidence: 0.60 }
      case '👎':
        return hasDesignContext
          ? { type: 'DESIGN_REJECTION', confidence: 0.88 }
          : { type: 'DESIGN_REJECTION', confidence: 0.55 }
      case '❤️':
        return { type: 'DESIGN_APPROVAL', confidence: 0.80 }
      case '😡':
        return { type: 'COMPLAINT', confidence: 0.70 }
      case '🙏':
        return { type: 'THANK_YOU', confidence: 0.75 }
      case '✅':
        return hasDesignContext
          ? { type: 'DESIGN_APPROVAL', confidence: 0.92 }
          : { type: 'DESIGN_APPROVAL', confidence: 0.65 }
      case '?':
        return { type: 'STATUS_CHECK', confidence: 0.50 }
      case 'ok':
      case 'OK':
        return hasDesignContext
          ? { type: 'DESIGN_APPROVAL', confidence: 0.80 }
          : { type: 'UNKNOWN', confidence: 0.30 }
      default:
        return { type: 'UNKNOWN', confidence: 0.20 }
    }
  }

  /** Genera pregunta de clarificacion basada en contexto */
  private generateClarificationQuestion(
    message: string,
    partialIntent: IntentType,
    context?: {
      clientId?: string
      workOrderId?: string
      channel: 'whatsapp' | 'email' | 'phone' | 'in_person'
      previousMessages?: string[]
    },
  ): string {
    // Si hay workOrderId, preguntar sobre el diseno
    if (context?.workOrderId) {
      return RESPONSE_TEMPLATES['clarification_design']!
    }

    // Si mencionan algo de pedido pero no hay numero
    if (
      partialIntent === 'STATUS_CHECK' ||
      message.toLowerCase().includes('pedido') ||
      message.toLowerCase().includes('orden')
    ) {
      return RESPONSE_TEMPLATES['clarification_order']!
    }

    // Generico
    return RESPONSE_TEMPLATES['clarification_intent']!
  }

  /** Determina si el mensaje es una aprobacion de diseno */
  private isDesignApproval(message: string): boolean {
    const lower = message.toLowerCase()
    const approvalWords = [
      'apruebo', 'aprobado', 'me gusta', 'perfecto', 'está bien',
      'dale', 'va', 'listo', 'de una', 'jale', 'tuanis',
      'excelente', 'genial', 'si', 'sí', 'ok', 'buenísimo',
      'manden a producción', 'manden a produccion',
      'así está bien', 'asi esta bien',
    ]
    return approvalWords.some((w) => lower.includes(w))
  }

  /** Determina si el mensaje es un rechazo de diseno */
  private isDesignRejection(message: string): boolean {
    const lower = message.toLowerCase()
    const rejectionWords = [
      'no me gusta', 'está feo', 'rechazo', 'rechazado',
      'no lo apruebo', 'horrible', 'malísimo', 'nada que ver',
      'no es lo que pedí',
    ]
    return rejectionWords.some((w) => lower.includes(w))
  }

  /** Obtiene la template correcta segun el estado */
  private getStatusTemplate(status: string): string {
    const map: Record<string, string> = {
      EN_COLA_DISENO: 'status_in_design',
      EN_DISENO: 'status_in_design',
      DISENO_EN_REVISION: 'status_in_design',
      ESPERANDO_APROBACION_CLIENTE: 'status_awaiting_approval',
      APROBADO_PARA_PRODUCCION: 'status_in_production',
      EN_IMPRESION: 'status_in_production',
      EN_CORTE: 'status_in_production',
      EN_ARMADO: 'status_in_production',
      EN_CONTROL_CALIDAD: 'status_in_production',
      EN_EMPAQUE: 'status_in_production',
      LISTO_PARA_ENTREGA: 'status_ready',
      EN_ENVIO: 'status_shipped',
      ENTREGADO: 'status_shipped',
    }
    return map[status] ?? 'status_in_production'
  }

  /** Llena una template con variables */
  private fillTemplate(
    template: string,
    vars: Record<string, string>,
  ): string {
    let result = template
    for (const [key, value] of Object.entries(vars)) {
      result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value)
    }
    // Limpiar variables no reemplazadas
    result = result.replace(/\{[^}]+\}/g, '')
    return result.trim()
  }
}

/** Singleton del motor de comunicacion con clientes */
export const clientCommunicationEngine = new ClientCommunicationEngine()
