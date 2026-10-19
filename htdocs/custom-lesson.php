<?php
require_once __DIR__.'/includes/learning-tools.php';
learn_ensure_tables();
$error='';
$editing=max(0,(int)($_GET['id']??$_POST['lesson_id']??0));
$lesson=null;$items=[];

$curriculumVocabulary=[
    's1-0'=>['1','2','3','4','5','6','7','8','9','10'],
    's1-1'=>['A','B','C','D','E','F'], 's1-2'=>['G','H','I','J','K','L'],
    's1-3'=>['M','N','O','P','Q','R','S'], 's1-4'=>['T','U','V','W','X','Y','Z'],
    's2-0'=>['Hola','Buenos días','Buenas tardes','Buenas noches','Gracias','Por favor','De nada / Con gusto','Adiós / Nos vemos'],
    's2-1'=>['Yo','Tú','Él / Ella','Nombre','Persona / Sordo','Oyente','Mamá','Papá','Familia'],
    's2-2'=>['Bien','Mal','Feliz / Contento','Triste','Cansado','Enfermo'],
    's2-3'=>['¿Qué?','¿Quién?','¿Dónde?','¿Cuándo?','¿Por qué?','¿Cómo?'],
    's2-4'=>['Sí','No','Tal vez / Quizás','Saber / Entender','No saber / No entender'],
    's2-5'=>['Comer','Tomar / Beber','Ir','Venir','Ayudar','Aprender','Enseñar','Trabajar','Gustar'],
    's2-6'=>['Hoy','Mañana','Ayer','Casa','Escuela','Baño','Tiempo / Hora'],
    's3-0'=>['Hola, ¿cómo estás?','Mucho gusto en conocerte.','Mi nombre es [Nombre].','¿Cuál es tu nombre?','Yo soy sordo(a).','Yo soy oyente.'],
    's3-1'=>['Yo estoy aprendiendo Lengua de Señas Mexicana.','No entiendo, ¿puedes repetir por favor?','¿Cómo se dice esto en señas?','Por favor, habla/haz la seña más despacio.','¿Tú entiendes LSM?'],
    's3-2'=>['¿Dónde está el baño?','¿Necesitas ayuda?','Ayúdame, por favor.','Tengo hambre.','Tengo sed.','Me siento mal.'],
    's3-3'=>['¿Qué hora es?','Nos vemos mañana.','Hoy voy a trabajar.','¿A dónde vas?'],
    's3-4'=>['Me gusta aprender.','Estoy muy feliz de estar aquí.','Gracias por tu tiempo.','Que tengas buen día.']
];
$completed=learn_curriculum_completed($learnUserId);
$learnedVocabulary=[];
foreach($completed as $key) if(isset($curriculumVocabulary[$key])) $learnedVocabulary=array_merge($learnedVocabulary,$curriculumVocabulary[$key]);
$learnedVocabulary=array_values(array_unique($learnedVocabulary));

