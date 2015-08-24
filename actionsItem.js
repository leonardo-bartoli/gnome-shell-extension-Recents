const Gettext = imports.gettext;
const Lang = imports.lang;

const St = imports.gi.St;
const Clutter = imports.gi.Clutter;

const Util = imports.misc.util;

const PopupMenu = imports.ui.popupMenu;


const InfoBtn = new Lang.Class({
    Name: 'InfoBtn',
    Extends: St.Button,

    _init: function() {
        this.parent({
            reactive: true,
            can_focus: true,
            track_hover: true,
            style_class: 'system-menu-action'
        });

        this.child = new St.Icon({
            icon_name: 'dialog-information-symbolic'
        });
    }
});

const ClearBtn = new Lang.Class({
    Name: 'ClearBtn',
    Extends: St.Button,

    _init: function() {
        this.parent({
            reactive: true,
            can_focus: true,
            track_hover: true,
            style_class: 'system-menu-action'
        });

        this.child = new St.Icon({
            icon_name: 'edit-clear-all-symbolic'
        });
    }
});

const PrefsBtn = new Lang.Class({
    Name: 'PrefsBtn',
    Extends: St.Button,

    _init: function() {
        this.parent({
            reactive: true,
            can_focus: true,
            track_hover: true,
            style_class: 'system-menu-action'
        });

        this.child = new St.Icon({
            icon_name: 'preferences-system-symbolic'
        });
    }
});

const ClearBtnItem = new Lang.Class({
    Name: 'ClearBtnItem',
    Extends: St.BoxLayout,

    _init: function() {
        this.parent({ style_class: 'popup-menu-item' });
        
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
});

const ActionsItem = new Lang.Class({
    Name: 'ActionsItem',
    Extends: PopupMenu.PopupBaseMenuItem,

    _init: function(recentManager) {
        this.parent({
            reactive: false,
            can_focus: false
        });

        let _clear = new ClearBtn();
        _clear.connect('clicked', recentManager.clearAll);

        let _prefs = new PrefsBtn();
        _prefs.connect('clicked', function() {
            Util.spawn(['gnome-shell-extension-prefs', 'Recents@leonardo.bartoli.gmail.com']);
        });
        
        this.actor.add(_clear, { expand: true, x_fill: false });
        this.actor.add(_prefs, { expand: true, x_fill: false });
    }
});





