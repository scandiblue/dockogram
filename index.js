require('dotenv').config();

const TeleBot = require('telebot');
const request = require('request');
const { spawn } = require('child_process');

const validateDockerfile = require('validate-dockerfile');


const call = (cmd, args, options) => spawn(cmd, args, options);
const strToArgs = str => str.split(' ');
const callArgs = args => [args[0], args.slice(1)];
const sCall = (str, options) => call(...callArgs(strToArgs(str)), options);


const token = process.env.TELEGRAM_TOKEN;
const bot = new TeleBot(token);


/*
wrap: converts stupid callback to promise...

f(thoseArgs, (...args) => {});
wrap(f, thoseArgs).then((...args) => {});

*/
const wrap =
  (func, ...args) => new Promise(
    (resolve) => func(...args, (...callback_args) => resolve(callback_args))
  )


const getFile = async (file_id) => {
  const fileInfo = await bot.getFile(file_id);
  
  const [err, resp, body] = await wrap(request, fileInfo.fileLink);

  if(err != null || resp.statusCode !== 200) return null;

  return body;
}

bot.on('text', (msg) => msg.reply.text(msg.text));

bot.on('document', async (msg) => {
  const file = await getFile(msg.document.file_id);

  const answ = validateDockerfile(file);

  if(answ.valid === true) {
    msg.reply.text(`Valid: Yes`);
    const p = sCall(`docker run --rm -i -v /var/run/docker.sock:/var/run/docker.sock ${process.env.DOCKER_BUILDER_TAG}`);

    let stdoe = [];

    p.stdout.on('data', (data) => stdoe.splice(15, 15, data));
    p.stderr.on('data', (data) => stdoe.push(15, 15, data));

    p.stdin.write(file);
    p.stdin.end();

    return wrap((...args) => p.on(...args), 'close')
      .then(([code]) => {
        console.log(`Child died with exit code ${code}`);

        if(code !== 0) {
          return msg.reply.text('```' + stdoe.join('') + '```shit broke xD', { parseMode: 'Markdown', asReply: true });
        }

        return msg.reply.text('Built!', { asReply: true })
      });
  }

  console.log('answ', answ);
  msg.reply.text(
    [].concat(
      [
        `Valid: No`,
        answ.priority != null && `Priority: ${answ.priority}`,
        answ.line != null && `Line: ${answ.line},`,
        answ.message != null && `Message: ${answ.message}`,
      ],
      answ.errors != null &&
      answ.errors.length > 0 &&
      '\n`' + answ.errors.map(({message}) => message) + '`'
    )
    .filter(x => x !== false)
    .join('\n')
    , { parseMode: 'Markdown' }
  )
});

bot.start();
