// check out: https://www.geeksforgeeks.org/how-to-detect-if-node-is-added-or-removed-inside-a-dom-element/

const tmui_controls = ({
    modal_toggle_duration = 500,
    theme_toggle_duration = 500,
    hold_duration = 500,
    theme = document.documentElement.classList.contains("light") ? "light" : "dark"
} = {}) => {

    // <CSS VARIABLES>
    const root = document.querySelector(":root");

    const set_css_variable = (name, value) => {
        root.style.setProperty("--" + String(name), String(value));
    }

    const get_css_variable = (name) => {
        return root.style.getProperty("--" + String(name));
    }
    // </CSS VARIABLES>
    
    // <MODALS>
    const modals = [];

    class modal {
        open() {
            this.element.style.display = "block";
            document.querySelector("#modal_background").style.display = "block";

            setTimeout(() => {
                document.querySelector("#modal_background").classList.add("open");
                this.element.classList.add("open");
            }, 10);

            this.is_open = true;
        }

        close(other_modal_opened) {
            setTimeout(() => {
                if (!other_modal_opened) document.querySelector("#modal_background").classList.remove("open");
                this.element.classList.remove("open");
            }, 10);

            setTimeout(() => {
                this.element.style.display = "none";
                if (!other_modal_opened) document.querySelector("#modal_background").style.display = "none";
            }, modal_toggle_duration);


            this.is_open = false;
        }

        constructor (element) {
            if (modals.find(m => m.element == element)) return;

            this.is_open = false;
            this.element = element;
            this.id = modals.length;
            this.element.setAttribute("modal-id", this.id);

            modals.push(this);
        }
    }

    const open_modal = (element) => { modals.filter(m => m.is_open).forEach(m => m.close("other modal opened")); modals.find(m => m.id == element.getAttribute("modal-id")).open() };
    const close_modal = (element, other_modal_opened = false) => modals.find(m => m.id == element.getAttribute("modal-id")).close(other_modal_opened);

    create_modal = (element) => new modal(element);
    // </MODALS>

    // <THEME>
    let color_theme = theme;

    const set_theme = (new_theme) => {
        color_theme = new_theme;

        document.documentElement.classList.add("color_transition");
        setTimeout(() => {
            document.documentElement.classList.remove("light", "dark");
            document.documentElement.classList.add(color_theme);

            setTimeout(() => {
                document.documentElement.classList.remove("color_transition");
            }, theme_toggle_duration);
        }, 10);
    }
    // </THEME>

    // <BUTTONS>
    const create_icon_button = (element) => { fetch(element.getAttribute("tm-source") || "https://icons.getbootstrap.com/assets/icons/chevron-expand.svg").then(res => res.text()).then(text => element.innerHTML += text) };
    // </BUTTONS>

    // <COLORS>
    const create_color = (element) => { 
        element.addEventListener("load", () => { element.style.borderWidth = (element.getBoundingClientRect().width / 10) + "px"; });
        element.addEventListener("click", () => {
            if (element.parentElement.matches(".color_list")) for (const col of element.parentElement.children) col.classList.remove("active");
            element.classList.add("active");

        })
    }
    // </COLORS>

    // <HOLDABLES>
    let pressed_element = undefined, hold_interrupted = false, hold_counter = 0;
    const element_down = (element) => {
        pressed_element = element;
        hold_interrupted = false;
        hold_counter++;
        let this_hold_counter = hold_counter;
        setTimeout(() => {
            if (pressed_element == element && hold_counter == this_hold_counter && !hold_interrupted) {
                this.pressed_element = undefined;
                element.dispatchEvent(new Event("contextmenu"));
            }
        }, hold_duration);
    }

    const element_up = (element) => {
        if (pressed_element) hold_interrupted = true;
        pressed_element = undefined;
    }


    const create_holdable = (element) => {
        element.addEventListener('mousedown',  () => { element_down(element) });
        element.addEventListener('touchstart', () => { element_down(element) }, { passive: true });
        element.addEventListener('mouseup',  () => { element_up(element) });
        element.addEventListener('touchend', () => { element_up(element) });
    }
    // </HOLDABLES>

    // <ON START>
    const constructor = () => {
        // <MODALS>

            // <MODAL BACKGROUND>
            const modal_background = document.createElement("div");
            modal_background.setAttribute("id", "modal_background")
            document.body.insertBefore(modal_background, document.body.querySelector(".modal"));
            modal_background.addEventListener("click", () => { modals.find(m => m.is_open).close() });
            // </MODAL BACKGROUND>


        document.body.addEventListener("click", e => {
            if (e.target.classList.contains("modal_handler")) {
                if (e.target.getAttribute("tm-role") == "close") close_modal(document.querySelector(e.target.getAttribute("tm-for")));
                else open_modal(document.querySelector(e.target.getAttribute("tm-for")));
            }
            if (e.target.classList.contains("toggle")) {
                e.target.classList.toggle("active");
            }
        })


        set_css_variable("modal-toggle-duration", String(modal_toggle_duration/1000) + "s");
        set_css_variable("theme-toggle-duration", String(theme_toggle_duration/1000) + "s");

        document.querySelectorAll(".modal").forEach(element => create_modal(element));
        // </MODALS>

        // <BUTTONS>
        document.querySelectorAll(".icon_button, .dropdown").forEach(element => create_icon_button(element));
        // </BUTTONS>

        // <COLORS>
        document.querySelectorAll(".color_list").forEach(element => {
            for (const col of element.getAttribute("tm-colors").split(" ")) {
                const el = document.createElement("div");
                el.classList.add("color");
                el.style.color = col;
                element.appendChild(el);
            }
            element.style.gridTemplateColumns = "repeat(" + element.children.length + ", 1fr)";
        });

        document.querySelectorAll(".color").forEach(element => create_color(element));
        // </COLORS>

        // <EVENTS>
            // <HOLDABLES>
            document.querySelectorAll(".holdable").forEach(element => create_holdable(element));
            // </HOLDABLES>

            window.addEventListener("contextmenu", (e) => { e.preventDefault(); });
        // </EVENTS>

        // <NEW NODES>
        const mutation_observer = new MutationObserver((mutation_list) => {
            mutation_list.forEach((mutation) => {
                if (mutation.type === 'childList') {
                    for (const node of mutation.addedNodes) {
                        if (!node.tagName || ["path"].includes(node.tagName)) continue;
                        if (node.matches(".modal")) create_modal(node);
                        if (node.matches(".icon_button, .dropdown")) create_icon_button(node);
                        if (node.matches(".holdable")) create_holdable(node);
                        if (node.matches(".color")) node.addEventListener("load", () => { node.style.borderWidth = (node.getBoundingClientRect().width / 10) + "px"; });
                    }
                }
            });
        });
        mutation_observer.observe(document.body, { childList: true, subtree: true })
        // </NEW NODES>
    }
    constructor();
    // </ON START>

    return { 
        set_css_variable, 
        get_css_variable, 
        open_modal, 
        close_modal, 
        set_theme,
    }
}