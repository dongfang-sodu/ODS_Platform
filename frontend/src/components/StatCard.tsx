interface StatCardProps {
  label: string
  value: string | number
  detail?: string
  tone?: 'blue' | 'green' | 'amber' | 'purple'
}

export function StatCard({ label, value, detail, tone = 'blue' }: StatCardProps) {
  return (
    <article className={`stat-card ${tone}`}>
      <div className="stat-label">{label}</div>
      <strong>{value}</strong>
      {detail && <span>{detail}</span>}
    </article>
  )
}
