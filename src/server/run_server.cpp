#include "run_server.hpp"
#include "./create_websocket.hpp"
#include "./AsyncFileReader.hpp"
#include "./AsyncFileStreamer.hpp"
#include <stdio.h>

void run_server(const int port, const char* static_filepath, PacketHandlerFactory* factory) {
    AsyncFileStreamer async_file_streamer(static_filepath);

    auto websocket = create_websocket(factory);

    // Webserver
	auto app = uWS::App();
    app.get("/", [&async_file_streamer](auto *res, auto *req) {
        async_file_streamer.streamFile(res, "/index.html");
    });
    app.get("/*", [&async_file_streamer](auto *res, auto* req) {
        async_file_streamer.streamFile(res, req->getUrl());
    });
    app.ws("/websocket", std::move(websocket));
    app.listen(port, [port, static_filepath](auto *token) {
        if (token) {
            printf("Serving '%s' on http://localhost:%d\n", static_filepath, port);
        }
    });
    app.run();
}