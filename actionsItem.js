const Gettext = imports.gettext;
const Lang = imports.lang;

const St = imports.gi.St;
const Clutter = imports.gi.Clutter;

const Util = imports.misc.util;

const PopupMenu = imports.ui.popupMenu;


var InfoBtn = class InfoBtnClass extends St.Button {

    constructor() {
        super({
            reactive: true,
            can_focus: true,
            track_hover: true,
            style_class: 'system-menu-action'
        });

        this.child = new St.Icon({
            icon_name: 'dialog-information-symbolic'
        });
    }
};

var ClearBtn = class ClearBtnClass extends St.Button {
    constructor() {
        super({
            reactive: true,
            can_focus: true,
            track_hover: true,
            style_class: 'system-menu-action'
        });

        this.child = new St.Icon({
            icon_name: 'edit-clear-all-symbolic'
        });
    }
};

var PrefsBtn = class PrefsBtnClass extends St.Button {
    constructor() {
        super({
            reactive: true,
            can_focus: true,
            track_hover: true,
            style_class: 'system-menu-action'
        });

        this.child = new St.Icon({
            icon_name: 'preferences-system-symbolic'
        });
    }
};

var ClearBtnItem = class ClearBtnItemClass extends St.BoxLayout {

    constructor() {
        super({ style_class: 'popup-menu-item' });
        
        let _icon =  new St.Icon({
            icon_name: 'edit-clear-all-symbolic',
            style_class: 'popup-menu-icon'
        });

        let _label = new St.Label({
            text: _('Clear All'),
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER
        });

        this.add_child(_icon);
        this.add_child(_label);
    }
};

var ActionsItem = class ActionsItemClass extends PopupMenu.PopupBaseMenuItem {

    constructor(recentManager) {
        super({
            reactive: false,
            can_focus: false
        });

        let _prefs = new PrefsBtn();
        _prefs.connect('clicked', function() {
            Util.spawn(['gnome-shell-extension-prefs', 'Recents@leonardo.bartoli.gmail.com']);
        });

        let _clear = new ClearBtn();
        _clear.connect('clicked', recentManager.clearAll.bind(recentManager));
        
        this.actor.add(_prefs, { expand: true, x_fill: false });
        this.actor.add(_clear, { expand: true, x_fill: false });
    }
};

