# Local Handler Development Server

This guide explains how to run and test the AWS Lambda handlers locally using the Express development server.

## Getting Started

### 1. Start the Dev Server

```bash
npm run dev:server
```

The server will start on `http://localhost:3000` and display available endpoints.

### 2. Health Check

Verify the server is running:

```bash
curl http://localhost:3000/health
```

Expected response:

```json
{
  "status": "healthy",
  "timestamp": "2024-03-25T10:30:00.000Z"
}
```

## Testing Handlers

### Workflow Orchestrator Handler

This handler processes workflow-based events (e.g., order events, notifications).

#### Get Test Data

```bash
curl http://localhost:3000/api/test-data/workflow
```

#### Send Event to Handler

```bash
# Option 1: Using the sample file
curl -X POST http://localhost:3000/api/workflow-orchestrator \
  -H "Content-Type: application/json" \
  -d @sample-workflow-event.json

# Option 2: Inline JSON
curl -X POST http://localhost:3000/api/workflow-orchestrator \
  -H "Content-Type: application/json" \
  -d '{
    "detail": {
      "type": "order.created",
      "orderId": "order-123",
      "customerId": "customer-456",
      "amount": 99.99
    }
  }'
```

#### Expected Response

```json
{
  "success": true,
  "data": {
    "status": "success",
    "workflowId": "workflow-order",
    "executionArn": "arn:aws:states:us-east-1:123456789012:execution:order-workflow:..."
  },
  "context": {
    "requestId": "local-1711353000000",
    "functionName": "workflow-orchestrator"
  }
}
```

### Notification Handler

This handler processes notification events.

#### Get Test Data

```bash
curl http://localhost:3000/api/test-data/notification
```

#### Send Event to Handler

```bash
# Option 1: Using the sample file
curl -X POST http://localhost:3000/api/notification-handler \
  -H "Content-Type: application/json" \
  -d @sample-notification-event.json

# Option 2: Inline JSON
curl -X POST http://localhost:3000/api/notification-handler \
  -H "Content-Type: application/json" \
  -d '{
    "stepName": "send-email",
    "notificationType": "confirmation",
    "recipient": "user@example.com",
    "subject": "Test Notification",
    "message": "This is a test"
  }'
```

#### Expected Response

```json
{
  "success": true,
  "data": null,
  "context": {
    "requestId": "local-1711353000000",
    "functionName": "notification-handler"
  }
}
```

## Environment Variables

Configure these in your `.env` file:

```env
# Server port (default: 3000)
PORT=3000

# AWS Configuration
AWS_REGION=us-east-1
AWS_ACCESS_KEY_ID=your-key
AWS_SECRET_ACCESS_KEY=your-secret

# Workflow Configuration
WORKFLOW_METADATA_TABLE=WorkflowMetadataTable
STATE_MACHINE_ROLE_ARN=arn:aws:iam::123456789012:role/StateMachineRole

# DynamoDB Configuration
DYNAMODB_TABLE_PREFIX=local
```

## Debugging

### View Server Logs

The server outputs detailed logs for each request:

```
📋 Received workflow orchestrator request: {...}
```

### Using Browser DevTools

Open http://localhost:3000/health in your browser to test connectivity.

### Using VS Code REST Client

Install the [REST Client extension](https://marketplace.visualstudio.com/items?itemName=humao.rest-client) and create a `.rest` or `.http` file:

```http
@baseUrl = http://localhost:3000

### Health check
GET {{baseUrl}}/health

### Get workflow test data
GET {{baseUrl}}/api/test-data/workflow

### Invoke workflow handler
POST {{baseUrl}}/api/workflow-orchestrator
Content-Type: application/json

{
  "detail": {
    "type": "order.created",
    "orderId": "order-123",
    "customerId": "customer-456",
    "amount": 99.99
  }
}

### Get notification test data
GET {{baseUrl}}/api/test-data/notification

### Invoke notification handler
POST {{baseUrl}}/api/notification-handler
Content-Type: application/json

{
  "stepName": "send-email",
  "notificationType": "confirmation",
  "recipient": "user@example.com",
  "subject": "Test",
  "message": "Test message"
}
```

## Advanced Usage

### Custom Port

```bash
PORT=4000 npm run dev:server
```

### With Environment File

```bash
# Create .env file with your settings
PORT=3000
AWS_REGION=us-east-1

# Run server
npm run dev:server
```

### Integration with Jest Tests

Run both unit tests and dev server:

```bash
# Terminal 1: Start dev server
npm run dev:server

# Terminal 2: Run tests with coverage
npm test
```

## Troubleshooting

### Port Already in Use

```bash
# Use a different port
PORT=3001 npm run dev:server

# Or kill the process using port 3000
lsof -i :3000
kill -9 <PID>
```

### Module Not Found Errors

Ensure TypeScript is compiled:

```bash
npm run compile
npm run dev:server
```

### AWS Credentials Errors

Make sure credentials are configured:

```bash
# Check AWS credentials
cat ~/.aws/credentials

# Or set environment variables
export AWS_ACCESS_KEY_ID=your-key
export AWS_SECRET_ACCESS_KEY=your-secret
npm run dev:server
```

## Performance Tips

1. **Use HTTP/2**: Consider using the `spdy` package for HTTP/2 support
2. **Enable Caching**: Add response caching for frequently tested endpoints
3. **Mock AWS Services**: Use DynamoDB Local or mock AWS SDK responses
4. **Request Logging**: Enable detailed request logging for debugging

## Next Steps

- Add authentication/authorization middleware
- Implement request validation schemas
- Add request/response logging
- Set up a testing framework for API tests
- Create a Postman collection for API testing
