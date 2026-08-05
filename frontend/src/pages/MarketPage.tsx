import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import { demoDataEnabled, demoReadOnlyNotice } from '../config/runtime'
import { demoMarket } from '../data/demo'
import type { MarketSummary } from '../types'

export function MarketPage() {
  const [market, setMarket] = useState<MarketSummary | null>(demoDataEnabled ? demoMarket : null)
  const [year, setYear] = useState('2024')
  const [month, setMonth] = useState('12')
  const [notice, setNotice] = useState(demoDataEnabled ? `${demoReadOnlyNotice} · loading live market data` : 'Loading vehicle sales distribution...')
  const [loading, setLoading] = useState(true)
  const [showingDemo, setShowingDemo] = useState(demoDataEnabled)

  useEffect(() => {
    let alive = true
    const selectedYear = Number(year)
    const selectedMonth = Number(month)
    const demoMatchesPeriod = selectedYear === demoMarket.year && selectedMonth === demoMarket.month

    setLoading(true)
    setMarket(demoDataEnabled && demoMatchesPeriod ? demoMarket : null)
    setShowingDemo(demoDataEnabled && demoMatchesPeriod)
    setNotice(demoDataEnabled && demoMatchesPeriod ? `${demoReadOnlyNotice} · loading live market data` : 'Loading vehicle sales distribution...')

    api.market.summary(selectedYear, selectedMonth)
      .then((data) => {
        if (!alive) return
        setMarket(data)
        setShowingDemo(false)
        setNotice('Live data')
      })
      .catch((error) => {
        if (!alive) return
        const message = error instanceof Error ? error.message : 'Market data could not be loaded'
        if (demoDataEnabled && demoMatchesPeriod) {
          setMarket(demoMarket)
          setShowingDemo(true)
          setNotice(`${demoReadOnlyNotice} · ${message}`)
        } else {
          setMarket(null)
          setShowingDemo(false)
          setNotice(message)
        }
      })
      .finally(() => { if (alive) setLoading(false) })

    return () => { alive = false }
  }, [year, month])

  const changeLabel = market?.yoy === null || market?.yoy === undefined ? 'N/A' : `${market.yoy >= 0 ? '+' : ''}${market.yoy}%`

  return <>
    <PageHeader eyebrow="Digital Operation / Market" title="Vehicle market" description="Track overall sales distribution and OEM market share from the configured market data service." actions={<button className="button secondary" disabled={!market} onClick={() => window.print()}>⇩ Export view</button>} />
    <div className="notice-bar"><span className="live-dot" />{notice}{market && <span className="refresh-label">Reporting period: {market.refreshedAt}</span>}</div>
    <section className="stat-grid">
      <StatCard label="Total sales" value={market ? `${(market.totalSales / 1000).toFixed(1)}K` : '—'} detail={market ? `Reporting period: ${market.year}-${String(market.month).padStart(2, '0')}` : 'No data loaded'} tone="blue" />
      <StatCard label="Average share change" value={market ? changeLabel : '—'} detail="Compared with previous month" tone="green" />
      <StatCard label="Active OEMs" value={market?.activeOems ?? '—'} detail="OEMs in the loaded response" tone="purple" />
    </section>
    <section className="card filter-card"><div className="filter-row"><label className="field"><span>Reporting year</span><select value={year} onChange={(event) => setYear(event.target.value)}><option>2025</option><option>2024</option><option>2023</option><option>2022</option></select></label><label className="field"><span>Month</span><select value={month} onChange={(event) => setMonth(event.target.value)}>{Array.from({ length: 12 }, (_, index) => index + 1).map((value) => <option key={value} value={value}>{String(value).padStart(2, '0')}</option>)}</select></label><span className="result-count">{year}-{month.padStart(2, '0')}{loading ? ' · loading' : ''}</span></div></section>
    <div className="market-grid">
      <section className="card chart-card"><div className="card-heading"><div><span className="eyebrow">Overall sales distribution</span><h2>OEM market share</h2></div><span className="chart-unit">Units · vehicles</span></div>{market?.oems.length ? <div className="market-bars">{market.oems.map((oem) => <div className="market-bar" key={oem.name}><div className="market-bar-label"><span>{oem.name}</span><b>{oem.share}%</b></div><div className="market-track"><i style={{ width: `${Math.min(100, oem.share / 0.3)}%` }} /></div><small>{oem.sales.toLocaleString()} units {oem.change === null ? <em>N/A</em> : <em className={oem.change >= 0 ? 'positive' : 'negative'}>{oem.change >= 0 ? '↑' : '↓'} {Math.abs(oem.change)}%</em>}</small></div>)}</div> : !loading && <EmptyState title="No market data" description="Sales distribution could not be loaded for this reporting period." />}</section>
      <section className="card insight-card"><span className="eyebrow">Data source</span><h2>Response status</h2><p>The current API exposes sales distribution values. Mapping health and source connection diagnostics are not part of this response.</p><div className="source-list"><div><span className="source-dot caam" />Sales distribution <b>{market ? showingDemo ? 'Demo preview' : 'Loaded' : 'Unavailable'}</b></div><div><span className="source-dot zosi" />Mapping diagnostics <b>Not reported</b></div></div></section>
    </div>
  </>
}
