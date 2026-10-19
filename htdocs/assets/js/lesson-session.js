(() => {
'use strict';
const dataNode=document.getElementById('db-lesson-items');
const root=document.getElementById('db-lesson-practice');
if(!dataNode||!root)return;
const items=JSON.parse(dataNode.textContent||'[]');
const title=document.getElementById('db-target-title'),note=document.getElementById('db-target-note');
const guide=document.getElementById('db-guide-target'),description=document.getElementById('db-guide-description'),hint=document.getElementById('db-guide-hint');
const video=document.getElementById('db-camera-video'),canvas=document.getElementById('db-camera-overlay'),status=document.getElementById('db-camera-status');
const count=document.getElementById('db-hand-count'),time=document.getElementById('db-detection-time'),fill=document.getElementById('db-detection-fill');
const start=document.getElementById('db-camera-start'),stop=document.getElementById('db-camera-stop'),next=document.getElementById('db-next');
const completed=document.getElementById('db-completed-items'),form=document.getElementById('db-lesson-submit');
const targetMs=2500;let index=0,elapsed=0,lastAt=0,active=false;
function currentTitle(item){if(item.type==='letter')return 'Practica la letra '+item.target;if(item.type==='phrase')return 'Practica esta frase objetivo';return 'Practica esta seña'}
function render(){
 const item=items[index];if(!item)return;
 title.textContent=currentTitle(item);guide.textContent=item.target;
 note.textContent='Objetivo '+(index+1)+' de '+items.length+' · Mantén una o ambas manos visibles durante 2.5 segundos.';
 description.textContent=item.description||'El diccionario aún no tiene una descripción para este elemento.';
 hint.textContent=item.hint||'La guía de movimiento detallada se añadirá junto con el modelo 3D.';
 count.textContent='SIN MANOS';elapsed=0;lastAt=0;time.textContent='0.0';fill.style.width='0%';next.disabled=true;
 next.textContent=index===items.length-1?'Terminar práctica →':'Siguiente objetivo →';
 document.getElementById('db-target-step').textContent='OBJETIVO '+String(index+1).padStart(2,'0')+' / '+String(items.length).padStart(2,'0');
}
function onDetection(found,hands){
 count.textContent=hands?hands+' '+(hands===1?'MANO':'MANOS'):'SIN MANOS';
 const now=performance.now();if(found&&lastAt&&now-lastAt<=500)elapsed+=Math.min(now-lastAt,150);lastAt=found?now:0;
 const ratio=Math.min(1,elapsed/targetMs);fill.style.width=(ratio*100)+'%';time.textContent=(elapsed/1000).toFixed(1);
 if(ratio>=1){next.disabled=false;status.textContent='Manos detectadas. La cámara confirma el encuadre, no la corrección de la seña.'}
}
start.addEventListener('click',async()=>{start.disabled=true;try{await window.SenixLearningCamera.start(video,canvas,status,onDetection);active=true;start.textContent='Cámara activa';stop.disabled=false}catch(error){status.textContent=error.message||'No se pudo iniciar la cámara.';start.disabled=false;start.textContent='Intentar otra vez'}});
stop.addEventListener('click',()=>{window.SenixLearningCamera.stop();active=false;stop.disabled=true;start.disabled=false;start.textContent='Activar cámara';count.textContent='SIN MANOS';render()});
next.addEventListener('click',()=>{if(next.disabled)return;const item=items[index];const input=document.createElement('input');input.type='hidden';input.name='completed_items[]';input.value=String(item.id);completed.appendChild(input);index++;if(index<items.length){render();return}window.SenixLearningCamera.stop();active=false;form.requestSubmit()});
window.addEventListener('pagehide',()=>window.SenixLearningCamera.stop(false),{once:true});
if(!items.length){status.textContent='Esta lección no tiene objetivos para practicar.';start.disabled=true;next.disabled=true}else render();
})();
