// src/handlers/collect.js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const { DynamoDBDocumentClient, PutCommand } = require('@aws-sdk/lib-dynamodb');

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.DYNAMODB_TABLE || 'ab_events';

const res = (code, body) => ({
  statusCode: code,
  headers: {
    'Content-Type': 'application/json',
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Headers': 'Content-Type',
    'Access-Control-Allow-Methods': 'POST, OPTIONS'
  },
  body: JSON.stringify(body)
});

exports.handler = async (event) => {
  try {
    console.log('Received event:', JSON.stringify(event, null, 2));
    const body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {});
    const { action } = body;

    switch (action) {
      case 'log_impression': {
        // accept either experimentId or experiment_id in the payload
        const experimentId = body.experimentId || body.experiment_id;
        const { user_id: userIdLegacy, userId, variant } = body;

        if (!experimentId || !(userId || userIdLegacy) || !variant) {
          return res(400, { error: 'Missing required fields: experimentId, userId, variant' });
        }

        const item = {
          userId: body.userId || body.user_id,
          ts: new Date().toISOString(),
          experimentId: body.experimentId || body.experiment_id,
          variant: body.variant,
          action: body.action,
          ttl: Math.floor(Date.now()/1000) + 30*24*60*60
        };

        await doc.send(new PutCommand({ TableName: TABLE, Item: item }));
        return res(200, { message: 'Event logged', data: item });
      }

      default:
        return res(400, { error: `Unknown action: ${action}` });
    }
  } catch (err) {
    console.error('Handler error:', err);
    return res(500, { error: 'Internal server error', message: err.message });
  }
};
