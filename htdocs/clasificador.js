/* ==================================================================
   EcoApp — CLASIFICADOR v13.0
   ==================================================================
   Clasifica por material y devuelve información ampliada.
   ================================================================== */

(function () {
  "use strict";

  /* ============================================================
     ICONOS SVG
     ============================================================ */
  const SVG = {
    plastico: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="plasBody" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f0f5f0"/><stop offset=".45" stop-color="#a8d0e0"/><stop offset="1" stop-color="#5a8fa0"/></linearGradient></defs><rect x="24" y="4" width="16" height="10" rx="2" fill="#2d5a3d"/><path d="M22 20 Q22 26 20 30 L20 54 Q20 58 24 58 L40 58 Q44 58 44 54 L44 30 Q42 26 42 20 Z" fill="url(#plasBody)" stroke="#4a6b7a" stroke-width=".5"/><rect x="24" y="34" width="16" height="10" rx="1" fill="#c99a3f"/></svg>`,
    carton: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M8 22 L32 12 L56 22 L32 32 Z" fill="#e8cf9e"/><path d="M8 22 L32 32 L32 58 L8 46 Z" fill="#8a6a42"/><path d="M56 22 L32 32 L32 58 L56 46 Z" fill="#a17e52"/></svg>`,
    metal: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="metBody" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#f5f5f5"/><stop offset=".35" stop-color="#c8ccd0"/><stop offset=".7" stop-color="#8a9096"/><stop offset="1" stop-color="#5a6066"/></linearGradient></defs><ellipse cx="32" cy="14" rx="14" ry="4" fill="#b8bec4"/><rect x="18" y="14" width="28" height="36" fill="url(#metBody)"/><ellipse cx="32" cy="50" rx="14" ry="4" fill="#7a8086"/></svg>`,
    vidrio: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><defs><linearGradient id="vidBody" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#e8f2e4"/><stop offset=".5" stop-color="#a8d4a4"/><stop offset="1" stop-color="#4a7a4a"/></linearGradient></defs><rect x="16" y="10" width="32" height="4" rx="1.5" fill="#9a8a5a"/><path d="M18 20 L18 54 Q18 58 22 58 L42 58 Q46 58 46 54 L46 20 Z" fill="url(#vidBody)" stroke="#4a6a4a" stroke-width=".5"/></svg>`,
    organico: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><path d="M10 42 Q22 18 42 22 Q56 24 56 38 Q56 50 44 52 Q28 54 14 48 Z" fill="#f5d76e" stroke="#8a6a1a" stroke-width=".5"/><path d="M20 14 Q34 4 48 12 Q42 24 30 24 Q22 24 20 14 Z" fill="#5a9a3a"/></svg>`,
    tetrapak: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><polygon points="12,20 40,14 40,52 12,58" fill="#c86a5a"/><polygon points="40,14 54,20 54,52 40,52" fill="#7a3020"/><polygon points="12,20 40,14 54,20 26,26" fill="#e8a898"/><rect x="16" y="30" width="18" height="10" fill="#f5e8d8" opacity=".9"/></svg>`,
    pila: `<svg viewBox="0 0 64 64" xmlns="http://www.w3.org/2000/svg"><rect x="20" y="10" width="24" height="46" rx="3" fill="#2a2a2a"/><rect x="24" y="4" width="16" height="6" rx="1" fill="#c99a3f"/><rect x="20" y="26" width="24" height="12" fill="#c99a3f"/></svg>`
  };

  /* ============================================================
     PUNTOS DE RECICLAJE
     ============================================================ */
  const PUNTOS = {
    plastico: [
      { nombre: "Centro de Acopio Municipal de Escobedo", direccion: "Av. Raúl Salinas Lozano s/n, Escobedo, N.L.", horario: "Lun-Vie 8:00-17:00", telefono: "81 8388 0000", materiales: "PET, HDPE, plásticos mixtos" },
      { nombre: "Punto Verde Escobedo Centro", direccion: "Calle Benito Juárez 500, Centro, Escobedo", horario: "Lun-Sáb 9:00-18:00", telefono: "81 8388 0100", materiales: "PET, bolsas, plásticos" },
      { nombre: "Recicladora del Norte", direccion: "Av. Las Torres 1200, Escobedo", horario: "Lun-Vie 8:30-17:30", telefono: "81 8388 0200", materiales: "PET, plásticos mixtos" },
      { nombre: "Walmart Escobedo - Recolector PET", direccion: "Av. Miguel Alemán 200, Escobedo", horario: "Lun-Dom 8:00-22:00", materiales: "PET" }
    ],
    carton: [
      { nombre: "Papelera del Norte", direccion: "Av. Industrias 300, Escobedo", horario: "Lun-Vie 8:00-17:00", telefono: "81 8388 0600", materiales: "Cartón, papel, periódico" },
      { nombre: "Centro de Acopio Municipal de Escobedo", direccion: "Av. Raúl Salinas Lozano s/n, Escobedo", horario: "Lun-Vie 8:00-17:00", telefono: "81 8388 0000", materiales: "Cartón, papel" },
      { nombre: "Cartones y Empaques del Norte", direccion: "Av. Las Torres 1500, Escobedo", horario: "Lun-Sáb 9:00-18:00", telefono: "81 8388 0700", materiales: "Cartón corrugado, tubos" },
      { nombre: "Punto Verde Escobedo Centro", direccion: "Calle Benito Juárez 500, Centro", horario: "Lun-Sáb 9:00-18:00", telefono: "81 8388 0100", materiales: "Cartón, papel" }
    ],
    metal: [
      { nombre: "Chatarra y Metales Escobedo", direccion: "Carr. Miguel Alemán Km 15, Escobedo", horario: "Lun-Sáb 8:00-18:00", telefono: "81 8388 0400", materiales: "Aluminio, fierro, cobre" },
      { nombre: "Centro de Acopio Municipal de Escobedo", direccion: "Av. Raúl Salinas Lozano s/n, Escobedo", horario: "Lun-Vie 8:00-17:00", telefono: "81 8388 0000", materiales: "Aluminio, PET, cartón" },
      { nombre: "Aceros y Metales del Norte", direccion: "Av. Constitución 800, Escobedo", horario: "Lun-Vie 9:00-18:00", telefono: "81 8388 0500", materiales: "Aluminio, fierro" }
    ],
    vidrio: [
      { nombre: "Vidriera de Escobedo", direccion: "Av. López Mateos 450, Escobedo", horario: "Lun-Vie 9:00-18:00", telefono: "81 8388 0900", materiales: "Vidrio transparente, verde, ámbar" },
      { nombre: "Centro de Acopio Municipal de Escobedo", direccion: "Av. Raúl Salinas Lozano s/n, Escobedo", horario: "Lun-Vie 8:00-17:00", telefono: "81 8388 0000", materiales: "Vidrio, PET, cartón" },
      { nombre: "Punto Verde Escobedo Centro", direccion: "Calle Benito Juárez 500, Centro", horario: "Lun-Sáb 9:00-18:00", telefono: "81 8388 0100", materiales: "Vidrio" }
    ],
    organico: [
      { nombre: "Composta Municipal de Escobedo", direccion: "Camino a las Pedreras s/n, Escobedo", horario: "Lun-Vie 8:00-16:00", telefono: "81 8388 0800", materiales: "Residuos orgánicos" },
      { nombre: "Centro de Acopio Municipal de Escobedo", direccion: "Av. Raúl Salinas Lozano s/n, Escobedo", horario: "Lun-Vie 8:00-17:00", telefono: "81 8388 0000", materiales: "Orgánicos" },
      { nombre: "Mercado Municipal de Escobedo", direccion: "Calle Hidalgo 200, Centro", horario: "Lun-Dom 6:00-15:00", materiales: "Orgánicos" }
    ],
    tetrapak: [
      { nombre: "Centro de Acopio Municipal de Escobedo", direccion: "Av. Raúl Salinas Lozano s/n, Escobedo", horario: "Lun-Vie 8:00-17:00", telefono: "81 8388 0000", materiales: "Tetra Pak, envases multicapa" },
      { nombre: "Recicladora del Norte", direccion: "Av. Las Torres 1200, Escobedo", horario: "Lun-Vie 8:30-17:30", telefono: "81 8388 0200", materiales: "Tetra Pak, cartón" },
      { nombre: "Papelera del Norte", direccion: "Av. Industrias 300, Escobedo", horario: "Lun-Vie 8:00-17:00", telefono: "81 8388 0600", materiales: "Envases multicapa" }
    ],
    pila: [
      { nombre: "Centro de Acopio Municipal de Escobedo", direccion: "Av. Raúl Salinas Lozano s/n, Escobedo", horario: "Lun-Vie 8:00-17:00", telefono: "81 8388 0000", materiales: "Pilas, baterías" },
      { nombre: "Punto Verde Escobedo Centro", direccion: "Calle Benito Juárez 500, Centro", horario: "Lun-Sáb 9:00-18:00", telefono: "81 8388 0100", materiales: "Pilas, electrónicos" },
      { nombre: "Home Depot Escobedo - Punto pilas", direccion: "Av. Miguel Alemán 500, Escobedo", horario: "Lun-Dom 7:00-21:00", materiales: "Pilas alcalinas" }
    ]
  };

  /* ============================================================
     CATÁLOGO EXTENDIDO CON MUCHA MÁS INFORMACIÓN
     ============================================================ */
  const MATERIALES = [
    {
      id: "carton",
      nombre: "Cartón",
      material: "Cartón (papel prensado de celulosa)",
      categoria: "Papel/Cartón",
      biodegradable: true,
      nivelImpacto: "Bajo",
      tiempoDegradacion: "2 a 5 meses",
      composicion: "Fibras vegetales de celulosa prensadas (pino, eucalipto o papel reciclado)",
      reciclable: "Sí, hasta 7 veces antes de perder calidad",
      energiaAhorro: "70% menos energía que producir cartón nuevo",
      aguaAhorro: "26,000 litros por tonelada reciclada",
      co2Ahorro: "1.1 toneladas de CO₂ por tonelada reciclada",
      impacto: "Se biodegrada en semanas o pocos meses. El cartón se recicla entre 5 y 7 veces antes de perder calidad.",
      alternativas: ["Empaques de tela reutilizables", "Cajas plásticas retornables", "Empaques certificados FSC", "Compra a granel sin empaque"],
      segundaVida: ["Organizador", "Manualidades", "Base para compostaje", "Semillero", "Alimento para lombrices"],
      reciclaje: "Retira cintas, grapas y cualquier plástico adherido. Aplana completamente y deposita en el contenedor de papel y cartón.",
      curiosidad: "Reciclar 1 tonelada de cartón salva 17 árboles adultos y ahorra 26,000 litros de agua.",
      mejoresConsumir: ["Productos a granel sin empaque", "Empaques de tela reutilizables", "Cajas plásticas retornables", "Bolsa de tela para compras"],
      datos: [
        "El cartón corrugado es el material más reciclado del mundo: 80% se recupera.",
        "Un árbol adulto produce aproximadamente 12,000 hojas de papel.",
        "El cartón húmedo no se puede reciclar: la fibra se deshace.",
        "El cartón compostable se degrada en 90 días en condiciones óptimas."
      ],
      consejos: [
        "Aplasta las cajas para ahorrar espacio en el contenedor.",
        "Retira cintas adhesivas y grapas antes de reciclar.",
        "Guarda las cajas limpias y secas para mejor reciclaje.",
        "Puedes usarlas como base para compostaje doméstico."
      ],
      impactoAmbiental: "Si no se recicla, el cartón genera metano al descomponerse en rellenos sanitarios. Al reciclarlo, ahorras agua, energía y reduces la tala de árboles.",
      svgIcon: SVG.carton
    },
    {
      id: "plastico",
      nombre: "Plástico",
      material: "Plástico (PET, HDPE, LDPE, PP, PS, PVC u otros)",
      categoria: "Plástico",
      biodegradable: false,
      nivelImpacto: "Alto",
      tiempoDegradacion: "150 a 450 años según el tipo",
      composicion: "Polímeros sintéticos derivados del petróleo (etileno, propileno, estireno, etc.)",
      reciclable: "Sí, pero solo ciertos tipos. PET (#1) y HDPE (#2) son los más fáciles.",
      energiaAhorro: "Hasta 70% menos energía que producir plástico nuevo",
      aguaAhorro: "Ahorra litros en su producción primaria",
      co2Ahorro: "Reduce emisiones al evitar producción virgen",
      impacto: "Puede tardar siglos en degradarse. Es uno de los materiales más reciclables si se separa bien. Los microplásticos contaminan océanos y suelo.",
      alternativas: ["Botellas reutilizables de acero", "Bolsas de tela", "Envases de vidrio retornable", "Productos a granel"],
      segundaVida: ["Maceta", "Organizador", "Comedero para aves", "Manualidades", "Eco-ladrillos", "Portavelas"],
      reciclaje: "Enjuaga, retira tapas y etiquetas. Aplasta para ahorrar espacio. Separa por tipo si es posible (PET #1, HDPE #2, LDPE #4).",
      curiosidad: "Reciclar una botella de PET ahorra energía suficiente para un foco LED durante 6 horas.",
      mejoresConsumir: ["Botellas de vidrio retornables", "Termos de acero inoxidable", "Bolsas de tela o malla", "Sistemas de agua a granel"],
      datos: [
        "Cada minuto se compran un millón de botellas de plástico en el mundo.",
        "Solo el 9% de todo el plástico producido en la historia se ha reciclado.",
        "Cada persona genera ~50 kg de plástico al año en promedio.",
        "Una botella de PET tarda 450 años en degradarse en el mar."
      ],
      consejos: [
        "Enjuaga los envases antes de reciclar para evitar contaminar el lote.",
        "Retira las tapas: son de otro tipo de plástico (PP #5).",
        "Aplasta botellas para reducir volumen de transporte.",
        "Lleva tus propias bolsas de tela al supermercado."
      ],
      impactoAmbiental: "Los plásticos de un solo uso son la principal fuente de contaminación marina. Los microplásticos ya están en nuestra agua, comida y aire.",
      svgIcon: SVG.plastico
    },
    {
      id: "metal",
      nombre: "Metal",
      material: "Metal (aluminio, fierro, acero, cobre)",
      categoria: "Metal",
      biodegradable: false,
      nivelImpacto: "Medio",
      tiempoDegradacion: "200 a 500 años",
      composicion: "Elementos metálicos como aluminio, hierro, cobre, estaño o aleaciones",
      reciclable: "Sí, infinitamente sin perder calidad",
      energiaAhorro: "95% menos energía que producir aluminio nuevo",
      aguaAhorro: "Ahorra miles de litros por tonelada",
      co2Ahorro: "9 toneladas de CO₂ por tonelada de aluminio reciclado",
      impacto: "100% reciclable infinitamente sin perder calidad. Reciclar aluminio ahorra 95% de la energía necesaria para producirlo.",
      alternativas: ["Envases retornables de vidrio", "Termos reutilizables", "Bebidas a granel"],
      segundaVida: ["Portalápices", "Maceta colgante", "Molde repostería", "Organizador", "Lámpara artesanal"],
      reciclaje: "Enjuaga, aplasta ligeramente para ahorrar espacio y deposita en el contenedor de metales. Separa aluminio de fierro si es posible.",
      curiosidad: "Una lata de aluminio puede volver al anaquel en menos de 60 días tras reciclarse.",
      mejoresConsumir: ["Bebidas en vidrio retornable", "Termos reutilizables", "Jugos naturales en casa", "Presentaciones familiares"],
      datos: [
        "El aluminio es el material más reciclado del mundo: 75% sigue en uso.",
        "Reciclar una lata ahorra la energía de 3 horas de TV.",
        "El acero también es 100% reciclable e infinito.",
        "EE.UU. tira anualmente latas por $700 millones de dólares en aluminio."
      ],
      consejos: [
        "Enjuaga las latas antes de reciclar (restos atraen insectos).",
        "Aplasta sin doblar demasiado para facilitar el procesamiento.",
        "No mezcles aluminio con fierro si el centro lo separa.",
        "Los metales son el material más valioso para reciclar."
      ],
      impactoAmbiental: "La minería del aluminio es muy contaminante. Reciclarlo reduce drásticamente la contaminación por minería y el consumo energético.",
      svgIcon: SVG.metal
    },
    {
      id: "vidrio",
      nombre: "Vidrio",
      material: "Vidrio (sílice, carbonato de sodio, caliza)",
      categoria: "Vidrio",
      biodegradable: false,
      nivelImpacto: "Medio",
      tiempoDegradacion: "Más de 4,000 años",
      composicion: "Sílice (arena), carbonato de sodio y caliza fundidos a más de 1,500°C",
      reciclable: "Sí, infinitamente sin perder calidad",
      energiaAhorro: "30% menos energía que producir vidrio nuevo",
      aguaAhorro: "Reduce extracción de arena de ríos y playas",
      co2Ahorro: "Reduce emisiones de la industria vidriera",
      impacto: "100% reciclable infinitamente sin perder calidad. No contamina el ambiente pero tarda milenios en descomponerse.",
      alternativas: ["Frascos retornables", "Contenedores a granel", "Envases de acero inoxidable"],
      segundaVida: ["Vaso", "Florero", "Contenedor de especias", "Lámpara", "Portavelas", "Maceta"],
      reciclaje: "Enjuaga, retira tapas metálicas o plásticas, deposita en el contenedor de vidrio. Separa por color (transparente, verde, ámbar).",
      curiosidad: "El vidrio se puede reciclar infinitas veces sin perder calidad: no se degrada con el reciclaje.",
      mejoresConsumir: ["Frascos retornables", "Compra a granel en tus envases", "Vidrio para almacenamiento", "Reutilizar frascos para conservas"],
      datos: [
        "El vidrio no se degrada: cada botella puede reciclarse infinitamente.",
        "Se fabrica a 1,500°C a partir de arena de sílice.",
        "Los romanos ya producían vidrio hace más de 2,000 años.",
        "1 tonelada de vidrio reciclado = 1 tonelada de vidrio nuevo."
      ],
      consejos: [
        "Separa por color: el vidrio claro, verde y ámbar se procesan distinto.",
        "No mezcles con cerámica, porcelana o espejos (tienen otra composición).",
        "Retira tapas y etiquetas metálicas antes de reciclar.",
        "Los frascos lavados pueden reutilizarse como envases."
      ],
      impactoAmbiental: "La extracción de arena es uno de los mayores problemas ambientales actuales. Reciclar vidrio reduce la demanda de arena virgen.",
      svgIcon: SVG.vidrio
    },
    {
      id: "organico",
      nombre: "Orgánico",
      material: "Materia orgánica (restos de comida, cáscaras, hojas)",
      categoria: "Orgánico",
      biodegradable: true,
      nivelImpacto: "Bajo",
      tiempoDegradacion: "2 a 5 semanas",
      composicion: "Materia vegetal o animal: celulosa, almidones, azúcares, proteínas, agua",
      reciclable: "Sí, mediante compostaje o biodigestión",
      energiaAhorro: "Genera biogás aprovechable",
      aguaAhorro: "Retiene agua en el suelo",
      co2Ahorro: "Evita metano en rellenos sanitarios",
      impacto: "Se descompone en semanas. Si se entierra sin aire (rellenos sanitarios), genera metano, un gas de efecto invernadero 25 veces más potente que el CO₂.",
      alternativas: ["Consumir la fruta completa", "Aprovechar cáscaras para compostaje", "Alimentación sin desperdicio"],
      segundaVida: ["Compostaje casero", "Abono líquido", "Alimento para animales", "Biofertilizante", "Biogás"],
      reciclaje: "Separa y destina a composta o al contenedor de orgánicos. Nunca lo mezcles con plásticos. Evita aceites y carnes en composta casera.",
      curiosidad: "El 40% de los residuos domésticos son orgánicos y pueden convertirse en abono en 3 meses.",
      mejoresConsumir: ["Frutas locales y de temporada", "Productos a granel", "Alimentos orgánicos", "Aprovechar todas las partes"],
      datos: [
        "El 40% de la basura doméstica es orgánica.",
        "1 tonelada de composta evita 0.5 toneladas de CO₂ equivalente.",
        "El compostaje reduce hasta 50% el volumen de basura.",
        "El 1/3 de los alimentos producidos en el mundo se desperdicia."
      ],
      consejos: [
        "Separa cáscaras, restos de verduras y café en un recipiente aparte.",
        "Evita aceites, carnes y lácteos en compostaje casero.",
        "Voltea la composta cada 2 semanas para airearla.",
        "Usa el abono en plantas, jardín o huerto urbano."
      ],
      impactoAmbiental: "Cuando los orgánicos van a rellenos sanitarios, generan metano. Compostarlos reduce el 5% de las emisiones globales de gases de efecto invernadero.",
      svgIcon: SVG.organico
    },
    {
      id: "tetrapak",
      nombre: "Tetra Pak",
      material: "Envase multicapa (cartón + aluminio + polietileno)",
      categoria: "Otros",
      biodegradable: false,
      nivelImpacto: "Medio",
      tiempoDegradacion: "30 a 100 años",
      composicion: "75% cartón, 20% polietileno y 5% aluminio, en 6 capas laminadas",
      reciclable: "Sí, en plantas especializadas de hidropulpado",
      energiaAhorro: "Ahorro energético considerable al reciclar multicapa",
      aguaAhorro: "Reduce demanda de pulpa virgen",
      co2Ahorro: "Reduce emisiones de la industria de empaques",
      impacto: "Al combinar 6 materiales requiere plantas especializadas para reciclarse. Si no se separa bien, contamina el cartón común.",
      alternativas: ["Bebidas en vidrio retornable", "Bebidas frescas en casa", "Leche a granel en garrafones"],
      segundaVida: ["Organizador cortando el envase", "Base para semilleros", "Manualidades", "Maceta"],
      reciclaje: "Enjuaga, aplana y lleva a puntos de acopio de multicapa. NO lo pongas con cartón común ni con plásticos. Requiere proceso especial.",
      curiosidad: "Tiene 6 capas: cartón, plástico y aluminio, lo que lo hace muy resistente pero difícil de reciclar.",
      mejoresConsumir: ["Leche o jugos en vidrio retornable", "Bebidas frescas en casa", "Leche a granel en garrafones", "Envases de un solo material"],
      datos: [
        "Suecia recicla el 90% de sus envases Tetra Pak.",
        "México tiene plantas de reciclaje especializadas en Tetrapak.",
        "1 envase tiene 6 capas: cartón, polietileno y aluminio.",
        "El proceso de reciclaje separa las capas con agua a presión."
      ],
      consejos: [
        "Enjuaga bien antes de llevarlo al punto de acopio.",
        "Aplana el envase para ahorrar espacio.",
        "No lo mezcles con cartón común: contamina el lote.",
        "Pregunta en tu municipio si hay punto específico para multicapa."
      ],
      impactoAmbiental: "El Tetra Pak es uno de los envases más difíciles de reciclar por sus 6 capas combinadas. Requiere plantas especializadas que aún no están en todas las ciudades.",
      svgIcon: SVG.tetrapak
    },
    {
      id: "pila",
      nombre: "Pila / Batería",
      material: "Pila (zinc, manganeso, litio, cadmio, níquel)",
      categoria: "Peligroso",
      biodegradable: false,
      nivelImpacto: "Alto",
      tiempoDegradacion: "No se degrada de forma segura: libera metales pesados por siglos",
      composicion: "Metales pesados (mercurio, cadmio, plomo, litio) y electrolitos corrosivos",
      reciclable: "Sí, en plantas especializadas que recuperan metales",
      energiaAhorro: "Recupera metales valiosos",
      aguaAhorro: "Evita contaminación de acuíferos",
      co2Ahorro: "Reduce minería de metales vírgenes",
      impacto: "Contamina suelo y agua con metales pesados. NUNCA va en la basura común. Una sola pila puede contaminar miles de litros de agua.",
      alternativas: ["Pilas recargables", "Dispositivos con batería integrada recargable", "Productos solares o manuales"],
      segundaVida: ["Solo acopio especializado"],
      reciclaje: "NUNCA en la basura común. Lleva a contenedores especiales de pilas en centros de acopio o tiendas de electrónica.",
      curiosidad: "Una sola pila puede contaminar hasta 3,000 litros de agua y 1 metro cúbico de tierra.",
      mejoresConsumir: ["Pilas recargables con cargador", "Dispositivos con batería recargable", "Productos solares o manuales", "Evitar pilas desechables"],
      datos: [
        "Una pila alcalina contamina 3,000 litros de agua.",
        "Una pila de botón puede contaminar 600,000 litros de agua.",
        "El cadmio de las pilas es cancerígeno.",
        "Una pila recargable reemplaza hasta 1,000 desechables."
      ],
      consejos: [
        "Nunca tires pilas a la basura común: son residuos peligrosos.",
        "Guárdalas en un frasco de vidrio hasta llevarlas al acopio.",
        "Usa pilas recargables: ahorras dinero y contaminación.",
        "Las tiendas de electrónica suelen tener buzones para pilas."
      ],
      impactoAmbiental: "Las pilas son el residuo doméstico más tóxico. Los metales pesados contaminan el agua subterránea por siglos y afectan la salud humana.",
      svgIcon: SVG.pila
    }
  ];

  /* ============================================================
     ANÁLISIS DE IMAGEN
     ============================================================ */
  const SIZE = 100;

  function rgbToHsl(r, g, b) {
    r /= 255; g /= 255; b /= 255;
    const max = Math.max(r, g, b), min = Math.min(r, g, b);
    let h, s, l = (max + min) / 2;
    if (max === min) { h = 0; s = 0; }
    else {
      const d = max - min;
      s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
      switch (max) {
        case r: h = (g - b) / d + (g < b ? 6 : 0); break;
        case g: h = (b - r) / d + 2; break;
        default: h = (r - g) / d + 4;
      }
      h *= 60;
    }
    return { h, s: s * 100, l: l * 100 };
  }

  function analizarImagen(dataUrl) {
    return new Promise((resolve) => {
      if (!dataUrl) { resolve(null); return; }
      const img = new Image();
      img.onload = () => {
        try {
          const canvas = document.createElement("canvas");
          canvas.width = SIZE;
          canvas.height = SIZE;
          const ctx = canvas.getContext("2d");
          ctx.drawImage(img, 0, 0, SIZE, SIZE);
          const data = ctx.getImageData(0, 0, SIZE, SIZE).data;
          const total = SIZE * SIZE;

          const esquinas = [];
          const tamEsq = Math.floor(SIZE * 0.12);
          for (let y = 0; y < tamEsq; y++) {
            for (let x = 0; x < tamEsq; x++) {
              esquinas.push([x, y], [SIZE - 1 - x, y], [x, SIZE - 1 - y], [SIZE - 1 - x, SIZE - 1 - y]);
            }
          }
          let sumEsqLum = 0;
          for (const [x, y] of esquinas) {
            const i = (y * SIZE + x) * 4;
            sumEsqLum += rgbToHsl(data[i], data[i + 1], data[i + 2]).l;
          }
          const fondoClaro = (sumEsqLum / esquinas.length) > 78;

          let accR = 0, accG = 0, accB = 0;
          let accSat = 0, accLum = 0;
          let contObjeto = 0;
          let contBlancos = 0, contOscuros = 0, contGrises = 0;
          let contRojos = 0, contNaranjas = 0, contAmarillos = 0;
          let contVerdes = 0, contCian = 0, contAzules = 0, contMorados = 0, contRosas = 0;
          let contVerdeBrillante = 0, contAzulBrillante = 0, contMarron = 0;

          for (let i = 0; i < data.length; i += 4) {
            const r = data[i], g = data[i + 1], b = data[i + 2];
            const hsl = rgbToHsl(r, g, b);

            if (fondoClaro && hsl.l > 88 && hsl.s < 20) {
              contBlancos++;
              continue;
            }

            contObjeto++;
            accR += r; accG += g; accB += b;
            accSat += hsl.s;
            accLum += hsl.l;

            if (hsl.l > 88) { contBlancos++; continue; }
            if (hsl.l < 20) { contOscuros++; continue; }
            if (hsl.s < 15) { contGrises++; continue; }

            const h = hsl.h;
            if (h < 15 || h >= 345) contRojos++;
            else if (h < 45) contNaranjas++;
            else if (h < 70) { contAmarillos++; if (h >= 25 && h < 55) contMarron++; }
            else if (h < 100) contVerdes++;
            else if (h < 160) { contVerdes++; contVerdeBrillante++; }
            else if (h < 200) contCian++;
            else if (h < 260) { contAzules++; contAzulBrillante++; }
            else if (h < 300) contMorados++;
            else contRosas++;
          }

          if (contObjeto < total * 0.08) {
            contObjeto = total;
            accR = 0; accG = 0; accB = 0; accSat = 0; accLum = 0;
            for (let i = 0; i < data.length; i += 4) {
              accR += data[i]; accG += data[i + 1]; accB += data[i + 2];
              const hsl = rgbToHsl(data[i], data[i + 1], data[i + 2]);
              accSat += hsl.s; accLum += hsl.l;
            }
          }

          const avgR = accR / contObjeto;
          const avgG = accG / contObjeto;
          const avgB = accB / contObjeto;
          const satProm = accSat / contObjeto;
          const lumProm = accLum / contObjeto;

          const denom = Math.max(1, contObjeto);
          const propBlanco = contBlancos / denom;
          const propOscuro = contOscuros / denom;
          const propGris = contGrises / denom;
          const propRojo = contRojos / denom;
          const propNaranja = contNaranjas / denom;
          const propAmarillo = contAmarillos / denom;
          const propVerde = contVerdes / denom;
          const propCian = contCian / denom;
          const propAzul = contAzules / denom;
          const propMorado = contMorados / denom;
          const propRosa = contRosas / denom;
          const propVerdeBrillante = contVerdeBrillante / denom;
          const propAzulBrillante = contAzulBrillante / denom;
          const propMarron = contMarron / denom;

          const gray = new Float32Array(total);
          for (let i = 0, j = 0; i < data.length; i += 4, j++) {
            gray[j] = 0.2126 * data[i] + 0.7152 * data[i + 1] + 0.0722 * data[i + 2];
          }
          const histGray = new Uint32Array(256);
          for (let i = 0; i < gray.length; i++) histGray[Math.round(Math.max(0, Math.min(255, gray[i])))]++;
          let sumaTotal = 0;
          for (let i = 0; i < 256; i++) sumaTotal += i * histGray[i];
          let sumaFondo = 0, pesoFondo = 0, maxVar = 0, umbral = 128;
          for (let t = 0; t < 256; t++) {
            pesoFondo += histGray[t];
            if (pesoFondo === 0) continue;
            const pesoFrente = total - pesoFondo;
            if (pesoFrente === 0) break;
            sumaFondo += t * histGray[t];
            const mF = sumaFondo / pesoFondo;
            const mFr = (sumaTotal - sumaFondo) / pesoFrente;
            const v = pesoFondo * pesoFrente * (mF - mFr) ** 2;
            if (v > maxVar) { maxVar = v; umbral = t; }
          }
          const binary = new Uint8Array(total);
          for (let i = 0; i < gray.length; i++) binary[i] = gray[i] > umbral ? 1 : 0;

          let xMin = SIZE, xMax = 0, yMin = SIZE, yMax = 0, contPix = 0;
          for (let y = 0; y < SIZE; y++) for (let x = 0; x < SIZE; x++) {
            if (binary[y * SIZE + x]) {
              if (x < xMin) xMin = x; if (x > xMax) xMax = x;
              if (y < yMin) yMin = y; if (y > yMax) yMax = y;
              contPix++;
            }
          }
          const ancho = Math.max(1, xMax - xMin);
          const alto = Math.max(1, yMax - yMin);
          const aspecto = ancho / alto;
          const areaRelativa = contPix / total;

          resolve({
            sat: satProm,
            lum: lumProm,
            aspecto,
            area: areaRelativa,
            propBlanco, propOscuro, propGris,
            propRojo, propNaranja, propAmarillo,
            propVerde, propCian, propAzul, propMorado, propRosa,
            propVerdeBrillante, propAzulBrillante, propMarron,
            r: avgR, g: avgG, b: avgB
          });
        } catch (e) {
          console.error("Error analizando imagen:", e);
          resolve(null);
        }
      };
      img.onerror = () => resolve(null);
      img.src = dataUrl;
    });
  }

  /* ============================================================
     CLASIFICAR POR MATERIAL
     ============================================================ */
  function clasificar(a) {
    if (!a) {
      const item = MATERIALES[0];
      return { ...item, confianza: 50, puntos: PUNTOS[item.id] || [], detalles: null };
    }

    const {
      sat, lum, aspecto,
      propBlanco, propOscuro, propGris,
      propRojo, propNaranja, propAmarillo,
      propVerde, propCian, propAzul, propMorado, propRosa,
      propVerdeBrillante, propAzulBrillante, propMarron
    } = a;

    const propColorVivo = propRojo + propNaranja + propAmarillo + propVerde + propCian + propAzul + propMorado + propRosa;

    const scores = {
      carton: 0, plastico: 0, metal: 0, vidrio: 0, organico: 0, tetrapak: 0, pila: 0
    };

    // CARTÓN
    if (propMarron > 0.15) scores.carton += propMarron * 200;
    if (propMarron > 0.3) scores.carton += 40;
    if (sat > 15 && sat < 70 && lum > 30 && lum < 80) scores.carton += 25;
    if (propNaranja > 0.15 && propMarron > 0.1) scores.carton += 20;
    if (propAzulBrillante > 0.15) scores.carton -= 60;
    if (propVerdeBrillante > 0.2) scores.carton -= 60;
    if (propRojo > 0.3) scores.carton -= 40;

    // PLÁSTICO
    if (propAzulBrillante > 0.15) scores.plastico += propAzulBrillante * 220;
    if (propVerdeBrillante > 0.2) scores.plastico += propVerdeBrillante * 200;
    if (propAzul > 0.2) scores.plastico += 30;
    if (propVerde > 0.3) scores.plastico += 25;
    if (propBlanco > 0.3 && propColorVivo > 0.1) scores.plastico += 20;
    if (propRojo > 0.15 && sat > 40) scores.plastico += 20;
    if (propMorado > 0.1 || propRosa > 0.1) scores.plastico += 25;
    if (sat > 50) scores.plastico += 15;
    if (propMarron > 0.25) scores.plastico -= 70;

    // METAL
    if (propGris > 0.3) scores.metal += propGris * 180;
    if (sat < 18) scores.metal += 40;
    if (propGris > 0.4 && sat < 15) scores.metal += 30;
    if (sat < 20 && lum > 40 && propColorVivo < 0.1) scores.metal += 30;
    if (propColorVivo > 0.2) scores.metal -= 50;
    if (propMarron > 0.15) scores.metal -= 40;

    // VIDRIO
    if (propVerde > 0.15 && propVerdeBrillante < 0.15 && propAzul < 0.1) scores.vidrio += 60;
    if (propBlanco > 0.2 && propVerde > 0.1) scores.vidrio += 30;
    if (propCian > 0.15) scores.vidrio += 20;
    if (propVerdeBrillante > 0.2) scores.vidrio -= 50;
    if (propMarron > 0.2) scores.vidrio -= 40;

    // ORGÁNICO
    if (propRojo > 0.15 && sat > 40) scores.organico += propRojo * 150;
    if (propNaranja > 0.15 && sat > 40) scores.organico += propNaranja * 150;
    if (propAmarillo > 0.15 && sat > 40) scores.organico += propAmarillo * 120;
    if (propMarron > 0.2 && sat > 30 && lum < 60) scores.organico += 40;
    if (propAzulBrillante > 0.15) scores.organico -= 60;
    if (propCian > 0.2) scores.organico -= 40;
    if (propGris > 0.4) scores.organico -= 40;

    // TETRA PAK
    if (propBlanco > 0.25 && propAzul > 0.08) scores.tetrapak += 70;
    if (propBlanco > 0.25 && propRojo > 0.08) scores.tetrapak += 60;
    if (propBlanco > 0.2 && propAzul > 0.1 && propVerde > 0.1) scores.tetrapak += 50;
    if (aspecto > 0.3 && aspecto < 0.8 && propBlanco > 0.2) scores.tetrapak += 25;
    if (propBlanco < 0.15) scores.tetrapak -= 50;
    if (propMarron > 0.3) scores.tetrapak -= 40;

    // PILA
    if (propOscuro > 0.3) scores.pila += propOscuro * 200;
    if (propOscuro > 0.4) scores.pila += 40;
    if (propGris > 0.2 && propOscuro > 0.2) scores.pila += 30;
    if (propOscuro < 0.15) scores.pila -= 80;
    if (propColorVivo > 0.2) scores.pila -= 60;

    const ranking = Object.entries(scores)
      .map(([id, score]) => ({ id, score, material: MATERIALES.find(m => m.id === id) }))
      .sort((a, b) => b.score - a.score);

    const elegido = ranking[0];
    const segundo = ranking[1];

    let confianza = 50;
    if (elegido.score > 100) confianza = 75;
    else if (elegido.score > 60) confianza = 65;
    else if (elegido.score > 30) confianza = 55;
    else confianza = 45;

    const ventaja = elegido.score - segundo.score;
    if (ventaja > 50) confianza += 15;
    else if (ventaja > 25) confianza += 10;
    else if (ventaja > 10) confianza += 5;
    confianza = Math.max(35, Math.min(96, Math.round(confianza)));

    return {
      ...elegido.material,
      confianza,
      puntos: PUNTOS[elegido.id] || [],
      detalles: ranking.slice(0, 4).map(r => ({
        id: r.id,
        nombre: r.material ? r.material.nombre : r.id,
        score: r.score,
        confianzaRelativa: Math.max(5, Math.min(100, Math.round(50 + r.score * 0.3)))
      }))
    };
  }

  /* ============================================================
     EXPORTAR
     ============================================================ */
  window.ECOAPP = { SVG, PUNTOS, MATERIALES, analizarImagen, clasificar };
  window.MOTOR = { analizarImagen };
  window.ecoappDetectarResiduo = clasificar;
  window.ECOAPP_DATASET = MATERIALES;
  window.ECOAPP_PUNTOS = PUNTOS;
  window.ECOAPP_SVG = SVG;

})();