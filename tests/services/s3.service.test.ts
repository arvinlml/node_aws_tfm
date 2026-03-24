/**
 * S3 Service Tests
 */

import { S3Service } from '../../src/services/s3.service';

jest.mock('@aws-sdk/client-s3');

describe('S3Service', () => {
  let service: S3Service;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new S3Service({ region: 'us-east-1' });
  });

  it('should create an instance with valid config', () => {
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(S3Service);
  });

  it('should have getObject method', () => {
    expect(typeof (service as any).getObject).toBe('function');
  });

  it('should have putObject method', () => {
    expect(typeof (service as any).putObject).toBe('function');
  });

  it('should have deleteObject method', () => {
    expect(typeof (service as any).deleteObject).toBe('function');
  });
});
