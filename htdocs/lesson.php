<?php
require_once __DIR__.'/includes/learning-tools.php';
$id=max(0,(int)($_GET['id']??0));
$lesson=null;$items=[];
try{$lesson=$lessonModel->getWithItems($id);if($lesson&&(int)$lesson['is_active']===1)$items=$lesson['items'];else $lesson=null;}
catch(Throwable $error){error_log('[lesson practice] '.$error->getMessage());}
if($lesson&&!$lessonModel->isUnlocked($learnUserId,$id)){http_response_code(403);learn_header('Lección bloqueada','Avanza por la ruta en orden para desbloquearla.');echo '<section class="learn-panel"><span class="learn-badge">🔒 BLOQUEADA</span><h2>Completa primero la lección anterior</h2><p class="learn-muted">Las lecciones se habilitan una por una. Termina las de este nivel antes de avanzar al siguiente.</p><a class="learn-button" href="lessons.php">Volver a la ruta</a></section>';learn_footer();exit;}
if(!$lesson){http_response_code(404);learn_header('Lección no disponible','No se encontró una lección activa.');echo '<section class="learn-panel"><p class="learn-muted">Puede que el contenido no esté cargado o que el enlace sea antiguo.</p><a class="learn-button" href="lessons.php">Volver a lecciones</a></section>';learn_footer();exit;}
if(!$items){learn_header($lesson['title'],'');echo '<section class="learn-panel"><h2>Esta lección todavía no tiene objetivos de práctica</h2><p class="learn-muted">La lección está registrada, pero necesita elementos en lesson_items.</p><a class="learn-button" href="lessons.php">Volver</a></section>';learn_footer();exit;}
shuffle($items);$items=array_slice($items,0,min(10,count($items)));
$attempt=bin2hex(random_bytes(16));$_SESSION['lesson_practice'][$attempt]=['lesson_id'=>$id,'item_ids'=>array_map(fn($item)=>(int)$item['id'],$items),'started_at'=>time()];
if(count($_SESSION['lesson_practice'])>8)$_SESSION['lesson_practice']=array_slice($_SESSION['lesson_practice'],-8,null,true);
try{$progressModel->start($learnUserId,$id);}catch(Throwable $error){error_log('[lesson start] '.$error->getMessage());}
$clientItems=array_map(static function($item){$details=$item['details']??[];return ['id'=>(int)$item['id'],'type'=>(string)$item['item_type'],'target'=>(string)$item['item_value'],'description'=>(string)($details['description']??''),'hint'=>(string)($details['hint']??$item['hint']??'')];},$items);
learn_header($lesson['title'],$lesson['description']??'');
?>
<section class="learn-panel" id="db-lesson-practice">
  <div class="lesson-practice-heading">
    <div><span class="eyebrow">LECCIÓN · PRÁCTICA CON CÁMARA</span><h2 id="db-target-title"></h2><p id="db-target-note"></p></div>
    <span class="lesson-detect-badge" id="db-target-step"></span>
  </div>
  <div class="lesson-practice-layout">
    <section class="lesson-practice-card">
      <div class="lesson-practice-card-head"><span>01 · TU CÁMARA</span><span id="db-hand-count">SIN INICIAR</span></div>
      <div class="lesson-camera-frame"><video id="db-camera-video" aria-label="Vista de cámara con detección de manos" autoplay playsinline muted></video><canvas id="db-camera-overlay" aria-hidden="true"></canvas><span class="lesson-camera-corners"></span></div>
      <div class="lesson-camera-meter"><div><span>Manos visibles</span><strong><span id="db-detection-time">0.0</span> / 2.5 s</strong></div><div class="learn-progress"><i id="db-detection-fill"></i></div></div>
      <div class="lesson-camera-actions"><button class="learn-button" id="db-camera-start" type="button">Activar cámara</button><button class="learn-button secondary" id="db-camera-stop" type="button" disabled>Apagar</button></div>
      <p class="lesson-camera-status" id="db-camera-status" role="status" aria-live="polite">La cámara está apagada. El vídeo se procesa en este dispositivo.</p>
    </section>
    <section class="lesson-practice-card lesson-sign-guide">
      <div class="lesson-practice-card-head"><span>02 · GUÍA DE LA SEÑA</span><span>MODELO 3D</span></div>
      <div class="lesson-guide-stage"><span class="lesson-guide-cross cross-one"></span><span class="lesson-guide-cross cross-two"></span><div class="lesson-guide-mark">3D</div><span class="lesson-guide-caption">ESPACIO DE REFERENCIA</span></div>
      <div class="lesson-guide-copy"><span class="eyebrow">REFERENCIA DEL DICCIONARIO</span><h3 id="db-guide-target"></h3><p id="db-guide-description"></p><p id="db-guide-hint"></p><p>El modelo 3D con la configuración y el movimiento de la seña se añadirá en este espacio.</p></div>
    </section>
  </div>
  <p class="lesson-camera-disclaimer">La detección confirma que hay una mano en el encuadre; no comprueba que hayas reproducido correctamente la seña. Las descripciones proceden del diccionario del proyecto y necesitan validación por personas usuarias competentes en LSM.</p>
  <form method="post" action="lesson-result.php" id="db-lesson-submit"><?= learn_csrf() ?><input type="hidden" name="attempt" value="<?= learn_h($attempt) ?>"><input type="hidden" name="timezone" id="lesson-timezone" value="America/Mexico_City"><div id="db-completed-items"></div></form>
  <div class="lesson-camera-actions"><button class="learn-button" id="db-next" type="button" disabled>Siguiente objetivo →</button><a class="learn-button secondary" href="lessons.php">Salir de la lección</a></div>
</section>
<script type="application/json" id="db-lesson-items"><?= json_encode($clientItems,JSON_HEX_TAG|JSON_HEX_APOS|JSON_HEX_QUOT|JSON_HEX_AMP|JSON_UNESCAPED_UNICODE) ?></script>
<script>try{document.getElementById('lesson-timezone').value=Intl.DateTimeFormat().resolvedOptions().timeZone||'America/Mexico_City'}catch(e){}</script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/hands/hands.js" crossorigin="anonymous"></script>
<script src="https://cdn.jsdelivr.net/npm/@mediapipe/drawing_utils/drawing_utils.js" crossorigin="anonymous"></script>
<script src="<?= learn_h(asset('js/learning-camera.js')) ?>" defer></script>
<script src="<?= learn_h(asset('js/lesson-session.js')) ?>" defer></script>
<?php learn_footer(); ?>
