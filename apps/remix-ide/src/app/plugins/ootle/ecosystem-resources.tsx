import React, { useState } from 'react'
import catalog from './ecosystem-resources.json'

function recordingLabel(source: string) {
  if (/concept overview/i.test(source)) return 'Concept overview'
  if (/\bannouncement\b/i.test(source)) return 'Announcement'
  if (/^app demo\b/i.test(source)) return 'App demo'
  return 'Docs walkthrough'
}

export function EcosystemResources() {
  const [query, setQuery] = useState('')
  const records = catalog.records.filter(record => `${record.title} ${record.group} ${record.summary}`.toLowerCase().includes(query.toLowerCase()))
  const opportunities = catalog.opportunities.filter(item => Date.now() < Date.parse(item.expiresAt) && `${item.title} ${item.summary}`.toLowerCase().includes(query.toLowerCase()))
  return <section id="ecosystem-resources" aria-labelledby="ecosystem-resources-title">
    <h2 id="ecosystem-resources-title">Builder resources</h2>
    <p className="ootle-note">Explore guides, language SDKs, testnet tools and reusable templates.</p>
    <label className="ootle-resource-search">Find a builder resource<input type="search" placeholder="Python, faucet, templates…" value={query} onChange={event => setQuery(event.target.value)} /></label>
    <div className="ootle-home-grid ootle-resource-grid">{records.map(record => <article key={record.id} className="ootle-resource-card">
      {record.preview ? <figure><video controls muted playsInline preload="none" src={record.preview.video} poster={record.preview.image} aria-label={`${record.title} recording`}/></figure> : <p className="ootle-note">Recording pending</p>}
      <h3><a href={record.demoUrl || record.repoUrl || record.sourceUrl} target="_blank" rel="noreferrer">{record.title} ↗</a></h3>
      <p className="ootle-card-summary">{record.cardSummary}</p>
      <div className="ootle-resource-status"><strong>{record.cardStatus}</strong>{record.preview && <span>{recordingLabel(record.preview.source)}</span>}</div>
      <p className="ootle-card-byline">{record.creator.name} · {record.group}</p>
      {(record.discussionLinks || []).map(post=><a key={post.url} href={post.url} target="_blank" rel="noreferrer">Discussion · {post.platform} ↗</a>)}
      <details className="ootle-card-details"><summary aria-label={`Details about ${record.title}`}>Details</summary>
       <p>{record.summary}</p><p>{record.status} · {record.network}</p>
       <p>{record.license || 'License not established'} · Checked {record.lastCheckedAt.slice(0,10)}</p><p>{record.preview?.source}</p>
       <a href={record.repoUrl || record.sourceUrl} target="_blank" rel="noreferrer">Source ↗</a>
      </details>
    </article>)}</div>
    {opportunities.length > 0 && <><h3>Builder opportunities</h3><div className="ootle-home-grid ootle-resource-grid">{opportunities.map(item => <article key={item.id} className="ootle-resource-card">
      <figure><video controls muted playsInline preload="none" src={item.preview.video} poster={item.preview.image} aria-label={`${item.title} recording`}/></figure>
      <h3><a href={item.sourceUrl} target="_blank" rel="noreferrer">{item.title} ↗</a></h3>
      <p className="ootle-card-summary">{item.cardSummary}</p>
      <div className="ootle-resource-status"><strong>{item.cardStatus}</strong><span>Announcement</span></div>
      <a href={item.sourceUrl} target="_blank" rel="noreferrer">Original post ↗</a>
      <details className="ootle-card-details"><summary aria-label={`Details about ${item.title}`}>Details</summary><p>{item.summary}</p><p>{item.preview.source}</p></details>
    </article>)}</div></>}
    {!records.length && !opportunities.length && <p role="status">No matching resources.</p>}
    <p className="ootle-note"><a href="https://ootle-lobby-preview.vercel.app/#ecosystem-resources" target="_blank" rel="noreferrer">View the ecosystem in the Lobby</a></p>
  </section>
}
