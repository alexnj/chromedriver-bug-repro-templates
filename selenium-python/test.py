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
import subprocess
import sys
import time

import pytest
from selenium import webdriver
from selenium.webdriver.chrome.options import Options
from selenium.webdriver.chrome.service import Service

# The chrome and chromedriver installation can take some time.
# Give 5 minutes to install everything.
TIMEOUT = 5 * 60 * 1000


@pytest.fixture(scope="module")
def proxy_server():
    """Starts and stops the proxy server."""
    mitm_proxy_server_path = os.path.abspath(
        os.path.join(os.path.dirname(__file__), "mitm_proxy_server.py")
    )
    proxy_process = subprocess.Popen(
        [sys.executable, mitm_proxy_server_path],
        stdout=subprocess.PIPE,
        stderr=subprocess.PIPE,
    )

    # Wait for proxy to be ready.
    time.sleep(2)

    yield

    proxy_process.terminate()
    proxy_process.wait()

    # Capture and print proxy server's stdout and stderr
    proxy_stdout = proxy_process.stdout.read().decode('utf-8')
    proxy_stderr = proxy_process.stderr.read().decode('utf-8')

    if proxy_stdout:
        sys.stdout.write("\n--- Proxy Server STDOUT ---\n")
        sys.stdout.write(proxy_stdout)
        sys.stdout.write("\n---------------------------\n")
    if proxy_stderr:
        sys.stderr.write("\n--- Proxy Server STDERR ---\n")
        sys.stderr.write(proxy_stderr)
        sys.stderr.write("\n---------------------------\n")


@pytest.fixture(scope="module")
def driver_with_proxy(proxy_server):
    # By default, the test uses the latest stable Chrome version.
    # Replace the "stable" with the specific browser version if needed,
    # e.g. 'canary', '115' or '144.0.7534.0' for example.
    browser_version = "stable"

    options = Options()
    options.add_argument("--headless")
    options.add_argument("--no-sandbox")
    options.browser_version = browser_version

    """This driver is configured to use a proxy."""
    options.add_argument('--proxy-server=http://localhost:8080')

    service = Service(service_args=["--log-path=chromedriver.log", "--verbose"])
    driver = webdriver.Chrome(options=options, service=service)

    yield driver

    driver.quit()


@pytest.mark.timeout(TIMEOUT)
def test_issue_reproduction(driver_with_proxy):
    """
    This test attempts to reproduce an issue where the connection is refused
    when a proxy is used. It is expected to fail with a WebDriverException.
    """
    driver_with_proxy.get("http://httpbin.org")
    logging.info(driver_with_proxy.title)
    assert driver_with_proxy.title == "httpbin.org"
