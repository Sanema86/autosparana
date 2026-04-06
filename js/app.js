const URL = "https://opensheet.elk.sh/1xmNwDMZRT9z0Zhl0eOUjrk2PLzYoN3ALUX55fMNFpz4/autos";

let autos = [];

fetch(URL)
  .then(res => res.json())
  .then(data => {
    autos = data;

    if (document.getElementById("destacados")) {
      mostrarDestacados(autos.filter(a => a.destacado?.toUpperCase() === "SI"));
    }

    if (document.getElementById("autos-container")) {
      mostrarAutos(autos);
    }
  });


// 🔥 DESTACADOS
function mostrarDestacados(lista) {
  const cont = document.getElementById("destacados");
  cont.innerHTML = "";

  
  lista.forEach(auto => {
    cont.innerHTML += `
      <div onclick="irAuto(${auto.id})"
           class="bg-black border border-yellow-500 rounded-xl overflow-hidden cursor-pointer hover:scale-105 transition">

        <img src="${auto.imagen}" class="w-full h-72 object-cover">

        <div class="p-5">
          <h3>${auto.marca} ${auto.modelo}</h3>
          <p>${auto.año}</p>
          <p class="text-blue-400 font-bold">$${auto.precio}</p>
        </div>

      </div>
    `;
  });
}

// 🚗 TODOS LOS AUTOS
function mostrarAutos(lista) {
  const cont = document.getElementById("autos-container");
  cont.innerHTML = "";

  lista.forEach(auto => {
    cont.innerHTML += `
      <div onclick="irAuto(${auto.id})"
           class="bg-white text-black border border-blue-500 rounded-lg shadow cursor-pointer hover:shadow-lg transition max-w-sm mx-auto w-full">

        <img src="${auto.imagen}" class="w-full h-48 object-cover rounded-t-lg">

        <div class="p-4">
          <h3>${auto.marca} ${auto.modelo}</h3>
          <h3>${auto.año}</h3>
          <p class="text-blue-600 font-bold">$${auto.precio}</p>
        </div>

      </div>
    `;
  });
}


// 🔍 BUSCADOR GLOBAL (IMPORTANTE)
const buscador = document.getElementById("buscador");

if (buscador) {
  buscador.addEventListener("input", (e) => {
    const texto = e.target.value.toLowerCase();

    const filtrados = autos.filter(auto =>
      auto.marca.toLowerCase().includes(texto) ||
      auto.modelo.toLowerCase().includes(texto) ||
      auto.año.toString().includes(texto)
    );

    // 👇 detecta qué sección existe en la página
    if (document.getElementById("destacados")) {
      // estamos en INICIO
      const destacados = filtrados.filter(a => a.destacado);
      mostrarDestacados(destacados);
    }

    if (document.getElementById("autos-container")) {
      // estamos en AUTOS
      mostrarAutos(filtrados);
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

btn.addEventListener("click", () => {
  menu.classList.toggle("active");
});
