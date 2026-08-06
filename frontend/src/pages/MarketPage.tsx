import { useEffect, useState } from 'react'
import { api } from '../api/client'
import { EmptyState } from '../components/EmptyState'
import { PageHeader } from '../components/PageHeader'
import { StatCard } from '../components/StatCard'
import { demoDataEnabled, demoReadOnlyNotice } from '../config/runtime'
import { demoMarket } from '../data/demo'
import type { MarketSummary } from '../types'
import { useLanguage } from '../i18n'

export function MarketPage() {
  const { language, tr, label } = useLanguage()
  const [market, setMarket] = useState<MarketSummary | null>(demoDataEnabled ? demoMarket : null)
  const [year, setYear] = useState('2024')
  const [month, setMonth] = useState('12')
  const [notice, setNotice] = useState('')
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
    setNotice(demoDataEnabled && demoMatchesPeriod
      ? `${label(demoReadOnlyNotice)} · ${tr('loading live market data', '正在加载实时市场数据')}`
      : tr('Loading vehicle sales distribution...', '正在加载汽车销量分布...'))

    api.market.summary(selectedYear, selectedMonth)
      .then((data) => {
        if (!alive) return
        setMarket(data)
        setShowingDemo(false)
        setNotice(label('Live data'))
      })
      .catch((error) => {
        if (!alive) return
        const message = error instanceof Error ? error.message : tr('Market data could not be loaded', '无法加载市场数据')
        if (demoDataEnabled && demoMatchesPeriod) {
          setMarket(demoMarket)
          setShowingDemo(true)
          setNotice(`${label(demoReadOnlyNotice)} · ${message}`)
        } else {
          setMarket(null)
          setShowingDemo(false)
          setNotice(message)
        }
      })
      .finally(() => { if (alive) setLoading(false) })

    return () => { alive = false }
  }, [year, month, language])

  const changeLabel = market?.yoy === null || market?.yoy === undefined ? 'N/A' : `${market.yoy >= 0 ? '+' : ''}${market.yoy}%`

  return <>
    <PageHeader eyebrow="Digital Operation / Market" title="Vehicle market" description="Track overall sales distribution and OEM market share from the configured market data service." actions={<button className="button secondary" disabled={!market} onClick={() => window.print()}>⇩ {tr('Export view', '导出当前视图')}</button>} />
    <div className="notice-bar"><span className="live-dot" />{notice}{market && <span className="refresh-label">{tr('Reporting period', '报告周期')}：{market.refreshedAt}</span>}</div>
    <section className="stat-grid">
      <StatCard label={tr('Total sales', '总销量')} value={market ? `${(market.totalSales / 1000).toFixed(1)}K` : '—'} detail={market ? `${tr('Reporting period', '报告周期')}：${market.year}-${String(market.month).padStart(2, '0')}` : tr('No data loaded', '尚未加载数据')} tone="blue" />
      <StatCard label={tr('Average share change', '平均份额变化')} value={market ? changeLabel : '—'} detail={tr('Compared with previous month', '与上月相比')} tone="green" />
      <StatCard label={tr('Active OEMs', '活跃汽车厂商')} value={market?.activeOems ?? '—'} detail={tr('OEMs in the loaded response', '当前响应中的汽车厂商数量')} tone="purple" />
    </section>
    <section className="card filter-card"><div className="filter-row"><label className="field"><span>{tr('Reporting year', '报告年份')}</span><select value={year} onChange={(event) => setYear(event.target.value)}><option>2025</option><option>2024</option><option>2023</option><option>2022</option></select></label><label className="field"><span>{tr('Month', '月份')}</span><select value={month} onChange={(event) => setMonth(event.target.value)}>{Array.from({ length: 12 }, (_, index) => index + 1).map((value) => <option key={value} value={value}>{String(value).padStart(2, '0')}</option>)}</select></label><span className="result-count">{year}-{month.padStart(2, '0')}{loading ? ` · ${tr('loading', '加载中')}` : ''}</span></div></section>
    <div className="market-grid">
      <section className="card chart-card"><div className="card-heading"><div><span className="eyebrow">{tr('Overall sales distribution', '整体销量分布')}</span><h2>{tr('OEM market share', '汽车厂商市场份额')}</h2></div><span className="chart-unit">{tr('Units · vehicles', '单位 · 辆')}</span></div>{market?.oems.length ? <div className="market-bars">{market.oems.map((oem) => <div className="market-bar" key={oem.name}><div className="market-bar-label"><span>{oem.name}</span><b>{oem.share}%</b></div><div className="market-track"><i style={{ width: `${Math.min(100, oem.share / 0.3)}%` }} /></div><small>{oem.sales.toLocaleString()} {tr('units', '辆')} {oem.change === null ? <em>{tr('N/A', '暂无')}</em> : <em className={oem.change >= 0 ? 'positive' : 'negative'}>{oem.change >= 0 ? '↑' : '↓'} {Math.abs(oem.change)}%</em>}</small></div>)}</div> : !loading && <EmptyState title={tr('No market data', '暂无市场数据')} description={tr('Sales distribution could not be loaded for this reporting period.', '无法加载当前报告周期的销量分布。')} />}</section>
      <section className="card insight-card"><span className="eyebrow">{tr('Data source', '数据来源')}</span><h2>{tr('Response status', '响应状态')}</h2><p>{tr('The current API exposes sales distribution values. Mapping health and source connection diagnostics are not part of this response.', '当前接口提供销量分布数据，映射健康状态和数据源连接诊断不包含在本次响应中。')}</p><div className="source-list"><div><span className="source-dot caam" />{tr('Sales distribution', '销量分布')} <b>{label(market ? showingDemo ? 'Demo preview' : 'Loaded' : 'Unavailable')}</b></div><div><span className="source-dot zosi" />{tr('Mapping diagnostics', '映射诊断')} <b>{label('Not reported')}</b></div></div></section>
    </div>
  </>
}
