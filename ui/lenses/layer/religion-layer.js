import LensManager from '/core/ui/lenses/lens-manager.js';

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

        const cities = [];

        const width = GameplayMap.getGridWidth();
        const height = GameplayMap.getGridHeight();
        for (let x = 0; x < width; x++) {
            for (let y = 0; y < height; y++) {
                const location = { x: x, y: y };

                const thisCity = Cities.getAtLocation(location);

                if (!thisCity)
                    continue;

                cities.push(thisCity);
            }
        }

        const religions = new Map();
        const religionsPlotsMap = new Map();

        cities.forEach((city) => {
            const religion = this.getReligionForCity(city);
            if (!religion)
                return;
            
            religions.set(religion.Name, religion);

            const plotLocations = [];
            const cityPlots = city.getPurchasedPlots();
            for (let plotIndex = 0; plotIndex < cityPlots.length; plotIndex++) {
                const plot = GameplayMap.getLocationFromIndex(cityPlots[plotIndex]);

                plotLocations.push(plot);
            }

            religionsPlotsMap.set(religion.Name, plotLocations);
        });

        religionsPlotsMap.forEach((religionPlots, key) => {
            const religion = religions.get(key);
            this.religionOverlay.addPlots(religionPlots, { fillColor: religion.Color });
        });
    }
    
    removeLayer() {
        this.clearOverlay();
    }

    getReligionForCity(aCity) {
        return GameInfo.Religions.find(t => t.$hash == aCity.Religion?.majorityReligion);
    }

    assertReligion(location) {
        var religions = [];

        const thisCity = Cities.getAtLocation(location);

        if (!thisCity)
            return religions;

        const religion = GameInfo.Religions.find(t => t.$hash == thisCity?.Religion?.majorityReligion);

        if (!religion)
            return religions;

        const cityPlots = thisCity.getPurchasedPlots();
        for (let plotIndex = 0; plotIndex < cityPlots.length; plotIndex++) {
            const plot = GameplayMap.getLocationFromIndex(plotIndex);

            religions[religion.Name] = []
        }
        return religions;
    }
}
LensManager.registerLensLayer('cmp-religion-layer', new ReligionLensLayer());
