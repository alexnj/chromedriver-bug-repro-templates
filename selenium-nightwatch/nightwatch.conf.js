module.exports = {
  src_folders: ['test.js'],
  globals_path: 'globals.js',

  test_settings: {
    default: {
      launch_url: 'http://127.0.0.1:8080',
      webdriver: {
        start_process: true,
        port: 9515, // Default ChromeDriver port
        server_path: require('chromedriver').path,
        cli_args: [
          '--verbose',
          '--log-path=chromedriver.log'
        ],
      },
      desiredCapabilities: {
        browserName: 'chrome',
        chromeOptions: {
          args: [
            '--headless',
            '--no-sandbox'
          ]
        }
      }
    }
  }
};