#include "controller_packet_handler.hpp"
#include "packets.hpp"
#include "controller_session.hpp"
#include <stdint.h>
#include <vector>
#include "utility/span.hpp"

ControllerPacketHandler::ControllerPacketHandler() {
    // Large enough for largest encoded packet
    encode_buf.resize(256);
    session = std::make_unique<ControllerSession>();
}

tcb::span<const uint8_t> ControllerPacketHandler::on_packet(tcb::span<const uint8_t> buf) {
    if (buf.size() == 0) {
        return create_packet(Command::INVALID_REQUEST, Status_Error::EMPTY_REQUEST);
    }

    const Command command = Command(buf[0]);
    auto data_buf = buf.subspan(1);
    switch (command) {
    case Command::ACQUIRE_DEVICE:   return on_acquire(data_buf);
    case Command::SET_BUTTON:       return on_button(data_buf);
    case Command::SET_AXIS:         return on_axis(data_buf);
    case Command::RESET:            return on_reset(data_buf);
    case Command::GET_DEV_INFO:     return on_dev_info(data_buf);
    default:                        return create_packet(Command::INVALID_REQUEST, Status_Error::INVALID_COMMAND);
    }
}

// Acquire device
tcb::span<const uint8_t> ControllerPacketHandler::on_acquire(tcb::span<const uint8_t> buf) {
    constexpr size_t N = 1;
    if (buf.size() != N) {
        return create_packet(Command::INVALID_REQUEST, Status_Error::INCORRECT_LENGTH);
    }

    const uint8_t device_id = buf[0];
    const auto status = session->open_controller(vjoy::Device_ID(device_id));
    switch (status) {
    case ControllerSession::Status_Acquire::SUCCESS:
        return create_packet(Command::ACQUIRE_DEVICE, Status_Acquire::SUCCESS, device_id);
    case ControllerSession::Status_Acquire::DEVICE_ALREADY_ACQUIRED:
        return create_packet(Command::ACQUIRE_DEVICE, Status_Acquire::ERROR_DEVICE_ALREADY_ACQUIRED, device_id);
    case ControllerSession::Status_Acquire::DEVICE_NOT_EXISTS:
        return create_packet(Command::ACQUIRE_DEVICE, Status_Acquire::ERROR_DEVICE_NOT_EXISTS, device_id);
    case ControllerSession::Status_Acquire::DEVICE_BUSY:
        return create_packet(Command::ACQUIRE_DEVICE, Status_Acquire::ERROR_DEVICE_BUSY, device_id);
    default:
        return create_packet(Command::INVALID_REQUEST, Status_Error::UNKNOWN_ERROR);
    }
}

tcb::span<const uint8_t> ControllerPacketHandler::on_button(tcb::span<const uint8_t> buf) {
    constexpr size_t N = 2;
    if (buf.size() != N) {
        return create_packet(Command::INVALID_REQUEST, Status_Error::INCORRECT_LENGTH);
    }

    auto* controller = session->get_controller();
    if (controller == NULL) {
        return create_packet(Command::INVALID_REQUEST, Status_Error::DEVICE_NOT_ACQUIRED);
    }

    const auto& dev_info = controller->device_info;
    const uint8_t button_id = buf[0];
    const bool is_pressed = bool(buf[1]);

    if (button_id > dev_info.nButtons) {
        return create_packet(Command::SET_BUTTON, Status_Button::ERROR_INVALID_BUTTON, button_id);
    }

    controller->set_button(button_id, is_pressed);
    controller->update();
    return create_packet(Command::SET_BUTTON, Status_Button::SUCCESS, button_id);
}

