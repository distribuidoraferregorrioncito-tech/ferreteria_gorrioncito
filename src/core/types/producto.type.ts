import type { Categoria } from "./categoria.type";
import type { Marca } from "./marca.type";

export type Producto = {
  prdcid: number;
  prdcnombre: string;
  prdcimgnombrebucket: string;

  ctgraid: number;
  marcaid: number;

  categoria: Categoria | null;
  marca: Marca | null;
};