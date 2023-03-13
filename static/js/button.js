// Provides callbacks to listened to key press and key release events
// Consolidates touch and mouse events into a single callback (on_change)
// Also we need this since mouse release events may be missed 
// This occurs when the mouse leaves the region and then the mouse up event occurs
// which causes the button to only register a mousedown state
// Also we need this since touch click may be ignored with multiple touches
//
// Example template
// <button>Button text</button>
import { Surface } from "./surface.js";

class Button {
    constructor(elem) {
        this.elem = elem;
        this.on_change = new Set();     // list of state => {} handlers where state is a boolean
        this.surface = new Surface(this.elem, false);
        this.is_pressed = false;

        this.surface.on_press = pos => {
            this.is_pressed = true;
            this.update_style();
            this.force_update();
        };

        this.surface.on_release = pos => {
            this.is_pressed = false;
            this.update_style();
            this.force_update();
        };
        
        this.update_style();
    }

    // Utility methods
    update_style = () => {
        this.elem.setAttribute("attr-state", String(this.is_pressed));
    }

    // Public methods
    force_update = () => {
        for (let callback of this.on_change) {
            callback(this.is_pressed);
        }
    }
};

export { Button };