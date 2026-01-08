#  Copyright 2025 Google LLC
#
#  Licensed under the Apache License, Version 2.0 (the "License");
#  you may not use this file except in compliance with the License.
#  You may obtain a copy of the License at
#
#      http://www.apache.org/licenses/LICENSE-2.0
#
#  Unless required by applicable law or agreed to in writing, software
#  distributed under the License is distributed on an "AS IS" BASIS,
#  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
#  See the License for the specific language governing permissions and
#  limitations under the License.

import logging
import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service

# The chrome and chromedriver installation can take some time.
# Give 5 minutes to install everything.
TIMEOUT = 5 * 60 * 1000


@pytest.fixture(scope="module")
def driver():
    # By default, the test uses the latest stable Chrome version.
    # Replace the "stable" with the specific browser version if needed,
    # e.g. 'canary', '115' or '144.0.7534.0' for example.
    browser_version = "stable"

    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.browser_version = browser_version

    service = Service(service_args=["--log-path=chromedriver.log", "--verbose"])

    driver = webdriver.Chrome(options=options, service=service)

    yield driver

    driver.quit()


@pytest.mark.timeout(TIMEOUT)
def test_should_be_able_to_navigate_to_google_com(driver):
    """This test is intended to verify the setup is correct."""
    driver.get("https://www.google.com")
    logging.info(driver.title)
    assert driver.title == "Google"


@pytest.mark.timeout(TIMEOUT)
def test_driver_should_not_crash_on_error(driver):
    """
    This test reproduces the bug where ChromeDriver crashes when any command returns an error.
    1. Navigate to a non-resolvable domain to intentionally trigger an error.
    2. After the error, attempt a basic driver command (get title).
    If the driver has crashed due to the previous error, this subsequent command will fail.
    The test is expected to fail if the bug is present.
    """
    try:
        driver.get("https://unresolvable")
    except Exception:
        # Expecting an error due to unresolvable domain, but ChromeDriver should not crash.
        pass

    # This command will fail if chromedriver has crashed after the previous error.
    # The expected behavior is that the driver remains responsive.
    driver.get("about:blank") # Navigate to a blank page to reset the state after the error
    assert driver.title == "" # Check if the driver is still responsive
