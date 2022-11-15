#!/usr/bin/env node
const fs = require('fs');
const { spawn } = require('../lib/spawn-promise');

let command = '';
const args = process.argv.splice(2).reduce((result, item) => {
  if (item.startsWith('-')) {
    command = item.replace(/-/g, '');
  } else if (command === 's' || command === 'server') {
    if (!result[command]) result[command] = [];
    result[command].push(item);
  } else {
    result[command] = item;
  }

  return result;
}, {});

const runServerStart = async () => {
  let confPath = args.c ?? args.conf;
  const server = [...new Set(args.s ?? args.server)];

  if (!confPath) {
    const nginxPathStr = await spawn('nginx', ['-t']);
    const startStr = 'nginx: configuration file';
    let nginxPath = nginxPathStr.substring(nginxPathStr.indexOf(startStr) + startStr.length + 1);
    confPath = nginxPath.substring(0, nginxPath.indexOf('nginx.conf') + 10);
  }

  if (!server.length) {
    throw new Error('server path 를 띄워쓰기로 구분하여 입력해주세요');
  }

  // 1. create serverList
  const serverList = [];

  let port = 3001;
  for (const serverFolderPath of server) {
    const name = serverFolderPath.substring(serverFolderPath.lastIndexOf('/') + 1);

    const file = await fs.readFileSync(serverFolderPath + '/gateway.json', { encoding: 'utf8' });
    const location = `~ (${JSON.parse(file).paths.join('|')})`;

    serverList.push({
      name,
      location,
      path: serverFolderPath,
      port,
      proxy: `http://localhost:${port}`,
    });

    port++;
  }

  const dig = await spawn('dig', ['apis.washswat.com']);

  let msaHost = '';
  if (dig.indexOf('devel') > 0) {
    msaHost = 'http://kong-internal-gateway-devel.system.ecs.internal:8000';
  } else if (dig.indexOf('stage') > 0) {
    msaHost = 'http://kong-internal-gateway-devel.system.ecs.internal:8000';
  } else if (dig.indexOf('canary') > 0) {
    msaHost = 'http://kong-internal-gateway-prod.system.ecs.internal:8000';
  } else if (dig.indexOf('prod') > 0) {
    msaHost = 'http://kong-internal-gateway-prod.system.ecs.internal:8000';
  } else {
    throw new Error('dns 를 설정해주세요. (devel|stage|canary|prod)');
  }

  const msaServer = {
    name: 'MSA_HOST',
    location: '/.+',
    proxy: msaHost,
  };

  // create nginx conf
  const location = [...serverList, msaServer].reduce((result, item) => {
    result += `
        location ${item.location} {
          proxy_pass ${item.proxy};
        }
    `;

    return result;
  }, '');

  // 2. write nginx conf
  await spawn('sh', [__dirname + '/../script/nginx-conf.sh', confPath, location]);

  // 3. restart nginx
  await spawn('brew', ['services', 'stop', 'nginx']);
  await spawn('brew', ['services', 'start', 'nginx']);

  const pwd = await spawn('pwd', []);

  // 4. start server
  await Promise.all(
    serverList.map((server) =>
      spawn(`npm`, ['run', 'start:dev'], {
        cwd: pwd + '/' + server.path,
        env: {
          ...process.env,
          PORT: server.port,
          NODE_ENV: 'local',
        },
      })
    )
  );
};

runServerStart()
  .then()
  .catch((e) => console.log('e', e));

process.once('SIGINT', async () => {
  await spawn('brew', ['services', 'stop', 'nginx']);
});
