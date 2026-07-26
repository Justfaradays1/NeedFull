const { spawn } = require('child_process');
const child = spawn('npx.cmd', ['next', 'dev', '--webpack', '-p', '3000'], {
  cwd: 'C:\\Users\\user\\Desktop\\NeedFull\\needfull-frontend',
  stdio: 'ignore',
  detached: true,
  windowsHide: true
});
child.unref();
console.log('Dev server PID:', child.pid);
