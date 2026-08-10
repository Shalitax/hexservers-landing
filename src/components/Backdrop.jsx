/**
 * Capa de fondo fija: halos de color + rejilla sutil detrás del contenido glass.
 * En modo sobrio (panel → Diseño) los halos quedan apenas insinuados, el tercero
 * desaparece y nada se mueve; en modo nítido los halos se apagan del todo y en su
 * lugar entra un barrido ancho pegado al borde superior. Las reglas viven en
 * index.css: aquí sólo están las piezas, cada estilo enciende las suyas.
 */
export default function Backdrop() {
  return (
    <div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden" aria-hidden="true">
      <div className="absolute inset-0 bg-void" />

      {/* Glows */}
      <div className="glow-blue anim-drift absolute -top-40 left-1/2 h-[46rem] w-[46rem] -translate-x-1/2 opacity-70" />
      <div className="glow-violet anim-drift absolute top-[55vh] -left-40 h-[38rem] w-[38rem] opacity-60 [animation-delay:-8s]" />
      <div className="glow-blue glow-extra anim-drift absolute top-[120vh] -right-40 h-[40rem] w-[40rem] opacity-40 [animation-delay:-14s]" />

      {/* Barrido superior: sólo lo enciende el modo nítido. */}
      <div className="nitido-wash absolute inset-x-0 top-0 h-[38rem]" />

      {/* Rejilla */}
      <div className="backdrop-grid absolute inset-0" />

      {/* Viñeta inferior */}
      <div className="absolute inset-x-0 bottom-0 h-64 bg-gradient-to-t from-void to-transparent" />
    </div>
  )
}
