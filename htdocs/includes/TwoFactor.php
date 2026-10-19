<?php
/**
 * ==========================================================
 * Senix v2.0 — Two-Factor Authentication (TOTP)
 * ==========================================================
 */

if (basename($_SERVER['PHP_SELF']) === 'TwoFactor.php') die('Acceso denegado');

class TwoFactor {
    const CODE_LENGTH = 6;
    const PERIOD = 30;
    const ALPHABET = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';
    
    /**
     * Genera un secreto base32
     */
    public static function generateSecret(int $length = 32): string {
        $secret = '';
        for ($i = 0; $i < $length; $i++) {
            $secret .= self::ALPHABET[random_int(0, 31)];
        }
        return $secret;
    }
    
    /**
     * Genera la URL del código QR
     */
    public static function getQRCodeURL(string $secret, string $label, string $issuer = 'Senix'): string {
        $label = urlencode($issuer . ':' . $label);
        $issuer = urlencode($issuer);
        return "otpauth://totp/$label?secret=$secret&issuer=$issuer&algorithm=SHA1&digits=6&period=30";
    }
    
    /**
     * Genera un código TOTP
     */
    public static function generateCode(string $secret, ?int $timestamp = null): string {
        $timestamp = $timestamp ?? time();
        $counter = floor($timestamp / self::PERIOD);
        
        $binarySecret = self::base32Decode($secret);
        $time = pack('N*', 0) . pack('N*', $counter);
        
        $hash = hash_hmac('sha1', $time, $binarySecret, true);
        $offset = ord($hash[strlen($hash) - 1]) & 0x0F;
        
        $code = (
            ((ord($hash[$offset]) & 0x7F) << 24) |
            ((ord($hash[$offset + 1]) & 0xFF) << 16) |
            ((ord($hash[$offset + 2]) & 0xFF) << 8) |
            (ord($hash[$offset + 3]) & 0xFF)
        ) % 1000000;
        
        return str_pad((string)$code, self::CODE_LENGTH, '0', STR_PAD_LEFT);
    }
    
    /**
     * Verifica un código TOTP (permite ±1 ventana)
     */
    public static function verifyCode(string $secret, string $code, int $window = 1): bool {
        $code = preg_replace('/\s+/', '', $code);
        
        if (strlen($code) !== self::CODE_LENGTH) return false;
        if (!ctype_digit($code)) return false;
        
        $timestamp = time();
        
        for ($i = -$window; $i <= $window; $i++) {
            $check = self::generateCode($secret, $timestamp + ($i * self::PERIOD));
            if (hash_equals($check, $code)) {
                return true;
            }
        }
        
        return false;
    }
    
    /**
     * Decodifica base32
     */
    private static function base32Decode(string $input): string {
        $input = strtoupper($input);
        $input = rtrim($input, '=');
        
        $map = array_flip(str_split(self::ALPHABET));
        $binary = '';
        
        foreach (str_split($input) as $char) {
            if (!isset($map[$char])) continue;
            $binary .= str_pad(decbin($map[$char]), 5, '0', STR_PAD_LEFT);
        }
        
        $output = '';
        for ($i = 0; $i + 8 <= strlen($binary); $i += 8) {
            $output .= chr(bindec(substr($binary, $i, 8)));
        }
        
        return $output;
    }
    
    /**
     * Genera códigos de respaldo (backup codes)
     */
    public static function generateBackupCodes(int $count = 10): array {
        $codes = [];
        for ($i = 0; $i < $count; $i++) {
            $codes[] = strtoupper(
                substr(str_random(4), 0, 4) . '-' .
                substr(str_random(4), 0, 4) . '-' .
                substr(str_random(4), 0, 4)
            );
        }
        return $codes;
    }
}
?>