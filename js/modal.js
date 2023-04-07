class Modal {
    constructor(elem) {
        this.elem = elem;

        if (this.elem.hasAttribute("attr-is-active")) {
            this.is_active = this.elem.getAttribute("attr-is-active") === "true";
        } else {
            this.set_is_active(false);
        }

        // Click on element background to hide modal
        this.elem.addEventListener("click", ev => {
            let is_target = ev.target === this.elem;
            if (!is_target) return;
            this.hide();
        });
    }

    set_is_active = is_active => {
        this.is_active = is_active;
        this.elem.setAttribute("attr-is-active", String(this.is_active));
    }

    hide = () => {
        this.set_is_active(false);
    }

    show = () => {
        this.set_is_active(true);
    }
}

export { Modal };