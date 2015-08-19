/*
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version. <http://www.gnu.org/licenses/>
 */

const Lang = imports.lang;

const St = imports.gi.St;

const PopupMenu = imports.ui.popupMenu;

const FileInfoItem = new Lang.Class({
    Name: 'FileInfoItem',
    Extends: PopupMenu.PopupBaseMenuItem,

    _init: function(gicon, uri) {
        this.parent('');

        this.actor.add(new St.Icon({
            gicon: gicon,
            fallback_icon_name: 'application-x-executable-symbolic',
            style_class: 'popup-menu-icon'
        }));
        this.actor.add(new St.Label({ text: uri}), { expand: true });

        this._removeBtn = new St.Button();
        this._removeBtn.child = new St.Icon({
            icon_name: 'edit-delete-symbolic',
            style_class: 'popup-menu-icon'
        });
        this._removeBtn.connect('clicked', Lang.bind(this, function() {
            this.emit('remove-item');
        }));
        this.actor.add(this._removeBtn, { x_align: St.Align.END });
    }
});
