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

const { Builder } = require('selenium-webdriver');
const { expect } = require('expect');
const chrome = require('selenium-webdriver/chrome');

describe('Selenium ChromeDriver', function () {
  let driver;
  // The chrome and chromedriver installation can take some time.
  // Give 5 minutes to install everything.
  this.timeout(5 * 60 * 1000);

  afterEach(async function () {
    if (driver) {
      await driver.quit();
    }
  });

  /**
   * This test tries to open a second browser window when one is already open.
   * Based on the bug report, this should fail.
   * The test is written to expect success, so it will fail if the bug is present.
   */
  it('should be able to create two Chrome instances', async function () {
    const options = new chrome.Options();
    options.addArguments('--no-sandbox');
    // From the bug report, this flag seems to trigger the issue.
    options.addArguments('--remote-debugging-port=0');
    options.setBrowserVersion('143.0.7499.40');

    const service = new chrome.ServiceBuilder()
      .loggingTo('chromedriver.log')
      .enableVerboseLogging();

    // First driver instance
    driver = await new Builder()
      .forBrowser('chrome')
      .setChromeOptions(options)
      .setChromeService(service)
      .build();
    await driver.get('https://www.google.com');
    expect(await driver.getTitle()).toBe('Google');

    // Second driver instance, this is expected to fail with the bug.
    let driver2;
    try {
      driver2 = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .setChromeService(service)
        .build();
      await driver2.get('https://www.bing.com');
      expect(await driver2.getTitle()).toContain('Bing');
    } finally {
      if (driver2) {
        await driver2.quit();
      }
    }
  });
});
