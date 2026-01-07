module.exports = {
  src_folders: ['test.js'],
  test_settings: {
    default: {
      launch_url: 'http://localhost:3000',
      webdriver: {
        start_process: true,
        port: 9515, // Default ChromeDriver port
        server_path: require('chromedriver').path,
        cli_args: [
          '--silent'
        ]
      },
      desiredCapabilities: {
        browserName: 'chrome',
        chromeOptions: {
          args: [
            // '--headless' // Uncomment for headless mode
          ]
        }
      }
    }
  }
};