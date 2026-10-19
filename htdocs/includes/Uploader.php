<?php
/**
 * ==========================================================
 * SignAI v2.0 — Uploader
 * ==========================================================
 */

if (basename($_SERVER['PHP_SELF']) === 'Uploader.php') die('Acceso denegado');

class Uploader {
    private string $uploadDir;
    private array $errors = [];
    
    public function __construct(string $subfolder = '') {
        $base = defined('UPLOADS_PATH') ? UPLOADS_PATH : __DIR__ . '/../uploads';
        $this->uploadDir = $base . ($subfolder ? '/' . trim($subfolder, '/') : '');
        
        if (!is_dir($this->uploadDir)) {
            @mkdir($this->uploadDir, 0755, true);
        }
    }
    
    // ==========================================================
    // IMAGEN
    // ==========================================================
    
    public function uploadImage(array $file, array $options = []): array {
        $maxSize = $options['max_size'] ?? MAX_AVATAR_SIZE;
        $maxW    = $options['max_width'] ?? MAX_IMAGE_WIDTH;
        $maxH    = $options['max_height'] ?? MAX_IMAGE_HEIGHT;
        $prefix  = $options['prefix'] ?? 'img';
        
        // Validaciones iniciales
        $check = $this->validateFile($file, $maxSize);
        if (!$check['success']) return $check;
        
        // Verificar MIME real
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        
        if (!isset(ALLOWED_IMAGE_TYPES[$mime])) {
            return ['success' => false, 'error' => 'Formato no permitido (JPG, PNG, WEBP, GIF)'];
        }
        
        $ext = ALLOWED_IMAGE_TYPES[$mime];
        
        // Dimensiones
        $sizeInfo = @getimagesize($file['tmp_name']);
        if ($sizeInfo) {
            [$w, $h] = $sizeInfo;
            if ($maxW && $w > $maxW) {
                return ['success' => false, 'error' => "Imagen demasiado ancha (máx {$maxW}px)"];
            }
            if ($maxH && $h > $maxH) {
                return ['success' => false, 'error' => "Imagen demasiado alta (máx {$maxH}px)"];
            }
        }
        
        // Nombre único
        $filename = $prefix . '_' . date('YmdHis') . '_' . str_random(8) . '.' . $ext;
        $dest = $this->uploadDir . '/' . $filename;
        
        if (!move_uploaded_file($file['tmp_name'], $dest)) {
            return ['success' => false, 'error' => 'Error al mover archivo'];
        }
        
        @chmod($dest, 0644);
        
        return [
            'success'  => true,
            'filename' => $filename,
            'path'     => 'uploads/' . basename($this->uploadDir) . '/' . $filename,
            'url'      => url('uploads/' . basename($this->uploadDir) . '/' . $filename),
            'size'     => $file['size'],
            'mime'     => $mime
        ];
    }
    
    // ==========================================================
    // VIDEO
    // ==========================================================
    
    public function uploadVideo(array $file, array $options = []): array {
        $maxSize = $options['max_size'] ?? MAX_VIDEO_SIZE;
        $prefix  = $options['prefix'] ?? 'vid';
        
        $check = $this->validateFile($file, $maxSize);
        if (!$check['success']) return $check;
        
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        
        if (!isset(ALLOWED_VIDEO_TYPES[$mime])) {
            return ['success' => false, 'error' => 'Formato de video no permitido (MP4, WEBM)'];
        }
        
        $ext = ALLOWED_VIDEO_TYPES[$mime];
        $filename = $prefix . '_' . date('YmdHis') . '_' . str_random(8) . '.' . $ext;
        $dest = $this->uploadDir . '/' . $filename;
        
        if (!move_uploaded_file($file['tmp_name'], $dest)) {
            return ['success' => false, 'error' => 'Error al mover archivo'];
        }
        
        @chmod($dest, 0644);
        
        return [
            'success'  => true,
            'filename' => $filename,
            'path'     => 'uploads/' . basename($this->uploadDir) . '/' . $filename,
            'url'      => url('uploads/' . basename($this->uploadDir) . '/' . $filename),
            'size'     => $file['size'],
            'mime'     => $mime
        ];
    }
    
    // ==========================================================
    // AVATAR (con resize)
    // ==========================================================
    
