<?php
require __DIR__ . '/config.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');

session_set_cookie_params(['lifetime' => 60*60*24*14, 'path' => '/', 'httponly' => true, 'samesite' => 'Lax',
  'secure' => !empty($_SERVER['HTTPS'])]);
session_start();

function out($data, $code = 200) { http_response_code($code); echo json_encode($data, JSON_UNESCAPED_UNICODE); exit; }

function body() {
  $j = json_decode(file_get_contents('php://input'), true);
  return is_array($j) ? $j : [];
}

function pdo() {
  static $p = null;
  if ($p) return $p;
  try {
    $p = new PDO('mysql:host=' . DB_HOST . ';dbname=' . DB_NAME . ';charset=utf8mb4', DB_USER, DB_PASS,
      [PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION, PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC]);
  } catch (Exception $e) { out(['error' => 'No se pudo conectar a la base de datos'], 500); }
  return $p;
}

function require_user() {
  if (empty($_SESSION['uid'])) out(['error' => 'No autenticado'], 401);
  return (int)$_SESSION['uid'];
}
