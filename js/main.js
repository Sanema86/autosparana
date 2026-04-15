const API_URL_MAIN = "https://opensheet.elk.sh/1xmNwDMZRT9z0Zhl0eOUjrk2PLzYoN3ALUX55fMNFpz4/autos";

let autos = [];

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

// 👉 DETECTAR PÁGINA (por archivo exacto, evita falsos positivos en rutas locales)
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
fetch(API_URL_MAIN)
  .then(res => res.json())
  .then(data => {
    autos = data;

    // 🔥 DESTACADOS GENERALES
    if (document.getElementById("destacados")) {
      const destacados = autos.filter(a => a.destacado?.toUpperCase() === "SI");
      mostrarDestacados(destacados);
    }

    // 🔥 DESTACADOS POR CATEGORÍA
    mostrarDestacadosPorTipo(autos, "auto", "autos-destacados");
    mostrarDestacadosPorTipo(autos, "moto", "motos-destacados");
    mostrarDestacadosPorTipo(autos, "camioneta", "camionetas-destacados");
    mostrarDestacadosPorTipo(autos, "utilitario", "utilitarios-destacados");

    // 🚗 LISTADO
    if (document.getElementById("autos-container")) {
      const filtrados = autos.filter(auto => {
        if (!auto.tipo) return false;

        const tipos = auto.tipo.toLowerCase().split(",").map(t => t.trim());
        return tipos.includes(tipoActual);
      });

      mostrarAutos(filtrados);
    }
  });

// 🔥 DESTACADOS PRINCIPALES
function mostrarDestacados(lista) {
  const cont = document.getElementById("destacados");
  if (!cont) return;

  cont.innerHTML = "";

  lista.forEach(auto => {

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

    cont.innerHTML += `
      <div onclick="irAuto('${slugEncoded}')"
        class="bg-black border border-yellow-500 rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition">

        <div class="relative">
          <img src="${imagenPrincipal}" 
     alt="${marca} ${modelo} ${anio} en Paraná"
     class="w-full h-50 object-cover">

          <div class="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            📍 ${ubicacion}
          </div>

          ${esVendido ? svgVendido : ""}
          ${!esVendido && esReservado ? svgReservado : ""}
        </div>

        <div class="p-5 text-center">
          <h3 class="text-white text-xl font-bold">${marca} ${modelo}</h3>
          <p class="text-2xl text-white">${anio}</p>
          <p class="text-3xl text-yellow-400 font-bold">
            $${Number(precioLimpio).toLocaleString("es-AR")}
          </p>
        </div>
      </div>
    `;
  });
}

// 🔥 DESTACADOS POR TIPO (MISMO ESTILO)
function mostrarDestacadosPorTipo(lista, tipo, contenedorId) {

  const cont = document.getElementById(contenedorId);
  if (!cont) return;

  cont.innerHTML = "";

  const filtrados = lista.filter(auto => {
    if (!auto.tipo) return false;

    const tipos = auto.tipo.toLowerCase().split(",").map(t => t.trim());

    return tipos.includes(tipo) &&
           auto.destacado?.toUpperCase() === "SI" &&
           !estaVencido(auto);
  });

  filtrados.slice(0, 6).forEach(auto => {

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

    cont.innerHTML += `
      <div onclick="irAuto('${slugEncoded}')"
        class="bg-black border border-yellow-500 rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition">

        <div class="relative">
          <img src="${imagenPrincipal}" class="w-full h-30 object-cover">

          <div class="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            📍 ${ubicacion}
          </div>

          ${esVendido ? svgVendido : ""}
          ${!esVendido && esReservado ? svgReservado : ""}
        </div>

        <div class="p-5 text-center">
          <h3 class="text-white text-1xl font-bold">${marca} ${modelo}</h3>
          <p class="text-2xl text-white">${anio}</p>
          <p class="precio-dest text-2xl text-yellow-400 font-bold">
            $${Number(precioLimpio).toLocaleString("es-AR")}
          </p>
        </div>
      </div>
    `;
  });
}

