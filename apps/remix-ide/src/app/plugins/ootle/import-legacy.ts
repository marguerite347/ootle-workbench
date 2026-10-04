// Restore the previous Lobby editor's browser-local backup into new Remix workspaces.
// Validate everything before creating anything; never overwrite an existing workspace.
export function legacyWorkspaces(raw: string): Array<{ name: string; files: Record<string, string> }> {
  if (raw.length > 24 * 1024 * 1024) throw new Error('Backup exceeds 24 MiB.')
  const data = JSON.parse(raw)
  if (data.version !== 1 || !Array.isArray(data.workspaces) || !data.workspaces.length || data.workspaces.length > 12) throw new Error('Choose an Ootle Workbench v1 workspace backup.')
  return data.workspaces.map((workspace: any) => {
    if (typeof workspace.name !== 'string' || !workspace.files || Array.isArray(workspace.files) || typeof workspace.files !== 'object') throw new Error('Invalid workspace.')
    const entries = Object.entries(workspace.files)
    if (!entries.length || entries.length > 100) throw new Error('Expected 1–100 files per workspace.')
    let total = 0
    for (const [name, content] of entries) {
      if (!/^[\w. /-]+$/.test(name) || name.startsWith('/') || name.split('/').some(part => !part || ['..', '.', '__proto__', 'constructor', 'prototype', '.git', 'target', 'node_modules'].includes(part))) throw new Error('Unsafe backup path.')
      if (typeof content !== 'string' || content.includes('\0')) throw new Error('Only text files can be imported.')
      const size = new TextEncoder().encode(content).length
      if (size > 300000) throw new Error('Backup file exceeds 300 KB.')
      total += size
    }
    if (total > 2000000) throw new Error('Workspace exceeds 2 MB.')
    return { name: workspace.name, files: Object.fromEntries(entries) as Record<string, string> }
  })
}
