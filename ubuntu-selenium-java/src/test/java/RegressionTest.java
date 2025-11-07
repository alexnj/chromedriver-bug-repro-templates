/*
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

import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.By;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.WebElement;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeOptions;
import org.openqa.selenium.chrome.ChromeDriverService;
import org.openqa.selenium.support.ui.WebDriverWait;

import java.io.File;
import java.io.IOException;
import java.nio.file.Files;
import java.nio.file.Path;
import java.time.Duration;
import java.util.Comparator;
import java.util.HashMap;
import java.util.Map;

import static org.junit.jupiter.api.Assertions.assertEquals;
import static org.junit.jupiter.api.Assertions.assertTrue;

public class RegressionTest {

    private WebDriver driver;
    private Path downloadsFolder;
    private Path htmlFile;
    private final String downloadedFileName = "test-download.txt";

    @BeforeEach
    public void setUp() throws IOException {
        // Create a temporary directory for downloads
        downloadsFolder = Files.createTempDirectory("chromedriver-test-downloads-");

        // Create a local HTML file with a download link
        String htmlContent = "<!DOCTYPE html>"
                + "<html>"
                + "<head><title>Download Test</title></head>"
                + "<body>"
                + "<a id=\"downloadLink\" href=\"data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==\" download=\"" + downloadedFileName + "\">Download File</a>"
                + "</body>"
                + "</html>";
        htmlFile = Files.createTempFile("download-test-", ".html");
        Files.write(htmlFile, htmlContent.getBytes());

        ChromeOptions options = new ChromeOptions();
        options.addArguments("--headless");
        options.addArguments("--no-sandbox");

        // Set download preferences
        Map<String, Object> prefs = new HashMap<>();
        prefs.put("download.default_directory", downloadsFolder.toString());
        prefs.put("download.prompt_for_download", false);
        prefs.put("download.directory_upgrade", true);
        options.setExperimentalOption("prefs", prefs);

        ChromeDriverService service = new ChromeDriverService.Builder()
                .withLogFile(new File("chromedriver.log"))
                .withVerbose(true)
                .build();

        driver = new ChromeDriver(service, options);
    }

    @AfterEach
    public void tearDown() throws IOException {
        if (driver != null) {
            driver.quit();
        }
        // Clean up temporary files and directories
        if (downloadsFolder != null) {
            Files.walk(downloadsFolder)
                    .sorted(Comparator.reverseOrder())
                    .map(Path::toFile)
                    .forEach(File::delete);
        }
        if (htmlFile != null) {
            Files.deleteIfExists(htmlFile);
        }
    }

    @Test
    public void shouldBeAbleToNavigateToGoogle() {
        driver.get("https://www.google.com");
        assertEquals("Google", driver.getTitle());
    }

    @Test
    public void shouldDownloadFileWithoutPrompt() {
        File downloadedFile = new File(downloadsFolder.toFile(), downloadedFileName);

        // Navigate to the local HTML file
        driver.get(htmlFile.toUri().toString());

        // Click the download link
        WebElement downloadLink = driver.findElement(By.id("downloadLink"));
        downloadLink.click();

        // Wait for the file to appear in the downloads directory
        WebDriverWait wait = new WebDriverWait(driver, Duration.ofSeconds(10));
        wait.until(d -> downloadedFile.exists() && downloadedFile.length() > 0);

        // Verify the file exists and has content
        assertTrue(downloadedFile.exists());
        assertTrue(downloadedFile.length() > 0);
    }
}