/**
 * SNS Service Tests
 */

import { SNSService } from '../../src/services/sns.service';

jest.mock('@aws-sdk/client-sns');

describe('SNSService', () => {
  let service: SNSService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SNSService({ region: 'us-east-1' });
  });

  it('should create an instance with valid config', () => {
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(SNSService);
  });

  it('should have publishMessage method', () => {
    expect(typeof (service as any).publishMessage).toBe('function');
  });

  it('should have subscribe method', () => {
    expect(typeof (service as any).subscribe).toBe('function');
  });

  it('should have unsubscribe method', () => {
    expect(typeof (service as any).unsubscribe).toBe('function');
  });
});
