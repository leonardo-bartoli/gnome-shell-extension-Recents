const Lang = imports.lang;

const Clutter = imports.gi.Clutter;
const St = imports.gi.St;

const PopupMenu = imports.ui.popupMenu;

var FileInfoItem = class extends PopupMenu.PopupBaseMenuItem {

    constructor(gicon, label, dirUri, uri, client) {
        super();
        
        this.icon = this.actor.add(new St.Icon({
            gicon: gicon,
            fallback_icon_name: 'application-x-executable-symbolic',
            style_class: 'popup-menu-icon'
        }));
        this.actor.add(new St.Label({ text: label}), { expand: true });

        this._removeBtn = new St.Button();
        this._removeBtn.child = new St.Icon({
            icon_name: 'edit-delete-symbolic',
            style_class: 'popup-menu-icon'
        });
        this._removeBtn.connect('clicked', Lang.bind(this, function() {
            try {
                client.removeItem(uri);
                this.destroy();
            } catch(err) {
                log(err);
            }
            return Clutter.EVENT_STOP;
        }));
        this.actor.add(this._removeBtn, { x_align: St.Align.END });
    }
};
