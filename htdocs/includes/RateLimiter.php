<?php
/**
 * ==========================================================
 * SignAI v2.0 — Rate Limiter
 * ==========================================================
 */

if (basename($_SERVER['PHP_SELF']) === 'RateLimiter.php') die('Acceso denegado');

class RateLimiter {
    private string $storagePath;
    
    public function __construct() {
        $base = defined('CACHE_PATH') ? CACHE_PATH : __DIR__ . '/../cache';
        $this->storagePath = $base . '/ratelimit';
        if (!is_dir($this->storagePath)) @mkdir($this->storagePath, 0755, true);
    }
    
    // ==========================================================
    // MÉTODOS PRINCIPALES
    // ==========================================================
    
    /**
     * Verifica si una acción está permitida
     */
    public function check(string $key, int $maxAttempts, int $windowSeconds): array {
        $file = $this->fileForKey($key);
        $now = time();
        
        $data = $this->read($file) ?: ['attempts' => [], 'blocked_until' => 0];
        
        // Bloqueado?
        if ($data['blocked_until'] > $now) {
            return [
                'allowed'      => false,
                'retry_after'  => $data['blocked_until'] - $now,
                'remaining'    => 0,
                'blocked'      => true
            ];
        }
        
        // Limpiar intentos viejos
        $data['attempts'] = array_values(array_filter(
            $data['attempts'],
            fn($t) => ($now - $t) < $windowSeconds
        ));
        
        // Excede el límite?
        if (count($data['attempts']) >= $maxAttempts) {
            $data['blocked_until'] = $now + $windowSeconds;
            $this->write($file, $data);
            
            return [
                'allowed'     => false,
                'retry_after' => $windowSeconds,
                'remaining'   => 0,
                'blocked'     => true
            ];
        }
        
        return [
            'allowed'     => true,
            'remaining'   => $maxAttempts - count($data['attempts']),
            'retry_after' => 0,
            'blocked'     => false
        ];
    }
    
    /**
     * Registra un intento
     */
    public function hit(string $key, int $windowSeconds = 300): void {
        $file = $this->fileForKey($key);
        $now = time();
        
        $data = $this->read($file) ?: ['attempts' => [], 'blocked_until' => 0];
        
        $data['attempts'] = array_values(array_filter(
            $data['attempts'],
            fn($t) => ($now - $t) < $windowSeconds
        ));
        
        $data['attempts'][] = $now;
        
        $this->write($file, $data);
    }
    
    /**
     * Intenta una acción completa (check + hit)
     */
    public function attempt(string $key, int $maxAttempts, int $windowSeconds): array {
        $result = $this->check($key, $maxAttempts, $windowSeconds);
        
        if ($result['allowed']) {
            $this->hit($key, $windowSeconds);
        }
        
        return $result;
    }
    
    /**
     * Resetea el contador
     */
    public function reset(string $key): void {
        $file = $this->fileForKey($key);
        if (file_exists($file)) @unlink($file);
    }
    
    /**
     * Bloquea manualmente
     */
    public function block(string $key, int $seconds): void {
        $file = $this->fileForKey($key);
        $data = $this->read($file) ?: ['attempts' => [], 'blocked_until' => 0];
        $data['blocked_until'] = time() + $seconds;
        $this->write($file, $data);
    }
    
    /**
     * Desbloquea
     */
    public function unblock(string $key): void {
        $this->reset($key);
    }
    
    /**
     * Retorna el número de intentos restantes
     */
    public function remaining(string $key, int $maxAttempts, int $windowSeconds): int {
        $file = $this->fileForKey($key);
        $data = $this->read($file);
        
        if (!$data) return $maxAttempts;
        
        $now = time();
        $valid = array_filter($data['attempts'], fn($t) => ($now - $t) < $windowSeconds);
        $used = count($valid);
        
        return max(0, $maxAttempts - $used);
    }
    
    /**
     * Limpia archivos viejos
     */
    public function cleanup(int $olderThan = 86400): int {
        $count = 0;
        $cutoff = time() - $olderThan;
        
        foreach (glob($this->storagePath . '/*.json') as $file) {
            if (filemtime($file) < $cutoff) {
                @unlink($file);
                $count++;
            }
        }
        
        return $count;
    }
    
    // ==========================================================
    // STORAGE
    // ==========================================================
    
    private function fileForKey(string $key): string {
        return $this->storagePath . '/' . md5($key) . '.json';
    }
    
    private function read(string $file): ?array {
        if (!file_exists($file)) return null;
        $raw = @file_get_contents($file);
        if ($raw === false) return null;
        $data = @json_decode($raw, true);
        return is_array($data) ? $data : null;
    }
    
    private function write(string $file, array $data): void {
        @file_put_contents($file, json_encode($data), LOCK_EX);
    }
}

// ==========================================================
// FUNCIONES GLOBALES DE ATAJO
// Protegidas contra redeclaración (ya existen en security.php)
// ==========================================================

if (!function_exists('rate_limit_hit')) {
    function rate_limit_hit(string $key, int $max, int $window = 300): array {
        static $limiter = null;
        if ($limiter === null) $limiter = new RateLimiter();
        return $limiter->attempt($key, $max, $window);
    }
}

if (!function_exists('rate_limit_reset')) {
    function rate_limit_reset(string $key): void {
        static $limiter = null;
        if ($limiter === null) $limiter = new RateLimiter();
        $limiter->reset($key);
    }
}
?>