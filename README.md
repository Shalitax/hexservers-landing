# HexServers — Landing page

Landing de venta para VPS, servidores de juegos y hosting web. Filosofía: el cliente
entra, ve especificaciones, compara y compra. Sin relleno visual.

La **portada** da la bienvenida y demuestra lo que ofrecemos; el **catálogo** vive en
su propia página y cada producto tiene su propio recorrido de compra.

Todo el contenido (subcategorías, productos, planes, textos, promoción) es editable en
caliente desde un panel de administración oculto y se guarda en una base de datos local
del navegador.

> ¿Vienes a **usar** la web, no a tocar código? Ve directo a la
> **[Guía de uso](GUIA-DE-USO.md)**.

## Arranque

```bash
npm install
```

```bash
npm run dev
```

Otros comandos: `npm run build` (producción) y `npm run preview` (servir el build).

Requiere **Node 18 o superior**.

## Despliegue en un servidor

> Para un servidor Debian o Ubuntu con HTTPS, arranque automático y copias de
> seguridad, sigue **[DESPLIEGUE.md](DESPLIEGUE.md)** — es la guía paso a paso.
> Lo de aquí abajo es el resumen conceptual.

Hay dos formas de servir la web, y la diferencia no es de comodidad sino de **dónde
vive el contenido que editas desde el panel**.

### Con servidor (recomendado): lo que editas lo ven los visitantes

`server/index.js` sirve el build y guarda el contenido en un archivo del disco. No
tiene dependencias: sólo Node.

```bash
git clone https://github.com/Shalitax/hexservers-landing.git && cd hexservers-landing
```

```bash
npm install && npm run build
```

```bash
HEX_ADMIN_PASSWORD='una-contraseña-larga' npm start
```

Queda escuchando en el puerto 8080 (`PORT` lo cambia). A partir de ahí, entras con
`Ctrl+Shift+A`, editas, y cada cambio se guarda en `data/content.json`: **todos los
visitantes lo ven al recargar**. La barra inferior de administración indica
*Publicado* cuando el cambio llegó al servidor.

| Variable | Para qué | Por defecto |
| -------- | -------- | ----------- |
| `HEX_ADMIN_PASSWORD` | Contraseña del panel. **Obligatoria**: sin ella el servidor no arranca | — |
| `PORT` / `HOST` | Dónde escucha | `8080` / `0.0.0.0` |
| `HEX_DATA_DIR` | Dónde se guarda `content.json` | `./data` |
| `HEX_STATIC_DIR` | Qué carpeta se sirve | `./dist` |

Cosas que conviene saber:

- **`data/content.json` es tu contenido**: no está en el repo (va en `.gitignore`) y es
  lo único que hay que respaldar. Si lo borras, la web vuelve al contenido semilla.
- **Ponlo detrás de HTTPS** (nginx o Caddy como proxy inverso). La contraseña del panel
  viaja en el cuerpo de la petición: sin TLS va en claro por la red.
- Las sesiones viven en memoria: reiniciar el servidor obliga a entrar de nuevo.
- El archivo se escribe de forma atómica (temporal + `rename`), así que un corte a
  mitad de guardado no lo deja corrupto.
- `GET /api/content` es **público** — es el contenido de la web. Por eso el servidor
  vacía el hash de la contraseña y las claves de WHMCS antes de escribir el archivo.

### Sin servidor (hosting estático)

Subir `dist/` a cualquier hosting estático también funciona, pero entonces **lo que
edites desde el panel se guarda sólo en tu navegador** y los visitantes seguirán viendo
el contenido compilado en `src/data/defaultState.js`. La app lo detecta y la barra de
administración lo avisa con un *Sólo local*. Sirve para maquetar o para una demo, no
para un sitio que se administra.

## Estructura del sitio

El catálogo tiene tres niveles:

```
subcategoría          producto                  plan
Servidores VPS   →    VPS Linux            →    Starter / Pro / Elite / Titan
Serv. de Juegos  →    Minecraft, Unturned  →    MC Iron / Diamond / Netherite
Económicos       →    Minecraft Eco…       →    MC Eco 4 / 8 / 12 GB
Hosting Web      →    Hosting cPanel…      →    Web Start / Pro / Business
```

