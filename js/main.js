// Supabase reemplaza opensheet — config en js/supabase-config.js

let autos = [];
let installPromptEvent = null;

function initPwaInstallInMenu() {
  const menu = document.getElementById("menu");
  if (!menu) return;

  const installItem = document.createElement("a");
  installItem.href = "#";
  installItem.id = "install-app-btn";
  installItem.className = "install-app-link";
  installItem.textContent = "Instalar app";
  installItem.style.display = "none";

  installItem.addEventListener("click", async (e) => {
    e.preventDefault();
    if (!installPromptEvent) return;

    installPromptEvent.prompt();
    const choice = await installPromptEvent.userChoice;
    if (choice.outcome === "accepted") {
      installItem.style.display = "none";
    }
    installPromptEvent = null;
  });

  menu.appendChild(installItem);

  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    installPromptEvent = e;
    installItem.style.display = "inline-block";
  });

  window.addEventListener("appinstalled", () => {
    installItem.style.display = "none";
    installPromptEvent = null;
  });
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator)) return;
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      // Silencio para no molestar usuarios
    });
  });
}

function escapeHtml(value) {
  return String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");
}

// 👉 COMPARTIR POR WHATSAPP
function compartirWhatsApp(event) {
  event.stopPropagation();
  const btn = event.currentTarget;
  const { slug, marca, modelo, anio, precio } = btn.dataset;
  const precioNum = Number(precio || "0");
  const link = `${window.location.origin}/auto.html?slug=${encodeURIComponent(slug)}`;
  const texto = `Mirá este ${marca} ${modelo} ${anio} a $${precioNum.toLocaleString("es-AR")} en Autos Paraná 🚗\n${link}`;
  window.open(`https://wa.me/?text=${encodeURIComponent(texto)}`, "_blank");
}

const WHATSAPP_SHARE_ICON = `
  <svg viewBox="0 0 32 32" xmlns="http://www.w3.org/2000/svg">
    <path d="M16.04 4C9.96 4 5.04 8.93 5.04 15c0 2.13.59 4.13 1.63 5.85L4 28l7.3-2.6A10.94 10.94 0 0 0 16.04 26c6.08 0 11-4.93 11-11s-4.92-11-11-11Zm0 19.9c-1.78 0-3.45-.5-4.87-1.36l-.35-.21-3.55 1.26 1.27-3.46-.23-.36A8.9 8.9 0 0 1 7.04 15c0-4.97 4.03-9 9-9s9 4.03 9 9-4.03 8.9-9 8.9Zm4.93-6.65c-.27-.14-1.6-.79-1.85-.88-.25-.09-.43-.14-.61.14-.18.27-.7.88-.86 1.06-.16.18-.32.2-.59.07-1.59-.79-2.63-1.41-3.68-3.2-.28-.48.28-.45.8-1.5.09-.18.04-.34-.05-.48-.09-.14-.61-1.47-.84-2.01-.22-.53-.45-.46-.61-.47-.16-.01-.34-.01-.52-.01-.18 0-.46.07-.7.34-.25.27-.95.93-.95 2.26 0 1.33.97 2.62 1.11 2.8.14.18 1.9 2.9 4.66 3.95 2.32.87 2.79.7 3.3.59.5-.11 1.6-.65 1.83-1.28.23-.63.23-1.17.16-1.28-.07-.11-.25-.18-.52-.32Z"/>
  </svg>`;


function safeHttpUrl(value, fallback = "") {
  const raw = String(value ?? "").trim();
  if (!raw) return fallback;
  try {
    const parsed = new URL(raw, window.location.origin);
    if (parsed.protocol === "http:" || parsed.protocol === "https:") {
      return parsed.href;
    }
  } catch (e) {
    // ignore invalid URL
  }
  return fallback;
}

