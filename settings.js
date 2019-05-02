const Lang = imports.lang;
const Gio = imports.gi.Gio;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = imports.misc.extensionUtils.getCurrentExtension();


function getFromSchema(schema) {

    const GioSSS = Gio.SettingsSchemaSource;
    let schemaDir = Me.dir.get_child('schemas');
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
}

var _settings = getFromSchema('org.gnome.shell.extensions.recents');

const _POSITION = {
    RIGHT: 0,
    LEFT:  1
};

var getSettings = function() {
    return _settings;
};

var getPopupMenuStyle = function() {
    let style = '';

    let _popupMenuWidth = _settings.get_int('popup-menu-width');
    if (_popupMenuWidth !== undefined && _popupMenuWidth !== 0) {
        style += 'width:' + _popupMenuWidth + 'px;';
    }

    return style;
};

var getPosition = function() {
    if (_settings.get_enum('position') === _POSITION.LEFT) {
        return 'left';
    }

    return 'right';
};
