-- ==========================================================
-- SignAI v2.0 — Seed Data (datos iniciales)
-- Ejecutar DESPUÉS de schema.sql
-- ==========================================================

SET NAMES utf8mb4;

-- ==========================================================
-- LETRAS A-Z
-- ==========================================================
INSERT INTO `letters` (`letter`, `description`, `hint`, `difficulty`, `order_index`) VALUES
('A', 'Puño cerrado con el pulgar al costado', 'Como cuando dices "bueno" con la mano cerrada', 'easy', 1),
('B', 'Mano abierta, dedos juntos y pulgar doblado hacia la palma', 'Como una bofetada pero con dedos juntos', 'easy', 2),
('C', 'Mano curvada formando una C', 'Como si sostuvieras una taza', 'easy', 3),
('D', 'Índice arriba, los demás dedos tocan el pulgar', 'Como señalando al cielo', 'easy', 4),
('E', 'Dedos doblados tocando el pulgar', 'Como garras suaves', 'medium', 5),
('F', 'Pulgar e índice juntos, los demás extendidos', 'Como el gesto de "OK" pero con dedos arriba', 'easy', 6),
('G', 'Índice y pulgar paralelos horizontalmente', 'Como si midieras algo pequeño', 'medium', 7),
('H', 'Índice y medio extendidos horizontalmente', 'Como dos dedos apuntando al frente', 'easy', 8),
('I', 'Meñique extendido, puño cerrado', 'Como el gesto de "te llamo"', 'easy', 9),
('J', 'Meñique extendido dibujando una J en el aire', 'Como el gesto de "te llamo" pero trazando una J', 'medium', 10),
('K', 'Índice y medio arriba, pulgar al centro', 'Como una pistola con el pulgar arriba', 'medium', 11),
('L', 'Índice arriba y pulgar formando una L', 'Como una pistola apuntando al cielo', 'easy', 12),
('M', 'Pulgar bajo tres dedos', 'Como si contaras 3 con la mano girada', 'hard', 13),
('N', 'Pulgar bajo dos dedos', 'Como si contaras 2 con la mano girada', 'hard', 14),
('O', 'Dedos formando un círculo con el pulgar', 'Como el gesto de "perfecto"', 'easy', 15),
('P', 'Como la K pero apuntando hacia abajo', 'Como una pistola apuntando al suelo', 'hard', 16),
('Q', 'Como la G pero apuntando hacia abajo', 'Como midiendo algo en el suelo', 'hard', 17),
('R', 'Índice y medio cruzados', 'Como el gesto de "buena suerte"', 'medium', 18),
('S', 'Puño con el pulgar sobre los dedos', 'Como un puño cerrado normal', 'easy', 19),
('T', 'Pulgar entre el índice y el medio', 'Como si sostuvieras algo pequeño', 'medium', 20),
('U', 'Índice y medio juntos hacia arriba', 'Como dos dedos pegados apuntando arriba', 'easy', 21),
('V', 'Índice y medio en forma de V', 'Como el gesto de "victoria"', 'easy', 22),
('W', 'Índice, medio y anular extendidos', 'Como el número 3 con dedos separados', 'easy', 23),
('X', 'Índice doblado como gancho', 'Como un gancho de pirata', 'medium', 24),
('Y', 'Pulgar y meñique extendidos', 'Como el gesto de "llámame"', 'easy', 25),
('Z', 'Índice dibujando una Z en el aire', 'Como si firmaras en el aire', 'medium', 26);