function cardFeaturedHtml(auto) {
  const esVendido = auto.vendido?.toUpperCase() === "SI";
  const esReservado = auto.reservado?.toUpperCase() === "SI";
  const precioLimpio = String(auto.precio || "0").replace(/\D/g, "");
  const slugEncoded = encodeURIComponent(String(auto.slug || "").trim());
  const marca = escapeHtml(auto.marca);
  const modelo = escapeHtml(auto.modelo);
  const anio = escapeHtml(auto.año);
  const ubicacion = escapeHtml(auto.ubicacion || "");
  const kmRaw = String(auto.km ?? "").trim();
  const kmNum = Number(kmRaw.replace(/\D/g, ""));
  const km = kmRaw === "" ? "" : `${kmNum.toLocaleString("es-AR")} km`;
  const imagenPrincipal = safeHttpUrl(
    auto.imagen ? auto.imagen.split(",")[0].trim() : "",
    ""
  );
  const soldClass = esVendido ? " vehicle-card--sold" : "";

  return `
    <div onclick="irAuto('${slugEncoded}')"
      class="vehicle-card vehicle-card--featured${soldClass}">

      <div class="vehicle-card__media">
        <img src="${imagenPrincipal}"
          alt="${marca} ${modelo} ${anio} en Paraná"
          class="vehicle-card__img">

        <span class="vehicle-card__badge vehicle-card__badge--featured">Destacado</span>

        <span class="vehicle-card__location">📍 ${ubicacion}</span>

        ${esVendido ? svgVendido : ""}
        ${!esVendido && esReservado ? svgReservado : ""}
      </div>

      <div class="vehicle-card__body">
        <h3 class="vehicle-card__title">${marca} ${modelo}</h3>
        <p class="vehicle-card__meta">${anio}${km !== "" ? ` · ${km}` : ""}</p>
        <p class="vehicle-card__price vehicle-card__price--featured precio-dest">
          $${Number(precioLimpio).toLocaleString("es-AR")}
        </p>
      </div>
    </div>
  `;
}

function cardListingHtml(auto) {
  const esDestacado = auto.destacado?.toUpperCase() === "SI";
  const esVendido = auto.vendido?.toUpperCase() === "SI";
  const esReservado = auto.reservado?.toUpperCase() === "SI";
  const precioLimpio = String(auto.precio || "0").replace(/\D/g, "");
  const slugEncoded = encodeURIComponent(String(auto.slug || "").trim());
  const marca = escapeHtml(auto.marca);
  const modelo = escapeHtml(auto.modelo);
  const anio = escapeHtml(auto.año);
  const ubicacion = escapeHtml(auto.ubicacion || "");
  const kmRaw = String(auto.km ?? "").trim();
  const kmNum = Number(kmRaw.replace(/\D/g, ""));
  const km = kmRaw === "" ? "" : `${kmNum.toLocaleString("es-AR")} km`;
  const imagenPrincipal = safeHttpUrl(
    auto.imagen ? auto.imagen.split(",")[0].trim() : "",
    ""
  );
  const soldClass = esVendido ? " vehicle-card--sold" : "";

  return `
    <div onclick="irAuto('${slugEncoded}')"
      class="vehicle-card vehicle-card--listing${soldClass}">

      <div class="vehicle-card__media">
        <img src="${imagenPrincipal}"
          alt="${marca} ${modelo} ${anio} en Paraná"
          class="vehicle-card__img">

        ${esDestacado ? `<span class="vehicle-card__badge vehicle-card__badge--featured">★</span>` : ""}

        <span class="vehicle-card__location">📍 ${ubicacion}</span>

        ${esVendido ? svgVendido : ""}
        ${!esVendido && esReservado ? svgReservado : ""}
      </div>

      <div class="vehicle-card__body">
        <h3 class="vehicle-card__title">${marca} ${modelo}</h3>
        <p class="vehicle-card__meta">${anio}${km !== "" ? ` · ${km}` : ""}</p>
        <p class="vehicle-card__price">
          $${Number(precioLimpio).toLocaleString("es-AR")}
        </p>
      </div>
    </div>
  `;
}

