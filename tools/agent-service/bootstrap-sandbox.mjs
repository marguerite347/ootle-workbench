// Operator-only trusted-image preparation. Never upload user projects to this bootstrap VM.
import { Sandbox } from '@vercel/sandbox'
import { readFile } from 'node:fs/promises'
const sandbox = await Sandbox.create({ persistent: false, timeout: 45 * 60 * 1000, resources: { vcpus: 4 } })
try {
  for (const command of [
    { cmd: 'bash', args: ['-lc', 'apt-get update -qq && apt-get install -y -qq build-essential pkg-config libssl-dev clang cmake curl ca-certificates'], sudo: true },
    { cmd: 'bash', args: ['-lc', 'curl --proto "=https" --tlsv1.2 -sSf https://sh.rustup.rs -o /tmp/rustup-init.sh && sh /tmp/rustup-init.sh -y --profile minimal --default-toolchain 1.95.0 --target wasm32-unknown-unknown'] },
  ]) {
    const result = await sandbox.runCommand(command)
    if (result.exitCode !== 0) throw new Error(await result.stderr())
  }
  await sandbox.writeFiles(await Promise.all(['Cargo.toml', 'Cargo.lock', 'src/lib.rs', 'tests/counter.rs'].map(async (path) => ({ path: `/vercel/project/${path}`, content: await readFile(new URL(`../../templates/tari-counter/${path}`, import.meta.url)) }))))
  const result = await sandbox.runCommand({ cmd: 'bash', args: ['-lc', 'export PATH="$HOME/.cargo/bin:$PATH"; cargo test --locked --manifest-path /vercel/project/Cargo.toml && cargo build --locked --release --target wasm32-unknown-unknown --manifest-path /vercel/project/Cargo.toml'] })
  console.log(await result.stdout(), await result.stderr())
  if (result.exitCode !== 0) throw new Error('Trusted starter build failed')
  const wasm = await sandbox.readFileToBuffer({ path: '/vercel/project/target/wasm32-unknown-unknown/release/tariskills_counter.wasm' })
  if (!wasm || !WebAssembly.validate(wasm)) throw new Error('Invalid baseline artifact')
  await sandbox.updateNetworkPolicy('deny-all')
  const clean = await sandbox.runCommand('python3', ['-c', "import pathlib,shutil; p=pathlib.Path('/vercel/project'); [shutil.rmtree(x) if x.is_dir() else x.unlink() for x in p.iterdir() if x.name!='target']"])
  if (clean.exitCode !== 0) throw new Error('Could not remove baseline source')
  const snapshot = await sandbox.snapshot({ expiration: 0 })
  console.log('Set BUILD_SNAPSHOT_ID to', snapshot.snapshotId)
} finally {
  if (sandbox.status === 'running') await sandbox.stop()
}
