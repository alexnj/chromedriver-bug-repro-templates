# Template for Windows, Selenium, C#

This repository provides a template for reproducing any ChromeDriver bug.

## Steps to Reproduce

The test in `RegressionTest.cs` follows these steps:

1.  Initializes a new Chrome browser session in headless mode with a custom download path.
2.  Creates a temporary HTML file with a download link.
3.  Navigates to google.com and asserts the title.
4.  Navigates to the local HTML file.
5.  Clicks a download link.
6.  Waits for the file to be downloaded and asserts its existence and size.

This sequence of actions fails with ChromeDriver 126, but works with 125.

## Running the Tests

1.  Install dependencies and run the tests:
    ```bash
    dotnet test
    ```

## GitHub Actions

The included GitHub Actions workflow in `.github/workflows/windows-selenium-csharp.yml` will automatically run the tests on every push and pull request.
