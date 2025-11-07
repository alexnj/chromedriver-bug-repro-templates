# Template for Windows, Selenium, C#

This repository provides a template for reproducing any ChromeDriver bug.

## Steps to Reproduce

The test in `RegressionTest.cs` follows these steps:

1.  Initializes a new Chrome browser session.
2.  Navigates to a URL.
3.  Asserts that the page title is correct.

This sequence of actions fails with ChromeDriver 126, but works with 125.

## Running the Tests

1.  Install dependencies and run the tests:
    ```bash
    dotnet test
    ```

## GitHub Actions

The included GitHub Actions workflow in `.github/workflows/windows-selenium-csharp.yml` will automatically run the tests on every push and pull request.
