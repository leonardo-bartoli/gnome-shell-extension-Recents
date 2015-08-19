/*
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version. <http://www.gnu.org/licenses/>
 */

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
        
        // let icon = new Gio.ThemedIcon({ name: 'edit-clear-symbolic' });
        // this.parent(icon, 'Clear list', {});
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
        
        // let icon = new Gio.ThemedIcon({ name: 'edit-clear-symbolic' });
        // this.parent(icon, 'Clear list', {});
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
        
        // let icon = new Gio.ThemedIcon({ name: 'edit-clear-symbolic' });
        // this.parent(icon, 'Clear list', {});
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





