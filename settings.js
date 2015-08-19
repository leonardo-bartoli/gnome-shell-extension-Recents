const Lang = imports.lang;
const Gio = imports.gi.Gio;

function getFromSchema(extension) {
	let schema = 'org.gnome.shell.extensions.recents';

	const GioSSS = Gio.SettingsSchemaSource;
	let schemaDir = extension.dir.get_child('schemas');
	let schemaSource;
	if (schemaDir.query_exists(null)) {
		schemaSource = GioSSS.new_from_directory(schemaDir.get_path(),
				                                 GioSSS.get_default(),
				                                 false);
	} else {
		schemaSource = GioSSS.get_default();
	}

	let schemaObj = schemaSource.lookup(schema, true);
	if (!schemaObj) {
		throw new Error('Schema ' + schema + ' could not be found for extension ' +
				extension.metadata.uuid + '. Please check your installation.');
	}

	return new Gio.Settings({settings_schema: schemaObj});
};

const Settings = new Lang.Class({
    Name: 'Settings',
    Extends: Gio.Settings,
    ItemIconSize: 16,
    
    _init: function(extension) {
        
	    let schema = 'org.gnome.shell.extensions.recents';
        
	    const GioSSS = Gio.SettingsSchemaSource;
	    let schemaDir = extension.dir.get_child('schemas');
	    let schemaSource;
	    if (schemaDir.query_exists(null)) {
		    schemaSource = GioSSS.new_from_directory(schemaDir.get_path(),
				                                     GioSSS.get_default(),
				                                     false);
	    } else {
		    schemaSource = GioSSS.get_default();
	    }

	    let schemaObj = schemaSource.lookup(schema, true);
	    if (!schemaObj) {
		    throw new Error('Schema ' + schema + ' could not be found for extension ' +
				            extension.metadata.uuid + '. Please check your installation.');
	    }

        this.parent({settings_schema: schemaObj});
    },

    getPopupMenuStyle: function() {
        let style = '';
        
        let _popupMenuWidth = this.get_int('popup-menu-width');
        if (_popupMenuWidth != undefined && _popupMenuWidth != 0) {
            style += 'width:' + _popupMenuWidth + 'px;';
        }
       
        return style;
    }
});
