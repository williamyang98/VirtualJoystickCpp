// Encode packets for vjoy controller websocket
// Refer to the following source files for protocol:
// - src/controller/packets.txt
// - src/controller/packets.hpp
// - src/controller/controller_packet_handler.cpp

const Command = {
    ACQUIRE_DEVICE  : 0x00,
    SET_BUTTON      : 0x01,
    SET_AXIS        : 0x02,
    RESET           : 0x03,
    GET_DEV_INFO    : 0x04,
    INVALID_REQUEST : 0xFF,
};

const Axis = {
    X           : 0x00,
    Y           : 0x01,
    Z           : 0x02,
    RX          : 0x03,
    RY          : 0x04,
    RZ          : 0x05,
    SLIDER      : 0x06,
    DIAL        : 0x07,
    WHEEL       : 0x08,
    ACCELERATOR : 0x09,
    BRAKE       : 0x0A,
    CLUTCH      : 0x0B,
    STEERING    : 0x0C,
    AILERON     : 0x0D,
    RUDDER      : 0x0E,
    THROTTLE    : 0x0F,
};

const Status_Acquire = {
    SUCCESS                       : 0x00,
    ERROR_DEVICE_ALREADY_ACQUIRED : 0x01,
    ERROR_DEVICE_NOT_EXISTS       : 0x02,
    ERROR_DEVICE_BUSY             : 0x03,
};

const Status_Button = {
    SUCCESS              : 0x00,
    ERROR_INVALID_BUTTON : 0x01,
    ERROR_INVALID_VALUE  : 0x02,
};

const Status_Axis = {
    SUCCESS             : 0x00,
    ERROR_INVALID_AXIS  : 0x01,
    ERROR_INVALID_VALUE : 0x02,
};

const Status_Reset = {
    SUCCESS : 0x00,
};

const Status_Error = {
    INVALID_COMMAND     : 0x00,
    INCORRECT_LENGTH    : 0x01,
    EMPTY_REQUEST       : 0x02,
    API_DISABLED        : 0x03,
    DEVICE_NOT_ACQUIRED : 0x04,
    UNKNOWN_ERROR       : 0xFF,
};

class PacketEncoder {
    acquire_device = (device_id) => {
        return new Uint8Array([Command.ACQUIRE_DEVICE, device_id]);
    }

    set_button = (button_id, state) => {
        return new Uint8Array([Command.SET_BUTTON, button_id, state]);
    }

    set_axis = (axis_id, value) => {
        return new Uint8Array([Command.SET_AXIS, axis_id, value]);
    };

    reset_device = () => {
        return new Uint8Array([Command.RESET]);
    }

    get_dev_info = () => {
        return new Uint8Array([Command.GET_DEV_INFO]);
    }
};

export { PacketEncoder, Axis };