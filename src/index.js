require('dotenv').config();

const TeleBot = require('telebot');
const { getFile } = require('./telehelp');
const TeleQuest = require('./telequest');
const Docker = require('./docker')

const token = process.env.TELEGRAM_TOKEN;

const bot = new TeleBot({
  token,
  buildInPlugins: [],
  usePlugins: [],
});

TeleQuest.on(bot);

bot.on('/start',
  (msg) => {
    const quest = TeleQuest({
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
          artifact: {
            teleFile: doc && doc.file_id,
            text
           }
        })
      },

      dockerFile_dock: {
        button: 'Dockerfile',
        label: 'y u no send 🐳Dockerfile yet?',
        expect: ['document', 'text'],
        paths: ['dockerName'],
        addInventory: ({ document: doc, text }) => ({
          dockerfile: {
            teleFile: doc && doc.file_id,
            url: text,
          }
        })
      },

      dockerName: {
        label: () => {
          const g = Math.random() < 0.5;
          return `it's a ${g ? 'girl' : 'boy'}, give ${ g ? 'her' : 'him' } a name!`;
        },
        expect: ['text'],
        paths: ['complete'],
        addInventory: ({ text }) => ({
          name: text
        })
      }
    });

    quest(bot, msg.from.id, 'start')
      .then(inv => {
        if(inv.action === 'dockerNew') {
          let promise = Promise.resolve({ artifact: { url: '' }, ...inv });

          if(inv.artifact && inv.artifact.teleFile) {
            promise = promise
              .then(inv =>
                bot.getFile(inv.artifact.teleFile)
                  .then(info => info.fileLink)
                  .then(url => ({
                    ...inv,
                    artifact: { url }
                  }))
              )
          }

          if(inv.dockerfile.teleFile) {
            promise = promise
              .then(inv =>
                getFile(bot, inv.dockerfile.teleFile)
                  .then(content => ({
                    ...inv,
                    dockerfile: { content }
                  }))
              )
          }

          promise.then(inv =>
            Docker.build(
              inv.dockerfile.content,
              {
                NAME_TAG: inv.name,
                ARTIFACT_URL: inv.artifact && inv.artifact.url
              }
            )
          )
          .then(resp => console.log('docker build', resp))
        }
      })
      .catch(e => console.log(e));
  }
);

bot.start();
