const db = require('./database.js');

function createTask(topicName, userId, description) {
  return new Promise((resolve, reject) => {
    // Get the topic_id based on the topicName
    const query = `SELECT id, slug FROM topics WHERE name = '${topicName}'`;

    db.get(query, (err, row) => {
      if (err) {
        reject(err.message);
      } else {
        console.log(row);
        const topic_id = row.id;
        const slug = row.slug;
        // Insert the new task into the tasks table
        const insertQuery = `
            INSERT INTO tasks (topic_slug, topic_id, user_id, description)
            VALUES ('${slug}', ${topic_id}, '${userId}', '${description}')`;

        db.run(insertQuery, (err) => {
          if (err) {
            reject(err.message);
          } else {
            resolve();
          }
        });
      }
    });
  });
}

function getTasksByTopicSlug(topicSlug, userId) {
  return new Promise((resolve, reject) => {
    const query = `
        SELECT tasks.*
        FROM tasks
        JOIN topics ON tasks.topic_id = topics.id
        WHERE topics.slug = ? AND user_id = ?`;

    db.all(query, [topicSlug, userId], (err, rows) => {
      if (err) {
        reject(err.message);
      } else {
        resolve(rows);
      }
    });
  });
}

function getTaskById(taskId) {
  return new Promise((resolve, reject) => {
    const query = 'SELECT * FROM tasks WHERE id = ?';

    db.get(query, [taskId], (err, row) => {
      if (err) {
        reject(err.message);
      } else {
        resolve(row);
      }
    });
  });
}

function toggleTaskCompletion(taskId) {
  return new Promise((resolve, reject) => {
    const getStatusQuery = `SELECT completed FROM tasks WHERE id = ${taskId}`;

    db.get(getStatusQuery, (err, row) => {
      if (err) {
        reject(err.message);
      } else {
        const currentStatus = row.completed;
        const newStatus = currentStatus === 1 ? 0 : 1;
        const updateQuery = `UPDATE tasks SET completed = ${newStatus} WHERE id = ${taskId}`;
        db.run(updateQuery, (err) => {
          if (err) {
            reject(err.message);
          } else {
            resolve(newStatus);
          }
        });
      }
    });
  });
}

function getTaskCountsByTopic(topicId, user_id) {
  return new Promise((resolve, reject) => {
    const query = `
        SELECT
          COUNT(*) AS totalTasks,
          SUM(completed) AS completedTasks
        FROM tasks
        WHERE topic_id = ? AND user_id = ?`;

    db.get(query, [topicId, user_id], (err, row) => {
      if (err) {
        reject(err.message);
      } else {
        resolve(row);
      }
    });
  });
}

function deleteTaskFromDB(taskId) {
  return new Promise((resolve, reject) => {
    const deleteTaskQuery = 'DELETE FROM tasks WHERE id = ?';

    db.run(deleteTaskQuery, [taskId], function (err) {
      if (err) {
        console.error(err.message);
        reject(err);
      } else {
        console.log(`Task with ID ${taskId} deleted.`);
        resolve();
      }
    });
  });
}

module.exports = {
  createTask,
  getTasksByTopicSlug,
  getTaskById,
  getTaskCountsByTopic,
  toggleTaskCompletion,
  deleteTaskFromDB,
};
