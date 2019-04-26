const Lang = imports.lang;

const Gio = imports.gi.Gio;
const GLib = imports.gi.GLib;
const GObject = imports.gi.GObject;
const Gtk = imports.gi.Gtk;

// Regular expression used to escape input from search entry
const escapeRegExp = /[\-\[\]\/\{\}\(\)\*\+\?\.\\\^\$\|]/g;

// Split a filename into [root, dir, basename, ext], unix version
// 'root' is just a slash, or nothing.
const splitPathRe = /^(\/?|)([\s\S]*?)((?:\.{1,2}|[^\/]+?|)(\.[^.\/]*|))(?:[\/]*)$/;

const escapeSearch = function(str) {
    return str.replace(escapeRegExp, '\\$&');
};

function splitPath(filename) {
    return splitPathRe.exec(filename).slice(1);
}

function dirname(path) {
    var result = splitPath(path),
        root = result[0],
        dir = result[1];

    if (!root && !dir) {
        // No dirname whatsoever
        return '.';
    }

    if (dir) {
        // It has a dirname, strip trailing slash
        dir = dir.substr(0, dir.length - 1);
    }

    return root + dir;
}

var RecentManager = GObject.registerClass(
    {
        Signals: {
            'items-changed': {}
        }
    },
    class RecentManager extends GObject.Object {

        _init(settings) {
            super._init();

            settings = settings || {};

            this.itemsNumber = settings.itemsNumber;
            this.caseSensitive = settings.caseSensitive;
            this.fileFullPath = settings.fileFullPath;

            this.proxy = new Gtk.RecentManager();

            this._items = this.proxy.get_items();
            this._itemshandler = this.proxy.connect('changed', Lang.bind(this, function() {
                this._items = this.proxy.get_items();
                this.emit('items-changed');
            }));

            this._conhandler = null;
            this._homeRegExp = new RegExp('^(' + GLib.get_home_dir() + ')');
        }

        _onDestroy() {
            this.proxy.disconnect(this._itemshandler);
        }

        removeItem(uri) {
            return this.proxy.remove_item(uri);
        }

        query(searchString) {
            searchString = searchString || '';

            let itemsNumber = this.itemsNumber === 0 ? this._items.length : Math.min(this._items.length, this.itemsNumber);

            if (searchString.length === 0) {
                if (itemsNumber == this._items.length) {
                    return this._items;
                }
                return this._items.slice(0, itemsNumber);
            }

            let reg = null;
            if (this.caseSensitive) {
                reg = new RegExp(escapeSearch(searchString));
            } else {
                reg = new RegExp(escapeSearch(searchString), 'i');
            }
            
            let out = [];
            let done = (0 === this._items.lenght);
            let i = 0;
            while (!done) {
                let item = this._items[i];
                let uri = this.getItemLabel(item);
                if (reg.test(uri) === true) {
                    out.push(item);
                }

                i++;
                done = (i === this._items.length) || (out.length === itemsNumber);
            }
            return out;
        }

        getItemLabel(item) {
            if (this.fileFullPath === true) {
                return item.get_uri_display().replace(this._homeRegExp, '~');
            } else {
                return item.get_display_name();
            }
        }

        getItemDirUri(item) {
            return dirname(item.get_uri_display());
        }

        clearAll() {
            this.proxy.purge_items();
        }
    });
