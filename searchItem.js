const St = imports.gi.St;
const Lang = imports.lang;
const Main = imports.ui.main;
const PopupMenu = imports.ui.popupMenu;
const GObject = imports.gi.GObject;

var SearchItem = GObject.registerClass(
    {
        Signals: {
            'text-changed': {}
        }
    },
    class SearchItemClass extends PopupMenu.PopupBaseMenuItem {
    
    _init() {
        super._init({
            activate: false,
            reactive: true,
            can_focus: false
        });

        this._entry = new St.Entry({
            name: 'SearchEntry',
            style_class: 'search-entry',
            track_hover: true,
            reactive: true,
            can_focus: true
        });
        this.actor.add(this._entry, { expand: true });

        this._entry.set_primary_icon(new St.Icon({
            style_class: 'search-entry-icon',
            icon_name: 'edit-find-symbolic'
        }));
		//this._entry.clutter_text.connect('text-changed', this._onTextChanged.bind(this));
		this._entry.clutter_text.connect('text-changed', Lang.bind(this, function() {
			let dummy = (this.text.length === 0);
			this._entry.set_secondary_icon((dummy) ? null : this._clearIcon);
			this.emit('text-changed');
		}));

        this._clearIcon = new St.Icon({
            style_class: 'search-entry-icon',
            icon_name: 'edit-clear-symbolic'
        });
        this._iconClickedId = 0;
        //this._entry.connect('secondary-icon-clicked', this.reset.bind(this));
        this._entry.connect('secondary-icon-clicked', Lang.bind(this, function() {
			this._entry.text = '';
			let text = this._entry.clutter_text;
			text.set_cursor_visible(true);
			text.set_selection(0, 0);
		}));
    }
    
    get text() {
        return this._entry.get_text();
    }

    reset() {
        this._entry.text = '';
        let text = this._entry.clutter_text;
        text.set_cursor_visible(true);
        text.set_selection(0, 0);
    }
    
    _onTextChanged(se, prop) {
        let dummy = (this.text.length === 0);
        this._entry.set_secondary_icon((dummy) ? null : this._clearIcon);

        this.emit('text-changed');
    }

    grab_key_focus() {
        this._entry.grab_key_focus();
    }
});
