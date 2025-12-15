import { spawn } from 'child_process';

const cmds = [
  ['node', ['src/rest_single.js']],
  ['node', ['src/rest_batch.js']],
  ['npm', ['run', 'trpc:1']],
  ['npm', ['run', 'trpc:5']],
  ['node', ['src/grpc_direct.js']],
  ['node', ['src/grpc_via_api.js']],
];

function runOne([bin, args]) {
  return new Promise((resolve) => {
    console.log('\n==============================');
    console.log('$', bin, ...args);
    const p = spawn(bin, args, {
      stdio: 'inherit',
      shell: true   // IMPORTANT for Windows (npm command)
    });
    p.on('exit', () => resolve());
  });
}

(async () => {
  for (const c of cmds) {
    await runOne(c);
  }
})();
