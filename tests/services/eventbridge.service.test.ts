/**
 * EventBridge Service Tests
 */

import { EventBridgeService } from '../../src/services/eventbridge.service';

jest.mock('@aws-sdk/client-eventbridge');

describe('EventBridgeService', () => {
  let service: EventBridgeService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new EventBridgeService({ region: 'us-east-1' });
  });

  it('should create an instance with valid config', () => {
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(EventBridgeService);
  });

  it('should have putEvent method', () => {
    expect(typeof (service as any).putEvent).toBe('function');
  });

  it('should have putEvents method', () => {
    expect(typeof (service as any).putEvents).toBe('function');
  });
});
