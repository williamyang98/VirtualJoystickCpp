#pragma once

#include <memory>
#include "controller.hpp"
#include "vjoy.hpp"

// Manage ownership of controller
class ControllerSession 
{
public:
    enum Status_Acquire {
        SUCCESS,
        DEVICE_NOT_EXISTS,
        DEVICE_BUSY,
        DEVICE_ALREADY_ACQUIRED,
    };
private:
    std::unique_ptr<Controller> controller;
public:
    ControllerSession() {
        controller = nullptr;
    }

    ~ControllerSession() {
        if (controller != nullptr) {
            const auto id = controller->get_id();
            vjoy::device_release(id);
        }
    }

    ControllerSession(const ControllerSession&) = default;
    ControllerSession(ControllerSession&&) = default;
    ControllerSession& operator=(const ControllerSession&) = default;
    ControllerSession& operator=(ControllerSession&&) = default;

    Controller* get_controller() {
        return controller.get();
    }

    Status_Acquire open_controller(vjoy::Device_ID id) {
        if (controller != nullptr) {
            return Status_Acquire::DEVICE_ALREADY_ACQUIRED;
        }

        const bool is_exists = vjoy::device_is_exists(id);
        if (!is_exists) {
            return Status_Acquire::DEVICE_NOT_EXISTS;
        }

        const bool status = vjoy::device_acquire(id);
        if (!status) {
            return Status_Acquire::DEVICE_BUSY;
        }

        controller = std::make_unique<Controller>(id);
        return Status_Acquire::SUCCESS;
    }
};