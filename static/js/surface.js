class Vector2D {
  constructor(x=0, y=0) {
    this.x = x;
    this.y = y;
  }
};

// NOTE: We debounce move events since they can cause alot of lag
class GlobalDebounce {
    static is_debounce = false;
    static debounce_timer = null;
    static updates_per_second = 60;
    static debounce_interval_ms = Math.floor(1000/this.updates_per_second);
    static on_mouse_move = new Set();
    static on_touch_move = new Set();

    static {
        let props = { passive: false };
        document.addEventListener("mousemove", ev => {
            if (this.check_is_debounce()) return;
            for (let cb of this.on_mouse_move) {
                cb(ev);
            }
        }, props);

        document.addEventListener("touchmove", ev => {
            if (this.check_is_debounce()) return;
            for (let cb of this.on_touch_move) {
                cb(ev);
            }
        }, props);

        this.debounce_timer = setInterval(() => {
            this.is_debounce = false;
        }, this.debounce_interval_ms);
    }

    static check_is_debounce = () => {
        if (this.is_debounce) return true;
        this.is_debounce = true;
        return false;
    }
};

// We aggregate mouse and touch events down into press, move and release events
// This is to get around undesireable behaviour such as:
// 1. Mouse up and touch end events are not registered when outside of the element
// 2. Mouse move and touch move events are not registered when outside of the element
class Surface {
    constructor(elem, is_track_movement=true) {
        this.elem = elem;
        // NOTE: Fixing Unable to preventDefault inside passive event listener due to target being treated as passive in Chrome 
        //       [Thanks to https://github.com/artisticfox8 for this suggestion]
        this.elem.style.touchAction = "none";
        this.is_track_movement = is_track_movement;

        // user overrides these callbacks
        // Position returned is relative to the top-left of the element
        this.on_press = pos => {};
        this.on_move = pos => {};
        this.on_release = pos => {};

        this.is_pressed = false;
        this.touch_ids = new Set();
        this.position = new Vector2D();

        let props = { passive: false };
        this.elem.addEventListener("touchstart", this.on_touch_start.bind(this), props);
        this.elem.addEventListener("mousedown", this.on_mouse_down.bind(this), props);
        document.addEventListener("touchend", this.on_touch_end.bind(this), props);
        document.addEventListener("mouseup", this.on_mouse_up.bind(this), props);

        if (this.is_track_movement) {
            // document.addEventListener("touchmove", this.on_touch_move.bind(this), props);
            // document.addEventListener("mousemove", this.on_mouse_move.bind(this), props);
            GlobalDebounce.on_mouse_move.add(this.on_mouse_move.bind(this));
            GlobalDebounce.on_touch_move.add(this.on_touch_move.bind(this));
        }
    }

    // Mouse events
    on_mouse_down = event => {
        event.stopPropagation();
        event.preventDefault();

        this.is_pressed = true;
        this.position = this.get_relative_position(new Vector2D(
            event.pageX, 
            event.pageY
        ));
        this.on_press(this.position);
    }

    on_mouse_move = event => {
        if (!this.is_pressed) return;

        event.stopPropagation();
        event.preventDefault();
        this.position = this.get_relative_position(new Vector2D(
            event.pageX, 
            event.pageY
        ));
        this.on_move(this.position);
    }

    on_mouse_up = event => {
        if (!this.is_pressed) return;

        event.stopPropagation();
        event.preventDefault();
        this.is_pressed = false;
        this.position = this.get_relative_position(new Vector2D(
            event.pageX, 
            event.pageY
        ));
        this.on_release(this.position);
    }

    // Touch events
    on_touch_start = event => {
        event.stopPropagation();
        event.preventDefault();

        this.is_pressed = true;
        this.touch_ids.clear();
        for (let touch of event.changedTouches) {
            this.touch_ids.add(touch.identifier);
        }

        let touch = event.changedTouches[0];
        this.position = this.get_relative_position(new Vector2D(
            touch.pageX,
            touch.pageY
        ));
        this.on_press(this.position);
    }

    on_touch_move = event => {
        if (!this.is_pressed) return;
        let touch = this.filter_touches(event.changedTouches);
        if (touch === null) return;

        event.stopPropagation();
        event.preventDefault();
        this.position = this.get_relative_position(new Vector2D(
            touch.pageX,
            touch.pageY
        ));
        this.on_move(this.position);
    } 

    on_touch_end = event => {
        if (!this.is_pressed) return;
        let touch = this.filter_touches(event.changedTouches);
        if (touch === null) return;

        event.stopPropagation();
        event.preventDefault();
        this.is_pressed = false;
        this.touch_ids.clear();
        this.position = this.get_relative_position(new Vector2D(
            touch.pageX,
            touch.pageY
        ));
        this.on_release(this.position);
    }

    filter_touches = touches => {
        for (let touch of touches) {
            let id = touch.identifier;
            if (this.touch_ids.has(id)) {
                return touch;
            }
        }
        return null;
    }

    // Utility methods
    get_relative_position = page_pos => {
        let v = new Vector2D(page_pos.x, page_pos.y);
        v.x -= this.elem.offsetLeft;
        v.y -= this.elem.offsetTop;
        return v;
    }

    get_is_pressed = () => {
        return this.is_pressed;
    }
}

export { Surface };
