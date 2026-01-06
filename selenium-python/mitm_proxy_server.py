
import asyncio
import logging

from mitmproxy import http, options
from mitmproxy.tools.dump import DumpMaster

PORT = 8080

# Configure logging for better visibility
# Create a logger
logger = logging.getLogger()
logger.setLevel(logging.INFO) # Set the minimum logging level

# Formatter for log messages
formatter = logging.Formatter('%(asctime)s - %(levelname)s - %(message)s')

# File handler for INFO and above (stdout equivalent)
info_file_handler = logging.FileHandler('mitm_proxy_server_stdout.log')
info_file_handler.setLevel(logging.INFO)
info_file_handler.setFormatter(formatter)
logger.addHandler(info_file_handler)

# File handler for ERROR and above (stderr equivalent)
error_file_handler = logging.FileHandler('mitm_proxy_server_stderr.log')
error_file_handler.setLevel(logging.ERROR)
error_file_handler.setFormatter(formatter)
logger.addHandler(error_file_handler)

class SimpleHTTPLogger:
    """
    A mitmproxy addon that logs intercepted HTTP requests and responses.
    """
    def request(self, flow: http.HTTPFlow):
        """
        This method is called for every HTTP request passing through the proxy.
        It logs the URL of the intercepted request.
        """
        logging.info(f"Intercepted request to: {flow.request.method} {flow.request.url}")

    def response(self, flow: http.HTTPFlow):
        """
        This method is called for every HTTP response passing through the proxy.
        It logs the status code and the URL of the request associated with the response.
        """
        logging.info(f"Intercepted response from: {flow.request.url} with status {flow.response.status_code}")

async def start_mitm_proxy():
    """
    Configures and starts the mitmproxy server programmatically.
    It sets up the proxy to listen on a specific host and port, and adds our
    custom logging addon.
    """
    # Configure mitmproxy options:
    # listen_host: The IP address the proxy will listen on. '127.0.0.1' means localhost.
    # listen_port: The port the proxy will listen on. 8080 is used for consistency.
    opts = options.Options(listen_host="127.0.0.1", listen_port=PORT)

    # Create a DumpMaster instance, which is the core of mitmproxy's scripting.
    # It manages the proxy server and addon lifecycle.
    master = DumpMaster(opts)

    # Add our custom addon to the proxy.
    master.addons.add(SimpleHTTPLogger())

    logging.info(f"Starting mitmproxy on {opts.listen_host}:{opts.listen_port}")
    logging.info("Configure your client (browser/application) to use this proxy.")
    logging.info("Press Ctrl+C to stop the proxy (if running interactively).")

    try:
        # Run the mitmproxy event loop. This is an asynchronous call.
        await master.run()
    except Exception as e:
        logging.error(f"An error occurred in mitmproxy: {e}")
    finally:
        logging.info("Mitmproxy stopped.")

if __name__ == "__main__":
    # When the script is executed, run the asynchronous start_mitm_proxy function.
    asyncio.run(start_mitm_proxy())
