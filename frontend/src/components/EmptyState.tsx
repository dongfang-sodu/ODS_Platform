interface EmptyStateProps {
  title: string
  description: string
  actionLabel?: string
  onAction?: () => void
}

export function EmptyState({ title, description, actionLabel, onAction }: EmptyStateProps) {
  return (
    <div className="empty-state">
      <div className="empty-icon" aria-hidden="true">◌</div>
      <h3>{title}</h3>
      <p>{description}</p>
      {actionLabel && <button className="button primary" onClick={onAction}>{actionLabel}</button>}
    </div>
  )
}
