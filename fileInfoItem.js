const Lang = imports.lang;
const Clutter = imports.gi.Clutter;
const St = imports.gi.St;
const PopupMenu = imports.ui.popupMenu;
const GObject = imports.gi.GObject;

var FileInfoItem = GObject.registerClass(class FileInfoItemClass extends PopupMenu.PopupBaseMenuItem {

    _init(gicon, label, dirUri, uri, client) {
        super._init();
        
        this.icon = this.actor.add_child(new St.Icon({
            gicon: gicon,
            fallback_icon_name: 'application-x-executable-symbolic',
            style_class: 'popup-menu-icon'
        }));
        this.actor.add_child(new St.Label({ text: label, x_expand: true }));

        this._removeBtn = new St.Button({
            x_align: St.Align.END
        });
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
        this.actor.add(this._removeBtn);
    }
});