    public function uploadAvatar(array $file, int $userId): array {
        // Validaciones básicas
        $check = $this->validateFile($file, MAX_AVATAR_SIZE);
        if (!$check['success']) return $check;
        
        $finfo = finfo_open(FILEINFO_MIME_TYPE);
        $mime = finfo_file($finfo, $file['tmp_name']);
        finfo_close($finfo);
        
        if (!isset(ALLOWED_IMAGE_TYPES[$mime])) {
            return ['success' => false, 'error' => 'Formato no permitido'];
        }
        
        // Cargar imagen según tipo
        $src = null;
        switch ($mime) {
            case 'image/jpeg': $src = @imagecreatefromjpeg($file['tmp_name']); break;
            case 'image/png':  $src = @imagecreatefrompng($file['tmp_name']); break;
            case 'image/gif':  $src = @imagecreatefromgif($file['tmp_name']); break;
            case 'image/webp': $src = @imagecreatefromwebp($file['tmp_name']); break;
        }
        
        if (!$src) {
            // Guardar sin resize
            return $this->uploadImage($file, ['prefix' => 'avatar_' . $userId]);
        }
        
        $width  = imagesx($src);
        $height = imagesy($src);
        $size   = min($width, $height);
        
        // Crop cuadrado centrado
        $x = (int)(($width - $size) / 2);
        $y = (int)(($height - $size) / 2);
        
        // Redimensionar a 300x300
        $targetSize = 300;
        $dst = imagecreatetruecolor($targetSize, $targetSize);
        
        // Preservar transparencia
        imagealphablending($dst, false);
        imagesavealpha($dst, true);
        $transparent = imagecolorallocatealpha($dst, 255, 255, 255, 127);
        imagefilledrectangle($dst, 0, 0, $targetSize, $targetSize, $transparent);
        
        imagecopyresampled($dst, $src, 0, 0, $x, $y, $targetSize, $targetSize, $size, $size);
        
        $filename = 'avatar_' . $userId . '_' . time() . '.jpg';
        $dest = $this->uploadDir . '/' . $filename;
        
        imagejpeg($dst, $dest, 90);
        imagedestroy($src);
        imagedestroy($dst);
        
        @chmod($dest, 0644);
        
        return [
            'success'  => true,
            'filename' => $filename,
            'path'     => 'uploads/' . basename($this->uploadDir) . '/' . $filename,
            'url'      => url('uploads/' . basename($this->uploadDir) . '/' . $filename)
        ];
    }
    
    // ==========================================================
    // VALIDACIONES
    // ==========================================================
    
    private function validateFile(array $file, int $maxSize): array {
        if (!isset($file['error'])) {
            return ['success' => false, 'error' => 'Archivo no válido'];
        }
        
        switch ($file['error']) {
            case UPLOAD_ERR_OK: break;
            case UPLOAD_ERR_INI_SIZE:
            case UPLOAD_ERR_FORM_SIZE:
                return ['success' => false, 'error' => 'Archivo demasiado grande'];
            case UPLOAD_ERR_PARTIAL:
                return ['success' => false, 'error' => 'Subida incompleta'];
            case UPLOAD_ERR_NO_FILE:
                return ['success' => false, 'error' => 'No se seleccionó archivo'];
            case UPLOAD_ERR_NO_TMP_DIR:
                return ['success' => false, 'error' => 'Sin directorio temporal'];
            case UPLOAD_ERR_CANT_WRITE:
                return ['success' => false, 'error' => 'Error al escribir archivo'];
            default:
                return ['success' => false, 'error' => 'Error desconocido'];
        }
        
        if ($file['size'] <= 0) {
            return ['success' => false, 'error' => 'Archivo vacío'];
        }
        
        if ($file['size'] > $maxSize) {
            $mb = round($maxSize / 1024 / 1024, 1);
            return ['success' => false, 'error' => "Archivo demasiado grande (máx {$mb} MB)"];
        }
        
        if (!is_uploaded_file($file['tmp_name'])) {
            return ['success' => false, 'error' => 'Archivo sospechoso'];
        }
        
        return ['success' => true];
    }
    
    public function getErrors(): array {
        return $this->errors;
    }
    
    public function delete(string $relativePath): bool {
        $full = BASE_PATH . '/' . ltrim($relativePath, '/');
        if (file_exists($full) && is_file($full)) {
            return @unlink($full);
        }
        return false;
    }
}
?>