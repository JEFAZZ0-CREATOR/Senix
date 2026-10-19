/* ==================================================================
   EcoApp — Motor de IA en el navegador (TensorFlow.js)
   · COCO-SSD  : detecta y ubica varios objetos a la vez (80 clases)
   · MobileNet : reconoce 1000 categorías (ImageNet) en cada objeto
   Todo corre en el teléfono/PC del usuario: no consume recursos ni
   "hits" del hosting y no necesita API keys.
   ================================================================== */
(function () {
  "use strict";

  const SCRIPTS = [
    "https://cdn.jsdelivr.net/npm/@tensorflow/tfjs@4.22.0/dist/tf.min.js",
    "https://cdn.jsdelivr.net/npm/@tensorflow-models/coco-ssd@2.2.3/dist/coco-ssd.min.js",
    "https://cdn.jsdelivr.net/npm/@tensorflow-models/mobilenet@2.1.1/dist/mobilenet.min.js"
  ];

  /* ---------- Etiqueta (inglés) → material de EcoApp ---------- */
  const NO_RESIDUO = /ashcan|trash can|garbage|dustbin|wastebin|ash can/;
  const REGLAS = [
    ["vidrio",  /wine bottle|beer bottle|beer glass|wine glass|goblet|chalice|\bvase\b|perfume|\bjar\b|red wine/],
    ["pila",    /battery|flashlight|torch|remote control|cellular|cell phone|mobile phone|ipod|\bradio\b|calculator|\bmouse\b|keyboard|laptop|notebook|desktop computer|monitor|joystick|modem|digital watch|digital clock|power drill|hard disc|cd player|tape player|walkie|loudspeaker|projector|printer|space bar|hair dr/],
    ["organico",/banana|apple|orange|lemon|pineapple|strawberr|broccoli|cauliflower|carrot|cucumber|pomegranate|\bfig\b|jackfruit|custard apple|\bcorn\b|mushroom|squash|zucchini|bell pepper|artichoke|cabbage|granny smith|sandwich|hotdog|hot dog|pizza|donut|doughnut|\bcake\b|bagel|pretzel|burrito|cheeseburger|hamburger|guacamole|ice cream|trifle|potato|meat loaf|carbonara|french loaf|dough|\begg|pot pie|consomme|\bhay\b|acorn|bolete|agaric|stinkhorn|gyromitra|earthstar|hen-of-the-woods|fungus|chocolate|plant/],
    ["carton",  /carton|crate|\bbox\b|envelope|packet|book jacket|binder|paper towel|toilet tissue|\bmenu\b|newspaper|comic book|\bbook\b|\bpaper\b|cardboard|tissue/],
    ["metal",   /\bcan\b|\btin\b|milk can|crock pot|stockpot|pressure cooker|caldron|cauldron|dutch oven|frying pan|\bwok\b|skillet|ladle|spatula|\bfork\b|\bknife\b|\bspoon\b|cleaver|strainer|wrench|hammer|\bscrew\b|\bnail\b|padlock|chain|cocktail shaker|thimble|teapot|kettle|dumbbell|barbell|corkscrew|bottle opener|stove|scissors/],
    ["plastico",/bottle|plastic|water jug|\bjug\b|\bbag\b|bucket|\bpail\b|\btoy\b|frisbee|lighter|ballpoint|hair spray|lotion|sunscreen|soap dispenser|syringe|tupperware|\bcup\b|shower cap|bathing cap|diaper|sunglasses|toothbrush|umbrella|backpack|handbag|balloon/]
  ];
  function materialDeLabel(label) {
    const l = String(label || "").toLowerCase();
    if (NO_RESIDUO.test(l)) return null;
    for (const [id, re] of REGLAS) if (re.test(l)) return id;
    return null;
  }

  /* ---------- Nombres en español (los más comunes) ---------- */
  const ES = {
    "bottle":"botella","water bottle":"botella de agua","pop bottle":"botella de refresco","beer bottle":"botella de cerveza",
    "wine bottle":"botella de vino","pill bottle":"frasco de pastillas","plastic bag":"bolsa de plástico","carton":"cartón",
    "crate":"caja","envelope":"sobre","packet":"paquete","paper towel":"toalla de papel","toilet tissue":"papel higiénico",
    "milk can":"bote de leche","cocktail shaker":"coctelera","frying pan":"sartén","teapot":"tetera","bucket":"cubeta",
    "beer glass":"vaso cervecero","goblet":"copa","vase":"florero","cup":"vaso o taza","coffee mug":"taza","ladle":"cucharón",
    "banana":"plátano","apple":"manzana","orange":"naranja","lemon":"limón","pineapple":"piña","strawberry":"fresa",
    "broccoli":"brócoli","cauliflower":"coliflor","cucumber":"pepino","pomegranate":"granada","fig":"higo","granny smith":"manzana",
    "carrot":"zanahoria","corn":"elote","mushroom":"hongo","pizza":"pizza","cheeseburger":"hamburguesa","hotdog":"hot dog","hot dog":"hot dog",
    "bagel":"bagel","pretzel":"pretzel","burrito":"burrito","sandwich":"sándwich","donut":"dona","cake":"pastel","bowl":"tazón",
    "cellular telephone":"celular","cell phone":"celular","remote control":"control remoto","laptop":"laptop","notebook":"laptop",
    "mouse":"ratón","keyboard":"teclado","computer keyboard":"teclado","flashlight":"linterna","radio":"radio","calculator":"calculadora",
    "digital watch":"reloj digital","power drill":"taladro","hard disc":"disco duro","book jacket":"libro","comic book":"cómic",
    "binder":"carpeta","menu":"menú","book":"libro","fork":"tenedor","knife":"cuchillo","spoon":"cuchara","scissors":"tijeras",
    "wine glass":"copa de vino","backpack":"mochila","handbag":"bolso","umbrella":"paraguas","toothbrush":"cepillo de dientes",
    "hair drier":"secadora de pelo","frisbee":"frisbee","lighter":"encendedor","ballpoint":"pluma","tv":"televisión","clock":"reloj"
  };
  function nombreES(label) {
    const first = String(label || "").split(",")[0].trim();
    const es = ES[first.toLowerCase()] || first;
    return es.charAt(0).toUpperCase() + es.slice(1);
  }

  const COLOR = { plastico:"#2a7fb8", carton:"#a17e52", metal:"#6b7480", vidrio:"#2f9e6b", organico:"#d08a1e", tetrapak:"#c0504a", pila:"#8a3fb0" };
  const IGNORAR = /^(person|bird|cat|dog|horse|sheep|cow|elephant|bear|zebra|giraffe|bicycle|car|motorcycle|airplane|bus|train|truck|boat|traffic light|fire hydrant|stop sign|parking meter|bench|chair|couch|bed|dining table|toilet|tv|refrigerator|oven|microwave|sink)$/;

  /* ---------- Carga de modelos ---------- */
  let coco = null, mob = null, cargando = null;

  function cargarScript(src) {
    return new Promise((ok, fail) => {
      const s = document.createElement("script");
      s.src = src; s.onload = ok;
      s.onerror = () => fail(new Error("No se pudo descargar la IA (" + src.split("/")[4] + "). Revisa tu conexión."));
      document.head.appendChild(s);
    });
  }

  function cargar(cb) {
    cb = cb || function () {};
    if (coco && mob) return Promise.resolve();
    if (cargando) return cargando;
    cargando = (async () => {
      if (!window.tf) { cb("Descargando motor de IA…"); await cargarScript(SCRIPTS[0]); }
      await tf.ready();
      if (!window.cocoSsd) { cb("Descargando detector de objetos…"); await cargarScript(SCRIPTS[1]); }
      if (!window.mobilenet) { cb("Descargando clasificador de 1000 categorías…"); await cargarScript(SCRIPTS[2]); }
      cb("Cargando modelo de detección…");
      coco = await cocoSsd.load({ base: "lite_mobilenet_v2" });
      cb("Cargando modelo de clasificación…");
      mob = await mobilenet.load({ version: 2, alpha: 1.0 });
      cb("Calentando IA…");
      const c = document.createElement("canvas"); c.width = c.height = 224;
      await mob.classify(c, 1); await coco.detect(c, 1);
    })();
    cargando.catch(() => { cargando = null; });
    return cargando;
  }

  /* ---------- Resultado compatible con la tarjeta de EcoApp ---------- */
  function construirResultado(materialId, label, conf) {
    const mat = ECOAPP.MATERIALES.find(m => m.id === materialId);
    if (!mat) return null;
    const objeto = label ? nombreES(label) : "";
    return Object.assign({}, mat, {
      nombre: objeto || mat.nombre,
      objeto: objeto,
      confianza: Math.max(30, Math.min(97, Math.round(conf * 100))),
      puntos: ECOAPP.PUNTOS[materialId] || [],
      detalles: null
    });
  }

  function elegir(preds, cocoClass) {
    for (const p of preds || []) {
      if (p.probability < 0.06) continue;
      const m = materialDeLabel(p.className);
      if (m) return { materialId: m, label: p.className, conf: p.probability };
    }
    if (cocoClass) {
      const m = materialDeLabel(cocoClass);
      if (m) return { materialId: m, label: cocoClass, conf: 0.5 };
    }
    return null;
  }

  /* ---------- Foto subida ---------- */
  async function clasificarDataUrl(dataUrl, cb) {
    await cargar(cb);
    const img = new Image(); img.src = dataUrl;
    await img.decode();
    const preds = await mob.classify(img, 5);
    let sel = elegir(preds);
    if (!sel) {
      const dets = (await coco.detect(img, 10)).filter(d => !IGNORAR.test(d.class));
      for (const d of dets) { sel = elegir([], d.class); if (sel) { sel.conf = d.score * 0.8; break; } }
    }
    return sel ? construirResultado(sel.materialId, sel.label, sel.conf) : null;
  }

  /* ==================================================================
     ESCÁNER EN VIVO
     ================================================================== */
  const Live = (function () {
    let video, canvas, ctx, stream = null, running = false, facing = "environment";
    let tracks = [], uid = 0, scene = null, lastFull = 0, hooks = {};
    const crop = document.createElement("canvas"); crop.width = crop.height = 224;
    const cctx = crop.getContext("2d");
    let fpsT = performance.now(), frames = 0, fps = 0;

    function iou(a, b) {
      const x1 = Math.max(a[0], b[0]), y1 = Math.max(a[1], b[1]);
      const x2 = Math.min(a[0] + a[2], b[0] + b[2]), y2 = Math.min(a[1] + a[3], b[1] + b[3]);
      const i = Math.max(0, x2 - x1) * Math.max(0, y2 - y1);
      return i / (a[2] * a[3] + b[2] * b[3] - i || 1);
    }

    function actualizarTracks(dets, now) {
      const usados = new Set();
      dets.sort((a, b) => b.score - a.score).slice(0, 8).forEach(d => {
        let best = null, bi = 0.3;
        tracks.forEach(t => { if (!usados.has(t)) { const v = iou(t.box, d.bbox); if (v > bi) { bi = v; best = t; } } });
        if (best) {
          best.box = best.box.map((v, i) => v * 0.5 + d.bbox[i] * 0.5);
          best.seen = now; best.coco = d.class; usados.add(best);
        } else {
          tracks.push({ id: ++uid, box: d.bbox.slice(), coco: d.class, seen: now, lastCls: 0, materialId: null, label: null, conf: 0, manual: false });
        }
      });
      tracks = tracks.filter(t => now - t.seen < 900);
    }

    async function clasificarTrack(t, now) {
      const vw = video.videoWidth, vh = video.videoHeight, [x, y, w, h] = t.box, pad = 0.1;
      const sx = Math.max(0, x - w * pad), sy = Math.max(0, y - h * pad);
      const sw = Math.max(8, Math.min(vw - sx, w * (1 + 2 * pad))), sh = Math.max(8, Math.min(vh - sy, h * (1 + 2 * pad)));
      cctx.drawImage(video, sx, sy, sw, sh, 0, 0, 224, 224);
      const preds = await mob.classify(crop, 5);
      t.lastCls = now;
      if (t.manual) return;
      const sel = elegir(preds, t.coco);
      if (sel) { t.materialId = sel.materialId; t.label = sel.label; t.conf = sel.conf; }
      else { t.materialId = null; t.label = null; }
    }

    async function clasificarEscena() {
      const vw = video.videoWidth, vh = video.videoHeight, s = Math.min(vw, vh);
      cctx.drawImage(video, (vw - s) / 2, (vh - s) / 2, s, s, 0, 0, 224, 224);
      const preds = await mob.classify(crop, 5);
      scene = elegir(preds);
    }

    function dibujar() {
      const W = canvas.width, H = canvas.height, lw = Math.max(2, W / 220), fs = Math.max(13, Math.round(W / 34));
      ctx.clearRect(0, 0, W, H);
      ctx.lineWidth = lw; ctx.font = "600 " + fs + "px system-ui, sans-serif"; ctx.textBaseline = "top";
      tracks.forEach(t => {
        const [x, y, w, h] = t.box;
        if (!t.materialId) {                       // aún analizando
          ctx.setLineDash([8, 6]); ctx.strokeStyle = "rgba(255,255,255,.7)"; ctx.strokeRect(x, y, w, h); ctx.setLineDash([]);
          return;
        }
        const col = COLOR[t.materialId] || "#fff";
        ctx.strokeStyle = col; ctx.strokeRect(x, y, w, h);
        const mat = ECOAPP.MATERIALES.find(m => m.id === t.materialId);
        const txt = nombreES(t.label) + " · " + (mat ? mat.nombre : "") + " " + Math.round(t.conf * 100) + "%";
        const tw = ctx.measureText(txt).width + 12, th = fs + 8, ty = y - th < 0 ? y : y - th;
        ctx.fillStyle = col; ctx.fillRect(x, ty, tw, th);
        ctx.fillStyle = "#fff"; ctx.fillText(txt, x + 6, ty + 4);
      });
    }

    function items() {
      const lst = tracks.filter(t => t.materialId).map(t => ({ id: t.id, materialId: t.materialId, label: t.label, conf: t.conf, manual: t.manual }));
      if (!lst.length && scene) lst.push({ id: "scene", materialId: scene.materialId, label: scene.label, conf: scene.conf, manual: false });
      return lst;
    }

    async function tick() {
      if (!running) return;
      const t0 = performance.now();
      try {
        if (video.readyState >= 2 && video.videoWidth) {
          if (canvas.width !== video.videoWidth) { canvas.width = video.videoWidth; canvas.height = video.videoHeight; }
          const dets = (await coco.detect(video, 15)).filter(d => d.score >= 0.5 && !IGNORAR.test(d.class));
          const now = performance.now();
          actualizarTracks(dets, now);
          let presupuesto = 2;
          for (const t of tracks) {
            if (presupuesto <= 0) break;
            if (!t.manual && now - t.lastCls > (t.materialId ? 2500 : 600)) { presupuesto--; await clasificarTrack(t, now); }
          }
          if (now - lastFull > 900) { lastFull = now; await clasificarEscena(); }
          dibujar();
          frames++;
          if (now - fpsT > 1000) { fps = Math.round(frames * 1000 / (now - fpsT)); frames = 0; fpsT = now; }
          hooks.onUpdate && hooks.onUpdate(items(), fps);
        }
      } catch (e) { console.warn("tick:", e); }
      setTimeout(tick, Math.max(0, 80 - (performance.now() - t0)));
    }

    async function abrirCamara() {
      if (stream) stream.getTracks().forEach(t => t.stop());
      stream = await navigator.mediaDevices.getUserMedia({
        video: { facingMode: { ideal: facing }, width: { ideal: 640 }, height: { ideal: 480 } }, audio: false
      });
      video.srcObject = stream;
      await video.play();
    }

    return {
      async start(v, c, h) {
        video = v; canvas = c; ctx = c.getContext("2d"); hooks = h || {};
        if (!window.isSecureContext || !navigator.mediaDevices || !navigator.mediaDevices.getUserMedia)
          throw new Error("La cámara en vivo necesita HTTPS. Abre la app con https:// (o usa «Tomar foto»).");
        hooks.onStatus && hooks.onStatus("Cargando IA (solo la primera vez, ~20 MB)…");
        await cargar(hooks.onStatus);
        try { await abrirCamara(); }
        catch (e) {
          throw new Error(e && e.name === "NotAllowedError" ? "Permiso de cámara denegado. Actívalo en el candado de la barra de direcciones."
            : "No se pudo abrir la cámara: " + (e.message || e.name));
        }
        tracks = []; scene = null; running = true; tick();
      },
      stop() {
        running = false;
        if (stream) stream.getTracks().forEach(t => t.stop());
        stream = null; if (video) video.srcObject = null;
        if (ctx) ctx.clearRect(0, 0, canvas.width, canvas.height);
        tracks = [];
      },
      async switchCamera() { facing = facing === "environment" ? "user" : "environment"; if (running) await abrirCamara(); },
      setMaterial(id, materialId) {
        const t = tracks.find(x => x.id === id);
        if (t) { t.materialId = materialId; t.manual = true; t.conf = 1; }
        else if (id === "scene" && scene) { scene.materialId = materialId; }
      },
      snapshot() {
        const c = document.createElement("canvas"); c.width = video.videoWidth; c.height = video.videoHeight;
        c.getContext("2d").drawImage(video, 0, 0); return c.toDataURL("image/jpeg", 0.85);
      },
      isRunning() { return running; }
    };
  })();

  window.ECOAPP_IA = { cargar, materialDeLabel, nombreES, construirResultado, clasificarDataUrl, Live, COLOR };
})();
