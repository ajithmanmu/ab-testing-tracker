// src/handlers/collect.js
const { DynamoDBClient } = require('@aws-sdk/client-dynamodb');
const {
  DynamoDBDocumentClient,
  PutCommand,
  QueryCommand
} = require('@aws-sdk/lib-dynamodb');

const doc = DynamoDBDocumentClient.from(new DynamoDBClient({}));
const TABLE = process.env.DYNAMODB_TABLE || 'ab_events';
const GSI_EXPERIMENT_TS = process.env.GSI_EXPERIMENT_TS || 'gsi_experiment_ts';

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

// shared writer for impression/click
async function writeEvent(body) {
  const experimentId = body.experimentId || body.experiment_id;
  const userId = body.userId || body.user_id;
  const { variant, action } = body;

  if (!experimentId || !userId || !variant || !action) {
    return res(400, { error: 'Missing required fields: experimentId, userId, variant, action' });
  }

  const item = {
    userId,
    ts: new Date().toISOString(),
    experimentId,
    variant,
    action
  };

  await doc.send(new PutCommand({ TableName: TABLE, Item: item }));
  return res(200, { message: 'Event logged', data: item });
}

// stats calculator
async function getStats(body) {
  const experimentId = body.experimentId || body.experiment_id;
  if (!experimentId) return res(400, { error: 'Missing required field: experimentId' });

  // Optional time window; default: last 30 days
  const now = Date.now();
  const defaultFrom = new Date(now - 30 * 24 * 60 * 60 * 1000).toISOString();
  const from = body.from || body.start || defaultFrom; // ISO-8601 expected
  const to = body.to || body.end || new Date(now).toISOString();

  // Query the GSI, paginating if needed
  let lastKey;
  const perVariant = {};               // { A: {impressions, clicks, users:Set}, ... }
  const usersOverall = new Set();
  let totalImpressions = 0;
  let totalClicks = 0;

  do {
    const out = await doc.send(new QueryCommand({
      TableName: TABLE,
      IndexName: GSI_EXPERIMENT_TS,
      KeyConditionExpression: '#e = :exp AND #ts BETWEEN :from AND :to',
      ExpressionAttributeNames: { '#e': 'experimentId', '#ts': 'ts' },
      ExpressionAttributeValues: { ':exp': experimentId, ':from': from, ':to': to },
      ExclusiveStartKey: lastKey
    }));
    

    for (const it of (out.Items || [])) {
      const v = it.variant || 'UNKNOWN';
      const a = it.action;
      perVariant[v] ||= { impressions: 0, clicks: 0, users: new Set() };

      if (a === 'log_impression') {
        perVariant[v].impressions++;
        totalImpressions++;
      } else if (a === 'log_click') {
        perVariant[v].clicks++;
        totalClicks++;
      }
      if (it.userId) {
        perVariant[v].users.add(it.userId);
        usersOverall.add(it.userId);
      }
    }

    lastKey = out.LastEvaluatedKey;
  } while (lastKey);

  // Build response with CTRs
  const variants = {};
  for (const [v, s] of Object.entries(perVariant)) {
    const impressions = s.impressions;
    const clicks = s.clicks;
    const uniqueUsers = s.users.size;
    variants[v] = {
      impressions,
      clicks,
      ctr: impressions ? clicks / impressions : 0,
      uniqueUsers
    };
  }

  return res(200, {
    experimentId,
    window: { from, to },
    totals: {
      impressions: totalImpressions,
      clicks: totalClicks,
      ctr: totalImpressions ? totalClicks / totalImpressions : 0,
      uniqueUsers: usersOverall.size
    },
    variants
  });
}

exports.handler = async (event) => {
  try {
    console.log('Received event:', JSON.stringify(event, null, 2));
    const body = typeof event.body === 'string' ? JSON.parse(event.body || '{}') : (event.body || {});
    const { action } = body || {};

    switch (action) {
      case 'log_impression':
      case 'log_click':
        return await writeEvent(body);

      case 'get_stats':
        return await getStats(body);

      default:
        return res(400, { error: `Unknown action: ${action}` });
    }
  } catch (err) {
    console.error('Handler error:', err);
    return res(500, { error: 'Internal server error', message: err.message });
  }
};
