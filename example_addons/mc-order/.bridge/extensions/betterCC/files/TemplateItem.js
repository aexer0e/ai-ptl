class TemplateItem extends bCC.Template {
    getSource = () => this._opts.sourceBlock();

    getIdentifier() {
        try {
            return this.getSource()["minecraft:item"]["description"]["identifier"];
        } catch {
            return null;
        }
    }
}
TemplateItem;
