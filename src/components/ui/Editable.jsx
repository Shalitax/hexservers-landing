import { useEffect, useRef, useState } from 'react'
import { useSite } from '../../store/useSite.js'
import { cx } from '../../lib/utils.js'

/**
 * Texto editable in-situ.
 * - Fuera del modo edición: renderiza el texto tal cual (coste cero para el cliente).
 * - En modo edición: contenteditable con anillo punteado; guarda al salir del foco
 *   o con Ctrl+Enter, y cancela con Escape.
 */
export default function Editable({
  path,
  as: Tag = 'span',
  className = '',
  multiline = false,
  placeholder = 'Texto vacío',
  children,
}) {
  const editMode = useSite((s) => s.editMode)
  const setField = useSite((s) => s.setField)
  const value = useSite((s) => readPath(s.site, path))
  const ref = useRef(null)
  const [editing, setEditing] = useState(false)

  // Sincroniza el DOM sólo cuando no se está escribiendo (evita saltos del cursor).
  useEffect(() => {
    if (ref.current && !editing) ref.current.textContent = value ?? ''
  }, [value, editing, editMode])

  /**
   * `key`: al alternar de modo hay que remontar el elemento. En edición el texto
   * lo escribe el efecto directamente en el DOM (React no lo conoce), así que al
   * volver a la vista de cliente React añadiría sus hijos junto a ese resto y el
   * texto saldría duplicado.
   */
  if (!editMode) {
    return (
      <Tag key="view" className={className}>
        {children ?? value}
      </Tag>
    )
  }

  const commit = () => {
    setEditing(false)
    const next = (ref.current?.textContent ?? '').replace(/ /g, ' ')
    if (next !== value) setField(path, next)
  }

  return (
    <Tag
      key="edit"
      ref={ref}
      role="textbox"
      tabIndex={0}
      contentEditable
      suppressContentEditableWarning
      spellCheck={false}
      data-placeholder={placeholder}
      title={`Editar: ${path}`}
      onFocus={() => setEditing(true)}
      onBlur={commit}
      onKeyDown={(event) => {
        if (event.key === 'Escape') {
          event.preventDefault()
          if (ref.current) ref.current.textContent = value ?? ''
          setEditing(false)
          ref.current?.blur()
        }
        if (!multiline && event.key === 'Enter') {
          event.preventDefault()
          ref.current?.blur()
        }
        if (multiline && event.key === 'Enter' && (event.ctrlKey || event.metaKey)) {
          event.preventDefault()
          ref.current?.blur()
        }
      }}
      className={cx(
        className,
        'cursor-text rounded-md transition',
        'outline-1 outline-dashed outline-offset-4 outline-hex-500/45',
        'hover:outline-hex-400/90 focus:outline-2 focus:outline-solid focus:outline-hex-400 focus:bg-hex-500/[0.07]',
        'empty:before:text-slate-600 empty:before:content-[attr(data-placeholder)]',
      )}
    />
  )
}

function readPath(object, path) {
  return path.split('.').reduce((node, key) => node?.[key], object)
}
