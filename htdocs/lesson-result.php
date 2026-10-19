<?php
require_once __DIR__.'/includes/learning-tools.php';
learn_verify_csrf();
$attempt=(string)($_POST['attempt']??'');
$session=$_SESSION['lesson_practice'][$attempt]??null;
if(!is_array($session)||empty($session['lesson_id'])||empty($session['item_ids'])||time()-(int)$session['started_at']>7200){http_response_code(400);learn_header('Práctica no disponible');echo '<section class="learn-panel">La práctica expiró o ya no es válida. <a href="lessons.php">Volver a lecciones</a></section>';learn_footer();exit;}
$id=(int)$session['lesson_id'];$lesson=null;
try{$lesson=$lessonModel->find($id);}catch(Throwable $error){error_log('[lesson result] '.$error->getMessage());}
if($lesson&&!$lessonModel->isUnlocked($learnUserId,$id)){http_response_code(403);learn_header('Lección bloqueada');echo '<section class="learn-panel"><h2>Completa primero la lección anterior</h2><a class="learn-button" href="lessons.php">Volver a la ruta</a></section>';learn_footer();exit;}
$expected=array_values(array_unique(array_map('intval',$session['item_ids'])));
$postedItems=$_POST['completed_items']??[];$completed=is_array($postedItems)?array_values(array_unique(array_map('intval',$postedItems))):[];
sort($expected);sort($completed);
if(!$lesson||(int)$lesson['is_active']!==1||$expected!==$completed){http_response_code(422);learn_header('Práctica incompleta');echo '<section class="learn-panel"><h2>Faltan objetivos por practicar</h2><p class="learn-muted">Cada objetivo necesita que la cámara detecte una mano antes de continuar. No se califican las señas.</p><a class="learn-button" href="lesson.php?id='.$id.'">Volver a practicar</a></section>';learn_footer();exit;}
unset($_SESSION['lesson_practice'][$attempt]);
$elapsed=max(0,min(7200,time()-(int)$session['started_at']));$saved=false;$xpAwarded=0;$firstCompletion=false;$timezone=learn_timezone((string)($_POST['timezone']??''));
try{$result=$progressModel->complete($learnUserId,$id,['score'=>0,'max_score'=>count($expected),'accuracy'=>0,'time_spent'=>$elapsed]);$firstCompletion=!empty($result['first_completion']);$saved=true;if($firstCompletion){$xpAwarded=max(0,(int)($lesson['xp_reward']??20));$stats=$userModel->getStats($learnUserId)?:[];$userModel->updateStats($learnUserId,['lessons_completed'=>(int)($stats['lessons_completed']??0)+1]);learn_record_practice($learnUserId,$xpAwarded,$timezone);}else{learn_record_practice($learnUserId,0,$timezone);}}catch(Throwable $error){error_log('[lesson practice save] '.$error->getMessage());}
learn_header('Práctica terminada',$lesson['title']);
echo '<section class="learn-panel"><span class="learn-badge">PRÁCTICA REGISTRADA</span><div class="learn-result-score">'.count($expected).'</div><h2>Objetivos practicados</h2><p class="learn-muted">Recorriste '.count($expected).' objetivos con detección de manos. La cámara no evaluó si la configuración o el movimiento de cada seña fueron correctos.</p><p class="learn-muted">'.($saved?'Tu avance quedó guardado.':'No se pudo guardar el avance; inténtalo de nuevo más tarde.').'</p>'.($xpAwarded>0?'<p class="learn-badge">+'.(int)$xpAwarded.' XP por primera finalización</p>':'').'<div class="learn-grid"><a class="learn-button" href="lesson.php?id='.$id.'">Practicar otra vez</a><a class="learn-button secondary" href="lessons-path.php">Ver progreso</a><a class="learn-button secondary" href="lessons.php">Todas las lecciones</a></div></section>';
learn_footer();
