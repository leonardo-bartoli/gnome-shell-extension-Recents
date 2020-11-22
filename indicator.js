const Gettext = imports.gettext;
const Lang = imports.lang;

const {
    Clutter,
    Gio,
    GObject,
    Meta,
    Shell,
    St
} = imports.gi;

const BoxPointer = imports.ui.boxpointer;
const Main = imports.ui.main;
const PanelMenu = imports.ui.panelMenu;
const PopupMenu = imports.ui.popupMenu;
const Tweener = imports.tweener.tweener;

const ExtensionUtils = imports.misc.extensionUtils;
const Me = ExtensionUtils.getCurrentExtension();

const ActionsItem = Me.imports.actionsItem;
const FileInfoItem = Me.imports.fileInfoItem;
const RecentManager = Me.imports.recentManager;
const SearchItem = Me.imports.searchItem;
const Settings = Me.imports.settings;


var StatusIcon = GObject.registerClass(class StatusIconClass extends St.BoxLayout {
    _init(settings) {
        super._init({style_class: 'panel-status-menu-box'});

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

class PopupMenuScrollableSection extends PopupMenu.PopupMenuSection {
    constructor() {
        super();

        this.actor = new St.ScrollView({style_class: 'vfade', hscrollbar_policy: St.PolicyType.NEVER, vscrollbar_policy: St.PolicyType.NEVER});
        this.actor.add_actor(this.box);
        this.actor._delegate = this;
        this.isOpen = true;
    }
};

var RecentsIndicator = GObject.registerClass(class RecentsIndicatorClass extends PanelMenu.Button {

        _init() {
            super._init(0.0, 'Recents');
            this._settings = Settings.getSettings();

            this.RecentManager = new RecentManager.RecentManager({
                itemsNumber: this._settings.get_int('items-number'),
                caseSensitive: this._settings.get_boolean('case-sensitive'),
                fileFullPath: this._settings.get_boolean('file-full-path')
            });

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

            this._conhandler = this.RecentManager.connect('items-changed', this._rerender.bind(this));

            this._changedRecentShortcutHandler = Lang.bind(this, function() {
                this._unbindShortcut();
                this._bindShortcut();
            });
            this._settings.connect('changed::recents-shortcut', this._changedRecentShortcutHandler);

            this._changedCaseSensitiveHandler = Lang.bind(this, function() {
                this.RecentManager.caseSensitive = this._settings.get_boolean('case-sensitive');
                this._rerender();
            });
            this._settings.connect('changed::case-sensitive', this._changedCaseSensitiveHandler);

            this._changedFileFullPathHandler = Lang.bind(this, function() {
                this.RecentManager.fileFullPath = this._settings.get_boolean('file-full-path');
                this._rerender();
            });
            this._settings.connect('changed::file-full-path', this._changedFileFullPathHandler);

            this._changedItemsNumberHandler = Lang.bind(this, function() {
                this.RecentManager.itemsNumber = this._settings.get_int('items-number');
                this._rerender();
            });
            this._settings.connect('changed::items-number', this._changedItemsNumberHandler);

            this._changedPopupMenuWidthHandler = this._setStyle.bind(this);
            this._settings.connect('changed::popup-menu-width', this._changedPopupMenuWidthHandler);

            this._changeStatusIconHandler = this._updateStatusIcon.bind(this);
            this._settings.connect('changed::use-icon', this._changeStatusIconHandler);
            this._settings.connect('changed::label', this._changeStatusIconHandler);
            this._settings.connect('changed::show-arrow', this._changeStatusIconHandler);

            this._bindShortcut();
        }

        _onDestroy() {

            this._settings.disconnect(this._changedRecentShortcutHandler);
            this._settings.disconnect(this._changedCaseSensitiveHandler);
            this._settings.disconnect(this._changedFileFullPathHandler);
            this._settings.disconnect(this._changedItemsNumberHandler);
            this._settings.disconnect(this._changedPopupMenuWidthHandler);
            this._settings.disconnect(this._changeStatusIconHandler);

            this._unbindShortcut();
            this.RecentManager.disconnect(this._conhandler);

            super._onDestroy();
        }

        getPosition() {
            return this._settings.getPosition();
        }

        _rerender() {
            this._body.removeAll();
            this._renderBody(this._searchItem.text);
        }

        _renderHeader() {
            this._searchItem = new SearchItem.SearchItem();
            this._searchItem.connect('text-changed', this._rerender.bind(this));
            this._header.addMenuItem(this._searchItem);
        }

        _renderBody(searchString) {
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
        }

        _renderFooter() {
            this._footer.addMenuItem(new ActionsItem.ActionsItem(this.RecentManager));
        }

        _updateStatusIcon() {
            this.actor.remove_child(this._statusIcon);
            this._statusIcon.destroy();
            this._statusIcon = new StatusIcon(this._settings);
            this.actor.add_child(this._statusIcon);
        }

        _setStyle() {
            this.menu.box.style = Settings.getPopupMenuStyle();
        }

        _launchFile(a, event, uri) {
            if (event.get_button() == 3) {
                uri = Gio.Vfs.get_default().get_file_for_uri(uri).get_parent().get_uri();
            }

            try {
                Gio.app_info_launch_default_for_uri(uri, global.create_app_launch_context(0, -1));
            } catch (err) {
                Main.notify(_('Recent Manager'), err.message);
            }
        }

        _removeItem(self, uri) {
            try {
                this.RecentManager.removeItem(uri);
                this._rerender();
            } catch (err) {
                log(err);
            }
        }

        _shortcutHandler() {
            this.menu.open(true);
            this._searchItem.grab_key_focus();
        }

        _bindShortcut() {
            if (Main.wm.addKeybinding && Shell.ActionMode) { // introduced in 3.8
                Main.wm.addKeybinding('recents-shortcut', this._settings, Meta.KeyBindingFlags.NONE, Shell.ActionMode.ALL, this._shortcutHandler.bind(this));
            } else {
                log('key binding require shell version > 3.8');
            }
        }

        _unbindShortcut() {
            if (Main.wm.removeKeybinding) { // introduced in 3.8
                Main.wm.removeKeybinding('recents-shortcut');
            } else {
                log('key binding require shell version > 3.8');
            }
        }
    }
);
