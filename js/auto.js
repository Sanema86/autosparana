const URL = "https://opensheet.elk.sh/1xmNwDMZRT9z0Zhl0eOUjrk2PLzYoN3ALUX55fMNFpz4/autos";

// Obtener ID desde la URL
const params = new URLSearchParams(window.location.search);
const id = params.get("id");

// Traer autos
fetch(URL)
  .then(res => res.json())
  .then(data => {
    const auto = data.find(a => a.id == id);

    if (!auto) {
      document.body.innerHTML = "<h2 style='color:white;text-align:center;'>Auto no encontrado</h2>";
      return;
    }

    mostrarAuto(auto);
  });

function mostrarAuto(auto) {
const esDestacado = auto.destacado?.toUpperCase() === "SI";

  const cont = document.getElementById("detalle-auto");


  const imagenes = auto.imagen
    ? auto.imagen.split(",").map(img => img.trim())
    : [];

  let current = 0;

  cont.innerHTML = `
    <div class="max-w-5xl mx-auto bg-gray-800 text-white p-6 rounded-2xl shadow-2xl">

      <!-- CARRUSEL -->
    <div class="relative">

  ${esDestacado ? `
    <div class="absolute top-3 left-3 bg-gray-600 text-black px-4 py-1 rounded-lg font-bold shadow-lg z-10">
      ⭐ Destacado
    </div>
    
  ` : ""}
        <img id="img-principal" src="${imagenes[0]}" class="w-full h-96 object-cover rounded-lg mb-6">

        ${imagenes.length > 1 ? `
          <button onclick="prev()" class="absolute left-2 top-1/2 bg-black/40 px-5 py-2 rounded text-[50px]">‹</button>
          <button onclick="next()" class="absolute right-2 top-1/2 bg-black/40 px-5 py-2 rounded text-[50px]">›</button>
        ` : ""}
      </div>

      <!-- INFO -->
      <h1 class="text-3xl font-bold mb-2">${auto.marca} ${auto.modelo}</h1>
      <p class="text-lg mb-2">Año: ${auto.año}</p>
      <p class="text-lg mb-2">KM: ${auto.km}</p>
      <p class="text-lg mb-2">Combustible: ${auto.combustible}</p>

      <p class="text-2xl text-blue-400 font-bold mb-4">$${auto.precio}</p>

      <p class="mt-4">${auto.descripcion || "Sin descripción"}</p>

      <!-- WHATSAPP -->
      <a href="https://wa.me/549XXXXXXXXXX?text=Hola%20me%20interesa%20el%20${auto.marca}%20${auto.modelo}"
         class="block mt-6 bg-green-500 text-white text-center py-4 rounded-lg font-bold text-lg hover:bg-green-600">
         Consultar por WhatsApp
      </a>

    </div>
  `;

  // 👉 FUNCIONES DEL CARRUSEL
  window.next = function() {
    current = (current + 1) % imagenes.length;
    document.getElementById("img-principal").src = imagenes[current];
  };

  window.prev = function() {
    current = (current - 1 + imagenes.length) % imagenes.length;
    document.getElementById("img-principal").src = imagenes[current];
  };
}