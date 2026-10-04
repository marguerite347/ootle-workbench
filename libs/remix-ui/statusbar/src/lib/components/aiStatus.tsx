import React from 'react'
interface AIStatusProps {
  plugin: any
  isAiActive: boolean
  setIsAiActive: (isAiActive: boolean) => void
  aiActive: () => Promise<any>
}
export default function AIStatus({ plugin }: AIStatusProps) {
  return <button className="btn btn-link btn-sm py-0" onClick={async () => {
    await plugin.call('manager', 'activatePlugin', 'tari')
    await plugin.call('tari', 'open', 'assistant')
  }}>Tari assistant · local connection required</button>
}
