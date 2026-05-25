
import { supabase } from "../../lib/supabase";
import type { Producto } from "../types"

const SELECT_PRODUCTO = `
  prdcid,
  prdcnombre,
  prdcimgnombrebucket,
  ctgraid,
  marcaid,
  categoria ( ctgraid, ctgranombre, ctgraimgnombrebucket),
  marca ( marcaid, marcanombre, marcaimgnombrebucket)
`;

// ///////////////////////////////////////////////////////////////////////////////////////
// /////////////////////////////     listarProductos     //////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
export const listarProductos = async (
  pagina?: number,
  limite?: number
): Promise<Producto[]> => {
  try {
    // Con paginación explícita → comportamiento original
    if (pagina !== undefined && limite !== undefined) {
      const desde = (pagina - 1) * limite;
      const { data, error } = await supabase
        .from("producto")
        .select(SELECT_PRODUCTO)
        .order("prdcid", { ascending: true })
        .range(desde, desde + limite - 1);

      if (error) { console.error(error.message); return []; }
      return data as Producto[];
    }

    // Sin argumentos → traer TODO con paginación automática
    const PAGE_SIZE = 1000;
    let todos: Producto[] = [];
    let desde = 0;

    while (true) {
      const { data, error } = await supabase
        .from("producto")
        .select(SELECT_PRODUCTO)
        .order("prdcid", { ascending: true })
        .range(desde, desde + PAGE_SIZE - 1);

      if (error) { console.error(error.message); break; }
      if (!data || data.length === 0) break;

      todos = [...todos, ...data];
      if (data.length < PAGE_SIZE) break;
      desde += PAGE_SIZE;
    }

    return todos;

  } catch (err) {
    console.error("Error general:", err);
    return [];
  }
};

// ///////////////////////////////////////////////////////////////////////////////////////
// /////////////////////////     obtenerProductoPorId     ////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
export const obtenerProductoPorId = async (id: number): Promise<Producto | null> => {
  const { data, error } = await supabase
    .from("producto")
    .select(SELECT_PRODUCTO)
    .eq("prdcid", id)
    .single();

  if (error) {
    console.error("Error al listar producto por ID:", error);
    return null;
  }
  return data as Producto;
};

// ///////////////////////////////////////////////////////////////////////////////////////
// ////////////////////////     actualizarProductoPorId     //////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
export const actualizarProductoPorId = async (
  id: number,
  producto: Partial<Producto>,
  nuevaImagen?: File
): Promise<Producto | null> => {

  try {

    // 🔍 1. obtener producto actual (para saber imagen anterior)
    const productoActual = await obtenerProductoPorId(id);

    if (!productoActual) {
      console.error("Producto no encontrado");
      return null;
    }

    let nombreBucket = producto.prdcimgnombrebucket;

    // 🖼️ 2. si hay nueva imagen → reemplazar flujo completo
    if (nuevaImagen) {

      // eliminar imagen anterior
      if (productoActual.prdcimgnombrebucket) {
        await eliminarImagenProducto(productoActual.prdcimgnombrebucket);
      }

      // subir nueva imagen
      const nuevoNombre = await subirImagenProducto(nuevaImagen);

      if (!nuevoNombre) {
        console.error("Error al subir nueva imagen");
        return null;
      }

      nombreBucket = nuevoNombre;
    }

    // 📦 3. construir updateData
    const updateData: Partial<Producto> = {};

    if (producto.prdcnombre !== undefined)
      updateData.prdcnombre = producto.prdcnombre;

    if (nombreBucket !== undefined)
      updateData.prdcimgnombrebucket = nombreBucket;


    if (producto.ctgraid !== undefined)
      updateData.ctgraid = producto.ctgraid;

    if (producto.marcaid !== undefined)
      updateData.marcaid = producto.marcaid;

    // 🚨 evitar update vacío
    if (Object.keys(updateData).length === 0) {
      console.warn("No hay datos para actualizar");
      return null;
    }

    // 💾 4. actualizar en BD
    const { data, error } = await supabase
      .from("producto")
      .update(updateData)
      .eq("prdcid", id)
      .select()
      .single();

    if (error) {
      console.error("Error al actualizar producto:", error.message);
      return null;
    }

    return data as Producto;

  } catch (err) { 
    console.error("Error general:", err);
    return null;
  }
};


