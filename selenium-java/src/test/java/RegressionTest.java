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

import static org.junit.jupiter.api.Assertions.assertEquals;

import com.sun.net.httpserver.HttpExchange;
import com.sun.net.httpserver.HttpHandler;
import com.sun.net.httpserver.HttpServer;
import java.io.IOException;
import java.io.OutputStream;
import java.net.InetSocketAddress;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.WebDriver;
import org.openqa.selenium.chrome.ChromeDriver;
import org.openqa.selenium.chrome.ChromeDriverService;
import org.openqa.selenium.chrome.ChromeOptions;

public class RegressionTest {

  private WebDriver driver;
  private HttpServer server;

  @BeforeEach
  public void setUp() throws IOException {
    server = HttpServer.create(new InetSocketAddress(8000), 0);
    String page2Content =
        "<!DOCTYPE html><html><head><title>Page 2</title></head><body><button id='close' onclick='window.close()'>Close tab</button></body></html>";
    String page1Content =
        "<!DOCTYPE html><html><head><title>Page 1</title></head><body><a href='http://localhost:8000/page2' target='_blank' id='open'>Open tab</a></body></html>";
    server.createContext(
        "/page1",
        (exchange -> {
          exchange.sendResponseHeaders(200, page1Content.getBytes().length);
          OutputStream os = exchange.getResponseBody();
          os.write(page1Content.getBytes());
          os.close();
        }));
    server.createContext(
        "/page2",
        (exchange -> {
          exchange.sendResponseHeaders(200, page2Content.getBytes().length);
          OutputStream os = exchange.getResponseBody();
          os.write(page2Content.getBytes());
          os.close();
        }));
    server.setExecutor(null);
    server.start();

    ChromeOptions options = new ChromeOptions();
    options.addArguments("--headless");
    options.addArguments("--no-sandbox");

    // By default, the test uses the latest stable Chrome version.
    // Replace the "stable" with the specific browser version if needed,
    // e.g. 'canary', '115' or '144.0.7534.0' for example.
    options.setBrowserVersion("139");

    ChromeDriverService service =
        new ChromeDriverService.Builder()
            .withLogFile(new java.io.File("chromedriver.log"))
            .withVerbose(true)
            .build();

    driver = new ChromeDriver(service, options);
  }

  @AfterEach
  public void tearDown() {
    if (driver != null) {
      driver.quit();
    }
    if (server != null) {
      server.stop(0);
    }
  }

  @Test
  public void openAndCloseTabAndGetCurrentUrl() {
    // This test creates a page with a link that opens a new tab.
    // The new tab has a button that closes it.
    //
    // The test clicks the link, then the button, and then tries to get the URL
    // of the original tab.
    driver.get("http://localhost:8000/page1");

    String originalWindow = driver.getWindowHandle();
    driver.findElement(org.openqa.selenium.By.id("open")).click();

    // Wait for the new window or tab
    new org.openqa.selenium.support.ui.WebDriverWait(driver, java.time.Duration.ofSeconds(2))
        .until(d -> d.getWindowHandles().size() > 1);

    for (String windowHandle : driver.getWindowHandles()) {
      if (!originalWindow.contentEquals(windowHandle)) {
        driver.switchTo().window(windowHandle);
        break;
      }
    }

    driver.findElement(org.openqa.selenium.By.id("close")).click();

    // Switch to first tab.
    driver.switchTo().window(originalWindow);

    assertEquals("http://localhost:8000/page1", driver.getCurrentUrl());
  }
}
