import LensManager from '/core/ui/lenses/lens-manager.js';
class ReligionLens {
    constructor() {
        this.activeLayers = new Set([
            'fxs-hexgrid-layer',
            'fxs-culture-borders-layer',
            'cmp-religion-layer'
        ]);
        this.allowedLayers = new Set([
        ]);
    }
}
LensManager.registerLens('cmp-religion-lens', new ReligionLens());
