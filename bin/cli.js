#!/usr/bin/env node
const fs = require('fs');
const { spawn } = require('../lib/spawn-promise');
const { DEFAULT_HOST_URL } = require('../constant');

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

  // 1. create serverHostList
  const serverHostList = [];

  let port = 3001;
  for (const serverFolderPath of server) {
    const name = serverFolderPath.substring(serverFolderPath.lastIndexOf('/') + 1);

    const locationPath = [];

    try {
      const file = await fs.readFileSync(serverFolderPath + '/gateway.json', { encoding: 'utf8' });
      locationPath.push(...JSON.parse(file ?? {}).paths);
    } catch (e) {}

    if (!locationPath.length) {
      throw new Error(`${serverFolderPath} 프로젝트의 gateway.json 파일 설정이 올바르지 않습니다.`);
    }

    serverHostList.push({
      name,
      location: `~ (${locationPath.join('|')})`,
      path: serverFolderPath,
      port,
      proxy: `http://localhost:${port}`,
    });

    port++;
  }

  const defaultServerHost = {
    name: 'DEFAULT_HOST_URL',
    location: '/.+',
    proxy: DEFAULT_HOST_URL,
  };

  // create nginx conf
  const location = [...serverHostList, defaultServerHost].reduce((result, item) => {
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
    serverHostList.map((server) =>
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
