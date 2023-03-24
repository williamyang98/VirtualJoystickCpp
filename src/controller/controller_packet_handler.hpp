#pragma once
#include <stdint.h>
#include <vector>
#include <memory>
#include "utility/span.hpp"
#include "server/packet_handler.hpp"

class ControllerSession;

class ControllerPacketHandler: public PacketHandler
{
private:
    std::vector<uint8_t> encode_buf;
    std::unique_ptr<ControllerSession> session;
public:
    ControllerPacketHandler(); 
    ~ControllerPacketHandler() override = default;
    tcb::span<const uint8_t> on_packet(tcb::span<const uint8_t> buf) override;
private:
    tcb::span<const uint8_t> on_acquire(tcb::span<const uint8_t> buf);
    tcb::span<const uint8_t> on_button(tcb::span<const uint8_t> buf);
    tcb::span<const uint8_t> on_axis(tcb::span<const uint8_t> buf);
    tcb::span<const uint8_t> on_reset(tcb::span<const uint8_t> buf);
    tcb::span<const uint8_t> on_dev_info(tcb::span<const uint8_t> buf);

    // Helper to type cast arguments into packet bytes
    template <typename ... U>
    tcb::span<const uint8_t> create_packet(U&& ... args) {
        const size_t N = sizeof...(args);
        // NOTE: This is a fold expression
        //       https://en.cppreference.com/w/cpp/language/fold
        size_t i = 0;
        ([&] {
            encode_buf[i++] = uint8_t(args);
        } (), ...);
        return tcb::span(encode_buf).first(N);
    }
};