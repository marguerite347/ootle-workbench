import React, { useState } from 'react'
import catalog from './ecosystem-resources.json'

export function EcosystemResources() {
  const [query, setQuery] = useState('')
  const records = catalog.records.filter(record => `${record.title} ${record.group} ${record.summary}`.toLowerCase().includes(query.toLowerCase()))
  return <section id="ecosystem-resources" aria-labelledby="ecosystem-resources-title">
    <h2 id="ecosystem-resources-title">Builder resources</h2>
    <p className="ootle-note">Docs → language SDK → testnet faucet → templates. Sources checked October 10, 2026. These references do not change your workspace or install packages.</p>
    <label className="ootle-resource-search">Find a builder resource<input type="search" placeholder="Python, faucet, templates…" value={query} onChange={event => setQuery(event.target.value)} /></label>
    <div className="ootle-home-grid ootle-resource-grid">{records.map(record => <a key={record.id} href={record.sourceUrl} target="_blank" rel="noreferrer">
      <span>{record.group} · {record.network}</span><b>{record.title} ↗</b><span>{record.summary}</span><strong className="ootle-resource-status">{record.status}</strong>
      <span>{record.creator.name} · {record.license || 'License not established'}</span>
    </a>)}</div>
    {!records.length && <p role="status">No matching resources.</p>}
    <p className="ootle-note"><a href="https://ootle-lobby-preview.vercel.app/#ecosystem-resources" target="_blank" rel="noreferrer">View the ecosystem in the Lobby</a></p>
  </section>
}
