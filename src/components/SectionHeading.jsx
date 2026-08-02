import Editable from './ui/Editable.jsx'

export default function SectionHeading({ eyebrow, titlePath, subtitlePath, align = 'center' }) {
  const alignment = align === 'left' ? 'text-left' : 'mx-auto max-w-2xl text-center'

  return (
    <div className={alignment}>
      {eyebrow && <div className="eyebrow mb-3">{eyebrow}</div>}
      <Editable
        path={titlePath}
        as="h2"
        className="display text-3xl font-bold text-balance text-white sm:text-4xl"
      />
      {subtitlePath && (
        <Editable
          path={subtitlePath}
          as="p"
          multiline
          className="mt-3 text-base leading-relaxed text-pretty text-slate-400"
        />
      )}
    </div>
  )
}