// 👉 ORDEN DE DESTACADOS (prioridad fija primero, resto al azar)
function ordenarDestacados(lista) {
  const conPrioridad = lista
    .filter(a => Number(a.prioridad) > 0)
    .sort((a, b) => Number(b.prioridad) - Number(a.prioridad));

  const sinPrioridad = lista.filter(a => !(Number(a.prioridad) > 0));

  // Mezclar al azar (Fisher-Yates)
  for (let i = sinPrioridad.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [sinPrioridad[i], sinPrioridad[j]] = [sinPrioridad[j], sinPrioridad[i]];
  }

  return [...conPrioridad, ...sinPrioridad];
}

// 👉 VENCIMIENTO
function estaVencido(auto) {
  const esIntermediario = String(auto.intermediario || "").trim().toUpperCase() === "SI";
  if (esIntermediario) return false;

  if (!auto.fecha_inicio || !auto.dias) return false;

  const hoy = new Date();
  const inicio = new Date(auto.fecha_inicio);
  const dias = parseInt(auto.dias);

  const vencimiento = new Date(inicio);
  vencimiento.setDate(vencimiento.getDate() + dias);

  return hoy > vencimiento;
}

// 👉 DESTACADO VIGENTE
function destacadoVigente(auto) {
  if (String(auto.destacado || "").trim().toUpperCase() !== "SI") return false;

  if (auto.destacado_hasta) {
    const hoy = new Date();
    const hasta = new Date(auto.destacado_hasta);
    return hoy <= hasta;
  }

  return !estaVencido(auto);
}

// 👉 DETECTAR PÁGINA
const pagina = window.location.pathname.toLowerCase();
const archivoActual = pagina.split("/").pop() || "index.html";

let tipoActual = "auto";

if (archivoActual === "motos.html") tipoActual = "moto";
if (archivoActual === "utilitarios.html") tipoActual = "utilitario";
if (archivoActual === "camionetas.html") tipoActual = "camioneta";
if (archivoActual === "autos.html") tipoActual = "auto";

// 👉 SVG
const svgVendido = `
<svg viewBox="0 0 200 200" class="absolute top-0 right-0 w-32 h-32 pointer-events-none">
  <g transform="rotate(45 150 50)">
    <rect x="60" y="30" width="200" height="30" fill="rgba(220,38,38,0.85)" />
    <text x="150" y="48" text-anchor="middle" fill="white" font-size="16" font-weight="bold">V E N D I D O</text>
  </g>
</svg>
`;

const svgReservado = `
<svg viewBox="0 0 200 200" class="absolute top-0 right-0 w-32 h-32 pointer-events-none">
  <g transform="rotate(45 150 50)">
    <rect x="60" y="30" width="200" height="30" fill="rgb(169, 85, 247)" />
    <text x="150" y="48" text-anchor="middle" fill="white" font-size="14">R E S E R V A D O</text>
  </g>
</svg>
`;

// 👉 FETCH
db.from("autos").select("*").then(({ data, error }) => {
  if (error) { console.error("Error cargando autos:", error); return; }
    autos = data;

    if (document.getElementById("destacados")) {
      const destacados = autos.filter(a => destacadoVigente(a));
      mostrarDestacados(ordenarDestacados(destacados));
    }

    mostrarDestacadosPorTipo(autos, "auto", "autos-destacados");
    mostrarDestacadosPorTipo(autos, "moto", "motos-destacados");
    mostrarDestacadosPorTipo(autos, "camioneta", "camionetas-destacados");
    mostrarDestacadosPorTipo(autos, "utilitario", "utilitarios-destacados");

    if (document.getElementById("autos-container")) {
      aplicarFiltrosCatalogo();
    }
  });

function mostrarDestacados(lista) {
  const cont = document.getElementById("destacados");
  if (!cont) return;

  cont.innerHTML = "";
  lista.forEach(auto => {
    cont.innerHTML += cardFeaturedHtml(auto);
  });
}

