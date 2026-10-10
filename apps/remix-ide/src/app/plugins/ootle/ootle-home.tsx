import React, { useState } from 'react'
import './ootle.css'
import { EcosystemResources } from './ecosystem-resources'

export const OotleBrand = () => <span className="ootle-brand"><img src="assets/ootle/mark.svg" alt="" /><span className="ootle-wordmark"><strong>ootle</strong>workbench</span></span>

export function OotleHome({ plugin }: { plugin: any }) {
  const [error, setError] = useState('')
  const [busy, setBusy] = useState(false)
  const action = async (fn: () => Promise<any>) => { setBusy(true); setError(''); try { await fn() } catch (e) { setError(e.message) } finally { setBusy(false) } }
  const create = () => action(async () => {
    const name = `Tari_Counter_${Date.now().toString(36)}`
    await plugin.call('filePanel', 'createWorkspace', name, 'tariCounter')
    await plugin.call('filePanel', 'switchToWorkspace', { name, isLocalHost: false })
    await plugin.call('fileManager', 'open', 'src/lib.rs')
    await plugin.call('menuicons', 'select', 'filePanel')
  })
  const tools = (section: string) => action(async () => {
    await plugin.call('manager', 'activatePlugin', 'tari')
    await plugin.call('tari', 'open', section)
  })
  return <main className="ootle-home">
    <OotleBrand />
    <p className="ootle-intro">Remix a template. Build on Tari.</p>
    <div className="ootle-status">Remix IDE foundation · Tari integration preview</div>
    {error && <p role="alert" className="text-danger">{error}</p>}
    <h2>Start</h2>
    <button disabled={busy} className="ootle-start" onClick={create}><b>Create a Tari workspace</b><span>Counter template · Rust/WASM · pinned dependencies and engine tests</span></button>
    <div className="ootle-home-grid">
      <button disabled={busy} onClick={() => action(() => plugin.call('filePanel', 'clone'))}><b>Clone a repository</b><span>Use Remix’s Git workflow</span></button>
      <button disabled={busy} onClick={() => action(() => plugin.call('menuicons', 'select', 'filePanel'))}><b>Open your files</b><span>File explorer, import, search and version control</span></button>
    </div>
    <h2>Develop</h2>
    <div className="ootle-home-grid">
      <button onClick={() => tools('build')}><b>Compile & test</b><span>Use an isolated cloud worker or local Cargo</span></button>
      <button onClick={() => tools('agents')}><b>Connect your agent</b><span>Codex, Claude Cowork and other MCP agents</span></button>
      <button onClick={() => tools('assistant')}><b>Local assistant</b><span>Use an installed Ollama model through your companion</span></button>
      <button onClick={() => tools('deploy')}><b>Deploy a template</b><span>Prepare a tested build · publish with your wallet · verify the receipt</span></button>
      <button onClick={() => tools('publish')}><b>Share your project</b><span>Prepare an October or Community submission</span></button>
    </div>
    <h2>Learn & remix</h2>
    <div className="ootle-home-grid">
      <a href="https://ootle.tari.com/" target="_blank" rel="noreferrer"><b>Tari developer guides</b><span>Templates, authorization, wallets and transactions</span></a>
      <a href="https://github.com/tari-project/wasm-template" target="_blank" rel="noreferrer"><b>Official template sources</b><span>Explore Counter, tokens, NFTs, swaps and more</span></a>
    </div>
    <EcosystemResources />
    <p className="ootle-note">Workspaces save in this browser. Share a workspace to sync agent edits and use cloud builds. Export backups from the file explorer. Network deployment and Lobby publishing are separate integrations.</p>
    <footer><a href="https://github.com/marguerite347/ootle-workbench">Source & developer handoff</a> · Built on <a href="https://github.com/remix-project-org/remix-project">Remix v2.6.5</a></footer>
  </main>
}