Y el recorrido del cliente es siempre el mismo:

```
portada  →  catálogo  →  ficha del producto  →  detalle del plan  →  WHMCS
                        └─ configurador: [ubicación] → [CPU] → planes
```

**El configurador es una sola página.** Ubicación, CPU y planes son bloques apilados en
la ficha del producto: cada uno aparece cuando el anterior está resuelto y la vista baja
sola hasta él, sin cambiar de pantalla ni perder de vista lo ya elegido.

Los bloques entre corchetes existen sólo cuando hay algo que elegir. En WHMCS un grupo de
productos es **una CPU en una ubicación**, así que cada plan puede declarar las suyas
(panel → editor del plan) y el mismo plan existe una vez por combinación, cada una con su
PID. La lógica está en `src/lib/catalog.js`:

- con **dos o más** ubicaciones entre los planes del producto → aparece el bloque *Ubicación*;
- ídem con las CPUs, ya filtradas por la ubicación elegida (no todas están en todas partes);
- con **una sola** opción se da por elegida y el bloque no se pinta;
- un plan que deja ubicación o CPU en blanco es **comodín**: vale para cualquier selección,
  así que un producto que no las use enseña la lista de planes directamente.

Las ubicaciones son las mismas de la sección «Ubicaciones» (panel → Contenido) y las CPUs
se editan en panel → Catálogo → *CPUs*. En el catálogo de ejemplo, Minecraft usa las dos
(4 ubicaciones × 2 CPUs) y Unturned sólo ubicación (4), que es el caso de un producto que
se sirve en varios sitios con el mismo hardware.

La subcategoría **Económicos** es la misma idea llevada al catálogo: *Minecraft Económico*
y *Unturned Económico* son productos aparte, con su propia ficha y sus propios planes,
servidos sobre una CPU compartida (Ryzen 5 3600). Todo lo demás —panel, anti-DDoS,
backups, ubicaciones— es idéntico a la gama normal, y los textos lo dicen así.

### Divisas

Los precios de los planes se escriben una sola vez, en la **divisa base** del sitio
(`site.currency.base`, por defecto USD). El visitante elige la suya en el selector del
navbar y el navegador convierte al vuelo (`src/lib/money.js`) con el cambio que fija el
admin en panel → Catálogo → *Divisas*: no hay backend que consulte cotizaciones, y colgar
los precios de una API ajena los dejaría en manos de un tercero.

Los decimales los decide `Intl` según la divisa, así que CLP sale sin céntimos y USD con
ellos. La elección se guarda por dispositivo (localStorage), no en el documento del sitio.
Si rellenas el **id de la divisa en WHMCS**, el carrito se abre en la misma moneda que el
visitante estaba viendo (`&currency=N`).

### Rutas

Router por hash propio (`src/lib/router.js`), sin dependencias y sin necesidad de
configurar el servidor: la web funciona como estático puro.

| Ruta                                     | Página                                   |
| ---------------------------------------- | ---------------------------------------- |
| `#/`                                     | portada (bienvenida, no lista productos) |
| `#/nosotros`                             | quiénes somos                            |
| `#/hub`                                  | el núcleo: hardware por ubicación, equipo de soporte y próximos cambios |
| `#/soporte`                              | abrir ticket en WHMCS y vías de contacto |
| `#/productos`                            | catálogo completo                        |
| `#/productos/{grupo}`                    | catálogo filtrado por subcategoría       |
| `#/producto/{producto}`                  | ficha + configurador                     |
| `#/producto/{producto}?ubicacion=&cpu=`  | el configurador con lo ya elegido        |
| `#/producto/{producto}/plan/{planId}`    | detalle del plan y salida a WHMCS        |

La selección viaja en la **query** y no en la ruta, porque ubicación y CPU no son páginas
distintas. Aun así está en la URL a propósito: el botón atrás deshace la última elección y
un enlace reproduce la pantalla exacta. Las rutas del recorrido anterior por pasos
(`/ubicacion`, `/cpu/…`, `/planes/…`) se siguen entendiendo y se redirigen conservando lo
elegido. Las anclas sueltas (`#features`, `#contacto`) siguen apuntando a las secciones de
la portada.