function mostrarDestacadosPorTipo(lista, tipo, contenedorId) {
  const cont = document.getElementById(contenedorId);
  if (!cont) return;

  cont.innerHTML = "";

  const filtrados = lista.filter(auto => {
    if (!auto.tipo) return false;

    const tipos = auto.tipo.toLowerCase().split(",").map(t => t.trim());

    return tipos.includes(tipo) &&
           destacadoVigente(auto) &&
           !estaVencido(auto);
  });

  ordenarDestacados(filtrados).slice(0, 6).forEach(auto => {
    cont.innerHTML += cardFeaturedHtml(auto);
  });
}

// ── Leer valor del input activo (mobile o desktop) ──
function leerFiltro(idMobile, idDesktop) {
  const m = document.getElementById(idMobile);
  const d = document.getElementById(idDesktop);
  if (m && m.value.trim() !== "") return m.value.trim();
  if (d && d.value.trim() !== "") return d.value.trim();
  return "";
}

// 🔍 FILTROS DE CATÁLOGO (precio, año, km, texto)
function aplicarFiltrosCatalogo() {
  const texto    = (document.getElementById("buscador")?.value || "").toLowerCase().trim();
  const precioMin = parseFloat(leerFiltro("precio-min", "precio-min-d"));
  const precioMax = parseFloat(leerFiltro("precio-max", "precio-max-d"));
  const anioMin   = parseInt(leerFiltro("anio-min",  "anio-min-d"));
  const anioMax   = parseInt(leerFiltro("anio-max",  "anio-max-d"));
  const kmMax     = parseFloat(leerFiltro("km-max",   "km-max-d"));

  const filtrados = autos.filter(auto => {
    if (!auto.tipo) return false;
    const tipos = auto.tipo.toLowerCase().split(",").map(t => t.trim());
    if (!tipos.includes(tipoActual)) return false;
    if (estaVencido(auto)) return false;

    if (texto) {
      const matchTexto =
        (auto.marca || "").toLowerCase().includes(texto) ||
        (auto.modelo || "").toLowerCase().includes(texto) ||
        String(auto.año || "").includes(texto) ||
        (auto.ubicacion || "").toLowerCase().includes(texto);
      if (!matchTexto) return false;
    }

    const precio = Number(String(auto.precio || "0").replace(/\D/g, "")) || 0;
    if (!isNaN(precioMin) && precio < precioMin) return false;
    if (!isNaN(precioMax) && precio > precioMax) return false;

    const anio = parseInt(auto.año) || 0;
    if (!isNaN(anioMin) && anio < anioMin) return false;
    if (!isNaN(anioMax) && anio > anioMax) return false;

    const km = Number(String(auto.km || "0").replace(/\D/g, "")) || 0;
    if (!isNaN(kmMax) && km > kmMax) return false;

    return true;
  });

  mostrarAutos(filtrados);
}

function mostrarAutos(lista) {
  const cont = document.getElementById("autos-container");
  if (!cont) return;

  cont.innerHTML = "";

  lista.forEach(auto => {
    if (estaVencido(auto)) return;
    cont.innerHTML += cardListingHtml(auto);
  });
}

// 🔍 BUSCADOR Y FILTROS
const buscador = document.getElementById("buscador");

