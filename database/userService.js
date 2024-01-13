const db = require('./database.js');
const { getSelectedGroupId } = require('./groupService.js');

function getUserIdByUserIdentifier(userIdentifier) {
  return new Promise((resolve, reject) => {
    const query = 'SELECT id FROM users WHERE user_id = ?';

    db.get(query, [userIdentifier], (err, row) => {
      if (err) {
        console.error(err.message);
        reject(err);
      } else {
        if (row) {
          const userId = row.id;
          console.log(
            `User ID for user identifier ${userIdentifier}: ${userId}`
          );
          resolve(userId);
        } else {
          console.log(`User not found for user identifier ${userIdentifier}`);
          resolve(null);
        }
      }
    });
  });
}

module.exports = {
  getUserIdByUserIdentifier,
};
