<?php
/**
 * ==========================================================
 * SignAI v2.0 — Cache Wrapper
 * ==========================================================
 */

if (basename($_SERVER['PHP_SELF']) === 'Cache.php') die('Acceso denegado');

class CacheWrapper {
    private static ?Cache $instance = null;
    
    public static function getInstance(): Cache {
        if (self::$instance === null) {
            require_once __DIR__ . '/../config/cache.php';
            self::$instance = new Cache();
        }
        return self::$instance;
    }
    
    // ==========================================================
    // HELPERS ESTÁTICOS
    // ==========================================================
    
    public static function get(string $key, $default = null) {
        return self::getInstance()->get($key, $default);
    }
    
    public static function set(string $key, $value, ?int $ttl = null): bool {
        return self::getInstance()->set($key, $value, $ttl);
    }
    
    public static function has(string $key): bool {
        return self::getInstance()->has($key);
    }
    
    public static function forget(string $key): bool {
        return self::getInstance()->delete($key);
    }
    
    public static function remember(string $key, callable $callback, ?int $ttl = null) {
        return self::getInstance()->remember($key, $callback, $ttl);
    }
    
    public static function flush(): bool {
        return self::getInstance()->clear();
    }
    
    // ==========================================================
    // HELPERS DE CLAVES
    // ==========================================================
    
    public static function key(string $prefix, ...$parts): string {
        return $prefix . ':' . md5(implode('|', array_map(function($p) {
            return is_array($p) ? json_encode($p) : (string)$p;
        }, $parts)));
    }
    
    // ==========================================================
    // CACHÉ DE CONSULTAS
    // ==========================================================
    
    public static function query(string $key, callable $queryCallback, int $ttl = 300) {
        return self::remember('query:' . $key, $queryCallback, $ttl);
    }
    
    // ==========================================================
    // CACHÉ DE VISTAS
    // ==========================================================
    
    public static function fragment(string $name, callable $callback, int $ttl = 600) {
        $key = 'fragment:' . $name;
        $cached = self::get($key);
        
        if ($cached !== null) {
            echo $cached;
            return;
        }
        
        ob_start();
        $callback();
        $html = ob_get_clean();
        
        self::set($key, $html, $ttl);
        echo $html;
    }
}
?>