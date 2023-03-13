import { Surface } from "./surface.js";

class Vector2D {
  constructor(x=0, y=0) {
    this.x = x;
    this.y = y;
  }
};

// Provides callbacks to listened to slider update events
// Consolidates touch and mouse events into a single callback (on_change)
//
// Example template
// <div attr-value="20" attr-spring="0" attr-orient="vertical"></input>
//
// The input is a slider that is always between -100 and +100
// It is updated and listened to by this class
// 1. attr-value=<default_value> : Sets the default value (if none is provided it defaults to 0)
// 2. attr-spring=<spring_value> : Sets the spring value  (if none is provided it uses the default value)
// 3. attr-orient=<orientation>  : Sets the orientation of the slider (if none is provided it uses horizontal)
class Slider {
    constructor(elem) {
        this.elem = elem;
        this.on_change = new Set(); // list of val => {} where val is between -100 to +100
        this.range = 100;
        this.value = 0;
        this.spring_value = 0;
        this.is_spring_mode = false;
        this.surface = new Surface(this.elem);

        // User modifiable properties
        this.color_primary = "#5097ff";
        this.color_secondary = "#f45a45";
        this.color_neutral = "#4d4d4d";

        // Canvas rendering parameters
        this.width = this.elem.clientWidth;
        this.height = this.elem.clientHeight;
        this.center = new Vector2D(this.width/2, this.height/2);
        // Create canvas 2D
        this.canvas = document.createElement("canvas");
        this.canvas.id = "slider";
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.context = this.canvas.getContext("2d");
        this.elem.appendChild(this.canvas);

        // Determine if it is vertical
        this.is_horizontal = true;
        if (this.elem.hasAttribute("attr-orient")) {
            let orientation = this.elem.getAttribute("attr-orient");
            if (orientation === "vertical") {
                this.is_horizontal = false;
            } else if (orientation === "horizontal") {
                this.is_horizontal = true;
            }
        } 

        // Rendering parameters that depend on orientation
        if (this.is_horizontal) {
            this.slider_length = this.width;
            this.slider_girth = this.height;
            this.slider_center = this.width/2;
        } else {
            this.slider_length = this.height;
            this.slider_girth = this.width;
            this.slider_center = this.height/2;
        }
        // Knob rendering paramters
        this.knob_radius = 2;
        this.knob_size_ratio = 0.5;
        this.knob_size = Math.floor(this.slider_girth * this.knob_size_ratio);

        // Initial value
        if (this.elem.hasAttribute("attr-value")) {
            let x = Number(this.elem.getAttribute("attr-value"));
            x = this.clamp(x, -this.range, +this.range);
            this.value = x;
        }

        // Spring value
        if (this.elem.hasAttribute("attr-spring")) {
            let x = Number(this.elem.getAttribute("attr-spring"));
            x = this.clamp(x, -this.range, +this.range);
            this.spring_value = x;
        } else {
            this.spring_value = this.value;
        }

        // Bind listeners
        this.surface.on_press = pos => {
            this.value = this.get_normalised_value(pos.x, pos.y);
            this.redraw();
            this.notify_all();
        };

        this.surface.on_move = pos => {
            this.value = this.get_normalised_value(pos.x, pos.y);
            this.redraw();
            this.notify_all();
        };

        this.surface.on_release = pos => {
            this.value = this.get_normalised_value(pos.x, pos.y);
            if (this.is_spring_mode) {
                this.activate_spring();
            }
            this.redraw();
        };


        this.redraw();
    }

    redraw = () => {
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        let slider_range = this.slider_length/2 - this.knob_size/2;

        // Render spring position
        let norm_spring = this.spring_value/this.range;
        if (!this.is_horizontal) norm_spring = -norm_spring;    // NOTE: y-axis is inverted
        let spring_offset = Math.floor(norm_spring*slider_range);
        let spring_pos = this.slider_center + spring_offset;
        let spring_margin = 3;
        let spring_pos_lower = spring_pos + this.knob_size/2 + spring_margin;
        let spring_pos_upper = spring_pos - this.knob_size/2 - spring_margin;
        this.context.beginPath();
        if (this.is_horizontal) {
            this.context.moveTo(spring_pos_lower, 0);
            this.context.lineTo(spring_pos_lower, this.height);
            this.context.moveTo(spring_pos_upper, 0);
            this.context.lineTo(spring_pos_upper, this.height);
        } else {
            this.context.moveTo(0         , spring_pos_lower);
            this.context.lineTo(this.width, spring_pos_lower);
            this.context.moveTo(0         , spring_pos_upper);
            this.context.lineTo(this.width, spring_pos_upper);
        }
        // Spring line
        this.context.lineWidth = 1;
        this.context.strokeStyle = this.color_neutral;
        this.context.stroke();


        // Render position knob
        this.context.beginPath();
        let norm_knob = this.value/this.range;
        if (!this.is_horizontal) norm_knob = -norm_knob;    // NOTE: y-axis is inverted
        let knob_offset = Math.floor(norm_knob*slider_range) - this.knob_size/2;
        let knob_pos = this.slider_center + knob_offset;
        if (this.is_horizontal) {
            this.context.roundRect(knob_pos, 0, this.knob_size, this.height, this.knob_radius);
        } else {
            this.context.roundRect(0, knob_pos, this.width, this.knob_size, this.knob_radius);
        }
        // Color in knob
        let gradient_radius_start = 5;
        let gradient_radius_end = Math.max(spring_pos, this.slider_length-spring_pos);
        let gradient = null;
        if (this.is_horizontal) {
            gradient = this.context.createRadialGradient(
                spring_pos, this.center.y, gradient_radius_start,
                spring_pos, this.center.y, gradient_radius_end
            );
        } else {
            gradient = this.context.createRadialGradient(
                this.center.x, spring_pos, gradient_radius_start,
                this.center.x, spring_pos, gradient_radius_end
            );
        }
        gradient.addColorStop(0, this.color_primary);
        gradient.addColorStop(1, this.color_secondary);
        this.context.fillStyle = gradient;
        this.context.fill();
        // Knob outline
        this.context.lineWidth = 1;
        this.context.strokeStyle = this.color_neutral;
        this.context.stroke();
    }

    // Spring button
    on_spring_button_click = ev => {
        ev.preventDefault();
        this.is_spring_mode = !this.is_spring_mode;
        this.update_spring_button_style();
        if (this.is_spring_mode) {
            this.activate_spring();
        }
    }

    activate_spring = () => {
        this.value = this.spring_value;
        this.redraw();
        this.notify_all();
    }

    // Utility methods
    get_normalised_value = (x, y) => {
        let v = 0;
        if (this.is_horizontal) {
            let range = this.width/2;
            v = (x-range)/range;
        } else {
            let range = this.height/2;
            v = (y-range)/range;
            v = -v; // NOTE: y-axis is inverted
        }

        v = Number((this.range*v).toFixed());
        v = this.clamp(v, -this.range, +this.range);
        return v;
    }

    clamp = (x, min, max) => {
        x = (x > min) ? x : min;
        x = (x > max) ? max: x;
        return x;
    }

    notify_all = () => {
        for (let callback of this.on_change) {
            callback(this.value);
        }
    }

    // Public methods
    force_update = () => {
        this.notify_all();
    }

    set_spring_mode = is_spring => {
        this.is_spring_mode = is_spring;
        if (this.is_spring_mode) {
            this.activate_spring();
        }
    }
};

export { Slider };