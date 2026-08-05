import { useEffect, useMemo, useState, type FormEvent } from 'react'
import { api, authSession } from '../api/client'
import { PageHeader } from '../components/PageHeader'
import type {
  ChangeType,
  ImpactReport,
  ReviewStatus,
  TraceArtifact,
  TraceArtifactType,
  TraceDirection,
  TraceQueryResult,
  TraceRelation,
  TraceRelationType,
} from '../types'

type Tab = 'artifacts' | 'relations' | 'query' | 'impact'

const maintainRoles = new Set(['TPJM', 'PJM', 'EBE', 'EPO', 'LPM', 'TRAINER', 'COORDINATOR', 'ADMIN'])
const analyzeRoles = new Set(['TPJM', 'PJM', 'EBE', 'EPO', 'LPM', 'ADMIN'])
const reviewRoles = new Set(['PJM', 'EBE', 'EPO', 'LPM', 'TRAINER', 'COORDINATOR', 'ADMIN'])
const ticketRoles = new Set(['PJM', 'LPM', 'TRAINER', 'COORDINATOR', 'ADMIN'])

export function TraceabilityPage() {
  const user = authSession.user()
  const roles = user?.roles ?? []
  const canMaintain = roles.some((role) => maintainRoles.has(role))
  const canAnalyze = roles.some((role) => analyzeRoles.has(role))
  const canReview = roles.some((role) => reviewRoles.has(role))
  const canCreateTickets = roles.some((role) => ticketRoles.has(role))
  const [tab, setTab] = useState<Tab>('query')
  const [artifacts, setArtifacts] = useState<TraceArtifact[]>([])
  const [relations, setRelations] = useState<TraceRelation[]>([])
  const [artifactTypes, setArtifactTypes] = useState<TraceArtifactType[]>([])
  const [relationTypes, setRelationTypes] = useState<TraceRelationType[]>([])
  const [notice, setNotice] = useState('正在加载追溯数据…')
  const [loading, setLoading] = useState(true)
  const [querySource, setQuerySource] = useState('')
  const [queryDirection, setQueryDirection] = useState<TraceDirection>('FORWARD')
  const [queryDepth, setQueryDepth] = useState(3)
  const [queryResult, setQueryResult] = useState<TraceQueryResult | null>(null)
  const [impactSource, setImpactSource] = useState('')
  const [changeType, setChangeType] = useState<ChangeType>('PARAMETER')
  const [beforeContent, setBeforeContent] = useState('2.0 s')
  const [afterContent, setAfterContent] = useState('2.5 s')
  const [changeDescription, setChangeDescription] = useState('调整AEB的TTC触发阈值并检查下游工件')
  const [report, setReport] = useState<ImpactReport | null>(null)
  const [artifactForm, setArtifactForm] = useState({
    sourceObjectId: '', artifactTypeCode: 'REQUIREMENT', displayName: '', contentSummary: '',
  })
  const [relationForm, setRelationForm] = useState({
    sourceVersionId: '', targetVersionId: '', relationTypeCode: 'CONSTRAINS', rationale: '',
  })

  const versions = useMemo(() => artifacts
    .filter((artifact) => artifact.currentVersion)
    .map((artifact) => ({ artifact, version: artifact.currentVersion })), [artifacts])
  const nodeNames = useMemo(() => new Map(artifacts.flatMap((artifact) => artifact.versions
    .map((version) => [version.id, version.displayName] as const))), [artifacts])

  const refresh = async () => {
    setLoading(true)
    try {
      const [loadedArtifacts, loadedRelations, loadedArtifactTypes, loadedRelationTypes] = await Promise.all([
        api.trace.artifacts(), api.trace.relations(), api.trace.artifactTypes(), api.trace.relationTypes(),
      ])
      setArtifacts(loadedArtifacts)
      setRelations(loadedRelations)
      setArtifactTypes(loadedArtifactTypes)
      setRelationTypes(loadedRelationTypes)
      const defaultVersion = loadedArtifacts.find((artifact) => artifact.currentVersion.displayName.includes('TTC'))?.currentVersionId
        ?? loadedArtifacts[0]?.currentVersionId ?? ''
      setQuerySource((current) => current || defaultVersion)
      setImpactSource((current) => current || defaultVersion)
      setRelationForm((current) => ({
        ...current,
        sourceVersionId: current.sourceVersionId || loadedArtifacts[0]?.currentVersionId || '',
        targetVersionId: current.targetVersionId || loadedArtifacts[1]?.currentVersionId || '',
      }))
      setNotice(`已加载 ${loadedArtifacts.length} 个工件和 ${loadedRelations.length} 条关系`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '追溯数据加载失败')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { void refresh() }, [])

  const createArtifact = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await api.trace.createArtifact({
        sourceModule: 'TRACE_LOCAL',
        sourceObjectType: artifactForm.artifactTypeCode,
        sourceObjectId: artifactForm.sourceObjectId,
        artifactTypeCode: artifactForm.artifactTypeCode,
        versionLabel: 'V1',
        displayName: artifactForm.displayName,
        status: 'CURRENT',
        owner: user?.username,
        contentSummary: artifactForm.contentSummary,
      })
      setArtifactForm({ sourceObjectId: '', artifactTypeCode: 'REQUIREMENT', displayName: '', contentSummary: '' })
      await refresh()
      setNotice('工件及首个不可变版本已登记')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '工件创建失败')
    }
  }

  const createRelation = async (event: FormEvent) => {
    event.preventDefault()
    try {
      await api.trace.createRelation(relationForm)
      setRelationForm((current) => ({ ...current, rationale: '' }))
      await refresh()
      setNotice('追溯关系已创建')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '关系创建失败')
    }
  }

  const runQuery = async () => {
    if (!querySource) return
    try {
      const result = await api.trace.query(querySource, queryDirection, queryDepth)
      setQueryResult(result)
      setNotice(`查询完成：找到 ${result.nodes.length} 个节点，用时 ${result.durationMs} ms`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '追溯查询失败')
    }
  }

  const runImpact = async (event: FormEvent) => {
    event.preventDefault()
    if (!impactSource) return
    try {
      const result = await api.trace.createChangeAndAnalyze({
        sourceVersionId: impactSource,
        changeType,
        beforeContent,
        afterContent,
        description: changeDescription,
        maxDepth: queryDepth,
      })
      setReport(result)
      setNotice(`影响分析完成：生成 ${result.candidateCount} 个待复核候选`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '影响分析失败')
    }
  }

  const reviewCandidate = async (candidateId: string, status: ReviewStatus) => {
    if (!report) return
    const comment = window.prompt('填写复核说明（可留空）', status === 'CONFIRMED' ? '确认需要复核' : '与本次变更无直接影响') ?? ''
    try {
      const updated = await api.trace.review(report.id, report.version, candidateId, status, comment)
      setReport(updated)
      setNotice('复核结论已保存，系统初始分值保持不变')
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '复核保存失败')
    }
  }

  const createTickets = async () => {
    if (!report || !user) return
    const candidateIds = report.candidates.filter((candidate) => candidate.reviewStatus === 'CONFIRMED' && !candidate.tickets.length)
      .map((candidate) => candidate.id)
    if (!candidateIds.length) {
      setNotice('没有尚未创建工单的已确认候选')
      return
    }
    if (!window.confirm(`将为 ${candidateIds.length} 个目标分别创建一张工单，是否继续？`)) return
    try {
      await api.trace.confirmTickets(report.id, report.version, candidateIds, user.username)
      setReport(await api.trace.report(report.id))
      setNotice(`已创建 ${candidateIds.length} 张关联工单`)
    } catch (error) {
      setNotice(error instanceof Error ? error.message : '工单创建失败')
    }
  }

  return <>
    <PageHeader eyebrow="Engineering Traceability" title="工件追溯与变更分析" description="使用有限深度关系查询、可解释影响排序和人工确认，把AEB变更连接到项目、车型说明、培训、指南和工单。" actions={<button className="button secondary" disabled={loading} onClick={refresh}>↻ 刷新数据</button>} />
    <div className="notice-bar"><span className="live-dot" />{notice}<span className="refresh-label">单用户Demo · 默认深度3 · 最大深度5</span></div>
    <section className="card trace-tabs">{([
      ['artifacts', '工件与版本'], ['relations', '关系管理'], ['query', '追溯查询'], ['impact', '影响分析'],
    ] as Array<[Tab, string]>).map(([value, label]) => <button key={value} className={tab === value ? 'active' : ''} onClick={() => setTab(value)}>{label}</button>)}</section>

    {tab === 'artifacts' && <div className="trace-layout">
      {canMaintain && <form className="card form-card trace-form" onSubmit={createArtifact}>
        <div className="card-heading"><h2>登记Trace Local工件</h2></div>
        <div className="form-grid">
          <label className="field"><span>稳定业务标识</span><input required value={artifactForm.sourceObjectId} onChange={(event) => setArtifactForm({ ...artifactForm, sourceObjectId: event.target.value })} placeholder="例如 AEB-REQ-NEW" /></label>
          <label className="field"><span>工件类型</span><select value={artifactForm.artifactTypeCode} onChange={(event) => setArtifactForm({ ...artifactForm, artifactTypeCode: event.target.value })}>{artifactTypes.map((type) => <option key={type.id} value={type.code}>{type.name} · {type.code}</option>)}</select></label>
          <label className="field field-wide"><span>显示名称</span><input required value={artifactForm.displayName} onChange={(event) => setArtifactForm({ ...artifactForm, displayName: event.target.value })} /></label>
          <label className="field field-wide"><span>内容摘要</span><textarea rows={3} value={artifactForm.contentSummary} onChange={(event) => setArtifactForm({ ...artifactForm, contentSummary: event.target.value })} /></label>
        </div>
        <div className="form-actions"><button className="button primary">登记工件与V1版本</button></div>
      </form>}
      <section className="card table-card trace-wide"><div className="table-toolbar"><div><h2>工件库</h2><p>稳定工件身份与当前不可变版本</p></div><span className="role-pill">{artifacts.length} items</span></div><div className="table-wrap"><table><thead><tr><th>工件</th><th>类型</th><th>来源</th><th>当前版本</th><th>状态</th></tr></thead><tbody>{artifacts.map((artifact) => <tr key={artifact.id}><td><strong>{artifact.currentVersion.displayName}</strong><span className="cell-muted">{artifact.sourceObjectId}</span></td><td>{artifact.type.name}</td><td>{artifact.sourceModule}</td><td>{artifact.currentVersion.versionLabel}</td><td><span className="status status-active">{artifact.sourceStatus}</span></td></tr>)}</tbody></table></div></section>
    </div>}

    {tab === 'relations' && <div className="trace-layout">
      {canMaintain && <form className="card form-card trace-form" onSubmit={createRelation}>
        <div className="card-heading"><h2>建立有向关系</h2></div>
        <div className="form-grid">
          <label className="field"><span>源版本</span><select required value={relationForm.sourceVersionId} onChange={(event) => setRelationForm({ ...relationForm, sourceVersionId: event.target.value })}>{versions.map(({ artifact, version }) => <option key={version.id} value={version.id}>{artifact.type.name} · {version.displayName}</option>)}</select></label>
          <label className="field"><span>目标版本</span><select required value={relationForm.targetVersionId} onChange={(event) => setRelationForm({ ...relationForm, targetVersionId: event.target.value })}>{versions.map(({ artifact, version }) => <option key={version.id} value={version.id}>{artifact.type.name} · {version.displayName}</option>)}</select></label>
          <label className="field"><span>关系类型</span><select value={relationForm.relationTypeCode} onChange={(event) => setRelationForm({ ...relationForm, relationTypeCode: event.target.value })}>{relationTypes.map((type) => <option key={type.id} value={type.code}>{type.name} · {type.code}</option>)}</select></label>
          <label className="field field-wide"><span>建立依据</span><textarea required rows={3} value={relationForm.rationale} onChange={(event) => setRelationForm({ ...relationForm, rationale: event.target.value })} /></label>
        </div><div className="form-actions"><button className="button primary">校验并保存关系</button></div>
      </form>}
      <section className="card table-card trace-wide"><div className="table-toolbar"><div><h2>关系清单</h2><p>箭头方向与影响传播方向分别保存</p></div><span className="role-pill">{relations.filter((relation) => relation.active).length} active</span></div><div className="table-wrap"><table><thead><tr><th>源</th><th>关系</th><th>目标</th><th>传播</th><th>状态</th></tr></thead><tbody>{relations.map((relation) => <tr key={relation.id}><td>{relation.sourceName}</td><td><strong>{relation.type.name}</strong><span className="cell-muted">{relation.type.code}</span></td><td>{relation.targetName}</td><td>{relation.type.propagationMode}</td><td><span className={`status ${relation.active ? 'status-active' : 'status-blocked'}`}>{relation.active ? '有效' : '停用'}</span></td></tr>)}</tbody></table></div></section>
    </div>}

    {tab === 'query' && <>
      <section className="card filter-card"><div className="filter-row"><label className="field search-field"><span>起点工件版本</span><select value={querySource} onChange={(event) => setQuerySource(event.target.value)}>{versions.map(({ artifact, version }) => <option key={version.id} value={version.id}>{artifact.type.name} · {version.displayName} · {version.versionLabel}</option>)}</select></label><label className="field"><span>方向</span><select value={queryDirection} onChange={(event) => setQueryDirection(event.target.value as TraceDirection)}><option value="FORWARD">正向：查找下游</option><option value="REVERSE">反向：查找上游</option></select></label><label className="field"><span>最大深度</span><select value={queryDepth} onChange={(event) => setQueryDepth(Number(event.target.value))}>{[1, 2, 3, 4, 5].map((depth) => <option key={depth}>{depth}</option>)}</select></label><button className="button primary" onClick={runQuery}>执行有限追溯</button></div></section>
      {queryResult && <section className="card table-card"><div className="table-toolbar"><div><h2>查询结果</h2><p>{queryResult.direction} · 深度≤{queryResult.maxDepth} · {queryResult.durationMs} ms</p></div>{(queryResult.truncatedByDepth || queryResult.truncatedByNodeLimit) && <span className="trace-warning">结果可能被截断</span>}</div><div className="trace-result-grid"><div>{queryResult.nodes.map((node) => <article className="trace-node" key={node.versionId}><span>{node.artifactTypeCode}</span><strong>{node.displayName}</strong><small>{node.sourceModule} · {node.versionLabel}</small></article>)}</div><div className="trace-paths"><h3>完整路径</h3>{queryResult.paths.map((path) => <details key={path.targetVersionId}><summary>{nodeNames.get(path.targetVersionId) ?? path.targetVersionId} · {path.length}跳</summary><ol>{path.steps.map((step) => <li key={`${step.relationId}-${step.traversalDirection}`}>{nodeNames.get(step.sourceVersionId)} <b>{step.traversalDirection === 'REVERSE' ? '←' : '→'} {step.relationTypeCode}</b> {nodeNames.get(step.targetVersionId)}</li>)}</ol></details>)}</div></div></section>}
    </>}

    {tab === 'impact' && <>
      {canAnalyze ? <form className="card form-card" onSubmit={runImpact}><div className="card-heading"><h2>创建变更并生成候选</h2></div><div className="form-grid"><label className="field field-wide"><span>变更源</span><select value={impactSource} onChange={(event) => setImpactSource(event.target.value)}>{versions.map(({ artifact, version }) => <option key={version.id} value={version.id}>{artifact.type.name} · {version.displayName}</option>)}</select></label><label className="field"><span>变更类型</span><select value={changeType} onChange={(event) => setChangeType(event.target.value as ChangeType)}><option value="PARAMETER">参数变化</option><option value="HARDWARE">硬件变化</option><option value="GOAL">目标变化</option><option value="OTHER">其他变化</option></select></label><label className="field"><span>分析深度</span><select value={queryDepth} onChange={(event) => setQueryDepth(Number(event.target.value))}>{[1, 2, 3, 4, 5].map((depth) => <option key={depth}>{depth}</option>)}</select></label><label className="field"><span>变更前</span><input value={beforeContent} onChange={(event) => setBeforeContent(event.target.value)} /></label><label className="field"><span>变更后</span><input value={afterContent} onChange={(event) => setAfterContent(event.target.value)} /></label><label className="field field-wide"><span>变更说明</span><textarea required rows={3} value={changeDescription} onChange={(event) => setChangeDescription(event.target.value)} /></label></div><div className="form-actions"><button className="button primary">生成可解释影响报告</button></div></form> : <div className="card form-intro">当前角色可查看已有报告和执行追溯查询，但不能发起变更分析。</div>}
      {report && <section className="card table-card trace-report"><div className="table-toolbar"><div><h2>{report.change.sourceName}</h2><p>{report.change.changeType} · {report.status} · 规则 {report.scoringRuleVersion}</p></div>{canCreateTickets && <button className="button primary" onClick={createTickets}>为确认项创建工单</button>}</div>{(report.truncatedByDepth || report.truncatedByNodeLimit) && <div className="trace-warning-block">分析达到范围上限，候选结果可能不完整。</div>}<div className="table-wrap"><table><thead><tr><th>候选工件</th><th>分值/等级</th><th>系统路径</th><th>人工结论</th><th>操作</th></tr></thead><tbody>{report.candidates.map((candidate) => <tr key={candidate.id}><td><strong>{candidate.target.displayName}</strong><span className="cell-muted">{candidate.target.artifactTypeCode} · {candidate.target.sourceModule}</span>{candidate.tickets.map((ticket) => <span className="trace-ticket" key={ticket.id}>{ticket.externalKey}</span>)}</td><td><span className={`impact-level level-${candidate.initialLevel.toLowerCase()}`}>{candidate.initialLevel}</span><strong className="impact-score">{Number(candidate.initialScore).toFixed(1)}</strong></td><td>{candidate.paths.map((path) => <details key={path.pathRank}><summary>{path.length}跳 · 查看解释</summary><ol>{path.steps.map((step) => <li key={step.sequenceNo}>{step.relationTypeCode} · {step.traversalDirection} · 权重{Number(step.relationWeight).toFixed(2)}</li>)}</ol></details>)}</td><td><span className={`status review-${candidate.reviewStatus.toLowerCase()}`}>{candidate.reviewStatus}</span>{candidate.reviewComment && <span className="cell-muted">{candidate.reviewComment}</span>}</td><td>{canReview ? <div className="trace-actions"><button className="small-button" disabled={candidate.reviewStatus === 'CONFIRMED'} onClick={() => reviewCandidate(candidate.id, 'CONFIRMED')}>确认影响</button><button className="small-button danger-button" disabled={candidate.reviewStatus === 'EXCLUDED'} onClick={() => reviewCandidate(candidate.id, 'EXCLUDED')}>排除</button></div> : '只读'}</td></tr>)}</tbody></table></div></section>}
    </>}
  </>
}
