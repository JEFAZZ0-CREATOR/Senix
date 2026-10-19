<?php
/**
 * ==========================================================
 * SignAI v2.0 — Constantes Globales
 * ==========================================================
 */

if (basename($_SERVER['PHP_SELF']) === 'constants.php') {
    http_response_code(403);
    die('Acceso denegado');
}

// ==========================================================
// DIFICULTADES
// ==========================================================
const DIFFICULTY_EASY   = 'easy';
const DIFFICULTY_MEDIUM = 'medium';
const DIFFICULTY_HARD   = 'hard';

const DIFFICULTY_LABELS = [
    'easy'   => 'Fácil',
    'medium' => 'Medio',
    'hard'   => 'Difícil'
];

const DIFFICULTY_COLORS = [
    'easy'   => '#00ff88',
    'medium' => '#ffb800',
    'hard'   => '#ff3860'
];

const DIFFICULTY_ICONS = [
    'easy'   => '🟢',
    'medium' => '🟡',
    'hard'   => '🔴'
];

// ==========================================================
// TIPOS DE ITEM EN LECCIONES
// ==========================================================
const ITEM_TYPE_LETTER = 'letter';
const ITEM_TYPE_WORD   = 'word';
const ITEM_TYPE_PHRASE = 'phrase';

const ITEM_TYPE_LABELS = [
    'letter' => 'Letra',
    'word'   => 'Palabra',
    'phrase' => 'Frase'
];

// ==========================================================
// TIPOS DE SESIÓN DE DETECCIÓN
// ==========================================================
const SESSION_PRACTICE  = 'practice';
const SESSION_LESSON    = 'lesson';
const SESSION_SIMULATOR = 'simulator';
const SESSION_TEST      = 'test';
const SESSION_CHALLENGE = 'challenge';
const SESSION_TOURNAMENT = 'tournament';

const SESSION_TYPES = [
    'practice'   => 'Práctica libre',
    'lesson'     => 'Lección',
    'simulator'  => 'Simulador',
    'test'       => 'Test',
    'challenge'  => 'Desafío',
    'tournament' => 'Torneo'
];

// ==========================================================
// CATEGORÍAS DE PALABRAS
// ==========================================================
const WORD_CATEGORIES = [
    'saludos'     => ['label' => 'Saludos',     'icon' => '👋'],
    'cortesia'    => ['label' => 'Cortesía',    'icon' => '🙏'],
    'basico'      => ['label' => 'Básico',      'icon' => '💬'],
    'emociones'   => ['label' => 'Emociones',   'icon' => '❤️'],
    'personas'    => ['label' => 'Personas',    'icon' => '👥'],
    'lugares'     => ['label' => 'Lugares',     'icon' => '🏠'],
    'sustantivos' => ['label' => 'Sustantivos', 'icon' => '📦'],
    'verbos'      => ['label' => 'Verbos',      'icon' => '⚡'],
    'adjetivos'   => ['label' => 'Adjetivos',   'icon' => '🎨'],
    'familia'     => ['label' => 'Familia',     'icon' => '👨‍👩‍👧'],
    'numeros'     => ['label' => 'Números',     'icon' => '🔢'],
    'colores'     => ['label' => 'Colores',     'icon' => '🌈'],
    'comida'      => ['label' => 'Comida',      'icon' => '🍽️'],
    'tiempo'      => ['label' => 'Tiempo',      'icon' => '⏰'],
    'general'     => ['label' => 'General',     'icon' => '📌']
];

// ==========================================================
// TIPOS DE LOGRO
// ==========================================================
const ACHIEVEMENT_TYPES = [
    'lessons'  => 'Lecciones completadas',
    'letters'  => 'Letras dominadas',
    'words'    => 'Palabras aprendidas',
    'streak'   => 'Días consecutivos',
    'level'    => 'Nivel alcanzado',
    'xp'       => 'XP acumulada',
    'accuracy' => 'Precisión de detección',
    'sessions' => 'Sesiones completadas',
    'time'     => 'Tiempo de práctica'
];

