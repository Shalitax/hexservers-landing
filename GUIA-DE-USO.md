# Guía de uso — HexServers

Guía práctica para operar la landing del día a día: entrar al panel, montar el
catálogo, conectarlo con WHMCS y mantenerlo.

No hace falta saber programar para nada de lo que hay aquí. Si buscas la parte
técnica (estructura de carpetas, stack, build), está en [README.md](README.md).

---

## Índice

1. [Primeros pasos](#1-primeros-pasos)
2. [Entrar al panel de administración](#2-entrar-al-panel-de-administración)
3. [Los dos modos: edición y vista cliente](#3-los-dos-modos-edición-y-vista-cliente)
4. [Cómo está organizada la web](#4-cómo-está-organizada-la-web)
5. [Editar textos directamente en la página](#5-editar-textos-directamente-en-la-página)
6. [Gestionar subcategorías](#6-gestionar-subcategorías)
7. [Gestionar productos](#7-gestionar-productos)
8. [Gestionar planes](#8-gestionar-planes)
9. [Opciones configurables](#9-opciones-configurables)
10. [Gama, ubicación y CPU: los ejes del catálogo](#10-gama-ubicación-y-cpu-los-ejes-del-catálogo)
11. [Ciclos de facturación](#11-ciclos-de-facturación)
12. [Divisas y precios](#12-divisas-y-precios)
13. [La paleta de colores](#13-la-paleta-de-colores)
14. [Latencia real en las ubicaciones](#14-latencia-real-en-las-ubicaciones)
15. [Conectar con WHMCS](#15-conectar-con-whmcs)
16. [El popup de código promocional](#16-el-popup-de-código-promocional)
17. [Copias de seguridad](#17-copias-de-seguridad)
18. [Seguridad: lo que debes saber](#18-seguridad-lo-que-debes-saber)
19. [Problemas frecuentes](#19-problemas-frecuentes)
20. [Chuleta rápida](#20-chuleta-rápida)

---

## 1. Primeros pasos

Arranca el proyecto:

```bash
npm install
```

```bash
npm run dev
```

Abre la dirección que muestre la consola (normalmente `http://localhost:5173`).

La primera vez que carga, la web copia un catálogo de ejemplo a la base de datos
del navegador: 4 subcategorías, 8 productos y 67 planes. A partir de ahí manda esa
base de datos, no el código: todo lo que edites desde el panel se guarda y persiste.

**Haz esto el primer día, en este orden:**

1. Entra al panel (sección 2).
2. Cambia la contraseña por defecto (pestaña **Datos**).
3. Pon la URL de tu portal WHMCS (pestaña **WHMCS**).
4. Monta tus subcategorías, productos y planes reales (pestaña **Catálogo**).
5. Exporta una copia de seguridad (pestaña **Datos**).

> Si ya venías usando la versión anterior de la web (con categorías y planes, sin
> productos), no tienes que hacer nada: al arrancar se reorganiza sola. Cada categoría
> antigua pasa a ser un producto y se coloca en *Servidores VPS* o *Servidores de
> Juegos* según el tipo que tuviera. Revisa el resultado en la pestaña **Catálogo** y
> mueve a *Hosting Web* lo que corresponda.

---

## 2. Entrar al panel de administración

El acceso está oculto a propósito: un cliente no puede encontrarlo por casualidad.
Hay tres formas, elige la que te resulte cómoda:

| Método | Cómo |
| --- | --- |
| Atajo de teclado | `Ctrl` + `Shift` + `A` |
| Por URL | Añade `#admin` al final de la dirección |
| Click secreto | 5 clicks seguidos en el puntito gris junto al copyright del footer |

Se abre una ventana de login.

> **Credenciales por defecto: usuario `admin`, contraseña `hexadmin`.**

Al entrar se abre el panel lateral y la página pasa a **modo edición**.

La sesión dura hasta que cierres la pestaña. Si vuelves a abrir la web más tarde,
tendrás que entrar de nuevo.

**Para cambiar las credenciales:** panel → pestaña **Datos** → *Credenciales de
administrador*. Escribe el usuario, la contraseña nueva dos veces y pulsa
*Guardar credenciales*. Mínimo 6 caracteres.

---

## 3. Los dos modos: edición y vista cliente

En la barra inferior (sólo visible cuando eres admin) tienes tres botones:

- **Editando / Vista cliente** — alterna entre los dos modos. En *Vista cliente*
  ves exactamente lo que ve un visitante: sin recuadros de edición, con el popup
  promocional activo. Úsalo para comprobar cómo queda algo antes de darlo por bueno.
- **Panel** — abre el cajón lateral de administración.
- **Icono de salida** — cierra la sesión de administrador.

A la izquierda verás también el motor de almacenamiento en uso (`INDEXEDDB` es lo
normal y lo correcto).

---

## 4. Cómo está organizada la web

Hay dos páginas y un recorrido de compra. Conviene tenerlo claro antes de tocar el
catálogo, porque el panel está montado igual.

El menú superior tiene cuatro entradas y nada más: **Inicio**, **Productos**,
**Contacto** y **Nosotros**. Se editan en panel → **Contenido** → *Enlaces del navbar*.

**La portada** (`#/`) da la bienvenida y poco más: titular, métricas, las familias de
producto, cuatro motivos para contratar, las ubicaciones y el contacto. **No lista planes a
propósito**: su único trabajo es llevar al catálogo. *Contacto* del menú baja a su
sección.

**Nosotros** (`#/nosotros`) es la página de quiénes somos: titular, cifras, la historia
en párrafos, los pilares de cómo trabajáis y un cierre que lleva al catálogo. Termina con
la misma sección de contacto.

**El catálogo** (`#/productos`) es la página de productos. Tiene una pestaña por
subcategoría y muestra cada producto como una **box grande**.

**La ficha de un producto** (`#/producto/minecraft`) lo cuenta todo y además lleva el
**configurador**, que es una sola página: los bloques se van abriendo hacia abajo según
elige el cliente, y la vista baja sola al que acaba de aparecer.

| Bloque | Qué ve |
| --- | --- |
| Ficha | Para qué sirve el producto, sus argumentos y desde cuánto sale |
| Ubicación | En qué datacenter lo quiere (sólo si hay varias) |
| CPU | Con qué procesador (sólo si hay varias, y ya filtradas por la ubicación) |
| Planes | Los planes de esa combinación, con sus especificaciones |

Al elegir un plan sí se cambia de pantalla: el **detalle del plan**
(`#/producto/minecraft/plan/…`) con todo lo que incluye, las opciones configurables y el
botón que lleva al carrito de WHMCS con la configuración aplicada.

**Ubicación y CPU aparecen sólo cuando hay algo que elegir.** Es la forma de reproducir
los grupos de productos de WHMCS (una CPU en una ubicación); está explicado en la
[sección 10](#10-ubicación-y-cpu-vender-por-grupos-de-whmcs). Un producto que no las use
enseña la lista de planes directamente.

Lo elegido queda en la dirección (`?ubicacion=…&cpu=…`), así que el botón atrás deshace la
última elección y un enlace reproduce exactamente lo que estaba viendo el cliente.

### Los tres niveles del catálogo

```
subcategoría            producto              plan
Servidores VPS     →    VPS Linux        →    Starter / Pro / Elite / Titan
Serv. de Juegos    →    Minecraft        →    MC Iron / Diamond / Netherite
                        Unturned         →    Basic / Plus / Server Pack
Hosting Web        →    Hosting cPanel   →    Web Start / Pro / Business
```

Y cruzando esos niveles hay un **segundo eje**, la *gama*: el mismo producto en distintas
ligas de hardware (estándar, económica…). No es una subcategoría más — vive en el plan.
Ver *Las gamas* más abajo.

- **Subcategoría** — una pestaña del catálogo. Vienen tres de fábrica: *Servidores VPS*,
  *Servidores de Juegos* y *Hosting Web*.
- **Producto** — la box grande: Minecraft, Unturned, VPS Linux… No tiene precio propio;
  muestra el "desde" del plan más barato.
- **Plan** — lo que el cliente contrata de verdad. Tiene precio y URL de WHMCS.

El botón atrás del navegador funciona en todo el recorrido, y el enlace del último paso se
puede compartir: quien lo abra cae directo en ese plan.

---

## 5. Editar textos directamente en la página

En modo edición, los títulos y descripciones aparecen rodeados por un **recuadro
punteado azul**. Son editables ahí mismo:

1. Haz click sobre el texto.
2. Escribe.
3. Haz click fuera para guardar (o pulsa `Enter` en textos de una línea).
4. `Escape` cancela y deja el texto como estaba.

Funciona en: badge, titular y subtítulo del hero, títulos de todas las secciones,
títulos y descripciones de los features, textos de contacto y descripción del footer. En la página **Nosotros**: el titular, el subtítulo, cada párrafo
de la historia, los pilares y el texto de cierre. También en el catálogo:

- Página de productos: su título y su subtítulo.
- Ficha de un producto: su **nombre**, su **frase corta** y su **descripción**.
- Cabecera de la lista de planes: su **título** y su **subtítulo**.

**Lo que no se edita así** (porque no es texto suelto) está en el panel: botones,
enlaces, métricas, cifras, ubicaciones, iconos, imágenes, precios, especificaciones y
planes.

> El titular del hero tiene un fragmento pintado con degradado. Si cambias el
> titular, actualiza también ese fragmento en panel → **Contenido** → *Fragmento
> resaltado del titular*, y asegúrate de que aparece literalmente en el titular.
> Si no coincide, el titular se ve entero en blanco (no se rompe nada).

---

## 6. Gestionar subcategorías

Panel → pestaña **Catálogo**. Es un árbol: subcategorías, dentro sus productos y dentro
sus planes.

Cada subcategoría es una pestaña de la página de productos.

**Crear:** botón *Nueva*. Aparece con nombre provisional y se despliega para que la
configures.

**Editar:** haz click en el nombre para desplegarla. Tienes:

- **Nombre** — el texto de la pestaña.
- **Slug (URL)** — la dirección de su pestaña (`#/productos/vps`). Se limpia solo:
  minúsculas, sin acentos ni espacios. Si cambias un slug, los enlaces antiguos a esa
  pestaña dejan de valer.
- **Frase corta** — una línea de resumen.
- **Descripción** — el texto que sale bajo las pestañas y en la tarjeta de la portada.
- **Icono** — elige uno de la rejilla.

**Reordenar:** flechas arriba/abajo. El orden del panel es el orden de las pestañas.

**Eliminar:** papelera. Pide confirmación y **borra también sus productos y todos los
planes de esos productos**. No hay deshacer: si dudas, exporta antes una copia.

También puedes crear una subcategoría desde la web: en modo edición, la página de
productos tiene un botón *+ Subcategoría* junto a las pestañas.

---

## 7. Gestionar productos

Un producto es la **box grande** del catálogo: Minecraft, VPS Linux, Hosting cPanel. No
tiene precio propio, lo hereda de sus planes.

Dentro de cada subcategoría desplegada verás su lista de productos. Cada fila muestra el
icono, el nombre, un punto de color con el estado, su slug, cuántos planes tiene y si a
alguno le falta la URL de WHMCS.

- **Crear:** *Añadir producto a [subcategoría]*. Se crea y se abre el editor.
- **Editar:** click en el nombre, o el icono del lápiz.
- **Ocultar o mostrar:** icono del ojo. Un producto oculto sale marcado en amarillo con
  la etiqueta *oculto*.
- **Ver sus planes sin abrir el editor:** icono de cajas.
- **Duplicar:** icono de copiar. **Se lleva también todos sus planes**, así que es la
  vía rápida para montar un producto parecido.
- **Reordenar:** flechas a la izquierda.
- **Eliminar:** papelera, con confirmación. Borra sus planes.

Desde la web, en modo edición, cada box tiene un botón *Editar producto y sus planes*, y
al final de la rejilla hay un recuadro *Añadir producto*.

### El editor de producto

Está organizado por los pasos que ve el cliente.

**Identidad**

| Campo | Para qué sirve |
| --- | --- |
| **Nombre** | El título de la box y de su ficha. |
| **Subcategoría** | Permite mover el producto de pestaña sin recrearlo. |
| **Slug (URL)** | Su dirección (`#/producto/minecraft`). Debajo se ve la ruta resultante. |
| **Etiqueta destacada** | Texto corto opcional tipo *Más vendido* o *Java y Bedrock*. |
| **Frase corta** | Una línea que resume el producto. |
| **Descripción** | El párrafo de la ficha: para quién es y qué resuelve. |
| **Estado** | `Disponible`, `Agotado` o `Próximamente`. Fuera de *Disponible* la box se atenúa y no deja entrar a los planes. |
| **Destacar en el catálogo** | Resalta la box con borde y halo de color. |
| **Ocultar del listado** | Lo saca del catálogo y de la portada sin borrarlo. |
| **Icono** | El que se ve si no pones imagen. |

**Ocultar del listado**, con detalle: el producto desaparece de la página de productos,
de los contadores de las pestañas y de la portada, pero **su página sigue funcionando por
enlace directo**. Sirve para dos cosas: preparar un producto tranquilamente antes de
publicarlo, y vender algo sólo a quien le pases el enlace (precios especiales, pruebas,
clientes concretos). Si quieres que no se pueda contratar de ninguna manera, lo tuyo no
es ocultarlo sino ponerlo en estado *Agotado* o *Próximamente*, o eliminarlo.

En modo edición los productos ocultos se siguen viendo, con borde punteado y la etiqueta
*Oculto*, para que puedas gestionarlos. Pulsa *Vista cliente* para comprobar que
efectivamente ya no aparecen.

**Imagen:** pega una URL o sube un archivo (máximo 1,5 MB). Si la dejas vacía se usa el
icono, que queda perfectamente bien y pesa cero.

**Ficha · Argumentos del producto:** tarjetas de icono + título + descripción que
explican por qué elegir este producto. Se ven en la box del catálogo y en la ficha. Tres
es el número que mejor cuadra en la rejilla.

**Lista de planes · Cabecera:** el título y el subtítulo que preceden a los planes.

**Detalle del plan · Funciones incluidas:** lo que traen **todos** los planes del producto
(anti-DDoS, backups, panel…). Se define una vez aquí y sale en el detalle de cualquiera
de sus planes. Un plan concreto puede sobreescribirlas si lo necesita (sección 8).

**Planes:** al final del editor tienes su lista, con crear, editar, duplicar, reordenar
y eliminar.

En el pie del editor, *Ver en la web* abre la ficha pública del producto para comprobar
cómo ha quedado.

---

## 8. Gestionar planes

Un plan es lo que el cliente contrata: tiene precio, especificaciones y destino en
WHMCS. Se llega a su editor desde la lista de planes del producto, desde el árbol del
panel (icono de cajas → nombre del plan) o desde la web en modo edición (*Editar plan*
en cada tarjeta de la lista de planes).

- **Crear:** *Nuevo plan* / *Añadir plan*. Se crea y se abre el editor.
- **Duplicar:** ideal para montar una gama entera partiendo del primero y cambiando sólo
  RAM y precio.
- **Reordenar:** flechas. Es el orden en que se muestran al cliente.
- **Eliminar:** papelera, con confirmación.

### El editor de plan

| Campo | Para qué sirve |
| --- | --- |
| **Nombre** | El título de la tarjeta. |
| **Producto** | Permite mover el plan a otro producto sin recrearlo. |
| **Descripción** | Opcional. Una línea bajo el nombre; si la dejas vacía, no ocupa espacio. |
| **Precio base** | El precio "desde", escrito en la divisa base del sitio ([sección 11](#11-divisas-y-precios)). Si el plan tiene opciones configurables, es el punto de partida al que se suman los recargos. |
| **Periodo** | El texto junto al precio (`/mes`, `/año`…). Es sólo texto. |
| **Estado** | `Disponible` (se puede contratar), `Agotado` o `Próximamente` (la tarjeta se atenúa y el botón se desactiva). |
| **Plan destacado** | Resalta la tarjeta con borde de color y badge POPULAR. Úsalo con uno por producto, o pierde el efecto. |
| **Ubicación** y **CPU** | El grupo de WHMCS al que pertenece el plan. *Cualquiera* = vale para todas las combinaciones. Ver [sección 10](#10-ubicación-y-cpu-vender-por-grupos-de-whmcs). |

**Especificaciones:** pares etiqueta/valor libres. Son la tabla que compara los planes
en la lista de planes. Consejo: usa **las mismas etiquetas y en el mismo orden** en todos los
planes de un producto, para que se comparen de un vistazo. 4 o 5 filas es el punto
óptimo.

**Todo lo que incluye:** la checklist del detalle del plan, una línea por cosa incluida. Es lo
último que lee el cliente antes de pagar, así que aquí van los argumentos que cierran la
venta. En la tarjeta de la lista se asoman las tres primeras.

**Funciones propias de este plan:** normalmente **déjalo vacío** y se muestran las
funciones del producto (sección 7). Rellénalo sólo cuando un plan concreto ofrezca algo
distinto: en cuanto añades una función aquí, deja de heredar las del producto y se
muestran únicamente las de este plan.

**Destino WHMCS:** ver sección 14.

---

## 9. Opciones configurables

Sirven para que el cliente ajuste su plan antes de comprarlo: RAM extra, disco
adicional, ubicación, backups reforzados…

**Se activan plan por plan.** En el editor, abajo del todo, marca *¿Tiene opciones
configurables?*. Mientras esté desmarcada, el plan se contrata tal cual.

Al activarla aparece el editor de opciones. Cada **opción** tiene un nombre y una
lista de **valores**, y cada valor tiene:

- **Valor** — lo que lee el cliente (`+8 GB`, `Cada 6 h`, `Sin extra`).
- **Recargo** — lo que se suma al precio base. `0` significa "incluido".
- **ID WHMCS** — ver más abajo.
- **Por defecto** — el valor preseleccionado. Uno por opción.

Cuando un plan tiene opciones:

- Su tarjeta de la lista muestra **"Desde"** encima del precio y avisa de cuántas
  opciones personalizables tiene.
- En el detalle del plan aparece un bloque *Configura tu plan* a la derecha, donde el cliente
  elige y ve el total actualizarse en tiempo real.
- El botón *Continuar al pago* lleva a WHMCS con las opciones ya aplicadas.

> **Ejemplo.** Plan a 11,99 con una opción "RAM adicional" de valores
> *Sin extra* (0), *+8 GB* (6) y *+16 GB* (11). El cliente que elija +16 GB verá
> un total de 22,99 y llegará a WHMCS con esa configuración.

### Los IDs de WHMCS (importante)

Para que WHMCS aplique de verdad la opción y no sólo el producto base, necesitas
dos números que salen de tu propio WHMCS:

- **ID de la opción configurable** — se pone en el campo de la opción.
- **ID del valor** — se pone en la columna *ID WHMCS* de cada valor.

Con ambos, la URL final incluye `configoption[3]=7` y WHMCS lo entiende.

Si los dejas vacíos, la web sigue funcionando: calcula bien el precio, muestra bien
las opciones y arrastra la selección a la URL como texto informativo — pero **WHMCS
no la aplicará**, y el cliente tendrá que elegirla otra vez en el carrito.

**Dónde encontrar esos IDs:** en WHMCS, *Configuración → Productos/Servicios →
Opciones configurables*. Abre el grupo y mira la URL o el código de cada opción y
de cada valor.

---

## 10. Gama, ubicación y CPU: los ejes del catálogo

En WHMCS un **grupo de productos** suele ser una CPU en una ubicación: *Minecraft ·
Santiago · Ryzen 7950X* es un grupo, y *Minecraft · Miami · Ryzen 5950X* es otro, cada
uno con sus productos y sus PIDs. La web reproduce eso mismo: cada plan puede decir en
qué ubicación y con qué CPU se sirve, y el cliente elige antes de ver la lista.

```
ficha del producto  →  ubicación  →  CPU  →  planes      (todo en la misma página)
                                              └→  detalle del plan  →  WHMCS
```

**Los bloques aparecen solos.** No hay que activar nada:

| Situación entre los planes del producto | Qué ve el cliente |
| --- | --- |
| Dos o más ubicaciones | El bloque *Elige la ubicación* |
| Dos o más CPUs (en la ubicación elegida) | El bloque *Elige el procesador* |
| Una sola opción | Se da por elegida, sin bloque ni click de más |
| Ninguna | La lista de planes directamente, como siempre |

Un plan que deje **Cualquiera** en ubicación o CPU es comodín: aparece elija lo que
elija el cliente. Es lo que traen los productos que no usan esta división (VPS, hosting),
y por eso siguen funcionando igual que antes.

### Montarlo paso a paso

1. **Ubicaciones** — panel → **Contenido** → *Ubicaciones*. Son las mismas que salen en
   la portada, no hay una lista aparte.
2. **CPUs** — panel → **Catálogo** → *CPUs*. Cada una tiene nombre, frase corta,
   descripción, icono y una etiqueta opcional (*Recomendada*). La descripción es lo que
   lee el cliente al elegir, así que explica para qué encaja cada una.
3. **Planes** — en el editor de cada plan, bloque *Ubicación y CPU*. Elige las dos y
   pon **el PID de ese grupo concreto de WHMCS**, que es distinto para cada combinación.
4. Repite el plan para cada combinación que vendas. Lo rápido: monta uno, **duplícalo**
   (icono de copiar) y cambia sólo ubicación, CPU, precio y PID.

> **Ejemplo.** El catálogo de ejemplo trae los dos casos: **Minecraft** con 4 ubicaciones
> × 2 CPUs × 3 niveles = 24 planes con 24 PIDs, y **Unturned** con 4 ubicaciones y una
> sola CPU = 12 planes, donde el bloque de procesador ni aparece. Entra en cada uno y
> recorre el configurador para verlo.

### Detalles que conviene saber

- Las CPUs que se ofrecen dependen de la ubicación elegida: si en Ohio sólo tienes una,
  ahí no aparece el bloque de CPU aunque en Santiago haya dos.
- Cada tarjeta de ubicación y de CPU muestra cuántos planes hay y desde qué precio.
- Lo elegido se queda marcado con un check y sigue a la vista: para cambiarlo no hay que
  volver atrás, basta con pulsar otra tarjeta.
- Si borras una CPU, los planes que la usaban quedan como *Cualquiera*: no se pierde
  ningún plan.
- Los enlaces del recorrido antiguo por pasos (`…/ubicacion`, `…/planes/…`) siguen
  funcionando: llevan al configurador con lo que ya trajera elegido.

### Las gamas: el segundo eje

La subcategoría dice **qué** vendes (VPS, juegos, web). La gama dice **en qué liga juega**
ese mismo producto: estándar, económica, premium… Son dos preguntas distintas y conviene no
mezclarlas.

Antes esto estaba montado al revés: una subcategoría *Económicos* con *Minecraft Económico*
y *Unturned Económico* dentro, como si fueran productos distintos. El problema era de
venta, no de orden: **el mismo juego quedaba partido en dos pestañas**, y quien entraba
buscando Minecraft no llegaba a ver que había una versión más barata.

Ahora la gama cuelga del **plan**, igual que la ubicación y la CPU. Minecraft es un solo
producto con 24 planes en gama estándar y 12 en económica, y el cliente los ve juntos.

**Gestionarlas:** panel → Catálogo → *Gamas*. Vienen dos de fábrica (Estándar y Económica)
y puedes crear, renombrar, reordenar y borrar. El orden es el que ve el cliente, así que la
gama buena va primero. Borrar una gama no borra planes: los deja «sin gama», que equivale a
válidos para cualquiera.

**Asignarlas:** en el editor de cada plan, campo *Gama*.

**El bloque sólo aparece si hay algo que elegir.** Si todos los planes de un producto están
en la misma gama, el cliente no ve ningún paso extra.

#### Juntar dos productos duplicados

Si tu catálogo ya está partido, no hace falta mover los planes a mano. Panel → Catálogo →
**Fusionar productos como gamas**:

1. Elige el producto **que se disuelve** y el **que se queda**.
2. Elige la gama que reciben los planes que llegan, y la de los que ya había.
3. Antes de ejecutar te enseña con números qué va a pasar («12 planes → Minecraft como
   Económica»). Pide confirmación porque **borra el producto absorbido y no se deshace**.

Después la subcategoría vieja se queda vacía y la borras a mano. Revisa los enlaces del pie
y del navbar por si alguno apuntaba a ella.

---

## 11. Ciclos de facturación

Opcional y **apagado de fábrica**. Panel → Catálogo → *Ciclos de facturación*.

Añade sobre el catálogo un selector mensual / trimestral / semestral / anual con el
descuento que tú pongas a cada uno. El panel enseña en vivo cómo queda un plan de 10 €.

El precio que se anuncia es **siempre el equivalente mensual ya rebajado** (5,99 € pasa a
5,09 €/mes con un 15 %), y debajo se aclara el cargo real: «61,08 € cada 12 meses». Se hace
así para que los planes sigan siendo comparables entre sí, que es lo que se rompe cuando
unos precios son mensuales y otros anuales.

> **Importante.** Estos porcentajes son una promesa de precio que la web no puede
> comprobar. Tienen que ser los que WHMCS cobra de verdad en cada ciclo: si aquí pones un
> 15 % anual que allí no existe, el cliente llega al carrito con otro número. El ciclo
> elegido sí viaja al carrito; la otra mitad del trato es configurarlo en WHMCS.

Un ciclo al 0 % no aparece en el selector: serían botones que no cambian nada.

---
## 12. Divisas y precios

Panel → **Catálogo** → *Divisas*. El visitante cambia de moneda desde el selector del
navbar y los precios se recalculan al instante.

**La idea:** los precios de los planes se escriben **una sola vez**, en la divisa base
(de fábrica, USD). Las demás son conversiones que hace el navegador con el cambio que tú
fijas aquí.

| Campo | Para qué sirve |
| --- | --- |
| **Divisa base** | En la que escribes los precios de los planes. Su cambio es siempre 1. |
| **Divisa por defecto** | La que ve quien entra por primera vez. De fábrica, CLP. |
| **Código** | El de tres letras: `CLP`, `USD`, `EUR`… |
| **Nombre** | Lo que lee el visitante en el desplegable. |
| **Cambio** | Cuántas unidades de esa divisa es 1 de la base. Si 1 USD = 950 CLP, pones 950. |
| **Id WHMCS** | El id de esa divisa en tu WHMCS. Si lo rellenas, el carrito se abre en la misma moneda que estaba viendo el cliente. |
| **Formato** | El código regional (`es-CL`, `en-US`, `es-ES`) que decide el símbolo y los separadores. Al lado se ve cómo quedaría un plan de 10. |

Los decimales los pone cada divisa: CLP sale sin céntimos (`$2.660`) y USD con ellos
(`$2.80`), sin que tengas que configurar nada.

> **Los cambios los actualizas tú.** Aquí no hay servidor que consulte cotizaciones, y
> colgar tus precios de una API ajena sería dejarlos en manos de un tercero. Si el peso se
> mueve mucho, entra y ajusta el número.

La divisa elegida se guarda en el navegador del visitante, así que la próxima vez la
encuentra puesta. Y si dejas una sola divisa configurada, el selector desaparece del
navbar.

---

## 13. La paleta de colores

Panel → pestaña **Diseño**. Cambia el aspecto de toda la web sin tocar código, y se ve
al momento en la página que hay detrás del panel.

### Estilo: nítido, sobrio o vivo

Lo primero de la pestaña. Son tres modos del mismo diseño, no tres diseños:

| Estilo | Qué hace |
| --- | --- |
| **Nítido** (de fábrica) | El lenguaje de los hosts modernos: nada de cristal translúcido, sino tarjetas opacas de borde fino, esquinas más cerradas, rejilla reglada de fondo en vez de halos, y el hero partido en dos columnas con una consola al lado del titular. |
| **Sobrio** | Fondo casi negro, tarjetas planas, halos apenas insinuados y nada que se mueva de fondo. |
| **Vivo** | El aspecto original: halos grandes de color a la deriva, degradados en el titular y en los botones, precios en pixel. |

Se cambia en un click y se vuelve igual de rápido: **nada se pierde al alternar**. Abajo
del todo, en *Restablecer*:

- **El diseño de HexServers (Noche · Nítido)** — la combinación declarada, la que se cuida
  y contra la que se prueba todo. Si trasteando se te descuadra algo, este botón vuelve a
  terreno conocido.
- **Recuperar el aspecto original (Hex · Vivo)** — deja la web como estaba antes del
  rediseño: azul eléctrico, halos, degradados y pixel.

**Combinaciones** — ocho paletas listas. *Noche* (la de fábrica), *Grafito*, *Bosque*,
*Brasa*, *Arctic*, *Hex (original)*, *Violeta* y *Acero*. Un click y el sitio se repinta.

### Iconos pixel animados

Sprites de 8 bits en dos sitios contados: la píldora del hero y el sello del pie. Se
encienden y apagan con un interruptor, y hay una tira de vista previa al lado.

Estaban también en el antetítulo de cada sección y se quitaron a propósito: **un guiño que
sale seis veces al bajar deja de ser un guiño y pasa a ser el estilo de la web**. Si el
visitante tiene activado «reducir movimiento» en su sistema, se quedan quietos.

### El selector del visitante

En el navbar, junto al de divisa, hay un icono de paleta: desde ahí **quien visita la web
puede ajustarla a su gusto** — estilo (nítido, sobrio o vivo), color y fondo, incluido un color de
fondo elegido por él.

Lo importante de cómo está montado:

- **No toca tu sitio.** Su elección se guarda en su navegador, igual que la divisa. Lo que
  tú configures en esta pestaña sigue siendo lo que ve todo el mundo al entrar.
- El botón *Volver a los colores del sitio* le devuelve a tu configuración.
- **Cualquier fondo se oscurece antes de aplicarse.** Se respeta el tono que elija, pero
  se le baja el brillo: el diseño es texto claro sobre cristal y con un fondo claro no se
  leería nada. Si elige blanco, acaba en gris muy oscuro.
- Si prefieres que tu web se vea siempre igual, apágalo con el interruptor
  **Dejar que el visitante ajuste la apariencia**, más abajo en esta misma pestaña.

> Si estabas mirando la web con tu propia apariencia y entras a editar la paleta del
> sitio, tu preferencia local se descarta automáticamente: si no, estarías cambiando
> colores sin poder verlos.

**Colores base** — si prefieres los tuyos, hay cinco:

| Color | Dónde se nota |
| --- | --- |
| **Principal** | Botones, enlaces, halos, estados activos, badges. Es el que manda. |
| **Acento** | Degradados (logo, titular de la portada) y el segundo resplandor del fondo. |
| **Fondo** | El lienzo de toda la web. |
| **Superficie** | Modales, menús desplegables y el propio panel. |
| **Texto base** | El color de referencia del cuerpo de texto. |

Cada uno se pega en hexadecimal (`#4f7cff`) o se elige con el selector del sistema. De
los dos primeros salen **rampas completas** de tonos claros y oscuros, que es lo que usan
los degradados, los bordes y los halos: por eso con dos colores ya tienes el sitio
coherente. La tira *Rampa generada* enseña el resultado y debajo hay una muestra con
botones, etiquetas y un enlace para comprobar que todo se lee bien.

Consejos:

- Mantén el **fondo muy oscuro**. El diseño es de tipo *glass* (cristal translúcido) y
  con fondos claros se pierde el contraste de las tarjetas. En modo sobrio el cristal es
  aún más tenue, así que un fondo claro se nota todavía más.
- La **superficie** debe ser un punto más clara que el fondo, no al revés.
- Si te pierdes, *Valores de fábrica* deja los colores y el estilo iniciales.

La paleta se guarda con el resto del contenido, así que viaja en las copias de seguridad
(sección 16).

---

## 14. Latencia real en las ubicaciones

Las píldoras de milisegundos de *Ubicaciones disponibles* no son texto decorativo: se
miden de verdad, desde el navegador de cada visitante, en el momento en que la sección
aparece en pantalla.

**Aviso importante, para que no vendas algo que no es:** un navegador no puede hacer el
`ping` de consola (ICMP no existe en la web). Lo que se mide es el ida y vuelta de una
petición HTTP mínima contra un endpoint tuyo en esa ubicación. Sale unos pocos
milisegundos por encima del `ping` de terminal porque incluye el tiempo que tarda el
servidor en contestar. A cambio es un número más honesto para el cliente: es *su*
latencia, desde *su* conexión, no la que mediste tú desde la oficina.

### Qué necesitas en cada ubicación

Un archivo diminuto servido por HTTPS **desde ese datacenter**. Lo más limpio es una
respuesta vacía en `/ping`. Si usas nginx:

```nginx
location = /ping {
    add_header Cache-Control "no-store" always;
    return 204;
}
```

También sirve cualquier archivo pequeño ya existente (un favicon, por ejemplo). Lo único
imprescindible es que esté alojado **en esa ubicación**, porque si no estarías midiendo
otra cosa.

### Cómo configurarlo

Panel → **Contenido** → *Ubicaciones*. Cada ubicación tiene dos filas:

- Primera fila: bandera, ciudad, país.
- Segunda fila: **valor fijo**, **endpoint** y **estado**.

| Campo | Para qué sirve |
| --- | --- |
| **Bandera** | El emoji (`🇨🇱`) o el código de dos letras del país (`CL`). A la izquierda ves la bandera que se va a dibujar. |
| **Valor fijo** | El número que se muestra si no hay endpoint o si la medición está desactivada. |
| **Endpoint** | La URL que se mide en vivo (`https://scl.tudominio.com/ping`). |
| **Estado** | `Online` o `Próximamente`. Las de *Próximamente* no se miden nunca. |

> **Las banderas se dibujan, no son emoji.** Windows no tiene glifos para los emoji de
> bandera y los pinta como dos letras sueltas («CL», «US»), así que la web las dibuja
> ella misma y se ven igual en cualquier sistema. Hay dibujo para Chile, EE. UU.,
> Argentina, Brasil, Perú, Colombia, México, España, Alemania, Francia y Reino Unido; si
> pones otro país se usa su emoji, y si dejas el campo vacío, un globo.

Arriba de la lista, el interruptor **Medir la latencia en vivo** apaga la medición de
golpe para todas.

### Qué ve el cliente

| Píldora | Significa |
| --- | --- |
| `12 ms` en verde | Medido. Por debajo de 60 ms. |
| `85 ms` en ámbar | Medido. Entre 60 y 150 ms. |
| `210 ms` en rojo | Medido. Por encima de 150 ms. |
| `4 ms` en gris | **No medido**: es el valor fijo, porque esa ubicación no tiene endpoint. |
| *Midiendo…* | Medición en curso, dura un instante. |
| *Sin respuesta* en rojo | El endpoint no contestó. Revísalo. |
| *Próximamente* en ámbar | Ubicación marcada como no disponible. |

Debajo de la rejilla, un aviso explica de dónde sale el número y hay un botón *Medir de
nuevo*. Ambos desaparecen si ninguna ubicación tiene endpoint. El texto del aviso lo
cambias en el mismo sitio del panel.

**Dos cosas que suelen fallar:**

- Si tu web va por HTTPS, el endpoint **también** debe ir por HTTPS. El navegador bloquea
  contenido mixto sin avisar y verás *Sin respuesta*.
- Un host que no existe no da un número bajo, da *Sin respuesta*. Está hecho a propósito
  para que un servidor caído no aparezca como «2 ms».

---

## 15. Conectar con WHMCS

### Lo mínimo para vender

Panel → pestaña **WHMCS** → *URL base del portal*. Pon la raíz de tu WHMCS, por
ejemplo `https://billing.tudominio.com`. Sin barra final.

Después, en cada plan (editor → *Destino WHMCS*), rellena **una** de estas dos cosas:

- **PID en WHMCS** — el número de producto. Es lo más cómodo: la web compone sola
  `https://billing.tudominio.com/cart.php?a=add&pid=12`.
- **URL completa** — si necesitas una dirección concreta (un enlace de campaña, un
  dominio distinto, un carrito personalizado). Si la rellenas, tiene prioridad
  sobre el PID.

El botón **Abrir URL** del editor te muestra el enlace exacto que se generará y te
deja probarlo en una pestaña nueva. Debajo aparece la URL en texto para que la
revises.

> Los planes de ejemplo traen PIDs ficticios (11–16, 21–23, 31–33, 41–43, 51–53, 61–62).
> Sustitúyelos por los tuyos o los clientes acabarán en productos que no existen.

Un plan sin PID ni URL avisa en el panel (*sin URL WHMCS*, en ámbar), y su fila de
producto avisa de cuántos planes están sin configurar. En la web, el detalle de ese plan
muestra un recuadro ámbar y el botón de pago queda desactivado.

**Dónde encontrar el PID:** en WHMCS, *Configuración → Productos/Servicios*. Al
abrir un producto, el número aparece en la URL como `id=12`.

### Área de clientes y panel de juegos

En la misma pestaña puedes fijar la *URL del área de clientes*. Los dos accesos del
menú superior (Portal de Clientes y Panel de Juegos) se editan en panel →
**Contenido** → *Accesos del navbar*: etiqueta, URL y descripción de cada uno.

### La API de WHMCS

Los campos de *endpoint*, *identifier* y *secret* están preparados pero **no
funcionan todavía, y es intencionado**.

El motivo: esas credenciales dan control sobre tu facturación y esta web se ejecuta
entera en el navegador del visitante. Cualquiera podría leerlas. Además WHMCS
rechaza por seguridad las llamadas hechas desde un navegador.

Para sincronizar productos, precios y stock reales hace falta un pequeño servicio
en tu servidor que guarde las credenciales y hable con WHMCS por ti. Cuando lo
tengas, pones su dirección en *URL del proxy backend*, activas la integración y el
botón *Probar sincronización* empieza a tener sentido.

Mientras tanto, el catálogo se sirve de la base de datos local, que es exactamente
lo que estás editando en el panel.

---

## 16. El popup de código promocional

Panel → pestaña **Promo**.

- **Popup activo** — el interruptor general. Desactivado, no aparece a nadie.
- **Código** — el que copia el cliente. *Generar* crea uno aleatorio tipo `HEX4K7P`
  (sin caracteres confusos como O/0 o I/1).
- **Badge, título, descripción, aviso de caducidad** — el contenido de la ventana.
- **Segundos hasta mostrarlo** — el temporizador. 8 segundos es un buen punto medio.
- **Mostrar también al hacer scroll** — lo adelanta si el visitante baja de media
  pantalla, sin esperar al temporizador.
- **Texto y destino del botón** — normalmente lleva al catálogo (`#/productos`).

El popup también aparece si el visitante mueve el ratón hacia arriba como para
cerrar la pestaña. Aparezca por lo que aparezca, sólo lo hace **una vez por visita**.

**Cosas a tener en cuenta:**

- En modo edición el popup no sale. Cambia a *Vista cliente* para verlo.
- Si el visitante marca "No volver a mostrar", se recuerda **para ese código**.
  Cambia el código y volverá a verlo.
- Para volver a verlo tú mismo mientras pruebas: botón *Reiniciar «no volver a
  mostrar» en este navegador*.

### Que el descuento se aplique de verdad

Enseñar el código no lo activa. Abajo del todo, en *Promocode enviado a WHMCS*,
escribe el mismo código. A partir de ahí se añade a todos los enlaces de
contratación y llega aplicado al carrito.

Ese código **debe existir en WHMCS** (*Configuración → Promociones*) con el mismo
nombre exacto. Si no existe, WHMCS lo ignora sin avisar.

---

## 17. Copias de seguridad

Los datos viven **en el navegador de este ordenador**. No hay servidor. Eso
significa que se pierden si limpias los datos del navegador, si usas modo
incógnito o si cambias de equipo.

Panel → pestaña **Datos**:

- **Exportar JSON** — descarga un archivo con todo el contenido, fechado.
- **Importar JSON** — carga un archivo exportado y reemplaza el contenido actual.
- **Restaurar valores de fábrica** — vuelve al catálogo de ejemplo. Borra todo tu
  trabajo. Pide confirmación.

**Exporta después de cada sesión de cambios importantes.** Es un archivo pequeño y
te ahorra rehacer el catálogo entero.

La exportación **no incluye** tu contraseña de administrador ni las credenciales de
la API de WHMCS, a propósito: así puedes pasar el archivo a alguien o guardarlo en
la nube sin regalar accesos. Al importar, tus credenciales actuales se mantienen.

---

## 18. Seguridad: lo que debes saber

Dicho sin rodeos, para que no te lleves sorpresas:

**El login de administrador no es seguridad real.** Impide que un visitante curioso
entre al modo edición, y para eso está bien. Pero toda la web se ejecuta en el
navegador del cliente: alguien con conocimientos técnicos puede leer los datos
locales. La contraseña se guarda cifrada (PBKDF2-SHA256 con salt), nunca en claro,
pero eso no cambia lo anterior.

Consecuencias prácticas:

- **No guardes nada confidencial** en los textos del sitio.
- **No pongas el secret de la API de WHMCS** hasta que exista el proxy en servidor.
- Editar el sitio en un ordenador compartido implica que quien lo use después puede
  tocar el contenido si no cerraste sesión.
- Cambia la contraseña por defecto. Si `admin`/`hexadmin` sigue puesta, el aviso
  amarillo del login lo recuerda.

Cuando la web pase a producción con un backend detrás, la verificación de la
contraseña debe moverse al servidor.

---

## 19. Problemas frecuentes

**He editado algo y al recargar volvió atrás.**
Comprueba que en la barra inferior pone `INDEXEDDB`. Si pone `localStorage
(fallback)`, el navegador está bloqueando la base de datos: suele ser el modo
incógnito o una configuración de privacidad estricta. En fallback los datos siguen
guardándose, pero con menos capacidad y menos garantías.

**El popup promocional no aparece.**
Tres motivos, por orden de probabilidad: estás en modo edición (cambia a *Vista
cliente*); ya lo cerraste en esta visita (recarga); marcaste "no volver a mostrar"
(usa el botón de reinicio en la pestaña Promo).

**El botón de pago del detalle está desactivado y sale un aviso ámbar.**
Ese plan no tiene PID ni URL de WHMCS. Editor del plan → *Destino WHMCS*.

**El cliente llega a WHMCS pero sin las opciones que eligió.**
Faltan los IDs de WHMCS en las opciones configurables. Sección 9.

**Una ubicación dice «Sin respuesta».**
El endpoint no contestó. Compruébalo abriéndolo en el navegador. Si tu web va por HTTPS y
el endpoint por HTTP, el navegador lo bloquea. Sección 13.

**Un producto no aparece en el catálogo aunque tiene planes.**
Estará oculto. Panel → Catálogo → icono del ojo, o el interruptor *Ocultar del listado*
del editor. Recuerda que en modo edición sí se ve, marcado como *Oculto*.

**No me sale el bloque de ubicación (o el de CPU).**
Sólo aparece con dos o más opciones distintas entre los planes de ese producto. Revisa
que cada plan tenga asignada la suya en su editor; los que estén en *Cualquiera* no
cuentan para el recorrido. Sección 10.

**Elijo ubicación y CPU y me dice que no hay planes.**
No existe ningún plan para esa combinación. O creas el que falta, o quitas esa ubicación
de los planes para que deje de ofrecerse.

**He cambiado la paleta y no se lee bien.**
Panel → Diseño → *Valores de fábrica*, y prueba otra vez cambiando sólo el color
principal. El fondo debe quedarse muy oscuro. Sección 12.

**Prefiero el diseño que tenía antes.**
Panel → Diseño → *Recuperar el aspecto original (Hex · Vivo)*. Vuelve tal cual estaba, y
puedes ir y venir entre los dos estilos las veces que quieras. Sección 12.

**La latencia sale en gris y no cambia nunca.**
Esa ubicación no tiene endpoint configurado: lo que ves es el valor fijo. Panel →
Contenido → Ubicaciones → campo del endpoint.

**Un enlace del menú lleva a una pestaña que ya no existe.**
Habrás cambiado el slug de una subcategoría. Panel → Contenido → *Enlaces del navbar*,
y pon la ruta nueva (`#/productos/tu-slug`).

**Han aparecido enlaces nuevos en el menú al actualizar.**
Mientras no toques el menú, se actualiza solo cuando cambia la estructura de la web. En
cuanto añadas o edites un enlace tú, deja de tocarse: lo que pongas manda.

**Una box de producto dice "No disponible" y no deja entrar.**
O el producto está en *Agotado* / *Próximamente*, o no tiene ningún plan creado.

**En el detalle de un plan no salen las funciones que esperaba.**
Si el plan tiene alguna función propia, deja de heredar las del producto. Vacía la lista
*Funciones propias de este plan* para volver a las comunes. Sección 8.

**El titular del hero se ve todo blanco, sin el degradado.**
El *fragmento resaltado* ya no coincide con el titular. Panel → Contenido → cópialo
tal cual aparece en el titular.

**He borrado una subcategoría o un producto por error.**
No hay deshacer, y se van con sus planes. Importa tu última copia de seguridad (pestaña
Datos). Si no tienes ninguna, hay que rehacerlo a mano.

**Quiero empezar de cero.**
Pestaña Datos → *Restaurar valores de fábrica*. Vuelve el catálogo de ejemplo y se
restablecen las credenciales por defecto.

---

## 20. Chuleta rápida

| Acción | Dónde |
| --- | --- |
| Abrir el login | `Ctrl`+`Shift`+`A`, `#admin`, o 5 clicks en el punto del footer |
| Credenciales iniciales | `admin` / `hexadmin` |
| Cambiar contraseña | Panel → Datos |
| Ver la web como un cliente | Barra inferior → *Vista cliente* |
| Editar un título | Click directo sobre él en modo edición |
| Crear subcategoría | Panel → Catálogo → *Nueva* |
| Crear producto | Panel → Catálogo → *Añadir producto a…* |
| Crear plan | Editor del producto → *Nuevo plan* |
| Ocultar un producto del listado | Panel → Catálogo → icono del ojo |
| Cambiar un producto de subcategoría | Editor del producto → *Subcategoría* |
| Cambiar un plan de producto | Editor del plan → *Producto* |
| Crear o editar CPUs | Panel → Catálogo → *CPUs* |
| Asignar ubicación y CPU a un plan | Editor del plan → *Ubicación y CPU* |
| Cambiar los colores de la web | Panel → Diseño |
| Bajar el ruido visual (o subirlo) | Panel → Diseño → *Estilo* |
| Quitar el selector de apariencia del navbar | Panel → Diseño → *Apariencia del visitante* |
| Dejar la web como estaba antes | Panel → Diseño → *Recuperar el aspecto original* |
| Funciones comunes a todos los planes | Editor del producto → *Funciones incluidas* |
| Qué incluye un plan concreto | Editor del plan → *Todo lo que incluye* |
| Activar opciones configurables | Editor del plan → abajo → checkbox |
| Conectar un plan con WHMCS | Editor del plan → *Destino WHMCS* → PID |
| Probar el enlace de compra | Editor del plan → *Abrir URL* |
| Textos de los bloques del configurador | Panel → Contenido → *Página de productos* |
| Cambiar divisas o el tipo de cambio | Panel → Catálogo → *Divisas* |
| Medir la latencia de verdad | Panel → Contenido → Ubicaciones → campo del endpoint |
| Editar la página Nosotros | Click directo en la página, o Panel → Contenido → *Página Nosotros* |
| Cambiar los enlaces del menú | Panel → Contenido → *Enlaces del navbar* |
| Cambiar el código promocional | Panel → Promo |
| Que el descuento se aplique | Panel → Promo → *Promocode enviado a WHMCS* |
| Copia de seguridad | Panel → Datos → *Exportar JSON* |
| Empezar de cero | Panel → Datos → *Restaurar valores de fábrica* |

**Rutas de la web**

| Ruta | Página |
| --- | --- |
| `#/` | Portada |
| `#/nosotros` | Nosotros |
| `#/productos` | Catálogo completo |
| `#/productos/vps` | Catálogo filtrado por subcategoría |
| `#/producto/minecraft` | Ficha del producto |
| `#/producto/minecraft/ubicacion` | Elegir ubicación |
| `#/producto/minecraft/cpu/…` | Elegir CPU |
| `#/producto/minecraft/planes` | Planes disponibles |
| `#/producto/minecraft/plan/…` | Detalle del plan |

---

**Atajos de teclado**

| Tecla | Efecto |
| --- | --- |
| `Ctrl`+`Shift`+`A` | Abrir login, o el panel si ya has entrado |
| `Escape` | Cerrar modal o panel; cancelar una edición de texto |
| `Enter` | Confirmar un texto de una línea |
| `Ctrl`+`Enter` | Confirmar un texto de varias líneas |
