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
  const profilePath = path.join(__dirname, 'repro-profile');
  this.timeout(5 * 60 * 1000);

  async function createDriver(extraArgs = []) {
    let chromePath = process.env.CHROME_PATH;
    if (!chromePath || chromePath.includes('.cache')) {
      const paths = [
        // Windows
        'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe',
        'C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe',
        // macOS
        '/Applications/Google Chrome Canary.app/Contents/MacOS/Google Chrome Canary',
        '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
      ];
      for (const p of paths) {
        if (fs.existsSync(p)) {
          chromePath = p;
          break;
        }
      }
    }

    const options = new chrome.Options();
    options.addArguments('--no-sandbox');
    options.addArguments(`--user-data-dir=${profilePath}`);
    // Enable the Policy Test Page feature
    options.addArguments('--enable-features=PolicyTestPage');
    
    extraArgs.forEach(arg => options.addArguments(arg));
    
    if (chromePath && fs.existsSync(chromePath)) {
      options.setChromeBinaryPath(chromePath);
    }

    const service = new chrome.ServiceBuilder()
      .loggingTo('chromedriver.log')
      .enableVerboseLogging();

    return await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .setChromeService(service)
      .build();
  }

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

  it('should inject policies via chrome://policy/test and reproduce bug', async function () {
    console.log('[INFO] Step 1: Setup policies via chrome://policy/test');
    driver = await createDriver();

    await driver.get('chrome://policy/test');
    await new Promise(r => setTimeout(r, 2000));
    await takeScreenshot('policy_test_page_initial.png');

    console.log('[INFO] Waiting for policy table to render...');
    await new Promise(r => setTimeout(r, 2000));
    
    console.log('[INFO] Injecting policies using JS (bypassing Shadow DOM if necessary)...');
    
    await driver.executeScript(`
      function getActiveRow() {
          const table = document.querySelector('policy-test-table');
          if (!table || !table.shadowRoot) return null;
          
          const rows = table.shadowRoot.querySelectorAll('policy-test-row');
          if (rows.length === 0) return null;
          
          // Use the last row as it's the newest empty one
          return rows[rows.length - 1];
      }

      function injectPolicy(name, value) {
          const row = getActiveRow();
          if (!row || !row.shadowRoot) return false;
          
          const nameInput = row.shadowRoot.querySelector('input.name');
          const valueInput = row.shadowRoot.querySelector('input.value');
          
          if (nameInput && valueInput) {
              nameInput.value = name;
              nameInput.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
              
              valueInput.value = value;
              valueInput.dispatchEvent(new Event('input', { bubbles: true, composed: true }));
              
              // The add button is outside the shadow root of the row, but inside the table
              const addBtn = document.querySelector('policy-test-table').shadowRoot.querySelector('#add-policy-btn');
              if (addBtn) {
                  addBtn.click();
                  return true;
              }
          }
          return false;
      }

      const success1 = injectPolicy('EnterpriseCustomLabelForBrowser', '"My Test Corp"');
      const success2 = injectPolicy('ShowHomeButton', 'true');
      
      if (!success1 || !success2) {
          throw new Error("Failed to find policy input elements in the DOM.");
      }

      // Check the Apply box, which is in the main document
      const applyCheckbox = document.getElementById('apply-policies');
      if (applyCheckbox && !applyCheckbox.checked) {
          applyCheckbox.click();
      }
    `);

    await new Promise(r => setTimeout(r, 2000));
    await driver.quit();
    driver = null;

    console.log('[INFO] Step 2: Restarting Chrome to verify managed state');
    driver = await createDriver();

    // Verify Managed state
    await driver.get('chrome://management/');
    await new Promise(r => setTimeout(r, 3000));
    await takeScreenshot('enterprise_mode_ui.png');

    // 4. Bug Reproduction
    console.log('[INFO] Opening a new tab...');
    await driver.switchTo().newWindow('tab');

    const targetUrl = 'https://www.google.com/';
    console.log(`[INFO] Navigating to: ${targetUrl}`);
    await driver.get(targetUrl);
    
    await new Promise(r => setTimeout(r, 3000));
    await takeScreenshot('bug_repro.png');

    const currentUrl = await driver.getCurrentUrl();
    expect(currentUrl).toMatch(/^https:\/\/www\.google\.com/);
  });
});
