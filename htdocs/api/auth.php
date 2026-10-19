<?php
require __DIR__ . '/db.php';
$action = $_GET['action'] ?? '';

if ($action === 'me') {
  if (empty($_SESSION['uid'])) out(['error' => 'No autenticado'], 401);
  out(['user' => ['nombre' => $_SESSION['nombre'], 'email' => $_SESSION['email']]]);
}

if ($action === 'logout') { $_SESSION = []; session_destroy(); out(['ok' => true]); }

if ($_SERVER['REQUEST_METHOD'] !== 'POST') out(['error' => 'Método no permitido'], 405);
$b = body();
$email = strtolower(trim($b['email'] ?? ''));
$pass  = (string)($b['password'] ?? '');

if (!filter_var($email, FILTER_VALIDATE_EMAIL) || $pass === '') out(['error' => 'Completa correo y contraseña.'], 400);

if ($action === 'register') {
  $nombre = trim($b['nombre'] ?? '');
  if ($nombre === '' || mb_strlen($nombre) > 80) out(['error' => 'Escribe tu nombre.'], 400);
  if (strlen($pass) < 6) out(['error' => 'La contraseña debe tener al menos 6 caracteres.'], 400);
  if (($b['codigo'] ?? '') !== CODIGO_REGISTRO) out(['error' => 'Código de registro incorrecto.'], 403);
  $st = pdo()->prepare('SELECT id FROM usuarios WHERE email = ?'); $st->execute([$email]);
  if ($st->fetch()) out(['error' => 'Ese correo ya está registrado.'], 409);
  $st = pdo()->prepare('INSERT INTO usuarios (nombre, email, password_hash) VALUES (?,?,?)');
  $st->execute([$nombre, $email, password_hash($pass, PASSWORD_DEFAULT)]);
  session_regenerate_id(true);
  $_SESSION = ['uid' => (int)pdo()->lastInsertId(), 'nombre' => $nombre, 'email' => $email];
  out(['user' => ['nombre' => $nombre, 'email' => $email]]);
}

if ($action === 'login') {
  $st = pdo()->prepare('SELECT * FROM usuarios WHERE email = ?'); $st->execute([$email]);
  $u = $st->fetch();
  if (!$u || !password_verify($pass, $u['password_hash'])) { sleep(1); out(['error' => 'Correo o contraseña incorrectos.'], 401); }
  session_regenerate_id(true);
  $_SESSION = ['uid' => (int)$u['id'], 'nombre' => $u['nombre'], 'email' => $u['email']];
  out(['user' => ['nombre' => $u['nombre'], 'email' => $u['email']]]);
}

out(['error' => 'Acción desconocida'], 400);
