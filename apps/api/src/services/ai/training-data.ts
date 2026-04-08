import { memoryStore } from './memory-store.js'

// ─────────────────────────────────────────────────────────────────────────────
// Training Data: 200+ escenarios pre-cargados para el cerebro AI MTO
// La IA arranca sabiendo todo esto. No necesita aprender desde cero.
// Cada escenario es conocimiento experto de produccion textil en Costa Rica.
// ─────────────────────────────────────────────────────────────────────────────

export interface TrainingScenario {
  id: string
  category:
    | 'production'
    | 'quality'
    | 'design'
    | 'delivery'
    | 'client'
    | 'machine'
    | 'material'
    | 'optimization'
  trigger: string
  condition: string
  action: string
  severity: 'INFO' | 'WARNING' | 'CRITICAL'
  confidence: number
  description_es: string
}

// ─────────────────────────────────────────────────────────────────────────────
// PRODUCTION ERRORS (55 escenarios)
// ─────────────────────────────────────────────────────────────────────────────

const PRODUCTION_SCENARIOS: TrainingScenario[] = [
  {
    id: 'PROD-001',
    category: 'production',
    trigger: 'sublimation_temperature_high',
    condition: 'Temperatura de sublimacion > 210°C',
    action: 'Detener prensa, reducir a 195-205°C, verificar pieza actual',
    severity: 'CRITICAL',
    confidence: 0.95,
    description_es:
      'Temperatura de sublimacion demasiado alta. Los colores se van a correr y manchar la tela. Detener inmediatamente y ajustar a 195-205°C.',
  },
  {
    id: 'PROD-002',
    category: 'production',
    trigger: 'sublimation_temperature_low',
    condition: 'Temperatura de sublimacion < 185°C',
    action: 'Subir temperatura a 195-205°C, re-prensar pieza si colores palidos',
    severity: 'WARNING',
    confidence: 0.92,
    description_es:
      'Temperatura de sublimacion muy baja. Los colores salen palidos y deslavados. Subir a rango 195-205°C.',
  },
  {
    id: 'PROD-003',
    category: 'production',
    trigger: 'vinyl_press_time_exceeded',
    condition: 'Tiempo de prensa de vinilo > 18 segundos en HTV basico',
    action: 'Retirar inmediatamente, verificar si el material se quemo',
    severity: 'CRITICAL',
    confidence: 0.97,
    description_es:
      'Tiempo de prensa de vinilo excedido. El material se puede quemar o derretir. Retirar pieza y verificar estado del vinilo.',
  },
  {
    id: 'PROD-004',
    category: 'production',
    trigger: 'vinyl_press_time_insufficient',
    condition: 'Tiempo de prensa de vinilo < 10 segundos en HTV basico',
    action: 'Re-prensar por tiempo correcto (12-15s), verificar adherencia',
    severity: 'WARNING',
    confidence: 0.90,
    description_es:
      'Tiempo de prensa de vinilo insuficiente. El vinilo no va a adherir bien y se va a despegar al lavar. Re-prensar.',
  },
  {
    id: 'PROD-005',
    category: 'production',
    trigger: 'wrong_fabric_type',
    condition: 'Tipo de tela escaneada no coincide con orden de trabajo',
    action: 'DETENER produccion. Verificar tela correcta con supervisor. Todo el lote puede estar mal.',
    severity: 'CRITICAL',
    confidence: 0.99,
    description_es:
      'Tela incorrecta cargada en la estacion. Si se continua, todo el lote sale mal. Verificar con orden de trabajo.',
  },
  {
    id: 'PROD-006',
    category: 'production',
    trigger: 'print_head_misaligned',
    condition: 'Desviacion de cabezal de impresion > 1mm',
    action: 'Ejecutar alineacion de cabezal, imprimir patron de prueba',
    severity: 'WARNING',
    confidence: 0.88,
    description_es:
      'Cabezal de impresion desalineado. El diseno sale corrido o con lineas fantasma. Ejecutar rutina de alineacion.',
  },
  {
    id: 'PROD-007',
    category: 'production',
    trigger: 'ink_levels_low',
    condition: 'Nivel de tinta < 15% en cualquier cartucho durante impresion',
    action: 'Pausar impresion, cambiar cartucho antes de que se agote completamente',
    severity: 'WARNING',
    confidence: 0.93,
    description_es:
      'Tinta baja durante impresion. Si se agota a mitad de trabajo, la pieza sale con inconsistencia de color.',
  },
  {
    id: 'PROD-008',
    category: 'production',
    trigger: 'thread_tension_wrong',
    condition: 'Tension de hilo fuera de rango (muy flojo o muy tenso)',
    action: 'Detener costura, ajustar tensor, probar en retazo antes de continuar',
    severity: 'WARNING',
    confidence: 0.89,
    description_es:
      'Tension de hilo incorrecta. Costuras arrugadas (muy tenso) o flojas (muy suelto). Ajustar tensor y probar.',
  },
  {
    id: 'PROD-009',
    category: 'production',
    trigger: 'needle_wrong_gauge',
    condition: 'Calibre de aguja no corresponde al tipo de tela',
    action: 'Cambiar aguja al calibre correcto: lycra=70/10, jersey=80/12, dryfit=75/11',
    severity: 'WARNING',
    confidence: 0.91,
    description_es:
      'Aguja de calibre incorrecto para esta tela. Puede hacer hoyos visibles o romper hilos. Cambiar aguja.',
  },
  {
    id: 'PROD-010',
    category: 'production',
    trigger: 'cutting_blade_dull',
    condition: 'Cuchilla de corte con > 500 cortes sin cambio o bordes deshilachados',
    action: 'Cambiar cuchilla, verificar ultimas piezas cortadas por bordes deshilachados',
    severity: 'WARNING',
    confidence: 0.87,
    description_es:
      'Cuchilla de corte desgastada. Los bordes salen deshilachados e irregulares. Cambiar cuchilla y revisar ultimas piezas.',
  },
  {
    id: 'PROD-011',
    category: 'production',
    trigger: 'cutting_alignment_off',
    condition: 'Alineacion de corte desviada > 3mm del patron',
    action: 'Recalibrar cortadora, verificar si piezas cortadas estan dentro de tolerancia',
    severity: 'CRITICAL',
    confidence: 0.94,
    description_es:
      'Corte desalineado. Las piezas quedan de tamano incorrecto. Recalibrar la cortadora.',
  },
  {
    id: 'PROD-012',
    category: 'production',
    trigger: 'heat_press_not_preheated',
    condition: 'Prensa termica usada sin pre-calentamiento completo',
    action: 'Esperar pre-calentamiento completo (5-8 min). La pieza actual puede tener transferencia desigual.',
    severity: 'WARNING',
    confidence: 0.86,
    description_es:
      'Prensa no pre-calentada. La transferencia queda desigual: unos areas con color y otras sin. Esperar calentamiento.',
  },
  {
    id: 'PROD-013',
    category: 'production',
    trigger: 'fabric_wrong_direction',
    condition: 'Tela cargada en orientacion incorrecta (trama/urdimbre invertida)',
    action: 'Retirar tela, recargar en orientacion correcta. La pieza actual esta arruinada.',
    severity: 'CRITICAL',
    confidence: 0.96,
    description_es:
      'Tela cargada en direccion incorrecta. El estampado o corte queda invertido/torcido. Recargar correctamente.',
  },
  {
    id: 'PROD-014',
    category: 'production',
    trigger: 'wrong_size_template',
    condition: 'Plantilla de talla incorrecta usada para corte',
    action: 'DETENER CORTE. Verificar plantilla contra orden. Todas las piezas cortadas con esta plantilla estan mal.',
    severity: 'CRITICAL',
    confidence: 0.98,
    description_es:
      'Plantilla de talla equivocada. Todas las piezas cortadas quedan de talla incorrecta. Detener y verificar.',
  },
  {
    id: 'PROD-015',
    category: 'production',
    trigger: 'embroidery_hoop_loose',
    condition: 'Bastidor de bordado con juego > 2mm',
    action: 'Reapretar bastidor, verificar tension. El diseno puede salir estirado o descentrado.',
    severity: 'WARNING',
    confidence: 0.85,
    description_es:
      'Bastidor de bordado suelto. El diseno se estira y deforma. Reapretar antes de continuar.',
  },
  {
    id: 'PROD-016',
    category: 'production',
    trigger: 'dtg_nozzle_clogged',
    condition: 'Boquilla de impresora DTG parcialmente obstruida',
    action: 'Ejecutar ciclo de limpieza, imprimir patron nozzle check, repetir si persiste',
    severity: 'WARNING',
    confidence: 0.90,
    description_es:
      'Boquilla DTG obstruida. Salen lineas blancas o puntos sin tinta en la impresion. Ejecutar limpieza.',
  },
  {
    id: 'PROD-017',
    category: 'production',
    trigger: 'screen_exposure_incorrect',
    condition: 'Pantalla de serigrafia con exposicion incorrecta',
    action: 'Rehacer pantalla con tiempo de exposicion correcto. La actual produce bordes borrosos.',
    severity: 'WARNING',
    confidence: 0.88,
    description_es:
      'Pantalla de serigrafia mal expuesta. El estampado sale borroso o con bordes irregulares. Rehacer pantalla.',
  },
  {
    id: 'PROD-018',
    category: 'production',
    trigger: 'fabric_shrinkage_not_accounted',
    condition: 'Tela de poliester no pre-encogida antes de sublimacion',
    action: 'Pre-encoger tela (200°C por 30s) o ajustar patron +3-5% para compensar',
    severity: 'WARNING',
    confidence: 0.87,
    description_es:
      'No se compenso el encogimiento de la tela. El producto final queda mas pequeno de lo esperado. Pre-encoger o ajustar patron.',
  },
  {
    id: 'PROD-019',
    category: 'production',
    trigger: 'color_profile_mismatch',
    condition: 'Perfil de color ICC no corresponde a la combinacion tinta/tela',
    action: 'Cargar perfil ICC correcto para esta tela. Los colores van a salir desviados.',
    severity: 'WARNING',
    confidence: 0.91,
    description_es:
      'Perfil de color incorrecto. Los colores impresos no van a coincidir con el diseno original. Verificar perfil ICC.',
  },
  {
    id: 'PROD-020',
    category: 'production',
    trigger: 'transfer_paper_wrong_side',
    condition: 'Papel transfer colocado al reves en la prensa',
    action: 'Retirar inmediatamente. La tinta se transfiere a la prensa en vez de la tela.',
    severity: 'CRITICAL',
    confidence: 0.97,
    description_es:
      'Papel transfer al reves. La tinta se va a pegar a la prensa y no a la tela. Retirar y colocar correctamente.',
  },
  {
    id: 'PROD-021',
    category: 'production',
    trigger: 'sublimation_pressure_low',
    condition: 'Presion de prensa de sublimacion insuficiente',
    action: 'Ajustar presion a nivel medio-alto. Presion baja = transferencia parcial y fantasma.',
    severity: 'WARNING',
    confidence: 0.86,
    description_es:
      'Presion de sublimacion baja. La imagen se transfiere parcialmente y queda "fantasma". Aumentar presion.',
  },
  {
    id: 'PROD-022',
    category: 'production',
    trigger: 'sublimation_paper_shift',
    condition: 'Papel de sublimacion se movio durante prensado',
    action: 'La pieza tiene imagen doble/borrosa. Desechar o marcar como defectuosa. Usar cinta termica para fijar.',
    severity: 'CRITICAL',
    confidence: 0.95,
    description_es:
      'Papel se movio durante sublimacion. La imagen queda doble o borrosa. Pieza defectuosa. Usar cinta termica para fijar.',
  },
  {
    id: 'PROD-023',
    category: 'production',
    trigger: 'overlock_thread_break',
    condition: 'Hilo de overlock se rompe durante costura',
    action: 'Reenhebrar, verificar tension y calidad del hilo. Revisar costura atras para encontrar donde se rompio.',
    severity: 'WARNING',
    confidence: 0.84,
    description_es:
      'Hilo de overlock roto. La costura queda abierta en ese punto. Reenhebrar y verificar costura anterior.',
  },
  {
    id: 'PROD-024',
    category: 'production',
    trigger: 'wrong_seam_allowance',
    condition: 'Margen de costura diferente al especificado en patron',
    action: 'Verificar guia de costura. Margen incorrecto cambia la talla final de la prenda.',
    severity: 'WARNING',
    confidence: 0.88,
    description_es:
      'Margen de costura incorrecto. La prenda final queda mas grande o mas pequena de lo especificado.',
  },
  {
    id: 'PROD-025',
    category: 'production',
    trigger: 'batch_color_variation',
    condition: 'Variacion de color entre piezas del mismo lote',
    action: 'Verificar consistencia de tinta/tela. Puede ser lote de tela diferente o tinta agotandose.',
    severity: 'WARNING',
    confidence: 0.85,
    description_es:
      'Variacion de color dentro del mismo lote. Verificar si cambio el rollo de tela o si la tinta esta baja.',
  },
  {
    id: 'PROD-026',
    category: 'production',
    trigger: 'label_placement_wrong',
    condition: 'Etiqueta cosida en posicion incorrecta',
    action: 'Descoser y reubicar. Verificar guia de colocacion de etiquetas.',
    severity: 'INFO',
    confidence: 0.82,
    description_es:
      'Etiqueta mal ubicada. Descoser con cuidado y reubicar segun especificacion.',
  },
  {
    id: 'PROD-027',
    category: 'production',
    trigger: 'mirror_print_not_applied',
    condition: 'Impresion para transfer no se espejo',
    action: 'Re-imprimir con opcion espejo activada. La impresion actual saldra invertida al prensar.',
    severity: 'CRITICAL',
    confidence: 0.96,
    description_es:
      'Impresion sin espejo para transfer. Al prensar, el diseno queda al reves. Re-imprimir con espejo.',
  },
  {
    id: 'PROD-028',
    category: 'production',
    trigger: 'humidity_too_high',
    condition: 'Humedad del taller > 65% durante sublimacion',
    action: 'Encender deshumidificador. Humedad alta causa manchas y colores disparejos en sublimacion.',
    severity: 'WARNING',
    confidence: 0.83,
    description_es:
      'Humedad alta en el taller. Afecta la calidad de sublimacion. Encender deshumidificador.',
  },
  {
    id: 'PROD-029',
    category: 'production',
    trigger: 'plotter_blade_depth_wrong',
    condition: 'Profundidad de cuchilla de plotter mal ajustada para el material',
    action: 'Ajustar profundidad: vinilo HTV=blade out 1mm, vinilo adhesivo=blade out 0.5mm',
    severity: 'WARNING',
    confidence: 0.87,
    description_es:
      'Profundidad de cuchilla del plotter incorrecta. Corta de menos (no se pela) o de mas (corta el liner).',
  },
  {
    id: 'PROD-030',
    category: 'production',
    trigger: 'fabric_stain_before_print',
    condition: 'Mancha detectada en tela antes de imprimir',
    action: 'Apartar pieza manchada. NO imprimir encima: la mancha sera visible. Usar pieza limpia.',
    severity: 'WARNING',
    confidence: 0.92,
    description_es:
      'Tela con mancha antes de imprimir. No imprimir encima. Usar una pieza limpia.',
  },
  {
    id: 'PROD-031',
    category: 'production',
    trigger: 'double_sublimation',
    condition: 'Pieza ya sublimada pasa por segunda sublimacion',
    action: 'DETENER. La segunda sublimacion arruina los colores de la primera. Pieza desechada.',
    severity: 'CRITICAL',
    confidence: 0.98,
    description_es:
      'Doble sublimacion detectada. Los colores de la primera sublimacion se distorsionan. Pieza arruinada.',
  },
  {
    id: 'PROD-032',
    category: 'production',
    trigger: 'white_ink_not_shaken',
    condition: 'Tinta blanca DTG no agitada antes de uso',
    action: 'Agitar cartucho de tinta blanca 30 segundos. Sin agitar, la tinta se separa y sale dispareja.',
    severity: 'WARNING',
    confidence: 0.85,
    description_es:
      'Tinta blanca no agitada. La tinta blanca se sedimenta y sale dispareja. Agitar 30 segundos antes de imprimir.',
  },
  {
    id: 'PROD-033',
    category: 'production',
    trigger: 'elastic_not_pre_stretched',
    condition: 'Elastico cosido sin pre-estiramiento',
    action: 'El elastico se va a encoger con las lavadas. Pre-estirar 10% antes de coser.',
    severity: 'INFO',
    confidence: 0.80,
    description_es:
      'Elastico no pre-estirado. Se encoge con los lavados. Pre-estirar 10% antes de coser para compensar.',
  },
  {
    id: 'PROD-034',
    category: 'production',
    trigger: 'sublimation_on_cotton',
    condition: 'Intento de sublimacion sobre tela 100% algodon',
    action: 'DETENER. La sublimacion no funciona en algodon. Requiere minimo 65% poliester.',
    severity: 'CRITICAL',
    confidence: 0.99,
    description_es:
      'Sublimacion en algodon no funciona. Los colores no se fijan y se lavan. Usar tela con minimo 65% poliester.',
  },
  {
    id: 'PROD-035',
    category: 'production',
    trigger: 'pattern_pieces_mixed',
    condition: 'Piezas de diferentes tallas mezcladas en mesa de armado',
    action: 'PARAR armado. Separar y re-etiquetar cada pieza por talla antes de continuar.',
    severity: 'CRITICAL',
    confidence: 0.95,
    description_es:
      'Piezas de diferentes tallas mezcladas. El armado va a generar prendas con tallas inconsistentes.',
  },
  {
    id: 'PROD-036',
    category: 'production',
    trigger: 'serger_knife_dull',
    condition: 'Cuchilla de overlock desgastada',
    action: 'Cambiar cuchilla. El borde cortado queda irregular y deshilachado.',
    severity: 'WARNING',
    confidence: 0.86,
    description_es:
      'Cuchilla de overlock gastada. Los bordes quedan deshilachados. Cambiar cuchilla y revisar ultimas piezas.',
  },
  {
    id: 'PROD-037',
    category: 'production',
    trigger: 'wrong_stitch_type',
    condition: 'Tipo de puntada no corresponde a la especificacion de la prenda',
    action: 'Verificar especificacion. Lycra requiere zigzag o coverlock, no puntada recta.',
    severity: 'WARNING',
    confidence: 0.89,
    description_es:
      'Tipo de puntada incorrecto para este material. Telas elasticas requieren puntada elastica, no recta.',
  },
  {
    id: 'PROD-038',
    category: 'production',
    trigger: 'print_rip_software_crash',
    condition: 'Software RIP se cierra durante procesamiento de archivo',
    action: 'Reiniciar RIP, verificar que el archivo no este corrupto. Reducir resolucion si archivo es muy grande.',
    severity: 'WARNING',
    confidence: 0.82,
    description_es:
      'Software RIP se cerro. Reiniciar y verificar el archivo. Si es muy grande, reducir resolucion o dividir.',
  },
  {
    id: 'PROD-039',
    category: 'production',
    trigger: 'vinyl_cold_peel_too_early',
    condition: 'Vinilo retirado en caliente cuando requiere pelado en frio',
    action: 'Si el vinilo se levanto, desechar. Siempre verificar instrucciones: HTV basico=caliente, glitter=frio.',
    severity: 'WARNING',
    confidence: 0.88,
    description_es:
      'Vinilo retirado antes de enfriar (requiere pelado en frio). El vinilo puede levantarse. Verificar instrucciones.',
  },
  {
    id: 'PROD-040',
    category: 'production',
    trigger: 'bobbin_thread_wrong_color',
    condition: 'Hilo de bobina de color incorrecto',
    action: 'Cambiar hilo de bobina. En costuras visibles por ambos lados, se nota el color incorrecto.',
    severity: 'INFO',
    confidence: 0.80,
    description_es:
      'Hilo de bobina de color incorrecto. Se ve en el interior de la prenda o en costuras visibles.',
  },
  {
    id: 'PROD-041',
    category: 'production',
    trigger: 'fabric_roll_end',
    condition: 'Fin de rollo de tela detectado a mitad de lote',
    action: 'Marcar punto de cambio de rollo. Nuevo rollo puede tener ligera variacion de color/textura.',
    severity: 'INFO',
    confidence: 0.83,
    description_es:
      'Fin de rollo de tela a mitad de lote. El nuevo rollo puede tener variacion de tono. Verificar consistencia.',
  },
  {
    id: 'PROD-042',
    category: 'production',
    trigger: 'production_sequence_wrong',
    condition: 'Piezas procesadas en orden incorrecto de estaciones',
    action: 'La pieza fue a ARMADO sin pasar por CORTE o IMPRESION. Devolver a estacion correcta.',
    severity: 'CRITICAL',
    confidence: 0.94,
    description_es:
      'Secuencia de produccion incorrecta. La pieza salto una estacion. Devolver al paso anterior.',
  },
  {
    id: 'PROD-043',
    category: 'production',
    trigger: 'garment_inside_out',
    condition: 'Prenda armada al reves',
    action: 'Descoser y re-armar correctamente. Verificar que la cara correcta de la tela este visible.',
    severity: 'WARNING',
    confidence: 0.87,
    description_es:
      'Prenda armada al reves. La cara correcta de la tela (con estampado) debe estar por fuera.',
  },
  {
    id: 'PROD-044',
    category: 'production',
    trigger: 'zipper_direction_wrong',
    condition: 'Cierre/zipper cosido en direccion incorrecta',
    action: 'Descoser y reinstalar. El tirador debe quedar en la posicion correcta segun especificacion.',
    severity: 'WARNING',
    confidence: 0.86,
    description_es:
      'Cierre cosido al reves. Descoser y reinstalar en la direccion correcta.',
  },
  {
    id: 'PROD-045',
    category: 'production',
    trigger: 'pressing_marks_visible',
    condition: 'Marcas de prensa visibles en la tela despues de sublimacion',
    action: 'Usar hoja de teflon entre prensa y tela. Las marcas son permanentes en algunos materiales.',
    severity: 'WARNING',
    confidence: 0.84,
    description_es:
      'Marcas de prensa visibles en la tela. Usar hoja protectora de teflon para prevenir.',
  },
  {
    id: 'PROD-046',
    category: 'production',
    trigger: 'design_placement_off',
    condition: 'Diseno colocado fuera de posicion especificada (>1cm de desviacion)',
    action: 'Re-posicionar. Verificar marcas de referencia en la tela.',
    severity: 'WARNING',
    confidence: 0.90,
    description_es:
      'Diseno fuera de posicion. El logo o estampado no esta centrado o en la ubicacion correcta.',
  },
  {
    id: 'PROD-047',
    category: 'production',
    trigger: 'fabric_pilling_during_process',
    condition: 'Tela se empieza a hacer bolitas durante manipulacion',
    action: 'Reducir friccion. Esta tela tiene tendencia al pilling. Manejar con cuidado.',
    severity: 'INFO',
    confidence: 0.78,
    description_es:
      'Tela con tendencia a hacer pilling. Manejar con cuidado para minimizar bolitas.',
  },
  {
    id: 'PROD-048',
    category: 'production',
    trigger: 'ink_bleeding_through',
    condition: 'Tinta traspasa al otro lado de la tela',
    action: 'Reducir cantidad de tinta en perfil de impresion. Usar protector entre capas.',
    severity: 'WARNING',
    confidence: 0.86,
    description_es:
      'Tinta traspasa la tela. Reducir saturacion en el perfil de impresion o cambiar tipo de tela.',
  },
  {
    id: 'PROD-049',
    category: 'production',
    trigger: 'collar_ribbing_uneven',
    condition: 'Cuello de prenda cosido desigual',
    action: 'Descoser y re-coser. Distribuir elastico/rib uniformemente alrededor de la abertura.',
    severity: 'WARNING',
    confidence: 0.84,
    description_es:
      'Cuello cosido desigual. Se ve torcido o estirado de un lado. Descoser y re-distribuir.',
  },
  {
    id: 'PROD-050',
    category: 'production',
    trigger: 'waste_percentage_high',
    condition: 'Porcentaje de desperdicio de tela > 25% en corte',
    action: 'Revisar disposicion de patron en plotter. Optimizar layout para reducir desperdicio.',
    severity: 'INFO',
    confidence: 0.81,
    description_es:
      'Desperdicio de tela alto. Revisar la disposicion de los patrones para mejor aprovechamiento.',
  },
  {
    id: 'PROD-051',
    category: 'production',
    trigger: 'sublimation_ghosting',
    condition: 'Imagen fantasma visible en sublimacion',
    action: 'Revisar presion de prensa y fijacion del papel. El papel se movio ligeramente durante prensado.',
    severity: 'WARNING',
    confidence: 0.89,
    description_es:
      'Efecto fantasma en sublimacion. El papel se movio. Asegurar con cinta termica y verificar presion.',
  },
  {
    id: 'PROD-052',
    category: 'production',
    trigger: 'adhesive_residue',
    condition: 'Residuo de adhesivo visible en prenda despues de retirar vinilo carrier',
    action: 'Limpiar con alcohol isopropilico. Si persiste, la pieza queda como segunda calidad.',
    severity: 'INFO',
    confidence: 0.79,
    description_es:
      'Residuo de adhesivo en la prenda. Limpiar con alcohol isopropilico suavemente.',
  },
  {
    id: 'PROD-053',
    category: 'production',
    trigger: 'buttonhole_misplaced',
    condition: 'Ojales para botones en posicion incorrecta',
    action: 'No se pueden corregir. La pieza necesita reproceso completo de la zona afectada.',
    severity: 'WARNING',
    confidence: 0.90,
    description_es:
      'Ojales mal ubicados. No se pueden mover una vez hechos. Evaluar reproceso.',
  },
  {
    id: 'PROD-054',
    category: 'production',
    trigger: 'heat_transfer_incomplete',
    condition: 'Transferencia de calor incompleta (areas sin color)',
    action: 'Re-prensar la pieza por 5 segundos adicionales. Si no mejora, la transferencia fallo.',
    severity: 'WARNING',
    confidence: 0.85,
    description_es:
      'Transferencia incompleta. Hay areas sin color. Intentar re-prensar brevemente.',
  },
  {
    id: 'PROD-055',
    category: 'production',
    trigger: 'production_count_mismatch',
    condition: 'Cantidad de piezas producidas no coincide con orden',
    action: 'Contar de nuevo. Si faltan, verificar si quedaron en estacion anterior. Si sobran, separar excedente.',
    severity: 'WARNING',
    confidence: 0.88,
    description_es:
      'Conteo de piezas no coincide con la orden. Verificar en cada estacion.',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// QUALITY CONTROL (45 escenarios)
// ─────────────────────────────────────────────────────────────────────────────

const QUALITY_SCENARIOS: TrainingScenario[] = [
  {
    id: 'QC-001',
    category: 'quality',
    trigger: 'color_pantone_mismatch',
    condition: 'Color impreso no coincide con referencia Pantone (deltaE > 5)',
    action: 'RECHAZAR. Verificar calibracion de impresora y perfil ICC. Solicitar reimpresion.',
    severity: 'CRITICAL',
    confidence: 0.94,
    description_es:
      'Color no coincide con referencia Pantone. Rechazar pieza, recalibrar impresora.',
  },
  {
    id: 'QC-002',
    category: 'quality',
    trigger: 'design_alignment_off',
    condition: 'Alineacion de diseno desviada > 2mm de la posicion especificada',
    action: 'RECHAZAR. Recalibrar posicionamiento. Verificar marcas de referencia.',
    severity: 'WARNING',
    confidence: 0.91,
    description_es:
      'Diseno desalineado mas de 2mm. Rechazar y recalibrar posicion.',
  },
  {
    id: 'QC-003',
    category: 'quality',
    trigger: 'thread_loose_on_seam',
    condition: 'Hilo suelto o costura abierta detectada',
    action: 'RECHAZAR. Repasar costura. Verificar tension del hilo en maquina.',
    severity: 'WARNING',
    confidence: 0.92,
    description_es:
      'Costura floja o abierta. Rechazar para repaso. Verificar tension de la maquina.',
  },
  {
    id: 'QC-004',
    category: 'quality',
    trigger: 'fabric_pilling_visible',
    condition: 'Pilling (bolitas) visibles en la superficie de la tela',
    action: 'RECHAZAR si es excesivo. Evaluar cambiar proveedor de tela si recurrente.',
    severity: 'WARNING',
    confidence: 0.85,
    description_es:
      'Bolitas visibles en la tela. Si es excesivo, rechazar. Evaluar proveedor de tela.',
  },
  {
    id: 'QC-005',
    category: 'quality',
    trigger: 'label_not_centered',
    condition: 'Etiqueta descentrada > 5mm',
    action: 'Defecto menor. Rework: descoser y recolocar etiqueta.',
    severity: 'INFO',
    confidence: 0.80,
    description_es:
      'Etiqueta descentrada. Defecto menor, se puede recolocar.',
  },
  {
    id: 'QC-006',
    category: 'quality',
    trigger: 'size_measurement_off',
    condition: 'Medidas de la prenda fuera de tolerancia (> 1cm de la talla)',
    action: 'RECHAZAR. La prenda no cumple con la talla indicada. No se puede vender asi.',
    severity: 'CRITICAL',
    confidence: 0.96,
    description_es:
      'Medidas fuera de tolerancia. La prenda no corresponde a la talla. Rechazar.',
  },
  {
    id: 'QC-007',
    category: 'quality',
    trigger: 'stain_on_fabric',
    condition: 'Mancha visible en la tela (tinta, grasa, suciedad)',
    action: 'RECHAZAR. Intentar limpiar si posible. Verificar limpieza de estacion de trabajo.',
    severity: 'WARNING',
    confidence: 0.93,
    description_es:
      'Mancha en la tela. Rechazar. Verificar que la mesa de trabajo este limpia.',
  },
  {
    id: 'QC-008',
    category: 'quality',
    trigger: 'wrinkle_in_sublimation',
    condition: 'Arruga visible en area sublimada',
    action: 'RECHAZAR. La arruga creo una linea sin color permanente. Re-hacer pieza.',
    severity: 'CRITICAL',
    confidence: 0.95,
    description_es:
      'Arruga en sublimacion crea linea permanente sin color. Pieza rechazada, rehacer.',
  },
  {
    id: 'QC-009',
    category: 'quality',
    trigger: 'logo_pixelated',
    condition: 'Logo o imagen visiblemente pixelada en producto final',
    action: 'RECHAZAR. Solicitar archivo de mayor resolucion al disenador/cliente.',
    severity: 'CRITICAL',
    confidence: 0.94,
    description_es:
      'Logo pixelado en el producto. Rechazar y solicitar archivo de mayor resolucion.',
  },
  {
    id: 'QC-010',
    category: 'quality',
    trigger: 'wrong_thread_color',
    condition: 'Color de hilo de costura no coincide con especificacion',
    action: 'RECHAZAR si es costura visible. Evaluar si es costura interna.',
    severity: 'WARNING',
    confidence: 0.87,
    description_es:
      'Color de hilo incorrecto. Rechazar si la costura es visible en el exterior.',
  },
  {
    id: 'QC-011',
    category: 'quality',
    trigger: 'print_fading_edges',
    condition: 'Impresion se desvanece en los bordes',
    action: 'Verificar que el diseno cubra area completa. Puede ser presion desigual en prensa.',
    severity: 'WARNING',
    confidence: 0.86,
    description_es:
      'Impresion desvanecida en bordes. Verificar presion de prensa y tamano del diseno.',
  },
  {
    id: 'QC-012',
    category: 'quality',
    trigger: 'seam_not_straight',
    condition: 'Costura visiblemente torcida o irregular',
    action: 'RECHAZAR. Descoser y re-coser recto. Verificar guia de costura de la maquina.',
    severity: 'WARNING',
    confidence: 0.90,
    description_es:
      'Costura torcida. Rechazar para reproceso. El operador debe usar la guia de la maquina.',
  },
  {
    id: 'QC-013',
    category: 'quality',
    trigger: 'vinyl_peeling',
    condition: 'Vinilo se despega parcialmente',
    action: 'RECHAZAR. Re-prensar con temperatura y tiempo correctos. Si persiste, el vinilo o la tela son incompatibles.',
    severity: 'CRITICAL',
    confidence: 0.93,
    description_es:
      'Vinilo despegandose. Rechazar. Re-prensar o cambiar tipo de vinilo.',
  },
  {
    id: 'QC-014',
    category: 'quality',
    trigger: 'embroidery_thread_loose',
    condition: 'Hilos sueltos o deshilachados en bordado',
    action: 'Recortar hilos sueltos con cuidado. Si el diseno esta danado, rechazar.',
    severity: 'INFO',
    confidence: 0.82,
    description_es:
      'Hilos sueltos en bordado. Recortar con cuidado. Si hay dano, rechazar.',
  },
  {
    id: 'QC-015',
    category: 'quality',
    trigger: 'fabric_defect_found',
    condition: 'Defecto en la tela (hoyo, rasgado, decoloracion de fabrica)',
    action: 'RECHAZAR. Defecto de fabrica. Documentar para reclamo a proveedor.',
    severity: 'CRITICAL',
    confidence: 0.95,
    description_es:
      'Defecto de fabrica en la tela. Rechazar y documentar para reclamo al proveedor.',
  },
  {
    id: 'QC-016',
    category: 'quality',
    trigger: 'design_mirrored',
    condition: 'Diseno aparece en espejo (texto al reves)',
    action: 'RECHAZAR. El diseno fue impreso sin/con espejo incorrectamente. Reimprimir.',
    severity: 'CRITICAL',
    confidence: 0.97,
    description_es:
      'Diseno en espejo, texto se lee al reves. Reimprimir con la configuracion correcta.',
  },
  {
    id: 'QC-017',
    category: 'quality',
    trigger: 'hem_uneven',
    condition: 'Dobladillo desigual (diferencia > 5mm entre lados)',
    action: 'RECHAZAR para reproceso. Descoser y re-hacer dobladillo parejo.',
    severity: 'WARNING',
    confidence: 0.86,
    description_es:
      'Dobladillo desigual. Descoser y re-hacer parejo.',
  },
  {
    id: 'QC-018',
    category: 'quality',
    trigger: 'wrong_size_label',
    condition: 'Etiqueta de talla no corresponde al tamano real de la prenda',
    action: 'RECHAZAR. Cambiar etiqueta por la correcta. Error critico para el cliente.',
    severity: 'CRITICAL',
    confidence: 0.97,
    description_es:
      'Etiqueta de talla incorrecta. Cambiar por la correcta. El cliente recibe la talla equivocada.',
  },
  {
    id: 'QC-019',
    category: 'quality',
    trigger: 'sublimation_color_shift',
    condition: 'Colores de sublimacion desviados (tono diferente al esperado)',
    action: 'Verificar perfil ICC y tipo de tela. Diferentes telas absorben color diferente.',
    severity: 'WARNING',
    confidence: 0.85,
    description_es:
      'Colores sublimados desviados del original. Verificar perfil de color y tipo de tela.',
  },
  {
    id: 'QC-020',
    category: 'quality',
    trigger: 'button_not_secure',
    condition: 'Boton se siente flojo o se cae',
    action: 'Reforzar costura del boton. Si se cae, recoser con hilo reforzado.',
    severity: 'WARNING',
    confidence: 0.88,
    description_es:
      'Boton flojo. Reforzar con costura adicional antes de empacar.',
  },
  {
    id: 'QC-021',
    category: 'quality',
    trigger: 'snap_not_aligned',
    condition: 'Broche de presion desalineado (macho y hembra no coinciden)',
    action: 'RECHAZAR. Recolocar broche. No se puede cerrar correctamente.',
    severity: 'WARNING',
    confidence: 0.89,
    description_es:
      'Broche desalineado. No cierra bien. Recolocar en posicion correcta.',
  },
  {
    id: 'QC-022',
    category: 'quality',
    trigger: 'print_smudge',
    condition: 'Manchas de tinta en area no impresa',
    action: 'Si es limpiable, limpiar. Si es permanente, RECHAZAR.',
    severity: 'WARNING',
    confidence: 0.87,
    description_es:
      'Manchas de tinta fuera del area de diseno. Intentar limpiar, si no se puede, rechazar.',
  },
  {
    id: 'QC-023',
    category: 'quality',
    trigger: 'fabric_color_inconsistent',
    condition: 'Color de tela base diferente entre piezas del mismo lote',
    action: 'Posible cambio de rollo. Separar por tono. Notificar a produccion.',
    severity: 'WARNING',
    confidence: 0.83,
    description_es:
      'Color de tela inconsistente en el lote. Pudo haber cambio de rollo con tono diferente.',
  },
  {
    id: 'QC-024',
    category: 'quality',
    trigger: 'armhole_too_tight',
    condition: 'Sisa demasiado ajustada comparada con especificacion',
    action: 'RECHAZAR. La prenda restringe movimiento. Verificar patron de corte.',
    severity: 'WARNING',
    confidence: 0.88,
    description_es:
      'Sisa muy ajustada. La prenda restringe el movimiento del brazo. Verificar patron.',
  },
  {
    id: 'QC-025',
    category: 'quality',
    trigger: 'neckline_stretched',
    condition: 'Cuello de la prenda estirado o deformado',
    action: 'RECHAZAR si es excesivo. Posiblemente se forzo durante armado.',
    severity: 'WARNING',
    confidence: 0.85,
    description_es:
      'Cuello estirado. Se deformo durante el armado. Rechazar si no se puede corregir.',
  },
  {
    id: 'QC-026',
    category: 'quality',
    trigger: 'pocket_misaligned',
    condition: 'Bolsillo cosido torcido o fuera de posicion',
    action: 'RECHAZAR para reproceso. Descoser y recolocar.',
    severity: 'WARNING',
    confidence: 0.86,
    description_es:
      'Bolsillo torcido o mal ubicado. Descoser y recolocar en posicion correcta.',
  },
  {
    id: 'QC-027',
    category: 'quality',
    trigger: 'wash_test_color_fade',
    condition: 'Color se desvanece notablemente despues de prueba de lavado',
    action: 'RECHAZAR LOTE. Problema de fijacion de color. Revisar proceso de sublimacion/impresion.',
    severity: 'CRITICAL',
    confidence: 0.95,
    description_es:
      'Color se desvanece con el lavado. Problema de fijacion. Revisar todo el lote.',
  },
  {
    id: 'QC-028',
    category: 'quality',
    trigger: 'elastic_waistband_twisted',
    condition: 'Elastico de cintura torcido dentro del canal',
    action: 'RECHAZAR. Descoser canal, enderezar elastico, re-coser.',
    severity: 'WARNING',
    confidence: 0.87,
    description_es:
      'Elastico de cintura torcido. Descoser y corregir antes de empacar.',
  },
  {
    id: 'QC-029',
    category: 'quality',
    trigger: 'reflective_element_defective',
    condition: 'Elemento reflectivo no refleja correctamente',
    action: 'RECHAZAR. El elemento reflectivo es funcional (seguridad). Reemplazar.',
    severity: 'CRITICAL',
    confidence: 0.93,
    description_es:
      'Elemento reflectivo defectuoso. Es tema de seguridad del usuario. Reemplazar.',
  },
  {
    id: 'QC-030',
    category: 'quality',
    trigger: 'grainline_off',
    condition: 'Hilo de la tela no esta alineado con el patron',
    action: 'La prenda puede torcerse despues del lavado. Evaluar severidad.',
    severity: 'WARNING',
    confidence: 0.84,
    description_es:
      'Hilo de tela fuera de alineacion. La prenda se puede torcer con los lavados.',
  },
  {
    id: 'QC-031',
    category: 'quality',
    trigger: 'barcode_unreadable',
    condition: 'Codigo de barras de la pieza no escanea correctamente',
    action: 'Reimprimir etiqueta de codigo de barras. Sin codigo no se puede rastrear la pieza.',
    severity: 'WARNING',
    confidence: 0.91,
    description_es:
      'Codigo de barras ilegible. Reimprimir etiqueta para mantener trazabilidad.',
  },
  {
    id: 'QC-032',
    category: 'quality',
    trigger: 'care_label_missing',
    condition: 'Etiqueta de cuidado/lavado no incluida',
    action: 'DETENER empaque. Coser etiqueta de cuidado. Es requisito legal en Costa Rica.',
    severity: 'CRITICAL',
    confidence: 0.96,
    description_es:
      'Falta etiqueta de cuidado. Es requisito legal. No se puede entregar sin ella.',
  },
  {
    id: 'QC-033',
    category: 'quality',
    trigger: 'symmetry_check_failed',
    condition: 'Prenda no es simetrica (un lado mas largo que el otro)',
    action: 'RECHAZAR. Verificar patron de corte. La prenda esta asimetrica.',
    severity: 'WARNING',
    confidence: 0.89,
    description_es:
      'Prenda asimetrica. Un lado mas largo que el otro. Verificar corte.',
  },
  {
    id: 'QC-034',
    category: 'quality',
    trigger: 'print_registration_off',
    condition: 'Registro de impresion desalineado entre colores',
    action: 'RECHAZAR. Los colores no estan alineados entre si. Recalibrar impresora.',
    severity: 'WARNING',
    confidence: 0.90,
    description_es:
      'Registro de color desalineado. Los colores no coinciden. Recalibrar.',
  },
  {
    id: 'QC-035',
    category: 'quality',
    trigger: 'final_pressing_skipped',
    condition: 'Prenda no fue planchada/prensada final antes de empaque',
    action: 'Devolver para planchado final. La prenda debe verse presentable.',
    severity: 'INFO',
    confidence: 0.80,
    description_es:
      'Falta planchado final. La prenda debe verse impecable antes de empacar.',
  },
  {
    id: 'QC-036',
    category: 'quality',
    trigger: 'double_stitching_missing',
    condition: 'Costuras de refuerzo faltantes donde especificado',
    action: 'RECHAZAR. Agregar costura de refuerzo en areas de estres (hombros, axila, entrepierna).',
    severity: 'WARNING',
    confidence: 0.88,
    description_es:
      'Falta costura de refuerzo. La prenda puede romperse en areas de estres.',
  },
  {
    id: 'QC-037',
    category: 'quality',
    trigger: 'odor_detected',
    condition: 'Olor quimico o desagradable en la prenda',
    action: 'Lavar antes de empacar. Si persiste, puede ser reaccion quimica de tinta/tela.',
    severity: 'WARNING',
    confidence: 0.82,
    description_es:
      'Olor quimico en la prenda. Lavar antes de entregar. Verificar compatibilidad de materiales.',
  },
  {
    id: 'QC-038',
    category: 'quality',
    trigger: 'stretch_recovery_poor',
    condition: 'Tela elastica no regresa a forma original despues de estiramiento',
    action: 'Posible dano por calor excesivo. Rechazar si deformacion es permanente.',
    severity: 'WARNING',
    confidence: 0.84,
    description_es:
      'Tela perdio elasticidad. Posible dano por calor. Verificar temperatura de proceso.',
  },
  {
    id: 'QC-039',
    category: 'quality',
    trigger: 'customer_name_misspelled',
    condition: 'Nombre personalizado en prenda tiene error ortografico',
    action: 'RECHAZAR INMEDIATAMENTE. Verificar con orden original. Rehacer pieza.',
    severity: 'CRITICAL',
    confidence: 0.99,
    description_es:
      'Nombre personalizado mal escrito. Error inaceptable. Rehacer la pieza.',
  },
  {
    id: 'QC-040',
    category: 'quality',
    trigger: 'number_wrong_on_jersey',
    condition: 'Numero en jersey no coincide con el solicitado',
    action: 'RECHAZAR. Verificar orden y reimprimir con numero correcto.',
    severity: 'CRITICAL',
    confidence: 0.99,
    description_es:
      'Numero incorrecto en jersey. Error critico. Rehacer con el numero correcto.',
  },
  {
    id: 'QC-041',
    category: 'quality',
    trigger: 'overlock_skip_stitch',
    condition: 'Puntada saltada en costura overlock',
    action: 'RECHAZAR. La costura puede abrirse. Repasar tramo afectado.',
    severity: 'WARNING',
    confidence: 0.89,
    description_es:
      'Puntada saltada en overlock. La costura puede abrirse. Repasar.',
  },
  {
    id: 'QC-042',
    category: 'quality',
    trigger: 'sublimation_white_spots',
    condition: 'Puntos blancos en area sublimada',
    action: 'Posible polvo o fibras en la tela pre-sublimacion. RECHAZAR. Limpiar tela antes de prensar.',
    severity: 'WARNING',
    confidence: 0.87,
    description_es:
      'Puntos blancos en sublimacion. Causado por polvo/pelusas. Rechazar y limpiar tela antes de prensar.',
  },
  {
    id: 'QC-043',
    category: 'quality',
    trigger: 'dtf_film_bubbles',
    condition: 'Burbujas visibles bajo pelicula DTF',
    action: 'Re-prensar con mas presion. Si persisten, despegar y re-aplicar.',
    severity: 'WARNING',
    confidence: 0.85,
    description_es:
      'Burbujas bajo pelicula DTF. Re-prensar con mas presion para eliminar.',
  },
  {
    id: 'QC-044',
    category: 'quality',
    trigger: 'garment_measurements_pass',
    condition: 'Todas las medidas dentro de tolerancia',
    action: 'APROBAR. Documentar medidas para referencia.',
    severity: 'INFO',
    confidence: 0.95,
    description_es:
      'Todas las medidas correctas. Pieza aprobada.',
  },
  {
    id: 'QC-045',
    category: 'quality',
    trigger: 'visual_inspection_pass',
    condition: 'Inspeccion visual sin defectos',
    action: 'APROBAR. Marcar como aprobada y enviar a empaque.',
    severity: 'INFO',
    confidence: 0.95,
    description_es:
      'Inspeccion visual aprobada. Sin defectos visibles. Enviar a empaque.',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// DESIGN & FILES (40 escenarios)
// ─────────────────────────────────────────────────────────────────────────────

const DESIGN_SCENARIOS: TrainingScenario[] = [
  {
    id: 'DSN-001',
    category: 'design',
    trigger: 'file_format_jpg',
    condition: 'Cliente envia archivo JPG/JPEG',
    action: 'Aceptar con advertencia. Para mejor calidad, solicitar AI/EPS/SVG/PDF vectorial.',
    severity: 'INFO',
    confidence: 0.88,
    description_es:
      'Archivo JPG recibido. Para sublimacion puede funcionar si es alta resolucion (>300 DPI). Ideal: vectorial.',
  },
  {
    id: 'DSN-002',
    category: 'design',
    trigger: 'resolution_below_150dpi',
    condition: 'Resolucion de imagen < 150 DPI',
    action: 'RECHAZAR para sublimacion/impresion textil. Solicitar archivo de mayor resolucion.',
    severity: 'CRITICAL',
    confidence: 0.95,
    description_es:
      'Resolucion menor a 150 DPI. Muy baja para impresion textil. Solicitar mayor resolucion.',
  },
  {
    id: 'DSN-003',
    category: 'design',
    trigger: 'resolution_150_to_299dpi',
    condition: 'Resolucion de imagen entre 150-299 DPI',
    action: 'Advertencia: puede funcionar para estampados pequenos. Para full-print, se necesita 300+ DPI.',
    severity: 'WARNING',
    confidence: 0.82,
    description_es:
      'Resolucion 150-299 DPI. Funciona para logos pequenos, pero no para sublimacion full-print.',
  },
  {
    id: 'DSN-004',
    category: 'design',
    trigger: 'cmyk_on_rgb_printer',
    condition: 'Archivo en espacio de color CMYK pero la impresora usa RGB',
    action: 'Convertir a RGB antes de imprimir. Los colores van a salir desviados si no se convierte.',
    severity: 'WARNING',
    confidence: 0.90,
    description_es:
      'Archivo CMYK en impresora RGB. Convertir color space antes de imprimir para evitar desviacion.',
  },
  {
    id: 'DSN-005',
    category: 'design',
    trigger: 'transparent_png_with_white_bg',
    condition: 'PNG con fondo blanco en vez de transparente',
    action: 'Preguntar al cliente si quiere fondo blanco o transparente. Probablemente quiere transparencia.',
    severity: 'INFO',
    confidence: 0.78,
    description_es:
      'PNG con fondo blanco. Confirmar con el cliente si el fondo debe ser transparente.',
  },
  {
    id: 'DSN-006',
    category: 'design',
    trigger: 'file_too_large',
    condition: 'Archivo de diseno > 50MB',
    action: 'Puede causar lentitud o crash del RIP. Optimizar: reducir DPI a 300, aplanar capas.',
    severity: 'WARNING',
    confidence: 0.83,
    description_es:
      'Archivo muy grande (>50MB). Puede hacer lento el software. Optimizar sin perder calidad.',
  },
  {
    id: 'DSN-007',
    category: 'design',
    trigger: 'font_not_outlined',
    condition: 'Archivo AI/PDF con fuentes no convertidas a curvas',
    action: 'Las fuentes pueden cambiar en otra computadora. Convertir a curvas/outlines.',
    severity: 'WARNING',
    confidence: 0.92,
    description_es:
      'Fuentes no convertidas a curvas. El texto puede cambiar de forma en otra maquina. Convertir a outlines.',
  },
  {
    id: 'DSN-008',
    category: 'design',
    trigger: 'thin_lines_detected',
    condition: 'Lineas menores a 0.5pt en el diseno',
    action: 'Lineas muy finas no se ven en tela. Engrosar a minimo 1pt para impresion textil.',
    severity: 'WARNING',
    confidence: 0.87,
    description_es:
      'Lineas muy finas (<0.5pt) no se imprimen bien en tela. Engrosar a minimo 1pt.',
  },
  {
    id: 'DSN-009',
    category: 'design',
    trigger: 'design_exceeds_print_area',
    condition: 'Diseno excede el area imprimible de la prenda',
    action: 'El diseno sera recortado. Ajustar tamano o confirmar con cliente.',
    severity: 'WARNING',
    confidence: 0.91,
    description_es:
      'Diseno excede area imprimible. Se va a recortar. Ajustar o confirmar con el cliente.',
  },
  {
    id: 'DSN-010',
    category: 'design',
    trigger: 'multiple_artboards',
    condition: 'Archivo AI/PDF con multiples mesas de trabajo',
    action: 'Confirmar cual mesa de trabajo es el diseno final. No asumir.',
    severity: 'INFO',
    confidence: 0.85,
    description_es:
      'Archivo con multiples artboards. Confirmar con el cliente cual es el diseno final.',
  },
  {
    id: 'DSN-011',
    category: 'design',
    trigger: 'pantone_not_specified',
    condition: 'Diseno con colores criticos sin referencia Pantone',
    action: 'Solicitar referencia Pantone para colores corporativos. Sin Pantone, el color puede variar.',
    severity: 'INFO',
    confidence: 0.80,
    description_es:
      'Sin referencia Pantone. Los colores corporativos pueden variar. Solicitar Pantone al cliente.',
  },
  {
    id: 'DSN-012',
    category: 'design',
    trigger: 'gradient_complex',
    condition: 'Diseno con degradados complejos para serigrafia',
    action: 'Degradados no funcionan en serigrafia. Recomendar sublimacion o DTG para este diseno.',
    severity: 'WARNING',
    confidence: 0.89,
    description_es:
      'Degradados complejos no son posibles en serigrafia. Recomendar sublimacion o DTG.',
  },
  {
    id: 'DSN-013',
    category: 'design',
    trigger: 'design_too_many_colors_screen',
    condition: 'Diseno con > 6 colores para serigrafia',
    action: 'Cada color = 1 pantalla = mas costo. Reducir colores o cambiar a sublimacion.',
    severity: 'WARNING',
    confidence: 0.88,
    description_es:
      'Muchos colores para serigrafia. Cada color adicional sube el costo. Considerar sublimacion.',
  },
  {
    id: 'DSN-014',
    category: 'design',
    trigger: 'bleed_not_included',
    condition: 'Diseno full-print sin sangrado (bleed)',
    action: 'Agregar 5mm de sangrado en todos los bordes para evitar bordes blancos.',
    severity: 'WARNING',
    confidence: 0.90,
    description_es:
      'Falta sangrado (bleed). Agregar 5mm extra en bordes para que el color llegue al borde de la prenda.',
  },
  {
    id: 'DSN-015',
    category: 'design',
    trigger: 'white_on_white',
    condition: 'Diseno con elementos blancos sobre tela blanca',
    action: 'Elementos blancos no se veran en tela blanca. Confirmar intencion con cliente.',
    severity: 'INFO',
    confidence: 0.85,
    description_es:
      'Elementos blancos en tela blanca no se veran. Confirmar con el cliente.',
  },
  {
    id: 'DSN-016',
    category: 'design',
    trigger: 'raster_in_vector_file',
    condition: 'Imagen rasterizada incrustada en archivo vectorial',
    action: 'El archivo no es 100% vectorial. Verificar resolucion de la imagen incrustada.',
    severity: 'INFO',
    confidence: 0.82,
    description_es:
      'Imagen raster dentro de archivo vectorial. Verificar calidad de la imagen incrustada.',
  },
  {
    id: 'DSN-017',
    category: 'design',
    trigger: 'design_text_too_small',
    condition: 'Texto menor a 6pt en el diseno',
    action: 'Texto muy pequeno no se lee en tela. Minimo 8pt para legibilidad.',
    severity: 'WARNING',
    confidence: 0.88,
    description_es:
      'Texto demasiado pequeno. En tela, el minimo legible es 8pt. Agrandar.',
  },
  {
    id: 'DSN-018',
    category: 'design',
    trigger: 'spot_color_used',
    condition: 'Archivo usa colores especiales/spot (no proceso)',
    action: 'Convertir a CMYK/RGB para impresion digital. Spot colors solo para serigrafia.',
    severity: 'INFO',
    confidence: 0.84,
    description_es:
      'Colores spot detectados. Convertir a proceso (CMYK/RGB) para impresion digital.',
  },
  {
    id: 'DSN-019',
    category: 'design',
    trigger: 'overprint_settings_on',
    condition: 'Sobreimpresion activada en elementos del diseno',
    action: 'Desactivar overprint para impresion digital. Puede causar colores inesperados.',
    severity: 'WARNING',
    confidence: 0.86,
    description_es:
      'Sobreimpresion activada. Desactivar para impresion digital para evitar colores incorrectos.',
  },
  {
    id: 'DSN-020',
    category: 'design',
    trigger: 'design_version_conflict',
    condition: 'Cliente envia version diferente a la aprobada',
    action: 'DETENER. Confirmar con cliente cual version es la correcta antes de producir.',
    severity: 'CRITICAL',
    confidence: 0.93,
    description_es:
      'Version de diseno diferente a la aprobada. Confirmar con cliente antes de producir.',
  },
  {
    id: 'DSN-021',
    category: 'design',
    trigger: 'mockup_vs_production',
    condition: 'Cliente espera resultado identico al mockup digital',
    action: 'Advertir que mockup y producto real pueden diferir en color/textura. Gestionar expectativas.',
    severity: 'INFO',
    confidence: 0.80,
    description_es:
      'El mockup digital y el producto real siempre difieren un poco en color y textura. Explicar al cliente.',
  },
  {
    id: 'DSN-022',
    category: 'design',
    trigger: 'design_front_and_back',
    condition: 'Orden requiere diseno frente y espalda',
    action: 'Verificar alineacion entre frente y espalda. Los disenos deben coincidir en posicion.',
    severity: 'INFO',
    confidence: 0.82,
    description_es:
      'Diseno frente y espalda. Verificar que ambos esten correctamente alineados y posicionados.',
  },
  {
    id: 'DSN-023',
    category: 'design',
    trigger: 'custom_number_font',
    condition: 'Jersey con numeros personalizados requiere fuente especifica',
    action: 'Verificar que la fuente de numeros esta disponible. Si no, proponer alternativa al cliente.',
    severity: 'INFO',
    confidence: 0.81,
    description_es:
      'Verificar disponibilidad de la fuente para numeros. Si no esta, proponer alternativa.',
  },
  {
    id: 'DSN-024',
    category: 'design',
    trigger: 'pattern_repeat_mismatch',
    condition: 'Patron repetitivo (all-over) no calza en las costuras',
    action: 'Ajustar patron para que calce en las uniones. El cliente nota si no coincide.',
    severity: 'WARNING',
    confidence: 0.87,
    description_es:
      'Patron repetitivo no calza en las costuras. Ajustar para que las uniones sean imperceptibles.',
  },
  {
    id: 'DSN-025',
    category: 'design',
    trigger: 'design_approval_pending_long',
    condition: 'Diseno esperando aprobacion del cliente > 48h',
    action: 'Enviar recordatorio al cliente. Si no responde en 24h mas, llamar.',
    severity: 'INFO',
    confidence: 0.85,
    description_es:
      'Diseno pendiente de aprobacion por mas de 48 horas. Enviar recordatorio al cliente.',
  },
  {
    id: 'DSN-026',
    category: 'design',
    trigger: 'color_count_for_vinyl',
    condition: 'Diseno con > 4 colores para corte de vinilo',
    action: 'Cada color de vinilo es una capa separada. Mas de 4 colores encarece y complica.',
    severity: 'INFO',
    confidence: 0.83,
    description_es:
      'Muchos colores para vinilo. Cada color es una capa. Considerar simplificar o cambiar a sublimacion.',
  },
  {
    id: 'DSN-027',
    category: 'design',
    trigger: 'embedded_image_low_res',
    condition: 'Imagen incrustada en archivo vectorial tiene baja resolucion',
    action: 'Solicitar imagen original de alta resolucion. La incrustada se vera pixelada.',
    severity: 'WARNING',
    confidence: 0.89,
    description_es:
      'Imagen incrustada de baja resolucion. Solicitar el archivo original en alta calidad.',
  },
  {
    id: 'DSN-028',
    category: 'design',
    trigger: 'design_not_to_scale',
    condition: 'Diseno no esta a escala real en el archivo',
    action: 'Escalar al tamano real antes de imprimir. Confirmar dimensiones con el cliente.',
    severity: 'WARNING',
    confidence: 0.86,
    description_es:
      'Diseno no esta a escala real. Confirmar dimensiones exactas con el cliente antes de producir.',
  },
  {
    id: 'DSN-029',
    category: 'design',
    trigger: 'coreldraw_file_received',
    condition: 'Cliente envia archivo CorelDRAW (.cdr)',
    action: 'Convertir a AI o PDF. No todos los equipos tienen CorelDRAW. Pueden perderse efectos.',
    severity: 'INFO',
    confidence: 0.81,
    description_es:
      'Archivo CorelDRAW recibido. Convertir a AI/PDF para compatibilidad.',
  },
  {
    id: 'DSN-030',
    category: 'design',
    trigger: 'word_or_powerpoint_file',
    condition: 'Cliente envia diseno en Word, PowerPoint o Excel',
    action: 'No son formatos de diseno. Solicitar archivo de diseno real (AI, PSD, PDF, PNG alta res).',
    severity: 'WARNING',
    confidence: 0.95,
    description_es:
      'Archivo de Office recibido como diseno. No es formato adecuado. Solicitar archivo de diseno.',
  },
  {
    id: 'DSN-031',
    category: 'design',
    trigger: 'screenshot_as_design',
    condition: 'Cliente envia screenshot como archivo de diseno',
    action: 'Muy baja calidad. Solicitar archivo original al disenador o buscar en linea.',
    severity: 'CRITICAL',
    confidence: 0.93,
    description_es:
      'Screenshot recibido como diseno. Calidad insuficiente. Solicitar archivo original.',
  },
  {
    id: 'DSN-032',
    category: 'design',
    trigger: 'social_media_image',
    condition: 'Cliente descarga logo de redes sociales (baja resolucion)',
    action: 'Imagenes de redes son muy baja resolucion. Solicitar archivo de marca original.',
    severity: 'WARNING',
    confidence: 0.90,
    description_es:
      'Imagen de red social como logo. Resolucion insuficiente. Pedir archivo original de la marca.',
  },
  {
    id: 'DSN-033',
    category: 'design',
    trigger: 'design_revision_3plus',
    condition: 'Diseno va en 3ra o mas revision con el cliente',
    action: 'Agendar videollamada con cliente para alinear expectativas. Revisiones infinitas cuestan dinero.',
    severity: 'WARNING',
    confidence: 0.87,
    description_es:
      '3+ revisiones del diseno. Agendar videollamada para alinear y evitar mas vueltas.',
  },
  {
    id: 'DSN-034',
    category: 'design',
    trigger: 'copyright_concern',
    condition: 'Diseno contiene logos o personajes de terceros',
    action: 'Verificar si el cliente tiene licencia/permiso. V ONE B no debe producir sin autorizacion.',
    severity: 'CRITICAL',
    confidence: 0.92,
    description_es:
      'Posible violacion de copyright. Verificar que el cliente tenga permiso para usar logos/personajes de terceros.',
  },
  {
    id: 'DSN-035',
    category: 'design',
    trigger: 'sublimation_dark_fabric',
    condition: 'Diseno de sublimacion para tela oscura',
    action: 'Sublimacion no funciona bien en telas oscuras. Recomendar DTG o vinilo.',
    severity: 'WARNING',
    confidence: 0.91,
    description_es:
      'Sublimacion en tela oscura no es viable. Los colores se pierden. Usar DTG o vinilo.',
  },
  {
    id: 'DSN-036',
    category: 'design',
    trigger: 'nameplate_data_missing',
    condition: 'Orden de jerseys personalizados sin lista de nombres/numeros',
    action: 'No se puede iniciar produccion. Solicitar lista completa de nombres y numeros al cliente.',
    severity: 'CRITICAL',
    confidence: 0.96,
    description_es:
      'Falta lista de nombres y numeros para jerseys personalizados. Solicitar al cliente.',
  },
  {
    id: 'DSN-037',
    category: 'design',
    trigger: 'all_over_print_seam_conflict',
    condition: 'Diseno all-over no considera las costuras',
    action: 'Crear mockup con costuras marcadas. El diseno se corta en las uniones.',
    severity: 'WARNING',
    confidence: 0.86,
    description_es:
      'Diseno all-over sin considerar costuras. Mostrar al cliente como queda en las uniones.',
  },
  {
    id: 'DSN-038',
    category: 'design',
    trigger: 'psd_layers_flattened',
    condition: 'Archivo PSD con capas aplanadas',
    action: 'Sin capas, no se pueden hacer ediciones granulares. Solicitar PSD con capas si necesita cambios.',
    severity: 'INFO',
    confidence: 0.79,
    description_es:
      'PSD sin capas separadas. Si se necesitan ediciones, solicitar archivo con capas.',
  },
  {
    id: 'DSN-039',
    category: 'design',
    trigger: 'design_uses_neon_colors',
    condition: 'Diseno usa colores neon/fluorescentes',
    action: 'Colores neon no se reproducen fielmente en impresion digital. Gestionar expectativas.',
    severity: 'WARNING',
    confidence: 0.85,
    description_es:
      'Colores neon no se pueden reproducir exactamente en impresion digital. Explicar al cliente.',
  },
  {
    id: 'DSN-040',
    category: 'design',
    trigger: 'design_approved_proceed',
    condition: 'Diseno aprobado por el cliente',
    action: 'Mover a cola de produccion. Verificar que todos los archivos finales estan listos.',
    severity: 'INFO',
    confidence: 0.95,
    description_es:
      'Diseno aprobado. Mover a produccion y verificar que todos los archivos estan listos.',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// CLIENT BEHAVIOR (30 escenarios)
// ─────────────────────────────────────────────────────────────────────────────

const CLIENT_SCENARIOS: TrainingScenario[] = [
  {
    id: 'CLI-001',
    category: 'client',
    trigger: 'client_slow_response',
    condition: 'Cliente no responde en > 48 horas',
    action: 'Enviar recordatorio amable por WhatsApp. Si no responde en 24h mas, llamar.',
    severity: 'INFO',
    confidence: 0.85,
    description_es:
      'Cliente sin responder por mas de 48h. Enviar recordatorio. La orden esta detenida.',
  },
  {
    id: 'CLI-002',
    category: 'client',
    trigger: 'client_rejects_3_times',
    condition: 'Cliente rechaza diseno 3 o mas veces',
    action: 'Agendar videollamada para alinear expectativas. Las revisiones tienen costo.',
    severity: 'WARNING',
    confidence: 0.88,
    description_es:
      '3+ rechazos del diseno. Agendar videollamada para entender exactamente que quiere.',
  },
  {
    id: 'CLI-003',
    category: 'client',
    trigger: 'client_sends_voice_note',
    condition: 'Cliente envia nota de voz en vez de especificaciones escritas',
    action: 'Transcribir nota de voz y enviar resumen escrito al cliente para confirmacion.',
    severity: 'INFO',
    confidence: 0.80,
    description_es:
      'Nota de voz recibida. Transcribir y enviar resumen escrito para evitar malentendidos.',
  },
  {
    id: 'CLI-004',
    category: 'client',
    trigger: 'client_changes_after_approval',
    condition: 'Cliente solicita cambios despues de aprobar el diseno',
    action: 'Informar que cambios post-aprobacion requieren nueva cotizacion y retrasan entrega.',
    severity: 'WARNING',
    confidence: 0.92,
    description_es:
      'Cambios despues de aprobacion. Requiere nueva cotizacion y retrasa la entrega.',
  },
  {
    id: 'CLI-005',
    category: 'client',
    trigger: 'client_rush_order',
    condition: 'Cliente solicita orden urgente (< 48h)',
    action: 'Verificar capacidad. Aplicar recargo de urgencia (25-50%). Notificar al supervisor.',
    severity: 'WARNING',
    confidence: 0.90,
    description_es:
      'Orden urgente solicitada. Verificar capacidad y aplicar recargo de urgencia.',
  },
  {
    id: 'CLI-006',
    category: 'client',
    trigger: 'new_client_first_order',
    condition: 'Cliente nuevo, primera orden',
    action: 'Enviar guia de archivos y proceso. Asignar atencion especial. Pedir 50% anticipo.',
    severity: 'INFO',
    confidence: 0.87,
    description_es:
      'Cliente nuevo. Enviar guia de formatos, proceso de produccion y politicas de pago.',
  },
  {
    id: 'CLI-007',
    category: 'client',
    trigger: 'corporate_bulk_order',
    condition: 'Orden corporativa/institucional de > 50 unidades',
    action: 'Asignar disenador senior. Solicitar logo vectorial y manual de marca. Ofrecer descuento por volumen.',
    severity: 'INFO',
    confidence: 0.86,
    description_es:
      'Orden corporativa grande. Asignar disenador senior y solicitar manual de marca.',
  },
  {
    id: 'CLI-008',
    category: 'client',
    trigger: 'client_color_complaint',
    condition: 'Cliente se queja de que el color no es igual al de su pantalla',
    action: 'Explicar que pantalla vs impresion siempre difieren. Ofrecer muestra fisica para proxima vez.',
    severity: 'INFO',
    confidence: 0.90,
    description_es:
      'Color en pantalla vs impresion siempre difiere. Ofrecer muestra fisica para proximas ordenes.',
  },
  {
    id: 'CLI-009',
    category: 'client',
    trigger: 'repeat_client',
    condition: 'Cliente con 3+ ordenes anteriores',
    action: 'Aplicar descuento de cliente frecuente. Verificar preferencias guardadas.',
    severity: 'INFO',
    confidence: 0.82,
    description_es:
      'Cliente frecuente. Aplicar descuento de lealtad y verificar preferencias anteriores.',
  },
  {
    id: 'CLI-010',
    category: 'client',
    trigger: 'client_payment_pending',
    condition: 'Anticipo no recibido despues de 72h de confirmacion',
    action: 'Enviar recordatorio de pago. No iniciar produccion sin anticipo.',
    severity: 'WARNING',
    confidence: 0.91,
    description_es:
      'Anticipo pendiente. Enviar recordatorio. No iniciar produccion hasta recibir pago.',
  },
  {
    id: 'CLI-011',
    category: 'client',
    trigger: 'client_requests_sample',
    condition: 'Cliente solicita muestra antes de orden grande',
    action: 'Producir muestra con cobro parcial. Ayuda a evitar problemas en produccion masiva.',
    severity: 'INFO',
    confidence: 0.84,
    description_es:
      'Cliente solicita muestra. Producir con cobro parcial. Reduce riesgo en produccion masiva.',
  },
  {
    id: 'CLI-012',
    category: 'client',
    trigger: 'client_vague_specs',
    condition: 'Especificaciones del cliente son vagas o incompletas',
    action: 'Enviar formulario de especificaciones completo. No iniciar sin datos claros.',
    severity: 'WARNING',
    confidence: 0.88,
    description_es:
      'Especificaciones vagas. Enviar formulario detallado al cliente para completar antes de iniciar.',
  },
  {
    id: 'CLI-013',
    category: 'client',
    trigger: 'client_compares_competitor',
    condition: 'Cliente menciona precios de competencia',
    action: 'Destacar calidad, garantia y servicio personalizado. No entrar en guerra de precios.',
    severity: 'INFO',
    confidence: 0.79,
    description_es:
      'Cliente compara precios. Destacar la calidad y servicio personalizado de V ONE B.',
  },
  {
    id: 'CLI-014',
    category: 'client',
    trigger: 'client_needs_invoice',
    condition: 'Cliente solicita factura electronica',
    action: 'Generar factura electronica con IVA 13%. Verificar cedula juridica/fisica del cliente.',
    severity: 'INFO',
    confidence: 0.88,
    description_es:
      'Factura electronica solicitada. Generar con IVA 13% y datos fiscales del cliente.',
  },
  {
    id: 'CLI-015',
    category: 'client',
    trigger: 'client_order_cancelled',
    condition: 'Cliente cancela orden despues de iniciar produccion',
    action: 'Cobrar materiales usados y trabajo realizado. Documentar estado de la orden.',
    severity: 'CRITICAL',
    confidence: 0.92,
    description_es:
      'Cancelacion despues de iniciar produccion. Cobrar materiales y trabajo realizado.',
  },
  {
    id: 'CLI-016',
    category: 'client',
    trigger: 'client_wants_different_sizes',
    condition: 'Orden con multiples tallas diferentes',
    action: 'Verificar distribucion de tallas. Confirmar cantidades exactas por talla con el cliente.',
    severity: 'INFO',
    confidence: 0.84,
    description_es:
      'Multiples tallas. Confirmar cantidades exactas por talla antes de cortar.',
  },
  {
    id: 'CLI-017',
    category: 'client',
    trigger: 'client_WhatsApp_order',
    condition: 'Cliente intenta hacer pedido completo por WhatsApp',
    action: 'Recibir info basica por WhatsApp, pero formalizar con formulario de orden completo.',
    severity: 'INFO',
    confidence: 0.82,
    description_es:
      'Pedido por WhatsApp. Recibir datos basicos, pero formalizar con orden escrita.',
  },
  {
    id: 'CLI-018',
    category: 'client',
    trigger: 'client_references_other_work',
    condition: 'Cliente muestra foto de trabajo de otro taller como referencia',
    action: 'Usar como referencia pero advertir que resultado puede variar segun materiales y equipo.',
    severity: 'INFO',
    confidence: 0.78,
    description_es:
      'Referencia de otro taller. Usar como guia pero advertir que el resultado puede variar.',
  },
  {
    id: 'CLI-019',
    category: 'client',
    trigger: 'client_deadline_unrealistic',
    condition: 'Cliente solicita entrega en plazo imposible',
    action: 'Explicar tiempos reales de produccion. Ofrecer la fecha mas cercana posible.',
    severity: 'WARNING',
    confidence: 0.90,
    description_es:
      'Plazo de entrega imposible. Explicar tiempos de produccion y ofrecer fecha realista.',
  },
  {
    id: 'CLI-020',
    category: 'client',
    trigger: 'client_requests_remake',
    condition: 'Cliente solicita rehechura por supuesto defecto',
    action: 'Verificar si el defecto es real. Si es de produccion, rehacer gratis. Si es percepcion, negociar.',
    severity: 'WARNING',
    confidence: 0.86,
    description_es:
      'Solicitud de rehechura. Verificar si el defecto es real antes de aprobar reproceso.',
  },
  {
    id: 'CLI-021',
    category: 'client',
    trigger: 'school_team_order',
    condition: 'Orden de uniformes escolares o equipos deportivos',
    action: 'Solicitar lista completa de tallas y nombres. Verificar fechas de eventos deportivos.',
    severity: 'INFO',
    confidence: 0.85,
    description_es:
      'Orden de equipo. Solicitar lista completa de jugadores, tallas y numeros. Considerar fecha del evento.',
  },
  {
    id: 'CLI-022',
    category: 'client',
    trigger: 'client_picks_up_late',
    condition: 'Cliente no recoge pedido listo despues de 7 dias',
    action: 'Enviar aviso final. Cobrar almacenaje si no recoge en 15 dias.',
    severity: 'INFO',
    confidence: 0.83,
    description_es:
      'Pedido sin recoger por 7+ dias. Enviar aviso. Cobrar almacenaje despues de 15 dias.',
  },
  {
    id: 'CLI-023',
    category: 'client',
    trigger: 'client_adds_to_order',
    condition: 'Cliente quiere agregar piezas a una orden ya en produccion',
    action: 'Crear orden adicional separada. No mezclar con orden en proceso.',
    severity: 'WARNING',
    confidence: 0.88,
    description_es:
      'Piezas adicionales a orden en proceso. Crear orden separada para no atrasar la original.',
  },
  {
    id: 'CLI-024',
    category: 'client',
    trigger: 'client_requests_sinpe',
    condition: 'Cliente quiere pagar por SINPE Movil',
    action: 'Proporcionar numero SINPE y nombre. Confirmar recepcion antes de procesar.',
    severity: 'INFO',
    confidence: 0.90,
    description_es:
      'Pago por SINPE Movil. Proporcionar datos y confirmar recepcion del pago.',
  },
  {
    id: 'CLI-025',
    category: 'client',
    trigger: 'client_no_file_access',
    condition: 'Cliente no tiene acceso al archivo original de su logo',
    action: 'Ofrecer servicio de vectorizacion por costo adicional. Buscar en internet version alta res.',
    severity: 'INFO',
    confidence: 0.82,
    description_es:
      'Cliente no tiene archivo original. Ofrecer vectorizacion o buscar version de mejor calidad.',
  },
  {
    id: 'CLI-026',
    category: 'client',
    trigger: 'event_date_approaching',
    condition: 'Fecha del evento del cliente es en < 5 dias',
    action: 'Priorizar orden. Verificar con produccion si se puede cumplir a tiempo.',
    severity: 'WARNING',
    confidence: 0.91,
    description_es:
      'Evento del cliente muy cerca. Priorizar orden y verificar factibilidad de entrega a tiempo.',
  },
  {
    id: 'CLI-027',
    category: 'client',
    trigger: 'client_very_satisfied',
    condition: 'Cliente expresa satisfaccion alta con el producto',
    action: 'Solicitar resena/testimonio. Ofrecer descuento en siguiente orden.',
    severity: 'INFO',
    confidence: 0.85,
    description_es:
      'Cliente satisfecho. Aprovechar para pedir resena y ofrecer descuento de referido.',
  },
  {
    id: 'CLI-028',
    category: 'client',
    trigger: 'client_sports_league',
    condition: 'Cliente es liga deportiva con multiples equipos',
    action: 'Ofrecer paquete de liga con descuento por volumen. Manejar como proyecto especial.',
    severity: 'INFO',
    confidence: 0.84,
    description_es:
      'Liga deportiva. Ofrecer paquete con descuento por volumen y gestion centralizada.',
  },
  {
    id: 'CLI-029',
    category: 'client',
    trigger: 'client_undecided',
    condition: 'Cliente no se decide entre opciones de diseno/material',
    action: 'Enviar comparativo visual de opciones. Si persiste, recomendar la opcion mas popular.',
    severity: 'INFO',
    confidence: 0.78,
    description_es:
      'Cliente indeciso. Enviar comparativo visual y recomendar la opcion mas popular.',
  },
  {
    id: 'CLI-030',
    category: 'client',
    trigger: 'client_international',
    condition: 'Cliente internacional o de zona remota',
    action: 'Verificar costos y tiempos de envio. Considerar envio por Correos de Costa Rica o courier.',
    severity: 'INFO',
    confidence: 0.81,
    description_es:
      'Cliente remoto. Calcular envio y comunicar tiempos de entrega realistas.',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// MACHINE & EQUIPMENT (30 escenarios)
// ─────────────────────────────────────────────────────────────────────────────

const MACHINE_SCENARIOS: TrainingScenario[] = [
  {
    id: 'MCH-001',
    category: 'machine',
    trigger: 'printer_paper_jam',
    condition: 'Impresora muestra error de atasco de papel/tela',
    action: 'Apagar, retirar material atascado con cuidado, limpiar rodillos, reiniciar.',
    severity: 'WARNING',
    confidence: 0.92,
    description_es:
      'Atasco en impresora. Apagar, retirar material con cuidado y limpiar rodillos.',
  },
  {
    id: 'MCH-002',
    category: 'machine',
    trigger: 'heat_press_temp_fluctuation',
    condition: 'Temperatura de prensa fluctuando > 5°C',
    action: 'Posible termopar defectuoso. No usar hasta reparar. Temperaturas inconsistentes arruinan piezas.',
    severity: 'CRITICAL',
    confidence: 0.90,
    description_es:
      'Temperatura de prensa inestable. Posible falla del termopar. No usar hasta reparar.',
  },
  {
    id: 'MCH-003',
    category: 'machine',
    trigger: 'cutting_motor_overheating',
    condition: 'Motor de cortadora se recalienta',
    action: 'Dejar enfriar 30 minutos. Verificar ventilacion y limpieza de filtros.',
    severity: 'WARNING',
    confidence: 0.88,
    description_es:
      'Motor de cortadora recalentado. Dejar enfriar 30 min. Verificar ventilacion.',
  },
  {
    id: 'MCH-004',
    category: 'machine',
    trigger: 'embroidery_thread_breaking',
    condition: 'Hilo de bordadora se rompe repetidamente',
    action: 'Verificar tension, limpiar guia-hilos, verificar calidad del hilo. Puede ser aguja doblada.',
    severity: 'WARNING',
    confidence: 0.86,
    description_es:
      'Hilo de bordadora se rompe seguido. Verificar tension, guia-hilos y aguja.',
  },
  {
    id: 'MCH-005',
    category: 'machine',
    trigger: 'label_printer_not_feeding',
    condition: 'Impresora de etiquetas no avanza el rollo',
    action: 'Verificar alineacion del rollo y sensor de etiquetas. Puede ser sensor sucio.',
    severity: 'INFO',
    confidence: 0.84,
    description_es:
      'Impresora de etiquetas no avanza. Verificar alineacion del rollo y limpiar sensor.',
  },
  {
    id: 'MCH-006',
    category: 'machine',
    trigger: 'rip_software_crash',
    condition: 'Software RIP se cierra inesperadamente',
    action: 'Reiniciar software. Si persiste, verificar RAM disponible y archivo problematico.',
    severity: 'WARNING',
    confidence: 0.83,
    description_es:
      'Software RIP se cerro. Reiniciar. Si persiste, puede ser falta de RAM o archivo corrupto.',
  },
  {
    id: 'MCH-007',
    category: 'machine',
    trigger: 'sewing_machine_skip_stitch',
    condition: 'Maquina de coser salta puntadas',
    action: 'Cambiar aguja, verificar tipo de aguja para la tela, limpiar cangrejo.',
    severity: 'WARNING',
    confidence: 0.87,
    description_es:
      'Maquina salta puntadas. Cambiar aguja, limpiar cangrejo y verificar tipo de aguja.',
  },
  {
    id: 'MCH-008',
    category: 'machine',
    trigger: 'plotter_calibration_needed',
    condition: 'Plotter de corte descalibrado (cortes imprecisos)',
    action: 'Ejecutar calibracion de origen y prueba de corte antes de continuar.',
    severity: 'WARNING',
    confidence: 0.89,
    description_es:
      'Plotter descalibrado. Ejecutar calibracion y prueba de corte antes de usar.',
  },
  {
    id: 'MCH-009',
    category: 'machine',
    trigger: 'compressor_low_pressure',
    condition: 'Presion de compresor baja para prensa neumatica',
    action: 'Verificar nivel de presion. Sin presion adecuada, la prensa no cierra correctamente.',
    severity: 'WARNING',
    confidence: 0.85,
    description_es:
      'Presion de compresor baja. La prensa neumatica no cierra bien. Verificar compresor.',
  },
  {
    id: 'MCH-010',
    category: 'machine',
    trigger: 'printer_maintenance_due',
    condition: 'Impresora ha excedido intervalo de mantenimiento',
    action: 'Programar mantenimiento preventivo. Sin mantenimiento, calidad baja gradualmente.',
    severity: 'INFO',
    confidence: 0.86,
    description_es:
      'Mantenimiento de impresora vencido. Programar limpieza y calibracion preventiva.',
  },
  {
    id: 'MCH-011',
    category: 'machine',
    trigger: 'ups_battery_low',
    condition: 'UPS con bateria baja',
    action: 'Un corte de luz puede perder trabajo en progreso. Guardar todo y reemplazar bateria.',
    severity: 'WARNING',
    confidence: 0.88,
    description_es:
      'Bateria de UPS baja. Un corte de luz puede perder trabajo. Reemplazar bateria.',
  },
  {
    id: 'MCH-012',
    category: 'machine',
    trigger: 'waste_ink_full',
    condition: 'Deposito de tinta residual lleno',
    action: 'Vaciar deposito de tinta residual. Si se desborda, mancha todo.',
    severity: 'WARNING',
    confidence: 0.91,
    description_es:
      'Deposito de tinta residual lleno. Vaciar antes de que se desborde.',
  },
  {
    id: 'MCH-013',
    category: 'machine',
    trigger: 'network_printer_offline',
    condition: 'Impresora no responde en red',
    action: 'Verificar conexion de red, reiniciar impresora, verificar IP.',
    severity: 'INFO',
    confidence: 0.83,
    description_es:
      'Impresora desconectada de la red. Verificar cable/wifi y reiniciar.',
  },
  {
    id: 'MCH-014',
    category: 'machine',
    trigger: 'heat_press_emergency_stop',
    condition: 'Boton de emergencia de prensa activado',
    action: 'Verificar que todo este seguro. Revisar la pieza que estaba en la prensa.',
    severity: 'CRITICAL',
    confidence: 0.95,
    description_es:
      'Paro de emergencia activado. Verificar seguridad antes de reiniciar la prensa.',
  },
  {
    id: 'MCH-015',
    category: 'machine',
    trigger: 'ink_cartridge_expired',
    condition: 'Cartucho de tinta vencido',
    action: 'Reemplazar cartucho. Tinta vencida puede obstruir cabezales y dar colores incorrectos.',
    severity: 'WARNING',
    confidence: 0.87,
    description_es:
      'Cartucho vencido. Reemplazar. Tinta vencida obstruye cabezales y altera colores.',
  },
  {
    id: 'MCH-016',
    category: 'machine',
    trigger: 'sewing_machine_oil_needed',
    condition: 'Maquina de coser necesita lubricacion',
    action: 'Lubricar puntos indicados en manual. Sin aceite, se recalienta y dana.',
    severity: 'INFO',
    confidence: 0.84,
    description_es:
      'Maquina de coser necesita aceite. Lubricar para prevenir desgaste y ruido.',
  },
  {
    id: 'MCH-017',
    category: 'machine',
    trigger: 'computer_storage_full',
    condition: 'Disco duro de estacion de trabajo lleno',
    action: 'Liberar espacio. Mover archivos viejos a respaldo. RIP no funciona sin espacio.',
    severity: 'WARNING',
    confidence: 0.86,
    description_es:
      'Disco lleno. Liberar espacio. El software RIP necesita espacio libre para funcionar.',
  },
  {
    id: 'MCH-018',
    category: 'machine',
    trigger: 'embroidery_hoop_damaged',
    condition: 'Bastidor de bordado deformado o roto',
    action: 'Reemplazar bastidor. Un bastidor danado causa disenos deformados.',
    severity: 'WARNING',
    confidence: 0.88,
    description_es:
      'Bastidor danado. Reemplazar. Un bastidor deformado produce disenos torcidos.',
  },
  {
    id: 'MCH-019',
    category: 'machine',
    trigger: 'steam_iron_leaking',
    condition: 'Plancha de vapor con fuga de agua',
    action: 'Detener uso. Agua sobre tela sublimada puede manchar. Reparar o reemplazar plancha.',
    severity: 'WARNING',
    confidence: 0.85,
    description_es:
      'Plancha de vapor con fuga. El agua puede manchar las prendas. Reparar.',
  },
  {
    id: 'MCH-020',
    category: 'machine',
    trigger: 'power_surge_detected',
    condition: 'Pico de voltaje detectado en el taller',
    action: 'Verificar reguladores de voltaje y UPS. Un pico puede danar equipos electronicos.',
    severity: 'CRITICAL',
    confidence: 0.90,
    description_es:
      'Pico de voltaje detectado. Verificar que los equipos esten protegidos con reguladores.',
  },
  {
    id: 'MCH-021',
    category: 'machine',
    trigger: 'dtg_white_ink_settling',
    condition: 'Tinta blanca DTG sedimentada (no se uso en > 3 dias)',
    action: 'Agitar cartucho, ejecutar ciclo de limpieza de cabezal blanco antes de imprimir.',
    severity: 'WARNING',
    confidence: 0.88,
    description_es:
      'Tinta blanca sedimentada. Agitar y ejecutar limpieza antes de imprimir.',
  },
  {
    id: 'MCH-022',
    category: 'machine',
    trigger: 'cutting_mat_worn',
    condition: 'Mat de corte con marcas profundas y desgaste',
    action: 'Reemplazar mat de corte. Un mat danado causa cortes imprecisos.',
    severity: 'INFO',
    confidence: 0.82,
    description_es:
      'Mat de corte desgastado. Reemplazar para mantener precision de corte.',
  },
  {
    id: 'MCH-023',
    category: 'machine',
    trigger: 'overlock_looper_timing',
    condition: 'Timing de loopers de overlock desajustado',
    action: 'Requiere tecnico. No intentar ajustar sin experiencia. Las puntadas salen irregulares.',
    severity: 'WARNING',
    confidence: 0.86,
    description_es:
      'Timing de overlock desajustado. Llamar tecnico. No intentar ajustar sin experiencia.',
  },
  {
    id: 'MCH-024',
    category: 'machine',
    trigger: 'print_head_life_ending',
    condition: 'Cabezal de impresion acercandose a fin de vida util',
    action: 'Programar reemplazo. Tener cabezal de repuesto listo para no parar produccion.',
    severity: 'INFO',
    confidence: 0.84,
    description_es:
      'Cabezal de impresion en fin de vida. Programar reemplazo y tener repuesto.',
  },
  {
    id: 'MCH-025',
    category: 'machine',
    trigger: 'air_conditioning_failure',
    condition: 'Aire acondicionado del taller falla',
    action: 'El calor afecta calidad de sublimacion y comodidad del operador. Reparar urgente.',
    severity: 'WARNING',
    confidence: 0.83,
    description_es:
      'Aire acondicionado fuera de servicio. Afecta calidad y productividad. Reparar pronto.',
  },
  {
    id: 'MCH-026',
    category: 'machine',
    trigger: 'barcode_scanner_malfunction',
    condition: 'Lector de codigo de barras no lee correctamente',
    action: 'Limpiar lente del lector. Si persiste, reemplazar. Sin escaner no hay trazabilidad.',
    severity: 'WARNING',
    confidence: 0.88,
    description_es:
      'Lector de barras no funciona. Limpiar lente. Sin lector no hay trazabilidad.',
  },
  {
    id: 'MCH-027',
    category: 'machine',
    trigger: 'sublimation_press_pad_worn',
    condition: 'Almohadilla de prensa de sublimacion desgastada',
    action: 'Reemplazar almohadilla. Desgaste causa presion desigual y transferencia parcial.',
    severity: 'WARNING',
    confidence: 0.85,
    description_es:
      'Almohadilla de prensa desgastada. Causa presion desigual. Reemplazar.',
  },
  {
    id: 'MCH-028',
    category: 'machine',
    trigger: 'pretreat_machine_clogged',
    condition: 'Maquina de pre-tratamiento DTG obstruida',
    action: 'Limpiar boquillas con solucion de limpieza. Sin pre-tratamiento, la tinta blanca no adhiere.',
    severity: 'WARNING',
    confidence: 0.87,
    description_es:
      'Maquina de pre-tratamiento obstruida. Sin pre-trat, la tinta blanca no adhiere en telas oscuras.',
  },
  {
    id: 'MCH-029',
    category: 'machine',
    trigger: 'conveyor_dryer_temp_off',
    condition: 'Secador de tunel con temperatura incorrecta',
    action: 'Ajustar temperatura. Muy alta = quema tinta/tela. Muy baja = tinta no cura.',
    severity: 'WARNING',
    confidence: 0.87,
    description_es:
      'Temperatura de secador de tunel incorrecta. Ajustar para curado adecuado.',
  },
  {
    id: 'MCH-030',
    category: 'machine',
    trigger: 'emergency_light_on',
    condition: 'Luz de emergencia o alarma activada en maquina',
    action: 'DETENER uso inmediato. Consultar manual de error. Puede ser sobrecalentamiento o falla.',
    severity: 'CRITICAL',
    confidence: 0.93,
    description_es:
      'Alarma de maquina activada. Detener uso. Consultar codigo de error en el manual.',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// DELIVERY & LOGISTICS (20 escenarios)
// ─────────────────────────────────────────────────────────────────────────────

const DELIVERY_SCENARIOS: TrainingScenario[] = [
  {
    id: 'DLV-001',
    category: 'delivery',
    trigger: 'package_returned',
    condition: 'Paquete devuelto por mensajero',
    action: 'Verificar direccion con cliente. Puede ser direccion incorrecta o persona ausente.',
    severity: 'WARNING',
    confidence: 0.88,
    description_es:
      'Paquete devuelto. Verificar direccion y disponibilidad del cliente.',
  },
  {
    id: 'DLV-002',
    category: 'delivery',
    trigger: 'client_not_available_pickup',
    condition: 'Cliente no se presenta a recoger despues de cita',
    action: 'Contactar por WhatsApp. Mantener en bodega por 7 dias, luego enviar aviso final.',
    severity: 'INFO',
    confidence: 0.84,
    description_es:
      'Cliente no recogio su pedido. Contactar y mantener hasta 7 dias.',
  },
  {
    id: 'DLV-003',
    category: 'delivery',
    trigger: 'multiple_orders_same_client',
    condition: 'Varias ordenes listas para el mismo cliente',
    action: 'Consolidar en un solo envio para ahorrar en logistica.',
    severity: 'INFO',
    confidence: 0.90,
    description_es:
      'Multiples ordenes del mismo cliente listas. Consolidar en un solo envio.',
  },
  {
    id: 'DLV-004',
    category: 'delivery',
    trigger: 'fragile_item_packing',
    condition: 'Producto fragil (taza, plato, objeto rigido)',
    action: 'Agregar burbuja, carton de proteccion y marcar como FRAGIL.',
    severity: 'INFO',
    confidence: 0.91,
    description_es:
      'Producto fragil. Empacar con burbuja y carton. Marcar como FRAGIL.',
  },
  {
    id: 'DLV-005',
    category: 'delivery',
    trigger: 'international_delivery',
    condition: 'Entrega fuera de Costa Rica',
    action: 'Verificar requisitos de aduana, documentacion y costos de envio internacional.',
    severity: 'WARNING',
    confidence: 0.85,
    description_es:
      'Envio internacional. Verificar aduanas, documentacion y costos antes de enviar.',
  },
  {
    id: 'DLV-006',
    category: 'delivery',
    trigger: 'order_ready_not_notified',
    condition: 'Orden lista pero cliente no ha sido notificado',
    action: 'Enviar notificacion por WhatsApp y correo. El cliente no sabe que esta listo.',
    severity: 'WARNING',
    confidence: 0.92,
    description_es:
      'Orden lista sin notificar al cliente. Enviar aviso por WhatsApp.',
  },
  {
    id: 'DLV-007',
    category: 'delivery',
    trigger: 'delivery_to_gam',
    condition: 'Entrega dentro del Gran Area Metropolitana (GAM)',
    action: 'Ofrecer envio por mensajero local. Tiempo estimado: 1-2 dias habiles.',
    severity: 'INFO',
    confidence: 0.88,
    description_es:
      'Entrega en GAM. Envio por mensajero local, 1-2 dias habiles.',
  },
  {
    id: 'DLV-008',
    category: 'delivery',
    trigger: 'delivery_outside_gam',
    condition: 'Entrega fuera del GAM (zona rural)',
    action: 'Usar Correos de Costa Rica o courier. Tiempo estimado: 3-5 dias habiles.',
    severity: 'INFO',
    confidence: 0.85,
    description_es:
      'Entrega fuera de GAM. Correos de CR o courier. 3-5 dias habiles.',
  },
  {
    id: 'DLV-009',
    category: 'delivery',
    trigger: 'packing_quality_check',
    condition: 'Empaque listo para revision final',
    action: 'Verificar: producto correcto, cantidad, proteccion, factura incluida, etiqueta de envio.',
    severity: 'INFO',
    confidence: 0.90,
    description_es:
      'Revision de empaque: producto correcto, cantidad, proteccion, factura y etiqueta.',
  },
  {
    id: 'DLV-010',
    category: 'delivery',
    trigger: 'batch_delivery_split',
    condition: 'Orden grande que se entrega en partes',
    action: 'Documentar que piezas van en cada entrega. Notificar al cliente cada envio parcial.',
    severity: 'INFO',
    confidence: 0.84,
    description_es:
      'Entrega parcial. Documentar piezas por envio y notificar al cliente.',
  },
  {
    id: 'DLV-011',
    category: 'delivery',
    trigger: 'wrong_order_packed',
    condition: 'Orden equivocada empacada para el cliente',
    action: 'DETENER envio. Verificar etiquetas y contenido. Error critico de logistica.',
    severity: 'CRITICAL',
    confidence: 0.97,
    description_es:
      'Orden incorrecta empacada. Detener envio. Verificar contenido contra orden.',
  },
  {
    id: 'DLV-012',
    category: 'delivery',
    trigger: 'rainy_season_precaution',
    condition: 'Temporada lluviosa (mayo-noviembre en CR)',
    action: 'Empacar con bolsa plastica adicional para proteger de humedad.',
    severity: 'INFO',
    confidence: 0.82,
    description_es:
      'Epoca lluviosa. Agregar bolsa plastica protectora al empaque.',
  },
  {
    id: 'DLV-013',
    category: 'delivery',
    trigger: 'delivery_delayed',
    condition: 'Entrega retrasada vs fecha prometida',
    action: 'Notificar al cliente ANTES de la fecha prometida. Ofrecer disculpa y nueva fecha.',
    severity: 'WARNING',
    confidence: 0.93,
    description_es:
      'Entrega atrasada. Notificar al cliente proactivamente con nueva fecha.',
  },
  {
    id: 'DLV-014',
    category: 'delivery',
    trigger: 'special_folding_required',
    condition: 'Prenda requiere doblado especial (jersey con numero visible)',
    action: 'Doblar mostrando el numero/nombre del jugador. Primera impresion cuenta.',
    severity: 'INFO',
    confidence: 0.80,
    description_es:
      'Doblar jersey mostrando numero y nombre. La presentacion cuenta.',
  },
  {
    id: 'DLV-015',
    category: 'delivery',
    trigger: 'gift_packaging_requested',
    condition: 'Cliente solicita empaque de regalo',
    action: 'Usar empaque especial. Cobro adicional si aplica.',
    severity: 'INFO',
    confidence: 0.83,
    description_es:
      'Empaque de regalo solicitado. Usar presentacion especial.',
  },
  {
    id: 'DLV-016',
    category: 'delivery',
    trigger: 'large_order_shipping',
    condition: 'Orden de > 30 unidades para envio',
    action: 'Calcular peso y volumen. Puede requerir envio en multiples cajas.',
    severity: 'INFO',
    confidence: 0.85,
    description_es:
      'Orden grande. Calcular logistica y considerar multiples cajas.',
  },
  {
    id: 'DLV-017',
    category: 'delivery',
    trigger: 'missing_piece_in_order',
    condition: 'Pieza faltante detectada al empacar',
    action: 'DETENER empaque. Buscar pieza faltante. Si no aparece, verificar en produccion.',
    severity: 'CRITICAL',
    confidence: 0.94,
    description_es:
      'Pieza faltante al empacar. Buscar en produccion antes de enviar incompleto.',
  },
  {
    id: 'DLV-018',
    category: 'delivery',
    trigger: 'tracking_number_not_shared',
    condition: 'Paquete enviado sin compartir tracking con cliente',
    action: 'Enviar numero de rastreo al cliente por WhatsApp.',
    severity: 'INFO',
    confidence: 0.88,
    description_es:
      'Paquete enviado. Compartir numero de rastreo con el cliente.',
  },
  {
    id: 'DLV-019',
    category: 'delivery',
    trigger: 'order_partially_ready',
    condition: 'Solo algunas piezas de la orden estan listas',
    action: 'Preguntar al cliente si quiere entrega parcial o esperar a que este todo.',
    severity: 'INFO',
    confidence: 0.83,
    description_es:
      'Orden parcialmente lista. Consultar al cliente si prefiere entrega parcial.',
  },
  {
    id: 'DLV-020',
    category: 'delivery',
    trigger: 'invoice_missing_in_package',
    condition: 'Factura no incluida en el paquete',
    action: 'Incluir copia de factura o enviar factura electronica por correo.',
    severity: 'INFO',
    confidence: 0.86,
    description_es:
      'Factura no incluida en paquete. Agregar o enviar por correo electronico.',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// MATERIAL (15 escenarios)
// ─────────────────────────────────────────────────────────────────────────────

const MATERIAL_SCENARIOS: TrainingScenario[] = [
  {
    id: 'MAT-001',
    category: 'material',
    trigger: 'fabric_stock_low',
    condition: 'Stock de tela principal < 10 metros',
    action: 'Hacer pedido a proveedor. Tiempo de entrega: 3-7 dias habiles.',
    severity: 'WARNING',
    confidence: 0.88,
    description_es:
      'Stock de tela bajo. Hacer pedido al proveedor antes de que se agote.',
  },
  {
    id: 'MAT-002',
    category: 'material',
    trigger: 'ink_stock_low',
    condition: 'Stock de tinta < 2 cartuchos de repuesto',
    action: 'Pedir cartuchos de repuesto. Sin tinta, la produccion se detiene.',
    severity: 'WARNING',
    confidence: 0.90,
    description_es:
      'Tinta baja. Pedir cartuchos de repuesto para no parar produccion.',
  },
  {
    id: 'MAT-003',
    category: 'material',
    trigger: 'vinyl_stock_low',
    condition: 'Stock de vinilo HTV < 3 metros del color principal',
    action: 'Hacer pedido de vinilo. Verificar colores mas usados.',
    severity: 'WARNING',
    confidence: 0.86,
    description_es:
      'Vinilo HTV bajo. Pedir reposicion de colores mas usados.',
  },
  {
    id: 'MAT-004',
    category: 'material',
    trigger: 'transfer_paper_low',
    condition: 'Stock de papel de sublimacion < 50 hojas',
    action: 'Pedir papel de sublimacion. Es consumible basico.',
    severity: 'INFO',
    confidence: 0.85,
    description_es:
      'Papel de sublimacion bajo. Pedir reposicion.',
  },
  {
    id: 'MAT-005',
    category: 'material',
    trigger: 'thread_color_unavailable',
    condition: 'Color de hilo especifico no disponible en inventario',
    action: 'Pedir al proveedor o usar el mas cercano (previa aprobacion del cliente).',
    severity: 'WARNING',
    confidence: 0.84,
    description_es:
      'Color de hilo no disponible. Pedir o consultar al cliente por alternativa.',
  },
  {
    id: 'MAT-006',
    category: 'material',
    trigger: 'fabric_defective_from_supplier',
    condition: 'Tela recibida del proveedor con defectos',
    action: 'Documentar y devolver al proveedor. No usar tela defectuosa en produccion.',
    severity: 'CRITICAL',
    confidence: 0.93,
    description_es:
      'Tela defectuosa del proveedor. Documentar y devolver. No usar.',
  },
  {
    id: 'MAT-007',
    category: 'material',
    trigger: 'needle_stock_low',
    condition: 'Stock de agujas por tipo < 5 unidades',
    action: 'Pedir agujas de repuesto por calibre. Son consumibles de uso diario.',
    severity: 'INFO',
    confidence: 0.83,
    description_es:
      'Agujas bajas. Pedir repuesto por calibre (70/10, 75/11, 80/12).',
  },
  {
    id: 'MAT-008',
    category: 'material',
    trigger: 'elastic_stock_low',
    condition: 'Stock de elastico < 20 metros',
    action: 'Pedir elastico. Verificar ancho mas usado.',
    severity: 'INFO',
    confidence: 0.82,
    description_es:
      'Elastico bajo. Pedir reposicion del ancho mas usado.',
  },
  {
    id: 'MAT-009',
    category: 'material',
    trigger: 'zipper_color_mismatch',
    condition: 'Color de cierre disponible no coincide con tela',
    action: 'Pedir cierre del color correcto al proveedor. No sustituir sin aprobacion.',
    severity: 'WARNING',
    confidence: 0.85,
    description_es:
      'Color de cierre no coincide. Pedir el correcto o consultar al cliente.',
  },
  {
    id: 'MAT-010',
    category: 'material',
    trigger: 'protective_paper_low',
    condition: 'Stock de papel protector de teflon bajo',
    action: 'Pedir papel protector. Sin el, se marcan las prendas al prensar.',
    severity: 'WARNING',
    confidence: 0.86,
    description_es:
      'Papel protector de teflon bajo. Sin el, la prensa marca las prendas.',
  },
  {
    id: 'MAT-011',
    category: 'material',
    trigger: 'label_stock_low',
    condition: 'Stock de etiquetas de marca < 50 unidades',
    action: 'Pedir etiquetas. Sin ellas no se puede empacar.',
    severity: 'WARNING',
    confidence: 0.87,
    description_es:
      'Etiquetas de marca bajas. Pedir reposicion.',
  },
  {
    id: 'MAT-012',
    category: 'material',
    trigger: 'packaging_supplies_low',
    condition: 'Stock de bolsas/cajas de empaque bajo',
    action: 'Pedir materiales de empaque. Sin empaque no se puede entregar.',
    severity: 'WARNING',
    confidence: 0.86,
    description_es:
      'Materiales de empaque bajos. Pedir bolsas y cajas.',
  },
  {
    id: 'MAT-013',
    category: 'material',
    trigger: 'pretreat_solution_low',
    condition: 'Solucion de pre-tratamiento DTG < 500ml',
    action: 'Pedir solucion. Sin pre-trat, no se puede imprimir blanco en telas oscuras.',
    severity: 'WARNING',
    confidence: 0.88,
    description_es:
      'Solucion de pre-tratamiento baja. Sin ella, no funciona la tinta blanca DTG.',
  },
  {
    id: 'MAT-014',
    category: 'material',
    trigger: 'cleaning_solution_low',
    condition: 'Solucion de limpieza de cabezales baja',
    action: 'Pedir solucion de limpieza. Necesaria para mantenimiento de impresora.',
    severity: 'INFO',
    confidence: 0.82,
    description_es:
      'Solucion de limpieza baja. Necesaria para mantenimiento de impresoras.',
  },
  {
    id: 'MAT-015',
    category: 'material',
    trigger: 'tape_heat_resistant_low',
    condition: 'Stock de cinta termica bajo',
    action: 'Pedir cinta termica. Es esencial para fijar papel en sublimacion.',
    severity: 'INFO',
    confidence: 0.84,
    description_es:
      'Cinta termica baja. Esencial para fijar papel en sublimacion.',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// PROCESS OPTIMIZATION (30 escenarios)
// ─────────────────────────────────────────────────────────────────────────────

const OPTIMIZATION_SCENARIOS: TrainingScenario[] = [
  {
    id: 'OPT-001',
    category: 'optimization',
    trigger: 'queue_imbalance',
    condition: 'Ratio de cola entre estaciones > 3:1',
    action: 'Redistribuir operadores. La estacion con mas cola necesita refuerzo.',
    severity: 'WARNING',
    confidence: 0.88,
    description_es:
      'Desbalance de colas. Mover operadores a la estacion con mas trabajo.',
  },
  {
    id: 'OPT-002',
    category: 'optimization',
    trigger: 'error_recurring',
    condition: 'Mismo tipo de error ocurre 3+ veces en una semana',
    action: 'Investigar causa raiz. No es coincidencia: hay un problema sistematico.',
    severity: 'WARNING',
    confidence: 0.92,
    description_es:
      'Error recurrente. Investigar causa raiz. Es un problema sistematico.',
  },
  {
    id: 'OPT-003',
    category: 'optimization',
    trigger: 'designer_faster_than_avg',
    condition: 'Disenador completa ordenes 30%+ mas rapido que promedio',
    action: 'Estudiar su flujo de trabajo. Puede servir de modelo para los demas.',
    severity: 'INFO',
    confidence: 0.80,
    description_es:
      'Disenador mas rapido que el promedio. Documentar su proceso como best practice.',
  },
  {
    id: 'OPT-004',
    category: 'optimization',
    trigger: 'morning_more_productive',
    condition: 'Produccion matutina > 40% mayor que vespertina',
    action: 'Posible fatiga vespertina. Considerar pausas activas o reorganizar turnos.',
    severity: 'INFO',
    confidence: 0.82,
    description_es:
      'Mananas mas productivas que tardes. Considerar pausas activas despues de almuerzo.',
  },
  {
    id: 'OPT-005',
    category: 'optimization',
    trigger: 'monday_high_errors',
    condition: 'Lunes tiene 2x+ mas errores que otros dias',
    action: 'Implementar "calentamiento" de inicio de semana: revision de maquinas y reunion corta.',
    severity: 'INFO',
    confidence: 0.79,
    description_es:
      'Mas errores los lunes. Implementar rutina de calentamiento al inicio de semana.',
  },
  {
    id: 'OPT-006',
    category: 'optimization',
    trigger: 'rush_orders_disrupting',
    condition: 'Ordenes urgentes interrumpen flujo de produccion normal',
    action: 'Crear carril dedicado para ordenes urgentes. No mezclar con flujo normal.',
    severity: 'WARNING',
    confidence: 0.86,
    description_es:
      'Ordenes urgentes disrumpen produccion. Crear carril dedicado para urgentes.',
  },
  {
    id: 'OPT-007',
    category: 'optimization',
    trigger: 'station_idle_time_high',
    condition: 'Estacion sin trabajo > 30 minutos en horario laboral',
    action: 'Reasignar operador a estacion con cola o tareas de mantenimiento.',
    severity: 'INFO',
    confidence: 0.84,
    description_es:
      'Estacion ociosa. Reasignar operador a donde haya trabajo.',
  },
  {
    id: 'OPT-008',
    category: 'optimization',
    trigger: 'batching_opportunity',
    condition: 'Multiples ordenes con mismo tipo de producto en cola',
    action: 'Agrupar ordenes similares para eficiencia. Menos cambios de setup = mas rapido.',
    severity: 'INFO',
    confidence: 0.87,
    description_es:
      'Ordenes similares en cola. Agrupar para reducir cambios de configuracion.',
  },
  {
    id: 'OPT-009',
    category: 'optimization',
    trigger: 'approval_bottleneck',
    condition: 'Multiples disenos esperando aprobacion del mismo supervisor',
    action: 'Delegar aprobaciones a disenador senior o implementar auto-aprobacion para cambios menores.',
    severity: 'WARNING',
    confidence: 0.85,
    description_es:
      'Cuello de botella en aprobaciones. Considerar delegar a disenador senior.',
  },
  {
    id: 'OPT-010',
    category: 'optimization',
    trigger: 'rework_rate_increasing',
    condition: 'Tasa de reproceso subiendo por 2+ semanas consecutivas',
    action: 'Tendencia negativa. Reunion con equipo para identificar problemas.',
    severity: 'WARNING',
    confidence: 0.89,
    description_es:
      'Tasa de reproceso subiendo. Reunion de equipo para identificar y corregir causas.',
  },
  {
    id: 'OPT-011',
    category: 'optimization',
    trigger: 'capacity_nearing_limit',
    condition: 'Capacidad diaria al > 85%',
    action: 'Cerca del limite. Considerar horas extra, subcontratacion o rechazar urgentes.',
    severity: 'WARNING',
    confidence: 0.88,
    description_es:
      'Capacidad casi al limite. Planificar horas extra o priorizar ordenes.',
  },
  {
    id: 'OPT-012',
    category: 'optimization',
    trigger: 'first_pass_yield_low',
    condition: 'Rendimiento de primera pasada < 80%',
    action: 'Muchas piezas requieren reproceso. Investigar por estacion cual tiene mas rechazos.',
    severity: 'WARNING',
    confidence: 0.87,
    description_es:
      'Rendimiento de primera pasada bajo. Muchos reprocesos. Identificar estacion problematica.',
  },
  {
    id: 'OPT-013',
    category: 'optimization',
    trigger: 'design_time_increasing',
    condition: 'Tiempo promedio de diseno aumentando',
    action: 'Verificar si los disenos son mas complejos o si hay problema de eficiencia.',
    severity: 'INFO',
    confidence: 0.81,
    description_es:
      'Tiempo de diseno subiendo. Verificar si es complejidad o ineficiencia.',
  },
  {
    id: 'OPT-014',
    category: 'optimization',
    trigger: 'client_wait_time_long',
    condition: 'Tiempo promedio desde orden hasta entrega > 5 dias',
    action: 'Analizar donde se pierde tiempo. Puede ser espera de aprobacion o cuello de botella.',
    severity: 'WARNING',
    confidence: 0.86,
    description_es:
      'Lead time alto. Analizar en que etapa se pierde mas tiempo.',
  },
  {
    id: 'OPT-015',
    category: 'optimization',
    trigger: 'operator_cross_training',
    condition: 'Operador solo sabe manejar una estacion',
    action: 'Capacitar en estacion adicional. Operadores multi-estacion dan flexibilidad.',
    severity: 'INFO',
    confidence: 0.80,
    description_es:
      'Capacitar operadores en multiples estaciones para mayor flexibilidad.',
  },
  {
    id: 'OPT-016',
    category: 'optimization',
    trigger: 'daily_standup_needed',
    condition: 'Multiples problemas no reportados descubiertos tarde',
    action: 'Implementar reunion diaria de 10 min para reportar estado y problemas.',
    severity: 'INFO',
    confidence: 0.83,
    description_es:
      'Implementar reunion diaria rapida para detectar problemas temprano.',
  },
  {
    id: 'OPT-017',
    category: 'optimization',
    trigger: 'weekend_orders_accumulating',
    condition: 'Ordenes del fin de semana se acumulan para el lunes',
    action: 'Considerar procesar disenos el sabado o prioritizar temprano el lunes.',
    severity: 'INFO',
    confidence: 0.81,
    description_es:
      'Acumulacion de ordenes del fin de semana. Planificar para el lunes.',
  },
  {
    id: 'OPT-018',
    category: 'optimization',
    trigger: 'setup_time_too_long',
    condition: 'Tiempo de cambio de setup entre trabajos > 15 min',
    action: 'Optimizar proceso de cambio. Preparar siguiente trabajo mientras corre el actual.',
    severity: 'INFO',
    confidence: 0.82,
    description_es:
      'Tiempo de setup alto. Preparar siguiente trabajo en paralelo.',
  },
  {
    id: 'OPT-019',
    category: 'optimization',
    trigger: 'qc_bottleneck',
    condition: 'Cola de QC creciendo mientras produccion avanza rapido',
    action: 'QC es cuello de botella. Agregar inspector o simplificar checklist para items simples.',
    severity: 'WARNING',
    confidence: 0.87,
    description_es:
      'QC es cuello de botella. Considerar inspector adicional o simplificar para items simples.',
  },
  {
    id: 'OPT-020',
    category: 'optimization',
    trigger: 'material_waste_tracking',
    condition: 'No se esta rastreando desperdicio de materiales',
    action: 'Implementar registro de desperdicio. No se puede mejorar lo que no se mide.',
    severity: 'INFO',
    confidence: 0.80,
    description_es:
      'Implementar rastreo de desperdicio de materiales para identificar mejoras.',
  },
  {
    id: 'OPT-021',
    category: 'optimization',
    trigger: 'high_inventory_cost',
    condition: 'Inventario de materiales > necesidad de 30 dias',
    action: 'Reducir inventario. Dinero parado en bodega. Pedir mas frecuente, menos cantidad.',
    severity: 'INFO',
    confidence: 0.79,
    description_es:
      'Inventario excesivo. Reducir para liberar capital. Pedir JIT.',
  },
  {
    id: 'OPT-022',
    category: 'optimization',
    trigger: 'production_flow_gap',
    condition: 'Tiempo muerto entre estaciones > 1 hora',
    action: 'Las piezas esperan entre estaciones. Optimizar flujo para que sean continuas.',
    severity: 'WARNING',
    confidence: 0.84,
    description_es:
      'Tiempo muerto entre estaciones. Optimizar flujo para reducir esperas.',
  },
  {
    id: 'OPT-023',
    category: 'optimization',
    trigger: 'peak_season_approaching',
    condition: 'Temporada alta se acerca (noviembre-diciembre, inicio escolar)',
    action: 'Preparar: stock extra de materiales, personal temporal, comunicar tiempos a clientes.',
    severity: 'WARNING',
    confidence: 0.86,
    description_es:
      'Temporada alta proximamente. Preparar inventario, personal y comunicar plazos.',
  },
  {
    id: 'OPT-024',
    category: 'optimization',
    trigger: 'operator_efficiency_drop',
    condition: 'Eficiencia de operador baja 20%+ vs su promedio',
    action: 'Hablar con el operador. Puede ser fatiga, problema personal o equipo defectuoso.',
    severity: 'INFO',
    confidence: 0.81,
    description_es:
      'Eficiencia de operador bajo su promedio. Verificar si necesita apoyo.',
  },
  {
    id: 'OPT-025',
    category: 'optimization',
    trigger: 'order_prioritization_needed',
    condition: 'Cola con mezcla de ordenes urgentes y normales',
    action: 'Ordenar por prioridad: URGENTE > fecha prometida mas cercana > orden de llegada.',
    severity: 'INFO',
    confidence: 0.89,
    description_es:
      'Cola mixta. Priorizar: urgentes primero, luego por fecha de entrega.',
  },
  {
    id: 'OPT-026',
    category: 'optimization',
    trigger: 'documentation_missing',
    condition: 'Procesos no documentados causan inconsistencias',
    action: 'Crear SOPs (procedimientos estandar) para cada estacion.',
    severity: 'INFO',
    confidence: 0.80,
    description_es:
      'Falta documentacion de procesos. Crear SOPs para cada estacion.',
  },
  {
    id: 'OPT-027',
    category: 'optimization',
    trigger: 'friday_end_of_day_rush',
    condition: 'Acumulacion de trabajo al final del viernes',
    action: 'No aceptar ordenes urgentes despues de las 2pm viernes. Dejar para lunes.',
    severity: 'INFO',
    confidence: 0.78,
    description_es:
      'Rush de viernes. No aceptar urgentes despues de las 2pm.',
  },
  {
    id: 'OPT-028',
    category: 'optimization',
    trigger: 'seasonal_design_templates',
    condition: 'Disenos similares se repiten en temporada (navidad, dia padre, etc.)',
    action: 'Crear plantillas pre-disenadas para temporadas. Reduce tiempo de diseno.',
    severity: 'INFO',
    confidence: 0.83,
    description_es:
      'Crear plantillas para temporadas frecuentes. Reduce tiempo de diseno.',
  },
  {
    id: 'OPT-029',
    category: 'optimization',
    trigger: 'color_profile_standardization',
    condition: 'Cada disenador usa perfiles de color diferentes',
    action: 'Estandarizar perfiles ICC para toda la empresa. Consistencia de color.',
    severity: 'WARNING',
    confidence: 0.86,
    description_es:
      'Estandarizar perfiles de color. Cada disenador con perfil diferente causa inconsistencias.',
  },
  {
    id: 'OPT-030',
    category: 'optimization',
    trigger: 'preventive_maintenance_schedule',
    condition: 'No hay calendario de mantenimiento preventivo',
    action: 'Crear calendario: impresoras cada 500 impresiones, prensas mensual, maquinas de coser semanal.',
    severity: 'WARNING',
    confidence: 0.87,
    description_es:
      'Implementar calendario de mantenimiento preventivo para todos los equipos.',
  },
]

// ─────────────────────────────────────────────────────────────────────────────
// Todos los escenarios combinados
// ─────────────────────────────────────────────────────────────────────────────

export const TRAINING_SCENARIOS: TrainingScenario[] = [
  ...PRODUCTION_SCENARIOS,
  ...QUALITY_SCENARIOS,
  ...DESIGN_SCENARIOS,
  ...CLIENT_SCENARIOS,
  ...MACHINE_SCENARIOS,
  ...DELIVERY_SCENARIOS,
  ...MATERIAL_SCENARIOS,
  ...OPTIMIZATION_SCENARIOS,
]

// ─────────────────────────────────────────────────────────────────────────────
// Metricas iniciales realistas para produccion textil
// ─────────────────────────────────────────────────────────────────────────────

export const INITIAL_METRICS: Record<string, number> = {
  // Tiempos promedio por estacion (en segundos)
  avg_time_EN_DISENO: 14400, // 4 horas
  avg_time_IMPRESION: 5400, // 1.5 horas
  avg_time_CORTE: 3600, // 1 hora
  avg_time_ARMADO: 7200, // 2 horas
  avg_time_EMPAQUE: 1800, // 30 min
  avg_time_EN_CONTROL_CALIDAD: 900, // 15 min
  avg_time_ESPERANDO_APROBACION_CLIENTE: 86400, // 24 horas (depende del cliente)

  // Tasas de calidad
  qc_pass_rate: 0.88, // 88% pasan QC primera vez
  qc_pass_rate_hourly: 0.88,
  first_approval_rate: 0.65, // 65% aprobados primera vez por cliente
  avg_revisions_per_order: 1.3,

  // Entregas
  on_time_delivery_rate: 0.82, // 82% a tiempo
  avg_lead_time_days: 3.5,

  // Capacidad
  daily_capacity_orders: 40,
  daily_throughput: 0, // Se actualiza diariamente
  daily_completed: 0,
  daily_incidents: 0,
  daily_active_orders: 0,

  // Errores y reproceso
  error_rate_weekly: 0.05, // 5%
  rework_rate: 0.04, // 4%
  error_rate_QC_FAILURE: 0.5, // 0.5 errores/hora en QC (tasa normal)

  // Disenadores
  designer_max_concurrent: 5,

  // Umbrales de estancamiento (en horas, para referencia)
  stale_threshold_hours_design: 48,
  stale_threshold_hours_production: 24,
  stale_threshold_hours_approval: 72,

  // Colas (profundidad normal)
  queue_depth_IMPRESION: 3,
  queue_depth_CORTE: 2,
  queue_depth_ARMADO: 4,
  queue_depth_EMPAQUE: 1,

  // Costos promedio de incidentes (en centimos CRC)
  incident_cost_MATERIAL_DEFECTUOSO: 1500000, // ~15,000 CRC
  incident_cost_ERROR_IMPRESION: 800000, // ~8,000 CRC
  incident_cost_ERROR_CORTE: 1200000, // ~12,000 CRC
  incident_cost_ERROR_COSTURA: 600000, // ~6,000 CRC
  incident_cost_ERROR_DISENO: 400000, // ~4,000 CRC
  incident_cost_EQUIPO_DANADO: 5000000, // ~50,000 CRC
}

// ─────────────────────────────────────────────────────────────────────────────
// Indices de busqueda para acceso rapido por categoria y trigger
// ─────────────────────────────────────────────────────────────────────────────

const scenariosByCategory = new Map<string, TrainingScenario[]>()
const scenariosByTrigger = new Map<string, TrainingScenario>()

for (const scenario of TRAINING_SCENARIOS) {
  // By category
  if (!scenariosByCategory.has(scenario.category)) {
    scenariosByCategory.set(scenario.category, [])
  }
  scenariosByCategory.get(scenario.category)!.push(scenario)

  // By trigger
  scenariosByTrigger.set(scenario.trigger, scenario)
}

/**
 * Busca escenarios por categoria.
 */
export function getScenariosByCategory(category: string): TrainingScenario[] {
  return scenariosByCategory.get(category) ?? []
}

/**
 * Busca un escenario por su trigger exacto.
 */
export function getScenarioByTrigger(trigger: string): TrainingScenario | undefined {
  return scenariosByTrigger.get(trigger)
}

/**
 * Busca escenarios que coincidan parcialmente con un texto.
 * Util para busqueda fuzzy en el asistente en tiempo real.
 */
export function searchScenarios(query: string, maxResults = 10): TrainingScenario[] {
  const lowerQuery = query.toLowerCase()
  const results: Array<{ scenario: TrainingScenario; score: number }> = []

  for (const scenario of TRAINING_SCENARIOS) {
    let score = 0
    const fields = [
      scenario.trigger,
      scenario.condition,
      scenario.action,
      scenario.description_es,
    ]

    for (const field of fields) {
      if (field.toLowerCase().includes(lowerQuery)) {
        score += 1
      }
    }

    if (score > 0) {
      results.push({ scenario, score })
    }
  }

  results.sort((a, b) => b.score - a.score)
  return results.slice(0, maxResults).map((r) => r.scenario)
}

// ─────────────────────────────────────────────────────────────────────────────
// Seed: carga la base de datos del cerebro AI con conocimiento inicial
// ─────────────────────────────────────────────────────────────────────────────

export async function seedAIBrain(): Promise<{
  scenariosLoaded: number
  metricsSeeded: number
}> {
  console.log('[AI Training] Sembrando cerebro AI con datos de entrenamiento...')

  let metricsSeeded = 0

  // 1. Cargar todas las metricas iniciales al memory store
  for (const [key, value] of Object.entries(INITIAL_METRICS)) {
    try {
      const existing = await memoryStore.getMetric(key)
      if (!existing) {
        await memoryStore.updateMetric(key, value)
        metricsSeeded++
      }
    } catch {
      // Si falla (tabla no existe aun, etc.), silenciar
    }
  }

  // 2. Almacenar escenarios de alta confianza como patrones pre-cargados
  let scenariosLoaded = 0
  const highConfidenceScenarios = TRAINING_SCENARIOS.filter(
    (s) => s.confidence >= 0.85 && s.severity !== 'INFO',
  )

  for (const scenario of highConfidenceScenarios) {
    try {
      await memoryStore.storePattern({
        type: `TRAINING_${scenario.category.toUpperCase()}`,
        title: `[Pre-cargado] ${scenario.id}: ${scenario.trigger}`,
        description: scenario.description_es,
        confidence: scenario.confidence,
        data: {
          trainingId: scenario.id,
          category: scenario.category,
          trigger: scenario.trigger,
          condition: scenario.condition,
          action: scenario.action,
          severity: scenario.severity,
          isTrainingData: true,
        },
      })
      scenariosLoaded++
    } catch {
      // Silenciar errores individuales para no detener el seed
    }
  }

  console.log(
    `[AI Training] Cerebro sembrado: ${metricsSeeded} metricas, ${scenariosLoaded} escenarios de alta confianza.`,
  )
  console.log(
    `[AI Training] Total de escenarios disponibles en memoria: ${TRAINING_SCENARIOS.length}`,
  )

  return { scenariosLoaded, metricsSeeded }
}
