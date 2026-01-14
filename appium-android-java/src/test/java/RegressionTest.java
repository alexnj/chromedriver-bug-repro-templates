/*
 * Copyright 2026 Google LLC
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
import static org.junit.jupiter.api.Assertions.assertTrue;

import com.google.common.base.Stopwatch;
import io.appium.java_client.android.AndroidDriver;
import io.appium.java_client.android.options.UiAutomator2Options;
import java.io.File;
import java.net.MalformedURLException;
import java.net.URL;
import java.time.Duration;
import java.util.Set;
import java.util.concurrent.TimeUnit;
import org.junit.jupiter.api.AfterEach;
import org.junit.jupiter.api.BeforeEach;
import org.junit.jupiter.api.Test;
import org.openqa.selenium.support.ui.FluentWait;

public class RegressionTest {

  private AndroidDriver driver;

  @BeforeEach
  public void setUp() throws MalformedURLException {
    // Get the absolute path of the APK file.
    final File app = new File("app-debug.apk");
    assertTrue(
        app.exists(),
        "app-debug.apk not found. Please run `curl -L -o app-debug.apk https://github.com/alexnj/android-webviews/actions/runs/1006264718/artifacts/5131007856` to download it.");

    // Configure UiAutomator2Options for Appium to automate the app.
    UiAutomator2Options options =
        new UiAutomator2Options()
            .setPlatformName("Android")
            .setDeviceName("Android Emulator")
            .setAutomationName("UiAutomator2")
            // Set the app capability to the absolute path of the APK.
            .setApp(app.getAbsolutePath())
            .setNoReset(true)
            .setUiautomator2ServerInstallTimeout(java.time.Duration.ofMillis(60000));

    // Initialize AndroidDriver, connecting to the Appium server (usually http://127.0.0.1:4723)
    driver = new AndroidDriver(new URL("http://127.0.0.1:4723"), options);
    driver.manage().timeouts().implicitlyWait(java.time.Duration.ofSeconds(30));
  }

  @AfterEach
  public void tearDown() {
    if (driver != null) {
      driver.quit();
    }
  }

  @Test
  public void verifyWebViewUrl_shouldBeExampleCom() {
    // The app takes a while to load the webview, so retry switching to the webview context for
    // up to 20 seconds.
    final FluentWait<AndroidDriver> wait =
        new FluentWait<>(driver)
            .withTimeout(Duration.ofSeconds(20))
            .pollingEvery(Duration.ofSeconds(1))
            .ignoring(Exception.class);

    final Stopwatch stopwatch = Stopwatch.createStarted();
    wait.until(
        d -> {
          final Set<String> contexts = d.getContextHandles();
          System.out.printf(
              "[%ss] Available contexts: %s%n",
              stopwatch.elapsed(TimeUnit.SECONDS), contexts.toString());
          for (String context : contexts) {
            if (context.startsWith("WEBVIEW")) {
              d.context(context);
              return true;
            }
          }
          return false;
        });

    // Assert that the URL is https://example.com/
    assertEquals("https://example.com/", driver.getCurrentUrl());
  }
}
