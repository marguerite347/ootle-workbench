import { Sandbox } from '@vercel/sandbox'
import { JOB_SECONDS, RETENTION_SECONDS } from './jobs.mjs'
// Fixed wrapper: drains all compiler output but persists only a bounded tail.
const runner = `import subprocess,sys,os,json,pathlib,shutil
os.environ['PATH'] = str(pathlib.Path.home()/'.cargo/bin') + ':' + os.environ['PATH']
os.environ['CARGO_TARGET_DIR']='/vercel/project/target'
os.environ['CARGO_BUILD_JOBS']='3'
action=sys.argv[1]
args=['cargo','test','--locked'] if action=='test' else ['cargo','build','--locked','--release','--target','wasm32-unknown-unknown']
p=subprocess.Popen(args,cwd='/vercel/project',stdout=subprocess.PIPE,stderr=subprocess.STDOUT)
tail=b''
while True:
 b=os.read(p.stdout.fileno(),4096)
 if not b: break
 tail=(tail+b)[-100000:]
 pathlib.Path('/tmp/ootle-build.log').write_bytes(tail)
code=p.wait()
if code==0 and action=='build':
 files=list(pathlib.Path('/vercel/project/target/wasm32-unknown-unknown/release').glob('*.wasm'))
 if len(files)!=1 or files[0].stat().st_size>8388608:
  code=1
  pathlib.Path('/tmp/ootle-build.log').write_bytes(tail+b'\\nExpected one WASM library artifact, at most 8 MiB.')
 else: shutil.copyfile(files[0],'/tmp/ootle-template.wasm')
sys.exit(code)
`
async function boundedFile(sandbox, path, limit) {
  const stream = await sandbox.readFile({ path })
  if (!stream) return null
  const parts = []
  let bytes = 0
  for await (const value of stream) {
    bytes += value.byteLength
    if (bytes > limit) throw new Error('Worker output exceeds limit')
    parts.push(Buffer.from(value))
  }
  return Buffer.concat(parts)
}
export function sandboxDriver(snapshotId) {
  if (!snapshotId) return null
  return {
    async start(job) {
      const sandbox = await Sandbox.create({ name: job.sandbox, source: { type: 'snapshot', snapshotId }, persistent: true, snapshotExpiration: RETENTION_SECONDS * 1000, keepLastSnapshots: { count: 1, expiration: RETENTION_SECONDS * 1000 }, timeout: JOB_SECONDS * 1000, resources: { vcpus: 4 }, networkPolicy: { allow: { 'index.crates.io': [], 'static.crates.io': [] } } })
      try {
        await sandbox.writeFiles([{ path: '/tmp/ootle-runner.py', content: Buffer.from(runner) }, ...Object.entries(job.files).map(([path, content]) => ({ path: `/vercel/project/${path}`, content: Buffer.from(content) }))])
        // Discard cached top-level WASM outputs: only this invocation may produce the downloadable artifact.
        const clean = await sandbox.runCommand('python3', ['-c', "import pathlib; [p.unlink() for p in pathlib.Path('/vercel/project/target/wasm32-unknown-unknown/release').glob('*.wasm')]"])
        if (clean.exitCode !== 0) throw new Error('Could not prepare artifacts')
        const command = await sandbox.runCommand({ cmd: 'python3', args: ['/tmp/ootle-runner.py', job.action], detached: true, timeoutMs: (JOB_SECONDS - 30) * 1000 })
        return { command: command.cmdId }
      } catch (e) {
        await sandbox.update({ persistent: false })
        await sandbox.stop()
        throw e
      }
    },
    async inspect(job) {
      const sandbox = await Sandbox.get({ name: job.sandbox })
      // Read command status from the original session without restarting the command.
      const command = await sandbox.currentSession().getCommand(job.command)
      // The provider's non-waiting status can retain a null exit code after completion.
      // Bound the SDK wait to one second; aborting a wait does not stop the process.
      let exitCode = command.exitCode
      if (exitCode === null) {
        const signal = AbortSignal.timeout(1000)
        try {
          exitCode = (await command.wait({ signal })).exitCode
        } catch (error) {
          if (!signal.aborted) throw error
        }
      }
      // If automatic stop snapshotted the completed job, file reads restore only its disk.
      const logs = (await boundedFile(sandbox, '/tmp/ootle-build.log', 100000))?.toString('utf8') || ''
      let artifact
      if (exitCode === 0 && job.action === 'build') artifact = await boundedFile(sandbox, '/tmp/ootle-template.wasm', 8 * 1024 * 1024)
      return { exitCode, logs, artifact }
    },
    async stop(job) {
      let sandbox
      try {
        sandbox = await Sandbox.get({ name: job.sandbox })
      } catch (e) {
        if (e.status === 404 || e.statusCode === 404 || e.response?.status === 404) return
        throw e
      }
      // No source-bearing snapshot is created on an ordinary finish/cancel.
      await sandbox.update({ persistent: false })
      if (sandbox.status === 'running') await sandbox.stop()
      await sandbox.delete({ deleteOrphanSnapshots: true })
    },
  }
}
