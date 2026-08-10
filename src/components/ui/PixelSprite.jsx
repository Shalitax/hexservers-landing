import { cx } from '../../lib/utils.js'
import { useSite } from '../../store/useSite.js'

/**
 * Iconos de pixel art animados.
 *
 * El dibujo se escribe como una rejilla de caracteres en vez de como un SVG o un
 * PNG, por dos motivos. Uno, se lee y se retoca a ojo: lo que se ve aquí abajo es
 * literalmente lo que se pinta. Y dos, se colorea solo — cada carácter es un papel
 * (trazo, acento, sombra), no un color fijo, así que los sprites siguen la paleta
 * del sitio en lugar de traer la suya y desentonar cada vez que se cambia el tema.
 *
 * La animación son dos fotogramas que se alternan a saltos (`steps`), como en una
 * consola de 8 bits: nada de interpolar, que es justo lo que rompería el efecto.
 * Las reglas están en index.css junto al resto de animaciones.
 *
 * Todo esto sólo aparece si está encendido en el panel → Diseño. Ver `useSprites`.
 */

/* Papel de cada carácter de la rejilla. El punto es transparente. */
const INK = {
  '#': 'currentColor',
  o: 'var(--color-plasma-400)',
  x: 'rgb(255 255 255 / 0.28)',
  '+': 'rgb(255 255 255 / 0.85)',
}

/**
 * Los dibujos. Cada sprite son dos fotogramas de 8×8; lo que cambia entre ellos es
 * lo que da la sensación de movimiento (las patas del marciano, el led del rack,
 * la llama del cohete…). El segundo fotograma es opcional: sin él, el sprite se
 * queda quieto y sólo pone el detalle gráfico.
 */
export const SPRITES = {
  /* Marciano de recreativa: mueve las patas. */
  invader: [
    ['..#..#..', '...##...', '..####..', '.##oo##.', '########', '#.####.#', '#.#..#.#', '...#.#..'],
    ['..#..#..', '...##...', '..####..', '.##oo##.', '########', '#.####.#', '#.#..#.#', '..#...#.'],
  ],
  /* Rack de servidores: los leds van alternando. */
  server: [
    ['.######.', '.#o..x#.', '.######.', '.#x..o#.', '.######.', '.#o..x#.', '.######.', '..#..#..'],
    ['.######.', '.#x..o#.', '.######.', '.#o..x#.', '.######.', '.#x..o#.', '.######.', '..#..#..'],
  ],
  /* Cohete: la llama parpadea. */
  rocket: [
    ['...##...', '..####..', '..#oo#..', '..#oo#..', '..####..', '.##..##.', '...xx...', '...x....'],
    ['...##...', '..####..', '..#oo#..', '..#oo#..', '..####..', '.##..##.', '..#xx#..', '...xx...'],
  ],
  /* Corazón: late encogiéndose. */
  heart: [
    ['.##..##.', '########', '########', '#oooooo#', '.######.', '..####..', '...##...', '........'],
    ['........', '.##..##.', '.######.', '.#oooo#.', '..####..', '...##...', '........', '........'],
  ],
  /* Moneda: gira sobre su eje. */
  coin: [
    ['..####..', '.#oooo#.', '#oo##oo#', '#o.##.o#', '#o.##.o#', '#oo##oo#', '.#oooo#.', '..####..'],
    ['...##...', '..#oo#..', '..#oo#..', '..#oo#..', '..#oo#..', '..#oo#..', '..#oo#..', '...##...'],
  ],
  /* Escudo: el núcleo se enciende y se apaga. */
  shield: [
    ['.######.', '#oooooo#', '#o####o#', '#o####o#', '#oo##oo#', '.#o##o#.', '..#oo#..', '...##...'],
    ['.######.', '#o....o#', '#o.++.o#', '#o.++.o#', '#oo..oo#', '.#o..o#.', '..#..#..', '...##...'],
  ],
  /* Rayo: alterna el relleno. */
  bolt: [
    ['....##..', '...##...', '..##....', '.#####..', '...oo#..', '..oo#...', '.oo#....', '.#......'],
    ['....##..', '...##...', '..##....', '.#####..', '...##...', '..##....', '.##.....', '.#......'],
  ],
  /* Mando: los botones parpadean. */
  pad: [
    ['........', '.######.', '#..##..#', '#.####o#', '#..##.o#', '#......#', '.##..##.', '........'],
    ['........', '.######.', '#..##..#', '#.####.#', '#..##oo#', '#......#', '.##..##.', '........'],
  ],
}

export const SPRITE_NAMES = Object.keys(SPRITES)

/**
 * Fila de la rejilla → rectángulos, uniendo los píxeles seguidos del mismo color.
 *
 * Sin unirlos, un sprite de 8×8 puede salir con 64 rectángulos y una portada llena
 * de ellos son varios miles de nodos para lo que es puro adorno. Al agrupar por
 * tramos, la mayoría de filas caben en uno o dos.
 */
function runsOf(row) {
  const runs = []
  let start = 0
  while (start < row.length) {
    const char = row[start]
    let end = start + 1
    while (end < row.length && row[end] === char) end++
    if (INK[char]) runs.push({ x: start, width: end - start, fill: INK[char] })
    start = end
  }
  return runs
}

function Frame({ rows, className }) {
  return (
    <g className={className}>
      {rows.flatMap((row, y) =>
        runsOf(row).map((run) => (
          <rect
            key={`${y}-${run.x}`}
            x={run.x}
            y={y}
            width={run.width}
            height={1}
            fill={run.fill}
          />
        )),
      )}
    </g>
  )
}

/**
 * Un sprite suelto. `speed` es la duración del ciclo completo de los dos
 * fotogramas: cuanto más alto, más tranquilo.
 */
export default function PixelSprite({ name, size = 16, speed = '0.9s', className = '' }) {
  const frames = SPRITES[name] || SPRITES.invader
  const [first, second] = frames

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 8 8"
      shapeRendering="crispEdges"
      aria-hidden="true"
      focusable="false"
      className={cx('inline-block shrink-0 align-[-0.15em]', className)}
      style={{ '--sprite-speed': speed }}
    >
      <Frame rows={first} className={second ? 'sprite-a' : undefined} />
      {second && <Frame rows={second} className="sprite-b" />}
    </svg>
  )
}

/**
 * ¿Se pintan los sprites? Es un ajuste del sitio (panel → Diseño), no del
 * visitante: forma parte de la personalidad de la web, como la tipografía pixel.
 */
export function useSprites() {
  return useSite((s) => s.site.theme.sprites === true)
}
