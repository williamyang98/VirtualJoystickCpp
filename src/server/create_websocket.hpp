#pragma once
#include <memory>
#include <uwebsockets/App.h>
#include "packet_handler.hpp"

// This websocket takes in a generic packet handler
uWS::App::WebSocketBehavior<std::unique_ptr<PacketHandler>> create_websocket(PacketHandlerFactory* factory);
