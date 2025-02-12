import LensManager from '/core/ui/lenses/lens-manager.js';

import { DISCOVERY_COLOR }  from '/craimasjiens-mod-pack/utilities/craimasjiens-utils.js';

class ReligionLensLayer {
    constructor() {
        this.religionOverlayGroup = WorldUI.createOverlayGroup("ReligionOverlayGroup", 1);
        this.religionOverlay = this.religionOverlayGroup.addPlotOverlay();
        this.religionPlots = [];
    }
    clearOverlay() {
        this.religionOverlayGroup.clearAll();
        this.religionOverlay.clear();
        this.religionPlots = [];
    }
    initLayer() {
    }
    applyLayer() {
        this.clearOverlay();

        const width = GameplayMap.getGridWidth();
        const height = GameplayMap.getGridHeight();
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                if (this.assertReligion(x, y)) {
                    this.religionPlots.push({x, y});
                }
            }
        }
        this.religionOverlay.addPlots(this.religionPlots, { fillColor: DISCOVERY_COLOR });
    }
    removeLayer() {
        this.clearOverlay();
    }

    assertReligion(plotX, plotY) {
        const city = 
    }
}
LensManager.registerLensLayer('cmp-religion-layer', new ReligionLensLayer());
