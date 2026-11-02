export async function openFileExplorer(plugin: any) {
  await plugin.call('menuicons', 'select', 'filePanel')
  if (await plugin.call('sidePanel', 'isPanelHidden')) await plugin.call('sidePanel', 'togglePanel')
}
