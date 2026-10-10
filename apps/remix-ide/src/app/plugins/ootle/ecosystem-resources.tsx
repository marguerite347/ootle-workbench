import React, { useState } from 'react'
import catalog from './ecosystem-resources.json'

export function EcosystemResources() {
  const [query, setQuery] = useState('')
  const records = catalog.records.filter(record => `${record.title} ${record.group} ${record.summary}`.toLowerCase().includes(query.toLowerCase()))
  return <section id="ecosystem-resources" aria-labelledby="ecosystem-resources-title">
    <h2 id="ecosystem-resources-title">Builder resources</h2>
    <p className="ootle-note">Explore guides, language SDKs, testnet tools and reusable templates.</p>
    <label className="ootle-resource-search">Find a builder resource<input type="search" placeholder="Python, faucet, templates…" value={query} onChange={event => setQuery(event.target.value)} /></label>
    <div className="ootle-home-grid ootle-resource-grid">{records.map(record => <article key={record.id} className="ootle-resource-card">
      {record.preview ? <figure><video controls muted playsInline preload="none" src={record.preview.video} poster={record.preview.image} aria-label={`${record.title} recording`}/></figure> : <p className="ootle-note">Recording pending</p>}
      <h3><a href={record.sourceUrl} target="_blank" rel="noreferrer">{record.title} ↗</a></h3>
      <p className="ootle-card-summary">{record.cardSummary}</p>
      <div className="ootle-resource-status"><strong>{record.cardStatus}</strong><span>Docs walkthrough</span></div>
      <p className="ootle-card-byline">{record.creator.name} · {record.group}</p>
      {(record.discussionLinks || []).map(post=><a key={post.url} href={post.url} target="_blank" rel="noreferrer">Discussion · {post.platform} ↗</a>)}
      <details className="ootle-card-details"><summary aria-label={`Details about ${record.title}`}>Details</summary>
       <p>{record.summary}</p><p>{record.status} · {record.network}</p>
       <p>{record.license || 'License not established'} · Checked {record.lastCheckedAt.slice(0,10)}</p><p>{record.preview?.source}</p>
       <a href={record.sourceUrl} target="_blank" rel="noreferrer">Source ↗</a>
      </details>
    </article>)}</div>
    {!records.length && <p role="status">No matching resources.</p>}
    <p className="ootle-note"><a href="https://ootle-lobby-preview.vercel.app/#ecosystem-resources" target="_blank" rel="noreferrer">View the ecosystem in the Lobby</a></p>
  </section>
}
