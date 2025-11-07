# Copyright 2025 Google LLC
#
# Licensed under the Apache License, Version 2.0 (the "License");
# you may not use this file except in compliance with the License.
# You may obtain a copy of the License at
#
#     http://www.apache.org/licenses/LICENSE-2.0
#
# Unless required by applicable law or agreed to in writing, software
# distributed under the License is distributed on an "AS IS" BASIS,
# WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
# See the License for the specific language governing permissions and
# limitations under the License.

require 'selenium-webdriver'
require 'rspec'
require 'tmpdir'
require 'fileutils'

RSpec.describe 'ChromeDriver Download Regression' do
  let(:downloads_folder) { Dir.mktmpdir('chromedriver-test-downloads-') }
  let(:downloaded_file_name) { 'test-download.txt' }
  let(:downloaded_file_path) { File.join(downloads_folder, downloaded_file_name) }
  let(:html_file) do
    Tempfile.new(['download-test-', '.html']).tap do |file|
      file.write(<<~HTML)
        <!DOCTYPE html>
        <html>
        <head>
          <title>Download Test</title>
        </head>
        <body>
          <a id="downloadLink" href="data:text/plain;base64,SGVsbG8sIFdvcmxkIQ==" download="#{downloaded_file_name}">Download File</a>
        </body>
        </html>
      HTML
      file.close
    end
  end
  let(:driver) do
    options = Selenium::WebDriver::Options.chrome
    options.add_argument('--headless')
    options.add_argument('--no-sandbox')
    options.add_preference(:download,
                           prompt_for_download: false,
                           default_directory: downloads_folder,
                           directory_upgrade: true)

    service = Selenium::WebDriver::Service.chrome(args: ['--verbose', '--log-path=chromedriver.log'])
    Selenium::WebDriver.for :chrome, options: options, service: service
  end

  after do
    driver.quit if driver
    FileUtils.remove_entry(downloads_folder) if Dir.exist?(downloads_folder)
    html_file.unlink if html_file
  end

  it 'should be able to navigate to google.com' do
    driver.navigate.to 'https://www.google.com'
    expect(driver.title).to eq('Google')
  end

  it 'should download a file without prompting in new headless mode' do
    # Navigate to the local HTML file
    driver.navigate.to "file://#{html_file.path}"

    # Click the download link
    download_link = driver.find_element(id: 'downloadLink')
    download_link.click

    # Wait for the file to appear in the downloads directory
    wait = Selenium::WebDriver::Wait.new(timeout: 10)
    wait.until { File.exist?(downloaded_file_path) && File.size(downloaded_file_path) > 0 }

    # Verify the file exists and has content
    expect(File.exist?(downloaded_file_path)).to be true
    expect(File.size(downloaded_file_path)).to be > 0
  end
end