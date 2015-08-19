/*
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version. <http://www.gnu.org/licenses/>
 */

const Gettext = imports.gettext;
const Lang = imports.lang;

const Clutter = imports.gi.Clutter;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const St = imports.gi.St;
const Atk = imports.gi.Atk;

const BoxPointer = imports.ui.boxpointer;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Tweener = imports.ui.tweener;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const ActionsItem = Me.imports.actionsItem;
const FileInfoItem = Me.imports.fileInfoItem;
const RecentManager = Me.imports.recentManager;
const SearchItem = Me.imports.searchItem;
const Settings = Me.imports.settings;

const StatusIcon = new Lang.Class({
    Name: 'RecentsStatusIcon',
    Extends: St.BoxLayout,

    _init: function() {
        this.parent({ style_class: 'panel-status-menu-box' });

        this.add_child(new St.Icon({
            icon_name: 'document-open-recent-symbolic',
            style_class: 'system-status-icon'
        }));

        this.add_child(new St.Icon({
            style_class: 'popup-menu-arrow',
            icon_name: 'pan-down-symbolic',
            y_expand: true,
            y_align: Clutter.ActorAlign.CENTER
        }));
    }
});

const PopupMenuScrollableSection = new Lang.Class({
    Name: 'PopupMenuScrollableSection',
    Extends: PopupMenu.PopupMenuSection,

    _init: function(sourceActor) {
        this.parent();

        this.actor = new St.ScrollView({
            style_class: 'vfade',
            hscrollbar_policy: Gtk.PolicyType.NEVER,
            vscrollbar_policy: Gtk.PolicyType.NEVER
            // vscrollbar_policy: Gtk.PolicyType.AUTOMATIC
        });
        this.actor.add_actor(this.box);
        this.actor._delegate = this;
        this.isOpen = true;
    }
});

const RecentsIndicator = new Lang.Class({
    Name: 'RecentsIndicator',
    Extends: PanelMenu.Button,

    _init: function() {
        this.parent(0.0, "Recents");

        this._settings = new Settings.Settings(Me);


        this.RecentManager = new RecentManager.RecentManager({
            itemsNumber: this._settings.get_int('items-number'),
            caseSensitive: this._settings.get_boolean('case-sensitive'),
            fileFullPath: this._settings.get_boolean('file-full-path')
        });
        this.actor.add_child(new StatusIcon());

        /* Popup Menu header */
        this._header = new PopupMenu.PopupMenuSection();
        this._renderHeader();

        /* Popup Menu body */
        this._body = new PopupMenuScrollableSection();
        this._renderBody();

        /* Popup Menu footer */
        this._footer = new PopupMenu.PopupMenuSection();
        this._renderFooter();

        this._setStyle();
        
        this.menu.addMenuItem(this._header);
        this.menu.addMenuItem(this._body);
        this.menu.addMenuItem(new PopupMenu.PopupSeparatorMenuItem());
        this.menu.addMenuItem(this._footer);

        /* Connect signals */
        this.RecentManager.connect(Lang.bind(this, this._rerender));
        this._settings.connect('changed::items-number', Lang.bind(this, function() {
            this.RecentManager.itemsNumber = this._settings.get_int('items-number');
            this._rerender();            
        }));
        this._settings.connect('changed::case-sensitive', Lang.bind(this, function() {
            this.RecentManager.caseSensitive = this._settings.get_boolean('case-sensitive');
            this._rerender();
        }));
        this._settings.connect('changed::file-full-path', Lang.bind(this, function() {
            this.RecentManager.fileFullPath = this._settings.get_boolean('file-full-path');
            this._rerender();
        }));
        this._settings.connect('changed::popup-menu-width', Lang.bind(this, this._setStyle));
    },

    disable: function() {
        this._settings.disconnect('changed::items-number');
        this._settings.disconnect('changed::case-sensitive');
        this._settings.disconnect('changed::file-full-path');
        this._settings.disconnect('changed::popup-menu-width');
        this.RecentManager.disconnect();
        this.destroy();
    },

    _rerender: function() {
        this._body.removeAll();
        this._renderBody(this._searchItem.text);
    },

    _renderHeader: function() {
        this._searchItem = new SearchItem.SearchItem();
        this._searchItem.connect('text-changed', Lang.bind(this, this._rerender));
        this._header.addMenuItem(this._searchItem);
    },
    
    _renderBody: function(searchString) {
        let items = this.RecentManager.query(searchString);

        for (let i = 0; i < items.length; ++i) {
            let item = items[i];

            let uri = item.get_uri();
            let gicon = Gio.content_type_get_symbolic_icon(item.get_mime_type());
            let label = this.RecentManager.getItemUri(item);
            let menuItem = new FileInfoItem.FileInfoItem(gicon, label);

            menuItem.connect('activate', Lang.bind(this, this._launchFile, uri ));
            menuItem.connect('remove-item', Lang.bind(this, this._removeItem, uri ));
            
            this._body.addMenuItem(menuItem);
        }
    },

    _renderFooter: function() {
        this._footer.addMenuItem(new ActionsItem.ActionsItem(this.RecentManager));
    },

    _setStyle: function() {
        this.menu.box.style = this._settings.getPopupMenuStyle();
    },
    
    _launchFile: function(a, b, c) {
        try {
            Gio.app_info_launch_default_for_uri(c, global.create_app_launch_context(0, -1));
        }
        catch(err) {
            Main.notify(_('Recent Manager'), err.message);
        }
    },

    _removeItem: function(self, uri) {
        this.RecentManager.removeItem(uri);
    }
});

