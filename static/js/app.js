import { JoyStick } from "./joystick.js";
import { Button } from "./button.js";
import { PacketEncoder, Axis } from "./packets.js";

class App {
    constructor(device_id) {
        this.packet_encoder = new PacketEncoder();

        this.device_id = device_id;
        this.registered_axes = new Set();
        this.registered_buttons = new Set();

        this.buttons = [];
        this.joysticks = [];
        this.sliders = [];

        this.on_connection_change = is_open => {};
    }

    // listeners
    on_connection = () => {
        this.send_data(this.packet_encoder.acquire_device(this.device_id));
        this.send_data(this.packet_encoder.reset_device());
        this.force_update();
        this.on_connection_change(true);
    };

    // utility methods
    send_data = (data) => {
        if (this.ws.readyState == this.ws.OPEN) {
            this.ws.send(data);
        }
    }

    convert_axis_value = (val) => {
        return val+100;
    };

    // public methods
    start = () => {
        this.ws_url = (`ws://${document.location.host}/websocket`);
        this.ws = new WebSocket(this.ws_url);
        this.ws.onopen = () => {
            let message = "ws_open";
            this.on_connection();
        };

        this.ws.onmessage = (ev) => { 
            let message = ev.data;
            // console.log(message);
        };

        this.ws.onclose = () => { 
            this.on_connection_change(false);
        };
    }

    add_joystick = (joystick, axis_x, axis_y) => {
        joystick.on_change.add(data => {
            let x = this.convert_axis_value(data.x);
            let y = this.convert_axis_value(data.y);
            this.send_data(this.packet_encoder.set_axis(axis_x, x));
            this.send_data(this.packet_encoder.set_axis(axis_y, y));
        });
        this.joysticks.push(joystick);

        if (this.registered_axes.has(axis_x)) console.error(`Conflicting axis: ${axis_x}`);
        if (this.registered_axes.has(axis_y)) console.error(`Conflicting axis: ${axis_y}`);
        this.registered_axes.add(axis_x);
        this.registered_axes.add(axis_y);
    }

    add_slider = (slider, axis_id) => {
        slider.on_change.add(value => {
            let x = this.convert_axis_value(value);
            this.send_data(this.packet_encoder.set_axis(axis_id, x));
        });
        this.sliders.push(slider);
        if (this.registered_axes.has(axis_id)) console.error(`Conflicting axis: ${axis_id}`);
        this.registered_axes.add(axis_id);
    };

    add_button = (button, button_id) => {
        button.on_change.add(state => {
            this.send_data(this.packet_encoder.set_button(button_id, state));
        });
        this.buttons.push(button);
        if (this.registered_buttons.has(button_id)) console.error(`Conflicting button: ${button_id}`);
        this.registered_buttons.add(button_id);
    }

    reset_device = () => {
        this.send_data(this.packet_encoder.reset_device());
        this.force_update();
    }

    force_update = () => {
        for (let e of this.joysticks) {
            e.force_update();
        }
        for (let e of this.sliders) {
            e.force_update();
        }
        for (let e of this.buttons) {
            e.force_update();
        }
    }
};

export { App, Axis };