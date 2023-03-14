/*
 * Name          : joy.js
 * @author       : Roberto D'Amico (Bobboteck)
 * Last modified : 09.06.2020
 * Revision      : 1.1.6
 *
 * Modification History:
 * Date         Version     Modified By     Description
 * 2023-03-11   2.0.1       William Yang    Update to ES6 classes
 * 2021-12-21   2.0.0       Roberto D'Amico New version of the project that integrates the callback functions, while 
 *                                          maintaining compatibility with previous versions. Fixed Issue #27 too, 
 *                                          thanks to @artisticfox8 for the suggestion.
 * 2020-06-09   1.1.6       Roberto D'Amico Fixed Issue #10 and #11
 * 2020-04-20   1.1.5       Roberto D'Amico Correct: Two sticks in a row, thanks to @liamw9534 for the suggestion
 * 2020-04-03               Roberto D'Amico Correct: InternalRadius when change the size of canvas, thanks to 
 *                                          @vanslipon for the suggestion
 * 2020-01-07   1.1.4       Roberto D'Amico Close #6 by implementing a new parameter to set the functionality of 
 *                                          auto-return to 0 position
 * 2019-11-18   1.1.3       Roberto D'Amico Close #5 correct indication of East direction
 * 2019-11-12   1.1.2       Roberto D'Amico Removed Fix #4 incorrectly introduced and restored operation with touch 
 *                                          devices
 * 2019-11-12   1.1.1       Roberto D'Amico Fixed Issue #4 - Now JoyStick work in any position in the page, not only 
 *                                          at 0,0
 * 
 * The MIT License (MIT)
 *
 *  This file is part of the JoyStick Project (https://github.com/bobboteck/JoyStick).
 *	Copyright (c) 2015 Roberto D'Amico (Bobboteck).
 *
 * Permission is hereby granted, free of charge, to any person obtaining a copy
 * of this software and associated documentation files (the "Software"), to deal
 * in the Software without restriction, including without limitation the rights
 * to use, copy, modify, merge, publish, distribute, sublicense, and/or sell
 * copies of the Software, and to permit persons to whom the Software is
 * furnished to do so, subject to the following conditions:
 * 
 * The above copyright notice and this permission notice shall be included in all
 * copies or substantial portions of the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR
 * IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY,
 * FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE
 * AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER
 * LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM,
 * OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE
 * SOFTWARE.
 */

import { Surface } from "./surface.js";

class Vector2D {
  constructor(x=0, y=0) {
    this.x = x;
    this.y = y;
  }
};

// Instantiates a joystick
// on_change is a callback that takes in a Vector2D which is between -100 and +100
class JoyStick {
    constructor(elem) {
        this.elem = elem;
        this.on_change = new Set(); // list of pos => {} handlers where pos.x is between -100 to +100

        this.width  = this.elem.clientWidth;
        this.height = this.elem.clientHeight; 

        // User modifiable properties
        this.color_primary = "#5097ff";
        this.color_secondary = "#f45a45";
        this.color_neutral = "#4d4d4d";
        this.width_line = 1;
        this.auto_return_to_center = true;

        // Create our canvas2D for rendering the joystick
        this.canvas = document.createElement("canvas");
        this.canvas.id = "joytick_2d";
        this.canvas.width = this.width;
        this.canvas.height = this.height;
        this.context = this.canvas.getContext("2d");
        this.elem.appendChild(this.canvas);

        // Constants
        this.knob_radius = Math.ceil(Math.min(this.width, this.height)/2 * 0.25);
        this.reset_radius = this.knob_radius + 10;
        this.center = new Vector2D();
        this.center.x = this.canvas.width / 2;
        this.center.y = this.canvas.height / 2;
        
        // Updated on stick move
        this.position = new Vector2D();
        this.position.x = this.center.x;
        this.position.y = this.center.y;
        this.norm_position = new Vector2D();
        this.redraw();

        // Listen to surface events
        this.surface = new Surface(this.canvas);
        this.surface.on_press = pos => {
            this.position = pos;
            this.restrict_stick_position();
            this.redraw();
            this.update();
        };

        this.surface.on_move = pos => {
            this.position = pos;
            this.restrict_stick_position();
            this.redraw();
            this.update();
        };

        this.surface.on_release = pos => {
            this.position = pos;
            if (this.auto_return_to_center) {
                this.position.x = this.center.x;
                this.position.y = this.center.y;
            }
            this.restrict_stick_position();
            this.redraw();
            this.update();
        };
    }

    redraw = () => {
        // Clear
        this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

        let circle_radians = 2 * Math.PI;

        // Render the centering circle
        this.context.beginPath();
        this.context.arc(this.center.x, this.center.y, this.reset_radius, 0, circle_radians, false);
        this.context.lineWidth = this.width_line;
        this.context.strokeStyle = this.color_neutral;
        this.context.stroke();

        // Render the joystick ball
        this.context.beginPath();
        this.context.arc(this.position.x, this.position.y, this.knob_radius, 0, circle_radians, false);
        // create radial gradient to pseudo illuminate the ball
        let gradient = this.context.createRadialGradient(
            this.center.x, this.center.y, 5, 
            this.center.x, this.center.y, Math.max(this.width, this.height)
        );
        gradient.addColorStop(0, this.color_primary);
        gradient.addColorStop(1, this.color_secondary);
        this.context.fillStyle = gradient;
        this.context.fill();
        this.context.lineWidth = this.width_line;
        this.context.strokeStyle = this.color_neutral;
        this.context.stroke();
    }

    // Utility methods
    get_normalised_position = () => {
        const A = 100;
        let v = new Vector2D();

        v.x = (this.position.x - this.center.x)/(this.width/2 - this.knob_radius);
        v.x = +Number((A*v.x).toFixed());
        v.x = this.clamp(v.x, -A, +A);

        v.y = (this.position.y - this.center.y)/(this.height/2 - this.knob_radius);
        v.y = -Number((A*v.y).toFixed());
        v.y = this.clamp(v.y, -A, +A);

        return v;
    }

    restrict_stick_position = () => {
        if (this.position.x < this.knob_radius) { 
            this.position.x = this.knob_radius; 
        }

        if ((this.position.x + this.knob_radius) > this.canvas.width) { 
            this.position.x = this.canvas.width-this.knob_radius; 
        }

        if (this.position.y < this.knob_radius) { 
            this.position.y = this.knob_radius; 
        }

        if ((this.position.y + this.knob_radius) > this.canvas.height) { 
            this.position.y = this.canvas.height-this.knob_radius; 
        }
    }

    update = () => {
        let pos = this.get_normalised_position();
        let is_changed = (pos.x != this.norm_position.x) || (pos.y != this.norm_position.y);
        if (!is_changed) return;
        this.norm_position = pos;
        this.notify_all();
    }

    clamp = (x, min, max) => {
        x = (x > min) ? x : min;
        x = (x > max) ? max: x;
        return x;
    }

    notify_all = () => {
        for (let callback of this.on_change) {
            callback(this.norm_position);
        }
    }
    
    // Public methods
    force_update = () => {
        let pos = this.get_normalised_position();
        this.norm_position = pos;
        this.notify_all();
    }
};

export { JoyStick };