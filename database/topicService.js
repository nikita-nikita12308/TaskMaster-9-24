const db = require('./database.js');
const slugify = require('slugify');
function getAllTopics(groupId, userId) {
  console.log('userid: ' + userId);
  return new Promise((resolve, reject) => {
    let query = `SELECT * FROM topics WHERE id IN (SELECT topic_id FROM user_group_topics WHERE group_id = ${groupId})`;
    if (groupId === 'null') {
      query = `
  SELECT * FROM topics
  WHERE id IN (
    SELECT DISTINCT topic_id FROM user_group_topics
    WHERE user_id = ${userId}
  )`;
    }
    db.all(query, (err, rows) => {
      if (err) {
        reject(err.message);
      } else {
        const topics = rows.map((row) => ({ id: row.id, name: row.name }));
        resolve(topics);
      }
    });
  });
}
function getTopicTitleBySlug(slug) {
  return new Promise((resolve, reject) => {
    const query = 'SELECT name FROM topics WHERE slug = ?';

    db.get(query, [slug], (err, row) => {
      if (err) {
        reject(err.message);
      } else {
        resolve(row ? row.name : null);
      }
    });
  });
}

function createTopic(topicName) {
  return new Promise((resolve, reject) => {
    const topicSlug = slugify(topicName, {
      lower: true,
      remove: /[*+~.()'"!:@]/g,
    });

    const query = 'INSERT INTO topics (name, slug) VALUES (?, ?)';

    db.run(query, [topicName, topicSlug], function (err) {
      if (err) {
        console.error(err.message);
        reject(err);
      } else {
        const lastTopicId = this.lastID; // Retrieve the last inserted topic ID
        console.log(
          `Topic "${topicName}" added to the database with ID ${lastTopicId}.`
        );
        resolve(lastTopicId);
      }
    });
  });
}

async function createTopicAndAssociateWithGroup(topicName, groupId, userId) {
  try {
    const lastTopicId = await createTopic(topicName);
    associateUserAndTopicWithGroup(userId, groupId, lastTopicId);
  } catch (error) {
    console.error('Error creating topic:', error);
  }
}
function associateUserAndTopicWithGroup(userId, groupId, topicId) {
  const query =
    'INSERT INTO user_group_topics (user_id, group_id, topic_id) VALUES (?, ?, ?)';

  db.run(query, [userId, groupId, topicId], function (err) {
    if (err) {
      console.error(err.message);
    } else {
      console.log(
        `User ${userId} and Topic ${topicId} associated with Group ${groupId}.`
      );
    }
  });
}
module.exports = {
  createTopicAndAssociateWithGroup,
  getAllTopics,
  getTopicTitleBySlug,
};
