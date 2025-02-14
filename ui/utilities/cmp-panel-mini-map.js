/**
 * Huge shoutout to @realitymeltdown in the official Civ VII Discord for figuring this out.
 */
export class CmpPanelMiniMapDecorator {
    constructor(val) {
        this.miniMap = val;
    }

    beforeAttach() { 
    }

    afterAttach() {
        this.miniMap.createLensButton("LOC_UI_MINI_MAP_RELIGION", "cmp-religion-lens", "lens-group");
    }

    beforeDetach() { }

    afterDetach() { }

    onAttributeChanged(name, prev, next) { }
}

Controls.decorate('panel-mini-map', (val) => new CmpPanelMiniMapDecorator(val));