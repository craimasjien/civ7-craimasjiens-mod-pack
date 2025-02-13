import LensManager from '/core/ui/lenses/lens-manager.js';

import { ReligionColors, HexToFloat4 } from '/craimasjiens-mod-pack/ui/utils/craimasjiens-utils.js';

class ReligionLensLayer {
    constructor() {
        this.religionOverlayGroup = WorldUI.createOverlayGroup("ReligionOverlayGroup", 1);
        this.religionOverlay = this.religionOverlayGroup.addPlotOverlay();
    }

    clearOverlay() {
        this.religionOverlayGroup.clearAll();
        this.religionOverlay.clear();
    }

    initLayer() {
    }

    applyLayer() {
        this.clearOverlay();

        const religions = new Map();
        const revealedPlots = [];
        const religionsPlotsMap = new Map();

        const width = GameplayMap.getGridWidth();
        const height = GameplayMap.getGridHeight();

        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const revealedState = GameplayMap.getRevealedState(GameContext.localPlayerID, x, y);
                if (revealedState != RevealedStates.HIDDEN) {
                    revealedPlots.push(GameplayMap.getIndexFromXY(x, y));
                }
            }
        }

        const cities = Array.from({ length: width }, (_, x) =>
            Array.from({ length: height }, (_, y) => Cities.getAtLocation({ x, y }))
        ).flat().filter(Boolean).filter((value, index, self) => self.indexOf(value) === index);

        cities.forEach(city => {
            const religion = GameInfo.Religions.find(t => t.$hash == city.Religion?.majorityReligion);
            if (!religion) return;

            religions.set(religion.ReligionType, { religion: religion, city: city });
            const plotLocations = city.getPurchasedPlots();

            if (religionsPlotsMap.has(religion.ReligionType)) {
                const existingPlots = religionsPlotsMap.get(religion.ReligionType);
                religionsPlotsMap.set(religion.ReligionType, [...existingPlots, ...plotLocations]);
            } else {
                religionsPlotsMap.set(religion.ReligionType, plotLocations);
            }
        });

        for (const [religionType, plots] of religionsPlotsMap) {
            const filteredPlots = [...plots].filter(plot => revealedPlots.includes(plot));
            this.religionOverlay.addPlots(filteredPlots, { fillColor: HexToFloat4(ReligionColors[religionType]) });
        }
    }
    
    removeLayer() {
        this.clearOverlay();
    }
}
LensManager.registerLensLayer('cmp-religion-layer', new ReligionLensLayer());
