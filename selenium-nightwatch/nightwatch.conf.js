const http = require('http');
const fs =require('fs');
const path = require('path');

let server;

module.exports = {
  src_folders: ['test.js'],

  before: function(done) {
    server = http.createServer((req, res) => {
      fs.readFile(path.join(__dirname, 'index.html'), (err, content) => {
        if (err) {
          res.writeHead(500);
          res.end('Error loading index.html');
          return;
        }
        res.writeHead(200, { 'Content-Type': 'text/html' });
        res.end(content);
      });
    }).listen(8080, '127.0.0.1', () => {
      console.log('Server started on port 8080');
      done();
    });
  },

  after: function(done) {
    server.close(() => {
      console.log('Server stopped');
      done();
    });
  },

  test_settings: {
    default: {
      launch_url: 'http://127.0.0.1:8080',
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
            '--headless' // Uncomment for headless mode
          ]
        }
      }
    }
  }
};