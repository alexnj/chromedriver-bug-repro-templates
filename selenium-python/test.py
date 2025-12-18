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
    browser_version = "143.0.7499.146"

    print(f"Using Selenium version: {selenium.__version__}")
    assert int(selenium.__version__.split('.')[0]) >= 4, "Selenium version 4 or above is required."

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
def test_shadow_dom_iframe_button_click(driver):
  driver.get(file_url)

  # The bug report states that finding elements inside a closed shadow root
  # and then interacting with an iframe within it causes a crash.
  # The current behavior (bug) is that a WebDriverException occurs when clicking
  # the button inside the iframe within the closed shadow root.

  try:
    shadow_host = driver.find_element(By.ID, 'shadow-host')
    shadow_root = shadow_host.shadow_root

    iframe = shadow_root.find_element(By.ID, 'nested-iframe')
    driver.switch_to.frame(iframe)
    button = driver.find_element(By.ID, 'alert-button')

    # This click is the problematic operation identified in the bug report (crbug.com/469831357)
    button.click()

    # If the click succeeds, we expect an alert.
    # If no exception is raised by the click, and no alert appears, the test should still fail.
    alert = driver.switch_to.alert
    alert_text = alert.text
    print(f"Alert text: {alert_text}")
    alert.accept()
    print("Alert accepted")
    pass

  except Exception as e:
    import traceback
    traceback.print_exc()
    pytest.fail(f"An unexpected exception occurred: {e}")