if (document.getElementById("autos-container")) {
  const btnToggle = document.getElementById("btn-toggle-filtros");
  const panel     = document.getElementById("filtros-panel");
  const badge     = document.getElementById("badge-filtros");

  // ── Toggle panel en mobile ──
  if (btnToggle && panel) {
    btnToggle.addEventListener("click", () => {
      const abierto = !panel.hasAttribute("hidden");
      if (abierto) {
        panel.setAttribute("hidden", "");
        btnToggle.setAttribute("aria-expanded", "false");
      } else {
        panel.removeAttribute("hidden");
        btnToggle.setAttribute("aria-expanded", "true");
      }
    });
  }

  // ── Inputs de filtro ──
  const filtroIds = ["precio-min", "precio-max", "anio-min", "anio-max", "km-max"];

  filtroIds.forEach(id => {
    const el = document.getElementById(id);
    if (el) el.addEventListener("input", () => { actualizarBadge(); aplicarFiltrosCatalogo(); });
  });

  if (buscador) buscador.addEventListener("input", () => { actualizarBadge(); aplicarFiltrosCatalogo(); });

  // ── Limpiar ──
  const btnLimpiar = document.getElementById("btn-limpiar-filtros");
  if (btnLimpiar) {
    btnLimpiar.addEventListener("click", () => {
      filtroIds.forEach(id => { const el = document.getElementById(id); if (el) el.value = ""; });
      if (buscador) buscador.value = "";
      actualizarBadge();
      aplicarFiltrosCatalogo();
    });
  }

  // ── Badge de filtros activos ──
  function actualizarBadge() {
    if (!badge) return;
    const activos = filtroIds.filter(id => {
      const el = document.getElementById(id);
      return el && el.value.trim() !== "";
    }).length + (buscador && buscador.value.trim() !== "" ? 1 : 0);
    if (activos > 0) { badge.textContent = activos; badge.classList.remove("hidden"); }
    else              { badge.classList.add("hidden"); }
  }

} else if (buscador) {
  // Página de inicio: filtra los destacados por texto
  buscador.addEventListener("input", (e) => {

    const texto = e.target.value.toLowerCase().trim();

    let filtrados = autos.filter(auto =>
      (auto.marca || "").toLowerCase().includes(texto) ||
      (auto.modelo || "").toLowerCase().includes(texto) ||
      String(auto.año || "").includes(texto) ||
      (auto.ubicacion || "").toLowerCase().includes(texto)
    );

    filtrados = filtrados.filter(auto => !estaVencido(auto));

    if (texto === "") {
      mostrarDestacadosPorTipo(autos, "auto", "autos-destacados");
      mostrarDestacadosPorTipo(autos, "moto", "motos-destacados");
      mostrarDestacadosPorTipo(autos, "camioneta", "camionetas-destacados");
      mostrarDestacadosPorTipo(autos, "utilitario", "utilitarios-destacados");
      return;
    }

    mostrarDestacadosPorTipo(filtrados, "auto", "autos-destacados");
    mostrarDestacadosPorTipo(filtrados, "moto", "motos-destacados");
    mostrarDestacadosPorTipo(filtrados, "camioneta", "camionetas-destacados");
    mostrarDestacadosPorTipo(filtrados, "utilitario", "utilitarios-destacados");

  });
}

function irAuto(slug) {
  window.location.href = "auto.html?slug=" + slug;
}

document.addEventListener("DOMContentLoaded", () => {
  initPwaInstallInMenu();
  registerServiceWorker();

  const slides = document.querySelectorAll("#hero-slider img");
  let index = 0;

  if (slides.length > 0) {
    setInterval(() => {
      slides[index].classList.replace("opacity-100", "opacity-0");
      index = (index + 1) % slides.length;
      slides[index].classList.replace("opacity-0", "opacity-100");
    }, 4000);
  }

  const popup = document.getElementById("popup-publicidad");
  const cerrar = document.getElementById("cerrarPopup");

  if (popup && cerrar) {
    const TIEMPO_ESPERA = 5 * 60 * 1000;
    const ultimaVez = localStorage.getItem("popupTime");
    const ahora = new Date().getTime();

    if (!ultimaVez || (ahora - ultimaVez) > TIEMPO_ESPERA) {
      setTimeout(() => {
        popup.style.display = "flex";
      }, 1000);
    }

    cerrar.addEventListener("click", () => {
      popup.style.display = "none";
      localStorage.setItem("popupTime", ahora);
    });

    popup.addEventListener("click", (e) => {
      if (e.target === popup) {
        popup.style.display = "none";
        localStorage.setItem("popupTime", ahora);
      }
    });
  }
});