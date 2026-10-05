const $ = (id) => document.getElementById(id)
let account,
  incoming,
  openerOrigin,
  channel,
  busy = false,
  watchedJob = null
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
  if (!window.opener) $('status').textContent = 'To share files or review changes in the editor, return to Workbench and click Connect an agent again. Your sign-in is ready.'
  $('endpoint').value = account.endpoint
  instructions()
  for (const id of ['projects', 'connections', 'activity']) $(id).replaceChildren()
  if (!account.projects.length) node('p', 'No shared workspaces yet. Open this page from Connected agents in the Workbench and share a workspace.', $('projects'))
  for (const project of account.projects) {
    const row = node('div', '', $('projects'), 'row')
    node('strong', project.name, row)
    node('p', `Version ${project.version}`, row, 'muted')
    if (account.buildsConfigured) {
      for (const action of ['build', 'test'])
        button(action === 'build' ? 'Compile WASM' : 'Run tests', row, async () => {
          $('status').textContent = 'Starting an isolated build worker…'
          const job = await api(`/api/projects/${project.id}/jobs`, 'POST', { version: project.version, action })
          watchedJob = job.id
          $('status').textContent = `${action === 'build' ? 'Compilation' : 'Tests'} ${job.status} for shared version ${project.version}.`
          await refreshJobs()
        })
    } else node('p', 'Hosted builds are awaiting service configuration.', row, 'muted')
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
  const active = account.connections.filter((g) => !g.revoked && (g.expires === null || g.expires > Date.now() / 1000))
  if (!active.length) node('p', 'No agents authorized. Adding a server in your agent will start authorization.', $('connections'))
  for (const grant of active) {
    const row = node('div', '', $('connections'), 'row')
    node('strong', grant.name, row)
    node('p', `${grant.projectName} · ${grant.scopes.includes('workspace:write') ? 'Read and edit' : 'Read only'}${grant.scopes.includes('workspace:build') ? ' + builds/tests' : ''} · ${grant.expires === null ? 'Until disconnected' : `expires ${new Date(grant.expires * 1000).toLocaleDateString()}`}`, row, 'muted')
    button('Disconnect', row, async () => {
      await api(`/api/connections/${grant.id}/revoke`, 'POST', {})
      await refresh()
      $('status').textContent = 'Disconnected. This agent can no longer access the project.'
    })
  }
  const refreshed = await Promise.allSettled([refreshModelConnection(), refreshJobs(), refreshDeployments()])
  for (const result of refreshed) if (result.status === 'rejected') $('status').textContent = result.reason.message
  for (const event of account.activity) node('li', `${event.agent}: ${event.action} · ${new Date(event.at * 1000).toLocaleString()}`, $('activity'))
}
let pollingJobs = false
async function refreshJobs() {
  if (pollingJobs || !account) return
  pollingJobs = true
  try {
    const list = await api('/api/jobs')
    const jobs = await Promise.all(list.map((job) => (['starting', 'running'].includes(job.status) ? api(`/api/jobs/${job.id}`) : job)))
    if (watchedJob) {
      const watched = jobs.find((job) => job.id === watchedJob)
      if (watched && !['starting', 'running'].includes(watched.status)) {
        $('status').textContent = `${watched.action === 'build' ? 'Compilation' : 'Tests'} ${watched.status} for shared version ${watched.version}.`
        watchedJob = null
      }
    }
    const root = $('jobs')
    const signature = JSON.stringify(jobs)
    if (root.dataset.render === signature) return
    root.dataset.render = signature
    const expanded = new Set([...root.querySelectorAll('details[open]')].map((d) => d.dataset.job))
    root.replaceChildren()
    if (!jobs.length) node('p', 'No builds yet. Compile or test a shared workspace above.', root)
    for (const job of jobs) {
      const row = node('div', '', root, 'row')
      node('strong', `${job.projectName} · ${job.action === 'build' ? 'Compile' : 'Tests'} · ${job.status}`, row)
      node('p', `Version ${job.version} · ${new Date(job.created * 1000).toLocaleString()}${job.exitCode !== null ? ` · Exit ${job.exitCode}` : ''}`, row, 'muted')
      const detail = node('details', '', row)
      detail.dataset.job = job.id
      detail.open = expanded.has(job.id)
      node('summary', 'Diagnostics and source digest', detail)
      node('p', `Source SHA-256: ${job.digest}`, detail, 'digest')
      node('pre', job.logs || (job.status === 'starting' ? 'Preparing the isolated worker…' : 'No compiler output yet.'), detail)
      if (['running', 'starting'].includes(job.status))
        button('Cancel', row, async () => {
          await api(`/api/jobs/${job.id}/cancel`, 'POST', {})
          await refreshJobs()
        })
      if (job.artifact) {
        node('p', `WASM · ${job.artifact.bytes.toLocaleString()} bytes · SHA-256: ${job.artifact.sha256}`, row, 'digest')
        const link = node('a', 'Download WASM', row, 'button')
        link.href = `/api/jobs/${job.id}/artifact`
        link.download = 'template.wasm'
        button('Prepare publication', row, async () => {
          await api(`/api/jobs/${job.id}/deployment`, 'POST', {})
          await refreshDeployments()
          $('deploy').scrollIntoView({ behavior: 'smooth' })
        })
      }
    }
  } finally {
    pollingJobs = false
  }
}
setInterval(() => {
  if (!busy && !document.hidden)
    refreshJobs().catch((e) => {
      $('status').textContent = e.message
    })
}, 5000)
function instructions() {
  const codex = $('agent').value === 'Codex',
    claude = $('agent').value === 'Claude Cowork',
    cursor = $('agent').value === 'Cursor'
  $('instructions').textContent = claude
    ? 'In Claude, open Customize → Connectors → Add custom connector. Paste the URL below, then authorize your chosen Ootle project. If prompted for OAuth client settings, choose automatic registration.'
    : codex
      ? 'In Codex MCP settings, add this HTTP server and authenticate. For the CLI, run the commands below.'
      : cursor
        ? 'Click Add to Cursor, confirm the server, then connect it in Cursor Settings → Tools & MCP. Authorize your selected project. You can also copy the mcp.json configuration below.'
        : 'Add a Streamable HTTP MCP server with OAuth authorization and automatic client registration. Request workspace:read and optionally workspace:write and workspace:build.'
  $('config').textContent = codex ? `codex mcp add ootle-workbench --url ${account.endpoint}\ncodex mcp login ootle-workbench` : cursor ? JSON.stringify({ mcpServers: { 'ootle-workbench': { url: account.endpoint } } }, null, 2) : account.endpoint
  $('cursor-install').hidden = !cursor
  $('cursor-install').href = 'cursor://anysphere.cursor-deeplink/mcp/install?' + new URLSearchParams({ name: 'ootle-workbench', config: btoa(JSON.stringify({ url: account.endpoint })) })
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

let modelProject
async function refreshModelConnection() {
  const status = await api('/api/openrouter'),
    root = $('model-account')
  root.replaceChildren()
  $('model-chat').hidden = !status.connected
  if (!status.configured) {
    node('p', 'OpenRouter setup is not complete.', root)
    return
  }
  if (!status.connected) {
    button('Connect OpenRouter', root, async () => {
      const result = await api('/api/openrouter/connect', 'POST', {})
      location.assign(result.url)
    })
    return
  }
  node('p', status.expires === null ? 'Connected until you disconnect.' : `Connected until ${new Date(status.expires * 1000).toLocaleDateString()}.`, root)
  node('p', 'OpenRouter controls its own key expiration. To remove an existing expiration, reconnect and choose No expiration on its approval screen.', root, 'muted')
  button('Reconnect OpenRouter', root, async () => {
    const result = await api('/api/openrouter/connect', 'POST', {})
    location.assign(result.url)
  })
  const settings = node('a', 'Manage or revoke key in OpenRouter', root)
  settings.href = status.settingsUrl
  settings.target = '_blank'
  settings.rel = 'noopener noreferrer'
  button('Disconnect OpenRouter', root, async () => {
    await api('/api/openrouter/disconnect', 'POST', {})
    await refreshModelConnection()
    $('status').textContent = 'OpenRouter credential removed from Workbench. Revoke the key in OpenRouter settings if you also want it invalidated there.'
  })
  const selected = $('model-project').value
  $('model-project').replaceChildren()
  for (const p of account.projects) {
    const option = node('option', p.name, $('model-project'))
    option.value = p.id
  }
  if (account.projects.some((p) => p.id === selected)) $('model-project').value = selected
  try {
    const models = await api('/api/openrouter/models')
    $('model-choice').replaceChildren()
    for (const m of models) {
      const option = node('option', m.name, $('model-choice'))
      option.value = m.id
    }
    if (models.some((m) => m.id === 'openrouter/free')) $('model-choice').value = 'openrouter/free'
    if (!models.length) $('model-status').textContent = 'No free models are available right now.'
    await loadModelProject()
  } catch (e) {
    $('model-status').textContent = e.message
  }
}
async function loadModelProject() {
  $('model-files').replaceChildren()
  $('model-replies').replaceChildren()
  modelProject = null
  if (!$('model-project').value) {
    $('model-status').textContent = 'Share a workspace first.'
    return
  }
  modelProject = await api(`/api/projects/${$('model-project').value}`)
  for (const path of Object.keys(modelProject.files)) {
    const label = node('label', '', $('model-files'), 'check'),
      input = document.createElement('input')
    input.type = 'checkbox'
    input.value = path
    label.append(input)
    label.append(document.createTextNode(path))
  }
  for (const reply of await api(`/api/projects/${modelProject.id}/chat`)) renderReply(reply)
}
function renderReply(reply) {
  const row = node('div', '', $('model-replies'), 'row')
  node('p', `${reply.model} · shared version ${reply.version} · ${reply.paths.length} files`, row, 'muted')
  node('strong', reply.question, row)
  node('pre', reply.answer, row)
}
$('model-project').onchange = () => task(loadModelProject)
$('model-send').onclick = () =>
  task(async () => {
    if (!modelProject) throw new Error('Choose a shared workspace first.')
    $('model-status').textContent = 'Waiting for the model…'
    try {
      const reply = await api(`/api/projects/${modelProject.id}/chat`, 'POST', { version: modelProject.version, model: $('model-choice').value, prompt: $('model-prompt').value, paths: [...$('model-files').querySelectorAll('input:checked')].map((input) => input.value) })
      renderReply(reply)
      $('model-prompt').value = ''
      $('model-status').textContent = 'Reply received. Your files are unchanged.'
    } catch (e) {
      $('model-status').textContent = e.message
    }
  })

async function refreshDeployments() {
  const root = $('deployments')
  const records = await api('/api/deployments')
  root.replaceChildren()
  if (!records.length) node('p', 'Run tests and compile the same shared source, then choose Prepare publication on its successful build.', root)
  for (const record of records) {
    const row = node('div', '', root, 'row')
    node('strong', `${record.projectName} · version ${record.version} · ${record.status.replaceAll('_', ' ')}`, row)
    node('p', record.message, row)
    node('p', 'Network: Esmeralda testnet', row)
    const details = node('details', '', row)
    node('summary', 'Build identity and publication evidence', details)
    node('p', `Build SHA-256: ${record.artifactSha256}`, details, 'digest')
    node('p', `Source SHA-256: ${record.sourceDigest}`, details, 'digest')
    if (record.publishedBinaryHash) node('p', `Published SHA-256: ${record.publishedBinaryHash}`, details, 'digest')
    if (record.templateAddress) node('p', `Template address: ${record.templateAddress}`, row, 'digest')
    if (record.definition) node('pre', JSON.stringify(record.definition, null, 2), details)
    if (record.fees !== undefined) node('p', `Reported fees paid (atomic units): ${record.fees ?? 'unknown'}`, details)
    const wasm = node('a', 'Download prepared WASM', row, 'button')
    wasm.href = `/api/deployments/${record.id}/artifact`
    const receipt = node('a', 'Download receipt', row, 'button')
    receipt.href = `/api/deployments/${record.id}/receipt`
    const wallet = node('a', 'Open official local wallet', row, 'button')
    wallet.href = 'http://localhost:5100/'
    wallet.target = '_blank'; wallet.rel = 'noopener noreferrer'
    const guide = node('a', 'Wallet setup and publication guide', row)
    guide.href = 'https://ootle.tari.com/guides/publishing-templates/'
    guide.target = '_blank'; guide.rel = 'noopener noreferrer'
    if (!record.transactionId) node('p', 'In your running wallet: select Esmeralda, choose a funded fee account, upload the prepared WASM, estimate the fee, and approve Publish. Copy its transaction ID below. Closing this page before publishing leaves the preparation saved; nothing is submitted by Workbench.', row)
    const label = node('label', 'Publication transaction ID', row)
    const input = node('input', '', label)
    input.value = record.transactionId || ''; input.maxLength = 64
    input.readOnly = Boolean(record.transactionId)
    input.autocomplete = 'off'; input.spellcheck = false
    if (record.status !== 'verified') button(record.transactionId ? 'Check saved transaction' : 'Save transaction and verify', row, async () => {
      await api(`/api/deployments/${record.id}/verify`, 'POST', { transactionId: input.value.trim().toLowerCase() })
      await refreshDeployments()
    })
    if (record.transactionId) {
      const result = node('a', 'View public transaction result', row)
      result.href = `${record.indexer}/transactions/${record.transactionId}/result`
      result.target = '_blank'; result.rel = 'noopener noreferrer'
    }
  }
}
