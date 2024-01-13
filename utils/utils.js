const axios = require('axios');

async function downloadImage(url) {
  const response = await axios.get(url, { responseType: 'arraybuffer' });
  return Buffer.from(response.data, 'binary');
}

const userStates = {};

module.exports = {
  getUserStates: (userId) => userStates[userId] || [],
  setUserStates: (userId, states) => (userStates[userId] = states),
  downloadImage,
};
