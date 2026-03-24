# Node AWS Terraform Module

A comprehensive Node.js module providing AWS service integrations with TypeScript support, Terraform infrastructure configuration, and comprehensive testing.

## Table of Contents

- [Features](#features)
- [Prerequisites](#prerequisites)
- [Installation](#installation)
- [Quick Start](#quick-start)
- [Services](#services)
- [Scripts](#scripts)
- [Testing](#testing)
- [Environment Configuration](#environment-configuration)
- [Publishing](#publishing)
- [Linting](#linting)
- [Terraform](#terraform)
- [Contributing](#contributing)
- [License](#license)

## Features

✨ **AWS Service Integrations**

- Amazon S3 (Simple Storage Service)
- Amazon DynamoDB
- AWS Step Functions
- Amazon SNS (Simple Notification Service)
- Amazon SES (Simple Email Service)
- Amazon EventBridge

🏗️ **Infrastructure as Code**

- Terraform configuration for AWS resources
- Multiple environment support (development, staging, production)
- Backend state management setup

🧪 **Testing & Quality**

- Jest test framework with TypeScript support
- 50+ comprehensive unit tests
- Coverage thresholds (10% baseline)
- ESLint configuration for code quality
- Type safety with strict TypeScript settings

📦 **Build & Deployment**

- TypeScript compilation with esbuild
- Handler bundling for Lambda deployment
- Service compilation
- Automated build/clean/package/publish scripts
- S3 publishing support

🔄 **CI/CD Integration**

- GitHub Actions workflow ready
- Automated testing on push/PR
- Code coverage reporting

## Prerequisites

- **Node.js:** v24.14.0 LTS (or v18+)
- **npm:** v11.9.0+
- **AWS Account** with appropriate credentials configured
- **Terraform:** v1.0+ (for infrastructure deployment)

## Installation

### 1. Clone the repository

```bash
git clone https://github.com/yourusername/node-aws-tfm.git
cd node-aws-tfm
```

### 2. Upgrade Node.js (if needed)

Using nvm (recommended):

```bash
nvm install --lts
nvm use lts/*
```

Check your Node.js version:

```bash
node --version  # Should be v24.14.0 or v18+
npm --version   # Should be v11.9.0+
```

### 3. Install dependencies

```bash
npm install
```

### 4. Configure AWS credentials

Set your AWS credentials using one of these methods:

**Option A: Environment variables**

```bash
export AWS_ACCESS_KEY_ID=your_access_key
export AWS_SECRET_ACCESS_KEY=your_secret_key
export AWS_REGION=us-east-1
```

**Option B: Create `.awsenv` file in project root**

```
AWS_ACCESS_KEY_ID=your_access_key
AWS_SECRET_ACCESS_KEY=your_secret_key
AWS_REGION=us-east-1
S3_BUCKET_NAME=your-bucket-name
SERVICE_NAME=your-service-name
```

**Option C: AWS credentials file (`~/.aws/credentials`)**

```
[default]
aws_access_key_id = your_access_key
aws_secret_access_key = your_secret_key
```

## Quick Start

### 1. Build the project

```bash
npm run build
```

### 2. Run tests

```bash
npm test              # Full build + all tests
npm run test:jest     # Jest tests only
npm run test:watch    # Watch mode for development
```

### 3. Package for deployment

```bash
npm run package
```

### 4. Publish to S3

```bash
npm run publish
```

## Services

### S3Service

```typescript
import { S3Service } from "node-aws-tfm";

const s3 = new S3Service({ region: "us-east-1" });

// Put object
await s3.putObject(bucket, key, data);

// Get object
const data = await s3.getObject(bucket, key);

// Delete object
await s3.deleteObject(bucket, key);
```

### DynamoDBService

```typescript
import { DynamoDBService } from "node-aws-tfm";

const dynamodb = new DynamoDBService({ region: "us-east-1" });

// Put item
await dynamodb.putItem(tableName, item);

// Get item
const item = await dynamodb.getItem(tableName, key);

// Delete item
await dynamodb.deleteItem(tableName, key);

// Query items
const items = await dynamodb.query(
  tableName,
  indexName,
  expressionAttributeNames,
  keyConditionExpression,
  expressionAttributeValues,
);
```

### StepFunctionsService

```typescript
import { StepFunctionsService } from "node-aws-tfm";

const sfn = new StepFunctionsService({ region: "us-east-1" });

// Start execution
const executionArn = await sfn.startExecution(
  stateMachineArn,
  { input: "data" },
  "executionName",
);

// Get execution history
const history = await sfn.getExecutionHistory(executionArn);

// Stop execution
await sfn.stopExecution(executionArn, "Stopped by user");
```

### SNSService

```typescript
import { SNSService } from "node-aws-tfm";

const sns = new SNSService({ region: "us-east-1" });

// Publish message
const messageId = await sns.publishMessage(
  topicArn,
  "Hello World",
  "Optional Subject",
);

// Subscribe to topic
const subscriptionArn = await sns.subscribe(
  topicArn,
  "email",
  "user@example.com",
);

// Unsubscribe
await sns.unsubscribe(subscriptionArn);
```

### SESService

```typescript
import { SESService } from "node-aws-tfm";

const ses = new SESService({ region: "us-east-1" });

// Send email
const messageId = await ses.sendEmail(
  "sender@example.com",
  "recipient@example.com",
  "Subject Line",
  "<h1>HTML Body</h1>",
  "Text Body",
);

// Send templated email
const messageId = await ses.sendTemplatedEmail(
  "sender@example.com",
  "recipient@example.com",
  "TemplateName",
  { name: "John" },
);
```

### EventBridgeService

```typescript
import { EventBridgeService } from "node-aws-tfm";

const eventBridge = new EventBridgeService({ region: "us-east-1" });

// Put single event
const eventIds = await eventBridge.putEvent({
  Source: "myapp",
  DetailType: "myDetailType",
  Detail: { key: "value" },
});

// Put multiple events
const eventIds = await eventBridge.putEvents([
  { Source: "app1", DetailType: "type1", Detail: { data: "1" } },
  { Source: "app2", DetailType: "type2", Detail: { data: "2" } },
]);
```

## Scripts

### Development

| Command              | Purpose                                         |
| -------------------- | ----------------------------------------------- |
| `npm run build`      | Compile TypeScript and bundle handlers/services |
| `npm run clean`      | Remove build artifacts and cache files          |
| `npm run lint`       | Check code style with ESLint                    |
| `npm run lint:fix`   | Auto-fix linting issues                         |
| `npm run type-check` | Validate TypeScript without emitting code       |

### Testing

| Command                 | Purpose                             |
| ----------------------- | ----------------------------------- |
| `npm test`              | Full workflow: build + simple tests |
| `npm run test:jest`     | Run Jest unit tests                 |
| `npm run test:watch`    | Watch mode for development          |
| `npm run test:coverage` | Generate coverage report            |

### Deployment

| Command           | Purpose                          |
| ----------------- | -------------------------------- |
| `npm run package` | Prepare distribution packages    |
| `npm run publish` | Upload packages to S3            |
| `npm run compile` | Compile TypeScript to JavaScript |

## Testing

### 50+ Comprehensive Unit Tests

The project includes extensive test coverage across multiple areas:

**Service Tests** (6 tests)

- S3Service instantiation and methods
- DynamoDBService instantiation and methods
- StepFunctionsService instantiation and methods
- SNSService, SESService, EventBridgeService

**Configuration Tests** (12 tests)

- AWS region configuration
- AWS credentials handling
- Environment variable loading
- Default values

**Handler Tests** (5 tests)

- Notification handler invocation
- Event logging
- Complex event data

**Executor Tests** (6 tests)

- NotificationExecutor instantiation
- Execution with various notification types
- Complex notification objects

**Logger Tests** (15+ tests)

- Log level filtering (DEBUG, INFO, WARN, ERROR)
- Logger formatting and context
- Multiple log levels

**Total: 50+ unit tests**

### Running Tests

```bash
# All tests (build + simple-runner)
npm test

# Jest tests only
npm run test:jest

# Watch mode
npm run test:watch

# With coverage report
npm run test:coverage
```

### Test Configuration

Tests use Jest with the following configuration:

- **Environment:** Node.js
- **Timeout:** 10000ms
- **Workers:** Sequential (1 worker)
- **Force Exit:** Enabled (cleans up hanging processes)
- **Setup File:** `jest.setup.js` for cleanup

### Coverage Thresholds

Minimum coverage requirements:

- Functions: 10%
- Lines: 10%
- Statements: 10%
- Branches: 0%

## Environment Configuration

### Structure

Environment settings are loaded from `src/config/environment.ts`:

```typescript
export const config = {
  aws: {
    region: 'us-east-1' (can be overridden by AWS_REGION)
    accessKeyId: '' (can be overridden by AWS_ACCESS_KEY_ID)
    secretAccessKey: '' (can be overridden by AWS_SECRET_ACCESS_KEY)
  }
};
```

### Loading Configuration

**Development (Local testing)**

```bash
# Option 1: Export environment variables
export AWS_REGION=us-west-2
export AWS_ACCESS_KEY_ID=AKIA...
export AWS_SECRET_ACCESS_KEY=xxxxx

# Option 2: Create .awsenv file
echo "AWS_REGION=us-west-2" > .awsenv
echo "AWS_ACCESS_KEY_ID=AKIA..." >> .awsenv
```

**Production (AWS Lambda/EC2)**

- Uses IAM roles automatically
- No credentials file needed
- AWS SDK v3 detects credentials from environment

## Publishing

### Prerequisites

- AWS S3 bucket for artifacts
- AWS credentials with S3 access
- `.awsenv` file with `S3_BUCKET_NAME`

### Publish Workflow

```bash
# 1. Build the project
npm run build

# 2. Package for distribution
npm run package

# Creates:
# - dist/manifest.json (package metadata)
# - dist/zips/*.zip (handler and layer packages)

# 3. Publish to S3
npm run publish

# Creates:
# s3://bucket/service-name/dev/version/package.zip
# s3://bucket/service-name/dev/version/manifest.json
```

### Publish Configuration

Set in `.awsenv`:

```
S3_BUCKET_NAME=your-bucket-name
SERVICE_NAME=your-service-name
AWS_REGION=us-east-1
NODE_ENV=dev
```

- **Coverage Threshold**: 70% for all metrics (branches, functions, lines, statements)
- **Test Framework**: Jest with TypeScript support
- **Test Location**: `tests/` directory

### Running Tests

```bash
# Run all tests
npm test

# Watch mode for development
npm run test:watch

# Generate detailed coverage report
npm run test:coverage
```

Coverage reports are generated in `coverage/` directory.

## Linting

ESLint is configured for code quality with strict TypeScript rules:

```bash
# Check code style
npm run lint

# Auto-fix issues
npm run lint:fix
```

### ESLint Rules

- Strict type checking enabled
- No unused variables
- No explicit `any` types
- Require function return types
- Enforce `const` over `let`/`var`

## Terraform

Infrastructure configuration in `terraform/` directory:

```bash
# Initialize Terraform
cd terraform
terraform init

# Plan infrastructure
terraform plan

# Apply configuration
terraform apply

# Destroy resources
terraform destroy
```

### Configuration Files

- `main.tf` - Provider and backend configuration
- `variables.tf` - Input variables
- `outputs.tf` - Output values
- `resources.tf` - Commented example resources
- `terraform.tfvars` - Variable values (customize for your environment)

### Supported Environments

- `development` (default)
- `staging`
- `production`

## Troubleshooting

### Node.js Version Issues

**Error:** `Command not found: npm`

**Solution:** Ensure Node.js v24.14.0 LTS or v18+ is installed

```bash
node --version
npm --version
```

If using nvm:

```bash
nvm list
nvm use lts/*
```

### AWS Credential Issues

**Error:** `Could not load credentials from any providers`

**Solution:** Ensure AWS credentials are configured

```bash
# Check credentials file
cat ~/.aws/credentials

# Or set environment variables
export AWS_ACCESS_KEY_ID=your_key
export AWS_SECRET_ACCESS_KEY=your_secret
```

### Test Hanging Issues

**Error:** Tests not completing or Jest hanging

**Solution:** Jest is configured with cleanup handlers

- Tests have 10000ms timeout
- `forceExit: true` ensures Jest exits
- Serial test execution prevents race conditions

### S3 Publishing Errors

**Error:** `The specified bucket does not exist`

**Solution:** Verify bucket exists and credentials have access

```bash
# Create bucket if needed
aws s3 mb s3://your-bucket-name --region us-east-1

# Test credentials
aws s3 ls
```

## Development

### Project Structure

```
node_aws_tfm/
├── src/                           # Source TypeScript code
│   ├── index.ts                   # Main entry point
│   ├── config/
│   │   └── environment.ts         # Configuration loader
│   ├── handlers/                  # Lambda handlers
│   │   └── notification.handler.ts
│   ├── executors/                 # Business logic
│   │   └── notification.executor.ts
│   ├── services/                  # AWS service wrappers
│   │   ├── s3.service.ts
│   │   ├── dynamodb.service.ts
│   │   ├── stepfunctions.service.ts
│   │   ├── sns.service.ts
│   │   ├── ses.service.ts
│   │   └── eventbridge.service.ts
│   └── utils/
│       └── logger.ts              # Logging utility
├── tests/                         # Test files (50+ tests)
│   ├── config/
│   ├── handlers/
│   ├── executors/
│   ├── services/
│   └── utils/
├── terraform/                     # Terraform configuration
├── scripts/
│   ├── build.mjs                  # Compile and bundle
│   ├── clean.mjs                  # Clean artifacts
│   ├── package.mjs                # Package for distribution
│   └── publish.mjs                # Upload to S3
├── dist/                          # Build output (generated)
├── jest.config.js                 # Jest configuration
└── README.md
```

### Adding a New Service

1. **Create service file** in `src/services/my-service.ts`
2. **Implement AWS SDK client** with proper error handling
3. **Add test file** in `tests/services/my-service.test.ts`
4. **Export from** `src/index.ts`
5. **Build and test**
   ```bash
   npm run build
   npm test
   ```

### Code Style Guidelines

Follow existing patterns:

- Use TypeScript for type safety
- Services use constructor-based configuration
- Implement comprehensive error handling
- Add JSDoc comments for public methods
- Test all public methods

### Development Commands

```bash
# Watch mode for active development
npm run test:watch

# Fix linting issues automatically
npm run lint:fix

# Type checking without compilation
npm run type-check

# Full build cycle
npm run clean && npm run build && npm test
```

## CI/CD Pipeline

GitHub Actions automatically on push/PR:

1. Runs ESLint for code quality
2. Type checks TypeScript
3. Executes all tests with coverage
4. Reports coverage to Codecov
5. Builds and packages on success

Triggered on:

- Push to `main` or `develop` branches
- Pull requests to `main` or `develop`

## Contributing

1. Create a feature branch (`git checkout -b feature/amazing-feature`)
2. Commit changes (`git commit -m 'Add amazing feature'`)
3. Push to branch (`git push origin feature/amazing-feature`)
4. Ensure all tests pass: `npm test`
5. Open a Pull Request

## License

ISC License - see LICENSE file for details

## Support

For issues, questions, or suggestions, please open an issue on GitHub.

---

**Happy coding! 🚀**
