// =============================================
//  AUTH NAV
//  Cambia el nav según el estado de sesión
//  Requiere supabase-config.js cargado antes
// =============================================

(async () => {
  const { data: { session } } = await db.auth.getSession();
  const navVender = document.getElementById("nav-vender");
  const menu = document.getElementById("menu");

  if (menu && session && esAdmin(session) && !document.getElementById("nav-admin")) {
    const adminLink = document.createElement("a");
    adminLink.id = "nav-admin";
    adminLink.href = "admin.html";
    adminLink.textContent = "Admin";
    adminLink.className = "nav-admin";
    if (navVender) menu.insertBefore(adminLink, navVender);
    else menu.appendChild(adminLink);
  }

  if (!navVender) return;

  if (session) {
    navVender.textContent = "Mi panel";
    navVender.href        = "mipanel.html";
  } else {
    navVender.textContent = "Ingresar";
    navVender.href        = "login.html";
  }
})();

document.addEventListener("DOMContentLoaded", () => {
  const btn = document.getElementById("menuBtn");
  const menu = document.getElementById("menu");

  if (btn && menu) {
    btn.addEventListener("click", () => menu.classList.toggle("active"));
    menu.querySelectorAll("a").forEach((link) => {
      link.addEventListener("click", () => menu.classList.remove("active"));
    });
  }

  const path = window.location.pathname.toLowerCase();
  const archivoMenu = path.split("/").pop() || "index.html";

  const map = [
    { id: "nav-inicio", files: ["", "index.html"] },
    { id: "nav-autos", files: ["autos.html"] },
    { id: "nav-motos", files: ["motos.html"] },
    { id: "nav-camionetas", files: ["camionetas.html"] },
    { id: "nav-utilitarios", files: ["utilitarios.html"] },
    { id: "nav-admin", files: ["admin.html"] },
    { id: "nav-vender", files: ["vender.html", "login.html", "publicar.html", "mipanel.html"] }
  ];

  map.forEach((item) => {
    const el = document.getElementById(item.id);
    if (!el) return;

    let activo = false;

    if (item.id === "nav-inicio") {
      activo = archivoMenu === "" || archivoMenu === "index.html" || path.endsWith("/");
    } else {
      activo = item.files.includes(archivoMenu);
    }

    el.classList.toggle("nav-active", activo);
  });
});
