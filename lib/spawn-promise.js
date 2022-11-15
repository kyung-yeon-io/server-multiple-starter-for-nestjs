const childProcess = require('child_process');

const SIGTERM_CODE = 143;

const spawn = async (command, commandArr, options) => {
  const child = childProcess.spawn(command, commandArr, options);

  let stdout = '';
  let stderr = '';

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
      if (code === 0) {
        resolve(stdout);
      } else {
        const error = {
          code,
        };

        if (code === SIGTERM_CODE) {
          error.message = 'TIME OUT';
        } else {
          error.message = stderr;
        }

        reject(error);
      }
    });
  });
};

module.exports = {
  spawn,
};