// ==========================================================
// GRUPOS DE LECCIONES
// ==========================================================
const LESSON_CATEGORIES = [
    'abecedario'   => ['label' => 'Abecedario',   'icon' => '🔤'],
    'vocabulario'  => ['label' => 'Vocabulario',  'icon' => '📚'],
    'conversacion' => ['label' => 'Conversación', 'icon' => '💬'],
    'avanzado'     => ['label' => 'Avanzado',     'icon' => '🎓'],
    'cultura'      => ['label' => 'Cultura',      'icon' => '🌎'],
    'custom'       => ['label' => 'Personalizadas', 'icon' => '✨']
];

// ==========================================================
// TIPOS DE MENSAJE / FEEDBACK
// ==========================================================
const FEEDBACK_CORRECT   = 'correct';
const FEEDBACK_INCORRECT = 'incorrect';
const FEEDBACK_PARTIAL   = 'partial';

const FEEDBACK_MESSAGES = [
    'correct' => [
        '¡Perfecto! 🎯',
        '¡Excelente! ⭐',
        '¡Muy bien! 🔥',
        '¡Increíble! ✨',
        '¡Lo tienes! 💪'
    ],
    'incorrect' => [
        'Casi... inténtalo de nuevo 🤔',
        'No exactamente, sigue practicando 💡',
        'Revisa la posición de tus dedos ✋',
        'Ajusta tu mano y vuelve a intentar 🔄'
    ],
    'partial' => [
        '¡Casi! Estás muy cerca 🎯',
        'Buena forma, mejora un poco más 💫'
    ]
];

// ==========================================================
// TIPOS DE NOTIFICACIÓN
// ==========================================================
const NOTIF_INFO     = 'info';
const NOTIF_SUCCESS  = 'success';
const NOTIF_WARNING  = 'warning';
const NOTIF_ERROR    = 'error';
const NOTIF_ACHIEVEMENT = 'achievement';
const NOTIF_SYSTEM   = 'system';

// ==========================================================
// ROLES DE USUARIO
// ==========================================================
const ROLE_USER  = 'user';
const ROLE_TEACHER = 'teacher';
const ROLE_ADMIN = 'admin';

const ROLE_LABELS = [
    'user'    => 'Usuario',
    'teacher' => 'Profesor',
    'admin'   => 'Administrador'
];

// ==========================================================
// IDIOMAS DISPONIBLES
// ==========================================================
const LANGUAGES = [
    'es' => ['label' => 'Español',    'flag' => '🇲🇽'],
    'en' => ['label' => 'English',    'flag' => '🇺🇸'],
    'fr' => ['label' => 'Français',   'flag' => '🇫🇷'],
    'pt' => ['label' => 'Português',  'flag' => '🇧🇷']
];

define('DEFAULT_LANG', 'es');

// ==========================================================
// LOGROS PREDEFINIDOS (IDs y config)
// ==========================================================
const PREDEFINED_ACHIEVEMENTS = [
    'first_lesson'    => ['name' => 'Primera Seña',        'icon' => '🏆', 'xp' => 50],
    'alphabet_master' => ['name' => 'Abecedario Completo', 'icon' => '🔤', 'xp' => 200],
    'streak_7'        => ['name' => 'Racha de 7 días',     'icon' => '🔥', 'xp' => 100],
    'streak_30'       => ['name' => 'Racha de 30 días',    'icon' => '💎', 'xp' => 500],
    'vocab_master'    => ['name' => 'Maestro del Vocabulario', 'icon' => '📚', 'xp' => 300],
    'expert_signer'   => ['name' => 'Experto en Señas',    'icon' => '⭐', 'xp' => 400],
    'perfect_lesson'  => ['name' => 'Lección Perfecta',    'icon' => '🎯', 'xp' => 75],
    'night_owl'       => ['name' => 'Búho Nocturno',       'icon' => '🦉', 'xp' => 60],
    'early_bird'      => ['name' => 'Madrugador',          'icon' => '🐦', 'xp' => 60],
    'speed_demon'     => ['name' => 'Rápido como el Rayo', 'icon' => '⚡', 'xp' => 150],
    'perfectionist'   => ['name' => 'Perfeccionista',      'icon' => '💯', 'xp' => 250],
    'social_butterfly'=> ['name' => 'Mariposa Social',     'icon' => '🦋', 'xp' => 100],
    'simulator_ace'   => ['name' => 'As del Simulador',    'icon' => '🎮', 'xp' => 200],
    'teacher_helper'  => ['name' => 'Ayudante del Profe',  'icon' => '🎓', 'xp' => 180],
    'night_shift'     => ['name' => 'Turno Nocturno',      'icon' => '🌙', 'xp' => 80]
];

