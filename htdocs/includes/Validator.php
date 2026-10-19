<?php
/**
 * ==========================================================
 * SignAI v2.0 — Validator
 * ==========================================================
 */

if (basename($_SERVER['PHP_SELF']) === 'Validator.php') die('Acceso denegado');

class Validator {
    private array $data;
    private array $rules;
    private array $errors = [];
    private array $messages = [];
    
    public function __construct(array $data, array $rules = []) {
        $this->data = $data;
        $this->rules = $rules;
        $this->messages = $this->defaultMessages();
    }
    
    public static function make(array $data, array $rules = []): self {
        return new self($data, $rules);
    }
    
    public function validate(): bool {
        $this->errors = [];
        
        foreach ($this->rules as $field => $ruleString) {
            $rules = explode('|', $ruleString);
            $value = $this->data[$field] ?? null;
            
            foreach ($rules as $rule) {
                $this->applyRule($field, $value, $rule);
            }
        }
        
        return empty($this->errors);
    }
    
    private function applyRule(string $field, $value, string $rule): void {
        // Regla con parámetros: max:100, min:3, etc.
        $params = [];
        if (strpos($rule, ':') !== false) {
            [$rule, $paramsStr] = explode(':', $rule, 2);
            $params = explode(',', $paramsStr);
        }
        
        $fieldLabel = $this->fieldLabel($field);
        
        switch ($rule) {
            case 'required':
                if ($value === null || $value === '' || (is_array($value) && empty($value))) {
                    $this->addError($field, "El campo $fieldLabel es obligatorio");
                }
                break;
            
            case 'email':
                if (!empty($value) && !validate_email($value)) {
                    $this->addError($field, "El email no es válido");
                }
                break;
            
            case 'min':
                $min = (int)$params[0];
                if (is_string($value) && mb_strlen($value) < $min) {
                    $this->addError($field, "$fieldLabel debe tener al menos $min caracteres");
                } elseif (is_numeric($value) && $value < $min) {
                    $this->addError($field, "$fieldLabel debe ser al menos $min");
                }
                break;
            
            case 'max':
                $max = (int)$params[0];
                if (is_string($value) && mb_strlen($value) > $max) {
                    $this->addError($field, "$fieldLabel no puede exceder $max caracteres");
                } elseif (is_numeric($value) && $value > $max) {
                    $this->addError($field, "$fieldLabel no puede exceder $max");
                }
                break;
            
            case 'numeric':
                if (!empty($value) && !is_numeric($value)) {
                    $this->addError($field, "$fieldLabel debe ser numérico");
                }
                break;
            
            case 'integer':
                if (!empty($value) && filter_var($value, FILTER_VALIDATE_INT) === false) {
                    $this->addError($field, "$fieldLabel debe ser un número entero");
                }
                break;
            
            case 'alpha':
                if (!empty($value) && !ctype_alpha($value)) {
                    $this->addError($field, "$fieldLabel solo puede contener letras");
                }
                break;
            
            case 'alpha_num':
                if (!empty($value) && !ctype_alnum($value)) {
                    $this->addError($field, "$fieldLabel solo puede contener letras y números");
                }
                break;
            
            case 'username':
                if (!empty($value) && !validate_username($value)) {
                    $this->addError($field, "Usuario inválido (3-50 caracteres, letras/números/_)");
                }
                break;
            
            case 'password':
                if (!empty($value)) {
                    $check = validate_password_strength($value);
                    if (!$check['valid']) {
                        $this->addError($field, 'Contraseña débil: ' . implode(', ', $check['errors']));
                    }
                }
                break;
            
            case 'in':
                if (!in_array($value, $params, true)) {
                    $this->addError($field, "$fieldLabel tiene un valor no permitido");
                }
                break;
            
            case 'confirmed':
                $confirmField = $field . '_confirmation';
                $confirmValue = $this->data[$confirmField] ?? null;
                if ($value !== $confirmValue) {
                    $this->addError($field, "La confirmación de $fieldLabel no coincide");
                }
                break;
            
            case 'url':
                if (!empty($value) && !validate_url($value)) {
                    $this->addError($field, "$fieldLabel debe ser una URL válida");
                }
                break;
            
            case 'date':
                if (!empty($value) && strtotime($value) === false) {
                    $this->addError($field, "$fieldLabel debe ser una fecha válida");
                }
                break;
            
            case 'between':
                $min = (float)$params[0];
                $max = (float)$params[1];
                if (is_numeric($value) && ($value < $min || $value > $max)) {
                    $this->addError($field, "$fieldLabel debe estar entre $min y $max");
                }
                break;
            
            case 'slug':
                if (!empty($value) && !preg_match('/^[a-z0-9]+(?:-[a-z0-9]+)*$/', $value)) {
                    $this->addError($field, "$fieldLabel debe ser un slug válido");
                }
                break;
            
            case 'boolean':
                if (!in_array($value, [true, false, 0, 1, '0', '1'], true)) {
                    $this->addError($field, "$fieldLabel debe ser booleano");
                }
                break;
            
            case 'array':
                if (!empty($value) && !is_array($value)) {
                    $this->addError($field, "$fieldLabel debe ser un array");
                }
                break;
            
            case 'ip':
                if (!empty($value) && filter_var($value, FILTER_VALIDATE_IP) === false) {
                    $this->addError($field, "$fieldLabel debe ser una IP válida");
                }
                break;
            
            case 'json':
                if (!empty($value)) {
                    json_decode($value);
                    if (json_last_error() !== JSON_ERROR_NONE) {
                        $this->addError($field, "$fieldLabel debe ser JSON válido");
                    }
                }
                break;
        }
    }
    
