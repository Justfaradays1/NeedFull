const { spawn } = require('child_process');

const cmd = process.env.COMSPEC || 'cmd.exe';

const child = spawn(cmd, ['/c', 'npx.cmd', 'next', 'dev', '--webpack', '-p', '3000'], {
  cwd: 'C:\\Users\\user\\Desktop\\NeedFull\\needfull-frontend',
  stdio: ['ignore', 'pipe', 'pipe'],
  detached: true,
  windowsHide: false,
});

child.stdout.on('data', (d) => process.stdout.write(d));
child.stderr.on('data', (d) => process.stderr.write(d));

child.on('error', (err) => console.error('spawn error:', err));
child.on('exit', (code) => console.log('exited with code:', code));

console.log('Dev server PID:', child.pid);

setTimeout(() => {
  console.log('Server should be starting...');
  process.exit(0);
}, 5000);
