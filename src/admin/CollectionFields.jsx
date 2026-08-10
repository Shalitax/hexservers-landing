import { Plus, Trash2, ChevronUp, ChevronDown } from 'lucide-react'
import { cx } from '../lib/utils.js'
import { CompactGlyphPicker } from './controls.jsx'

/* ------------------------------- piezas comunes ------------------------------ */

function RowActions({ onUp, onDown, onRemove, disableUp, disableDown, vertical }) {
  const base =
    'rounded-md p-1 text-slate-500 transition hover:bg-surface-3 hover:text-white disabled:opacity-25'
  return (
    <div className={cx('flex shrink-0', vertical ? 'flex-col' : 'items-center')}>
      <button onClick={onUp} disabled={disableUp} aria-label="Subir" className={base}>
        <ChevronUp size={13} />
      </button>
      <button onClick={onDown} disabled={disableDown} aria-label="Bajar" className={base}>
        <ChevronDown size={13} />
      </button>
      <button
        onClick={onRemove}
        aria-label="Eliminar"
        className="rounded-md p-1 text-slate-500 transition hover:bg-rose-500/15 hover:text-rose-400"
      >
        <Trash2 size={13} />
      </button>
    </div>
  )
}

function CollectionHeader({ title, hint, count, addLabel, onAdd }) {
  return (
    <header className="flex items-start justify-between gap-3">
      <div className="min-w-0">
        <h4 className="display text-sm font-bold text-white">
          {title}
          {typeof count === 'number' && <span className="chip ml-2 !text-micro">{count}</span>}
        </h4>
        {hint && <p className="mt-0.5 text-micro leading-snug text-slate-500">{hint}</p>}
      </div>
      <button onClick={onAdd} className="btn-ghost btn-sm shrink-0">
        <Plus size={13} />
        {addLabel || 'Añadir'}
      </button>
    </header>
  )
}

function EmptyHint({ children }) {
  return (
    <p className="rounded-lg border border-dashed border-line p-4 text-center text-micro text-slate-600">
      {children}
    </p>
  )
}

/* --------------------------- lista de pares etiqueta/valor -------------------- */

/** Especificaciones: [{ id, label, value }]. */
export function PairList({ title, hint, items, onAdd, onUpdate, onRemove, onMove, placeholders }) {
  const [labelPlaceholder, valuePlaceholder] = placeholders || ['RAM', '8 GB DDR5']

  return (
    <section className="space-y-3">
      <CollectionHeader title={title} hint={hint} count={items.length} onAdd={onAdd} />
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={item.id} className="flex gap-2">
            <input
              className="input w-36 shrink-0"
              placeholder={labelPlaceholder}
              value={item.label ?? ''}
              onChange={(event) => onUpdate(item.id, { label: event.target.value })}
            />
            <input
              className="input"
              placeholder={valuePlaceholder}
              value={item.value ?? ''}
              onChange={(event) => onUpdate(item.id, { value: event.target.value })}
            />
            <RowActions
              onUp={() => onMove(item.id, -1)}
              onDown={() => onMove(item.id, 1)}
              onRemove={() => onRemove(item.id)}
              disableUp={index === 0}
              disableDown={index === items.length - 1}
            />
          </div>
        ))}
        {items.length === 0 && <EmptyHint>Sin especificaciones todavía.</EmptyHint>}
      </div>
    </section>
  )
}

/* ------------------------------ lista de textos ------------------------------ */

/** Checklist de "qué incluye": [{ id, text }]. */
export function TextList({ title, hint, items, onAdd, onUpdate, onRemove, onMove, placeholder }) {
  return (
    <section className="space-y-3">
      <CollectionHeader
        title={title}
        hint={hint}
        count={items.length}
        addLabel="Añadir línea"
        onAdd={onAdd}
      />
      <div className="space-y-2">
        {items.map((item, index) => (
          <div key={item.id} className="flex gap-2">
            <input
              className="input"
              placeholder={placeholder || 'Anti-DDoS de 1 Tbps'}
              value={item.text ?? ''}
              onChange={(event) => onUpdate(item.id, { text: event.target.value })}
            />
            <RowActions
              onUp={() => onMove(item.id, -1)}
              onDown={() => onMove(item.id, 1)}
              onRemove={() => onRemove(item.id)}
              disableUp={index === 0}
              disableDown={index === items.length - 1}
            />
          </div>
        ))}
        {items.length === 0 && <EmptyHint>Todavía no has añadido ninguna línea.</EmptyHint>}
      </div>
    </section>
  )
}

/* ------------------------ lista de icono + título + texto -------------------- */

/** Argumentos y funciones: [{ id, icon, title, description }]. */
export function IconItemList({ title, hint, items, onAdd, onUpdate, onRemove, onMove, emptyHint }) {
  return (
    <section className="space-y-3">
      <CollectionHeader title={title} hint={hint} count={items.length} onAdd={onAdd} />
      <div className="space-y-2">
        {items.map((item, index) => (
          <div
            key={item.id}
            className="flex items-start gap-2 rounded-xl border border-line bg-surface-1 p-2.5"
          >
            <CompactGlyphPicker
              icon={item.icon || 'sparkles'}
              image={item.image}
              onIcon={(icon) => onUpdate(item.id, { icon })}
              onImage={(image) => onUpdate(item.id, { image })}
            />

            <div className="min-w-0 flex-1 space-y-2">
              <input
                className="input"
                placeholder="Título (ej. Anti-DDoS de 1 Tbps)"
                value={item.title ?? ''}
                onChange={(event) => onUpdate(item.id, { title: event.target.value })}
              />
              <textarea
                className="input min-h-14 resize-y"
                placeholder="Descripción en una o dos líneas."
                value={item.description ?? ''}
                onChange={(event) => onUpdate(item.id, { description: event.target.value })}
              />
            </div>

            <RowActions
              vertical
              onUp={() => onMove(item.id, -1)}
              onDown={() => onMove(item.id, 1)}
              onRemove={() => onRemove(item.id)}
              disableUp={index === 0}
              disableDown={index === items.length - 1}
            />
          </div>
        ))}
        {items.length === 0 && <EmptyHint>{emptyHint || 'Lista vacía.'}</EmptyHint>}
      </div>
    </section>
  )
}
