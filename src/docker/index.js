const { bindWrap } = require('../callwrap');

const { spawn } = require('child_process');

const { validate } = require('dockerfile-utils');

const call = (cmd, args, options) => spawn(cmd, args, options);
const strToArgs = str => str.split(' ');
const callArgs = args => [args[0], args.slice(1)];
const sCall = (str, options) => call(...callArgs(strToArgs(str)), options);

const dockerSockArg = '-v /var/run/docker.sock:/var/run/docker.sock';

/*
file: content of Dockerfile
buildArgs: {key: value}, will be converted to -e $key=$value
  these are used in DOCKER_BUILDER_TAG image
*/
const build = (file, buildArgs) => {

  const args = Object
    .entries(buildArgs)
    .map(([key, value]) => `-e ${key}=${value}`)
    .join(' ');

  const cmd = `docker run --rm -i ${args} ${dockerSockArg} ${process.env.DOCKER_BUILDER_TAG}`;
  console.log('docker cmd', cmd);
  const p = sCall(cmd);

  let buff = [];

  p.stdout.on('data', (data) => buff.push(data));
  p.stderr.on('data', (data) => buff.push(data));

  p.stdin.write(file);
  p.stdin.end();

  return bindWrap(p)(p.on, 'close')
    .then(([code]) => ({ code, output: buff.join('') }));
}

module.exports = {
  build
}
