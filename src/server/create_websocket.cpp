#include "create_websocket.hpp"

uWS::App::WebSocketBehavior<std::unique_ptr<PacketHandler>> create_websocket(PacketHandlerFactory* factory) {
    uWS::App::WebSocketBehavior<std::unique_ptr<PacketHandler>> websocket;
    websocket.compression = uWS::CompressOptions::DISABLED;
    websocket.maxPayloadLength = 16*1024;
    websocket.idleTimeout = 120;
    websocket.maxBackpressure = 64*1024;
    websocket.upgrade = [factory](auto *res, auto *req, auto *context) {
        res->upgrade(
            factory->create_handler(),
            req->getHeader("sec-websocket-key"),
            req->getHeader("sec-websocket-protocol"),
            req->getHeader("sec-websocket-extensions"),
            context
        );
    };
    websocket.open = [](auto *ws) {
        auto* handler = ws->getUserData()->get();
    };
    websocket.message = [](auto *ws, std::string_view message, uWS::OpCode opCode) {
        if (opCode != uWS::BINARY) {
            return;
        }

        auto* handler = ws->getUserData()->get();
        auto buf = tcb::span<const uint8_t>(
            reinterpret_cast<const uint8_t*>(message.data()), 
            message.size()
        );

        auto res = handler->on_packet(buf);
        if (res.size() > 0) {
            auto res_view = std::string_view(
                reinterpret_cast<const char*>(res.data()),
                res.size()
            );
            ws->send(res_view);
        }
    };
    websocket.drain = [](auto *ws) {

    };
    websocket.ping = [](auto *ws, std::string_view) {

    };
    websocket.pong = [](auto *ws, std::string_view) {

    };
    websocket.close = [](auto *ws, int code, std::string_view message) {

    };

    return websocket;
}