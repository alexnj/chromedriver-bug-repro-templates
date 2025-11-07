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
const { expect } = require('chai');
const chrome = require('selenium-webdriver/chrome');
const fs = require('fs').promises;
const path = require('path');
const os = require('os');

describe('ChromeDriver Network Conditions Regression', function() {
  this.timeout(30000);
  let driver;
  let downloadsFolderPath;
  let htmlFilePath;
  const downloadedFileName = 'test-download.txt';

  before(async function() {
    // Create a temporary directory for downloads
    downloadsFolderPath = path.join(os.tmpdir(), `chromedriver-test-downloads-${Date.now()}`);
    await fs.mkdir(downloadsFolderPath, { recursive: true });

    // Create a local HTML file with a download link
    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Download Test</title>
      </head>
      <body>
        <a id="downloadLink" href="data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==" download="${downloadedFileName}">Download File</a>
      </body>
      </html>
    `;
    htmlFilePath = path.join(os.tmpdir(), `download-test-${Date.now()}.html`);
    await fs.writeFile(htmlFilePath, htmlContent);

    let options = new chrome.Options();
    options.addArguments('--headless');
    options.addArguments('--no-sandbox');
    // Set download preferences
    options.setUserPreferences({
      download: {
        prompt_for_download: false,
        directory_upgrade: true,
        default_directory: downloadsFolderPath,
      },
    });

    let service = new chrome.ServiceBuilder()
        .loggingTo('chromedriver.log')
        .enableVerboseLogging();

    driver = await new Builder()
        .forBrowser('chrome')
        .setChromeOptions(options)
        .setChromeService(service)
        .build();
  });

  after(async function() {
    await driver.quit();
    // Clean up temporary files and directories
    if (downloadsFolderPath) {
      await fs.rm(downloadsFolderPath, { recursive: true, force: true });
    }
    if (htmlFilePath) {
      await fs.unlink(htmlFilePath);
    }
  });

  it('should be able to navigate to google.com', async function() {
    await driver.get('https://www.google.com');
    const title = await driver.getTitle();
    expect(title).to.equal('Google');
  });

  it('should download a file without prompting in new headless mode', async function() {
    const downloadedFilePath = path.join(downloadsFolderPath, downloadedFileName);

    // Navigate to the local HTML file
    await driver.get(`file://${htmlFilePath}`);

    // Click the download link
    const downloadLink = await driver.findElement(By.id('downloadLink'));
    await downloadLink.click();

    // Wait for the file to appear in the downloads directory
    // This is a heuristic; a more robust solution might involve polling or
    // using a file system watcher, but for a test, a short wait is often sufficient.
    await driver.wait(async () => {
      try {
        await fs.access(downloadedFilePath);
        return true;
      } catch (error) {
        return false;
      }
    }, 10000, 'Expected file to be downloaded within 10 seconds');

    // Verify the file exists
    const fileStats = await fs.stat(downloadedFilePath);
    expect(fileStats.isFile()).to.be.true;
    expect(fileStats.size).to.be.greaterThan(0);
  });
});