El menú superior lleva cinco entradas — **Inicio**, **Productos**, **Hub**, **Nosotros** y
**Soporte** — y son editables desde el panel → Contenido → *Enlaces del navbar*. No hay
entrada de *Contacto*: **Soporte** ocupa su sitio y es a donde se va a escribir. La sección
de contacto de la portada sigue existiendo y su ancla (`#contacto`) sigue funcionando para
enlaces antiguos, sólo que ya no cuelga del menú.

### Hub y Soporte

**Hub** (`#/hub`) es el núcleo contado sin marketing, en tres bloques: el **hardware** de
cada ubicación (los nodos se agrupan solos por la ubicación a la que apuntan, así que
añadir un datacenter hace aparecer su bloque), los **miembros de soporte** actuales y los
**próximos cambios** — un listado con estado (planificado / en curso / hecho), plazo y
etiqueta, donde lo ya hecho se queda como historial.

**Soporte** (`#/soporte`) es una tarjeta con el botón **Abrir ticket**, que lleva a los
tickets de WHMCS, más el correo de contacto y el Discord. La URL del ticket sale del portal
configurado en la pestaña WHMCS (`…/submitticket.php`) salvo que fijes una propia; el correo
cae en el de la sección Contacto si no le pones uno aparte, para no tenerlo escrito dos
veces. Ambas páginas se editan desde el panel → pestaña **Hub**.

## Stack

| Pieza          | Elección                                                    |
| -------------- | ----------------------------------------------------------- |
| UI             | React 18 + Vite                                              |
| Estilos        | Tailwind CSS v4 (`@tailwindcss/vite`, tema en `src/index.css`) |
| Estado         | Zustand (store único en `src/store/useSite.js`)               |
| Persistencia   | IndexedDB (`src/lib/db.js`), con localStorage sólo como fallback |
| Iconos         | lucide-react                                                 |
| Tipografías    | Inter (texto), Space Grotesk (títulos), Press Start 2P (acentos pixel) |

## Panel de administración

Tres formas de abrir el login, ninguna visible para un cliente:

- `Ctrl` + `Shift` + `A`
- añadir `#admin` a la URL
- 5 clicks seguidos en el punto gris junto al copyright del footer

Cómo se valida la contraseña depende de cómo esté servida la web:

- **Con servidor** (`npm start`): la comprueba el servidor contra `HEX_ADMIN_PASSWORD` y
  devuelve un token de sesión. Sin ese token no se puede guardar nada, así que aquí el
  login **sí** protege el contenido. No hay usuario que elegir ni contraseña de fábrica:
  el servidor no arranca sin la variable, y limita los intentos por IP.
- **Sin servidor** (estático): se cae al hash local del documento, con las credenciales
  por defecto `admin` / `hexadmin`, que cambias en el panel → pestaña **Datos**.

> El login local **no es seguridad**: todo se ejecuta en el navegador y cualquiera con
> las devtools ve el estado. Sólo evita que un visitante casual entre al modo edición.
> Si la web se administra de verdad, sírvela con `npm start` y detrás de HTTPS.

### Qué se puede editar

