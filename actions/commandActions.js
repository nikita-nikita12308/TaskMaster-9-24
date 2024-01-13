const {
  getAllTopics,
  createTopicAndAssociateWithGroup,
} = require('../database/topicService');
const {
  getSelectedGroupId,
  createGroup,
  getAllGroupsForUser,
} = require('../database/groupService');
const { getOverallProgress } = require('../database/progressService');
const { getUserIdByUserIdentifier } = require('../database/userService');
const { createTask } = require('../database/taskService');
const {
  downloadImage,
  getUserStates,
  setUserStates,
} = require('../utils/utils');
const { generateOverAllChartUrl } = require('../charts');
const isValidString = (str) => /^[\p{L}0-9\s]+$/u.test(str);
const slugify = require('slugify');

async function chart(ctx) {
  try {
    const userId = ctx.from.id;
    let userStates = getUserStates(userId) || [];
    const selectedGroupId = await getSelectedGroupId(userId);
    const dbUserId = await getUserIdByUserIdentifier(userId);
    const topics = await getAllTopics(selectedGroupId, dbUserId);
    const currentState = 'Chart State';
    const timestamp = new Date().toISOString();

    const inlineKeyboard = topics.map((topic) => [
      {
        text: topic.name.replace(/_/g, ' '),
        callback_data: `button_${slugify(topic.name, {
          lower: true,
          remove: /[*+~.()'"!:@]/g,
        })}`,
      },
    ]);

    const overallProgress = await getOverallProgress(userId, topics);
    const chartUrl = generateOverAllChartUrl(overallProgress.overallPercentage);
    const imageBuffer = await downloadImage(chartUrl);

    inlineKeyboard.unshift([
      { text: 'Вибрати групу', callback_data: 'buttonAllGroups' },
      { text: 'Всі теми', callback_data: 'buttonAllSubjects' },
    ]);

    const replyMarkup = {
      reply_markup: {
        inline_keyboard: inlineKeyboard,
      },
    };
    const allInstructions = `
Для створення нової групи використовуйте команду:\n*\/newGroup* \`<назва_групи>\` \`<назва_теми>\` \`<назва_теми>\`
Для створення нового завдання використовуйте команду:\n*\/newTask* \`<назва_теми>\` \`<завдання>\`
`;

    await ctx.telegram.sendMessage(userId, allInstructions, {
      parse_mode: 'MarkdownV2',
    });

    const chartMessage = await ctx.replyWithPhoto(
      {
        source: imageBuffer,
        caption: `Chart Caption - ${timestamp}`,
      },
      replyMarkup
    );

    userStates[userStates.length - 1] = {
      state: currentState,
      messageId: chartMessage.message_id,
      replyMarkup: replyMarkup.reply_markup,
    };

    setUserStates(userId, userStates);
  } catch (error) {
    console.log('Error:', error);
  }
}
async function newGroup(ctx) {
  const commandArgs = ctx.message.text.split(' ');
  const groupName = commandArgs[1];
  const topicNames = commandArgs.slice(2);

  if (!groupName || topicNames.length === 0) {
    return ctx.reply('Укажіть назву групи та принаймні одну тему.');
  }

  if (topicNames.length > 15) {
    return ctx.reply(`Перевищено максимальний ліміт у 15 тем.`);
  }

  if (!isValidString(groupName)) {
    return ctx.reply(
      'Недійсні символи в назві групи. Допускаються лише буквено-цифрові символи та пробіли.'
    );
  }

  for (const topicName of topicNames) {
    if (!isValidString(topicName)) {
      return ctx.reply(
        `Недійсні символи в назві теми "${topicName}". Допускаються лише буквено-цифрові символи та пробіли.`
      );
    }
  }

  const existingGroups = await getAllGroupsForUser(ctx.from.id);
  const dbUserId = await getUserIdByUserIdentifier(ctx.from.id);
  const existingTopics = await getAllTopics('null', dbUserId);
  if (existingGroups) {
    const groupExist = existingGroups.find((group) => group.name === groupName);
    if (groupExist) {
      return ctx.reply(`Група з назвою "${groupName}" уже існує.`);
    }
    const uniqueTopicNames = new Set();
    for (const topicName of topicNames) {
      if (uniqueTopicNames.has(topicName)) {
        return ctx.reply(`Виявлено повторювану назву теми "${topicName}".`);
      }
      const existingTopic = existingTopics.some(
        (topic) => topic.name === topicName
      );
      if (existingTopic) {
        return ctx.reply(
          `Тема з назвою "${topicName}" вже існує в іншій групі.`
        );
      }
      uniqueTopicNames.add(topicName);
    }
    await createGroup(groupName, ctx.from.id, topicNames);
    ctx.reply(
      `Групу "${groupName}" успішно створено з темами: ${topicNames.join(
        ', '
      )}.`
    );
  } else {
    await createGroup(groupName, ctx.from.id, topicNames);
    ctx.reply(
      `Групу "${groupName}" успішно створено з темами: ${topicNames.join(
        ', '
      )}.`
    );
  }
}
async function newTask(ctx) {
  try {
    // Extract topic and task description from the command
    const [, topic, description] = ctx.message.text.split(' ');

    if (!topic || !description) {
      await ctx.reply('Будь ласка, надайте як тему, так і завдання.');
      return;
    }

    const userId = ctx.from.id;
    const dbUserId = await getUserIdByUserIdentifier(userId);
    const topics = await getAllTopics('null', dbUserId);
    const topicExists = topics.some((topicObj) => topicObj.name === topic);

    if (!topicExists) {
      await ctx.reply(`Тема "${topic}" не існує. Спочатку створіть таку тему.`);
      return;
    }

    const userNickname = ctx.from.username;
    await createTask(topic, ctx.from.id, description);

    await ctx.reply(`Нове завдання додано до теми "${topic}": ${description}`);
  } catch (error) {
    console.log('Error:', error);
  }
}

module.exports = {
  chart,
  newGroup,
  newTask,
};
