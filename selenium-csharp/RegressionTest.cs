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
        // For reproduction, we use standard options but verify that navigation actually occurs.
        options.AddArgument("--headless");
        options.AddArgument("--no-sandbox");
        options.BrowserVersion = "stable";

        var service = ChromeDriverService.CreateDefaultService();
        service.LogPath = "chromedriver.log";
        service.EnableVerboseLogging = true;

        IWebDriver driver = new ChromeDriver(service, options);

        try
        {
            // Bug: Web pages incorrectly display in a small frame on the home page,
            // and the URL in the address bar remains unchanged from the home page URL.
            string targetUrl = "https://www.google.com/";
            driver.Navigate().GoToUrl(targetUrl);

            // Wait a moment for rendering (generic wait for simplicity in repro)
            System.Threading.Thread.Sleep(2000);

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
