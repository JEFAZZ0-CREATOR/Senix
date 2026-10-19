<?php
require_once __DIR__ . '/../config/db.php';
require_once __DIR__ . '/bootstrap.php';
if (!$auth->isLoggedIn()) redirect(APP_URL . '/login.php');
$learnUser=$auth->user() ?: []; $learnUserId=(int)($learnUser['id']??0);
if (session_status() !== PHP_SESSION_ACTIVE) session_start();
if (empty($_SESSION['learn_csrf'])) $_SESSION['learn_csrf']=bin2hex(random_bytes(32));
function learn_h($v){return htmlspecialchars((string)$v,ENT_QUOTES,'UTF-8');}
function learn_csrf(){return '<input type="hidden" name="csrf_token" value="'.learn_h($_SESSION['learn_csrf']).'">';}
function learn_verify_csrf(){ $t=(string)($_POST['csrf_token']??''); if(!$t||!hash_equals((string)($_SESSION['learn_csrf']??''),$t)){http_response_code(419);exit('La sesión del formulario expiró. Recarga la página e inténtalo de nuevo.');}}
function learn_db(){global $pdo;return $pdo;}
function learn_ensure_tables(){
 static $checked=false; if($checked)return true;
 $sqls=[
 "CREATE TABLE IF NOT EXISTS custom_lessons (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,user_id INT UNSIGNED NOT NULL,title VARCHAR(120) NOT NULL,description VARCHAR(500) DEFAULT '',created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,INDEX(user_id),CONSTRAINT fk_custom_lesson_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
 "CREATE TABLE IF NOT EXISTS custom_lesson_items (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,custom_lesson_id BIGINT UNSIGNED NOT NULL,prompt VARCHAR(255) NOT NULL,answer VARCHAR(255) NOT NULL,options_json TEXT NOT NULL,order_index INT NOT NULL DEFAULT 0,CONSTRAINT fk_custom_item_lesson FOREIGN KEY(custom_lesson_id) REFERENCES custom_lessons(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
 "CREATE TABLE IF NOT EXISTS custom_lesson_progress (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,custom_lesson_id BIGINT UNSIGNED NOT NULL,user_id INT UNSIGNED NOT NULL,score INT NOT NULL,question_count INT NOT NULL,completed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,INDEX(user_id),CONSTRAINT fk_clp_lesson FOREIGN KEY(custom_lesson_id) REFERENCES custom_lessons(id) ON DELETE CASCADE,CONSTRAINT fk_clp_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
 "CREATE TABLE IF NOT EXISTS daily_challenge_progress (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,challenge_date DATE NOT NULL,user_id INT UNSIGNED NOT NULL,score INT NOT NULL DEFAULT 0,completed TINYINT(1) NOT NULL DEFAULT 0,completed_at DATETIME DEFAULT NULL,UNIQUE KEY uq_daily_user(challenge_date,user_id),CONSTRAINT fk_dcp_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
 "CREATE TABLE IF NOT EXISTS skill_assessments (id BIGINT UNSIGNED AUTO_INCREMENT PRIMARY KEY,user_id INT UNSIGNED NOT NULL,score INT NOT NULL,total INT NOT NULL,level_label VARCHAR(40) NOT NULL,answers_json TEXT,created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,INDEX(user_id,created_at),CONSTRAINT fk_skill_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4",
 "CREATE TABLE IF NOT EXISTS user_curriculum_progress (user_id INT UNSIGNED NOT NULL,lesson_key VARCHAR(16) NOT NULL,lesson_order SMALLINT UNSIGNED NOT NULL,section_no TINYINT UNSIGNED NOT NULL,lesson_index TINYINT UNSIGNED NOT NULL,xp_awarded INT UNSIGNED NOT NULL DEFAULT 0,timezone VARCHAR(64) NOT NULL DEFAULT 'America/Mexico_City',completed_at_utc DATETIME NOT NULL,PRIMARY KEY(user_id,lesson_key),UNIQUE KEY uq_user_curriculum_order(user_id,lesson_order),KEY idx_curriculum_completed(completed_at_utc),CONSTRAINT fk_curriculum_progress_user FOREIGN KEY(user_id) REFERENCES users(id) ON DELETE CASCADE) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4"
 ]; $ok=true; foreach($sqls as $sql){try{learn_db()->exec($sql);}catch(Throwable $e){$ok=false;error_log('[Senix learning schema] '.$e->getMessage());}} $checked=$ok; return $ok;
}
function learn_header($title,$subtitle='',$extraCss=[]){
    $u=learn_h($title);$s=learn_h($subtitle);$url=learn_h(APP_URL);$extraLinks='';
    foreach((array)$extraCss as $css)$extraLinks.='<link rel="stylesheet" href="'.learn_h(asset('css/'.$css)).'">';
    echo '<!doctype html><html lang="es"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>'.$u.' · Senix</title><link rel="stylesheet" href="'.learn_h(asset('css/menu.css')).'"><link rel="stylesheet" href="'.learn_h(asset('css/learning-tools.css')).'"><link rel="stylesheet" href="'.learn_h(asset('css/learning-type.css')).'">'.$extraLinks.'</head><body class="sx-app"><main class="learn-tool-shell"><header class="learn-tool-top"><a href="'.$url.'/menu.php#practice">← Volver a Senix</a><span>✦ SENIX · APRENDIZAJE</span><a href="'.$url.'/logout.php">Cerrar sesión</a></header><section class="learn-tool-heading"><span class="eyebrow">TU ESPACIO DE APRENDIZAJE</span><h1>'.$u.'</h1>'.($s?'<p>'.$s.'</p>':'').'</section>';
}function learn_footer(){echo '</main></body></html>';}
function learn_flash($message){echo '<div class="learn-notice" role="status">'.learn_h($message).'</div>'; }
function learn_redirect(string $url): never { header('Location: '.$url, true, 303); exit; }
function learn_curriculum(): array {
    $items=[];
    foreach([5,7,5] as $section=>$count) for($i=0;$i<$count;$i++) $items[]=['key'=>'s'.($section+1).'-'.$i,'order'=>count($items),'section'=>$section+1,'index'=>$i,'xp'=>[20,30,40][$section]];
    return $items;
}
function learn_timezone(string $value=''): string {
    $fallback='America/Mexico_City';
    return $value!=='' && in_array($value,DateTimeZone::listIdentifiers(),true) ? $value : $fallback;
}
function learn_curriculum_completed(int $userId): array {
    learn_ensure_tables();
    $q=learn_db()->prepare('SELECT lesson_key FROM user_curriculum_progress WHERE user_id=? ORDER BY lesson_order');
    $q->execute([$userId]);
    return array_column($q->fetchAll(),'lesson_key');
}
function learn_curriculum_can_start(int $userId,string $key): bool {
    $all=learn_curriculum(); $index=null;
    foreach($all as $i=>$item) if($item['key']===$key){$index=$i;break;}
    if($index===null)return false;
    if($index===0)return true;
    $q=learn_db()->prepare('SELECT COUNT(*) FROM user_curriculum_progress WHERE user_id=? AND lesson_key=?');
    $q->execute([$userId,$all[$index-1]['key']]);
    return (int)$q->fetchColumn()===1;
}
function learn_save_curriculum_completion(int $userId,string $key,string $timezone): array {
    global $achievementModel,$userModel;
    learn_ensure_tables(); $item=null;
    foreach(learn_curriculum() as $row)if($row['key']===$key){$item=$row;break;}
    if(!$item)throw new RuntimeException('Lección no válida.');
    $db=learn_db();$tz=learn_timezone($timezone);$first=false;$xpAwarded=0;$level=1;
    $db->beginTransaction();
    try{
        $db->prepare('SELECT id FROM users WHERE id=? FOR UPDATE')->execute([$userId]);
        if(!learn_curriculum_can_start($userId,$key))throw new DomainException('Completa la lección anterior para desbloquear esta.');
        $q=$db->prepare('SELECT xp_awarded FROM user_curriculum_progress WHERE user_id=? AND lesson_key=?');$q->execute([$userId,$key]);
        $first=$q->fetchColumn()===false;
        if($first){
            $xpAwarded=$item['xp'];
            $db->prepare('INSERT INTO user_curriculum_progress(user_id,lesson_key,lesson_order,section_no,lesson_index,xp_awarded,timezone,completed_at_utc) VALUES(?,?,?,?,?,?,?,UTC_TIMESTAMP())')->execute([$userId,$key,$item['order'],$item['section'],$item['index'],$xpAwarded,$tz]);
            $q=$db->prepare('SELECT level,xp,total_xp FROM user_stats WHERE user_id=? FOR UPDATE');$q->execute([$userId]);$stats=$q->fetch();
            if(!$stats)throw new RuntimeException('No existen estadísticas para la cuenta.');
            $xp=(int)$stats['xp']+$xpAwarded;$total=(int)$stats['total_xp']+$xpAwarded;$level=(int)$stats['level'];
            while($level<MAX_LEVEL&&$xp>=xp_for_level($level)){$xp-=xp_for_level($level);$level++;}
            $db->prepare('UPDATE user_stats SET xp=?,total_xp=?,rank_points=rank_points+?,level=?,lessons_completed=lessons_completed+1 WHERE user_id=?')->execute([$xp,$total,$xpAwarded,$level,$userId]);
        }else{$q=$db->prepare('SELECT level FROM user_stats WHERE user_id=?');$q->execute([$userId]);$level=(int)$q->fetchColumn();}
        $db->commit();
    }catch(Throwable $e){if($db->inTransaction())$db->rollBack();throw $e;}
    if(isset($userModel))$userModel->updateStreak($userId,$tz);
    if(isset($achievementModel))$achievementModel->checkAll($userId);
    return ['first'=>$first,'xp'=>$xpAwarded,'level'=>$level];
}
function learn_record_practice(int $userId, int $xp=0, string $timezone=''): void {
    global $userModel,$achievementModel;
    try{if(isset($userModel)&&method_exists($userModel,'updateStreak'))$userModel->updateStreak($userId,learn_timezone($timezone));if($xp>0&&isset($userModel))$userModel->addXP($userId,$xp);if(isset($achievementModel))$achievementModel->checkAll($userId);}catch(Throwable $e){error_log('[Senix practice record] '.$e->getMessage());}
}



