import LensManager from '/core/ui/lenses/lens-manager.js';

import { ReligionColors } from '/craimasjiens-mod-pack/utilities/craimasjiens-utils.js';

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
    
        const width = GameplayMap.getGridWidth();
        const height = GameplayMap.getGridHeight();
    
        const cities = Array.from({ length: width }, (_, x) =>
            Array.from({ length: height }, (_, y) => Cities.getAtLocation({ x, y }))
        )
        .flat()
        .filter(Boolean)
        .filter((value, index, self) => self.indexOf(value) === index);
    
        const religions = new Map();
        const religionsPlotsMap = new Map();
    
        cities.forEach(city => {
            const religion = this.getReligionForCity(city);
            if (!religion) return;
            
            console.error("City "+ city.name + " has major religion " + religion.Name);
    
            religions.set(religion.ReligionType, religion);

            const plotLocations = city.getPurchasedPlots().map(plotIndex =>
                GameplayMap.getLocationFromIndex(plotIndex)
            );

            console.error(JSON.stringify(plotLocations));
    
            // If the religion is already in the map, add the new plots to the existing ones
            if (religionsPlotsMap.has(religion.ReligionType)) {
                const existingPlots = religionsPlotsMap.get(religion.ReligionType);
                religionsPlotsMap.set(religion.ReligionType, [...existingPlots, ...plotLocations]);
            } else {
                // If it's not in the map, create a new entry for the religion
                religionsPlotsMap.set(religion.ReligionType, plotLocations);
            }
        });
    
        religionsPlotsMap.forEach((plots, religionType) => {
            console.error(religionType + "= " + JSON.stringify(plots));
            this.religionOverlay.addPlots(plots, { fillColor: ReligionColors[religionType] });
        });
    }   
    
    removeLayer() {
        this.clearOverlay();
    }

    getReligionForCity(aCity) {
        return GameInfo.Religions.find(t => t.$hash == aCity.Religion?.majorityReligion);
    }
}
LensManager.registerLensLayer('cmp-religion-layer', new ReligionLensLayer());
