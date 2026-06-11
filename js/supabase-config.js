// =============================================
//  CONFIGURACIÓN DE SUPABASE
//  Reemplazá TU_ANON_KEY con tu clave real
//  (Settings → API → anon public en Supabase)
// =============================================

const SUPABASE_URL = "https://khntvfgazeqctskwigme.supabase.co";
const SUPABASE_KEY = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImtobnR2ZmdhemVxY3Rza3dpZ21lIiwicm9sZSI6ImFub24iLCJpYXQiOjE3ODA5NTE5MTksImV4cCI6MjA5NjUyNzkxOX0.ZK81A52fv6T1Ud9RyCi_UsSsNxsc3CNeqLBDAlB26QY";

/** Email con permisos de administrador (debe coincidir con RLS en Supabase) */
const ADMIN_EMAIL = "autosparana.ok@gmail.com";

const db = supabase.createClient(SUPABASE_URL, SUPABASE_KEY);

function esAdmin(session) {
  const email = session?.user?.email || "";
  return email.toLowerCase() === ADMIN_EMAIL.toLowerCase();
}
