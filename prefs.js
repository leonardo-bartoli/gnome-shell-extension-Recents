const Gettext = imports.gettext;
const _ = Gettext.gettext;

const GObject = imports.gi.GObject;
const Gio = imports.gi.Gio;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Settings = Me.imports.settings;

const SHORTCUT_COLUMN_KEY  = 0;
const SHORTCUT_COLUMN_MODS = 1;

var RecentsPrefs = GObject.registerClass(class extends Gtk.Box {

    _init(settings) {
        super._init({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 10,
            margin: 10
        });

        this._settings = settings;

        this.add(new shortcutWidget(this._settings));
        this.add(new caseSensitiveWidget(this._settings));
        this.add(new fileFullPathWidget(this._settings));
        this.add(new itemsNumberWidget(this._settings));
        this.add(new widthWidget(this._settings));
        this.add(new positionWidget(this._settings));
        this.add(new useIconWidget(this._settings));
        this.add(new labelWidget(this._settings));
        this.add(new showArrowWidget(this._settings));
    }
});

function shortcutTreeViewBox(model, handler) {
    let treeView = new Gtk.TreeView({
        visible: true,
        can_focus: true,
        headers_visible: false,
        search_column: 0,
        model: model
    });
    treeView.set_enable_search(false);
    treeView.set_search_column(-1);

    let renderer = new Gtk.CellRendererAccel({editable: true});
    renderer.connect('accel-edited', handler);

    let column = new Gtk.TreeViewColumn();
    column.pack_start(renderer, false);
    column.add_attribute(renderer, 'accel-key', SHORTCUT_COLUMN_KEY);
    column.add_attribute(renderer, 'accel-mods', SHORTCUT_COLUMN_MODS);

    let viewport = new Gtk.Viewport({
        visible: true,
        can_focus: false,
        hexpand: true,
        vexpand: false
    });

    treeView.append_column(column);
    viewport.child = treeView;
    let box = new Gtk.Box({ orientation: Gtk.Orientation.VERTICAL });
    box.pack_start(viewport, true, false, 0);

    return box;
}


var shortcutWidget = GObject.registerClass(class shortcutWidgetClass extends Gtk.Box {

        _init(settings) {
            super._init({ orientation: Gtk.Orientation.HORIZONTAL });
            this.set_baseline_position(Gtk.BaselinePosition.TOP);

            this._settings = settings;

            this._listStore = new Gtk.ListStore();
            this._listStore.set_column_types([
                GObject.TYPE_INT,
                GObject.TYPE_INT
            ]);
            this._shortcutIter = this._listStore.append();
            let _accel = this._settings.get_strv('recents-shortcut')[0];
            let [_key, _mods] = (_accel !== null) ? Gtk.accelerator_parse(_accel) : [0, 0];

            this._listStore.set(this._shortcutIter, [SHORTCUT_COLUMN_KEY, SHORTCUT_COLUMN_MODS], [_key, _mods]);

            let label = new Gtk.Label({ label: _('Popup Shortcut'), xalign: 0 });
            let treeViewBox = shortcutTreeViewBox(this._listStore, this._accelEditHandler.bind(this));
            let button = this._newDisableBtn();

            this.pack_start(label, true, true, 0);
            this.pack_end(button, false, false, 0);
            this.pack_end(treeViewBox, true, true, 10);
        }

        _newDisableBtn() {
            let button =  Gtk.Button.new_from_icon_name('edit-delete-symbolic', Gtk.IconSize.BUTTON);
            button.connect('clicked', this._disableAccel.bind(this));

            return button;
        }

        _accelEditHandler(renderer, path, key, mods, hwCode) {
            let accel = Gtk.accelerator_name(key, mods);
            if (accel === null) {
                accel = Gtk.accelerator_name(0, 0);
            }

            this._listStore.set(this._shortcutIter, [SHORTCUT_COLUMN_KEY, SHORTCUT_COLUMN_MODS], [key, mods]);
            this._settings.set_strv('recents-shortcut', [accel]);
        }

        _disableAccel() {
            let accel = Gtk.accelerator_name(0, 0);

            this._listStore.set(this._shortcutIter, [SHORTCUT_COLUMN_KEY, SHORTCUT_COLUMN_MODS], [0, 0]);
            this._settings.set_strv('recents-shortcut', [accel]);
        }
    }
);

var caseSensitiveWidget = GObject.registerClass(class caseSensitiveWidgetClass extends Gtk.Box {

    _init(settings) {
        super._init({ orientation: Gtk.Orientation.HORIZONTAL });

        this._label = new Gtk.Label({ label: _('Case Sensitive Search'), xalign: 0 });
        
        this._switch = new Gtk.Switch({ active: settings.get_boolean('case-sensitive') });
        this._switch.connect('notify::active', Lang.bind(this, function() {
            settings.set_boolean('case-sensitive', this._switch.get_state());
        }));

        this.pack_start(this._label, true, true, 0);
        this.add(this._switch);
    }
});

