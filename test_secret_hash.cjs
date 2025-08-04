const crypto = require('crypto');

const clientId = '65rt4elpftmbse0nv1bloofp39';
const clientSecret = '1u49r28nup8og0jbtm781hqilacqdkho3ns3c6heul3gcs8kdhte';
const username = 'test2@example.com';

function calculateSecretHash(username) {
  return crypto.createHmac('sha256', clientSecret)
    .update(username + clientId)
    .digest('base64');
}

console.log('Username:', username);
console.log('Client ID:', clientId);
console.log('Secret Hash:', calculateSecretHash(username));