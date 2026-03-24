# Automation Testing Guide

## Table of Contents

1. [MFA Authentication in Playwright](#mfa-authentication-in-playwright)
2. [MFA Strategies](#mfa-strategies)
3. [Implementation Examples](#implementation-examples)
4. [Best Practices](#best-practices)
5. [CI/CD Integration](#cicd-integration)

---

## MFA Authentication in Playwright

### Overview

Multi-Factor Authentication (MFA) adds security layers to applications and requires special handling in automated testing. This guide covers strategies for testing applications with MFA enabled using Playwright.

### Why MFA Testing Matters

- ✅ Ensure authentication flows work end-to-end
- ✅ Validate security policies don't break functionality
- ✅ Test user workflows with MFA enabled
- ✅ Prevent regressions in auth systems

### Common MFA Methods

| Type              | Example                     | Testing Difficulty              |
| ----------------- | --------------------------- | ------------------------------- |
| **TOTP**          | Google Authenticator, Authy | Easy (deterministic)            |
| **SMS/Email OTP** | Text/email codes            | Medium (requires service)       |
| **Security Keys** | YubiKey, Windows Hello      | Medium (virtual authenticators) |
| **Backup Codes**  | One-time codes              | Easy (stored locally)           |
| **Biometric**     | Fingerprint, Face ID        | Hard (device-dependent)         |

---

## MFA Strategies

### Strategy 1: Pre-Generated Tokens/Sessions (Recommended for CI/CD)

**Best for:** Automated testing pipelines in CI/CD environments

**Pros:**

- ✅ Fast (no MFA delay)
- ✅ No external dependencies
- ✅ Reliable and deterministic
- ✅ Works offline

**Cons:**

- ❌ Not testing actual MFA flow
- ❌ Requires pre-setup
- ❌ Session expiration handling

**When to use:**

- CI/CD pipelines
- Regression testing
- Quick development feedback loops

**Implementation:**

```typescript
import { test, expect } from "@playwright/test";

test("use pre-authenticated session", async ({ page }) => {
  // Load pre-generated session with valid MFA already completed
  const sessionData = JSON.parse(process.env.SESSION_STORAGE);

  await page.context().addInitScript(() => {
    window.localStorage.setItem("auth_token", sessionData.token);
    window.sessionStorage.setItem("auth_session", sessionData.session);
  });

  await page.goto("https://api.example.com/dashboard");
  await expect(page).toHaveTitle(/Dashboard/);
});
```

---

### Strategy 2: TOTP (Time-Based One-Time Password)

**Best for:** Testing with authenticator apps (Google Authenticator, Authy, Microsoft Authenticator)

**Pros:**

- ✅ Tests actual MFA flow
- ✅ No external service needed
- ✅ Deterministic (same secret = same code)
- ✅ Industry standard
- ✅ Works offline

**Cons:**

- ❌ Time-dependent (clock skew issues)
- ❌ Short validity window (30 seconds)
- ❌ Need to manage secrets securely

**When to use:**

- Full authentication flow testing
- Security audit scenarios
- User journey testing with MFA

**Setup:**

```bash
npm install otplib
```

**Implementation:**

```typescript
import { test, expect } from "@playwright/test";
import { authenticator } from "otplib";

test("authenticate with TOTP", async ({ page }) => {
  // Get the secret from test credentials
  const secret = process.env.MFA_SECRET_KEY;

  // Generate current TOTP (valid for 30 seconds)
  const token = authenticator.generate(secret);

  // Standard login flow
  await page.goto("https://app.example.com/login");
  await page.fill('input[name="email"]', "test@example.com");
  await page.fill('input[name="password"]', process.env.PASSWORD);
  await page.click('button[type="submit"]');

  // Wait for MFA prompt to appear
  await page.waitForSelector('[name="mfa_code"]');

  // Enter MFA code
  await page.fill('[name="mfa_code"]', token);
  await page.click('button:has-text("Verify")');

  // Verify successful authentication
  await expect(page).toHaveTitle(/Dashboard/);
  await expect(page).toHaveURL(/dashboard/);
});
```

**Handling Time Skew:**

```typescript
import { authenticator } from "otplib";

function generateTOTPWithRetry(secret: string, window: number = 1): string {
  // Generate code with configurable time window
  // window: 0 = exact time, 1 = previous/current/next 30-sec window
  return authenticator.generate(secret);
}

test("authenticate with TOTP time window", async ({ page }) => {
  const secret = process.env.MFA_SECRET_KEY;
  const token = generateTOTPWithRetry(secret, 1);

  // Use token with error handling for time skew
  await page.fill('[name="mfa_code"]', token);
  await page.click('button[type="submit"]');

  // If it fails due to time skew, retry with updated time
  try {
    await page.waitForURL(/dashboard/, { timeout: 5000 });
  } catch {
    console.warn("TOTP possibly expired, retrying...");
    const newToken = generateTOTPWithRetry(secret);
    await page.fill('[name="mfa_code"]', newToken);
    await page.click('button[type="submit"]');
  }
});
```

---

### Strategy 3: SMS/Email OTP with Service Integration

**Best for:** Testing email/SMS-based MFA with real message capture

**Pros:**

- ✅ Tests realistic MFA flows
- ✅ Works with email/SMS providers
- ✅ Captures actual messages sent

**Cons:**

- ❌ Depends on external service
- ❌ Cost implications
- ❌ Rate limiting risks
- ❌ Slower execution

**When to use:**

- Integration testing
- End-to-end security testing
- Staging environment validation

**Implementation with Twilio:**

```bash
npm install twilio
```

```typescript
import { test, expect } from "@playwright/test";
import twilio from "twilio";

const twilioClient = twilio(
  process.env.TWILIO_ACCOUNT_SID,
  process.env.TWILIO_AUTH_TOKEN,
);

async function getLatestOTP(phone: string): Promise<string> {
  const messages = await twilioClient.messages.list({
    to: phone,
    limit: 1,
  });

  if (messages.length === 0) {
    throw new Error("No SMS messages found");
  }

  // Extract OTP from message (e.g., "Your code: 123456")
  const match = messages[0].body.match(/(\d{6})/);

  if (!match) {
    throw new Error(`OTP not found in message: ${messages[0].body}`);
  }

  return match[1];
}

test("authenticate with SMS OTP", async ({ page }) => {
  const testPhone = process.env.TEST_PHONE_NUMBER; // +15551234567

  // Login
  await page.goto("https://app.example.com/login");
  await page.fill('input[name="email"]', "test@example.com");
  await page.fill('input[name="password"]', process.env.PASSWORD);
  await page.click('button[type="submit"]');

  // Request OTP to be sent
  await expect(page.locator("text=OTP sent to")).toBeVisible();

  // Wait and retrieve OTP
  await page.waitForTimeout(2000); // Small delay for SMS delivery
  const otp = await getLatestOTP(testPhone);

  // Enter OTP
  await page.fill('[name="otp_code"]', otp);
  await page.click('button:has-text("Verify")');

  // Verify success
  await expect(page).toHaveURL(/dashboard/);
});
```

**Implementation with Email:**

```typescript
import { test, expect } from "@playwright/test";
import { simpleParser } from "mailparser";
import * as fs from "fs";

async function getOTPFromEmailFile(emailDir: string): Promise<string> {
  // Polling email directory (or use actual email service API)
  const files = fs.readdirSync(emailDir).sort();

  if (files.length === 0) {
    throw new Error("No emails found");
  }

  const latestEmail = fs.readFileSync(
    `${emailDir}/${files[files.length - 1]}`,
    "utf-8",
  );
  const parsed = await simpleParser(latestEmail);

  // Extract OTP from email body
  const match = parsed.text.match(/(\d{6})/);

  if (!match) {
    throw new Error("OTP not found in email");
  }

  return match[1];
}

test("authenticate with Email OTP", async ({ page }) => {
  const emailDir = process.env.EMAIL_DIRECTORY;

  await page.goto("https://app.example.com/login");
  await page.fill('input[name="email"]', "test@example.com");
  await page.fill('input[name="password"]', process.env.PASSWORD);
  await page.click('button[type="submit"]');

  // Wait for email and get OTP
  await page.waitForTimeout(3000);
  const otp = await getOTPFromEmailFile(emailDir);

  // Enter OTP
  await page.fill('[name="otp_code"]', otp);
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL(/dashboard/);
});
```

---

### Strategy 4: API Token Authentication

**Best for:** API testing where you bypass the UI entirely

**Pros:**

- ✅ No UI testing overhead
- ✅ Focuses on API behavior
- ✅ Faster execution
- ✅ Easier to debug

**Cons:**

- ❌ Doesn't test UI MFA flow
- ❌ Requires API knowledge

**When to use:**

- API-specific testing
- Backend validation
- Performance testing

**Implementation:**

```typescript
import { test, expect } from "@playwright/test";
import { authenticator } from "otplib";

test("API request with MFA token", async ({ request }) => {
  // Step 1: Initial authentication
  const loginResponse = await request.post(
    "https://api.example.com/auth/login",
    {
      data: {
        email: "test@example.com",
        password: process.env.PASSWORD,
        mfa_enabled: true,
      },
    },
  );

  expect(loginResponse.status()).toBe(200);
  const { mfa_challenge_id } = await loginResponse.json();

  // Step 2: Submit MFA code
  const mfaCode = authenticator.generate(process.env.MFA_SECRET_KEY);
  const mfaResponse = await request.post(
    "https://api.example.com/auth/mfa/verify",
    {
      headers: {
        "X-MFA-Challenge": mfa_challenge_id,
        "Content-Type": "application/json",
      },
      data: {
        code: mfaCode,
        challenge_id: mfa_challenge_id,
      },
    },
  );

  expect(mfaResponse.status()).toBe(200);
  const { access_token, token_type } = await mfaResponse.json();

  // Step 3: Use token for authenticated API requests
  const apiResponse = await request.get(
    "https://api.example.com/user/profile",
    {
      headers: {
        Authorization: `${token_type} ${access_token}`,
        "Content-Type": "application/json",
      },
    },
  );

  expect(apiResponse.status()).toBe(200);
  const user = await apiResponse.json();
  expect(user).toHaveProperty("email", "test@example.com");
});
```

---

### Strategy 5: Backup Codes

**Best for:** Testing fallback MFA method

**Pros:**

- ✅ No time dependency
- ✅ Always works if valid
- ✅ Tests fallback path
- ✅ Quick testing

**Cons:**

- ❌ Single-use codes
- ❌ Limited quantity
- ❌ Not testing primary MFA

**When to use:**

- Fallback testing
- Recovery scenario testing
- Backup code regeneration testing

**Implementation:**

```typescript
import { test, expect } from "@playwright/test";

test("authenticate with backup code", async ({ page }) => {
  // Use a fresh backup code for each test
  // Rotate codes in your test data storage
  const backupCode = process.env.MFA_BACKUP_CODE; // e.g., "ABCD-EF01-2345"

  if (!backupCode) {
    throw new Error("No backup codes available - regenerate codes");
  }

  await page.goto("https://app.example.com/login");
  await page.fill('input[name="email"]', "test@example.com");
  await page.fill('input[name="password"]', process.env.PASSWORD);
  await page.click('button[type="submit"]');

  // Switch to backup code input
  const useBackupLink = page.locator("text=Use backup code");
  await useBackupLink.click();

  // Enter backup code
  await page.fill('[name="backup_code"]', backupCode);
  await page.click('button:has-text("Verify")');

  // Verify success
  await expect(page).toHaveURL(/dashboard/);

  // IMPORTANT: Mark code as used (remove from environment)
  console.log(`Backup code used: ${backupCode}`);
  // In real implementation, update your credentials storage
});
```

---

### Strategy 6: WebAuthn/FIDO2 (Passwordless)

**Best for:** Modern security-first authentication testing

**Pros:**

- ✅ Tests passwordless auth
- ✅ Highest security method
- ✅ Playwright virtual authenticators available

**Cons:**

- ❌ Complex to set up
- ❌ Device-specific in production
- ❌ Requires specific browser features

**When to use:**

- Security key testing
- Passwordless workflow testing
- Modern auth scenarios

**Installation:**

```bash
npm install --save-dev playwright
```

**Implementation:**

```typescript
import { test, expect } from "@playwright/test";

test("authenticate with WebAuthn", async ({ page, context }) => {
  // Add virtual authenticator to browser context
  const client = await context.addVirtualAuthenticator({
    protocol: "ctap2",
    transport: "usb",
    hasResidentKey: true,
    hasUserVerification: true,
    isUserVerified: true,
  });

  // Create credential (typically done during registration)
  const credentialId: string = "credential-id-123";
  const privateKey: string =
    "MIGHAgEAMBMGByqGSM49AgEGCCqGSM49AwEHBG0wawIBAQQg...";

  await client.addCredential({
    credentialId: Buffer.from(credentialId, "utf-8"),
    privateKey: Buffer.from(privateKey, "utf-8"),
    signCount: 0,
    rp: "example.com",
    userHandle: Buffer.from("user123"),
    isUserVerified: true,
  });

  // Test login with security key
  await page.goto("https://app.example.com/login");
  await page.click('button:has-text("Sign in with security key")');

  // Browser/app handles WebAuthn ceremony automatically
  // Virtual authenticator will respond to challenge

  await expect(page).toHaveURL(/dashboard/);
});
```

---

## Implementation Examples

### Complete Test Suite with Fixtures

This is the recommended approach for maintainability:

```typescript
// fixtures/auth.ts
import { test as base, expect } from "@playwright/test";
import { authenticator } from "otplib";

type AuthFixtures = {
  authenticatedPage: any;
  apiToken: string;
  mfaCode: string;
};

export const test = base.extend<AuthFixtures>({
  // Generate fresh TOTP for each test
  mfaCode: async ({}, use) => {
    const code = authenticator.generate(process.env.MFA_SECRET_KEY);
    await use(code);
  },

  // Get API token with MFA
  apiToken: async ({ request }, use) => {
    // Initial login
    const loginRes = await request.post("/api/auth/login", {
      data: {
        email: process.env.TEST_EMAIL,
        password: process.env.TEST_PASSWORD,
      },
    });

    const { mfa_challenge_id } = await loginRes.json();

    // MFA verification
    const code = authenticator.generate(process.env.MFA_SECRET_KEY);
    const mfaRes = await request.post("/api/auth/mfa/verify", {
      headers: { "X-MFA-Challenge": mfa_challenge_id },
      data: { code },
    });

    const { access_token } = await mfaRes.json();
    await use(access_token);
  },

  // Authenticated browser page with MFA completion
  authenticatedPage: async ({ page, mfaCode }, use) => {
    // Navigate to login
    await page.goto("/login");

    // Fill credentials
    await page.fill('input[name="email"]', process.env.TEST_EMAIL);
    await page.fill('input[name="password"]', process.env.TEST_PASSWORD);
    await page.click('button[type="submit"]');

    // Handle MFA
    await page.waitForSelector('[name="mfa_code"]');
    await page.fill('[name="mfa_code"]', mfaCode);
    await page.click('button:has-text("Verify")');

    // Wait for redirect to dashboard
    await page.waitForURL(/dashboard/, { waitUntil: "networkidle" });

    // Provide page to test
    await use(page);

    // Cleanup - logout
    await page.goto("/logout");
    await page.waitForURL(/login/);
  },
});

export { expect };
```

**Using the fixtures:**

```typescript
// tests/api/dashboard.spec.ts
import { test, expect } from "../fixtures/auth";

test("user can view dashboard", async ({ authenticatedPage }) => {
  await expect(authenticatedPage.locator("h1")).toContainText("Dashboard");
});

test("API returns user profile", async ({ request, apiToken }) => {
  const response = await request.get("/api/user/profile", {
    headers: { Authorization: `Bearer ${apiToken}` },
  });

  expect(response.status()).toBe(200);
  const user = await response.json();
  expect(user.email).toBeDefined();
});

test.describe("authenticated scenarios", () => {
  test("can update profile", async ({ authenticatedPage, apiToken }) => {
    const response = await authenticatedPage.request.patch(
      "/api/user/profile",
      {
        headers: { Authorization: `Bearer ${apiToken}` },
        data: { name: "Test User" },
      },
    );

    expect(response.ok()).toBeTruthy();
  });
});
```

---

### Context Persistence with Sessions

Reuse authenticated sessions across multiple tests:

```typescript
import { test, expect, chromium } from "@playwright/test";
import { authenticator } from "otplib";
import * as fs from "fs";
import * as path from "path";

const STORAGE_PATH = path.join(__dirname, ".auth");

test.describe("session persistence", () => {
  let storageState: any;

  test.beforeAll(async () => {
    const browser = await chromium.launch();
    const context = await browser.newContext();
    const page = await context.newPage();

    // Check if cached auth exists and is valid
    if (fs.existsSync(STORAGE_PATH)) {
      const cached = JSON.parse(fs.readFileSync(STORAGE_PATH, "utf-8"));

      // Validate cached session
      await context.addCookies(cached.cookies);
      await page.goto("/dashboard");

      if (page.url().includes("dashboard")) {
        storageState = cached;
        console.log("✓ Using cached authentication");
      }
    }

    // If no valid cache, perform fresh authentication
    if (!storageState) {
      await page.goto("/login");

      // Full authentication flow with MFA
      await page.fill('[name="email"]', process.env.TEST_EMAIL);
      await page.fill('[name="password"]', process.env.TEST_PASSWORD);
      await page.click('button[type="submit"]');

      // MFA
      const mfaCode = authenticator.generate(process.env.MFA_SECRET_KEY);
      await page.fill('[name="mfa_code"]', mfaCode);
      await page.click('button:has-text("Verify")');

      await page.waitForURL(/dashboard/);

      // Save session
      storageState = {
        cookies: await context.cookies(),
        localStorage: await page.evaluate(() => JSON.stringify(localStorage)),
      };

      fs.mkdirSync(path.dirname(STORAGE_PATH), { recursive: true });
      fs.writeFileSync(STORAGE_PATH, JSON.stringify(storageState, null, 2));
      console.log("✓ Saved new authentication");
    }

    await browser.close();
  });

  test.use({ storageState: STORAGE_PATH });

  test("tests reuse cached auth", async ({ page }) => {
    // Page automatically includes cached session
    await page.goto("/dashboard");
    await expect(page).toHaveTitle(/Dashboard/);
  });
});
```

---

## Best Practices

### 1. Environment Variables

Create `.env.test` file:

```bash
# Authentication
TEST_EMAIL=playwright-test@example.com
TEST_PASSWORD=SecureTestPassword123!

# MFA Secrets
MFA_SECRET_KEY=JBSWY3DPEBLW64TMMQ======

# OTP Services (if using)
TWILIO_ACCOUNT_SID=ACxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx
TWILIO_AUTH_TOKEN=your_auth_token_here
TEST_PHONE_NUMBER=+15551234567

# Test Environment
BASE_URL=https://staging.example.com
NODE_ENV=test
```

**Load in tests:**

```typescript
import dotenv from "dotenv";

dotenv.config({ path: ".env.test" });

test("use environment variables", async ({ page }) => {
  await page.goto(process.env.BASE_URL);
  // ...
});
```

### 2. Test Credentials Management

```typescript
// config/testCredentials.ts
export const TEST_CREDENTIALS = {
  PRIMARY: {
    email: process.env.TEST_EMAIL,
    password: process.env.TEST_PASSWORD,
    mfaSecret: process.env.MFA_SECRET_KEY,
    backupCodes: process.env.MFA_BACKUP_CODES?.split(",") || [],
  },
  SECONDARY: {
    email: process.env.TEST_EMAIL_2,
    password: process.env.TEST_PASSWORD_2,
    mfaSecret: process.env.MFA_SECRET_KEY_2,
  },
};

test("use managed credentials", async ({ page }) => {
  const creds = TEST_CREDENTIALS.PRIMARY;
  await page.fill('[name="email"]', creds.email);
  // ...
});
```

### 3. Error Handling & Retries

```typescript
import { test, expect } from "@playwright/test";
import { authenticator } from "otplib";

test("handle MFA code expiration", async ({ page }) => {
  const secret = process.env.MFA_SECRET_KEY;
  let retries = 0;
  const maxRetries = 3;

  while (retries < maxRetries) {
    try {
      const code = authenticator.generate(secret);

      await page.fill('[name="mfa_code"]', code);
      await page.click('button[type="submit"]');

      // Wait for success
      await page.waitForURL(/dashboard/, { timeout: 5000 });
      break; // Success
    } catch (error) {
      retries++;

      if (retries < maxRetries) {
        console.warn(`MFA attempt ${retries} failed, retrying...`);
        await page.reload();
      } else {
        throw new Error(
          `MFA authentication failed after ${maxRetries} attempts: ${error.message}`,
        );
      }
    }
  }
});
```

### 4. Test Data Cleanup

```typescript
import { test, expect } from "@playwright/test";

test("cleanup after test", async ({ page }) => {
  try {
    // Test code here
    await page.goto("/dashboard");
    // ...
  } finally {
    // Always perform cleanup
    try {
      await page.goto("/logout");
    } catch (e) {
      console.log("Logout failed (expected if already logged out)");
    }
  }
});

// Or use afterEach hook
test.afterEach(async ({ page }) => {
  try {
    await page.goto("/logout");
  } catch (e) {
    // Ignore logout errors
  }
});
```

### 5. Logging & Debugging

```typescript
import { test, expect } from "@playwright/test";

test("add debugging info", async ({ page }, testInfo) => {
  // Enable verbose logging
  page.on("console", (msg) => {
    console.log(`PAGE LOG: ${msg.text()}`);
  });

  page.on("response", (response) => {
    if (response.url().includes("/mfa")) {
      console.log(`MFA Response: ${response.status()}`);
    }
  });

  // Test code
  await page.goto("/login");

  // Attach screenshots on failure
  if (testInfo.status !== "passed") {
    await page.screenshot({ path: `failure-${testInfo.title}.png` });
  }
});
```

---

## CI/CD Integration

### GitHub Actions

```yaml
# .github/workflows/playwright-tests.yml
name: Playwright Tests with MFA

on:
  push:
    branches: [main, develop]
  pull_request:
    branches: [main, develop]

jobs:
  test:
    runs-on: ubuntu-latest

    env:
      TEST_EMAIL: ${{ secrets.TEST_EMAIL }}
      TEST_PASSWORD: ${{ secrets.TEST_PASSWORD }}
      MFA_SECRET_KEY: ${{ secrets.MFA_SECRET_KEY }}
      BASE_URL: ${{ secrets.STAGING_URL }}

    steps:
      - uses: actions/checkout@v3

      - uses: actions/setup-node@v3
        with:
          node-version: "20"

      - name: Install dependencies
        run: npm install

      - name: Install Playwright browsers
        run: npx playwright install

      - name: Run Playwright tests
        run: npm run test:playwright

      - name: Upload test results
        if: always()
        uses: actions/upload-artifact@v3
        with:
          name: playwright-report
          path: playwright-report/
```

### GitLab CI

```yaml
# .gitlab-ci.yml
stages:
  - test

playwright_tests:
  stage: test
  image: mcr.microsoft.com/playwright:v1.40.0-focal

  variables:
    TEST_EMAIL: ${TEST_EMAIL}
    TEST_PASSWORD: ${TEST_PASSWORD}
    MFA_SECRET_KEY: ${MFA_SECRET_KEY}

  script:
    - npm install
    - npm run test:playwright

  artifacts:
    when: always
    paths:
      - playwright-report/
```

---

## Troubleshooting Guide

### Issue: MFA code expired before submission

**Cause:** Network delay or processing time exceeds 30-second TOTP window

**Solution:**

```typescript
// Retry with fresh code
test("handle TOTP expiration", async ({ page }) => {
  const { authenticator } = require("otplib");

  async function submitMFAWithRetry(maxAttempts = 2) {
    for (let i = 0; i < maxAttempts; i++) {
      const code = authenticator.generate(process.env.MFA_SECRET_KEY);
      await page.fill('[name="mfa_code"]', code);
      await page.click('button[type="submit"]');

      try {
        await page.waitForURL(/dashboard/, { timeout: 5000 });
        return true;
      } catch {
        if (i < maxAttempts - 1) {
          console.log("Code expired, retrying with fresh code...");
          await page.reload();
        }
      }
    }
    return false;
  }

  const success = await submitMFAWithRetry();
  expect(success).toBeTruthy();
});
```

### Issue: OTP service rate limiting

**Cause:** Too many OTP requests to SMS/Email service

**Solution:**

```typescript
// Add delays and throttling
const OTP_DELAY_MS = 5000;
const lastOTPTime = {};

async function getOTPWithThrottling(identifier: string): Promise<string> {
  const now = Date.now();
  const lastTime = lastOTPTime[identifier] || 0;
  const elapsed = now - lastTime;

  if (elapsed < OTP_DELAY_MS) {
    await new Promise((resolve) => setTimeout(resolve, OTP_DELAY_MS - elapsed));
  }

  lastOTPTime[identifier] = Date.now();
  return await getOTP(identifier);
}
```

### Issue: Tests fail in CI but pass locally

**Cause:** Time sync issues between machines, environment variable differences

**Solution:**

```typescript
// Use explicit timezone and time handling
test.beforeEach(async () => {
  // Sync system time
  console.log(`Test time: ${new Date().toISOString()}`);
  console.log(`Server time diff: ${process.env.SERVER_TIME_OFFSET || "none"}`);
});

// Verify environment
test("verify test environment", async () => {
  expect(process.env.MFA_SECRET_KEY).toBeDefined();
  expect(process.env.TEST_EMAIL).toBeDefined();
  // ...
});
```

---

## Security Considerations

⚠️ **Important:** Never commit secrets to version control!

```bash
# .gitignore
.env
.env.test
.env.local
.awsenv
auth-state.json
*.backup-codes
```

### Secure Credential Storage

```typescript
// Use secure credential manager
import { execSync } from "child_process";

function getSecureSecret(key: string): string {
  // Example using OS keychain
  if (process.platform === "darwin") {
    return execSync(`security find-generic-password -w -a ${key}`, {
      encoding: "utf-8",
    }).trim();
  }
  // Fallback to environment
  return process.env[key] || "";
}

test("use secure credentials", async ({ page }) => {
  const password = getSecureSecret("TEST_PASSWORD");
  const mfaSecret = getSecureSecret("MFA_SECRET");
  // ...
});
```

---

## Summary

| Strategy                        | Use Case             | Complexity | Speed     |
| ------------------------------- | -------------------- | ---------- | --------- |
| **Pre-generated tokens**        | CI/CD                | Low        | Very fast |
| **TOTP (Google Authenticator)** | Full flow testing    | Low-Medium | Fast      |
| **SMS/Email OTP**               | Real-world scenario  | Medium     | Slow      |
| **API tokens**                  | API-only testing     | Low        | Very fast |
| **Backup codes**                | Fallback testing     | Low        | Fast      |
| **WebAuthn**                    | Security key testing | High       | Medium    |

**Recommended approach for most projects:**

1. Use TOTP + fixtures for comprehensive testing
2. Use API tokens for internal API testing
3. Use pre-generated sessions for CI/CD speed
4. Test alternative MFA methods periodically
