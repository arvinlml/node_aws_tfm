/**
 * SES Service Tests
 */

import { SESService } from '../../src/services/ses.service';

jest.mock('@aws-sdk/client-ses');

describe('SESService', () => {
  let service: SESService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new SESService({ region: 'us-east-1' });
  });

  it('should create an instance with valid config', () => {
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(SESService);
  });

  it('should have sendEmail method', () => {
    expect(typeof (service as any).sendEmail).toBe('function');
  });

  it('should have sendTemplatedEmail method', () => {
    expect(typeof (service as any).sendTemplatedEmail).toBe('function');
  });
});
