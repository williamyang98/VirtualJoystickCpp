#pragma once

#include "utility/span.hpp"
#include <stdint.h>
#include <memory>

class PacketHandler 
{
public:
    virtual ~PacketHandler() {};
    virtual tcb::span<const uint8_t> on_packet(tcb::span<const uint8_t> buf) = 0;
};

class PacketHandlerFactory 
{
public:
    virtual std::unique_ptr<PacketHandler> create_handler(void) = 0;
};
