const URL = "https://opensheet.elk.sh/1xmNwDMZRT9z0Zhl0eOUjrk2PLzYoN3ALUX55fMNFpz4/autos";

let autos = [];

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
      <div onclick="irAuto(${auto.id})"
        class="bg-black border border-yellow-500 rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition">

        <div class="relative">
          <img src="${auto.imagen}" class="w-full h-72 object-cover">

          ${esVendido ? svgVendido : ""}
          ${!esVendido && esReservado ? svgReservado : ""}
        </div>

        <div class="p-5 text-center">
          <h3 class="text-white text-xl font-bold">${auto.marca} ${auto.modelo}</h3>
          <p class="text-2xl text-white">${auto.año}</p>
          <p class="text-3xl text-yellow-400 font-bold">$${auto.precio}</p>
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

    const esDestacado = auto.destacado?.toUpperCase() === "SI";
    const esVendido = auto.vendido?.toUpperCase() === "SI";
    const esReservado = auto.reservado?.toUpperCase() === "SI";

    cont.innerHTML += `
      <div onclick="irAuto(${auto.id})"
        class="bg-white text-black border border-blue-500 rounded-lg shadow cursor-pointer hover:scale-105 hover:shadow-lg transition max-w-sm mx-auto w-full ${esVendido ? 'opacity-60' : ''}">

        <div class="relative">

          <img src="${auto.imagen}" class="w-full h-48 object-cover rounded-t-lg">

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
          <p class="text-blue-600 font-bold text-2xl">$${auto.precio}</p>
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
      auto.año.toString().includes(texto)
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
function irAuto(id) {
  window.location.href = "auto.html?id=" + id;
}

// 👉 MENU HAMBURGUESA
const btn = document.getElementById("menuBtn");
const menu = document.getElementById("menu");

if (btn && menu) {
  btn.addEventListener("click", () => {
    menu.classList.toggle("active");
  });
}