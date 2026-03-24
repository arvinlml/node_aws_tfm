# AWS Terraform Node Module - Copilot Instructions

## Project Overview
This is a comprehensive Node.js module that provides AWS service integrations with TypeScript support, including S3, DynamoDB, Step Functions, SNS, SES, and EventBridge. The project includes Terraform configurations for AWS infrastructure, comprehensive testing with coverage requirements, and integrations with ESLint.

## Key Features
- **AWS Services**: S3, DynamoDB, Step Functions (SFN), SNS, SES, EventBridge
- **Build Tools**: TypeScript compilation, ESLint linting
- **Scripts**: Build, clean, package, and publish workflows
- **Testing**: Jest with coverage thresholds (70%)
- **Infrastructure**: Terraform configuration for AWS resources
- **CI/CD**: GitHub Actions workflow for automated testing and building

## Project Structure
```
├── src/                    # Source TypeScript code
│   ├── services/          # AWS service implementations
│   └── index.ts           # Main entry point
├── tests/                 # Test files
├── terraform/             # Terraform configuration
├── scripts/               # Build/package/publish scripts
├── .github/               # GitHub configuration
│   └── workflows/         # CI/CD workflows
└── .vscode/              # VS Code settings
```

## Development Workflow

### Installing Dependencies
```bash
npm install
```

### Building the Project
```bash
npm run build
```

### Running Tests
```bash
npm test                  # Run tests with coverage
npm run test:watch      # Watch mode
npm run test:coverage   # Generate coverage report
```

### Linting
```bash
npm run lint            # Check code style
npm run lint:fix        # Auto-fix linting issues
```

### Publishing
```bash
npm run clean           # Clean build artifacts
npm run build           # Build the project
npm run package         # Prepare distribution
npm run publish         # Instructions for npm publish
```

## Configuration

### AWS Credentials
Services require AWS credentials. Configure via:
- Environment variables: `AWS_ACCESS_KEY_ID`, `AWS_SECRET_ACCESS_KEY`
- AWS credentials file: `~/.aws/credentials`
- IAM roles (for EC2/Lambda)

### Terraform
- Configure backend in `terraform/main.tf`
- Set variables in `terraform/terraform.tfvars`
- Available environments: development, staging, production

## Testing Requirements
- Minimum coverage: 70% (branches, functions, lines, statements)
- Run tests with: `npm test`
- Coverage report in: `coverage/`

## CI/CD Pipeline
GitHub Actions automatically:
1. Runs linter on push/PR
2. Type checks code
3. Runs full test suite
4. Uploads coverage to Codecov
5. Builds and packages on success

## Commands Quick Reference
| Command | Purpose |
|---------|---------|
| `npm run build` | Compile TypeScript |
| `npm run clean` | Remove build artifacts |
| `npm run lint` | Check code style |
| `npm run lint:fix` | Auto-fix issues |
| `npm test` | Run tests with coverage |
| `npm run type-check` | TypeScript validation |
| `npm run package` | Prepare distribution |
| `npm run publish` | Publish to npm |
