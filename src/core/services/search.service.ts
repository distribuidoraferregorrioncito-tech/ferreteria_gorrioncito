import { listarProductos, listarCategorias, listarMarcas } from "./index";

export type ResultadoBusqueda =
  | { tipo: "marca";      valor: string }
  | { tipo: "categoria";  valor: string }
  | { tipo: "producto";   valor: string }
  | { tipo: "sin_resultado"; valor: string };

export const clasificarBusquedaCatalogo = async (
  texto: string
): Promise<ResultadoBusqueda> => {
  const textoBuscado = texto.trim().toLowerCase();

  const marcas = await listarMarcas();
  const marcaEncontrada = marcas.find(
    (m) => m.marcanombre?.trim().toLowerCase() === textoBuscado
  );
  if (marcaEncontrada) {
    return { tipo: "marca", valor: marcaEncontrada.marcanombre };
  }

  const categorias = await listarCategorias();
  const categoriaEncontrada = categorias.find(
    (c) => c.ctgranombre?.trim().toLowerCase() === textoBuscado
  );
  if (categoriaEncontrada) {
    return { tipo: "categoria", valor: categoriaEncontrada.ctgranombre };
  }

  // Todo lo demás → búsqueda general por nombre de producto
  return { tipo: "producto", valor: textoBuscado };
};