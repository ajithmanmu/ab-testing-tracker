# AB Testing Backend

Lambda function for logging AB testing events to DynamoDB.

## Features

- Logs AB testing impressions to DynamoDB
- Validates required fields
- Supports CORS for frontend integration
- Automatic TTL for data retention (30 days)

## Setup

### Prerequisites

- Node.js 18+
- AWS CLI configured
- Serverless Framework installed globally: `npm install -g serverless`

### Installation

1. Install dependencies:
```bash
cd backend
npm install
```

2. Configure AWS credentials:
```bash
aws configure
```

### Local Development

Start the local development server:
```bash
npm run dev
```

This will start serverless-offline on `http://localhost:3000`

### Testing the API

Test the log event endpoint:

```bash
curl -X POST http://localhost:3000/dev/log-event \
  -H "Content-Type: application/json" \
  -d '{
    "action": "log_impression",
    "experiment_id": "cta-color-001",
    "user_id": "user123",
    "variant": "A"
  }'
```

## Deployment

### Deploy to AWS

```bash
# Deploy to dev stage
npm run deploy

# Deploy to production
npm run deploy:prod
```

### Remove deployment

```bash
npm run remove
```

## API Endpoints

### POST /log-event

Logs an AB testing impression event.

**Request Body:**
```json
{
  "action": "log_impression",
  "experiment_id": "cta-color-001",
  "user_id": "user123",
  "variant": "A"
}
```

**Response:**
```json
{
  "message": "Event logged successfully",
  "data": {
    "experiment_id": "cta-color-001",
    "user_id": "user123",
    "timestamp": "2024-01-15T10:30:00.000Z",
    "variant": "A",
    "action": "log_impression"
  }
}
```

## DynamoDB Schema

Table: `ab-testing-backend-ab-events-{stage}`

| Field | Type | Description |
|-------|------|-------------|
| experiment_id | String | Hash key - Experiment identifier |
| timestamp | String | Range key - ISO timestamp |
| user_id | String | User identifier |
| variant | String | Variant shown (A/B) |
| action | String | Action type (log_impression) |
| ttl | Number | TTL for automatic deletion |

## Environment Variables

- `DYNAMODB_TABLE`: DynamoDB table name (auto-generated)

## Integration with Frontend

The frontend can call this API to log impressions:

```javascript
const logImpression = async (experimentId, userId, variant) => {
  const response = await fetch('/log-event', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      action: 'log_impression',
      experiment_id: experimentId,
      user_id: userId,
      variant: variant
    })
  });
  
  return response.json();
};
``` 