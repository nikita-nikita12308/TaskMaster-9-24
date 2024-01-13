const {
  getTopicTitleBySlug,
  getAllTopics,
} = require('../database/topicService');
const {
  getAllGroupsForUser,
  saveSelectedGroup,
  getSelectedGroupId,
  deleteGroupAndRelatedData,
} = require('../database/groupService');
const { getOverallProgress } = require('../database/progressService');
const { getUserIdByUserIdentifier } = require('../database/userService');
const {
  getTasksByTopicSlug,
  getTaskById,
  toggleTaskCompletion,
  deleteTaskFromDB,
} = require('../database/taskService');
const {
  downloadImage,
  getUserStates,
  setUserStates,
} = require('../utils/utils');
const {
  generateSpecificChartUrl,
  generateOverAllChartUrl,
  generateAllTopicsChartUrl,
} = require('../charts');

const slugify = require('slugify');
let userGroupStates = {};

async function buttonTopic(ctx) {
  try {
    const userId = ctx.from.id;
    const buttonText = ctx.match[0].substring('button_'.length);
    const title = await getTopicTitleBySlug(buttonText);
    const userName = ctx.from.username;
    const tasks = await getTasksByTopicSlug(buttonText, ctx.from.id);
    const chartUrl = generateSpecificChartUrl(`@${userName}`, title, tasks);
    const imageBuffer = await downloadImage(chartUrl);
    const taskButtons = tasks.map((task) => [
      {
        text: `${task.description} ${task.completed ? '✅' : '❌'}`,
        callback_data: `toggleTask_${task.id}_${buttonText}`,
      },
      { text: '🗑', callback_data: `deleteTask_${task.id}_${buttonText}` },
    ]);

    // Use the exported getUserStates and setUserStates functions
    const userStatesData = getUserStates(userId) || [];

    const inlineKeyboard = [
      ...taskButtons,
      [{ text: 'На Головну', callback_data: 'chartBack' }],
    ];

    // Update the user state with the new chart information
    const updatedUserStates = [...userStatesData];
    updatedUserStates.push({
      state: 'button_',
      messageId: ctx.callbackQuery.message.message_id,
      replyMarkup: { inline_keyboard: inlineKeyboard },
    });

    // Use the exported setUserStates function
    setUserStates(userId, updatedUserStates);

    await ctx.telegram.editMessageMedia(
      ctx.chat.id,
      updatedUserStates[updatedUserStates.length - 1].messageId,
      null,
      { type: 'photo', media: { source: imageBuffer } },
      { reply_markup: { inline_keyboard: inlineKeyboard } }
    );
  } catch (error) {
    console.log('Error:', error);
    ctx.reply('An error occurred');
  }
}

async function toggleTask(ctx) {
  try {
    const taskId = ctx.match[1];
    const topicSlug = ctx.match[2];
    const userId = ctx.from.id;
    const task = await getTaskById(taskId);

    if (!task) {
      await ctx.reply('Task not found.');
      return;
    }

    if (ctx.from.id !== task.user_id) {
      await ctx.reply('Тобі краще редагувати свій прогрес, а не чужий !');
      return;
    }

    await toggleTaskCompletion(taskId);

    const userName = ctx.from.username;
    const title = await getTopicTitleBySlug(topicSlug);

    const tasks = await getTasksByTopicSlug(topicSlug, ctx.from.id);
    const chartUrl = generateSpecificChartUrl(`@${userName}`, title, tasks);
    const imageBuffer = await downloadImage(chartUrl);

    const taskButtons = tasks.map((task) => [
      {
        text: `${task.description} ${task.completed ? '✅' : '❌'}`,
        callback_data: `toggleTask_${task.id}_${topicSlug}`,
      },
      { text: '🗑', callback_data: `deleteTask_${task.id}_${topicSlug}` },
    ]);

    const inlineKeyboard = [
      ...taskButtons,
      [{ text: 'На Головну', callback_data: 'chartBack' }],
    ];

    // Use the exported getUserStates function
    const userStatesData = getUserStates(userId) || [];

    await ctx.telegram.editMessageMedia(
      ctx.chat.id,
      userStatesData[userStatesData.length - 1].messageId,
      null,
      { type: 'photo', media: { source: imageBuffer } },
      { reply_markup: { inline_keyboard: inlineKeyboard } }
    );
  } catch (error) {
    console.log('Error:', error);
    ctx.reply('An error occurred');
  }
}

