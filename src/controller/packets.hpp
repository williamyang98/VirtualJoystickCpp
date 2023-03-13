#pragma once
#include <stdint.h>
#include "vjoy.hpp"

// This file contains packet constants
// Refer to controller_packet_handler.cpp for packet layout

enum class Command: uint8_t {
    ACQUIRE_DEVICE  = 0x00,
    SET_BUTTON      = 0x01,
    SET_AXIS        = 0x02,
    RESET           = 0x03,
    GET_DEV_INFO    = 0x04,
    INVALID_REQUEST = 0xFF,
};

enum class Axis: uint8_t {
    X           = 0x00,
    Y           = 0x01,
    Z           = 0x02,
    RX          = 0x03,
    RY          = 0x04,
    RZ          = 0x05,
    SLIDER      = 0x06,
    DIAL        = 0x07,
    WHEEL       = 0x08,
    ACCELERATOR = 0x09,
    BRAKE       = 0x0A,
    CLUTCH      = 0x0B,
    STEERING    = 0x0C,
    AILERON     = 0x0D,
    RUDDER      = 0x0E,
    THROTTLE    = 0x0F,
};

const vjoy::Axis axis_lookup[16] = {
    vjoy::Axis::X,
    vjoy::Axis::Y,
    vjoy::Axis::Z,
    vjoy::Axis::RX,
    vjoy::Axis::RY,
    vjoy::Axis::RZ,
    vjoy::Axis::SLIDER,
    vjoy::Axis::DIAL,
    vjoy::Axis::WHEEL,
    vjoy::Axis::ACCELERATOR,
    vjoy::Axis::BRAKE,
    vjoy::Axis::CLUTCH,
    vjoy::Axis::STEERING,
    vjoy::Axis::RUDDER,
    vjoy::Axis::AILERON,
    vjoy::Axis::THROTTLE,
};

enum class Status_Acquire: uint8_t {
    SUCCESS                       = 0x00,
    ERROR_DEVICE_ALREADY_ACQUIRED = 0x01,
    ERROR_DEVICE_NOT_EXISTS       = 0x02,
    ERROR_DEVICE_BUSY             = 0x03,
};

enum class Status_Button: uint8_t {
    SUCCESS              = 0x00,
    ERROR_INVALID_BUTTON = 0x01,
    ERROR_INVALID_VALUE  = 0x02,
};

enum class Status_Axis: uint8_t {
    SUCCESS             = 0x00,
    ERROR_INVALID_AXIS  = 0x01,
    ERROR_INVALID_VALUE = 0x02,
};

enum class Status_Reset: uint8_t {
    SUCCESS = 0x00,
};

enum class Status_Error: uint8_t {
    INVALID_COMMAND     = 0x00,
    INCORRECT_LENGTH    = 0x01,
    EMPTY_REQUEST       = 0x02,
    API_DISABLED        = 0x03,
    DEVICE_NOT_ACQUIRED = 0x04,
    UNKNOWN_ERROR       = 0xFF,
};

