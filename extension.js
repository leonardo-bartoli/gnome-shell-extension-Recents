/*
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version. <http://www.gnu.org/licenses/>
*/

const Main = imports.ui.main;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Indicator = Me.imports.indicator;

function init() {}

function enable() {
    Main.panel.addToStatusArea('recents', new Indicator.RecentsIndicator());
}

function disable() {
    Main.panel.addToStatusArea.recents.disable();
}