async function deleteTask(ctx) {
  try {
    const taskId = ctx.match[1];
    const topicSlug = ctx.match[2];
    const userId = ctx.from.id;
    const task = await getTaskById(taskId);

    if (!task) {
      await ctx.reply('Task not found.');
      return;
    }

    if (ctx.from.id !== task.user_id) {
      await ctx.reply('Тобі краще редагувати свій прогрес, а не чужий !');
      return;
    }

    await deleteTaskFromDB(taskId);

    const userName = ctx.from.username;
    const title = await getTopicTitleBySlug(topicSlug);

    const tasks = await getTasksByTopicSlug(topicSlug, ctx.from.id);
    const chartUrl = generateSpecificChartUrl(`@${userName}`, title, tasks);
    const imageBuffer = await downloadImage(chartUrl);

    const taskButtons = tasks.map((task) => [
      {
        text: `${task.description} ${task.completed ? '✅' : '❌'}`,
        callback_data: `toggleTask_${task.id}_${topicSlug}`,
      },
      { text: '🗑', callback_data: 'button' },
    ]);

    const inlineKeyboard = [
      ...taskButtons,
      [{ text: 'На Головну', callback_data: 'chartBack' }],
    ];

    // Use the exported getUserStates function
    const userStatesData = getUserStates(userId) || [];

    await ctx.telegram.editMessageMedia(
      ctx.chat.id,
      userStatesData[userStatesData.length - 1].messageId,
      null,
      { type: 'photo', media: { source: imageBuffer } },
      { reply_markup: { inline_keyboard: inlineKeyboard } }
    );
  } catch (error) {
    console.log('Error:', error);
    ctx.reply('An error occurred');
  }
}

async function buttonAllGroups(ctx) {
  try {
    const userId = ctx.from.id;

    if (!userGroupStates[userId]) {
      userGroupStates[userId] = {};
    }

    const groups = await getAllGroupsForUser(userId);
    const toggledGroup = await getSelectedGroupId(userId);
    if (groups == null) {
      ctx.telegram.sendMessage(
        ctx.chat.id,
        `Будь ласка, створіть групу, тему та перше завдання щоб почати роботу`
      );
    } else {
      const uniqueGroupIds = new Set();

      const groupButtons = groups
        .filter((group) => {
          // Check if the group_id is not already in the Set
          if (!uniqueGroupIds.has(group.group_id)) {
            // Add the group_id to the Set to mark it as seen
            uniqueGroupIds.add(group.group_id);
            return true; // Include this group in the filtered result
          }
          return false; // Exclude this group as it's a duplicate
        })
        .map((group) => [
          {
            text: `${group.name} ${
              group.group_id === toggledGroup ? '✅' : ''
            }`,
            callback_data: `group_${group.group_id}`,
          },
          {
            text: `🗑`,
            callback_data: `buttonDeleteGroup_${group.group_id}`,
          },
        ]);
      const inlineKeyboard = [
        ...groupButtons,
        [
          {
            text: `Всі групи ${'null' === toggledGroup ? '✅' : ''}`,
            callback_data: 'group_null',
          },
        ],
        [
          { text: 'Назад', callback_data: 'buttonDelete' },
          // { text: '🗑', callback_data: 'buttonDeleteGroup' },
        ],
      ];

      // Find the message ID to update for all groups in userGroupStates
      const allGroupsMessageIdToUpdate =
        userGroupStates[userId]?.allGroups?.messageId;

      if (allGroupsMessageIdToUpdate) {
        // Update the message with the new inline keyboard for all groups
        await ctx.telegram.editMessageReplyMarkup(
          ctx.chat.id,
          allGroupsMessageIdToUpdate,
          null,
          { inline_keyboard: inlineKeyboard }
        );
      } else {
        // If the message doesn't exist, send a new one
        const sentMessage = await ctx.telegram.sendMessage(
          ctx.chat.id,
          `Groups for user ${userId}`,
          {
            reply_markup: {
              inline_keyboard: inlineKeyboard,
            },
          }
        );

        // Store the message ID in userGroupStates
        userGroupStates[userId].allGroups = {
          messageId: sentMessage.message_id,
        };
      }
    }
  } catch (error) {
    console.log('Error:', error);
    ctx.reply('An error occurred');
  }
}

