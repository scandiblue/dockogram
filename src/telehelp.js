const request = require('request');
const { wrap } = require('./callwrap');

const getFile = async (bot, file_id) => {
  const fileInfo = await bot.getFile(file_id);
  
  const [err, resp, body] = await wrap(request, fileInfo.fileLink);

  if(err != null || resp.statusCode !== 200) return null;

  return body;
}

module.exports = {
    getFile
}
