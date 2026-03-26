/**
 * Copyright 2025 Google LLC
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 *     http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 */

const { Builder, By } = require('selenium-webdriver');
const { expect } = require('expect');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs');
const path = require('path');

describe('Issue 496255939 Reproduction', function () {
  let driver;
  this.timeout(5 * 60 * 1000);

  beforeEach(async function () {
    let chromePath = process.env.CHROME_PATH;
    if (!chromePath || chromePath.includes('.cache')) {
      // Fallback/Local dev logic
      const paths = [
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe'
      ];
      for (const p of paths) {
        if (fs.existsSync(p)) {
          chromePath = p;
          break;
        }
      }
    }

    console.log(`[INFO] Targeting Chrome Binary: ${chromePath}`);

    const options = new chrome.Options();
    // Non-headless to verify UI and enterprise behavior
    // options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    
    if (chromePath && fs.existsSync(chromePath)) {
      options.setChromeBinaryPath(chromePath);
    } else {
      console.warn('[WARN] System Chrome not found, using default (CfT might be used)');
    }

    const service = new chrome.ServiceBuilder()
      .loggingTo('chromedriver.log')
      .enableVerboseLogging();

    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .setChromeService(service)
      .build();
  });

  afterEach(async function () {
    if (driver) {
      await driver.quit();
    }
  });

  async function takeScreenshot(name) {
    const data = await driver.takeScreenshot();
    fs.writeFileSync(name, data, 'base64');
    console.log(`[INFO] Screenshot saved: ${name}`);
  }

  it('should verify Enterprise mode and attempt reproduction', async function () {
    // 1. Diagnostics: chrome://version
    await driver.get('chrome://version/');
    await new Promise(r => setTimeout(r, 3000));
    await takeScreenshot('chrome_version.png');

    // 2. Diagnostics: chrome://policy
    await driver.get('chrome://policy/');
    await new Promise(r => setTimeout(r, 3000));
    await takeScreenshot('active_policies.png');

    // 3. Diagnostics: chrome://management
    await driver.get('chrome://management/');
    await new Promise(r => setTimeout(r, 3000));
    await takeScreenshot('enterprise_mode.png');

    // 4. Bug Reproduction
    // Open a new tab to see if the bug manifests when launching from a fresh, unmanaged tab context
    console.log('[INFO] Opening a new tab...');
    await driver.switchTo().newWindow('tab');

    const targetUrl = 'https://www.google.com/';
    console.log(`[INFO] Navigating to: ${targetUrl}`);
    await driver.get(targetUrl);
    
    // Wait for potential rendering issues
    await new Promise(r => setTimeout(r, 3000));
    await takeScreenshot('bug_repro.png');

    const currentUrl = await driver.getCurrentUrl();
    console.log(`[INFO] Current URL: ${currentUrl}`);

    // If bug exists, URL might remain on the home page or similar
    expect(currentUrl).toMatch(/^https:\/\/www\.google\.com/);

    const body = await driver.findElement(By.tagName('body'));
    expect(await body.isDisplayed()).toBe(true);
  });
});