async function groupSelect(ctx) {
  try {
    const selectedGroup = ctx.match[1];
    const userId = ctx.from.id;
    saveSelectedGroup(userId, selectedGroup);

    // Fetch updated group information
    const groups = await getAllGroupsForUser(userId);
    const toggledGroup = await getSelectedGroupId(userId);

    // Update inline keyboard for all groups

    const uniqueGroupIds = new Set();

    const groupButtons = groups
      .filter((group) => {
        // Check if the group_id is not already in the Set
        if (!uniqueGroupIds.has(group.group_id)) {
          // Add the group_id to the Set to mark it as seen
          uniqueGroupIds.add(group.group_id);
          return true; // Include this group in the filtered result
        }
        return false; // Exclude this group as it's a duplicate
      })
      .map((group) => [
        {
          text: `${group.name} ${group.group_id === toggledGroup ? '✅' : ''}`,
          callback_data: `${
            group.group_id === toggledGroup ? '_' : `group_${group.group_id}`
          }`,
        },
        {
          text: `🗑`,
          callback_data: `buttonDeleteGroup_${group.group_id}`,
        },
      ]);
    const inlineKeyboard = [
      ...groupButtons,
      [
        {
          text: `Всі групи ${'null' === toggledGroup ? '✅' : ''}`,
          callback_data: `${'null' === toggledGroup ? '_' : 'group_null'}`,
        },
      ],
      [{ text: 'Назад', callback_data: 'buttonDelete' }],
    ];

    // Find the message ID to update for all groups
    const allGroupsMessageIdToUpdate =
      userGroupStates[userId]?.allGroups?.messageId;

    if (allGroupsMessageIdToUpdate) {
      // Update the message with the new inline keyboard for all groups
      await ctx.telegram.editMessageReplyMarkup(
        ctx.chat.id,
        allGroupsMessageIdToUpdate,
        null,
        { inline_keyboard: inlineKeyboard }
      );
    }

    // Update the specific user group state for "Всі групи" button
    const specificGroupState = userGroupStates[userId]?.[0];
    if (specificGroupState) {
      // Fetch additional information for "Всі групи" button if needed
      const additionalInfo = await getAdditionalInfo();

      // Update the specific user group state as needed
      specificGroupState.additionalInfo = additionalInfo;
      // ...

      // Find the message ID to update for the specific group
      const specificGroupMessageIdToUpdate = specificGroupState.messageId;

      if (specificGroupMessageIdToUpdate) {
        // Update the message with the new inline keyboard and additional information
        await ctx.telegram.editMessageReplyMarkup(
          ctx.chat.id,
          specificGroupMessageIdToUpdate,
          null,
          { inline_keyboard: updatedInlineKeyboard }
        );
      }
    }
  } catch (error) {
    console.log('Error:', error);
    ctx.reply('An error occurred');
  }
}

async function buttonDeleteGroup(ctx) {
  try {
    const selectedGroup = ctx.match[1];
    const userId = ctx.from.id;
    const dbUserId = await getUserIdByUserIdentifier(userId);
    // Delete the group and associated topics and tasks
    await deleteGroupAndRelatedData(dbUserId, selectedGroup, userId);

    // Fetch updated group information after deletion
    const groups = await getAllGroupsForUser(userId);
    const toggledGroup = await getSelectedGroupId(userId);

    // Check if there are any groups
    if (groups && groups.length > 0) {
      // Build the inline keyboard with updated information
      const uniqueGroupIds = new Set();
      const groupButtons = groups
        .filter((group) => {
          if (!uniqueGroupIds.has(group.group_id)) {
            uniqueGroupIds.add(group.group_id);
            return true;
          }
          return false;
        })
        .map((group) => [
          {
            text: ` ${group.name} ${
              group.group_id === toggledGroup ? '✅' : ''
            }`,
            callback_data: `${
              group.group_id === toggledGroup ? '_' : `group_${group.group_id}`
            }`,
          },
          {
            text: `🗑`,
            callback_data: `buttonDeleteGroup_${group.group_id}`,
          },
        ]);

      const inlineKeyboard = [
        ...groupButtons,
        [
          {
            text: `Всі групи ${'null' === toggledGroup ? '✅' : ''}`,
            callback_data: `${'null' === toggledGroup ? '_' : 'group_null'}`,
          },
        ],
        [{ text: 'Назад', callback_data: 'buttonDelete' }],
      ];

      // Update the inline keyboard in the chat
      const allGroupsMessageIdToUpdate =
        userGroupStates[userId]?.allGroups?.messageId;
      if (allGroupsMessageIdToUpdate) {
        await ctx.telegram.editMessageReplyMarkup(
          ctx.chat.id,
          allGroupsMessageIdToUpdate,
          null,
          { inline_keyboard: inlineKeyboard }
        );
      }

      // Provide a confirmation message
      ctx.reply(`Group "${selectedGroup}" and associated data deleted.`);
    } else {
      await buttonDelete(ctx);
    }
  } catch (error) {
    console.log('Error:', error);
    ctx.reply('An error occurred');
  }
}

