const URL = "https://opensheet.elk.sh/1xmNwDMZRT9z0Zhl0eOUjrk2PLzYoN3ALUX55fMNFpz4/autos";

// 👉 CONTADOR DE VISITAS
function sumarVisita(slug) {
  const key = "visitasAutos";
  const vistosKey = "autosVistos";

  let visitas = JSON.parse(localStorage.getItem(key)) || {};
  let vistos = JSON.parse(localStorage.getItem(vistosKey)) || [];

  if (!vistos.includes(slug)) {
    visitas[slug] = (visitas[slug] || 0) + 1;
    vistos.push(slug);

    localStorage.setItem(key, JSON.stringify(visitas));
    localStorage.setItem(vistosKey, JSON.stringify(vistos));
  }

  return visitas[slug] || 1;
}

// 👉 TU NÚMERO
const MI_NUMERO = "5493435311312";

// 👉 SLUG
const params = new URLSearchParams(window.location.search);
const slug = params.get("slug");

// 👉 DATA
fetch(URL)
  .then(res => res.json())
  .then(data => {
    const auto = data.find(a =>
      String(a.slug).trim().toLowerCase() === String(slug).trim().toLowerCase()
    );

    if (!auto) {
      document.getElementById("detalle-auto").innerHTML =
        "<h2 style='color:white;text-align:center;'>Auto no encontrado</h2>";
      return;
    }

    mostrarAuto(auto);
    mostrarSimilares(auto, data);
  });

function mostrarAuto(auto) {

  // 👉 SEO dinámico (no lo tocamos)
  document.title = `${auto.marca} ${auto.modelo} ${auto.año} en Paraná | Autos Paraná`;

  const metaDesc = document.querySelector('meta[name="description"]');
  if (metaDesc) {
    metaDesc.setAttribute("content",
      `Comprá este ${auto.marca} ${auto.modelo} ${auto.año}. KM: ${auto.km}. Precio: $${Number(auto.precio).toLocaleString("es-AR")}`
    );
  }

  // 👉 JSON-LD (igual que vos)
  const script = document.createElement('script');
  script.type = 'application/ld+json';
  script.text = JSON.stringify({
    "@context": "https://schema.org/",
    "@type": "Car",
    "name": `${auto.marca} ${auto.modelo} ${auto.año}`,
    "image": auto.imagen?.split(",")[0],
    "offers": {
      "@type": "Offer",
      "price": auto.precio,
      "priceCurrency": "ARS"
    }
  });
  document.head.appendChild(script);

  const visitas = sumarVisita(auto.slug);

  const telefonoLimpio = String(auto.telefono || "").replace(/\D/g, "").trim();
  const telefonoFinal = telefonoLimpio.length > 8 ? telefonoLimpio : MI_NUMERO;

  const linkWhatsApp =
    `https://wa.me/${telefonoFinal}?text=${encodeURIComponent(window.location.href)}`;

  const cont = document.getElementById("detalle-auto");

  const imagenes = auto.imagen
    ? auto.imagen.split(",").map(img => img.trim())
    : [];

  let current = 0;

  cont.innerHTML = `
    <div class="max-w-5xl mx-auto bg-gray-800 text-white p-6 rounded-2xl shadow-2xl">

      <div class="relative">

        <!-- 🔥 FIX CLAVE MOBILE -->
        <img id="img-principal" 
             src="${imagenes[0]}" 
             class="w-full h-64 sm:h-80 md:h-96 object-cover rounded-lg mb-4 cursor-pointer transition-opacity duration-300">

        ${imagenes.length > 1 ? `
          <button onclick="prev()" class="absolute left-2 top-1/2 -translate-y-1/2 bg-white/70 text-black px-3 py-2 rounded-full text-2xl">‹</button>
          <button onclick="next()" class="absolute right-2 top-1/2 -translate-y-1/2 bg-white/70 text-black px-3 py-2 rounded-full text-2xl">›</button>
        ` : ""}

      </div>

      <div class="flex gap-2 overflow-x-auto mb-6">
        ${imagenes.map((img, i) => `
          <img src="${img}" 
               class="thumb h-20 w-28 object-cover rounded cursor-pointer border-2 ${i === 0 ? 'border-blue-500' : 'border-transparent'}"
               onclick="irA(${i})">
        `).join("")}
      </div>

      <h1 class="text-3xl font-bold mb-2">${auto.marca} ${auto.modelo}</h1>
      <p class="text-gray-400">Visitas: ${visitas}</p>

      <div class="grid grid-cols-2 gap-4 text-gray-300 mt-4">
        <p><b>Año:</b> ${auto.año}</p>
        <p><b>KM:</b> ${auto.km}</p>
        <p><b>Combustible:</b> ${auto.combustible}</p>
        <p><b>Ubicación:</b> ${auto.ubicacion || "No especificada"}</p>
      </div>

      <p class="text-2xl text-blue-400 font-bold mt-4">
        $${Number(auto.precio).toLocaleString("es-AR")}
      </p>

      <p class="mt-6">${auto.descripcion || "Sin descripción"}</p>

      <a href="${linkWhatsApp}" target="_blank"
         class="block mt-6 bg-green-500 text-white text-center py-4 rounded-lg font-bold text-lg">
         Consultar por WhatsApp
      </a>
    </div>
  `;

  const img = document.getElementById("img-principal");

  function actualizarImagen() {
    img.style.opacity = 0;
    setTimeout(() => {
      img.src = imagenes[current];
      img.style.opacity = 1;
    }, 150);
  }

  window.next = () => {
    current = (current + 1) % imagenes.length;
    actualizarImagen();
  };

  window.prev = () => {
    current = (current - 1 + imagenes.length) % imagenes.length;
    actualizarImagen();
  };

  window.irA = (i) => {
    current = i;
    actualizarImagen();
  };
}

// 👉 SIMILARES (NO TOCADO)
function mostrarSimilares(autoActual, lista) {

  const cont = document.getElementById("autos-similares");
  if (!cont) return;

  cont.innerHTML = "<h2 class='text-white text-2xl mb-4'>Te puede interesar...</h2>";

  let similares = lista.filter(a =>
    a.tipo === autoActual.tipo && a.slug !== autoActual.slug
  ).slice(0, 4);

  cont.innerHTML += `
    <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-4">
      ${similares.map(a => `
        <div onclick="irAuto('${a.slug}')"
          class="bg-white text-black rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition">

          <img src="${a.imagen.split(',')[0]}" class="w-full h-40 object-cover">

          <div class="p-2 text-center">
            <p class="font-bold">${a.marca} ${a.modelo}</p>
            <p>$${Number(a.precio).toLocaleString("es-AR")}</p>
          </div>

        </div>
      `).join("")}
    </div>
  `;
}

// 👉 IR
function irAuto(slug) {
  window.location.href = "auto.html?slug=" + slug;
}