- **Catálogo** — el árbol completo de tres niveles:
  - **subcategorías**: nombre, slug, icono, frase corta y descripción; crear, reordenar
    y eliminar (arrastra consigo sus productos y planes).
  - **productos**: subcategoría, slug, icono, imagen, etiqueta destacada, estado,
    visibilidad, argumentos de la ficha, cabecera de la lista de planes y funciones
    comunes. Se pueden duplicar con todos sus planes.
  - **planes**: precio (en la divisa base), periodo, estado, destacado, ubicación y CPU,
    especificaciones, checklist de "todo lo que incluye", funciones propias y destino en
    WHMCS.
  - **CPUs**: el catálogo de procesadores que, junto con las ubicaciones, forma los
    grupos de productos de WHMCS.
  - **cómo se ven los productos**: cinco presentaciones del mismo catálogo
    (`src/lib/layouts.js`) — *Detalladas* (de fábrica: dos columnas con la ficha entera),
    *Rejilla* (tarjetas compactas de tres en tres), *Lista* (una fila por producto),
    *Escaparate* (los destacados grandes y el resto en rejilla) y *Comparativa* (tabla con
    subcategoría, planes y precio de entrada). Cambia la presentación, no el contenido: los
    mismos productos y el mismo orden. Con `catalog.allowViewerLayout` aparece un selector
    sobre el catálogo para que el visitante elija la suya, que se guarda en su navegador
    (`hexservers:catalog-layout`) igual que la divisa.
  - **pestaña «Todos»**: se puede quitar (`catalog.showAllTab`). Sin ella el catálogo abre
    directamente en la primera subcategoría —`#/productos` redirige a su pestaña, sin
    apilar historial— y siempre hay una pestaña activa. Su nombre se cambia junto al
    interruptor.
  - **divisas**: la base en la que escribes los precios, la que se muestra por defecto y
    el cambio, el formato regional y el id de WHMCS de cada una.
- **Ocultar un producto** — con el interruptor del editor o el icono del ojo en la lista
  del panel. Desaparece del catálogo, de las pestañas (los contadores lo descuentan) y de
  la portada, pero su página **sigue accesible por enlace directo**: sirve para ofertas
  privadas o para dejar un producto listo antes de publicarlo. En modo edición se sigue
  viendo, marcado como *Oculto*.
- **Opciones configurables** — se activan por plan con un checkbox. Cada opción tiene un
  nombre y una lista de valores con su recargo; el cliente las ajusta en el detalle del
  plan y viajan al carrito de WHMCS.
- **Diseño** — el aspecto del sitio:
  - **estilo** `sobrio` (de fábrica) o `vivo`. Es un interruptor, no una reescritura: se
    aplica como `data-style` en `<html>` y las reglas del modo sobrio viven juntas al
    final de `src/index.css` (halos apagados, cristal más plano, sin animaciones de fondo).
    Volver a `vivo` restaura el aspecto original.
  - **tipografía pixel**: interruptor aparte del estilo, con tres estados — *según el
    estilo* (de fábrica: encendida en `vivo`, apagada en `sobrio`), *siempre* y *nunca*.
    Viaja como `data-pixel` en `<html>`, así que las cuatro combinaciones son posibles: web
    sobria con precios en pixel, o halos de sobra con las cifras legibles. El logo no
    cambia nunca — es la marca, no una decisión de estilo.
  - **selector del visitante**: un menú en el navbar (icono de paleta) deja que quien
    visita la web elija estilo, tipografía pixel, color y fondo. Se guarda en su navegador
    (`hexservers:viewer-theme`) y se superpone al tema del sitio sólo en su dispositivo
    (`mergeTheme`); cualquier fondo pasa por `clampDark`, que conserva el tono y baja el
    brillo para que el texto claro siga legible. Se apaga con `theme.allowViewer`.
  - **paleta**: color principal, acento, fondo, superficie y texto, más seis combinaciones
    prefabricadas. De cada color base sale la rampa completa de variables CSS
    (`src/lib/theme.js`), que se escriben sobre `<html>` y repintan la web al instante,
    sin recompilar Tailwind.
- **Iconos con imagen propia** — en la portada, donde hay un icono se puede subir una
  imagen que lo sustituya: formas de pago (el logo de PayPal o Mercado Pago), features y
  subcategorías (que la usan también en las pestañas del catálogo). Los iconos de trazo
  sirven para conceptos, no para marcas. Se resuelve en `Glyph` (`src/components/ui/icons.jsx`):
  con imagen manda ella, sin imagen se pinta el icono de siempre, y quitarla devuelve el
  que ya estaba elegido. El hueco pierde el degradado de marca cuando lleva un logo ajeno.
