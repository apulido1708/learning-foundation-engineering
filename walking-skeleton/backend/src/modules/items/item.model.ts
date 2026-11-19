// Modelo de dominio: es lo que conocen el servicio y la API.
// No refleja los nombres de columnas de la tabla (eso lo traduce el repositorio).

export interface Item {
  id: number;
  title: string;
  createdAt: string; // ISO 8601, cómodo de serializar a JSON
}

export interface NewItem {
  title: string;
}
