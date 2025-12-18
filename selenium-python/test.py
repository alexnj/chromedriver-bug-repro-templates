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
import os
import pytest
import selenium
import time

from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service
from selenium.webdriver.common.by import By
from selenium.common.exceptions import NoSuchElementException, WebDriverException

# The chrome and chromedriver installation can take some time.
# Give 5 minutes to install everything.
TIMEOUT = 5 * 60 * 1000

# Get the directory of the current file
current_dir = os.path.dirname(os.path.abspath(__file__))

# Construct the path to test.html
html_path = os.path.join(current_dir, 'test.html')
file_url = f'file://{html_path}'

@pytest.fixture(scope="module")
def driver():
    # By default, the test uses the latest stable Chrome version.
    # Replace the "stable" with the specific browser version if needed,
    # e.g. 'canary', '115' or '144.0.7534.0' for example.
    browser_version = "stable"

    print(f"Using Selenium version: {selenium.__version__}")
    assert int(selenium.__version__.split('.')[0]) >= 4, "Selenium version 4 or above is required."

    options = Options()
    # options.add_argument("--headless")
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
def test_shadow_dom_iframe_button_click(driver):
  driver.get(file_url)

  # The bug report states that finding elements inside a closed shadow root
  # and then interacting with an iframe within it causes a crash.
  # This test expects an exception because the shadow root is 'closed'.
  # According to WebDriver specification, closed shadow roots are not accessible.
  # The current behavior (bug) is that a WebDriverException occurs when clicking
  # the button inside the iframe within the closed shadow root.

  try:
    shadow_host = driver.find_element(By.ID, 'shadow-host')
    # Attempting to access shadow_root of a closed shadow host.
    # This is expected to fail or return None/raise an exception based on Selenium's implementation
    # when dealing with closed shadow roots.
    shadow_root = shadow_host.shadow_root

    # If we reach here, it means shadow_root was accessible (contrary to spec for 'closed' mode),
    # or Selenium's API for shadow_root doesn't immediately raise an error.
    # The actual bug should manifest when interacting with elements inside the iframe.
    iframe = shadow_root.find_element(By.ID, 'nested-iframe')
    driver.switch_to.frame(iframe)
    button = driver.find_element(By.ID, 'alert-button')

    # This click is the problematic operation identified in the bug report (crbug.com/469831357)
    # It's expected to raise an exception like 'unknown error: no element reference returned by script'
    # or similar WebDriverException due to the closed shadow root context.
    button.click()

    # If the click succeeds, we expect an alert.
    # If no exception is raised by the click, and no alert appears, the test should still fail.
    alert = driver.switch_to.alert
    alert_text = alert.text
    print(f"Alert text: {alert_text}")
    alert.accept()
    print("Alert accepted")

    # We shouldn't reach here, as closed shadow roots are not supposed to be accessible.
    pytest.fail("Expected WebDriverException or similar error, but button click succeeded and alert appeared.")

  except WebDriverException as e:
    # The specific error is "unknown error: no element reference returned by script".
    # We assert that the type of exception is WebDriverException, which is the expected behavior.
    print(f"Caught expected WebDriverException: {e}")
    assert "no element reference returned by script" in str(e) or "could not be scrolled into view" in str(e) or "Element is not clickable" in str(e)

    # Ensure that ChromeDriver isn't crashed with additional queries on the current page, and
    # a subsequent navigation.
    assert driver.title == "Shadow DOM + Iframe Test"

    driver.get("https://www.google.com")
    assert driver.title == "Google"

    # The test passes if the expected WebDriverException is caught.
    pass

  except Exception as e:
    # Catch any other unexpected exceptions and fail the test.
    pytest.fail(f"An unexpected exception occurred: {e}")