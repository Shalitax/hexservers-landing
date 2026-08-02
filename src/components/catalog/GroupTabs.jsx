import { Plus } from 'lucide-react'
import { cx } from '../../lib/utils.js'
import { href, groupHref } from '../../lib/router.js'
import { Icon, Glyph } from '../ui/icons.jsx'

/**
 * Pestañas de subcategoría (Servidores VPS, Servidores de Juegos, Hosting Web…).
 *
 * La de «Todos» es opcional (`catalog.showAllTab`): con pocas subcategorías ayuda a
 * ver el catálogo entero, pero cuando cada familia es un mundo aparte sólo añade un
 * clic de más. Al quitarla, la página entra directamente en la primera.
 */
export default function GroupTabs({
  groups,
  activeSlug,
  allLabel,
  countOf,
  editMode,
  onAddGroup,
  showAll = true,
}) {
  const tabClass = (active) =>
    cx(
      'inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-semibold transition',
      active
        ? 'shadow-primary border-hex-500/50 bg-hex-500/15 text-white'
        : 'border-white/10 bg-white/[0.03] text-slate-400 backdrop-blur hover:border-white/20 hover:text-white',
    )

  const badgeClass = (active) =>
    cx(
      'rounded-md px-1.5 py-px text-[10px] font-bold',
      active ? 'bg-hex-500/25 text-hex-200' : 'bg-white/[0.06] text-slate-500',
    )

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {showAll && (
        <a href={href('/productos')} className={tabClass(!activeSlug)}>
          <Icon name="layers" size={15} className={!activeSlug ? 'text-hex-300' : ''} />
          {allLabel || 'Todos'}
          <span className={badgeClass(!activeSlug)}>{countOf()}</span>
        </a>
      )}

      {groups.map((group) => {
        const active = activeSlug === group.slug
        return (
          <a key={group.id} href={groupHref(group)} className={tabClass(active)}>
            <Glyph
              name={group.icon}
              image={group.image}
              size={15}
              className={active && !group.image ? 'text-hex-300' : ''}
            />
            {group.name}
            <span className={badgeClass(active)}>{countOf(group.id)}</span>
          </a>
        )
      })}

      {editMode && (
        <button onClick={onAddGroup} className="btn-ghost btn-sm border-dashed py-2.5">
          <Plus size={15} />
          Subcategoría
        </button>
      )}
    </div>
  )
}
