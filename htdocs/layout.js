/* ==================================================================
   EcoApp — Layout compartido (sidebar + topbar + navegación)
   ================================================================== */

(function () {
  "use strict";

  const NAV_ITEMS = [
    { id: "menu", href: "menu.html", label: "Panel",
      icon: `<rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/>` },
    { id: "escanear", href: "escanear.html", label: "Escanear residuo",
      icon: `<circle cx="11" cy="11" r="7"/><path d="M21 21l-4.3-4.3"/>` },
    { id: "historial", href: "historial.html", label: "Historial",
      icon: `<circle cx="12" cy="12" r="9"/><path d="M12 7v5l3 2"/>` },
    { id: "estadisticas", href: "estadisticas.html", label: "Estadísticas",
      icon: `<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>` },
    { id: "mapa", href: "mapa-reciclaje.html", label: "Mapa de reciclaje",
      icon: `<path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0 1 18 0z"/><circle cx="12" cy="10" r="3"/>` },
    { id: "guia", href: "guia-materiales.html", label: "Guía de materiales",
      icon: `<path d="M4 19.5A2.5 2.5 0 0 1 6.5 17H20"/><path d="M6.5 2H20v20H6.5A2.5 2.5 0 0 1 4 19.5v-15A2.5 2.5 0 0 1 6.5 2z"/>` }
  ];

  function inyectarSideLinks(activeId) {
    const ul = document.getElementById("sideLinks");
    if (!ul) return;
    ul.innerHTML = "";
    NAV_ITEMS.forEach(item => {
      const li = document.createElement("li");
      const a = document.createElement("a");
      a.href = item.href;
      a.dataset.id = item.id;
      a.innerHTML = `<svg class="nav-ico" viewBox="0 0 24 24">${item.icon}</svg>${item.label}`;
      // Cerrar sidebar al hacer clic en cualquier enlace
      a.addEventListener("click", () => toggleSidebar(false));
      if (item.id === activeId) a.classList.add("active");
      li.appendChild(a);
      ul.appendChild(li);
    });
  }

  function inyectarTopbar() {
    const tb = document.getElementById("topbarMobile");
    if (!tb) return;
    tb.innerHTML = `
      <button class="menu-toggle" type="button" aria-label="Abrir menú" onclick="toggleSidebar(true)">
        <svg viewBox="0 0 24 24">
          <path d="M4 7h16M4 12h16M4 17h16"/>
        </svg>
      </button>
      <a class="brand" href="menu.html"><span class="brand-mark"></span>EcoApp</a>
    `;
  }

  window.toggleSidebar = function (open) {
    const sb = document.getElementById("sidebar");
    const ov = document.getElementById("sidebarOverlay");
    if (!sb) return;
    const shouldOpen = typeof open === "boolean" ? open : !sb.classList.contains("open");
    sb.classList.toggle("open", shouldOpen);
    if (ov) ov.classList.toggle("show", shouldOpen);
    // Bloquear scroll del body cuando el sidebar está abierto en móvil
    if (window.innerWidth <= 820) {
      document.body.style.overflow = shouldOpen ? "hidden" : "";
    }
  };

  // Cerrar sidebar al cambiar a desktop
  window.addEventListener("resize", () => {
    if (window.innerWidth > 820) {
      toggleSidebar(false);
      document.body.style.overflow = "";
    }
  });

  // Cerrar sidebar con tecla ESC
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape") toggleSidebar(false);
  });

  window.ecoappInitShell = function (activeId) {
    const user = ecoappRequireAuth();
    if (!user) return null;
    inyectarSideLinks(activeId);
    inyectarTopbar();
    const nameEl = document.getElementById("sideUserName");
    if (nameEl) nameEl.textContent = user.nombre || user.email;
    return user;
  };
})();