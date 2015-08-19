const Gettext = imports.gettext;
const _ = Gettext.gettext;
const Gtk = imports.gi.Gtk;
const Lang = imports.lang;

const Me = imports.misc.extensionUtils.getCurrentExtension();
const Settings = Me.imports.settings;

function init() {}

const RecetsPrefs = new Lang.Class({
    Name: 'RecentsPrefs',
    Extends: Gtk.Box,

    _init: function(settings) {
        this.parent({
            orientation: Gtk.Orientation.VERTICAL,
            spacing: 10,
            margin: 10
        });

        this._settings = settings;

        this.add(new caseSensitiveWidget(this._settings));
        this.add(new fileFullPathWidget(this._settings));
        this.add(new itemsNumberWidget(this._settings));
        this.add(new widthWidget(this._settings));
    }
});

const caseSensitiveWidget = Lang.Class({
    Name: 'caseSensitiveSearchWidget',
    Extends: Gtk.Box,

    _init: function(settings) {
        this.parent({ orientation: Gtk.Orientation.HORIZONTAL });

        this._label = new Gtk.Label({ label: _('Case Sensitive Search'), xalign: 0 });
        
        this._switch = new Gtk.Switch({ active: settings.get_boolean('case-sensitive') });
        this._switch.connect('notify::active', Lang.bind(this, function() {
            settings.set_boolean('case-sensitive', this._switch.get_state());
	    }));

	    this.pack_start(this._label, true, true, 0);
	    this.add(this._switch);
    }
});


const fileFullPathWidget = Lang.Class({
    Name: 'fileFullPathWidget',
    Extends: Gtk.Box,

    _init: function(settings) {
        this.parent({ orientation: Gtk.Orientation.HORIZONTAL });

        this._label = new Gtk.Label({ label: _('Display File Full Path'), xalign: 0 });
        
        this._switch = new Gtk.Switch({ active: settings.get_boolean('file-full-path') });
        this._switch.connect('notify::active', Lang.bind(this, function() {
            settings.set_boolean('file-full-path', this._switch.get_state());
	    }));

	    this.pack_start(this._label, true, true, 0);
	    this.add(this._switch);
    }
});

const itemsNumberWidget = Lang.Class({
    Name: 'itemsNumberWidget',
    Extends: Gtk.Box,

    _init: function(settings) {
        this.parent({ orientation: Gtk.Orientation.HORIZONTAL });

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

const widthWidget = Lang.Class({
    Name: 'widthWidget',
    Extends: Gtk.Box,

    _init: function(settings) {
        this.parent({ orientation: Gtk.Orientation.HORIZONTAL });
        
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

function buildPrefsWidget() {
    let widget = new RecetsPrefs(new Settings.Settings(Me));
    widget.show_all();

	return widget;
}




