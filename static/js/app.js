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

        this.ws_url = (`ws://${document.location.host}/websocket`);
        this.ws = null;
        // Send a heartbeat to keep the connection alive
        this.ws_heartbeat_id = null;
        // Only let one websocket start
        this.ws_is_updating = false;

        // Wakelock to keep screen active
        this.wakelock = null;
        // Only let one wakelock toggle occur
        this.wakelock_is_updating = false;

        this.on_connection_change = new Set();  // list of ws_state => {} handlers
        this.on_wakelock_change = new Set();    // list of is_wakelock => {} handlers
    }

    // utility methods
    send_data = (data) => {
        if (this.ws === null) return;
        if (this.ws.readyState !== WebSocket.OPEN) return;
        this.ws.send(data);
    }

    convert_axis_value = val => {
        return val+100;
    }

    notify_ws_state = state => {
        for (let callback of this.on_connection_change) {
            callback(state);
        }
    }

    notify_wakelock = state => {
        for (let callback of this.on_wakelock_change) {
            callback(state);
        }
    }

    // websocket methods
    close_ws_heartbeat = () => {
        if (this.ws_heartbeat_id === null) return;
        clearInterval(this.ws_heartbeat_id);
        this.ws_heartbeat_id = null;
    }

    open_ws_heartbeat = () => {
        this.close_ws_heartbeat();
        this.ws_heartbeat_id = setInterval(() => {
            this.send_data(this.packet_encoder.acquire_device(this.device_id));
        }, 1000);
    }

    open_websocket = () => {
        this.ws = new WebSocket(this.ws_url);
        this.ws.onopen = () => {
            this.send_data(this.packet_encoder.acquire_device(this.device_id));
            this.send_data(this.packet_encoder.reset_device());
            this.force_update();
            this.open_ws_heartbeat();
            this.notify_ws_state(WebSocket.OPEN);
            this.ws_is_updating = false;
        };

        this.ws.onmessage = (ev) => { 
            let message = ev.data;
            // console.log(message);
        };

        this.ws.onclose = () => { 
            this.ws = null;
            this.close_ws_heartbeat();
            this.notify_ws_state(WebSocket.CLOSED);
            this.ws_is_updating = false;
        };
    }

    // public methods
    start = () => {
        if (this.ws !== null) return;
        if (this.ws_is_updating) return;
        this.ws_is_updating = true;
        this.notify_ws_state(WebSocket.CONNECTING);
        this.open_websocket();
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
        if (this.ws === null) {
            this.start();
            return;
        }
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

    check_has_wakelock = () => {
        return "wakeLock" in navigator;
    }

    toggle_wakelock = () => {
        if (this.wakelock_is_updating) return;

        if (!this.check_has_wakelock()) {
            this.notify_wakelock(false);
            return;
        }

        this.wakelock_is_updating = true;

        if (this.wakelock === null) {
            navigator.wakeLock
                .request("screen")
                .then(wakelock => {
                    this.wakelock = wakelock;
                    this.wakelock_is_updating = false;
                    this.notify_wakelock(true);
                })
                .catch(err => {
                    console.error(err);
                    alert(`Failed to acquire wakelock: ${err}`);
                    this.wakelock_is_updating = false;
                    this.notify_wakelock(false);
                });
        } else {
            this.wakelock
                .release()
                .then(() => {
                    this.wakelock = null;
                    this.wakelock_is_updating = false;
                    this.notify_wakelock(false);
                })
                .catch(err => {
                    console.error(err);
                    alert(`Failed to release wakelock: ${err}`);
                    this.wakelock_is_updating = false;
                    this.notify_wakelock(true);
                });
        }
    }

};

export { App, Axis };