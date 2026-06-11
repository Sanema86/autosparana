-- ============================================================
--  Autos Paraná — políticas admin + trigger actualizado
--  Ejecutar en Supabase → SQL Editor (sin EXPLAIN)
--  Email admin: autosparana.ok@gmail.com
-- ============================================================

-- 1) UPDATE: admin puede editar cualquier fila (with check incluido)
ALTER POLICY "usuarios pueden editar"
ON public.autos
TO authenticated
USING (
  (auth.uid())::text = user_id
  OR (auth.jwt() ->> 'email') = 'autosparana.ok@gmail.com'
)
WITH CHECK (
  (auth.uid())::text = user_id
  OR (auth.jwt() ->> 'email') = 'autosparana.ok@gmail.com'
);

-- 2) DELETE: admin puede eliminar cualquier fila
ALTER POLICY "usuarios pueden eliminar"
ON public.autos
TO authenticated
USING (
  (auth.uid())::text = user_id
  OR (auth.jwt() ->> 'email') = 'autosparana.ok@gmail.com'
);

-- 3) Trigger: usuarios normales no tocan destacado;
--    admin SÍ puede (incluso en sus propias publicaciones)
CREATE OR REPLACE FUNCTION public.proteger_campos_admin()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $func$
BEGIN
  IF auth.uid() IS NOT NULL AND auth.uid()::text = OLD.user_id::text THEN
    IF lower(coalesce(auth.jwt() ->> 'email', '')) <> 'autosparana.ok@gmail.com' THEN
      IF NEW.destacado IS DISTINCT FROM OLD.destacado
         OR NEW.destacado_hasta IS DISTINCT FROM OLD.destacado_hasta
         OR NEW.intermediario IS DISTINCT FROM OLD.intermediario THEN
        RAISE EXCEPTION 'No podés modificar destacado ni campos de administración';
      END IF;
    END IF;
  END IF;

  RETURN NEW;
END;
$func$;
