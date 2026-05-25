import { supabase } from "../../lib/supabase";
import type { Categoria } from "../types";

const SELECT_CATEGORIA = `
  ctgraid,
  ctgranombre,
  ctgraimgnombrebucket
`;

// ///////////////////////////////////////////////////////////////////////////////////////
// /////////////////////////////     listarCategorias     //////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
export const listarCategorias = async (
  pagina?: number,
  limite?: number
): Promise<Categoria[]> => {
  try {
    let query = supabase
      .from("categoria")
      .select(SELECT_CATEGORIA)
      .order("ctgraid", { ascending: true });

    // 📄 aplicar paginación solo si llega página y límite
    if (pagina !== undefined && limite !== undefined) {
      const desde = (pagina - 1) * limite;
      const hasta = desde + limite - 1;

      query = query.range(desde, hasta);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error al listar Categorias:", error.message);
      return [];
    }

    return data as Categoria[];

  } catch (err) {
    console.error("Error general:", err);
    return [];
  }
};

// ///////////////////////////////////////////////////////////////////////////////////////
// ////////////////////////        obtenerCategoriaPorId       ///////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
export const obtenerCategoriaPorId = async (id: number): Promise<Categoria | null> => {
  const { data, error } = await supabase
    .from("categoria")
    .select(SELECT_CATEGORIA)
    .eq("ctgraid", id)
    .single();

  if (error) {
    console.error("Error al listar categoria por ID:", error);
    return null;
  }
  return data as Categoria;
};

// ///////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////        actualizarCategoriaPorId       /////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
export const actualizarCategoriaPorId = async (
  id: number,
  categoria: Partial<Categoria>,
  nuevaImagen?: File
): Promise<Categoria | null> => {

  try {

    // 🔍 1. obtener categoria actual (para saber imagen anterior)
    const categoriaActual = await obtenerCategoriaPorId(id);

    if (!categoriaActual) {
      console.error("Categoria no encontrado");
      return null;
    }

    let nombreBucket = categoria.ctgraimgnombrebucket;

    // 🖼️ 2. si hay nueva imagen → reemplazar flujo completo
    if (nuevaImagen) {

      // eliminar imagen anterior
      if (categoriaActual.ctgraimgnombrebucket) {
        await eliminarImagenCategoria(categoriaActual.ctgraimgnombrebucket);
      }

      // subir nueva imagen
      const nuevoNombre = await subirImagenCategoria(nuevaImagen);

      if (!nuevoNombre) {
        console.error("Error al subir nueva imagen");
        return null;
      }

      nombreBucket = nuevoNombre;
    }

    // 📦 3. construir updateData
    const updateData: Partial<Categoria> = {};

    if (categoria.ctgranombre !== undefined)
      updateData.ctgranombre = categoria.ctgranombre;

    if (nombreBucket !== undefined)
      updateData.ctgraimgnombrebucket = nombreBucket;

    // 🚨 evitar update vacío
    if (Object.keys(updateData).length === 0) {
      console.warn("No hay datos para actualizar");
      return null;
    }

    // 💾 4. actualizar en BD
    const { data, error } = await supabase
      .from("categoria")
      .update(updateData)
      .eq("ctgraid", id)
      .select()
      .single();

    if (error) {
      console.error("Error al actualizar categoria:", error.message);
      return null;
    }

    return data as Categoria;

  } catch (err) { 
    console.error("Error general:", err);
    return null;
  }
};
// ///////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////        eliminarCategoriaPorId       ///////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
export const eliminarCategoriaPorId = async (
  id: number
): Promise<{ ok: boolean; mensaje?: string }> => {

  if (!id) {
    return { ok: false, mensaje: "ID inválido" };
  }

  try {
    // 1. obtener categoria
    const { data: categoria, error: fetchError } = await supabase
      .from("categoria")
      .select("ctgraimgnombrebucket")
      .eq("ctgraid", id)
      .single();

    if (fetchError || !categoria) {
      return { ok: false, mensaje: "No se pudo obtener la categoría" };
    }

    // 2. eliminar BD
    const { error: deleteError } = await supabase
      .from("categoria")
      .delete()
      .eq("ctgraid", id);

    if (deleteError) {
      // 🔥 error por relación (productos usando esta categoría)
      if (deleteError.code === "23503") {
        return {
          ok: false,
          mensaje: "No puedes eliminar esta categoría porque tiene productos asociados"
        };
      }

      return { ok: false, mensaje: "Error al eliminar la categoría" };
    }

    // 3. eliminar imagen (si existe)
    if (categoria.ctgraimgnombrebucket) {
      const imagenPath = `categoria/${categoria.ctgraimgnombrebucket}`;

      const { error: storageError } = await supabase.storage
        .from("imagenes")
        .remove([imagenPath]);

      if (storageError) {
        console.error("Error al eliminar imagen:", storageError.message);
        // no rompemos el flujo
      }
    }

    return { ok: true };

  } catch (err) {
    console.error("Error general:", err);
    return { ok: false, mensaje: "Error inesperado" };
  }
};

// ///////////////////////////////////////////////////////////////////////////////////////
// ////////////////////////        eliminarImagenCategoria       //////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
export const eliminarImagenCategoria = async (nombre: string): Promise<boolean> => {
  if (!nombre) return false;

  const { error } = await supabase.storage
    .from("imagenes")
    .remove([`categoria/${nombre}`]);

  if (error) {
    console.error("Error al eliminar imagen:", error.message);
    return false;
  }

  return true;
};

// ///////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////        subirImagenCategoria       /////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
export const subirImagenCategoria = async (file: File) => {
  const nombreArchivo = `${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from("imagenes")
    .upload(`categoria/${nombreArchivo}`, file, {
      cacheControl: "3600",
      upsert: false,
    });

  if (error) {
    console.error("Error al subir imagen:", error.message);
    return null;
  }

  return nombreArchivo; // 👈 esto guardas en BD
};

// ///////////////////////////////////////////////////////////////////////////////////////
// ////////////////////////        getImagenCategoria       //////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
export const getImagenCategoria = (nombreBucket: string) => {
  if (!nombreBucket) return ""; // evita errores

  const { data } = supabase
    .storage
    .from("imagenes")
    .getPublicUrl(`categoria/${nombreBucket}`);

  return data.publicUrl;
};

export const buscarCategoriasPorNombre = async (query: string): Promise<Categoria[]> => {
  const { data, error } = await supabase
    .from("categoria")
    .select(SELECT_CATEGORIA)
    .ilike("ctgraimgnombre", `%${query}%`)
    .order("ctgraimgnombre");
  if (error) { console.error(error); return []; }
  return data as Categoria[];
};  