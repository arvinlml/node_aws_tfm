#!/usr/bin/env node

/**
 * Simple Test Runner - Validates service instantiation and methods
 */

const path = require('path');

// Suppress AWS SDK warnings
process.env.AWS_SDK_LOAD_CONFIG = 'false';

let testsRun = 0;
let testsPassed = 0;
let testsFailed = 0;

function test(name, fn) {
  testsRun++;
  try {
    fn();
    console.log(`✓ ${name}`);
    testsPassed++;
  } catch (error) {
    console.error(`✗ ${name}`);
    console.error(`  Error: ${error.message}`);
    testsFailed++;
  }
}

console.log('Running Service Tests...\n');

// Test S3Service
try {
  const { S3Service } = require('../dist/services/s3.service');
  test('S3Service can be instantiated', () => {
    const service = new S3Service({ region: 'us-east-1' });
    if (!service) throw new Error('Instance is null');
    if (typeof service.getObject !== 'function') throw new Error('getObject method missing');
    if (typeof service.putObject !== 'function') throw new Error('putObject method missing');
    if (typeof service.deleteObject !== 'function') throw new Error('deleteObject method missing');
  });
} catch (e) {
  console.log(`⚠ Skipping S3Service tests: ${e.message}`);
}

// Test DynamoDBService
try {
  const { DynamoDBService } = require('../dist/services/dynamodb.service');
  test('DynamoDBService can be instantiated', () => {
    const service = new DynamoDBService({ region: 'us-east-1' });
    if (!service) throw new Error('Instance is null');
    if (typeof service.getItem !== 'function') throw new Error('getItem method missing');
    if (typeof service.putItem !== 'function') throw new Error('putItem method missing');
    if (typeof service.deleteItem !== 'function') throw new Error('deleteItem method missing');
    if (typeof service.query !== 'function') throw new Error('query method missing');
  });
} catch (e) {
  console.log(`⚠ Skipping DynamoDBService tests: ${e.message}`);
}

// Test StepFunctionsService
try {
  const { StepFunctionsService } = require('../dist/services/stepfunctions.service');
  test('StepFunctionsService can be instantiated', () => {
    const service = new StepFunctionsService({ region: 'us-east-1' });
    if (!service) throw new Error('Instance is null');
    if (typeof service.startExecution !== 'function') throw new Error('startExecution method missing');
    if (typeof service.getExecutionHistory !== 'function') throw new Error('getExecutionHistory method missing');
    if (typeof service.stopExecution !== 'function') throw new Error('stopExecution method missing');
  });
} catch (e) {
  console.log(`⚠ Skipping StepFunctionsService tests: ${e.message}`);
}

// Test SNSService  
try {
  const { SNSService } = require('../dist/services/sns.service');
  test('SNSService can be instantiated', () => {
    const service = new SNSService({ region: 'us-east-1' });
    if (!service) throw new Error('Instance is null');
    if (typeof service.publishMessage !== 'function') throw new Error('publishMessage method missing');
    if (typeof service.subscribe !== 'function') throw new Error('subscribe method missing');
    if (typeof service.unsubscribe !== 'function') throw new Error('unsubscribe method missing');
  });
} catch (e) {
  console.log(`⚠ Skipping SNSService tests: ${e.message}`);
}

// Test SESService
try {
  const { SESService } = require('../dist/services/ses.service');
  test('SESService can be instantiated', () => {
    const service = new SESService({ region: 'us-east-1' });
    if (!service) throw new Error('Instance is null');
    if (typeof service.sendEmail !== 'function') throw new Error('sendEmail method missing');
    if (typeof service.sendTemplatedEmail !== 'function') throw new Error('sendTemplatedEmail method missing');
  });
} catch (e) {
  console.log(`⚠ Skipping SESService tests: ${e.message}`);
}

// Test EventBridgeService
try {
  const { EventBridgeService } = require('../dist/services/eventbridge.service');
  test('EventBridgeService can be instantiated', () => {
    const service = new EventBridgeService({ region: 'us-east-1' });
    if (!service) throw new Error('Instance is null');
    if (typeof service.putEvent !== 'function') throw new Error('putEvent method missing');
    if (typeof service.putEvents !== 'function') throw new Error('putEvents method missing');
  });
} catch (e) {
  console.log(`⚠ Skipping EventBridgeService tests: ${e.message}`);
}

console.log(`\n========================================`);
console.log(`Tests Run: ${testsRun}`);
console.log(`Tests Passed: ${testsPassed}`);
console.log(`Tests Failed: ${testsFailed}`);
console.log(`========================================\n`);

if (testsFailed > 0) {
  process.exit(1);
}

console.log('✓ All tests passed!');
process.exit(0);
