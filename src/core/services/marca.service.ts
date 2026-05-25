import { supabase } from "../../lib/supabase";
import type { Marca } from "../types"

const SELECT_MARCA = `
  marcaid,
  marcanombre,
  marcaimgnombrebucket
`;

// ///////////////////////////////////////////////////////////////////////////////////////
// /////////////////////////////     listarMarcas     //////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
export const listarMarcas = async (
  pagina?: number,
  limite?: number
): Promise<Marca[]> => {
  try {
    let query = supabase
      .from("marca")
      .select(SELECT_MARCA)
      .order("marcaid", { ascending: true });

    // 📄 aplicar paginación solo si llega página y límite
    if (pagina !== undefined && limite !== undefined) {
      const desde = (pagina - 1) * limite;
      const hasta = desde + limite - 1;

      query = query.range(desde, hasta);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error al listar marcas:", error.message);
      return [];
    }

    return data as Marca[];

  } catch (err) {
    console.error("Error general:", err);
    return [];
  }
};

// ///////////////////////////////////////////////////////////////////////////////////////
// /////////////////////////        obtenerMarcaPorId       //////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
export const obtenerMarcaPorId = async (id: number): Promise<Marca | null> => {
  const { data, error } = await supabase
    .from("marca")
    .select(SELECT_MARCA)
    .eq("marcaid", id)
    .single();

  if (error) {
    console.error("Error al listar marca por ID:", error);
    return null;
  }
  return data as Marca;
};

// ///////////////////////////////////////////////////////////////////////////////////////
// //////////////////////////        actualizarMarcaPorId       //////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
export const actualizarMarcaPorId = async (
  id: number,
  marca: Partial<Marca>,
  nuevaImagen?: File
): Promise<Marca | null> => {

  try {

    // 🔍 1. obtener marca actual (para saber imagen anterior)
    const marcaActual = await obtenerMarcaPorId(id);

    if (!marcaActual) {
      console.error("Marca no encontrado");
      return null;
    }

    let nombreBucket = marca.marcaimgnombrebucket;

    // 🖼️ 2. si hay nueva imagen → reemplazar flujo completo
    if (nuevaImagen) {

      // eliminar imagen anterior
      if (marcaActual.marcaimgnombrebucket) {
        await eliminarImagenMarca(marcaActual.marcaimgnombrebucket);
      }

      // subir nueva imagen
      const nuevoNombre = await subirImagenMarca(nuevaImagen);

      if (!nuevoNombre) {
        console.error("Error al subir nueva imagen");
        return null;
      }

      nombreBucket = nuevoNombre;
    }

    // 📦 3. construir updateData
    const updateData: Partial<Marca> = {};

    if (marca.marcanombre !== undefined)
      updateData.marcanombre = marca.marcanombre;

    if (nombreBucket !== undefined)
      updateData.marcaimgnombrebucket = nombreBucket;

    // 🚨 evitar update vacío
    if (Object.keys(updateData).length === 0) {
      console.warn("No hay datos para actualizar");
      return null;
    }

    // 💾 4. actualizar en BD
    const { data, error } = await supabase
      .from("marca")
      .update(updateData)
      .eq("marcaid", id)
      .select()
      .single();

    if (error) {
      console.error("Error al actualizar marca:", error.message);
      return null;
    }

    return data as Marca;

  } catch (err) { 
    console.error("Error general:", err);
    return null;
  }
};

// ///////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////        eliminarMarcaPorId       ///////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
export const eliminarMarcaPorId = async (
  id: number
): Promise<{ ok: boolean; mensaje?: string }> => {

  if (!id) {
    return { ok: false, mensaje: "ID inválido" };
  }

  try {
    // 1. Obtener marca (para saber imagen)
    const { data: marca, error: fetchError } = await supabase
      .from("marca")
      .select("marcaimgnombrebucket")
      .eq("marcaid", id)
      .single();

    if (fetchError || !marca) {
      return { ok: false, mensaje: "No se pudo obtener la marca" };
    }

    // 2. Eliminar registro de BD
    const { error: deleteError } = await supabase
      .from("marca")
      .delete()
      .eq("marcaid", id);

    if (deleteError) {
      // 🔥 error por relación (foreign key)
      if (deleteError.code === "23503") {
        return {
          ok: false,
          mensaje: "No puedes eliminar esta marca porque tiene productos asociados"
        };
      }

      return { ok: false, mensaje: "Error al eliminar la marca" };
    }

    // 3. Eliminar imagen (si existe)
    if (marca.marcaimgnombrebucket) {
      const imagenPath = `marca/${marca.marcaimgnombrebucket}`;

      const { error: storageError } = await supabase.storage
        .from("imagenes")
        .remove([imagenPath]);

      if (storageError) {
        console.error("Error al eliminar imagen:", storageError.message);
        // ⚠️ no rompemos el flujo, solo avisamos
      }
    }

    return { ok: true };

  } catch (err) {
    console.error("Error general:", err);
    return { ok: false, mensaje: "Error inesperado" };
  }
};

// ///////////////////////////////////////////////////////////////////////////////////////
// ////////////////////////        eliminarImagenMarca       //////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
export const eliminarImagenMarca = async (nombre: string): Promise<boolean> => {
  if (!nombre) return false;

  const { error } = await supabase.storage
    .from("imagenes")
    .remove([`marca/${nombre}`]);

  if (error) {
    console.error("Error al eliminar imagen:", error.message);
    return false;
  }

  return true;
};

// ///////////////////////////////////////////////////////////////////////////////////////
// ///////////////////////        subirImagenMarca       /////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
export const subirImagenMarca = async (file: File) => {
  const nombreArchivo = `${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from("imagenes")
    .upload(`marca/${nombreArchivo}`, file, {
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
// ////////////////////////        getImagenMarca       //////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
export const getImagenMarca = (nombreBucket: string) => {
  if (!nombreBucket) return ""; // evita errores

  const { data } = supabase
    .storage
    .from("imagenes")
    .getPublicUrl(`marca/${nombreBucket}`);

  return data.publicUrl;
};

export const buscarMarcasPorNombre = async (query: string): Promise<Marca[]> => {
  const { data, error } = await supabase
    .from("marca")
    .select(SELECT_MARCA)
    .ilike("marcaimgnombre", `%${query}%`)
    .order("marcaimgnombre");
  if (error) { console.error(error); return []; }
  return data as Marca[];
};