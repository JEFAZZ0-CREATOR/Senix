<?php
require_once __DIR__ . '/includes/learning-tools.php';
header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store, private');
learn_ensure_tables();
learn_verify_csrf();
$action=(string)($_POST['action']??'');
$key=(string)($_POST['lesson_key']??'');
$tz=learn_timezone((string)($_POST['timezone']??''));
if($action==='test-complete'&&APP_ENV!=='development'){http_response_code(403);echo json_encode(['success'=>false,'message'=>'La herramienta de prueba solo está disponible en desarrollo.']);exit;}
if(!in_array($action,['start','complete','test-complete'],true)){http_response_code(400);echo json_encode(['success'=>false,'message'=>'Acción no válida.']);exit;}
if(!learn_curriculum_can_start($learnUserId,$key)){http_response_code(403);echo json_encode(['success'=>false,'message'=>'Completa las lecciones anteriores para desbloquear esta.']);exit;}
if($action==='start'){
    $attempt=bin2hex(random_bytes(24));
    $_SESSION['curriculum_attempts'][$attempt]=['user_id'=>$learnUserId,'lesson_key'=>$key,'started_at'=>time(),'timezone'=>$tz];
    echo json_encode(['success'=>true,'attempt'=>$attempt]);exit;
}
$attempt=(string)($_POST['attempt']??'');
$state=$_SESSION['curriculum_attempts'][$attempt]??null;
if(!is_array($state)||(int)$state['user_id']!==$learnUserId||$state['lesson_key']!==$key||time()-(int)$state['started_at']>7200){http_response_code(400);echo json_encode(['success'=>false,'message'=>'La práctica expiró. Inicia la lección nuevamente.']);exit;}
unset($_SESSION['curriculum_attempts'][$attempt]);
try{$result=learn_save_curriculum_completion($learnUserId,$key,$tz);$refresh=['stats'=>null,'achievements'=>[],'leaderboard'=>[],'xp_required'=>100];try{global $userModel,$achievementModel;$refresh['stats']=$userModel->getStats($learnUserId);$refresh['achievements']=$achievementModel->getUserAchievements($learnUserId);$refresh['leaderboard']=$userModel->getLeaderboard(5,0);if($refresh['stats'])$refresh['xp_required']=xp_for_level((int)$refresh['stats']['level']);}catch(Throwable $e){error_log('[Senix curriculum refresh] '.$e->getMessage());}echo json_encode(['success'=>true,'first'=>$result['first'],'xp'=>$result['xp'],'completed'=>learn_curriculum_completed($learnUserId)]+$refresh,JSON_INVALID_UTF8_SUBSTITUTE);}catch(DomainException $e){http_response_code(403);echo json_encode(['success'=>false,'message'=>$e->getMessage()]);}catch(Throwable $e){error_log('[Senix curriculum completion] '.$e->getMessage());http_response_code(500);echo json_encode(['success'=>false,'message'=>'No se pudo guardar el progreso. Inténtalo de nuevo.']);}
