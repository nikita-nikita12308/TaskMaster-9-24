const db = require('./database.js');
const slugify = require('slugify');
function saveSelectedGroup(userId, selectedGroupId) {
  const query = 'UPDATE users SET selected_group_id = ? WHERE user_id = ?';
  db.run(query, [selectedGroupId, userId], (err) => {
    if (err) {
      console.error('Error updating selected group:', err.message);
    } else {
      console.log('Selected group updated successfully.');
    }
  });
}

function getAllGroupsForUser(userId) {
  return new Promise((resolve, reject) => {
    const query = `
      SELECT * FROM groups
      JOIN user_group_topics ugt ON groups.id = ugt.group_id
      JOIN users ON ugt.user_id = users.id
      WHERE users.user_id = ?
      `;
    db.all(query, [userId], (err, rows) => {
      if (err) {
        console.error(err.message);
        reject(err);
      } else {
        if (rows && rows.length > 0) {
          console.log(rows);
          resolve(rows);
        } else {
          console.log('nothing found');
          resolve(null);
        }
      }
    });
  });
}

function createGroup(groupName, userId, topicNames) {
  const groupQuery = 'INSERT INTO groups (name) VALUES (?)';
  const userQuery = 'INSERT OR IGNORE INTO users (user_id) VALUES (?)';
  const selectUserQuery = 'SELECT id FROM users WHERE user_id = ?';
  const userGroupTopicsQuery =
    'INSERT INTO user_group_topics (user_id, group_id, topic_id) VALUES (?, ?, ?)';
  const topicQuery = 'INSERT INTO topics (name, slug) VALUES (?, ?)';

  db.serialize(() => {
    db.run('BEGIN TRANSACTION');

    db.run(groupQuery, [groupName], function (err) {
      if (err) {
        console.error(err.message);
        db.run('ROLLBACK');
        return;
      }

      const groupId = this.lastID; // Retrieve the last inserted group ID

      db.run(userQuery, [userId], function (err) {
        if (err) {
          console.error(err.message);
          db.run('ROLLBACK');
          return;
        }

        // Retrieve the actual user ID using SELECT query
        db.get(selectUserQuery, [userId], (err, row) => {
          if (err) {
            console.error(err.message);
            db.run('ROLLBACK');
            return;
          }

          const actualUserId = row ? row.id : null;

          // Insert into user_group_topics to associate user with group and topics
          topicNames.forEach((topicName) => {
            const slug = slugify(topicName, { lower: true });
            db.run(topicQuery, [topicName, slug], function (err) {
              if (err) {
                console.error(err.message);
                db.run('ROLLBACK');
                return;
              }

              const topicId = this.lastID; // Retrieve the last inserted topic ID

              // Insert into user_group_topics to associate user with group and topic
              db.run(
                userGroupTopicsQuery,
                [actualUserId, groupId, topicId],
                function (err) {
                  if (err) {
                    console.error(err.message);
                    db.run('ROLLBACK');
                  } else {
                    console.log(
                      `Group "${groupName}" (ID: ${groupId}) added to the database with user ID "${actualUserId}" and associated topic "${topicName}" (ID: ${topicId}).`
                    );
                  }
                }
              );
            });
          });
        });
      });
    });
    db.run('COMMIT');
  });
}

function deleteGroupAndRelatedData(userId, groupId) {
  return new Promise((resolve, reject) => {
    const deleteGroupQuery = 'DELETE FROM groups WHERE id = ?';
    const deleteTopicsQuery =
      'DELETE FROM topics WHERE id IN (SELECT topic_id FROM user_group_topics WHERE user_id = ? AND group_id = ?)';
    const deleteTasksQuery =
      'DELETE FROM tasks WHERE user_id = ? AND topic_id IN (SELECT topic_id FROM user_group_topics WHERE user_id = ? AND group_id = ?)';
    const deleteUserGroupTopicsQuery =
      'DELETE FROM user_group_topics WHERE user_id = ? AND group_id = ?';

    db.serialize(() => {
      db.run('BEGIN TRANSACTION', (beginErr) => {
        if (beginErr) {
          console.error(beginErr.message);
          reject(beginErr);
          return;
        }

        console.log('deleteUserGroupTopicsQuery');
        // Delete associated topics from user_group_topics
        db.run(deleteUserGroupTopicsQuery, [userId, groupId], function (err) {
          if (err) {
            console.error(err.message);
            db.run('ROLLBACK');
            reject(err);
            return;
          }

          console.log('deleteGroupsQuery');
          db.run(deleteGroupQuery, [groupId], function (err) {
            if (err) {
              console.error(err.message);
              db.run('ROLLBACK');
              reject(err);
              return;
            }

            console.log('deleteTasksQuery');
            // Delete associated tasks
            db.run(deleteTasksQuery, [userId, userId, groupId], function (err) {
              if (err) {
                console.error(err.message);
                db.run('ROLLBACK');
                reject(err);
                return;
              }

              console.log('deleteTopicsQuery');
              // Delete associated topics
              db.run(deleteTopicsQuery, [userId, groupId], function (err) {
                if (err) {
                  console.error(err.message);
                  db.run('ROLLBACK');
                  reject(err);
                  return;
                }

                // Commit the transaction if everything is successful
                db.run('COMMIT', (commitErr) => {
                  if (commitErr) {
                    console.error(commitErr.message);
                    reject(commitErr);
                  } else {
                    resolve();
                  }
                });
              });
            });
          });
        });
      });
    });
  });
}

function getSelectedGroupId(userId) {
  return new Promise((resolve, reject) => {
    const query = `SELECT selected_group_id FROM users WHERE user_id = ${userId}`;

    db.get(query, (err, row) => {
      if (err) {
        reject(err.message);
      } else {
        resolve(row ? row.selected_group_id : null);
      }
    });
  });
}

module.exports = {
  createGroup,
  saveSelectedGroup,
  getAllGroupsForUser,
  getSelectedGroupId,
  deleteGroupAndRelatedData,
};