async function buttonDelete(ctx) {
  try {
    const userId = ctx.from.id;
    const allGroupsMessageId = userGroupStates[userId]?.allGroups?.messageId;

    if (allGroupsMessageId) {
      await ctx.telegram.deleteMessage(ctx.chat.id, allGroupsMessageId);
      await chartBack(ctx);
    }

    // Clear the stored message ID
    userGroupStates[userId].allGroups = null;
  } catch (error) {
    console.log('Error:', error);
    ctx.reply('An error occurred');
  }
}

async function buttonAllTopics(ctx) {
  try {
    const userId = ctx.from.id;
    const inlineKeyboard = [
      [{ text: 'На Головну', callback_data: 'chartBack' }],
    ];

    const selectedGroupId = await getSelectedGroupId(userId);
    const dbUserId = await getUserIdByUserIdentifier(userId);
    const topics = await getAllTopics(selectedGroupId, dbUserId);
    const percentages = await getOverallProgress(ctx.from.id, topics);
    const userStatesData = getUserStates(userId) || [];
    const latestState = userStatesData[userStatesData.length - 1];

    if (latestState && latestState.state === 'buttonAllSubjects') {
      latestState.messageId = ctx.callbackQuery.message.message_id;
    } else {
      userStatesData.push({
        state: 'buttonAllSubjects',
        messageId: ctx.callbackQuery.message.message_id,
        replyMarkup: { inline_keyboard: inlineKeyboard },
      });
    }

    async function generateChart(button) {
      const chartUrl = generateAllTopicsChartUrl(button);
      const imageBuffer = await downloadImage(chartUrl);
      return imageBuffer;
    }

    // Use the exported setUserStates function
    setUserStates(userId, userStatesData);

    await ctx.telegram.editMessageMedia(
      ctx.chat.id,
      userStatesData[userStatesData.length - 1].messageId,
      null,
      {
        type: 'photo',
        media: { source: await generateChart(percentages.topics) },
      },
      {
        reply_markup: {
          inline_keyboard: inlineKeyboard,
        },
      }
    );
  } catch (error) {
    console.log('Error:', error);
    ctx.reply('An error occurred');
  }
}

async function chartBack(ctx) {
  try {
    const userId = ctx.from.id;
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
    const overallProgress = await getOverallProgress(ctx.from.id, topics);
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

    // If the user has just entered the "chart" state, send the initial chart message
    const userStatesData = getUserStates(userId);
    const existingState = userStatesData[userStatesData.length - 1];
    const existingMessageId = existingState?.messageId;

    try {
      if (existingMessageId) {
        // Delete the existing message
        await ctx.telegram.deleteMessage(ctx.chat.id, existingMessageId);
      }

      // Send a new message with the updated chart
      const chartMessage = await ctx.replyWithPhoto(
        {
          source: imageBuffer,
          caption: `Chart Caption - ${timestamp}`,
        },
        replyMarkup
      );

      // Update the user state with the new chart information
      const updatedUserStates = [...userStatesData];
      updatedUserStates[userStatesData.length - 1] = {
        state: currentState,
        messageId: chartMessage.message_id,
        replyMarkup: replyMarkup.reply_markup,
      };

      // Update user states using setUserStates
      setUserStates(userId, updatedUserStates);
    } catch (error) {
      console.log('Error:', error);
      ctx.reply('An error occurred');
    }
  } catch (error) {
    console.log('Error:', error);
    ctx.reply('An error occurred');
  }
}

module.exports = {
  buttonTopic,
  buttonAllGroups,
  buttonAllTopics,
  groupSelect,
  buttonDeleteGroup,
  toggleTask,
  deleteTask,
  chartBack,
  buttonDelete,
};
