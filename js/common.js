// Common code used between UI configurations 
// Mostly just glue code 
import { App, Axis } from "./app.js";
import { Surface } from "./surface.js";
import { JoyStick } from "./joystick.js";
import { Slider } from "./slider.js";
import { Button } from "./button.js";
import { ToggleButton } from "./toggle_button.js";
import { Modal } from "./modal.js";
import { toggle_fullscreen } from "./fullscreen.js";


// Instantiate various application widgets
// HTML Templates for controls
// Refer to Joystick, Slider, Button, Toggle classes for expected options
// Joystick: <div attr-app="joystick" attr-app-joystick-axis-x="Axis.X" attr-app-joystick-axis-y="Axis.Y"></div>
// Slider:   <div attr-app="slider" attr-app-slider-axis="Axis.Z" attr-app-slider-spring-button-id="optional-button-id"></div>
// Button:   <div attr-app="button" attr-app-button-id="0"></div>
// Toggle:   <div attr-app="toggle" attr-app-toggle-id="0"></div>
const axis_lookup = {
    // NOTE: vJoy only works with 8 axes right now
    "Axis.X": Axis.X,
    "Axis.Y": Axis.Y,
    "Axis.Z": Axis.Z,
    "Axis.RX": Axis.RX,
    "Axis.RY": Axis.RY,
    "Axis.RZ": Axis.RZ,
    "Axis.SLIDER": Axis.SLIDER,
    "Axis.DIAL": Axis.DIAL,
    // NOTE: These following axes only work with specific apis depending on game
    "Axis.WHEEL"        : Axis.WHEEL      ,
    "Axis.ACCELERATOR"  : Axis.ACCELERATOR,
    "Axis.BRAKE"        : Axis.BRAKE      ,
    "Axis.CLUTCH"       : Axis.CLUTCH     ,
    "Axis.STEERING"     : Axis.STEERING   ,
    "Axis.AILERON"      : Axis.AILERON    ,
    "Axis.RUDDER"       : Axis.RUDDER     ,
    "Axis.THROTTLE"     : Axis.THROTTLE   ,
};

let get_axis_from_string = label => {
    let axis = axis_lookup[label];
    if (axis === undefined) {
        console.error(`Invalid axis label: '${label}'`)
    }
    return axis;
};

let create_app_controls = app => {
    // Create joysticks
    let joystick_elems = document.querySelectorAll("[attr-app='joystick']");
    for (let elem of joystick_elems) {
        let x_axis = get_axis_from_string(elem.getAttribute("attr-app-joystick-axis-x"));
        let y_axis = get_axis_from_string(elem.getAttribute("attr-app-joystick-axis-y"));
        let joystick = new JoyStick(elem);
        app.add_joystick(joystick, x_axis, y_axis);
    }

    // Create sliders
    let slider_elems = document.querySelectorAll("[attr-app='slider']");
    for (let elem of slider_elems) {
        let slider_axis = get_axis_from_string(elem.getAttribute("attr-app-slider-axis"));
        let slider = new Slider(elem);

        // Optional button to toggle spring mode on slider
        if (elem.hasAttribute("attr-app-slider-spring-button-id")) {
            let button_id = elem.getAttribute("attr-app-slider-spring-button-id");
            let button_elem = document.getElementById(button_id);
            let button = new ToggleButton(button_elem);
            button.on_change.add(state => {
                slider.set_spring_mode(state);
            });
            button.force_update();
        }

        app.add_slider(slider, slider_axis);
    }

    // Momentary buttons
    let button_elems = document.querySelectorAll("[attr-app='button']");
    for (let elem of button_elems) {
        let button_id = Number(elem.getAttribute("attr-app-button-id"));
        let button = new Button(elem);
        app.add_button(button, button_id);
    }

    // Toggle buttons
    let toggle_elems = document.querySelectorAll("[attr-app='toggle']");
    for (let elem of toggle_elems) {
        let button_id = Number(elem.getAttribute("attr-app-toggle-id"));
        let button = new ToggleButton(elem);
        app.add_button(button, button_id);
    }
};

// Create an arbitrary modal 
// HTML template
// <button attr-modal-id="modal-id">Open modal</button>
// <div class="modal" id="modal-id">
//   <div class="modal-dialog">
//     <header class="modal-header">
//       <h3 class="modal-title text-center">Modal title</h3>
//     </header>
//     <footer class="modal-footer">
//       <button attr-modal-dismiss>Close modal</button>
//     </footer>
//   </div>
// </div>
let create_modal = open_elem => {
    let modal_id = open_elem.getAttribute("attr-modal-id");
    let modal_elem = document.querySelector(`.modal#${modal_id}`);
    let dismiss_elems = modal_elem.querySelectorAll("[attr-modal-dismiss]");
    let modal = new Modal(modal_elem);

    open_elem.addEventListener("click", ev => {
        ev.preventDefault();
        modal.show();
    });

    for (let elem of dismiss_elems) {
        let surface = new Surface(elem, false);
        surface.on_release = pos => {
            modal.hide();
        };
    }

    return modal;
};

// Create a status led
// HTML template
// <div></div>
let create_status_led = elem => {
    elem.className = "status-led led-yellow";
    let callback = ws_state => {
        switch (ws_state) {
        case WebSocket.CONNECTING: 
            elem.className = "status-led led-yellow";
            break;
        case WebSocket.OPEN:
            elem.className = "status-led led-green";
            break;
        case WebSocket.CLOSED:
            elem.className = "status-led led-red";
            // alert("Websocket has closed");
            break;
        }
    };
    return callback;
};

// Create commonly used status bar
// HTML Template
// <div class="status-bar" id="app-status-bar">
//   <button id="home">⌂</button>
//   <button id="screen-size">?</button>
//   <button id="reset-device">↻</button>
//   <button id="wake-lock"></button>
//   <button id="fullscreen">⛶</button>
//   <div id="status-led"></div>
// </div>
let create_app_status_bar = app => {
    let root_elem = document.getElementById("app-status-bar");

    root_elem.querySelector("#home").addEventListener("click", ev => {
        ev.preventDefault();
        window.location.href = "/";
    });

    root_elem.querySelector("#screen-size").addEventListener("click", ev => {
        ev.preventDefault();
        let body = document.getElementsByTagName('body')[0];
        let x = window.innerWidth || document.documentElement.clientWidth || body.clientWidth;
        let y = window.innerHeight|| document.documentElement.clientHeight|| body.clientHeight;
        alert(`Screen size: (${x},${y})`);
    });

    root_elem.querySelector("#reset-device").addEventListener("click", ev => {
        ev.preventDefault();
        app.reset_device();
    });

    let wakelock_elem = root_elem.querySelector("#wake-lock");
    if (!app.check_has_wakelock()) {
        wakelock_elem.setAttribute("disabled", "");
    }
    wakelock_elem.addEventListener("click", ev => {
        ev.preventDefault();
        app.toggle_wakelock();
    });
    app.on_wakelock_change.add(is_wakelock => {
        wakelock_elem.setAttribute("attr-state", String(is_wakelock));
    });

    root_elem.querySelector("#fullscreen").addEventListener("click", ev => {
        ev.preventDefault();
        toggle_fullscreen();
    });

    let status_led_elem = root_elem.querySelector("#status-led");
    let status_led_callback = create_status_led(status_led_elem);
    app.on_connection_change.add(status_led_callback);
};

export { create_modal, create_app_controls, create_app_status_bar };
