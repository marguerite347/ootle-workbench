const $ = (id) => document.getElementById(id)
let account,
  incoming,
  openerOrigin,
  channel,
  busy = false
async function api(path, method = 'GET', body) {
  const res = await fetch(path, { method, headers: { 'Content-Type': 'application/json', 'X-CSRF-Token': account?.csrf || '' }, body: body ? JSON.stringify(body) : undefined })
  const data = await res.json()
  if (!res.ok) throw new Error(data.error || 'Request failed.')
  return data
}
async function task(fn) {
  if (busy) return
  busy = true
  document.querySelectorAll('button').forEach((b) => {
    b.disabled = true
  })
  $('status').textContent = ''
  try {
    await fn()
  } catch (e) {
    $('status').textContent = e.message
  } finally {
    busy = false
    document.querySelectorAll('button').forEach((b) => {
      b.disabled = false
    })
  }
}
function node(tag, text, parent, className) {
  const n = document.createElement(tag)
  n.textContent = text
  if (className) n.className = className
  parent.append(n)
  return n
}
function button(text, parent, action) {
  const n = node('button', text, parent)
  n.onclick = () => task(action)
  return n
}
function sendProject(project) {
  if (!window.opener || !channel) throw new Error('Open Connected agents from the Workbench to review files in the editor.')
  window.opener.postMessage({ type: 'ootle:project', channel, project: { id: project.id, name: project.name, version: project.version, files: project.files } }, openerOrigin)
  $('status').textContent = 'Sent to Workbench for review. Switch back to the editor to inspect and apply changes.'
}
async function refresh() {
  account = await api('/api/me')
  $('identity').textContent = `Signed in as ${account.user.login}`
  $('endpoint').value = account.endpoint
  instructions()
  for (const id of ['projects', 'connections', 'activity']) $(id).replaceChildren()
  if (!account.projects.length) node('p', 'No shared workspaces yet. Open this page from Connected agents in the Workbench and share a workspace.', $('projects'))
  for (const project of account.projects) {
    const row = node('div', '', $('projects'), 'row')
    node('strong', project.name, row)
    node('p', `Version ${project.version}`, row, 'muted')
    button('Review in Workbench', row, async () => sendProject(await api(`/api/projects/${project.id}`)))
    button('Download backup', row, async () => {
      const p = await api(`/api/projects/${project.id}`),
        url = URL.createObjectURL(new Blob([JSON.stringify(p, null, 2)], { type: 'application/json' }))
      const link = document.createElement('a')
      link.href = url
      link.download = `${p.name.replace(/[^a-zA-Z0-9_-]/g, '_')}.json`
      link.click()
      setTimeout(() => URL.revokeObjectURL(url), 1000)
    })
    if (incoming?.projectId === project.id)
      button('Upload local changes', row, async () => {
        const updated = await api(`/api/projects/${project.id}`, 'PUT', { files: incoming.files, version: incoming.version })
        sendProject(updated)
        await refresh()
      })
  }
  const active = account.connections.filter((g) => !g.revoked && g.expires > Date.now() / 1000)
  if (!active.length) node('p', 'No agents authorized. Adding a server in your agent will start authorization.', $('connections'))
  for (const grant of active) {
    const row = node('div', '', $('connections'), 'row')
    node('strong', grant.name, row)
    node('p', `${grant.projectName} · ${grant.scopes.includes('workspace:write') ? 'Read and edit' : 'Read only'} · expires ${new Date(grant.expires * 1000).toLocaleDateString()}`, row, 'muted')
    button('Disconnect', row, async () => {
      await api(`/api/connections/${grant.id}/revoke`, 'POST', {})
      await refresh()
      $('status').textContent = 'Disconnected. This agent can no longer access the project.'
    })
  }
  for (const event of account.activity) node('li', `${event.agent}: ${event.action} · ${new Date(event.at * 1000).toLocaleString()}`, $('activity'))
}
function instructions() {
  const codex = $('agent').value === 'Codex',
    claude = $('agent').value === 'Claude Cowork'
  $('instructions').textContent = claude
    ? 'In Claude, open Customize → Connectors → Add custom connector. Paste the URL below, then authorize your chosen Ootle project. If prompted for OAuth client settings, choose automatic registration.'
    : codex
      ? 'In Codex MCP settings, add this HTTP server and authenticate. For the CLI, run the commands below.'
      : 'Add a Streamable HTTP MCP server with OAuth authorization and automatic client registration. Request workspace:read and optionally workspace:write.'
  $('config').textContent = codex ? `codex mcp add ootle-workbench --url ${account.endpoint}\ncodex mcp login ootle-workbench` : account.endpoint
}
$('agent').onchange = instructions
$('copy').onclick = () =>
  task(async () => {
    await navigator.clipboard.writeText($('config').textContent)
    $('status').textContent = 'Copied connection details.'
  })
$('share').onclick = () =>
  task(async () => {
    if (!incoming) throw new Error('Reopen this page from Workbench.')
    const project = await api('/api/projects', 'POST', { name: incoming.name, files: incoming.files })
    incoming.projectId = project.id
    incoming.version = project.version
    $('incoming').hidden = true
    sendProject(project)
    await refresh()
  })
$('logout').onclick = () =>
  task(async () => {
    await api('/api/logout', 'POST', {})
    location.reload()
  })
window.addEventListener('message', (event) => {
  if (!account || event.source !== window.opener || !account.ideOrigins.includes(event.origin) || event.data?.type !== 'ootle:workspace' || typeof event.data.channel !== 'string') return
  incoming = event.data.workspace
  channel = event.data.channel
  openerOrigin = event.origin
  if (!incoming || typeof incoming.name !== 'string' || !incoming.files || typeof incoming.files !== 'object') return
  $('incoming').hidden = Boolean(incoming.projectId)
  $('incoming-summary').textContent = `${incoming.name} · ${Object.keys(incoming.files).length} text files`
  $('file-list').replaceChildren()
  for (const path of Object.keys(incoming.files)) node('li', path, $('file-list'))
  task(refresh)
})
task(async () => {
  await refresh()
  if (window.opener) for (const origin of account.ideOrigins) window.opener.postMessage({ type: 'ootle:ready' }, origin)
})
