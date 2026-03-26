// Copyright 2025 Google LLC
//
// Licensed under the Apache License, Version 2.0 (the "License");
// you may not use this file except in compliance with the License.
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
using System;
using System.IO;

namespace RegressionTest;

public class Tests
{
    [Test]
    public void BugReproduction496255939()
    {
        var options = new ChromeOptions();
        // The bug report notes the issue occurs on Windows, possibly in Enterprise environments.
        // It's also reported for Chrome version 146.x.
        // Running in non-headless mode to verify enterprise UI and bug manifestation.
        // options.AddArgument("--headless"); 
        options.AddArgument("--no-sandbox");
        
        // Use the system-installed Google Chrome found by CI
        var chromePath = Environment.GetEnvironmentVariable("CHROME_PATH");
        if (string.IsNullOrWhiteSpace(chromePath) || chromePath.Contains(".cache"))
        {
            chromePath = @"C:\Program Files\Google\Chrome\Application\chrome.exe";
            if (!File.Exists(chromePath))
            {
                chromePath = @"C:\Program Files (x86)\Google\Chrome\Application\chrome.exe";
            }
        }
        
        if (!File.Exists(chromePath))
        {
            Assert.Fail($"CRITICAL: System Google Chrome binary not found at: {chromePath}. Rejecting .cache fallback.");
        }

        // Set the binary explicitly
        options.BinaryLocation = chromePath;
        // Setting BrowserVersion to null should stop Selenium Manager from managing the browser
        options.BrowserVersion = null;

        Console.WriteLine($"[INFO] BinaryLocation set to: {options.BinaryLocation}");

        var service = ChromeDriverService.CreateDefaultService();
        service.LogPath = "d:\\chromedriver.log";
        service.EnableVerboseLogging = true;

        Console.WriteLine("[INFO] Starting ChromeDriver...");
        IWebDriver driver = new ChromeDriver(service, options);

        try
        {
            // Diagnostics: Full environment state
            driver.Navigate().GoToUrl("chrome://version/");
            System.Threading.Thread.Sleep(3000);
            ((ITakesScreenshot)driver).GetScreenshot().SaveAsFile("chrome_version.png");

            // Diagnostics: Capture exactly which policies are active
            driver.Navigate().GoToUrl("chrome://policy/");
            System.Threading.Thread.Sleep(3000);
            ((ITakesScreenshot)driver).GetScreenshot().SaveAsFile("active_policies.png");

            // Capture proof of Enterprise mode
            driver.Navigate().GoToUrl("chrome://management/");
            System.Threading.Thread.Sleep(3000);
            ((ITakesScreenshot)driver).GetScreenshot().SaveAsFile("enterprise_mode.png");

            // Bug: Web pages incorrectly display in a small frame on the home page,
            // and the URL in the address bar remains unchanged from the home page URL.
            string targetUrl = "https://www.google.com/";
            driver.Navigate().GoToUrl(targetUrl);

            // Wait a moment for rendering (generic wait for simplicity in repro)
            System.Threading.Thread.Sleep(2000);

            // Take a screenshot of the reproduction state
            Screenshot bugReproScreenshot = ((ITakesScreenshot)driver).GetScreenshot();
            bugReproScreenshot.SaveAsFile("bug_repro.png");

            string currentUrl = driver.Url;

            // If the bug exists, currentUrl might still be "chrome://new-tab-page/" or similar.
            // We assert that the URL has successfully changed to the target URL.
            Assert.That(currentUrl, Does.StartWith("https://www.google.com"), 
                "The URL should update to the target URL and not remain on the home page.");

            // Additionally, check if we can interact with an element to ensure it's not just a frame.
            var body = driver.FindElement(By.TagName("body"));
            Assert.That(body.Displayed, Is.True, "The page body should be displayed properly.");
        }
        finally
        {
            driver.Quit();
        }
    }
}
