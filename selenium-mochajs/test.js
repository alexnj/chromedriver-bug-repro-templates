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

const { Builder, By, until } = require('selenium-webdriver');
const { expect } = require('expect');
const chrome = require('selenium-webdriver/chrome');
const connect = require('connect');
const serveStatic = require('serve-static');
const http = require('http');

describe('Selenium ChromeDriver', function () {
  let driver;
  let server;
  // The chrome and chromedriver installation can take some time. 
  // Give 5 minutes to install everything.
  this.timeout(5 * 60 * 1000);

  beforeEach(async function () {
    const app = connect().use(serveStatic(__dirname));
    server = http.createServer(app).listen(0);

    const options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');

    // By default, the test uses the latest stable Chrome version.
    // Replace the "stable" with the specific browser version if needed,
    // e.g. 'canary', '115' or '144.0.7534.0' for example.
    options.setBrowserVersion('141.0.7390.65');

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
    await driver.quit();
    server.close();
  });

  /**
   * This test is intended to verify the setup is correct.
   */
  it('should be able to navigate to google.com', async function () {
    await driver.get('https://www.google.com');
    const title = await driver.getTitle();
    expect(title).toBe('Google');
  });

  it('should reproduce issue with back navigations from prerendered pages', async function () {
    // This test reproduces a bug where back navigations from prerendered pages
    // cause the execution context to be lost. The subsequent command after
    // navigating back is expected to fail with a "no such execution context"
    // error.
    const port = server.address().port;
    await driver.get(`http://localhost:${port}/test.html`);
    await driver.wait(until.titleIs('Test'), 1000);

    let link = await driver.findElement(By.css('a[href="prerender.html"]'));
    await link.click();
    await driver.wait(until.titleIs('Prerendered'), 1000);

    await driver.navigate().back();

    // The following command is expected to fail.
    const title = await driver.getTitle();
    // The test will fail before this assertion.
    // The expected title is an empty string because test.html has no title.
    expect(title).toBe('');
  });
});
