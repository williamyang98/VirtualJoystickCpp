// Provides callbacks to listened to key press and key release events
// Consolidates touch and mouse events into a single callback (on_change)
// Also we need this since touch click may be ignored with multiple touches
//
// Example template
// <button attr-value="true">Button text</button>
//
// attr-value specifies the state of the toggle button
// If it isn't provide then it is added programatically
class ToggleButton {
    constructor(elem) {
        this.elem = elem;
        this.on_change = new Set(); // list of state => {} handlers whre state is a boolean
        this.is_active = false;

        if (this.elem.hasAttribute("attr-state")) {
            this.is_active = this.elem.getAttribute("attr-state") === 'true';
            this.notify_all();
        }
        this.update_style();

        this.elem.addEventListener("mousedown", this.on_press.bind(this));
        this.elem.addEventListener("touchstart", this.on_press.bind(this));
    }

    // Mouse events
    on_press = event => {
        event.stopPropagation();
        event.preventDefault();
        this.is_active = !this.is_active;
        this.update_style();
        this.notify_all();
    }

    // Utility methods
    update_style = () => {
        this.elem.setAttribute("attr-state", String(this.is_active));
    }

    notify_all = () => {
        for (let callback of this.on_change) {
            callback(this.is_active);
        }
    }

    // Public methods
    force_update = () => {
        this.notify_all();
    }
};

export { ToggleButton };