var positionWidget = GObject.registerClass(class positionWidgetClass extends Gtk.Box {
    
    _init(settings) {
        super._init({ orientation: Gtk.Orientation.HORIZONTAL });

        this.values = [
            {nick: 'right', name: _('Right'), id: 0 },
            {nick: 'left', name: _('Left'), id: 1 },
        ];

        this._label = new Gtk.Label({ label: _('Indicator Position'), xalign: 0 });
        let model = new Gtk.ListStore();
        model.set_column_types([GObject.TYPE_INT, GObject.TYPE_STRING]);
        this._combo = new Gtk.ComboBox({model: model});
        let renderer = new Gtk.CellRendererText();
        this._combo.pack_start(renderer, true);
        this._combo.add_attribute(renderer, 'text', 1);

        for (let i=0; i<this.values.length; i++) {
            let item = this.values[i];
            let iter = model.append();
            model.set(iter, [0, 1], [this.values[i].id, this.values[i].name]);

            if (item.id == settings.get_enum('position')) {
                this._combo.set_active(item.id);
            }
        }

        this._combo.connect('changed', Lang.bind(this, function(entry) {
            let [success, iter] = this._combo.get_active_iter();
            if (!success)
                return;

            let id = model.get_value(iter, 0);
            settings.set_enum('position', id);
        }));

        this.pack_start(this._label, true, true, 0);
        this.add(this._combo);
    }
});

var fileFullPathWidget = GObject.registerClass(class fileFullPathWidgetClass extends Gtk.Box {

    _init(settings) {
        super._init({ orientation: Gtk.Orientation.HORIZONTAL });

        this._label = new Gtk.Label({ label: _('Display File Full Path'), xalign: 0 });
        
        this._switch = new Gtk.Switch({ active: settings.get_boolean('file-full-path') });
        this._switch.connect('notify::active', Lang.bind(this, function() {
            settings.set_boolean('file-full-path', this._switch.get_state());
        }));

        this.pack_start(this._label, true, true, 0);
        this.add(this._switch);
    }
});

var itemsNumberWidget = GObject.registerClass(class itemsNumberWidgetClass extends Gtk.Box {

    _init(settings) {
        super._init({ orientation: Gtk.Orientation.HORIZONTAL });

        this._label = new Gtk.Label({ label: _('Number Of Items'), xalign: 0 });
        
        this._spin = Gtk.SpinButton.new_with_range(0, 128, 1);
        this._spin.set_value(settings.get_int('items-number'));
        this._spin.connect('changed', Lang.bind(this, function() {
            settings.set_int('items-number', this._spin.get_value_as_int());
        }));

        this.pack_start(this._label, true, true, 0);
        this.add(this._spin);
    }
});

var widthWidget = GObject.registerClass(class widthWidgetClass extends Gtk.Box {

    _init(settings) {
        super._init({ orientation: Gtk.Orientation.HORIZONTAL });
        
        this._label = new Gtk.Label({ label: _('Popup Menu Width'), xalign: 0 });

        this._spin = Gtk.SpinButton.new_with_range(400, 1280, 16);
        this._spin.set_digits(0);
        this._spin.set_value(settings.get_int('popup-menu-width'));    
        this._spin.connect('value-changed', Lang.bind(this, function() {
            settings.set_int('popup-menu-width', this._spin.get_value_as_int());
        }));

        this.pack_start(this._label, true, true, 0);
        this.add(this._spin);
    }
});

var useIconWidget = GObject.registerClass(class useIconWidgetClass extends Gtk.Box {

    _init(settings) {
        super._init({ orientation: Gtk.Orientation.HORIZONTAL });

        this._label = new Gtk.Label({ label: _('Display Indicator Icon'), xalign: 0 });
        
        this._switch = new Gtk.Switch({ active: settings.get_boolean('use-icon') });
        this._switch.connect('notify::active', Lang.bind(this, function() {
            settings.set_boolean('use-icon', this._switch.get_state());
        }));

        this.pack_start(this._label, true, true, 0);
        this.add(this._switch);
    }
});

var labelWidget = GObject.registerClass(class labelWidgetClass extends Gtk.Box {

    _init(settings) {
        super._init({ orientation: Gtk.Orientation.HORIZONTAL });

        this._label = new Gtk.Label({ label: _('Display Indicator Label'), xalign: 0 });
        this._entry = new Gtk.Entry({
            text: settings.get_string('label'),
            hexpand: true
        });
        this._entry.connect('changed', Lang.bind(this, function() {
            let entry = this._entry.get_text();
            if (entry === '' || entry === undefined) {
                entry = 'Recents';
            }
            settings.set_string('label', entry);
        }));

        this.pack_start(this._label, true, true, 0);
        this.add(this._entry);
    }
});


var showArrowWidget = GObject.registerClass(class showArrowWidgetClass extends Gtk.Box {

    _init(settings) {
        super._init({ orientation: Gtk.Orientation.HORIZONTAL });

        this._label = new Gtk.Label({ label: _('Display Indicator Arrow'), xalign: 0 });
        
        this._switch = new Gtk.Switch({ active: settings.get_boolean('show-arrow') });
        this._switch.connect('notify::active', Lang.bind(this, function() {
            settings.set_boolean('show-arrow', this._switch.get_state());
        }));

        this.pack_start(this._label, true, true, 0);
        this.add(this._switch);
    }
});

function init() {}

function buildPrefsWidget() {
    let settings = Settings.getSettings();
    let widget = new RecentsPrefs(settings);
    widget.show_all();

    return widget;
}
