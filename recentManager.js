/*
    This program is free software: you can redistribute it and/or modify
    it under the terms of the GNU General Public License as published by
    the Free Software Foundation, either version 3 of the License, or
    (at your option) any later version. <http://www.gnu.org/licenses/>
 */


const Lang = imports.lang;

const Gtk = imports.gi.Gtk;

function escapeRegExp(str) {
    return str.replace(/[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g, "\\$&");
}

const RecentManager = new Lang.Class({
    Name: 'RecentManager',
    
    _init: function(settings) {
        settings = settings || {};

        log(settings);
        this.itemsNumber = settings.itemsNumber;
        this.caseSensitive = settings.caseSensitive;
        this.fileFullPath = settings.fileFullPath;
        
        this.proxy = new Gtk.RecentManager();

        this._items = this.proxy.get_items();
        this._itemshandler = this.proxy.connect('changed', Lang.bind(this, function() {
            this._items = this.proxy.get_items();
        }));

        this._conhandler = null;
    },
    
    _onDestroy: function() {
        this.proxy.disconnect(this._itemshandler);
        this.proxy.disconnect(this._conhandler);
    },

    connect: function(fn) {
        this._conhandler = this.proxy.connect('changed', fn);
        return this._conhandler;
    },

    disconnect: function() {
        this.proxy.disconnect(this.conhandler);
    },

    removeItem: function(uri) {
        return this.proxy.remove_item(uri);
    },

    query: function(searchString) {
        searchString = searchString || '';
        let itemsNumber = this.itemsNumber == 0 ? this._items.length : Math.min(this._items.length, this.itemsNumber);

        if (searchString.length === 0) {
            if (itemsNumber == this._items.length) {
                return this._items;
            }

            return this._items.slice(0, itemsNumber);
        }

        let reg = null;
        if (this.caseSensitive) {
            reg = new RegExp(escapeRegExp(searchString));
        } else {
            reg = new RegExp(escapeRegExp(searchString), 'i');
        }
        
        let out = new Array();
        let done = (0 === this._items.lenght);
        let i = 0;
        while (!done) {
            let item = this._items[i];
            let uri = this.getItemUri(item);
            if (reg.test(uri) === true) {
                out.push(item);
            }
            
            i++;
            done = (i === this._items.length) || (out.length === itemsNumber);
        }
        return out;
    },

    getItemUri: function(item) {
        if (this.fileFullPath === true) {
            return item.get_uri_display();
        } else {
            return item.get_display_name();
        }
    },
    
    clearAll: function() {
        this.proxy.purge_items();
    }
});