- **Contenido** — hero, bloque de catálogo de la portada, features, ubicaciones, formas de
  pago, textos de los bloques del configurador, contacto, página Nosotros (historia,
  pilares, cifras e imagen), navbar y footer. Los títulos y
  descripciones también se editan haciendo click directamente sobre ellos en la página
  (recuadro punteado en modo edición), incluidos el nombre, la frase y la descripción de
  cada producto en su propia ficha.
- **Promo** — código, textos y disparadores del popup; generador de códigos.
- **WHMCS** — portal, área de clientes y capa de configuración de la API.
- **Datos** — credenciales, exportar/importar JSON y restaurar valores de fábrica.

Los cambios se guardan solos (escritura diferida ~250 ms) y sobreviven a recargas.

## Latencia real en «Ubicaciones»

Las píldoras de latencia se miden en vivo desde el navegador del visitante
(`src/lib/latency.js`), no son texto fijo.

**Un navegador no puede enviar ICMP**, así que no es el `ping` de consola: se mide el ida
y vuelta de una petición HTTP diminuta con `fetch(..., { mode: 'no-cors' })`. Sale unos
pocos ms por encima del ICMP puro porque incluye el procesamiento del servidor, pero es
el número que de verdad importa: la latencia que tendrá *ese* visitante desde *su*
conexión.

Cómo se obtiene un número estable:

1. Una petición de calentamiento abre la conexión (DNS + TCP + TLS) y **se descarta**:
   ese coste se paga una vez y no es latencia de red.
2. Se toman 3 muestras más sobre la conexión ya abierta y se queda **la mínima**, que es
   la que menos jitter arrastra.
3. Cada muestra lleva un parámetro anti-caché y va con `cache: 'no-store'`.

`mode: 'no-cors'` permite medir contra cualquier endpoint sin configurarle CORS, y da la
distinción que hace falta: un 404 o un 403 **resuelven** (el host contestó, el ida y
vuelta vale) y sólo **rechaza** cuando no se alcanzó el host — DNS que no resuelve,
conexión rechazada o TLS roto. Eso evita el clásico falso «2 ms» de un host caído.

Sólo se mide cuando la sección entra en pantalla (`IntersectionObserver`), y las
peticiones se abortan si el componente desaparece.

### Qué hay que exponer en cada ubicación

Un archivo diminuto servido por HTTPS **desde esa ubicación**. Lo ideal, un `204` vacío:

```nginx
location = /ping {
    add_header Cache-Control "no-store" always;
    return 204;
}
```

Después se pega esa URL en el panel → Contenido → Ubicaciones → campo del endpoint. Sin
endpoint configurado se muestra el valor fijo de `ping`, y el interruptor *Medir la
latencia en vivo* desactiva la medición entera.

Dos avisos: si la web va por HTTPS el endpoint también debe ir por HTTPS (contenido mixto
se bloquea), y el endpoint debe ser **tuyo** — apuntar a un servicio ajeno mostraría la
latencia de otro como si fuera la de tu infraestructura.

## Integración con WHMCS

El botón «Continuar al pago» del detalle del plan construye su URL en `src/lib/whmcs.js`:

1. Si el plan tiene **URL propia**, se usa esa.
2. Si no, se compone `{portalUrl}/cart.php?a=add&pid={whmcsPid}`.
3. Se añade `billingcycle`, el `promocode` global si existe y las opciones
   configurables seleccionadas.

Las opciones viajan como `configoption[ID]=VALOR_ID` cuando has rellenado los IDs de
WHMCS en el editor. Si los dejas vacíos, la selección se envía como parámetro
informativo `hex_opt` para no perderla, pero WHMCS no la aplicará.

Los planes de ejemplo traen PIDs ficticios: 11–16 y 51–62 para VPS y hosting, 101–124 para
la matriz de Minecraft, 201–212 para la de Unturned, y 301–312 / 401–408 para la gama
económica. Sustitúyelos por los reales.

### API (preparada, no activa)

`syncFromWhmcs()` está cableada pero deliberadamente inerte: el identifier y el
secret **no deben viajar en el navegador**, y WHMCS bloquea CORS. Para sincronizar
productos y precios reales hace falta un proxy en tu servidor que guarde las
credenciales; la URL de ese proxy se configura en el panel → WHMCS.

