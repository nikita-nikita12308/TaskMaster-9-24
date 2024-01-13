const { Telegraf } = require('telegraf');
require('dotenv').config();
const db = require('./database/database.js');

const { chart, newGroup, newTask } = require('./actions/commandActions.js');

const {
  buttonTopic,
  buttonAllGroups,
  groupSelect,
  buttonAllTopics,
  toggleTask,
  chartBack,
  buttonDelete,
  buttonDeleteGroup,
  deleteTask,
} = require('./actions/buttonActions.js');

console.log('started');

const bot = new Telegraf(process.env.TELEGRAM_BOT_TOKEN);

bot.start((ctx) => {
  const example = `
Приклад використання TaskMaster Bot:

1 Створіть нову групу:
\`/newGroup МояГрупа РоботаНадПроектом\`

2 Додайте завдання в групу:
\`/newTask РоботаНадПроектом ПідготуватиПрезентацію\`

3 Почніть відстежувати хід виконання завдань

Команда /chart:
Отримайте графік виконання завдань для групи:

Пам'ятайте, команди вводяться в чаті, і бот автоматично обробляє ваші завдання; Удачі з управлінням завданнями 🚀
  `;

  // Sending the message to the chat ID of the user who triggered the /start command
  ctx.telegram.sendMessage(ctx.chat.id, example, { parse_mode: 'MarkdownV2' });
});

bot.action('buttonAllGroups', buttonAllGroups);
bot.action('buttonAllSubjects', buttonAllTopics);
bot.action('chartBack', chartBack);
bot.action('buttonDelete', buttonDelete);
bot.action(/buttonDeleteGroup_(.+)/, buttonDeleteGroup);
bot.action(/group_(.+)/, groupSelect);
bot.action(/toggleTask_(.+)_([^ ]+)/, toggleTask);
bot.action(/deleteTask_(.+)_([^ ]+)/, deleteTask);
bot.action(/button_.+/, buttonTopic);

bot.command('chart', chart);
bot.command('newGroup', newGroup);
bot.command('newTask', newTask);

bot.launch();
