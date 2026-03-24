# Allure Test Reporting

This project is configured with [Allure](https://docs.qameta.io/allure/) test reporting framework, providing comprehensive test reports with detailed metrics, history tracking, and trend analysis.

## Features

- **Beautiful Test Reports**: HTML reports with charts, statistics, and visual hierarchy
- **Test History**: Track test results over time with trend analysis
- **Detailed Information**: Failure reasons, logs, attachments, and stack traces
- **Issue Integration**: Links to GitHub issues (configured in jest.config.js)
- **CI/CD Integration**: Automated report generation in GitHub Actions

## Installation

Allure dependencies are already installed:

- `jest-allure`: Jest reporter for Allure
- `allure-commandline`: Command-line tool for generating reports

```bash
npm install --save-dev jest-allure allure-commandline
```

## Usage

### Run Tests with Allure Reporting

```bash
# Generate Allure results while running tests (automatic with jest configuration)
npm test

# Or explicitly run with Allure reporter
npm run test:allure
```

### Generate HTML Report

```bash
npm run allure:report
```

This generates a complete HTML report in `allure-report/` directory.

### View Report in Browser

```bash
npm run allure:serve
```

This starts a local server and opens the Allure report in your browser.

### Clean Allure Data

```bash
npm run allure:clean
```

This removes `allure-results/` and `allure-report/` directories.

## Report Structure

The Allure report includes:

- **Overview**: Test execution summary with statistics
- **Suites**: Organized test cases by suite
- **Behaviors**: Tests grouped by behavior/feature
- **Timeline**: Test execution timeline
- **Categories**: Test categorization (failures, errors, etc.)
- **History**: Test history across runs
- **Trends**: Test trend analysis

## Configuration

### jest.config.js

Jest is configured to use jest-allure reporter:

```javascript
reporters: [
  "default",
  [
    "jest-allure",
    {
      outputPath: "allure-results",
      usePackageJsonReporter: false,
      usePath: true,
      suiteTitle: true,
      issueLinkTemplate: "https://github.com/arvinlml/node_aws_tfm/issues/{}",
      tmsLinkTemplate: "https://jira.example.com/browse/{}",
    },
  ],
];
```

### .allurerc.json

Configure Allure paths:

```json
{
  "allure": {
    "resultsPath": "allure-results",
    "reportPath": "allure-report"
  }
}
```

## CI/CD Integration

The GitHub Actions workflow automatically:

1. Runs tests (which generates Allure results)
2. Generates Allure HTML report
3. Uploads report as artifacts for each Node.js version

Reports are available in the workflow artifacts for 30 days.

### Accessing CI Reports

1. Go to GitHub Actions
2. Select the workflow run
3. Download the `allure-report-*.zip` artifact
4. Extract and open `index.html` in a browser

## Adding Test Annotations

Enhance your test reports with Allure annotations:

### In Test Files

```typescript
describe("Authentication", () => {
  it("should verify user login", () => {
    // Allure will automatically capture test results
    expect(true).toBe(true);
  });
});
```

### With Descriptions (currently in jest-allure)

The jest-allure reporter automatically captures:

- Test suite names
- Test names
- Test status (passed/failed/skipped)
- Error messages and stack traces
- Execution time
- Retry information

## Troubleshooting

### No allure-results directory created

Ensure tests are running successfully. The reporter only captures results when tests execute.

### Report not generating

1. Check that `allure-results/` directory exists
2. Verify allure-commandline is installed: `npm ls allure-commandline`
3. Run: `npm run allure:report` to manually generate

### Port already in use (allure:serve)

The serve command uses port 4040 by default. Kill the process or use a different port:

```bash
allure serve allure-results --port 8080
```

## Best Practices

1. **Meaningful Test Names**: Use clear, descriptive test names
2. **Organized Suites**: Group related tests in describe blocks
3. **Regular Cleanup**: Use `npm run allure:clean` before new test runs
4. **CI Artifacts**: Download and review reports from CI/CD pipeline
5. **History Tracking**: Keep allure-results directory between runs for trend analysis

## Resources

- [Allure Documentation](https://docs.qameta.io/allure/)
- [jest-allure Reporter](https://github.com/zaqqaz/jest-allure)
- [Allure CLI](https://docs.qameta.io/allure/#_commandline)

## Common npm Scripts

| Command                 | Description                           |
| ----------------------- | ------------------------------------- |
| `npm test`              | Run tests and generate Allure results |
| `npm run test:allure`   | Explicitly run with Allure reporter   |
| `npm run allure:report` | Generate HTML report from results     |
| `npm run allure:serve`  | Serve and view report in browser      |
| `npm run allure:clean`  | Clean all Allure data                 |
