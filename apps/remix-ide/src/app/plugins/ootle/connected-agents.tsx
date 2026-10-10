import React, { useEffect, useRef, useState } from 'react'

type Files = Record<string, string>
type Snapshot = { name: string; files: Files; projectId?: string; version?: number }
type Shared = { id: string; name: string; version: number; files: Files }
const omitted = /^(\.git|node_modules|target|\.deps|\.env(?:\..*)?|.*\.(?:pem|key|p12|pfx))$/i
const textFile = /(?:\.(?:rs|toml|lock|md|txt|json|ts|tsx|js|jsx|mjs|cjs|css|html|yaml|yml|svg)|^(?:Dockerfile|LICENSE|Makefile|\.gitignore))$/i
function checked(files: any): Files {
  if (!files || typeof files !== 'object' || Array.isArray(files)) throw new Error('Invalid workspace received.')
  const entries = Object.entries(files)
  if (!entries.length || entries.length > 300) throw new Error('Expected 1–300 shared text files.')
  let size = 0
  for (const [path, content] of entries) {
    if (!textFile.test(path.split('/').pop()) || path.length > 240 || !/^[a-zA-Z0-9_.@ /-]+$/.test(path) || path.startsWith('/') || path.split('/').some(p => !p || p === '.' || p === '..' || omitted.test(p)) || typeof content !== 'string' || content.includes('\0')) throw new Error('The shared workspace contains an unsupported file.')
    size += new TextEncoder().encode(content as string).length
  }
  if (size > 3 * 1024 * 1024) throw new Error('The shared workspace exceeds 3 MiB.')
  return files
}
async function snapshot(plugin: any): Promise<Snapshot> {
  await plugin.call('fileManager', 'saveCurrentFile')
  const workspace = await plugin.call('filePanel', 'getCurrentWorkspace')
  if (!workspace?.name || workspace.isLocalHost) throw new Error('Open a browser workspace before sharing.')
  const files: Files = {}
  const walk = async (directory: string) => {
    const entries = await plugin.call('fileManager', 'readdir', directory)
    for (const [path, info] of Object.entries(entries)) {
      const name = path.replace(/^\/+/, '')
      if (name.split('/').some(p => omitted.test(p))) continue
      if ((info as any).isDirectory) await walk(path)
      else if (textFile.test(name.split('/').pop())) files[name] = await plugin.call('fileManager', 'readFile', path)
    }
  }
  await walk('')
  const after = await plugin.call('filePanel', 'getCurrentWorkspace')
  if (after?.name !== workspace.name) throw new Error('Workspace changed during sharing. Try again.')
  return { name: workspace.name, files: checked(files) }
}
const linkKey = (origin: string, name: string) => `ootle.agentLink:${origin}:${name}`
const same = (a: Files, b: Files) => Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(path => a[path] === b[path])