-- ==========================================================
-- PALABRAS INICIALES (30+ palabras)
-- ==========================================================
INSERT INTO `words` (`word`, `slug`, `category`, `description`, `hint`, `difficulty`, `order_index`) VALUES
('Hola', 'hola', 'saludos', 'Mano abierta cerca de la sien, moviéndose hacia afuera', 'Como un saludo militar pero suave', 'easy', 1),
('Adiós', 'adios', 'saludos', 'Mano abierta despidiéndose con movimiento', 'Como cuando dices adiós con la mano', 'easy', 2),
('Buenos días', 'buenos-dias', 'saludos', 'Mano desde la boca hacia arriba como el sol saliendo', 'Como si el sol saliera de tu boca', 'easy', 3),
('Buenas noches', 'buenas-noches', 'saludos', 'Mano desde arriba bajando como el sol poniéndose', 'Como si el sol se ocultara', 'easy', 4),
('Gracias', 'gracias', 'cortesia', 'Mano desde la barbilla hacia adelante', 'Como si enviaras un beso desde la barbilla', 'easy', 5),
('Por favor', 'por-favor', 'cortesia', 'Mano plana sobre el pecho en movimientos circulares', 'Como si acariciaras tu pecho', 'easy', 6),
('Perdón', 'perdon', 'cortesia', 'Puño cerrado en el pecho en círculos', 'Como si te golpearas el pecho suavemente', 'easy', 7),
('Sí', 'si', 'basico', 'Puño cerrado moviéndose arriba y abajo (como asentir)', 'Como un puño que dice sí', 'easy', 8),
('No', 'no', 'basico', 'Índice y medio golpeando el pulgar', 'Como un pico que dice no', 'easy', 9),
('Tal vez', 'tal-vez', 'basico', 'Manos balanceándose alternadamente', 'Como si pesaras algo dudoso', 'medium', 10),
('Amor', 'amor', 'emociones', 'Manos cruzadas sobre el pecho', 'Como si abrazaras tu corazón', 'medium', 11),
('Feliz', 'feliz', 'emociones', 'Manos subiendo por el pecho repetidamente', 'Como si tu corazón saltara de alegría', 'easy', 12),
('Triste', 'triste', 'emociones', 'Manos bajando por el rostro', 'Como si limpiaras lágrimas', 'easy', 13),
('Enojado', 'enojado', 'emociones', 'Mano cerrada frente al pecho, moviéndose hacia arriba', 'Como si mostraras tensión', 'medium', 14),
('Familia', 'familia', 'familia', 'Ambas manos formando una F en círculo', 'Como si abrazaras a toda tu familia', 'medium', 15),
('Mamá', 'mama', 'familia', 'Mano abierta tocando el mentón', 'Como señalando a mamá', 'easy', 16),
('Papá', 'papa', 'familia', 'Mano abierta tocando la frente', 'Como señalando a papá', 'easy', 17),
('Hermano', 'hermano', 'familia', 'Dos dedos juntos bajando del mentón', 'Como indicando hermano', 'medium', 18),
('Amigo', 'amigo', 'personas', 'Índices entrelazados y luego separados', 'Como dos personas unidas', 'medium', 19),
('Niño', 'nino', 'personas', 'Mano plana bajando a la altura de un niño', 'Como indicando altura pequeña', 'easy', 20),
('Casa', 'casa', 'lugares', 'Manos formando un techo', 'Como si construyeras un techo', 'easy', 21),
('Escuela', 'escuela', 'lugares', 'Manos aplaudiendo dos veces', 'Como el timbre de la escuela', 'medium', 22),
('Trabajo', 'trabajo', 'lugares', 'Puño golpeando el puño opuesto', 'Como martillar', 'medium', 23),
('Comida', 'comida', 'comida', 'Mano hacia la boca repetidamente', 'Como si llevaras comida a la boca', 'easy', 24),
('Agua', 'agua', 'comida', 'Mano en forma de C hacia la boca', 'Como si bebieras de una taza', 'easy', 25),
('Pan', 'pan', 'comida', 'Mano plana cortando el aire', 'Como cortando pan', 'easy', 26),
('Café', 'cafe', 'comida', 'Puño girando como molinillo', 'Como si molieras café', 'easy', 27),
('Tiempo', 'tiempo', 'tiempo', 'Índice tocando la muñeca como reloj', 'Como si revisaras tu reloj', 'easy', 28),
('Hoy', 'hoy', 'tiempo', 'Ambas manos bajando frente al cuerpo', 'Como indicando el momento actual', 'easy', 29),
('Mañana', 'manana', 'tiempo', 'Pulgar en la palma, mano avanzando', 'Como si empujaras hacia el futuro', 'easy', 30),
('Ayer', 'ayer', 'tiempo', 'Pulgar en la palma, mano retrocediendo', 'Como si regresaras al pasado', 'easy', 31),
('Rojo', 'rojo', 'colores', 'Índice bajando por los labios', 'Como si pintaras tus labios', 'easy', 32),
('Azul', 'azul', 'colores', 'Mano girando en el aire', 'Como si mezclaras el aire', 'easy', 33),
('Verde', 'verde', 'colores', 'Mano girando como la letra V', 'Como si giraras una V', 'easy', 34),
('Uno', 'uno', 'numeros', 'Índice levantado', 'Como el número 1', 'easy', 35),
('Dos', 'dos', 'numeros', 'Índice y medio levantados', 'Como el número 2', 'easy', 36),
('Tres', 'tres', 'numeros', 'Pulgar, índice y medio levantados', 'Como el número 3', 'easy', 37),
('Bien', 'bien', 'basico', 'Pulgar arriba', 'Como el gesto de aprobación', 'easy', 38),
('Mal', 'mal', 'basico', 'Pulgar abajo', 'Como el gesto de desaprobación', 'easy', 39),
('Ayuda', 'ayuda', 'basico', 'Puño sobre palma abierta, ambos suben', 'Como si te apoyaras en alguien', 'medium', 40);

