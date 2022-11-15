const childProcess = require('child_process');

const spawn = async (command, commandArr, options) => {
  const child = childProcess.spawn(command, commandArr, options);

  let stdout = '';

  child.stdout.on('data', (data) => {
    const str = data.toString().replace(/(\r?\n)$/, '');
    if (stdout.length > 0) {
      stdout += '\n';
    }

    console.log(str);
    stdout += str;
  });

  child.stderr.on('data', (data) => {
    const str = data.toString().replace(/(\r?\n)$/, '');
    if (stdout.length > 0) {
      stdout += '\n';
    }

    console.log(str);
    stdout += str;
  });

  return new Promise((resolve, reject) => {
    child.on('error', (code) => {
      reject(code);
    });
    child.on('close', (code) => {
      resolve(stdout);
    });
  });
};

module.exports = {
  spawn,
};
