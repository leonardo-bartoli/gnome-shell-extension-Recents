const Gettext = imports.gettext;
const Lang = imports.lang;

const Atk = imports.gi.Atk;
const Clutter = imports.gi.Clutter;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Meta = imports.gi.Meta;
const Shell = imports.gi.Shell;
const St = imports.gi.St;

const BoxPointer = imports.ui.boxpointer;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Tweener = imports.ui.tweener;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();
const Settings = Me.imports.settings;

const ActionsItem = Me.imports.actionsItem;
const FileInfoItem = Me.imports.fileInfoItem;
const RecentManager = Me.imports.recentManager;
const SearchItem = Me.imports.searchItem;

const StatusIcon = new Lang.Class({
    Name: 'RecentsStatusIcon',
    Extends: St.BoxLayout,

    _init: function(settings) {
        this.parent({style_class: 'panel-status-menu-box'});

        let use_icon = settings.get_boolean('use-icon'),
            label = settings.get_string('label'),
            show_arrow = settings.get_boolean('show-arrow');

        if (use_icon) {
            this._icon = new St.Icon({icon_name: 'document-open-recent-symbolic', style_class: 'system-status-icon'});
            this.add_child(this._icon);
        } else {
            this._label = new St.Label({
                text: (label === undefined)
                    ? 'Recents'
                    : label,
                y_expand: true,
                y_align: Clutter.ActorAlign.CENTER
            });
            this.add_child(this._label);
        }

        if (show_arrow) {
            this._arrow = new St.Icon({style_class: 'popup-menu-arrow', icon_name: 'pan-down-symbolic', y_expand: true, y_align: Clutter.ActorAlign.CENTER});
            this.add_child(this._arrow);
        }
    }
});

const PopupMenuScrollableSection = new Lang.Class({
    Name: 'PopupMenuScrollableSection',
    Extends: PopupMenu.PopupMenuSection,

    _init: function(sourceActor) {
        this.parent();

        this.actor = new St.ScrollView({style_class: 'vfade', hscrollbar_policy: Gtk.PolicyType.NEVER, vscrollbar_policy: Gtk.PolicyType.NEVER});
        this.actor.add_actor(this.box);
        this.actor._delegate = this;
        this.isOpen = true;
    }
});

const RecentsIndicator = new Lang.Class({
    Name: 'RecentsIndicator',
    Extends: PanelMenu.Button,

    _init: function(settings) {
        this.parent(0.0, "Recents");

        this._settings = settings;

        this.RecentManager = new RecentManager.RecentManager({itemsNumber: this._settings.get_int('items-number'), caseSensitive: this._settings.get_boolean('case-sensitive'), fileFullPath: this._settings.get_boolean('file-full-path')});

        /* Popup Menu Indicator */
        this._statusIcon = new StatusIcon(this._settings);
        this.actor.add_child(this._statusIcon);

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
        this.menu.connect('menu-closed', Lang.bind(this, function() {
            this._searchItem.reset();
        }));

        this._conhandler = this.RecentManager.connect('items-changed', Lang.bind(this, this._rerender));

        this._settings.connect('changed::recents-shortcut', Lang.bind(this, function() {
            this._unbindShortcut();
            this._bindShortcut();
        }));

        this._settings.connect('changed::case-sensitive', Lang.bind(this, function() {
            this.RecentManager.caseSensitive = this._settings.get_boolean('case-sensitive');
            this._rerender();
        }));

        this._settings.connect('changed::file-full-path', Lang.bind(this, function() {
            this.RecentManager.fileFullPath = this._settings.get_boolean('file-full-path');
            this._rerender();
        }));

        this._settings.connect('changed::items-number', Lang.bind(this, function() {
            this.RecentManager.itemsNumber = this._settings.get_int('items-number');
            this._rerender();
        }));

        this._settings.connect('changed::popup-menu-width', Lang.bind(this, this._setStyle));

        this._settings.connect('changed::use-icon', Lang.bind(this, function() {
            this._statusIcon.destroy();
            this._statusIcon = new StatusIcon(this._settings);
            this.actor.add_child(this._statusIcon);
        }));

        this._settings.connect('changed::label', Lang.bind(this, function() {
            this._statusIcon.destroy();
            this._statusIcon = new StatusIcon(this._settings);
            this.actor.add_child(this._statusIcon);
        }));

        this._settings.connect('changed::show-arrow', Lang.bind(this, function() {
            this._statusIcon.destroy();
            this._statusIcon = new StatusIcon(this._settings);
            this.actor.add_child(this._statusIcon);
        }));

        this._bindShortcut();
    },

    disable: function() {
        this._unbindShortcut();
        this.RecentManager.disconnect(this._conhandler);
        this.destroy();
    },

    getPosition: function() {
        return this._settings.getPosition();
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
            let dirUri = this.RecentManager.getItemDirUri(item);
            let gicon = Gio.content_type_get_symbolic_icon(item.get_mime_type());
            let label = this.RecentManager.getItemLabel(item);
            let menuItem = new FileInfoItem.FileInfoItem(gicon, label, dirUri, uri, this.RecentManager);

            menuItem.connect('activate', Lang.bind(this, this._launchFile, uri));

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
        } catch (err) {
            Main.notify(_('Recent Manager'), err.message);
        }
    },

    _removeItem: function(self, uri) {
        try {
            this.RecentManager.removeItem(uri);
            this._rerender();
        } catch (err) {
            log(err);
        }
    },

    _shortcutHandler: function() {
        this.menu.open(true);
        this._searchItem.grab_key_focus();
    },

    _bindShortcut: function() {
        if (Main.wm.addKeybinding && Shell.ActionMode) { // introduced in 3.8
            Main.wm.addKeybinding('recents-shortcut', this._settings, Meta.KeyBindingFlags.NONE, Shell.ActionMode.ALL, Lang.bind(this, this._shortcutHandler));
        } else {
            /* TODO: fallback for older shell version */
            log('key binding require shell version > 3.8');
        }
    },

    _unbindShortcut: function() {
        if (Main.wm.removeKeybinding) { // introduced in 3.8
            Main.wm.removeKeybinding('recents-shortcut');
        } else {
            /* TODO: fallback for older shell version */
            log('key binding require shell version > 3.8');
        }
    }
});