export function ConnectedAgents({ plugin, mode = 'agents' }: { plugin: any; mode?: 'agents' | 'deploy' }) {
  const [service, setService] = useState('')
  const [configured, setConfigured] = useState(false)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState('')
  const [status, setStatus] = useState('')
  const [pending, setPending] = useState<Shared | null>(null)
  const [baseline, setBaseline] = useState<Snapshot | null>(null)
  const [linked, setLinked] = useState<{ id: string; version: number; name: string } | null>(null)
  const popup = useRef<Window | null>(null)
  const channel = useRef('')
  const serviceOrigin = useRef('')
  const outgoing = useRef<Snapshot | null>(null)
  useEffect(() => {
    let live = true
    fetch('assets/ootle/agents.json').then(res => res.ok ? res.json() : null).then(data => { if (live && data?.serviceUrl) { setService(data.serviceUrl); setConfigured(true) } }).catch(() => {})
    return () => { live = false }
  }, [])
  useEffect(() => {
    const receive = (event: MessageEvent) => {
      if (event.source !== popup.current || event.origin !== serviceOrigin.current) return
      if (event.data?.type === 'ootle:ready') {
        popup.current?.postMessage({ type: 'ootle:workspace', channel: channel.current, workspace: outgoing.current }, serviceOrigin.current)
        setStatus('Signed in. Choose a workspace or manage your agents in the connection window.')
      }
      if (event.data?.type === 'ootle:project' && event.data.channel === channel.current) {
        try {
          const project = event.data.project
          if (typeof project.id !== 'string' || !/^[a-f0-9-]{36}$/i.test(project.id) || typeof project.name !== 'string' || project.name.length > 100 || !Number.isSafeInteger(project.version) || project.version < 1) throw new Error('Invalid project received.')
          checked(project.files)
          setPending(project); setStatus('Shared workspace received. Review the changes below before applying them.')
        } catch (e) { setError(e.message) }
      }
    }
    window.addEventListener('message', receive)
    return () => window.removeEventListener('message', receive)
  }, [])
  const task = async (fn: () => Promise<void>) => { setBusy(true); setError(''); try { await fn() } catch (e) { setError(e.message) } finally { setBusy(false) } }
  const open = () => {
    let endpoint: URL
    try {
      endpoint = new URL(service)
      if (endpoint.username || endpoint.password || endpoint.pathname !== '/' || endpoint.search || endpoint.hash || (endpoint.protocol !== 'https:' && !(endpoint.protocol === 'http:' && ['127.0.0.1', 'localhost'].includes(endpoint.hostname)))) throw new Error()
    } catch { setError('Enter the HTTPS origin of your Workbench agent service, or HTTP localhost for development.'); return }
    // A normal tab is discoverable in embedded browsers that do not expose popup
    // windows. Keep the opener: the exact-window/origin handshake below needs it.
    // Open synchronously to preserve user activation; never send files in the URL.
    const connection = window.open('about:blank', '_blank')
    if (!connection) { setError('Your browser blocked the connection tab. Allow this Workbench to open a new tab, then try again.'); return }
    popup.current = connection
    task(async () => {
      const local = await snapshot(plugin)
      let saved = linked?.name === local.name ? linked : null
      try { saved ||= JSON.parse(localStorage.getItem(linkKey(endpoint.origin, local.name)) || 'null') } catch {}
      if (saved && (typeof saved.id !== 'string' || !Number.isSafeInteger(saved.version) || saved.version < 1)) saved = null
      setLinked(saved)
      outgoing.current = { ...local, ...(saved ? { projectId: saved.id, version: saved.version } : {}) }
      setBaseline(local); setPending(null)
      channel.current = crypto.randomUUID(); serviceOrigin.current = endpoint.origin
      connection.location.href = `${endpoint.origin}/connect${mode === 'deploy' ? '#deploy' : ''}`
      setStatus('Complete GitHub sign-in and workspace sharing in the new connection tab, then return here to review changes.')
    }).catch(() => {})
  }
  const apply = () => task(async () => {
    if (!pending || !baseline) return
    const current = await snapshot(plugin)
    if (current.name !== baseline.name || !same(current.files, baseline.files)) throw new Error('Your local workspace changed since this review began. Nothing was overwritten. Import the shared version as a new workspace to compare safely.')
    // No delete tool is offered remotely. Preserve any local files absent from a remote project.
    const changes = Object.entries(pending.files).filter(([path, content]) => current.files[path] !== content)
    const written: string[] = []
    try {
      for (const [path, content] of changes) {
        if ((await plugin.call('filePanel', 'getCurrentWorkspace'))?.name !== baseline.name) throw new Error('Workspace changed during apply.')
        // Include files outside the default share manifest in collision protection.
        if (Object.prototype.hasOwnProperty.call(current.files, path) && await plugin.call('fileManager', 'readFile', path) !== current.files[path]) throw new Error(`Local file changed during apply: ${path}`)
        if (!Object.prototype.hasOwnProperty.call(current.files, path) && await plugin.call('fileManager', 'exists', path)) throw new Error(`Unshared local file already exists: ${path}`)
        await plugin.call('fileManager', 'writeFile', path, content); written.push(path)
      }
    } catch (e) { throw new Error(`${e.message} ${written.length} file(s) were applied. The shared version is still available; review before retrying.`) }
    const updated = await snapshot(plugin)
    try { localStorage.setItem(linkKey(serviceOrigin.current, updated.name), JSON.stringify({ id: pending.id, version: pending.version, name: updated.name })) } catch {}
    setLinked({ id: pending.id, version: pending.version, name: updated.name }); setBaseline(updated); setPending(null)
    setStatus(`${changes.length} file(s) applied. Linked to shared workspace version ${pending.version}. Local files are preserved.`)
  })
  const recover = () => task(async () => {
    if (!pending) return
    const name = `Agent_${pending.name.replace(/[^a-zA-Z0-9_-]/g, '_').slice(0, 30)}_${Date.now().toString(36)}`
    await plugin.call('filePanel', 'createWorkspace', name, 'blank')
    await plugin.call('filePanel', 'switchToWorkspace', { name, isLocalHost: false })
    for (const [path, content] of Object.entries(pending.files)) await plugin.call('fileManager', 'writeFile', path, content)
    try { localStorage.setItem(linkKey(serviceOrigin.current, name), JSON.stringify({ id: pending.id, version: pending.version, name })) } catch {}
    setLinked({ id: pending.id, version: pending.version, name }); setBaseline(await snapshot(plugin)); setPending(null)
    setStatus('Shared files imported into a new workspace. Your original workspace is unchanged.')
  })
  const changed = pending ? Object.keys(pending.files).filter(path => baseline?.files[path] !== pending.files[path]) : []
  return <section className="ootle-agents" aria-label="Connected agents">
    <h2>{mode === 'deploy' ? 'Publish a tested template' : 'Agents & OpenRouter'}</h2>
    <p>{mode === 'deploy' ? 'Open your shared workspace, prepare a passing build, and publish its WASM through the official Tari wallet. Save the transaction to verify its network result and template ABI.' : 'Connect Codex, Claude Cowork or Cursor to a workspace you choose. Review their changes here, or open the connection window to chat through OpenRouter.'}</p>
    {mode === 'agents' && <div className="ootle-agent-options"><span>Codex</span><span>Claude Cowork</span><span>Cursor</span><span>OpenRouter</span><span>Other MCP agents</span></div>}
    <ol className="ootle-agent-steps"><li>{mode === 'deploy' ? 'Compile and test shared source' : 'Sign in with GitHub'}</li><li>{mode === 'deploy' ? 'Publish with your testnet wallet' : 'Share a workspace'}</li><li>{mode === 'deploy' ? 'Verify and save the receipt' : 'Authorize your agent'}</li></ol>
    {!configured && <p className="ootle-note">Hosted agent connections are not configured for this deployment. You can connect a separately hosted Workbench agent service below.</p>}
    <details open={!configured}><summary>Connection service</summary><label>Workbench service URL<input value={service} onChange={e => { setService(e.target.value); setLinked(null) }} placeholder="https://your-workbench-agent-service.example" /></label><p>Use a service you trust. After sign-in, the connection window receives this workspace’s supported text files so you can review and share them. Environment files, private-key files and build output are excluded.</p></details>
    <button disabled={busy || !service} onClick={open}>{busy ? 'Preparing workspace…' : mode === 'deploy' ? 'Open template publications' : linked ? 'Manage agents, builds & sync' : 'Open connections'}</button>
    <p className="ootle-note">Read, edit and cloud-build access are granted per project. Compile and test shared versions in the connection window. Deployment permissions are separate. Local workspaces stay in your browser until you share them.</p>
    {error && <p className="ootle-error" role="alert">{error}</p>}
    {status && <p role="status" aria-live="polite">{status}</p>}
    {pending && <div className="ootle-agent-review"><h2>Review shared changes</h2><p>{pending.name} · version {pending.version} · {changed.length} changed files</p>{changed.map(path => <details key={path}><summary>{path}</summary><b>Local</b><pre>{baseline?.files[path] ?? '(new file)'}</pre><b>Shared</b><pre>{pending.files[path]}</pre></details>)}<div className="ootle-actions"><button disabled={busy} onClick={apply}>Apply to current workspace</button><button disabled={busy} onClick={recover}>Import as new workspace</button><button disabled={busy} onClick={() => setPending(null)}>Dismiss</button></div></div>}
  </section>
}