// ///////////////////////////////////////////////////////////////////////////////////////
// /////////////////////////     eliminarProductoPorId     ///////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
export const eliminarProductoPorId = async (id: number): Promise<boolean> => {
  if (!id) return false;

  try {
    // 1. Primero obtenemos el producto para saber el nombre de la imagen
    const { data: producto, error: fetchError } = await supabase
      .from("producto")
      .select("prdcimgnombrebucket")
      .eq("prdcid", id)
      .single();

    if (fetchError || !producto) {
      console.error("Error al obtener producto:", fetchError?.message);
      return false;
    }

    const imagenPath = `producto/${producto.prdcimgnombrebucket}`;

    // 2. Eliminamos la imagen del bucket
    const { error: storageError } = await supabase.storage
      .from("imagenes")
      .remove([imagenPath]);

    if (storageError) {
      console.error("Error al eliminar imagen:", storageError.message);
      return false;
    }

    // 3. Eliminamos el registro de la BD
    const { error: deleteError } = await supabase
      .from("producto")
      .delete()
      .eq("prdcid", id);

    if (deleteError) {
      console.error("Error al eliminar producto:", deleteError.message);
      return false;
    }

    return true;
  } catch (err) {
    console.error("Error general:", err);
    return false;
  }
};

// ///////////////////////////////////////////////////////////////////////////////////////
// ////////////////////////     eliminarImagenProducto     ///////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
export const eliminarImagenProducto = async (nombre: string): Promise<boolean> => {
  if (!nombre) return false;

  const { error } = await supabase.storage
    .from("imagenes")
    .remove([`producto/${nombre}`]);

  if (error) {
    console.error("Error al eliminar imagen:", error.message);
    return false;
  }

  return true;
};

// ///////////////////////////////////////////////////////////////////////////////////////
// //////////////////////////     subirImagenProducto     ////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
export const subirImagenProducto = async (file: File) => {
  const nombreArchivo = `${Date.now()}-${file.name}`;

  const { error } = await supabase.storage
    .from("imagenes")
    .upload(`producto/${nombreArchivo}`, file, {
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
// ///////////////////////////     getImagenProducto     /////////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
export const getImagenProducto = (nombreBucket: string) => {
  if (!nombreBucket) return "";

  const { data } = supabase
    .storage
    .from("imagenes")   
    .getPublicUrl(`producto/${nombreBucket}`);

  return data.publicUrl;
};

// ///////////////////////////////////////////////////////////////////////////////////////
// /////////////////////////     buscarProductosPorNombre     ////////////////////////////
// ///////////////////////////////////////////////////////////////////////////////////////
export const buscarProductosPorNombre = async (query: string): Promise<Producto[]> => {
  const { data, error } = await supabase
    .from("producto")
    .select(SELECT_PRODUCTO)
    .ilike("prdcnombre", `%${query}%`)
    .order("prdcnombre");
  if (error) { console.error(error); return []; }
  return data as Producto[];
};
export const listarProductosPorCategoria = async (
  categoria: string
): Promise<Producto[]> => {
  const { data: catData, error: catError } = await supabase
    .from("categoria")
    .select("ctgraid")
    .ilike("ctgranombre", categoria)  // ✅ columna correcta + case-insensitive
    .single();

  if (catError || !catData) {
    console.error("Categoría no encontrada:", catError);
    return [];
  }

  const PAGE_SIZE = 1000;
  let todos: Producto[] = [];
  let desde = 0;

  while (true) {
    const { data, error } = await supabase
      .from("producto")
      .select(SELECT_PRODUCTO)
      .eq("ctgraid", catData.ctgraid)
      .order("prdcid", { ascending: true })
      .range(desde, desde + PAGE_SIZE - 1);

    if (error) { console.error(error); break; }
    if (!data || data.length === 0) break;

    todos = [...todos, ...data];
    if (data.length < PAGE_SIZE) break;
    desde += PAGE_SIZE;
  }

  return todos;
};

export const listarProductosPorMarca = async (
  marca: string
): Promise<Producto[]> => {
  const { data: marcaData, error: marcaError } = await supabase
    .from("marca")
    .select("marcaid")
    .ilike("marcanombre", marca)  // ✅ columna correcta + case-insensitive
    .single();

  if (marcaError || !marcaData) {
    console.error("Marca no encontrada:", marcaError);
    return [];
  }

  const PAGE_SIZE = 1000;
  let todos: Producto[] = [];
  let desde = 0;

  while (true) {
    const { data, error } = await supabase
      .from("producto")
      .select(SELECT_PRODUCTO)
      .eq("marcaid", marcaData.marcaid)
      .order("prdcid", { ascending: true })
      .range(desde, desde + PAGE_SIZE - 1);

    if (error) { console.error(error); break; }
    if (!data || data.length === 0) break;

    todos = [...todos, ...data];
    if (data.length < PAGE_SIZE) break;
    desde += PAGE_SIZE;
  }

  return todos;
};