## Estructura

```
server/index.js              Servidor: estáticos + API de contenido (sin dependencias)
src/
├── App.jsx                  Shell con router + atajos ocultos de admin
├── index.css                Tema, glass, tipografías, ritmo (.section), animaciones
├── data/defaultState.js     Contenido semilla (se copia a IndexedDB al arrancar)
├── lib/
│   ├── router.js            Router por hash (rutas y pasos del flujo de compra)
│   ├── catalog.js           Configurador ubicación → CPU → plan a partir de los planes
│   ├── money.js             Divisas: conversión desde la base y formato
│   ├── theme.js             Paleta editable: colores base → variables CSS
│   ├── latency.js           Medición de latencia real por ubicación
│   ├── db.js                IndexedDB + fallback localStorage
│   ├── auth.js              PBKDF2-SHA256 de la contraseña de admin
│   ├── layouts.js           Las cinco formas de listar el catálogo
│   ├── remote.js            Contenido del servidor: cargarlo, guardarlo y sesión
│   ├── whmcs.js             URLs de carrito, precios y placeholder de la API
│   └── utils.js             Helpers (precios, slugs, imágenes, URLs seguras)
├── store/useSite.js         Store Zustand: estado + CRUD + migración + persistencia
├── pages/
│   ├── HomePage.jsx         Portada: bienvenida y demostración
│   ├── AboutPage.jsx        Nosotros: historia, pilares y cifras
│   ├── HubPage.jsx          Hub: hardware por ubicación, equipo y próximos cambios
│   ├── SupportPage.jsx      Soporte: ticket de WHMCS y contacto
│   ├── ProductsPage.jsx     Catálogo: boxes grandes por producto
│   └── ProductPage.jsx      Ficha + configurador, y el detalle del plan
├── components/
│   ├── ui/                  Editable, Modal, Logo, Flag (banderas SVG), iconos
│   ├── catalog/             ProductBox / ProductCard / ProductRow / ProductTable (las
│   │                        cinco vistas), LayoutPicker, Configurator, OptionCard,
│   │                        PlanCard, PlanDetail, GroupTabs
│   └── …                    Navbar, Hero, Showcase, Features, Locations, Payments,
│                            Contact, Footer
└── admin/
    ├── ProductEditor.jsx    Producto (box grande) + su lista de planes
    ├── PlanEditor.jsx       Plan: precio, specs, incluye, ubicación/CPU y WHMCS
    ├── CollectionFields.jsx Editores de listas reutilizables
    └── panels/              Catálogo, Contenido, Hub, Diseño, Promo, WHMCS, Datos
```

## Notas

- La base de datos vive en el navegador. Exporta un JSON desde el panel antes de
  limpiar el almacenamiento o cambiar de equipo.
- Si ya tenías datos guardados con el esquema anterior (categorías + planes), se migran
  solos al arrancar: cada categoría pasa a ser un producto y se reparte por subcategoría
  según su tipo (VPS → Servidores VPS, juegos → Servidores de Juegos). Los planes
  conservan precios, specs, opciones y URLs de WHMCS.
- Los campos nuevos del esquema v4 (paleta, `hidden` del producto, `locationId`/`cpuId`
  del plan y el catálogo de CPUs) se rellenan al abrir un documento antiguo: la paleta
  arranca con los colores originales, ningún producto queda oculto y los planes quedan
  sin ubicación ni CPU, es decir, con el recorrido de siempre.
- En v5 la divisa dejó de ser un campo de cada plan y pasó a ser del sitio. Al migrar, la
  divisa base es la que usaban la mayoría de los planes guardados, así que ningún precio
  cambia de significado; revisa los cambios en panel → Catálogo → *Divisas*.
- El menú superior se actualiza solo al de la versión actual **mientras no lo hayas
  tocado**. En cuanto añades o editas un enlace propio, la migración deja de sobrescribirlo
  (ver `SEED_NAV_IDS` en `src/store/useSite.js`).
- La exportación omite a propósito las credenciales de admin y las de la API.
- Las imágenes subidas se guardan como data URL (límite de 1,5 MB por imagen).
