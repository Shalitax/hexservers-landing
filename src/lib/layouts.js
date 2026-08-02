/**
 * Formas de listar el catálogo.
 *
 * El mismo contenido, cinco maneras de enseñarlo. No es una decisión de gusto sin
 * más: un catálogo de tres productos se luce con tarjetas grandes y uno de treinta
 * se vuelve interminable, así que la forma correcta depende de cuántas cosas vendas
 * y de si el visitante viene a descubrir o a comparar.
 *
 * `id` viaja en el documento del sitio (`catalog.layout`) y en la preferencia del
 * visitante (localStorage), así que no se renombra: se añadirían modos nuevos.
 */
export const CATALOG_LAYOUTS = [
  {
    id: 'detalle',
    name: 'Detalladas',
    short: 'Detalle',
    icon: 'layout',
    description:
      'Dos columnas con la ficha entera: descripción, argumentos de venta y precio. Luce con pocos productos.',
  },
  {
    id: 'rejilla',
    name: 'Rejilla',
    short: 'Rejilla',
    icon: 'layers',
    description:
      'Tarjetas compactas de tres en tres. Se abarca todo el catálogo de un vistazo sin bajar tanto.',
  },
  {
    id: 'lista',
    name: 'Lista',
    short: 'Lista',
    icon: 'box',
    description:
      'Una fila por producto, a ancho completo. Lo más denso: útil cuando ya se sabe qué se busca.',
  },
  {
    id: 'escaparate',
    name: 'Escaparate',
    short: 'Escaparate',
    icon: 'sparkles',
    description:
      'Los destacados con la ficha entera y el resto en rejilla. Guía la mirada hacia lo que quieres vender.',
  },
  {
    id: 'tabla',
    name: 'Comparativa',
    short: 'Tabla',
    icon: 'database',
    description:
      'Una tabla con subcategoría, planes y precio de entrada. Para comparar cifras, no para descubrir.',
  },
]

export const DEFAULT_LAYOUT = 'detalle'

const IDS = new Set(CATALOG_LAYOUTS.map((layout) => layout.id))

/** Modo válido, con el de fábrica como red de seguridad. */
export const resolveLayout = (id) => (IDS.has(id) ? id : DEFAULT_LAYOUT)

export const findLayout = (id) =>
  CATALOG_LAYOUTS.find((layout) => layout.id === resolveLayout(id)) || CATALOG_LAYOUTS[0]
