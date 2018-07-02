require('dotenv').config();

const TeleBot = require('telebot');
const telequest = require('./telequest');

const token = process.env.TELEGRAM_TOKEN;

const bot = new TeleBot({
  token,
  buildInPlugins: [],
  usePlugins: [],
});

telequest.on(bot);

bot.on('/start',
  (msg) => {
    const quest = telequest({
      start: {
        label: 'Wat do?',
        paths: ['dockerMenu']
      },

      dockerMenu: {
        button: 'Docker',
        label: 'Docker does?',
        paths: ['dockerNew', 'dockerUpdate', 'dockerList'],
        addInventory: ({ path }) => ({
          action: path
        })
      },

      dockerNew: {
        button: 'New',
        label: 'New, that u say',
        paths: ['dockerFile_dock', 'dockerFile_art']
      },

      dockerFile_art: {
        button: '+ Artifact',
        expect: ['document', 'text'],
        label: '😱 send me dat artifact file/url 💎',
        paths: ['dockerFile_dock'],
        addInventory: ({ document: doc, text }) => ({
          artifact: doc && doc.url || text
        })
      },

      dockerFile_dock: {
        button: 'Dockerfile',
        label: 'y u no send 🐳Dockerfile yet?',
        expect: ['document'],
        paths: ['dockerName'],
        addInventory: ({ document: doc, text }) => ({
          dockerfile: doc && doc || text
        })
      },

      dockerName: {
        label: () => { const g = Math.random() < 0.5; return `it's a ${g ? 'girl' : 'boy'}, give ${ g ? 'her' : 'him' } a name!` },
        expect: ['text'],
        paths: ['complete'],
        addInventory: ({ text }) => ({
          name: text
        })
      }
    });

    quest(bot, msg.from.id, 'start')
      .then((inventory) => console.log('shit finished', inventory)).catch(e => console.log(e));
  }
);

bot.start();