-- ==========================================================
-- LECCIONES
-- ==========================================================
INSERT INTO `lessons` (`title`, `slug`, `description`, `level`, `category`, `icon`, `order_index`, `xp_reward`) VALUES
('Introducción al Abecedario', 'intro-abecedario', 'Aprende las letras básicas A-E', 1, 'abecedario', '🔤', 1, 20),
('Letras F-J', 'letras-f-j', 'Continúa con F hasta J', 1, 'abecedario', '🔠', 2, 20),
('Letras K-O', 'letras-k-o', 'Domina K hasta O', 1, 'abecedario', '🔡', 3, 20),
('Letras P-T', 'letras-p-t', 'Aprende P hasta T', 2, 'abecedario', '🅿️', 4, 25),
('Letras U-Z', 'letras-u-z', 'Completa el abecedario', 2, 'abecedario', '🔚', 5, 25),
('Saludos Básicos', 'saludos-basicos', 'Hola, Adiós, Gracias, Por favor', 1, 'vocabulario', '👋', 6, 30),
('Palabras Cotidianas', 'palabras-cotidianas', 'Comida, Casa, Familia, Tiempo', 2, 'vocabulario', '🏠', 7, 35),
('Emociones', 'emociones', 'Amor, Feliz, Triste, Enojado', 2, 'vocabulario', '❤️', 8, 35),
('Familia y Personas', 'familia-personas', 'Mamá, Papá, Amigo, Hermano', 2, 'vocabulario', '👨‍👩‍👧', 9, 35),
('Colores y Números', 'colores-numeros', 'Rojo, Azul, Uno, Dos, Tres', 2, 'vocabulario', '🌈', 10, 40),
('Conversación Básica', 'conversacion-basica', 'Forma frases simples', 3, 'conversacion', '💬', 11, 50),
('Preguntas Comunes', 'preguntas-comunes', '¿Cómo estás? ¿Qué haces?', 3, 'conversacion', '❓', 12, 50),
('En el Restaurante', 'restaurante', 'Pide comida y bebidas', 3, 'conversacion', '🍽️', 13, 55),
('En la Escuela', 'escuela', 'Vocabulario escolar', 3, 'conversacion', '🎒', 14, 55),
('En el Doctor', 'doctor', 'Síntomas y salud', 4, 'avanzado', '🏥', 15, 60);

-- ==========================================================
-- ITEMS DE LECCIONES
-- ==========================================================
INSERT INTO `lesson_items` (`lesson_id`, `item_type`, `item_value`, `order_index`) VALUES
(1,'letter','A',1),(1,'letter','B',2),(1,'letter','C',3),(1,'letter','D',4),(1,'letter','E',5),
(2,'letter','F',1),(2,'letter','G',2),(2,'letter','H',3),(2,'letter','I',4),(2,'letter','J',5),
(3,'letter','K',1),(3,'letter','L',2),(3,'letter','M',3),(3,'letter','N',4),(3,'letter','O',5),
(4,'letter','P',1),(4,'letter','Q',2),(4,'letter','R',3),(4,'letter','S',4),(4,'letter','T',5),
(5,'letter','U',1),(5,'letter','V',2),(5,'letter','W',3),(5,'letter','X',4),(5,'letter','Y',5),(5,'letter','Z',6),
(6,'word','Hola',1),(6,'word','Adiós',2),(6,'word','Gracias',3),(6,'word','Por favor',4),
(7,'word','Comida',1),(7,'word','Casa',2),(7,'word','Familia',3),(7,'word','Tiempo',4),
(8,'word','Amor',1),(8,'word','Feliz',2),(8,'word','Triste',3),(8,'word','Enojado',4),
(9,'word','Mamá',1),(9,'word','Papá',2),(9,'word','Amigo',3),(9,'word','Hermano',4),
(10,'word','Rojo',1),(10,'word','Azul',2),(10,'word','Uno',3),(10,'word','Dos',4),(10,'word','Tres',5);

