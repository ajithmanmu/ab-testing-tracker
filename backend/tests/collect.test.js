import { describe, it, expect, beforeEach, vi } from 'vitest'

/**
 * IMPORTANT:
 * 1) We mock both AWS SDK modules at the top (hoisted by Vitest).
 * 2) We set `sendMock` BEFORE importing the handler (so its doc client uses the mock).
 * 3) We reset modules before each test to re-run the handler's top-level.
 */

let sendMock

// Stub the low-level client so `new DynamoDBClient({})` doesn't try to resolve region.
vi.mock('@aws-sdk/client-dynamodb', () => {
  return {
    DynamoDBClient: class DynamoDBClient {
      constructor() {} // no-op
    }
  }
})

// Mock the doc client to return an object with `send()` that calls our `sendMock`.
vi.mock('@aws-sdk/lib-dynamodb', () => {
  class PutCommand {
    constructor(input) {
      this.input = input
      this.__type = 'PutCommand'
    }
  }
  class QueryCommand {
    constructor(input) {
      this.input = input
      this.__type = 'QueryCommand'
    }
  }
  // NOTE: this factory closes over `sendMock`; we set it before importing the handler.
  return {
    PutCommand,
    QueryCommand,
    DynamoDBDocumentClient: {
      from() {
        return { send: (...args) => sendMock(...args) }
      }
    }
  }
})

// Helper to import handler AFTER we set sendMock and reset the module cache
async function importHandlerFresh() {
  vi.resetModules()
  process.env.AWS_REGION = 'us-west-1'
  process.env.DYNAMODB_TABLE = 'ab_events'
  process.env.GSI_EXPERIMENT_TS = 'gsi_experiment_ts'
  const mod = await import('../src/handlers/collect.js')
  return mod.handler
}

let handler

beforeEach(async () => {
  // set the mock BEFORE importing the handler so its doc client uses this function
  sendMock = vi.fn()
  handler = await importHandlerFresh()
})

describe('collect.handler', () => {

  it('returns 400 when required fields are missing', async () => {
    const resp = await handler({
      body: JSON.stringify({
        action: 'log_impression',
        experimentId: 'cta-color-001',
        userId: 'u1' // missing variant
      })
    })

    expect(resp.statusCode).toBe(400)
    expect(sendMock).not.toHaveBeenCalled()
  })

  it('returns 400 for unknown action', async () => {
    const resp = await handler({ body: JSON.stringify({ action: 'nope' }) })
    expect(resp.statusCode).toBe(400)
  })

  it('returns 500 for invalid JSON', async () => {
    const resp = await handler({ body: '{ not-json' })
    expect(resp.statusCode).toBe(500)
    const body = JSON.parse(resp.body)
    expect(body.error).toBe('Internal server error')
    expect(body.message).toBeTruthy()
  })
})
