const db = require('./database.js');
const { getAllTopics } = require('./topicService');
const { getTaskCountsByTopic } = require('./taskService');

async function getOverallProgress(userId, topics) {
  try {
    console.log('Topics: ' + topics);
    let totalCompletedTasks = 0;
    let totalTasks = 0;

    const progressPromises = topics.map(async (topic) => {
      const progress = await getTaskCountsByTopic(topic.id, userId);
      totalCompletedTasks += progress.completedTasks || 0;
      totalTasks += progress.totalTasks || 0;

      return {
        topic: topic.name,
        percentage: (progress.completedTasks / progress.totalTasks) * 100 || 0,
      };
    });

    const progressResults = await Promise.all(progressPromises);

    const overallPercentage = (totalCompletedTasks / totalTasks) * 100 || 0;

    return {
      topics: progressResults,
      overallPercentage,
    };
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

module.exports = {
  getOverallProgress,
};
