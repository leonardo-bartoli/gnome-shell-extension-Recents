const Lang = imports.lang;
const Gio = imports.gi.Gio;
const ExtensionUtils = imports.misc.extensionUtils;
const Me = imports.misc.extensionUtils.getCurrentExtension();

var _settings = ExtensionUtils.getSettings('org.gnome.shell.extensions.recents');

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