// 🚗 LISTADO
function mostrarAutos(lista) {
  const cont = document.getElementById("autos-container");
  if (!cont) return;

  cont.innerHTML = "";

  lista.forEach(auto => {

    if (estaVencido(auto)) return;

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

    cont.innerHTML += `
      <div onclick="irAuto('${slugEncoded}')"
        class="bg-white text-black border border-blue-500 rounded-lg shadow cursor-pointer hover:scale-105 transition max-w-sm mx-auto w-full ${esVendido ? 'opacity-60' : ''}">

        <div class="relative">

          <img src="${imagenPrincipal}" 
     alt="${marca} ${modelo} ${anio} 
     en Paraná" class="w-full h-35 object-cover rounded-t-lg">

          <div class="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
            📍 ${ubicacion}
          </div>

          ${esDestacado ? `<div class="absolute top-2 left-2 bg-yellow-400 text-black px-2 py-1 rounded text-xs font-bold">⭐</div>` : ""}

          ${esVendido ? svgVendido : ""}
          ${!esVendido && esReservado ? svgReservado : ""}

        </div>

        <div class="p-4 text-center">
          <h3 class="font-bold text-[1rem]">${marca} ${modelo}</h3>
          <p>${anio}</p>
          <p class="text-blue-600 font-bold text-[1.2rem]">
            $${Number(precioLimpio).toLocaleString("es-AR")}
          </p>
        </div>

      </div>
    `;
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

    // 🟡 👉 DETECTAR INDEX
    const esIndex =
      document.getElementById("autos-destacados") ||
      document.getElementById("motos-destacados") ||
      document.getElementById("camionetas-destacados") ||
      document.getElementById("utilitarios-destacados");

    if (esIndex) {

      // 👉 SI BORRA EL TEXTO → RESTAURAR
      if (texto === "") {
        mostrarDestacadosPorTipo(autos, "auto", "autos-destacados");
        mostrarDestacadosPorTipo(autos, "moto", "motos-destacados");
        mostrarDestacadosPorTipo(autos, "camioneta", "camionetas-destacados");
        mostrarDestacadosPorTipo(autos, "utilitario", "utilitarios-destacados");
        return;
      }

      // 👉 FILTRAR TODAS LAS SECCIONES
      mostrarDestacadosPorTipo(filtrados, "auto", "autos-destacados");
      mostrarDestacadosPorTipo(filtrados, "moto", "motos-destacados");
      mostrarDestacadosPorTipo(filtrados, "camioneta", "camionetas-destacados");
      mostrarDestacadosPorTipo(filtrados, "utilitario", "utilitarios-destacados");

      return;
    }

    // 🔵 👉 OTRAS PÁGINAS
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

// 👉 IR
function irAuto(slug) {
  window.location.href = "auto.html?slug=" + slug;
}

document.addEventListener("DOMContentLoaded", () => {
  // 👉 SLIDER (Solo si existe)
const slides = document.querySelectorAll("#hero-slider img");
let index = 0;

if (slides.length > 0) {
  setInterval(() => {
    slides[index].classList.replace("opacity-100", "opacity-0");
    index = (index + 1) % slides.length;
    slides[index].classList.replace("opacity-0", "opacity-100");
  }, 4000);
}
  
  // 👉 MENU HAMBURGUESA
  const btn = document.getElementById("menuBtn");
  const menu = document.getElementById("menu");

  if (btn && menu) {
    btn.addEventListener("click", () => {
      menu.classList.toggle("active");
    });
  }

  // 👉 POPUP (Con seguridad para que no de error si no existe)
  const popup = document.getElementById("popup-publicidad");
  const cerrar = document.getElementById("cerrarPopup");

  if (popup && cerrar) {
    const TIEMPO_ESPERA = 5 * 60 * 1000; // 5 minutos
    const ultimaVez = localStorage.getItem("popupTime");
    const ahora = new Date().getTime();

    // 👉 Mostrar o reset 5 minutos
    if (!ultimaVez || (ahora - ultimaVez) > TIEMPO_ESPERA) {
      setTimeout(() => {
        popup.style.display = "flex";
      }, 1000);
    }

    // 👉 Cerrar popup
    cerrar.addEventListener("click", () => {
      popup.style.display = "none";
      localStorage.setItem("popupTime", ahora);
    });

    // 👉 Click afuera
    popup.addEventListener("click", (e) => {
      if (e.target === popup) {
        popup.style.display = "none";
        localStorage.setItem("popupTime", ahora);
      }
    });
  }
});


//seccion menu activa
document.addEventListener("DOMContentLoaded", () => {

  const path = window.location.pathname.toLowerCase();
  const archivoMenu = path.split("/").pop() || "index.html";

  const map = [
    { id: "nav-inicio", files: ["", "index.html"] },
    { id: "nav-autos", files: ["autos.html"] },
    { id: "nav-motos", files: ["motos.html"] },
    { id: "nav-camionetas", files: ["camionetas.html"] },
    { id: "nav-utilitarios", files: ["utilitarios.html"] },
    { id: "nav-vender", files: ["vender.html"] }
  ];

  map.forEach(item => {
    const el = document.getElementById(item.id);
    if (!el) return;

    let activo = false;

    if (item.id === "nav-inicio") {
      activo = archivoMenu === "" || archivoMenu === "index.html" || path.endsWith("/");
    } else {
      activo = item.files.includes(archivoMenu);
    }

    if (activo) {
      el.style.color = "#eab308"; // yellow-500
    } else {
      el.style.color = "white";
    }
  });
});
