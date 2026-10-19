<?php
/**
 * ==========================================================
 * SignAI v2.0 — Sistema de internacionalización (i18n)
 * ==========================================================
 */

if (basename($_SERVER['PHP_SELF']) === 'i18n.php') {
    http_response_code(403);
    die('Acceso denegado');
}

class I18n {
    private static $instance = null;
    private $lang = 'es';
    private $strings = [];
    private $fallback = 'es';
    private $supported = ['es', 'en', 'fr', 'pt'];
    
    private function __construct() {
        // Detectar idioma
        $lang = $_SESSION['lang'] ?? $_COOKIE['lang'] ?? null;
        
        if (!$lang && isset($_SERVER['HTTP_ACCEPT_LANGUAGE'])) {
            $browserLang = substr($_SERVER['HTTP_ACCEPT_LANGUAGE'], 0, 2);
            if (in_array($browserLang, $this->supported)) $lang = $browserLang;
        }
        
        if (!in_array($lang, $this->supported)) $lang = DEFAULT_LANG;
        
        $this->lang = $lang;
        $this->load($lang);
        
        // Cargar fallback también
        if ($lang !== $this->fallback) {
            $this->loadFallback();
        }
    }
    
    public static function getInstance() {
        if (self::$instance === null) self::$instance = new self();
        return self::$instance;
    }
    
    private function load($lang) {
        $file = BASE_PATH . '/lang/' . $lang . '.php';
        if (file_exists($file)) {
            $strings = require $file;
            if (is_array($strings)) $this->strings = $strings;
        }
    }
    
    private function loadFallback() {
        $file = BASE_PATH . '/lang/' . $this->fallback . '.php';
        if (file_exists($file)) {
            $fallbackStrings = require $file;
            if (is_array($fallbackStrings)) {
                $this->strings = array_merge($fallbackStrings, $this->strings);
            }
        }
    }
    
    public function get($key, $default = null) {
        return $this->strings[$key] ?? $default ?? $key;
    }
    
    public function lang() { return $this->lang; }
    
    public function setLang($lang) {
        if (!in_array($lang, $this->supported)) return false;
        $_SESSION['lang'] = $lang;
        setcookie('lang', $lang, time() + (86400 * 365), '/');
        return true;
    }
    
    public function available() { return $this->supported; }
}

/**
 * Atajo global para traducción
 */
function __($key, $default = null) {
    return I18n::getInstance()->get($key, $default);
}
?>