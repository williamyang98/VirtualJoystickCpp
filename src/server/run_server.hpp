#pragma once
#include "packet_handler.hpp"
void run_server(const int port, const char* static_filepath, PacketHandlerFactory* factory);