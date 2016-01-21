/* This extension is a derived work of the Gnome Shell.
*
* Copyright (c) 2015 L. Bartoli
*
* This extension is free software; you can redistribute it and/or modify
* it under the terms of the GNU General Public License as published by
* the Free Software Foundation; either version 2 of the License, or
* (at your option) any later version.
*
* This extension is distributed in the hope that it will be useful,
* but WITHOUT ANY WARRANTY; without even the implied warranty of
* MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
* GNU General Public License for more details.
*
* You should have received a copy of the GNU General Public License
* along with this extension; if not, write to the Free Software
* Foundation, Inc., 59 Temple Place, Suite 330, Boston, MA 02111-1307 USA
 */

const Main = imports.ui.main;
const Me = imports.misc.extensionUtils.getCurrentExtension();
const Indicator = Me.imports.indicator;
const Settings = Me.imports.settings;

let _indicator;
let _seettings;

function init() {
    settings = new Settings.Settings();

    settings.connect("changed::position", function() {
        disable();
        enable();
  });
    
}

function enable() {
    _indicator =  new Indicator.RecentsIndicator();
 
    let pos = 0;
    if ('apps-menu' in Main.panel.statusArea)
	    pos = pos + 1;
    if ('places-menu' in Main.panel.statusArea)
        pos = pos + 1;
    
    Main.panel.addToStatusArea('recents', _indicator, pos, settings.getPosition());
}

function disable() {
    _indicator.disable();
    _indicator = null;
}
