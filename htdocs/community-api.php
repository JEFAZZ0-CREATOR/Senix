<?php
require_once __DIR__ . '/config/db.php';
require_once __DIR__ . '/includes/bootstrap.php';
require_once __DIR__ . '/includes/learning-tools.php';

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
if (!$auth->isLoggedIn()) { http_response_code(401); echo json_encode(['error'=>'Inicia sesión para usar la comunidad.']); exit; }
$uid=(int)currentUserId(); $pdo->setAttribute(PDO::ATTR_ERRMODE,PDO::ERRMODE_EXCEPTION);

function community_schema(PDO $db): void {
    $sql=[
      "CREATE TABLE IF NOT EXISTS community_friend_requests (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_low_id INT UNSIGNED NOT NULL, user_high_id INT UNSIGNED NOT NULL, sender_id INT UNSIGNED NOT NULL, status ENUM('pending','accepted','declined') NOT NULL DEFAULT 'pending', created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP, UNIQUE KEY uq_community_request_pair(user_low_id,user_high_id), KEY idx_community_request_inbox(user_high_id,status), KEY idx_community_request_sender(sender_id,status), CONSTRAINT fk_cfr_low FOREIGN KEY(user_low_id) REFERENCES users(id) ON DELETE CASCADE, CONSTRAINT fk_cfr_high FOREIGN KEY(user_high_id) REFERENCES users(id) ON DELETE CASCADE, CONSTRAINT fk_cfr_sender FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
      "CREATE TABLE IF NOT EXISTS community_friendships (user_low_id INT UNSIGNED NOT NULL, user_high_id INT UNSIGNED NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, PRIMARY KEY(user_low_id,user_high_id), CONSTRAINT fk_cf_low FOREIGN KEY(user_low_id) REFERENCES users(id) ON DELETE CASCADE, CONSTRAINT fk_cf_high FOREIGN KEY(user_high_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
      "CREATE TABLE IF NOT EXISTS community_conversations (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, user_low_id INT UNSIGNED NOT NULL, user_high_id INT UNSIGNED NOT NULL, last_read_low DATETIME DEFAULT NULL, last_read_high DATETIME DEFAULT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, updated_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, UNIQUE KEY uq_community_conversation_pair(user_low_id,user_high_id), CONSTRAINT fk_cc_low FOREIGN KEY(user_low_id) REFERENCES users(id) ON DELETE CASCADE, CONSTRAINT fk_cc_high FOREIGN KEY(user_high_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci",
      "CREATE TABLE IF NOT EXISTS community_messages (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY, conversation_id BIGINT UNSIGNED NOT NULL, sender_id INT UNSIGNED NOT NULL, body VARCHAR(199) NOT NULL, created_at DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP, KEY idx_cm_conversation_id(conversation_id,id), CONSTRAINT fk_cm_conversation FOREIGN KEY(conversation_id) REFERENCES community_conversations(id) ON DELETE CASCADE, CONSTRAINT fk_cm_sender FOREIGN KEY(sender_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci"
    ]; foreach($sql as $statement)$db->exec($statement);
}
function community_pair(int $a,int $b): array { return [min($a,$b),max($a,$b)]; }
function community_friend(PDO $db,int $a,int $b): bool { [$lo,$hi]=community_pair($a,$b);$q=$db->prepare('SELECT 1 FROM community_friendships WHERE user_low_id=? AND user_high_id=?');$q->execute([$lo,$hi]);return (bool)$q->fetchColumn(); }
function community_profile_select(): string { return "SELECT u.id,u.username,u.full_name,u.avatar,COALESCE(s.level,1) level,COALESCE(s.total_xp,0) total_xp,COALESCE(s.streak,0) streak"; }
function community_profiles(PDO $db,int $uid): array {
 $q=$db->prepare(community_profile_select()." FROM community_friendships f JOIN users u ON u.id=IF(f.user_low_id=?,f.user_high_id,f.user_low_id) LEFT JOIN user_stats s ON s.user_id=u.id WHERE (f.user_low_id=? OR f.user_high_id=?) AND u.is_active=1 ORDER BY u.username");$q->execute([$uid,$uid,$uid]);return $q->fetchAll(PDO::FETCH_ASSOC);
}
function community_ranking(PDO $db,int $uid,string $scope,string $sort): array {
 $order=$sort==='streak'?'COALESCE(s.streak,0) DESC,COALESCE(s.total_xp,0) DESC':'COALESCE(s.total_xp,0) DESC,COALESCE(s.streak,0) DESC';
 if($scope==='friends'){$q=$db->prepare(community_profile_select()." FROM users u LEFT JOIN user_stats s ON s.user_id=u.id WHERE u.is_active=1 AND (u.id=? OR EXISTS(SELECT 1 FROM community_friendships f WHERE (f.user_low_id=? AND f.user_high_id=u.id) OR (f.user_high_id=? AND f.user_low_id=u.id))) ORDER BY $order,u.username LIMIT 100");$q->execute([$uid,$uid,$uid]);}
 else {$q=$db->prepare(community_profile_select()." FROM users u LEFT JOIN user_stats s ON s.user_id=u.id WHERE u.is_active=1 AND (u.is_public=1 OR u.id=?) ORDER BY $order,u.username LIMIT 100");$q->execute([$uid]);}
 return $q->fetchAll(PDO::FETCH_ASSOC);
}
function community_conversation(PDO $db,int $uid,int $friend): int {
 if(!community_friend($db,$uid,$friend))throw new DomainException('Solo puedes chatear con tus amigos.');[$lo,$hi]=community_pair($uid,$friend);
 $q=$db->prepare('INSERT INTO community_conversations(user_low_id,user_high_id,last_read_low,last_read_high) VALUES(?,?,IF(?=?,UTC_TIMESTAMP(),NULL),IF(?=?,UTC_TIMESTAMP(),NULL)) ON DUPLICATE KEY UPDATE id=LAST_INSERT_ID(id)');$q->execute([$lo,$hi,$uid,$lo,$uid,$hi]);
 $q=$db->prepare('SELECT id FROM community_conversations WHERE user_low_id=? AND user_high_id=?');$q->execute([$lo,$hi]);return (int)$q->fetchColumn();
}
try {
 community_schema($pdo);
 $method=$_SERVER['REQUEST_METHOD']??'GET';$action=(string)($_GET['action']??$_POST['action']??'');
 if($method==='POST') learn_verify_csrf();
 if($action==='overview'){
  $friends=community_profiles($pdo,$uid);
  $q=$pdo->prepare("SELECT r.id,r.sender_id,r.status,u.username,u.full_name,COALESCE(s.level,1) level,COALESCE(s.total_xp,0) total_xp,COALESCE(s.streak,0) streak FROM community_friend_requests r JOIN users u ON u.id=IF(r.sender_id=r.user_low_id,r.user_high_id,r.user_low_id) LEFT JOIN user_stats s ON s.user_id=u.id WHERE r.status='pending' AND (r.user_low_id=? OR r.user_high_id=?) ORDER BY r.created_at DESC");$q->execute([$uid,$uid]);$requests=$q->fetchAll(PDO::FETCH_ASSOC);
  $q=$pdo->prepare("SELECT u.id,u.username,u.full_name,u.avatar,COALESCE(s.level,1) level,COALESCE(s.total_xp,0) total_xp,COALESCE(s.streak,0) streak,c.id conversation_id,(SELECT m.body FROM community_messages m WHERE m.conversation_id=c.id ORDER BY m.id DESC LIMIT 1) last_message,(SELECT m.created_at FROM community_messages m WHERE m.conversation_id=c.id ORDER BY m.id DESC LIMIT 1) last_message_at,(SELECT COUNT(*) FROM community_messages m WHERE m.conversation_id=c.id AND m.sender_id<>? AND m.created_at>COALESCE(IF(c.user_low_id=?,c.last_read_low,c.last_read_high),'1970-01-01')) unread FROM community_friendships f JOIN users u ON u.id=IF(f.user_low_id=?,f.user_high_id,f.user_low_id) LEFT JOIN community_conversations c ON c.user_low_id=LEAST(?,u.id) AND c.user_high_id=GREATEST(?,u.id) LEFT JOIN user_stats s ON s.user_id=u.id WHERE f.user_low_id=? OR f.user_high_id=? ORDER BY COALESCE(c.updated_at,'1970-01-01') DESC,u.username");$q->execute([$uid,$uid,$uid,$uid,$uid,$uid,$uid]);$chats=$q->fetchAll(PDO::FETCH_ASSOC);
  echo json_encode(['friends'=>$friends,'requests'=>$requests,'chats'=>$chats,'user_id'=>$uid]);exit;
 }
 if($action==='search'){
  $term=trim((string)($_GET['q']??''));if(mb_strlen($term,'UTF-8')<2){echo json_encode(['people'=>[]]);exit;}
  $like='%'.$term.'%';$q=$pdo->prepare("SELECT u.id,u.username,u.full_name,u.avatar,COALESCE(s.level,1) level,COALESCE(s.total_xp,0) total_xp,COALESCE(s.streak,0) streak,CASE WHEN f.user_low_id IS NOT NULL THEN 'friend' WHEN r.status='pending' AND r.sender_id=? THEN 'sent' WHEN r.status='pending' THEN 'received' ELSE 'none' END relation FROM users u LEFT JOIN user_stats s ON s.user_id=u.id LEFT JOIN community_friendships f ON f.user_low_id=LEAST(?,u.id) AND f.user_high_id=GREATEST(?,u.id) LEFT JOIN community_friend_requests r ON r.user_low_id=LEAST(?,u.id) AND r.user_high_id=GREATEST(?,u.id) WHERE u.id<>? AND u.is_active=1 AND u.is_public=1 AND (u.username LIKE ? OR u.full_name LIKE ?) ORDER BY u.username LIMIT 20");$q->execute([$uid,$uid,$uid,$uid,$uid,$uid,$like,$like]);echo json_encode(['people'=>$q->fetchAll(PDO::FETCH_ASSOC)]);exit;
 }
 if($action==='ranking'){$scope=($_GET['scope']??'global')==='friends'?'friends':'global';$sort=($_GET['sort']??'xp')==='streak'?'streak':'xp';echo json_encode(['entries'=>community_ranking($pdo,$uid,$scope,$sort),'scope'=>$scope,'sort'=>$sort]);exit;}
  if($method!=='POST'&&!($method==='GET'&&$action==='messages'))throw new DomainException('Acción no válida.');
 if($action==='request'){
  $target=(int)($_POST['user_id']??0);if($target===$uid||$target<1)throw new DomainException('Selecciona otra persona.');
  $q=$pdo->prepare('SELECT id FROM users WHERE id=? AND is_active=1 AND is_public=1');$q->execute([$target]);if(!$q->fetchColumn())throw new DomainException('Ese perfil no está disponible.');if(community_friend($pdo,$uid,$target))throw new DomainException('Ya son amigos.');
  [$lo,$hi]=community_pair($uid,$target);$pdo->beginTransaction();$q=$pdo->prepare('SELECT * FROM community_friend_requests WHERE user_low_id=? AND user_high_id=? FOR UPDATE');$q->execute([$lo,$hi]);$row=$q->fetch(PDO::FETCH_ASSOC);
  if($row&&$row['status']==='pending'&&(int)$row['sender_id']!==$uid){$q=$pdo->prepare('INSERT IGNORE INTO community_friendships(user_low_id,user_high_id) VALUES(?,?)');$q->execute([$lo,$hi]);$q=$pdo->prepare("UPDATE community_friend_requests SET status='accepted' WHERE user_low_id=? AND user_high_id=?");$q->execute([$lo,$hi]);$result='accepted';}
  elseif($row&&$row['status']==='pending'){$pdo->commit();echo json_encode(['success'=>true,'message'=>'La solicitud ya está enviada.']);exit;}
  elseif($row&&$row['status']==='accepted'){$pdo->commit();throw new DomainException('Ya son amigos.');}
  else{$q=$pdo->prepare("INSERT INTO community_friend_requests(user_low_id,user_high_id,sender_id,status) VALUES(?,?,?,'pending') ON DUPLICATE KEY UPDATE sender_id=VALUES(sender_id),status='pending',updated_at=UTC_TIMESTAMP()");$q->execute([$lo,$hi,$uid]);$result='sent';}
  $pdo->commit();echo json_encode(['success'=>true,'result'=>$result,'message'=>$result==='accepted'?'¡La solicitud mutua creó una amistad!':'Solicitud de amistad enviada.']);exit;
 }
 if($action==='respond'){
  $id=(int)($_POST['request_id']??0);$decision=(string)($_POST['decision']??'');
  if(!in_array($decision,['accept','decline'],true))throw new DomainException('La respuesta de la solicitud no es válida.');
  $choice=$decision==='accept'?'accepted':'declined';$pdo->beginTransaction();
  $q=$pdo->prepare('SELECT * FROM community_friend_requests WHERE id=? AND (user_low_id=? OR user_high_id=?) FOR UPDATE');$q->execute([$id,$uid,$uid]);$req=$q->fetch(PDO::FETCH_ASSOC);
  if(!$req||(int)$req['sender_id']===$uid){$pdo->rollBack();throw new DomainException('La solicitud ya no está disponible.');}
  if($req['status']==='accepted'&&$choice==='accepted'){$pdo->commit();echo json_encode(['success'=>true,'result'=>'accepted','message'=>'Ya son amigos.']);exit;}
  if($req['status']!=='pending'){$pdo->rollBack();throw new DomainException('La solicitud ya no está disponible.');}
  if($choice==='accepted'){$q=$pdo->prepare('INSERT IGNORE INTO community_friendships(user_low_id,user_high_id) VALUES(?,?)');$q->execute([$req['user_low_id'],$req['user_high_id']]);}
  $q=$pdo->prepare('UPDATE community_friend_requests SET status=? WHERE id=?');$q->execute([$choice,$id]);$pdo->commit();echo json_encode(['success'=>true,'message'=>$choice==='accepted'?'Solicitud aceptada.':'Solicitud rechazada.']);exit;
 }
 if($action==='remove'){$friend=(int)($_POST['user_id']??0);[$lo,$hi]=community_pair($uid,$friend);$q=$pdo->prepare('DELETE FROM community_friendships WHERE user_low_id=? AND user_high_id=?');$q->execute([$lo,$hi]);echo json_encode(['success'=>true]);exit;}
 if($action==='open-chat'||$action==='messages'||$action==='send'){
  $friend=(int)($_POST['user_id']??$_GET['user_id']??0);$cid=community_conversation($pdo,$uid,$friend);
  if($action==='send'){$body=trim((string)($_POST['body']??''));$length=mb_strlen($body,'UTF-8');if($length<1||$length>=200)throw new DomainException('El mensaje debe tener entre 1 y 199 caracteres.');$q=$pdo->prepare('INSERT INTO community_messages(conversation_id,sender_id,body) VALUES(?,?,?)');$q->execute([$cid,$uid,$body]);$pdo->prepare('UPDATE community_conversations SET updated_at=UTC_TIMESTAMP() WHERE id=?')->execute([$cid]);}
  $q=$pdo->prepare('SELECT id,conversation_id,sender_id,body,created_at FROM community_messages WHERE conversation_id=? ORDER BY id DESC LIMIT 50');$q->execute([$cid]);$messages=array_reverse($q->fetchAll(PDO::FETCH_ASSOC));
  [$lo,$hi]=community_pair($uid,$friend);$column=$uid===$lo?'last_read_low':'last_read_high';$pdo->prepare("UPDATE community_conversations SET $column=UTC_TIMESTAMP(),updated_at=UTC_TIMESTAMP() WHERE id=?")->execute([$cid]);echo json_encode(['success'=>true,'conversation_id'=>$cid,'friend_id'=>$friend,'messages'=>$messages]);exit;
 }
 throw new DomainException('Acción desconocida.');
} catch(DomainException $e){if($pdo->inTransaction())$pdo->rollBack();http_response_code(400);echo json_encode(['error'=>$e->getMessage()]);} catch(Throwable $e){if($pdo->inTransaction())$pdo->rollBack();error_log('[Senix community] '.$e->getMessage());http_response_code(500);echo json_encode(['error'=>'No se pudo completar la acción. Inténtalo de nuevo.']);}
