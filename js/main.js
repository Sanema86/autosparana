const URL = "https://opensheet.elk.sh/1xmNwDMZRT9z0Zhl0eOUjrk2PLzYoN3ALUX55fMNFpz4/autos";

let autos = [];

function estaVencido(auto) {

  const esIntermediario = String(auto.intermediario || "")
    .trim()
    .toUpperCase() === "SI";

  // 👉 SI sos intermediario → nunca vence
  if (esIntermediario) return false;

  // 👉 si no tiene datos → no vence
  if (!auto.fecha_inicio || !auto.dias) return false;

  const hoy = new Date();
  const inicio = new Date(auto.fecha_inicio);

  const dias = parseInt(auto.dias);

  const vencimiento = new Date(inicio);
  vencimiento.setDate(vencimiento.getDate() + dias);

  return hoy > vencimiento;
}

// 👉 Detectar página
const pagina = window.location.pathname.toLowerCase();

let tipoActual = "auto";

if (pagina.includes("motos")) tipoActual = "moto";
if (pagina.includes("utilitarios")) tipoActual = "utilitario";
if (pagina.includes("camionetas")) tipoActual = "camioneta";
if (pagina.includes("autos")) tipoActual = "auto";

// 👉 SVG VENDIDO
const svgVendido = `
<svg viewBox="0 0 200 200" class="absolute top-0 right-0 w-32 h-32 pointer-events-none">
  <g transform="rotate(45 150 50)">
    <rect x="60" y="30" width="200" height="30"
      fill="rgba(220,38,38,0.85)" />
    <text x="150" y="48"
      text-anchor="middle"
      fill="white"
      font-size="16"
      font-weight="bold"
      dominant-baseline="middle">
      V E N D I D O
    </text>
  </g>
</svg>
`;

// 👉 SVG RESERVADO
const svgReservado = `
<svg viewBox="0 0 200 200" class="absolute top-0 right-0 w-32 h-32 pointer-events-none">
  <g transform="rotate(45 150 50)">
    <rect x="60" y="30" width="200" height="30"
      fill="rgb(169, 85, 247)" />
    <text x="150" y="48"
      text-anchor="middle"
      fill="white"
      font-size="14"
      font-weight="quick"
      dominant-baseline="middle">
      R E S E R V A D O
    </text>
  </g>
</svg>
`;

// 👉 FETCH
fetch(URL)
  .then(res => res.json())
  .then(data => {
    autos = data;

    // 🔥 DESTACADOS (inicio)
    if (document.getElementById("destacados")) {
      const destacados = autos.filter(a => a.destacado?.toUpperCase() === "SI");
      mostrarDestacados(destacados);
    }

    // 🚗 SECCIONES
    if (document.getElementById("autos-container")) {

      const filtrados = autos.filter(auto => {
        if (!auto.tipo) return false;

        const tipos = auto.tipo
          .toLowerCase()
          .split(",")
          .map(t => t.trim());

        return tipos.includes(tipoActual);
      });

      mostrarAutos(filtrados);
    }
  });

// 🔥 DESTACADOS
function mostrarDestacados(lista) {
  const cont = document.getElementById("destacados");
  cont.innerHTML = "";

  lista.forEach(auto => {

    const esVendido = auto.vendido?.toUpperCase() === "SI";
    const esReservado = auto.reservado?.toUpperCase() === "SI";

   cont.innerHTML += `
  <div onclick="irAuto('${auto.slug}')"
    class="bg-black border border-yellow-500 rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition">

    <div class="relative">
      <img src="${auto.imagen}" class="w-full h-72 object-cover">
      <div class="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
  📍 ${auto.ubicacion || ""}
</div>

      ${esVendido ? svgVendido : ""}
      ${!esVendido && esReservado ? svgReservado : ""}
    </div>

    <div class="p-5 text-center">
      <h3 class="text-white text-xl font-bold">${auto.marca} ${auto.modelo}</h3>
      <p class="text-2xl text-white">${auto.año}</p>
      <p class="text-3xl text-yellow-400 font-bold">$${Number(auto.precio).toLocaleString("es-AR")}</p>
    </div>

  </div>
`;
    });
}

// 🚗 TODAS LAS SECCIONES
function mostrarAutos(lista) {
  const cont = document.getElementById("autos-container");
  cont.innerHTML = "";

  lista.forEach(auto => {

      if (estaVencido(auto)) return;

    const esDestacado = auto.destacado?.toUpperCase() === "SI";
    const esVendido = auto.vendido?.toUpperCase() === "SI";
    const esReservado = auto.reservado?.toUpperCase() === "SI";

    cont.innerHTML += `
      <div onclick="irAuto('${auto.slug}')"
        class="bg-white text-black border border-blue-500 rounded-lg shadow cursor-pointer hover:scale-105 hover:shadow-lg transition max-w-sm mx-auto w-full ${esVendido ? 'opacity-60' : ''}">

        <div class="relative">

          <img src="${auto.imagen}" class="w-full h-48 object-cover rounded-t-lg">
          <div class="absolute bottom-2 left-2 bg-black/70 text-white text-xs px-2 py-1 rounded">
  📍 ${auto.ubicacion || ""}
</div>

          ${esDestacado ? `
            <div class="absolute top-2 left-2 bg-yellow-400 text-black px-2 py-1 rounded text-xs font-bold">
              ⭐
            </div>
          ` : ""}

          ${esVendido ? svgVendido : ""}
          ${!esVendido && esReservado ? svgReservado : ""}

        </div>

        <div class="p-4 text-center">
          <h3 class="font-bold">${auto.marca} ${auto.modelo}</h3>
          <p>${auto.año}</p>
          <p class="text-blue-600 font-bold text-2xl">$${Number(auto.precio).toLocaleString("es-AR")}</p>
        </div>

      </div>
    `;
  });
}

// 🔍 BUSCADOR
const buscador = document.getElementById("buscador");

if (buscador) {
  buscador.addEventListener("input", (e) => {
    const texto = e.target.value.toLowerCase();

    const filtrados = autos.filter(auto =>
      auto.marca.toLowerCase().includes(texto) ||
      auto.modelo.toLowerCase().includes(texto) ||
      auto.año.toString().includes(texto) ||
      auto.ubicacion.toLowerCase().includes(texto)
    );

    if (document.getElementById("destacados")) {
      const destacados = filtrados.filter(a => a.destacado?.toUpperCase() === "SI");
      mostrarDestacados(destacados);
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

// 👉 IR A DETALLE
function irAuto(slug) {
  window.location.href = "auto.html?slug=" + slug;
}

// 👉 MENU HAMBURGUESA
const btn = document.getElementById("menuBtn");
const menu = document.getElementById("menu");

if (btn && menu) {
  btn.addEventListener("click", () => {
    menu.classList.toggle("active");
  });
}

// 👉 HERO SLIDER AUTOMÁTICO
const slides = document.querySelectorAll("#hero-slider img");
let index = 0;

setInterval(() => {
  slides[index].classList.remove("opacity-100");
  slides[index].classList.add("opacity-0");

  index = (index + 1) % slides.length;

  slides[index].classList.remove("opacity-0");
  slides[index].classList.add("opacity-100");

}, 4000);