-- ==========================================================
-- LOGROS
-- ==========================================================
INSERT INTO `achievements` (`code`, `name`, `description`, `icon`, `color`, `requirement_type`, `requirement_value`, `xp_reward`) VALUES
('first_lesson',    'Primera Seña',            'Completa tu primera lección',                   '🏆', '#00f0ff', 'lessons',  1,   50),
('alphabet_master', 'Abecedario Completo',     'Aprende las 26 letras',                          '🔤', '#b026ff', 'letters',  26,  200),
('streak_7',        'Racha de 7 días',         'Practica 7 días seguidos',                       '🔥', '#ff6b00', 'streak',   7,   100),
('streak_30',       'Racha de 30 días',        'Practica 30 días seguidos',                      '💎', '#00bfff', 'streak',   30,  500),
('streak_100',      'Racha de 100 días',       'Practica 100 días seguidos',                     '👑', '#ffd700', 'streak',   100, 2000),
('vocab_master',    'Maestro del Vocabulario', 'Aprende 40 palabras',                            '📚', '#00ff88', 'words',    40,  300),
('expert_signer',   'Experto en Señas',        'Alcanza el nivel 10',                            '⭐', '#ffb800', 'level',    10,  400),
('perfect_lesson',  'Lección Perfecta',        'Completa una lección sin errores',               '🎯', '#00f0ff', 'perfect',  1,   75),
('night_owl',       'Búho Nocturno',           'Practica después de las 22:00',                  '🦉', '#6a0dad', 'custom',   1,   60),
('early_bird',      'Madrugador',              'Practica antes de las 7:00',                     '🐦', '#ffb800', 'custom',   1,   60),
('speed_demon',     'Rápido como el Rayo',     'Completa una lección en menos de 60 segundos',   '⚡', '#ff006e', 'custom',   1,   150),
('perfectionist',   'Perfeccionista',          'Completa 10 lecciones sin errores',              '💯', '#00f0ff', 'perfect',  10,  250),
('social_butterfly','Mariposa Social',         'Comparte tu progreso 5 veces',                   '🦋', '#b026ff', 'custom',   5,   100),
('simulator_ace',   'As del Simulador',        'Completa 10 sesiones del simulador',             '🎮', '#ff006e', 'sessions', 10,  200),
('teacher_helper',  'Ayudante del Profe',      'Crea 3 lecciones personalizadas',                '🎓', '#00ff88', 'custom',   3,   180),
('detection_1000',  'Detective de Señas',      'Realiza 1000 detecciones',                       '🔍', '#00f0ff', 'detections', 1000, 300),
('accuracy_90',     'Precisión Quirúrgica',    'Alcanza 90% de precisión general',               '🎯', '#00ff88', 'accuracy', 90,  350);

-- ==========================================================
-- DESAFÍOS DIARIOS (ejemplos)
-- ==========================================================
INSERT INTO `daily_challenges` (`challenge_date`, `type`, `title`, `description`, `target_value`, `xp_reward`) VALUES
(CURDATE(),                       'letters', 'Desafío del día: Abecedario',  'Completa 15 letras correctas hoy', 15, 50),
(DATE_ADD(CURDATE(), INTERVAL 1 DAY), 'words', 'Desafío del día: Vocabulario', 'Completa 10 palabras correctas hoy', 10, 50),
(DATE_ADD(CURDATE(), INTERVAL 2 DAY), 'streak', 'Desafío del día: Precisión',  'Alcanza 85% de precisión en una sesión', 1, 75),
(DATE_ADD(CURDATE(), INTERVAL 3 DAY), 'mixed', 'Desafío del día: Mixto',     'Completa 20 detecciones correctas', 20, 60),
(DATE_ADD(CURDATE(), INTERVAL 4 DAY), 'lessons', 'Desafío del día: Lecciones', 'Completa 2 lecciones', 2, 80);

-- ==========================================================
-- TORNEO DE EJEMPLO
-- ==========================================================
INSERT INTO `tournaments` (`title`, `description`, `difficulty`, `theme`, `starts_at`, `ends_at`, `prize_xp`, `prize_badge`) VALUES
('Torneo Semanal #1', 'Compite con otros usuarios en el abecedario', 'medium', 'abecedario', 
 NOW(), DATE_ADD(NOW(), INTERVAL 7 DAY), 500, '🥇');