    private function fieldLabel(string $field): string {
        $labels = [
            'username'   => 'usuario',
            'email'      => 'email',
            'password'   => 'contraseña',
            'full_name'  => 'nombre completo',
            'title'      => 'título',
            'description'=> 'descripción',
            'name'       => 'nombre',
            'message'    => 'mensaje',
            'content'    => 'contenido',
            'score'      => 'puntuación'
        ];
        
        return $labels[$field] ?? str_replace('_', ' ', $field);
    }
    
    private function addError(string $field, string $message): void {
        if (!isset($this->errors[$field])) {
            $this->errors[$field] = [];
        }
        $this->errors[$field][] = $message;
    }
    
    public function errors(): array {
        return $this->errors;
    }
    
    public function firstError(): ?string {
        foreach ($this->errors as $field => $msgs) {
            return $msgs[0] ?? null;
        }
        return null;
    }
    
    public function fails(): bool {
        return !empty($this->errors);
    }
    
    public function passes(): bool {
        return empty($this->errors);
    }
    
    private function defaultMessages(): array {
        return [
            'required' => 'Este campo es obligatorio',
            'email'    => 'Email inválido',
            'min'      => 'Muy corto',
            'max'      => 'Muy largo'
        ];
    }
    
    // ==========================================================
    // HELPERS ESTÁTICOS
    // ==========================================================
    
    public static function sanitizeString($value, int $maxLength = 500): string {
        $value = trim((string)$value);
        $value = strip_control_chars($value);
        $value = mb_substr($value, 0, $maxLength);
        return $value;
    }
    
    public static function sanitizeInt($value, int $default = 0): int {
        return (int)filter_var($value, FILTER_SANITIZE_NUMBER_INT) ?: $default;
    }
    
    public static function sanitizeFloat($value, float $default = 0.0): float {
        $clean = filter_var($value, FILTER_SANITIZE_NUMBER_FLOAT, FILTER_FLAG_ALLOW_FRACTION);
        return (float)$clean ?: $default;
    }
    
    public static function sanitizeEmail(string $email): string {
        return strtolower(trim(filter_var($email, FILTER_SANITIZE_EMAIL)));
    }
}
?>