'use client'

import { useEffect, useId, useRef, useState } from 'react'

export type DropdownOption<T extends string = string> = {
  value: T
  label: string
  onSelect?: () => void
}

type Props<T extends string = string> = {
  label: string
  options: DropdownOption<T>[]
  onSelect?: (value: T) => void
  className?: string
}

export function InlineDropdown<T extends string = string>({
  label, options, onSelect, className,
}: Props<T>) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLSpanElement>(null)

  // unique per instance — useId avoids collisions between two dropdowns with the same label
  const anchorName = `--anchor-${useId().replace(/:/g, '')}`

  useEffect(() => {
    if (!open) return
    const onClick = (e: MouseEvent) => {
      if (ref.current && !ref.current.contains(e.target as Node)) setOpen(false)
    }
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') setOpen(false) }
    document.addEventListener('mousedown', onClick)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('mousedown', onClick)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  const choose = (opt: DropdownOption<T>) => {
    opt.onSelect?.()
    onSelect?.(opt.value)
    setOpen(false)
  }

  return (
    <span ref={ref} className={`relative inline-block ${className ?? ''}`}>
      <button
        type="button"
        className="inline-flex items-center gap-1 underline decoration-dotted underline-offset-2 hover:opacity-80 cursor-pointer"
        style={{ anchorName } as React.CSSProperties}
        onClick={() => setOpen(v => !v)}
        aria-haspopup="listbox"
        aria-expanded={open}
      >
        {label}
        <span aria-hidden className={`text-[0.7em] transition-transform ${open ? 'rotate-180' : ''}`}>▾</span>
      </button>

      {open && (
        <ul
          role="listbox"
          className="menu bg-base-100 rounded-box z-50 w-52 p-2 shadow-sm"
          style={{
            position: 'absolute',
            positionAnchor: anchorName,
            top: 'anchor(bottom)',
            left: 'anchor(left)',
          } as React.CSSProperties}
        >
          {options.map(opt => (
            <li key={opt.value}>
              <button type="button" onClick={() => choose(opt)} className="w-full text-left">
                {opt.label}
              </button>
            </li>
          ))}
        </ul>
      )}
    </span>
  )
}