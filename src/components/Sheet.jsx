import React from 'react'

const SHEET_EXIT_MS = 280

const Sheet = ({
  children,
  closing = false,
  className = '',
  label,
  onClose,
  onExited,
  panelStyle,
  zIndex = 120,
}) => {
  const closeRequestedRef = React.useRef(false)

  React.useEffect(() => {
    if (!closing) {
      closeRequestedRef.current = false
      return undefined
    }

    const timer = window.setTimeout(() => {
      onExited?.()
    }, SHEET_EXIT_MS)

    return () => window.clearTimeout(timer)
  }, [closing, onExited])

  React.useEffect(() => {
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') onClose?.()
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [onClose])

  const requestClose = () => {
    if (closeRequestedRef.current) return
    closeRequestedRef.current = true
    onClose?.()
  }

  return (
    <div
      className={`sheet${closing ? ' sheet--closing' : ''}${className ? ` ${className}` : ''}`}
      aria-label={label}
      role="dialog"
      aria-modal="true"
      style={{ zIndex }}
    >
      <button className="sheet__backdrop" type="button" aria-label="Fermer" onClick={requestClose} />
      <div className="sheet__panel" style={panelStyle} onClick={event => event.stopPropagation()}>
        {children}
      </div>
    </div>
  )
}

export { Sheet }
