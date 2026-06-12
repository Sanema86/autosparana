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
        <p class="vehicle-card__meta">${anio}</p>
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
        <p class="vehicle-card__meta">${anio}</p>
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
      const filtrados = autos.filter(auto => {
        if (!auto.tipo) return false;

        const tipos = auto.tipo.toLowerCase().split(",").map(t => t.trim());
        return tipos.includes(tipoActual);
      });

      mostrarAutos(filtrados);
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

function mostrarAutos(lista) {
  const cont = document.getElementById("autos-container");
  if (!cont) return;

  cont.innerHTML = "";

  lista.forEach(auto => {
    if (estaVencido(auto)) return;
    cont.innerHTML += cardListingHtml(auto);
  });
}

// 🔍 BUSCADOR
const buscador = document.getElementById("buscador");

if (buscador) {
  buscador.addEventListener("input", (e) => {

    const texto = e.target.value.toLowerCase().trim();

    let filtrados = autos.filter(auto =>
      (auto.marca || "").toLowerCase().includes(texto) ||
      (auto.modelo || "").toLowerCase().includes(texto) ||
      String(auto.año || "").includes(texto) ||
      (auto.ubicacion || "").toLowerCase().includes(texto)
    );

    filtrados = filtrados.filter(auto => !estaVencido(auto));

    const esIndex =
      document.getElementById("autos-destacados") ||
      document.getElementById("motos-destacados") ||
      document.getElementById("camionetas-destacados") ||
      document.getElementById("utilitarios-destacados");

    if (esIndex) {

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

      return;
    }

    if (document.getElementById("autos-container")) {

      const filtradosTipo = filtrados.filter(auto => {
        if (!auto.tipo) return false;

        const tipos = auto.tipo
          .toLowerCase()
          .split(",")
          .map(t => t.trim());

        return tipos.includes(tipoActual);
      });

      mostrarAutos(filtradosTipo);
    }

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
