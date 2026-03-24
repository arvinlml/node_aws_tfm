/**
 * Step Functions Service Tests
 */

import { StepFunctionsService } from '../../src/services/stepfunctions.service';

jest.mock('@aws-sdk/client-sfn');

describe('StepFunctionsService', () => {
  let service: StepFunctionsService;

  beforeEach(() => {
    jest.clearAllMocks();
    service = new StepFunctionsService({ region: 'us-east-1' });
  });

  it('should create an instance with valid config', () => {
    expect(service).toBeDefined();
    expect(service).toBeInstanceOf(StepFunctionsService);
  });

  it('should have startExecution method', () => {
    expect(typeof (service as any).startExecution).toBe('function');
  });

  it('should have getExecutionHistory method', () => {
    expect(typeof (service as any).getExecutionHistory).toBe('function');
  });

  it('should have stopExecution method', () => {
    expect(typeof (service as any).stopExecution).toBe('function');
  });
});
