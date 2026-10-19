/* ==================================================================
   EcoApp — Lógica principal (versión con servidor: PHP + MySQL)
   Las funciones de historial siguen siendo síncronas (leen una caché
   en memoria); `ecoappReady` se resuelve cuando la caché ya cargó.
   ================================================================== */
(function () {
  "use strict";

  /* ---------- API ---------- */
  async function api(url, opts) {
    const r = await fetch(url, Object.assign({ credentials: "same-origin" }, opts || {}));
    const txt = await r.text();
    let data;
    try { data = JSON.parse(txt); }
    catch (e) {
      // El hosting gratuito a veces devuelve una página de verificación (aes.js) en vez de JSON
      throw new Error("Respuesta inválida del servidor. Recarga la página (Ctrl+F5) e inténtalo otra vez.");
    }
    if (r.status === 401 && !/auth\.php\?action=login/.test(url)) {
      localStorage.removeItem("ecoapp_user");
      window.location.href = "login.html";
    }
    if (!r.ok) throw new Error(data.error || "Error del servidor");
    return data;
  }
  window.ecoappApi = api;
  window.ecoappPost = (url, obj) => api(url, {
    method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(obj)
  });

  /* ---------- USUARIO / SESIÓN ---------- */
  // localStorage solo guarda el nombre para pintar la interfaz; la sesión real vive en el servidor.
  window.ecoappGetUser = function () {
    try { return JSON.parse(localStorage.getItem("ecoapp_user")); } catch (e) { return null; }
  };
  window.ecoappSetUser = function (u) { localStorage.setItem("ecoapp_user", JSON.stringify(u)); };

  window.ecoappRequireAuth = function () {
    const user = ecoappGetUser();
    if (!user) { window.location.href = "login.html"; return null; }
    return user;
  };

  window.ecoappLogout = async function () {
    try { await api("api/auth.php?action=logout"); } catch (e) {}
    localStorage.removeItem("ecoapp_user");
    window.location.href = "index.html";
  };

  /* ---------- HISTORIAL (caché + servidor) ---------- */
  let cache = [];

  function hidratar(it) {
    const mat = (window.ECOAPP && ECOAPP.MATERIALES.find(m => m.id === it.materialId)) || null;
    return Object.assign({}, it, { svgIcon: mat ? mat.svgIcon : "" });
  }

  window.ecoappReady = (async function () {
    if (!ecoappGetUser()) return;               // páginas públicas
    try {
      const me = await api("api/auth.php?action=me");
      ecoappSetUser(me.user);
      const h = await api("api/historial.php");
      cache = h.items.map(hidratar);
    } catch (e) { console.warn("EcoApp:", e.message); }
  })();

  window.ecoappGetHistorial = function () { return cache.slice(); };

  window.ecoappSaveHistorial = async function (item) {
    const payload = {
      materialId: item.id, nombre: item.nombre, categoria: item.categoria,
      biodegradable: item.biodegradable, nivelImpacto: item.nivelImpacto,
      confianza: item.confianza, objeto: item.objeto || ""
    };
    const r = await ecoappPost("api/historial.php", payload);
    cache.unshift(hidratar({
      id: r.id, materialId: item.id, nombre: item.nombre, categoria: item.categoria,
      biodegradable: item.biodegradable, nivelImpacto: item.nivelImpacto,
      confianza: item.confianza, objeto: item.objeto, fecha: item.fecha || new Date().toISOString()
    }));
  };

  window.ecoappDeleteHistorial = async function (index) {
    const it = cache[index]; if (!it) return;
    cache.splice(index, 1);
    try { await api("api/historial.php?id=" + it.id, { method: "DELETE" }); } catch (e) { cache.splice(index, 0, it); }
  };

  window.ecoappClearHistorial = async function () {
    const copia = cache; cache = [];
    try { await api("api/historial.php", { method: "DELETE" }); } catch (e) { cache = copia; }
  };

  /* ---------- HELPERS ---------- */
  window.ecoappFormatDate = function (iso) {
    return new Date(iso).toLocaleDateString("es-MX", { day: "2-digit", month: "short", year: "numeric" });
  };

  window.ecoappEscapeHtml = function (str) {
    return String(str).replace(/&/g, "&amp;").replace(/</g, "&lt;")
      .replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
  };

  window.ecoappGetQuickStats = function () {
    const hist = ecoappGetHistorial();
    if (!hist.length) return { total: 0, bioPct: 0, topCategoria: "—", impactoAlto: 0 };
    const bioCount = hist.filter(h => h.biodegradable).length;
    const counts = {};
    hist.forEach(h => { counts[h.categoria] = (counts[h.categoria] || 0) + 1; });
    const top = Object.entries(counts).sort((a, b) => b[1] - a[1])[0];
    return {
      total: hist.length,
      bioPct: Math.round((bioCount / hist.length) * 100),
      topCategoria: top ? top[0] : "—",
      impactoAlto: hist.filter(h => h.nivelImpacto === "Alto").length
    };
  };
})();
