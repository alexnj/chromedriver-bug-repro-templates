// Copyright 2025 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
// You may not use this file except in compliance with the License.
// You may obtain a copy of the License at
//
//     http://www.apache.org/licenses/LICENSE-2.0
//
// Unless required by applicable law or agreed to in writing, software
// distributed under the License is distributed on an "AS IS" BASIS,
// WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
// See the License for the specific language governing permissions and
// limitations under the License.

using NUnit.Framework;
using OpenQA.Selenium;
using OpenQA.Selenium.Chrome;
using OpenQA.Selenium.Support.UI;
using System;
using System.IO;
using System.Threading;

namespace RegressionTest;

public class Tests
{
    private IWebDriver driver;
    private string downloadsFolderPath;
    private string htmlFilePath;
    private const string DownloadedFileName = "test-download.txt";

    [SetUp]
    public void SetUp()
    {
        // Create a temporary directory for downloads
        downloadsFolderPath = Path.Combine(Path.GetTempPath(), $"chromedriver-test-downloads-{DateTime.Now.Ticks}");
        Directory.CreateDirectory(downloadsFolderPath);

        // Create a local HTML file with a download link
        var htmlContent = $@"
            <!DOCTYPE html>
            <html>
            <head>
                <title>Download Test</title>
            </head>
            <body>
                <a id=""downloadLink"" href=""data:text/plain;base64,SGVsbG8sIFdvcmxkIQ=="" download=""{DownloadedFileName}"">Download File</a>
            </body>
            </html>";
        htmlFilePath = Path.Combine(Path.GetTempPath(), $"download-test-{DateTime.Now.Ticks}.html");
        File.WriteAllText(htmlFilePath, htmlContent);

        var options = new ChromeOptions();
        options.AddArgument("--headless");
        options.AddArgument("--no-sandbox");

        // Set download preferences
        options.AddUserProfilePreference("download.default_directory", downloadsFolderPath);
        options.AddUserProfilePreference("download.prompt_for_download", false);
        options.AddUserProfilePreference("directory_upgrade", true);

        var service = ChromeDriverService.CreateDefaultService();
        service.LogPath = "chromedriver.log";
        service.EnableVerboseLogging = true;

        driver = new ChromeDriver(service, options);
    }

    [TearDown]
    public void TearDown()
    {
        driver.Quit();
        // Clean up temporary files and directories
        if (Directory.Exists(downloadsFolderPath))
        {
            Directory.Delete(downloadsFolderPath, true);
        }
        if (File.Exists(htmlFilePath))
        {
            File.Delete(htmlFilePath);
        }
    }

    [Test]
    public void ShouldBeAbleToNavigateToGoogle()
    {
        driver.Navigate().GoToUrl("https://www.google.com");
        Assert.That(driver.Title, Is.EqualTo("Google"));
    }

    [Test]
    public void ShouldDownloadFileWithoutPrompt()
    {
        var downloadedFilePath = Path.Combine(downloadsFolderPath, DownloadedFileName);

        // Navigate to the local HTML file
        driver.Navigate().GoToUrl($"file:///{{htmlFilePath.Replace('\', '/')}}");

        // Click the download link
        var downloadLink = driver.FindElement(By.Id("downloadLink"));
        downloadLink.Click();

        // Wait for the file to appear in the downloads directory
        var wait = new WebDriverWait(driver, TimeSpan.FromSeconds(10));
        wait.Until(d => File.Exists(downloadedFilePath) && new FileInfo(downloadedFilePath).Length > 0);

        // Verify the file exists and has content
        Assert.That(File.Exists(downloadedFilePath), Is.True);
        Assert.That(new FileInfo(downloadedFilePath).Length, Is.GreaterThan(0));
    }
}