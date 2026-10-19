<?php
/**
 * ==========================================================
 * SignAI v2.0 — Cache basado en archivos
 * ==========================================================
 */

if (basename($_SERVER['PHP_SELF']) === 'cache.php') {
    http_response_code(403);
    die('Acceso denegado');
}

class Cache {
    private $cachePath;
    private $defaultTTL = 3600;
    
    public function __construct($path = null) {
        $this->cachePath = $path ?? (defined('CACHE_PATH') ? CACHE_PATH . '/data' : __DIR__ . '/../cache/data');
        if (!is_dir($this->cachePath)) @mkdir($this->cachePath, 0755, true);
    }
    
    private function file($key) {
        return $this->cachePath . '/' . md5($key) . '.cache';
    }
    
    public function set($key, $value, $ttl = null) {
        $ttl  = $ttl ?? $this->defaultTTL;
        $data = [
            'expires' => time() + $ttl,
            'value'   => $value
        ];
        @file_put_contents($this->file($key), serialize($data), LOCK_EX);
        return true;
    }
    
    public function get($key, $default = null) {
        $file = $this->file($key);
        if (!file_exists($file)) return $default;
        
        $raw = @file_get_contents($file);
        if ($raw === false) return $default;
        
        $data = @unserialize($raw);
        if (!is_array($data)) return $default;
        
        if (isset($data['expires']) && $data['expires'] < time()) {
            @unlink($file);
            return $default;
        }
        
        return $data['value'] ?? $default;
    }
    
    public function has($key) {
        return $this->get($key) !== null;
    }
    
    public function delete($key) {
        $file = $this->file($key);
        if (file_exists($file)) return @unlink($file);
        return false;
    }
    
    public function remember($key, $callback, $ttl = null) {
        $value = $this->get($key);
        if ($value !== null) return $value;
        
        $value = $callback();
        $this->set($key, $value, $ttl);
        return $value;
    }
    
    public function clear() {
        $files = glob($this->cachePath . '/*.cache');
        foreach ($files as $f) @unlink($f);
        return true;
    }
    
    public function cleanup() {
        $files = glob($this->cachePath . '/*.cache');
        $now = time();
        $count = 0;
        foreach ($files as $f) {
            $raw = @file_get_contents($f);
            $data = @unserialize($raw);
            if (is_array($data) && isset($data['expires']) && $data['expires'] < $now) {
                @unlink($f);
                $count++;
            }
        }
        return $count;
    }
}
?>