// ==========================================================
// CONFIGURACIÓN DEL SIMULADOR
// ==========================================================
const SIMULATOR_SCENARIOS = [
    'greeting'    => ['name' => 'Saludo',           'icon' => '👋', 'difficulty' => 'easy'],
    'introduction'=> ['name' => 'Presentación',     'icon' => '🤝', 'difficulty' => 'easy'],
    'shopping'    => ['name' => 'En la Tienda',     'icon' => '🛒', 'difficulty' => 'medium'],
    'restaurant'  => ['name' => 'En el Restaurante','icon' => '🍽️', 'difficulty' => 'medium'],
    'doctor'      => ['name' => 'En el Doctor',     'icon' => '🏥', 'difficulty' => 'hard'],
    'school'      => ['name' => 'En la Escuela',    'icon' => '🎒', 'difficulty' => 'medium'],
    'family'      => ['name' => 'En Familia',       'icon' => '👨‍👩‍👧', 'difficulty' => 'easy'],
    'directions'  => ['name' => 'Pidiendo Direcciones','icon' => '🗺️', 'difficulty' => 'hard']
];

// ==========================================================
// MIMETYPES PERMITIDOS PARA UPLOAD
// ==========================================================
const ALLOWED_IMAGE_TYPES = [
    'image/jpeg' => 'jpg',
    'image/png'  => 'png',
    'image/webp' => 'webp',
    'image/gif'  => 'gif'
];

const ALLOWED_VIDEO_TYPES = [
    'video/mp4'  => 'mp4',
    'video/webm' => 'webm'
];

const MAX_AVATAR_SIZE   = 2 * 1024 * 1024;   // 2 MB
const MAX_VIDEO_SIZE    = 20 * 1024 * 1024;  // 20 MB
const MAX_IMAGE_WIDTH   = 1024;
const MAX_IMAGE_HEIGHT  = 1024;

// ==========================================================
// MENSAJES DE ERROR ESTÁNDAR
// ==========================================================
const ERR_INVALID_CREDENTIALS = 'Usuario o contraseña incorrectos';
const ERR_USER_EXISTS          = 'El usuario ya está registrado';
const ERR_EMAIL_EXISTS         = 'El email ya está registrado';
const ERR_WEAK_PASSWORD        = 'La contraseña es demasiado débil';
const ERR_NOT_AUTHENTICATED    = 'Debes iniciar sesión';
const ERR_NO_PERMISSION        = 'No tienes permiso para esta acción';
const ERR_INVALID_INPUT        = 'Datos de entrada inválidos';
const ERR_SERVER               = 'Error interno del servidor';
const ERR_NOT_FOUND            = 'Recurso no encontrado';
const ERR_RATE_LIMIT           = 'Demasiados intentos. Intenta más tarde';

// ==========================================================
// RESPUESTAS ESTÁNDAR
// ==========================================================
const RESPONSE_SUCCESS = ['success' => true,  'message' => 'OK'];
const RESPONSE_ERROR   = ['success' => false, 'message' => 'Error'];
?>