<?php
require __DIR__ . '/db.php';
$uid = require_user();
$m = $_SERVER['REQUEST_METHOD'];

if ($m === 'GET') {
  $st = pdo()->prepare('SELECT id, material_id, nombre, categoria, biodegradable, nivel_impacto, confianza, objeto, fecha
                        FROM historial WHERE usuario_id = ? ORDER BY fecha DESC, id DESC LIMIT 500');
  $st->execute([$uid]);
  $items = array_map(function ($r) {
    return ['id' => (int)$r['id'], 'materialId' => $r['material_id'], 'nombre' => $r['nombre'],
      'categoria' => $r['categoria'], 'biodegradable' => (bool)$r['biodegradable'],
      'nivelImpacto' => $r['nivel_impacto'], 'confianza' => (int)$r['confianza'],
      'objeto' => $r['objeto'], 'fecha' => date('c', strtotime($r['fecha']))];
  }, $st->fetchAll());
  out(['items' => $items]);
}

if ($m === 'POST') {
  $b = body();
  $nombre = mb_substr(trim($b['nombre'] ?? ''), 0, 120);
  if ($nombre === '') out(['error' => 'Datos incompletos'], 400);
  $st = pdo()->prepare('INSERT INTO historial (usuario_id, material_id, nombre, categoria, biodegradable, nivel_impacto, confianza, objeto)
                        VALUES (?,?,?,?,?,?,?,?)');
  $st->execute([$uid, mb_substr($b['materialId'] ?? '', 0, 20), $nombre, mb_substr($b['categoria'] ?? '', 0, 40),
    !empty($b['biodegradable']) ? 1 : 0, mb_substr($b['nivelImpacto'] ?? 'Medio', 0, 10),
    max(0, min(100, (int)($b['confianza'] ?? 0))), mb_substr($b['objeto'] ?? '', 0, 120) ?: null]);
  out(['id' => (int)pdo()->lastInsertId()]);
}

if ($m === 'DELETE') {
  if (isset($_GET['id'])) { $st = pdo()->prepare('DELETE FROM historial WHERE id = ? AND usuario_id = ?'); $st->execute([(int)$_GET['id'], $uid]); }
  else { $st = pdo()->prepare('DELETE FROM historial WHERE usuario_id = ?'); $st->execute([$uid]); }
  out(['ok' => true]);
}

out(['error' => 'Método no permitido'], 405);
