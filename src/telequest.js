
const eventBus = {
  events: [],

  matcher(type, ev, msg, data) {
    const msgHasReply = msg.reply_to_message != null;
    const evHasReply = ev.reply_to_message != null;

    if(msgHasReply) {
      if(evHasReply === false) return null;

      const msgReplyId = msg.reply_to_message.message_id;
      const evReplyId = ev.reply_to_message;

      if(msgReplyId !== evReplyId) return null;
    }

    switch(type) {
      case 'callbackQuery':
      case 'command':
      case 'text': {
        return ev.regex == null
          ? data
          : ev.regex.exec(data);
      }

      case 'document':
        return [];

      default: {
        console.warn(`No matcher for type ${type}`);
        return null;
      }
    }
  },

  publish(type, msg, data) {
    this.events = this.events
      .reduce((pending, event) => {
        if(event.garbage === true) return pending;

        if(event.types.every(evType => evType !== type)) {
          return [...pending, event];
        }

        const match = this.matcher(type, event, msg, data);
        if(match === null) return [...pending, event];

        event.resolve({ match: [...match], [type]: data });

        return pending;
      }, [])
  },

  subscribe(
    types,
    {
      regex,
      reply_to_message,
      timeout=60000
    }
  ) {
    return new Promise((resolve, reject) => {
      this.events = [
        ...this.events,
        {
          types,

          regex,
          reply_to_message,

          resolve: (args) => resolve(args)
        }
      ];
    });
  }
}


const botSubscription = (bot) => {
  // table for translating message types to there data key
  const typeToKey =
    (type) => ({ command: 'text' }[type]) || type;

  bot.on('*', (msg, info) => {
    const dataKey = typeToKey(info.type);

    eventBus.publish(info.type, msg, msg[dataKey])
  });


  bot.on('callbackQuery', (msg, info, ...args) => {
    eventBus.publish(info.type, msg, msg['data'])
    bot.answerCallbackQuery(msg.id);
  });
}


const buttons = (bot, paths) => {
  const buttons = paths.map(
    ({ text, path }) => bot.inlineButton(text, { callback: path })
  );
  const keyboard = bot.inlineKeyboard([buttons], { resize: true })
  return { replyMarkup: keyboard };
}


const renderMessage = 
  (bot, {userId, label, markdown}, prevMsg=null, purgePrevMsg=false) => {
    let promise = Promise.resolve();
    
    if(prevMsg && purgePrevMsg === false) {
      promise = bot.editMessageText(
        { chatId: prevMsg.chat.id, messageId: prevMsg.message_id },
        label,
        markdown
      )
    } else {
      promise = bot.sendMessage(userId, label, markdown)
    }

    return promise;
  }


const Menu = (quests, bot, quest) => {
  const hook = () => eventBus.subscribe(
    quest.expect,
    {
      regex: new RegExp('/callbackQuery (.+)')
    }
  )
  .then(data => ({ ...data, path: data.match[1] }))

  const paths = quest.paths
    .reduce((valids, path) => {
      if(quests[path] == null) return valids;

      const q = quests[path];
      return [
        ...valids,
        {
          text: q.button,
          path: `/callbackQuery ${path}`
        }
      ]
    }, []);

  const markdown = buttons(bot, paths);

  return { hook, markdown };
};


const Reply = (quests, bot, quest) => {
  const hook =
    (msg) =>
      eventBus.subscribe(
        quest.expect,
        { reply_to_message: msg.message_id }
      )
      .then(data => ({ ...data, path: quest.paths[0] }));

  return {
    hook,
    purgePrevMsg: true,
    markdown: {
      replyMarkup: {
        force_reply: true
      }
    },
  };
}


const updateInventory = (inventory, quest, data) => {
  if(quest.addInventory == null) return inventory;

  const newInventory = quest.addInventory(data);
  if(newInventory == null) return inventory;
  
  return {
    ...inventory,
    ...newInventory
  }
};

const questSelector = (quests, bot, quest) => {
  if(quest.expect[0] === 'callbackQuery') {
    return Menu(quests, bot, quest);
  }

  return Reply(quests, bot, quest);
}

const renderQuest = (quests, bot, userId, path, prevMsg=null, inventory={}) => {
  if(quests[path] == null) {
    return Promise.reject(`Quest path '${path} was not found!`);
  }

  const quest = {
    expect: ['callbackQuery'],
    ...quests[path]
  };

  const { hook, markdown, purgePrevMsg=false } = questSelector(quests, bot, quest);
  
  const msgPromise = renderMessage(
    bot,
    {
      userId,
      markdown,
      label: typeof quest.label === 'function'
        ? quest.label(inventory)
        : quest.label
    },
    prevMsg,
    purgePrevMsg
  );

  return msgPromise
    .then(prevMsg =>
      hook(prevMsg).then(data => ({
        prevMsg,
        path: data.path,
        inventory: updateInventory(inventory, quest, data)
      }))
    )
    .then(({ prevMsg, path, inventory }) => 
      path === 'complete'
      ? inventory
      : renderQuest(quests, bot, userId, path, prevMsg, inventory)
    )
}


const telequest = (quests) => 
    (bot, userId, path) =>
      renderQuest(quests, bot, userId, path);


telequest.on = (bot) => botSubscription(bot);

module.exports = telequest;