if($editing){$q=learn_db()->prepare('SELECT * FROM custom_lessons WHERE id=? AND user_id=?');$q->execute([$editing,$learnUserId]);$lesson=$q->fetch();if($lesson){$q=learn_db()->prepare('SELECT * FROM custom_lesson_items WHERE custom_lesson_id=? ORDER BY order_index');$q->execute([$editing]);$items=$q->fetchAll();}}
if($_SERVER['REQUEST_METHOD']==='POST'){
    learn_verify_csrf();$action=(string)($_POST['action']??'save');
    if($action==='answer'&&$lesson&&$items){$score=0;$count=count($items);foreach($items as $it){$ans=(string)($_POST['answers'][$it['id']]??'');if(hash_equals((string)$it['answer'],$ans))$score++;}try{$q=learn_db()->prepare('INSERT INTO custom_lesson_progress(custom_lesson_id,user_id,score,question_count) VALUES(?,?,?,?)');$q->execute([$editing,$learnUserId,$score,$count]);if($count>0&&$score===$count)learn_record_practice($learnUserId,0);}catch(Throwable $e){error_log('[custom lesson progress] '.$e->getMessage());}$result=['score'=>$score,'count'=>$count];$_SESSION['custom_result']=$result;header('Location: custom-lesson.php?id='.$editing.'&result=1');exit;}
    if($action==='save'){
        $title=trim((string)($_POST['title']??''));$description=trim((string)($_POST['description']??''));$answers=$_POST['answer']??[];$valid=[];$used=[];$invalidTarget=false;
        for($i=0;$i<min(10,count($answers));$i++){
            $answer=trim((string)($answers[$i]??''));if($answer==='')continue;
            if(!in_array($answer,$learnedVocabulary,true)){$invalidTarget=true;continue;}
            if(isset($used[$answer]))continue;$used[$answer]=true;
            $options=$learnedVocabulary;shuffle($options);$options=array_slice($options,0,min(4,count($options)));
            if(!in_array($answer,$options,true)){$options[count($options)-1]=$answer;}
            shuffle($options);$prompt='¿Cuál de estas opciones representa la seña de «'.$answer.'»?';
            $valid[]=[$prompt,$answer,$options];
        }
        if(mb_strlen($title)<3||mb_strlen($title)>120)$error='El título debe tener entre 3 y 120 caracteres.';
        elseif($invalidTarget)$error='Solo puedes incluir contenido de lecciones que ya completaste. Actualiza la página y selecciona una opción disponible.';
        elseif(!$valid)$error='Selecciona al menos un objetivo de las lecciones completadas.';
        else{try{learn_db()->beginTransaction();if($editing&&$lesson){learn_db()->prepare('UPDATE custom_lessons SET title=?,description=? WHERE id=? AND user_id=?')->execute([$title,$description,$editing,$learnUserId]);learn_db()->prepare('DELETE FROM custom_lesson_items WHERE custom_lesson_id=?')->execute([$editing]);$newId=$editing;}else{$q=learn_db()->prepare('INSERT INTO custom_lessons(user_id,title,description) VALUES(?,?,?)');$q->execute([$learnUserId,$title,$description]);$newId=(int)learn_db()->lastInsertId();}$q=learn_db()->prepare('INSERT INTO custom_lesson_items(custom_lesson_id,prompt,answer,options_json,order_index) VALUES(?,?,?,?,?)');foreach($valid as $i=>$it)$q->execute([$newId,$it[0],$it[1],json_encode($it[2],JSON_UNESCAPED_UNICODE),$i]);learn_db()->commit();header('Location: custom-lesson.php?id='.$newId.'&saved=1');exit;}catch(Throwable $e){if(learn_db()->inTransaction())learn_db()->rollBack();$error='No se pudo guardar. Comprueba que la base de datos permite crear las tablas de lecciones personales.';error_log('[custom lesson] '.$e->getMessage());}}
    }
}
if($editing&&!$lesson&&!isset($_GET['saved'])){$error='No se encontró esa lección personal o no te pertenece.';$editing=0;}
learn_header($lesson?'Editar lección personal':'Crear una lección','Crea repasos con el vocabulario que ya aprendiste.',['custom-lesson.css']);
if(isset($_GET['saved']))learn_flash('Lección guardada correctamente.');
if(isset($_GET['result'])&&isset($_SESSION['custom_result'])){$r=$_SESSION['custom_result'];unset($_SESSION['custom_result']);echo '<section class="learn-panel"><div class="learn-result-score">'.(int)round($r['score']/max(1,$r['count'])*100).'%</div><p class="learn-muted">Resultado: '.(int)$r['score'].' de '.(int)$r['count'].' respuestas correctas.</p><a class="learn-button" href="custom-lesson.php?id='.$editing.'">Volver a practicar</a></section>';}
if($error)learn_flash($error);
if($lesson&&$items){echo '<section class="learn-panel"><h2>'.learn_h($lesson['title']).'</h2><p class="learn-muted">'.learn_h($lesson['description']).'</p><form method="post" class="learn-form">'.learn_csrf().'<input type="hidden" name="action" value="answer">';foreach($items as $it){$options=json_decode($it['options_json'],true)?:[$it['answer']];shuffle($options);echo '<fieldset class="learn-question"><legend>'.learn_h($it['prompt']).'</legend><div class="learn-options">';foreach($options as $o)echo '<label class="learn-option"><input type="radio" required name="answers['.(int)$it['id'].']" value="'.learn_h($o).'">'.learn_h($o).'</label>';echo '</div></fieldset>'; }echo '<button class="learn-button">Calificar respuestas</button></form></section><p><a class="learn-button secondary" href="custom-lesson.php">Crear otra</a></p>';}
else{
    echo '<form method="post" class="learn-panel learn-form custom-lesson-form"><div class="custom-lesson-intro"><span>DISEÑO PERSONAL</span><strong>Arma tu propia práctica</strong><small>Elige objetivos de señas y palabras desbloqueadas en tus lecciones. Las opciones se generan con tu vocabulario aprendido.</small></div>'.learn_csrf().'<input type="hidden" name="action" value="save"><input type="hidden" name="lesson_id" value="'.$editing.'"><label>Título<input name="title" required maxlength="120" value="'.learn_h($lesson['title']??'').'" placeholder="Ej. Repaso de saludos"></label><label>Descripción<textarea name="description" maxlength="500">'.learn_h($lesson['description']??'').'</textarea></label><p class="learn-muted">Cada objetivo debe pertenecer a una lección completada. Las respuestas distractoras se seleccionan únicamente de ese mismo contenido.</p>';
    if(!$learnedVocabulary)echo '<div class="custom-no-vocabulary"><strong>Aún no hay contenido desbloqueado</strong><span>Completa una lección de la ruta para poder crear una práctica personalizada.</span><a href="menu.php#learn">Ir a mis lecciones →</a></div>';
    for($i=0;$i<5;$i++){$it=$items[$i]??[];$answer=(string)($it['answer']??'');echo '<fieldset class="learn-question custom-question"><legend><span>✦</span> Objetivo '.($i+1).'</legend><label>Seña o palabra aprendida<select name="answer[]"><option value="">'.($learnedVocabulary?'Elige un objetivo…':'Completa una lección para desbloquear opciones').'</option>';foreach($learnedVocabulary as $word)echo '<option value="'.learn_h($word).'"'.($answer===$word?' selected':'').'>'.learn_h($word).'</option>';echo '</select><small class="custom-option-note">Solo aparece contenido de lecciones completadas.</small></label></fieldset>';}
    echo '<button class="learn-button custom-save-button"'.(!$learnedVocabulary?' disabled':'').'>Guardar mi práctica →</button></form>';
}
learn_footer();
