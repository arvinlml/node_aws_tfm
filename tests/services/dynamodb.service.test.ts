/**
 * DynamoDB Service Tests
 */

import { DynamoDBService } from '../../src/services/dynamodb.service';

jest.mock('@aws-sdk/client-dynamodb');
jest.mock('@aws-sdk/util-dynamodb');

describe('DynamoDBService', () => {
  let service: DynamoDBService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new DynamoDBService({ region: 'us-east-1' });
  });

  it('should create an instance with valid config', () => {
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(DynamoDBService);
  });

  it('should have getItem method', () => {
    expect(typeof (service as any).getItem).toBe('function');
  });

  it('should have putItem method', () => {
    expect(typeof (service as any).putItem).toBe('function');
  });

  it('should have deleteItem method', () => {
    expect(typeof (service as any).deleteItem).toBe('function');
  });

  it('should have query method', () => {
    expect(typeof (service as any).query).toBe('function');
  });
});