tcb::span<const uint8_t> ControllerPacketHandler::on_axis(tcb::span<const uint8_t> buf) {
    constexpr size_t N = 2;
    if (buf.size() != N) {
        return create_packet(Command::INVALID_REQUEST, Status_Error::INCORRECT_LENGTH);
    }

    auto* controller = session->get_controller();
    if (controller == NULL) {
        return create_packet(Command::INVALID_REQUEST, Status_Error::DEVICE_NOT_ACQUIRED);
    }

    const Axis axis_id = Axis(buf[0]);
    const uint8_t norm_value = buf[1];
    constexpr float range = 100.0f;
    const float value = (float(norm_value) - range) / range;

    switch (axis_id) {
    case Axis::X:           controller->set_x          (value); break;
    case Axis::Y:           controller->set_y          (value); break;
    case Axis::Z:           controller->set_z          (value); break;
    case Axis::RX:          controller->set_rx         (value); break;
    case Axis::RY:          controller->set_ry         (value); break;
    case Axis::RZ:          controller->set_rz         (value); break;
    case Axis::SLIDER:      controller->set_slider     (value); break;
    case Axis::DIAL:        controller->set_dial       (value); break;
    case Axis::WHEEL:       controller->set_wheel      (value); break;
    case Axis::ACCELERATOR: controller->set_accelerator(value); break;
    case Axis::BRAKE:       controller->set_brake      (value); break;
    case Axis::CLUTCH:      controller->set_clutch     (value); break;
    case Axis::STEERING:    controller->set_steering   (value); break;
    case Axis::AILERON:     controller->set_aileron    (value); break;
    case Axis::RUDDER:      controller->set_rudder     (value); break;
    case Axis::THROTTLE:    controller->set_throttle   (value); break;
    default:            
        return create_packet(Command::SET_AXIS, Status_Axis::ERROR_INVALID_AXIS, axis_id);
    }

    controller->update();
    return create_packet(Command::SET_AXIS, Status_Button::SUCCESS, axis_id);
}

tcb::span<const uint8_t> ControllerPacketHandler::on_reset(tcb::span<const uint8_t> buf) {
    const size_t N = 0;
    if (buf.size() != N) {
        return create_packet(Command::INVALID_REQUEST, Status_Error::INCORRECT_LENGTH);
    }

    auto* controller = session->get_controller();
    if (controller == NULL) {
        return create_packet(Command::INVALID_REQUEST, Status_Error::DEVICE_NOT_ACQUIRED);
    }

    controller->reset();
    controller->update();
    return create_packet(Command::RESET, Status_Reset::SUCCESS);
}

tcb::span<const uint8_t> ControllerPacketHandler::on_dev_info(tcb::span<const uint8_t> buf) {
    const size_t N = 0;
    if (buf.size() != N) {
        return create_packet(Command::INVALID_REQUEST, Status_Error::INCORRECT_LENGTH);
    }

    auto* controller = session->get_controller();
    if (controller == NULL) {
        return create_packet(Command::INVALID_REQUEST, Status_Error::DEVICE_NOT_ACQUIRED);
    }

    const auto& info = controller->device_info;

    encode_buf[0] = uint8_t(Command::GET_DEV_INFO); 
    // Create list of available axes
    uint8_t total_axes = 0;
    {
        const size_t N = 2;
        auto list_buf = tcb::span(encode_buf).subspan(N);
        size_t i = 0;
        if (info.AxisX)         list_buf[i++] = uint8_t(Axis::X);
        if (info.AxisY)         list_buf[i++] = uint8_t(Axis::Y);
        if (info.AxisZ)         list_buf[i++] = uint8_t(Axis::Z);
        if (info.AxisXRot)      list_buf[i++] = uint8_t(Axis::RX);
        if (info.AxisYRot)      list_buf[i++] = uint8_t(Axis::RY);
        if (info.AxisZRot)      list_buf[i++] = uint8_t(Axis::RZ);
        if (info.Slider)        list_buf[i++] = uint8_t(Axis::SLIDER);
        if (info.Dial)          list_buf[i++] = uint8_t(Axis::DIAL);
        if (info.Wheel)         list_buf[i++] = uint8_t(Axis::WHEEL);
        if (info.Accelerator)   list_buf[i++] = uint8_t(Axis::ACCELERATOR);
        if (info.Brake)         list_buf[i++] = uint8_t(Axis::BRAKE);
        if (info.Clutch)        list_buf[i++] = uint8_t(Axis::CLUTCH);
        if (info.Steering)      list_buf[i++] = uint8_t(Axis::STEERING);
        if (info.Aileron)       list_buf[i++] = uint8_t(Axis::AILERON);
        if (info.Rudder)        list_buf[i++] = uint8_t(Axis::RUDDER);
        if (info.Throttle)      list_buf[i++] = uint8_t(Axis::THROTTLE);
        total_axes = uint8_t(i);
    }
    encode_buf[1] = total_axes;
    encode_buf[2+total_axes+0] = uint8_t(info.nButtons);
    encode_buf[2+total_axes+1] = uint8_t(info.nDiscHats);
    encode_buf[2+total_axes+2] = uint8_t(info.nContHats);

    const size_t encode_size = 2+total_axes+2+1;
    return tcb::span(encode_buf).first(encode_size);
}