<?php
/**
 * ==========================================================
 * SignAI v2.0 — Logger avanzado
 * ==========================================================
 */

if (basename($_SERVER['PHP_SELF']) === 'logger.php') {
    http_response_code(403);
    die('Acceso denegado');
}

class Logger {
    private static $instance = null;
    private $logPath;
    private $minLevel;
    
    const LEVELS = [
        'debug'   => 0,
        'info'    => 1,
        'notice'  => 2,
        'warning' => 3,
        'error'   => 4,
        'critical'=> 5
    ];
    
    private function __construct() {
        $this->logPath = defined('LOGS_PATH') ? LOGS_PATH : __DIR__ . '/../logs';
        if (!is_dir($this->logPath)) @mkdir($this->logPath, 0755, true);
        $this->minLevel = defined('APP_ENV') && APP_ENV === 'development' ? 0 : 1;
    }
    
    public static function getInstance() {
        if (self::$instance === null) self::$instance = new self();
        return self::$instance;
    }
    
    public function log($level, $message, $context = []) {
        $levelNum = self::LEVELS[strtolower($level)] ?? 1;
        if ($levelNum < $this->minLevel) return;
        
        $entry = [
            'time'    => date('Y-m-d H:i:s'),
            'level'   => strtoupper($level),
            'message' => $message,
            'context' => $context,
            'ip'      => $_SERVER['REMOTE_ADDR'] ?? null,
            'user_id' => $_SESSION['user_id'] ?? null,
            'uri'     => $_SERVER['REQUEST_URI'] ?? null
        ];
        
        $file = $this->logPath . '/app-' . date('Y-m-d') . '.log';
        $line = json_encode($entry, JSON_UNESCAPED_UNICODE | JSON_UNESCAPED_SLASHES);
        
        @file_put_contents($file, $line . PHP_EOL, FILE_APPEND | LOCK_EX);
        
        // Rotación: eliminar logs mayores a 30 días
        $this->rotate();
    }
    
    public function debug($msg, $ctx = [])    { $this->log('debug', $msg, $ctx); }
    public function info($msg, $ctx = [])     { $this->log('info', $msg, $ctx); }
    public function notice($msg, $ctx = [])   { $this->log('notice', $msg, $ctx); }
    public function warning($msg, $ctx = [])  { $this->log('warning', $msg, $ctx); }
    public function error($msg, $ctx = [])    { $this->log('error', $msg, $ctx); }
    public function critical($msg, $ctx = []) { $this->log('critical', $msg, $ctx); }
    
    private function rotate() {
        if (random_int(1, 100) > 5) return; // Solo 5% de las veces
        $files = glob($this->logPath . '/app-*.log');
        if (!$files) return;
        $cutoff = strtotime('-30 days');
        foreach ($files as $f) {
            if (filemtime($f) < $cutoff) @unlink($f);
        }
    }
}

function logger() {
    return Logger::getInstance();
}
?>