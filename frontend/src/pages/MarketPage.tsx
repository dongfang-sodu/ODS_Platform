import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import { demoMarket } from '../data/demo'
import type { MarketSummary } from '../types'

export function MarketPage() {
  const [market, setMarket] = useState<MarketSummary>(demoMarket)
  const [year, setYear] = useState('2024')
  const [month, setMonth] = useState('12')
  const [source, setSource] = useState('All sources')
  const [notice, setNotice] = useState('Loading vehicle sales distribution...')

  useEffect(() => {
    let alive = true
    api.market.summary(Number(year), Number(month))
      .then((data) => { if (alive) { setMarket(data); setNotice('Live data') } })
      .catch((error) => { if (alive) setNotice(error instanceof Error ? error.message : 'Market data could not be loaded') })
    return () => { alive = false }
  }, [year, month])

  const changeLabel = market.yoy === null ? 'N/A' : `${market.yoy >= 0 ? '+' : ''}${market.yoy}%`
  return <>
    <PageHeader eyebrow="Digital Operation / Market" title="Vehicle market" description="Track overall sales distribution and OEM market share from mapped CAAM and 佐思 data." actions={<button className="button secondary" onClick={() => window.print()}>⇩ Export view</button>} />
    <div className="notice-bar"><span className="live-dot" />{notice}<span className="refresh-label">Reporting period: {market.refreshedAt}</span></div>
    <section className="stat-grid">
      <StatCard label="Total sales" value={`${(market.totalSales / 1000).toFixed(1)}K`} detail={`Reporting period: ${market.year}-${String(market.month).padStart(2, '0')}`} tone="blue" />
      <StatCard label="Average share change" value={changeLabel} detail="Compared with previous month" tone="green" />
      <StatCard label="Active OEMs" value={market.activeOems} detail="Across mapped segments" tone="purple" />
    </section>
    <section className="card filter-card"><div className="filter-row"><label className="field"><span>Reporting year</span><select value={year} onChange={(event) => setYear(event.target.value)}><option>2025</option><option>2024</option><option>2023</option><option>2022</option></select></label><label className="field"><span>Month</span><select value={month} onChange={(event) => setMonth(event.target.value)}>{Array.from({ length: 12 }, (_, index) => index + 1).map((value) => <option key={value} value={value}>{String(value).padStart(2, '0')}</option>)}</select></label><label className="field"><span>Data source</span><select value={source} onChange={(event) => setSource(event.target.value)}><option>All sources</option><option>CAAM</option><option>佐思</option></select></label><span className="result-count">{year}-{month.padStart(2, '0')} · {source}</span></div></section>
    <div className="market-grid"><section className="card chart-card"><div className="card-heading"><div><span className="eyebrow">Overall sales distribution</span><h2>OEM market share</h2></div><span className="chart-unit">Units · vehicles</span></div><div className="market-bars">{market.oems.map((oem) => <div className="market-bar" key={oem.name}><div className="market-bar-label"><span>{oem.name}</span><b>{oem.share}%</b></div><div className="market-track"><i style={{ width: `${Math.min(100, oem.share / 0.3)}%` }} /></div><small>{oem.sales.toLocaleString()} units {oem.change === null ? <em>N/A</em> : <em className={oem.change >= 0 ? 'positive' : 'negative'}>{oem.change >= 0 ? '↑' : '↓'} {Math.abs(oem.change)}%</em>}</small></div>)}</div></section><section className="card insight-card"><span className="eyebrow">Data quality</span><h2>Mapping health</h2><div className="quality-score"><strong>96</strong><span>/ 100</span></div><p>CAAM and 佐思 product mappings are ready for reporting. Review unmapped product codes before each monthly refresh.</p><button className="button ghost full-width">Review mapping →</button><div className="source-list"><div><span className="source-dot caam" />CAAM database <b>Connected</b></div><div><span className="source-dot zosi" />佐思 database <b>Connected</b></div></div></section></div>
  </>
}
