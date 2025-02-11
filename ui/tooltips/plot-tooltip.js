/**
 * Plot Tooltips
 * @copyright 2022, Firaxis Gmaes
 * @description The tooltips that appear based on the cursor hovering over world plots.
 */
import TooltipManager, { PlotTooltipPriority } from '/core/ui/tooltips/tooltip-manager.js';
import { ComponentID } from '/core/ui/utilities/utilities-component-id.js';
import DistrictHealthManager from '/base-standard/ui/district/district-health-manager.js';
import LensManager from '/core/ui/lenses/lens-manager.js';
class PlotTooltipType {
    constructor() {
        this.plotCoord = null;
        this.isShowingDebug = true;
        this.tooltip = document.createElement('fxs-tooltip');
        this.container = document.createElement('div');
        this.yieldsFlexbox = document.createElement('div');
        this.tooltip.classList.add('plot-tooltip', 'max-w-96');
        this.tooltip.appendChild(this.container);
        Loading.runWhenFinished(() => {
            for (const y of GameInfo.Yields) {
                const url = UI.getIcon(`${y.YieldType}`, "YIELD");
                Controls.preloadImage(url, 'plot-tooltip');
            }
        });
    }
    getHTML() {
        return this.tooltip;
    }
    isUpdateNeeded(plotCoord) {
        // Check if the plot location has changed, if not return early, otherwise cache it and rebuild.
        if (this.plotCoord != null) {
            if (plotCoord.x == this.plotCoord.x && plotCoord.y == this.plotCoord.y) {
                return false;
            }
        }
        this.plotCoord = plotCoord; // May be cleaner to recompute in update but at cost of computing 2nd time.
        return true;
    }
    reset() {
        this.container.innerHTML = '';
        this.yieldsFlexbox.innerHTML = '';
    }
    update() {
        if (this.plotCoord == null) {
            console.error("Tooltip was unable to read plot values due to a coordinate error.");
            return;
        }
        this.isShowingDebug = UI.isDebugPlotInfoVisible(); // Ensure debug status hasn't changed
        // Obtain names and IDs
        const plotCoord = this.plotCoord;
        const terrainLabel = this.getTerrainLabel(plotCoord);
        const biomeLabel = this.getBiomeLabel(plotCoord);
        const featureLabel = this.getFeatureLabel(plotCoord);
        const continentName = this.getContinentName(plotCoord);
        const riverLabel = this.getRiverLabel(plotCoord);
        const routeName = this.getRouteName();
        const hexResource = this.getResource();
        const playerID = GameplayMap.getOwner(plotCoord.x, plotCoord.y);
        const plotIndex = GameplayMap.getIndexFromLocation(plotCoord);
        // Top Section
        if (LensManager.getActiveLens() == "fxs-settler-lens") {
            //Add more details to the tooltip if we are in the settler lens
            const localPlayer = Players.get(GameContext.localPlayerID);
            if (!localPlayer) {
                console.error("plot-tooltip: Attempting to update settler tooltip, but no valid local player!");
                return;
            }
            const localPlayerDiplomacy = localPlayer?.Diplomacy;
            if (localPlayerDiplomacy === undefined) {
                console.error("plot-tooltip: Attempting to update settler tooltip, but no valid local player Diplomacy object!");
                return;
            }
            else if (!GameplayMap.isWater(this.plotCoord.x, this.plotCoord.y) && !GameplayMap.isImpassable(this.plotCoord.x, this.plotCoord.y) && !GameplayMap.isNavigableRiver(this.plotCoord.x, this.plotCoord.y)) {
                //Dont't add any extra tooltip to mountains, oceans, or navigable rivers, should be obvious enough w/o them
                const settlerTooltip = document.createElement("div");
                settlerTooltip.classList.add("plot-tooltip__settler-tooltip");
                const localPlayerAdvancedStart = localPlayer?.AdvancedStart;
                if (localPlayerAdvancedStart === undefined) {
                    console.error("plot-tooltip: Attempting to update settler tooltip, but no valid local player advanced start object!");
                    return;
                }
                //Show why we can't settle here
                if (!GameplayMap.isPlotInAdvancedStartRegion(GameContext.localPlayerID, this.plotCoord.x, this.plotCoord.y) && !localPlayerAdvancedStart?.getPlacementComplete()) {
                    settlerTooltip.classList.add("blocked-location");
                    settlerTooltip.innerHTML = Locale.compose("LOC_PLOT_TOOLTIP_CANT_SETTLE_TOO_FAR");
                }
                else if (!localPlayerDiplomacy.isValidLandClaimLocation(this.plotCoord, true /*bIgnoreFriendlyUnitRequirement*/)) {
                    settlerTooltip.classList.add("blocked-location");
                    if (GameplayMap.isCityWithinMinimumDistance(this.plotCoord.x, this.plotCoord.y)) {
                        settlerTooltip.innerHTML = Locale.compose("LOC_PLOT_TOOLTIP_CANT_SETTLE_TOO_CLOSE");
                    }
                    else if (GameplayMap.getResourceType(this.plotCoord.x, this.plotCoord.y) != ResourceTypes.NO_RESOURCE) {
                        settlerTooltip.innerHTML = Locale.compose("LOC_PLOT_TOOLTIP_CANT_SETTLE_RESOURCES");
                    }
                }
                else if (!GameplayMap.isFreshWater(this.plotCoord.x, this.plotCoord.y)) {
                    settlerTooltip.classList.add("okay-location");
                    settlerTooltip.innerHTML = Locale.compose("LOC_PLOT_TOOLTIP_NO_FRESH_WATER");
                }

                this.container.appendChild(settlerTooltip);
                const toolTipHorizontalRule = document.createElement("div");
                toolTipHorizontalRule.classList.add("plot-tooltip__horizontalRule");
                this.container.appendChild(toolTipHorizontalRule);
            }
        }
        const tooltipFirstLine = document.createElement("div");
        tooltipFirstLine.classList.add('text-secondary', 'text-center', 'uppercase', 'font-title');
        if (biomeLabel) {
            // TODO - Add hard-coded string to localization XML.
            const label = Locale.compose("{1_TerrainName} {2_BiomeName}", terrainLabel, biomeLabel);
            tooltipFirstLine.setAttribute('data-l10n-id', label);
        }
        else {
            tooltipFirstLine.setAttribute('data-l10n-id', terrainLabel);
        }
        this.container.appendChild(tooltipFirstLine);
        if (featureLabel) {
            const tooltipSecondLine = document.createElement("div");
            tooltipSecondLine.classList.add("plot-tooltip__lineTwo");
            tooltipSecondLine.setAttribute('data-l10n-id', featureLabel);
            this.container.appendChild(tooltipSecondLine);
        }
        if (continentName) {
            if (riverLabel) {
                const tooltipThirdLine = document.createElement("div");
                tooltipThirdLine.classList.add("plot-tooltip__lineThree");
                // TODO - This hard-coded string should be in loc XML.
                const label = Locale.compose('{1_ContinentName} {LOC_PLOT_DIVIDER_DOT} {2_RiverName}', continentName, riverLabel);
                tooltipThirdLine.setAttribute('data-l10n-id', label);
                this.container.appendChild(tooltipThirdLine);
            }
            else {
                const tooltipThirdLine = document.createElement("div");
                tooltipThirdLine.classList.add("plot-tooltip__lineThree");
                tooltipThirdLine.setAttribute('data-l10n-id', continentName);
                this.container.appendChild(tooltipThirdLine);
            }
        }
        // District Information
        this.addPlotDistrictInformation(this.plotCoord);
        //Yields Section
        this.yieldsFlexbox.classList.add("plot-tooltip__resourcesFlex");
        this.container.appendChild(this.yieldsFlexbox);
        this.addPlotYields(this.plotCoord, GameContext.localPlayerID);
        if (hexResource) {
            //add resources to the yield box
            const tooltipIndividualYieldFlex = document.createElement("div");
            tooltipIndividualYieldFlex.classList.add("plot-tooltip__IndividualYieldFlex");
            this.yieldsFlexbox.appendChild(tooltipIndividualYieldFlex);
            const toolTipResourceIconCSS = UI.getIconCSS(hexResource.ResourceType);
            const yieldIconShadow = document.createElement("div");
            yieldIconShadow.classList.add("plot-tooltip__IndividualYieldIcons-Shadow");
            yieldIconShadow.style.backgroundImage = toolTipResourceIconCSS;
            tooltipIndividualYieldFlex.appendChild(yieldIconShadow);
            const yieldIcon = document.createElement("div");
            yieldIcon.classList.add("plot-tooltip__IndividualYieldIcons");
            yieldIcon.style.backgroundImage = toolTipResourceIconCSS;
            yieldIconShadow.appendChild(yieldIcon);
            const toolTipIndividualYieldValues = document.createElement("div");
            toolTipIndividualYieldValues.classList.add("plot-tooltip__IndividualYieldValues");
            toolTipIndividualYieldValues.innerHTML = "1"; //TODO: Change This value
            tooltipIndividualYieldFlex.appendChild(toolTipIndividualYieldValues);
            //Also a section that'll be more descriptive-- it'll help users learn to "read" the map
            const toolTipHorizontalRule = document.createElement("div");
            toolTipHorizontalRule.classList.add("plot-tooltip__horizontalRule");
            this.container.appendChild(toolTipHorizontalRule);
            const toolTipResourceContainer = document.createElement('div');
            toolTipResourceContainer.classList.add('plot-tooltip__resource-container');
            const toolTipResourceLargeIcon = document.createElement("div");
            toolTipResourceLargeIcon.classList.add("plot-tooltip__large-resource-icon");
            toolTipResourceLargeIcon.style.backgroundImage = toolTipResourceIconCSS;
            toolTipResourceContainer.appendChild(toolTipResourceLargeIcon);
            const toolTipResourceDetails = document.createElement('div');
            toolTipResourceDetails.classList.add('plot-tooltip__resource-details');
            const toolTipResourceLabel = document.createElement("div");
            toolTipResourceLabel.classList.add("plot-tooltip__resource-label");
            toolTipResourceLabel.setAttribute('data-l10n-id', hexResource.Name);
            toolTipResourceDetails.appendChild(toolTipResourceLabel);
            const toolTipResourceDescription = document.createElement("div");
            toolTipResourceDescription.classList.add("plot-tooltip__resource-label_description");
            toolTipResourceDescription.setAttribute('data-l10n-id', hexResource.Tooltip);
            toolTipResourceDetails.appendChild(toolTipResourceDescription);
            toolTipResourceContainer.appendChild(toolTipResourceDetails);
            this.container.appendChild(toolTipResourceContainer);
        }
        this.addOwnerInfo(this.plotCoord, playerID);
        this.getPlotEffectNames(plotIndex);
        // Adds info about constructibles, improvements, and wonders to the tooltip
        this.addConstructibleInformation(this.plotCoord);
        // Trade Route Info
        if (routeName) {
            const toolTipHorizontalRule = document.createElement("div");
            toolTipHorizontalRule.classList.add("plot-tooltip__horizontalRule");
            this.container.appendChild(toolTipHorizontalRule);
            const toolTipRouteInfo = document.createElement("div");
            toolTipRouteInfo.classList.add("plot-tooltip__trade-route-info");
            toolTipRouteInfo.innerHTML = routeName;
            this.container.appendChild(toolTipRouteInfo);
        }
        // Unit Info
        this.addUnitInfo(this.plotCoord);
        UI.setPlotLocation(this.plotCoord.x, this.plotCoord.y, plotIndex);
        // Adjust cursor between normal and red based on the plot owner's hostility
        if (!UI.isCursorLocked()) {
            const localPlayerID = GameContext.localPlayerID;
            const topUnit = this.getTopUnit(this.plotCoord);
            let showHostileCursor = false;
            let owningPlayerID = GameplayMap.getOwner(this.plotCoord.x, this.plotCoord.y);
            // if there's a unit on the plot, that player overrides the tile's owner
            if (topUnit) {
                owningPlayerID = topUnit.owner;
            }
            const revealedState = GameplayMap.getRevealedState(localPlayerID, plotCoord.x, plotCoord.y);
            if (Players.isValid(localPlayerID) && Players.isValid(owningPlayerID) && (revealedState == RevealedStates.VISIBLE)) {
                const owningPlayer = Players.get(owningPlayerID);
                // Is it an independent?
                if (owningPlayer?.isIndependent) {
                    let independentID = PlayerIds.NO_PLAYER;
                    if (topUnit) {
                        // We got the player from the unit, so use the unit
                        independentID = Game.IndependentPowers.getIndependentPlayerIDFromUnit(topUnit.id);
                    }
                    else {
                        // Get the independent from the plot, can reutrn -1
                        independentID = Game.IndependentPowers.getIndependentPlayerIDAt(this.plotCoord.x, this.plotCoord.y);
                    }
                    if (independentID != PlayerIds.NO_PLAYER) {
                        const relationship = Game.IndependentPowers.getIndependentRelationship(independentID, localPlayerID);
                        if (relationship == IndependentRelationship.HOSTILE) {
                            showHostileCursor = true;
                        }
                    }
                }
                else {
                    var hasHiddenUnit = false;
                    if (topUnit?.hasHiddenVisibility) {
                        hasHiddenUnit = true;
                    }
                    const localPlayer = Players.get(localPlayerID);
                    if (localPlayer) {
                        const localPlayerDiplomacy = localPlayer.Diplomacy;
                        if (localPlayerDiplomacy) {
                            if (localPlayerDiplomacy.isAtWarWith(owningPlayerID) && !hasHiddenUnit) {
                                showHostileCursor = true;
                            }
                        }
                    }
                }
            }
            if (showHostileCursor) {
                UI.setCursorByURL("fs://game/core/ui/cursors/enemy.ani");
            }
            else {
                UI.setCursorByType(UIHTMLCursorTypes.Default);
            }
        }
        //debug info
        if (this.isShowingDebug) {
            const tooltipDebugFlexbox = document.createElement("div");
            tooltipDebugFlexbox.classList.add("plot-tooltip__debug-flexbox");
            this.container.appendChild(tooltipDebugFlexbox);
            const toolTipDebugHorizontalRule = document.createElement("div");
            toolTipDebugHorizontalRule.classList.add("plot-tooltip__horizontalRule");
            tooltipDebugFlexbox.appendChild(toolTipDebugHorizontalRule);
            const playerID = GameplayMap.getOwner(this.plotCoord.x, this.plotCoord.y);
            const currHp = Players.Districts.get(playerID)?.getDistrictHealth(this.plotCoord);
            const maxHp = Players.Districts.get(playerID)?.getDistrictMaxHealth(this.plotCoord);
            const toolTipDebugTitle = document.createElement("div");
            toolTipDebugTitle.classList.add("plot-tooltip__debug-title-text");
            if ((currHp != undefined && currHp != 0) && (maxHp != undefined && maxHp != 0)) {
                toolTipDebugTitle.innerHTML = Locale.compose("LOC_PLOT_TOOLTIP_DEBUG_TITLE") + ": " + currHp + " / " + maxHp;
                tooltipDebugFlexbox.appendChild(toolTipDebugTitle);
            }
            else {
                toolTipDebugTitle.innerHTML = Locale.compose("LOC_PLOT_TOOLTIP_DEBUG_TITLE") + ":";
                tooltipDebugFlexbox.appendChild(toolTipDebugTitle);
            }
            const toolTipDebugPlotCoord = document.createElement("div");
            toolTipDebugPlotCoord.classList.add("plot-tooltip__coordinate-text");
            toolTipDebugPlotCoord.innerHTML = Locale.compose("LOC_PLOT_TOOLTIP_PLOT") + `: (${this.plotCoord.x},${this.plotCoord.y})`;
            tooltipDebugFlexbox.appendChild(toolTipDebugPlotCoord);
            const toolTipDebugPlotIndex = document.createElement("div");
            toolTipDebugPlotIndex.classList.add("plot-tooltip__coordinate-text");
            toolTipDebugPlotIndex.innerHTML = Locale.compose("LOC_PLOT_TOOLTIP_INDEX") + `: ${plotIndex}`;
            tooltipDebugFlexbox.appendChild(toolTipDebugPlotIndex);
            const localPlayer = Players.get(GameContext.localPlayerID);
            if (localPlayer != null) {
                if (localPlayer.isDistantLands(this.plotCoord)) {
                    const toolTipDebugPlotTag = document.createElement("div");
                    toolTipDebugPlotTag.classList.add("plot-tooltip__coordinate-text");
                    toolTipDebugPlotTag.innerHTML = Locale.compose("LOC_PLOT_TOOLTIP_HEMISPHERE_WEST");
                    tooltipDebugFlexbox.appendChild(toolTipDebugPlotTag);
                }
                else {
                    const toolTipDebugPlotTag = document.createElement("div");
                    toolTipDebugPlotTag.classList.add("plot-tooltip__coordinate-text");
                    toolTipDebugPlotTag.innerHTML = Locale.compose("LOC_PLOT_TOOLTIP_HEMISPHERE_EAST");
                    tooltipDebugFlexbox.appendChild(toolTipDebugPlotTag);
                }
            }
        }
    }
    isBlank() {
        if (this.plotCoord == null) {
            return true;
        }
        const localPlayerID = GameContext.localPlayerID;
        const revealedState = GameplayMap.getRevealedState(localPlayerID, this.plotCoord.x, this.plotCoord.y);
        if (revealedState == RevealedStates.HIDDEN) {
            return true;
        }
        // If a unit is selected, check if over our own unit an enemy unit and prevent the plot tooltip from displaying.
        const selectedUnitID = UI.Player.getHeadSelectedUnit();
        if (selectedUnitID && ComponentID.isValid(selectedUnitID)) {
            const plotUnits = MapUnits.getUnits(this.plotCoord.x, this.plotCoord.y);
            if (plotUnits.length > 0) {
                // Hovering over your selected unit; don't show the plot tooltip
                if (plotUnits.find(e => ComponentID.isMatch(e, selectedUnitID))) {
                    return true;
                }
                let args = {};
                args.X = this.plotCoord.x;
                args.Y = this.plotCoord.y;
                let combatType = Game.Combat.testAttackInto(selectedUnitID, args);
                if (combatType != CombatTypes.NO_COMBAT) {
                    return true;
                }
            }
        }
        return false;
    }
    getContinentName(location) {
        const continentType = GameplayMap.getContinentType(location.x, location.y);
        const continent = GameInfo.Continents.lookup(continentType);
        if (continent && continent.Description) {
            return continent.Description;
        }
        else {
            return "";
        }
    }
    addConstructibleInformation(plotCoordinate) {
        const thisAgeBuildings = [];
        const previousAgeBuildings = [];
        const wonders = [];
        const improvements = [];
        const constructibles = MapConstructibles.getHiddenFilteredConstructibles(plotCoordinate.x, plotCoordinate.y);
        const buildingStatus = {
            CurrentAge: new Array(),
            PreviousAge: new Array(),
            Wonder: new Array(),
            Improvements: new Array()
        };
        constructibles.forEach((item) => {
            const instance = Constructibles.getByComponentID(item);
            if (instance) {
                const info = GameInfo.Constructibles.lookup(instance.type);
                if ((info) && (info.ConstructibleClass == "BUILDING")) {
                    const location = instance.location;
                    if (location.x == plotCoordinate.x && location.y == plotCoordinate.y) {
                        let buildingName;
                        const info = GameInfo.Constructibles.lookup(instance.type);
                        if (info) {
                            buildingName = Locale.compose(info.Name);
                        }
                        else {
                            console.warn("Building constructible without a definition: " + instance.type.toString());
                            buildingName = instance.type.toString(); // TODO: Show nothing or something else? (Pre-vertical slice, show whatever this is that is missing)
                        }
                        const iCurrentAge = Game.age;
                        const iBuildingAge = Database.makeHash(info?.Age ?? "");
                        if (iCurrentAge != iBuildingAge) {
                            previousAgeBuildings.push(buildingName);
                            if (instance.damaged) {
                                buildingStatus.PreviousAge.push(" (" + Locale.compose("LOC_PLOT_TOOLTIP_DAMAGED") + ")");
                            }
                            else if (!instance.complete) {
                                buildingStatus.PreviousAge.push(" (" + Locale.compose("LOC_PLOT_TOOLTIP_IN_PROGRESS") + ")");
                            }
                            else {
                                buildingStatus.PreviousAge.push('');
                            }
                        }
                        // Buildings with no Age (like the palace) should always be listed as current Age
                        else {
                            if (instance.damaged) {
                                buildingStatus.CurrentAge.push(" (" + Locale.compose("LOC_PLOT_TOOLTIP_DAMAGED") + ")");
                            }
                            else if (!instance.complete) {
                                buildingStatus.CurrentAge.push(" (" + Locale.compose("LOC_PLOT_TOOLTIP_IN_PROGRESS") + ")");
                            }
                            else {
                                buildingStatus.CurrentAge.push('');
                            }
                            thisAgeBuildings.push(buildingName);
                        }
                    }
                }
                if ((info) && (info.ConstructibleClass == "WONDER")) {
                    const location = instance.location;
                    if (location.x == plotCoordinate.x && location.y == plotCoordinate.y) {
                        let wonderName;
                        const info = GameInfo.Constructibles.lookup(instance.type);
                        if (info) {
                            wonderName = Locale.compose(info.Name);
                        }
                        else {
                            console.warn("Wonder constructible without a definition: " + instance.type.toString());
                            wonderName = instance.type.toString(); // TODO: Show nothing or something else? (Pre-vertical slice, show whatever this is that is missing)
                        }
                        if (instance.damaged) {
                            buildingStatus.Wonder.push(" (" + Locale.compose("LOC_PLOT_TOOLTIP_DAMAGED") + ")");
                        }
                        else if (!instance.complete) {
                            buildingStatus.Wonder.push(" (" + Locale.compose("LOC_PLOT_TOOLTIP_IN_PROGRESS") + ")");
                        }
                        else {
                            buildingStatus.Wonder.push('');
                        }
                        wonders.push(wonderName);
                    }
                }
                if ((info) && (info.ConstructibleClass == "IMPROVEMENT")) {
                    const location = instance.location;
                    if (location.x == plotCoordinate.x && location.y == plotCoordinate.y) {
                        let improvementName;
                        const info = GameInfo.Constructibles.lookup(instance.type);
                        if (info) {
                            improvementName = Locale.compose(info.Name);
                        }
                        else {
                            console.warn("Improvement constructible without a definition: " + instance.type.toString());
                            improvementName = instance.type.toString(); // TODO: Show nothing or something else? (Pre-vertical slice, show whatever this is that is missing)
                        }
                        if (instance.damaged) {
                            buildingStatus.Improvements.push(" (" + Locale.compose("LOC_PLOT_TOOLTIP_DAMAGED") + ")");
                        }
                        else if (!instance.complete) {
                            buildingStatus.Improvements.push(" (" + Locale.compose("LOC_PLOT_TOOLTIP_IN_PROGRESS") + ")");
                        }
                        else {
                            buildingStatus.Improvements.push('');
                        }
                        improvements.push(improvementName);
                    }
                }
            }
        });
        if (improvements.length > 0) {
            for (let i = 0; i < improvements.length; i++) {
                const tooltipImprovementLineFlex = document.createElement("div");
                tooltipImprovementLineFlex.classList.add("plot-tooltip__TitleLineFlex");
                this.container.appendChild(tooltipImprovementLineFlex);
                const titleLeftSeparator = document.createElement("div");
                titleLeftSeparator.classList.add("plot-tooltip__TitleLineleft");
                tooltipImprovementLineFlex.appendChild(titleLeftSeparator);
                const tooltipImprovementName = document.createElement("div");
                tooltipImprovementName.classList.add("plot-tooltip__ImprovementName");
                tooltipImprovementName.innerHTML = improvements[i];
                tooltipImprovementLineFlex.appendChild(tooltipImprovementName);
                const titleRightSeparator = document.createElement("div");
                titleRightSeparator.classList.add("plot-tooltip__TitleLineRight");
                tooltipImprovementLineFlex.appendChild(titleRightSeparator);
                const tooltipBuildingStatus = document.createElement("div");
                tooltipBuildingStatus.classList.add("plot-tooltip__building-status");
                tooltipBuildingStatus.innerHTML = buildingStatus.Improvements[i];
                this.container.appendChild(tooltipBuildingStatus);
            }
        }
        if (thisAgeBuildings.length > 0) {
            for (let i = 0; i < thisAgeBuildings.length; i++) {
                const tooltipImprovementLineFlex = document.createElement("div");
                tooltipImprovementLineFlex.classList.add("plot-tooltip__TitleLineFlex");
                this.container.appendChild(tooltipImprovementLineFlex);
                const titleLeftSeparator = document.createElement("div");
                titleLeftSeparator.classList.add("plot-tooltip__TitleLineleft");
                tooltipImprovementLineFlex.appendChild(titleLeftSeparator);
                const tooltipImprovementName = document.createElement("div");
                tooltipImprovementName.classList.add("plot-tooltip__ImprovementName");
                tooltipImprovementName.innerHTML = thisAgeBuildings[i];
                tooltipImprovementLineFlex.appendChild(tooltipImprovementName);
                const titleRightSeparator = document.createElement("div");
                titleRightSeparator.classList.add("plot-tooltip__TitleLineRight");
                tooltipImprovementLineFlex.appendChild(titleRightSeparator);
                const tooltipBuildingStatus = document.createElement("div");
                tooltipBuildingStatus.classList.add("plot-tooltip__building-status");
                tooltipBuildingStatus.innerHTML = buildingStatus.CurrentAge[i];
                this.container.appendChild(tooltipBuildingStatus);
            }
        }
        if (previousAgeBuildings.length > 0) {
            for (let i = 0; i < previousAgeBuildings.length; i++) {
                const tooltipImprovementLineFlex = document.createElement("div");
                tooltipImprovementLineFlex.classList.add("plot-tooltip__TitleLineFlex");
                this.container.appendChild(tooltipImprovementLineFlex);
                const titleLeftSeparator = document.createElement("div");
                titleLeftSeparator.classList.add("plot-tooltip__TitleLineleft");
                tooltipImprovementLineFlex.appendChild(titleLeftSeparator);
                const tooltipImprovementName = document.createElement("div");
                tooltipImprovementName.classList.add("plot-tooltip__ImprovementName");
                tooltipImprovementName.innerHTML = previousAgeBuildings[i];
                tooltipImprovementLineFlex.appendChild(tooltipImprovementName);
                const titleRightSeparator = document.createElement("div");
                titleRightSeparator.classList.add("plot-tooltip__TitleLineRight");
                tooltipImprovementLineFlex.appendChild(titleRightSeparator);
                const tooltipBuildingStatus = document.createElement("div");
                tooltipBuildingStatus.classList.add("plot-tooltip__building-status");
                tooltipBuildingStatus.innerHTML = buildingStatus.PreviousAge[i];
                this.container.appendChild(tooltipBuildingStatus);
            }
        }
        if (wonders.length > 0) {
            for (let i = 0; i < wonders.length; i++) {
                const tooltipImprovementLineFlex = document.createElement("div");
                tooltipImprovementLineFlex.classList.add("plot-tooltip__TitleLineFlex");
                this.container.appendChild(tooltipImprovementLineFlex);
                const titleLeftSeparator = document.createElement("div");
                titleLeftSeparator.classList.add("plot-tooltip__TitleLineleft");
                tooltipImprovementLineFlex.appendChild(titleLeftSeparator);
                const tooltipImprovementName = document.createElement("div");
                tooltipImprovementName.classList.add("plot-tooltip__ImprovementName");
                tooltipImprovementName.innerHTML = wonders[i];
                tooltipImprovementLineFlex.appendChild(tooltipImprovementName);
                const titleRightSeparator = document.createElement("div");
                titleRightSeparator.classList.add("plot-tooltip__TitleLineRight");
                tooltipImprovementLineFlex.appendChild(titleRightSeparator);
                const tooltipBuildingStatus = document.createElement("div");
                tooltipBuildingStatus.classList.add("plot-tooltip__building-status");
                tooltipBuildingStatus.innerHTML = buildingStatus.Wonder[i];
                this.container.appendChild(tooltipBuildingStatus);
            }
        }
    }
    getPlayerName() {
        const playerID = GameplayMap.getOwner(this.plotCoord.x, this.plotCoord.y);
        const player = Players.get(playerID);
        if (player == null) {
            return "";
        }
        const localPlayerID = GameContext.localPlayerID;
        const name = Locale.stylize(player.name) + ((playerID == localPlayerID) ? (" (" + Locale.compose("LOC_PLOT_TOOLTIP_YOU") + ")") : "");
        return name;
    }
    getCivName() {
        const playerID = GameplayMap.getOwner(this.plotCoord.x, this.plotCoord.y);
        const player = Players.get(playerID);
        if (player == null) {
            return "";
        }
        const name = Locale.compose(GameplayMap.getOwnerName(this.plotCoord.x, this.plotCoord.y));
        return name;
    }
    getTerrainLabel(location) {
        const terrainType = GameplayMap.getTerrainType(location.x, location.y);
        const terrain = GameInfo.Terrains.lookup(terrainType);
        if (terrain) {
            if (this.isShowingDebug) {
                // despite being "coast" this is a check for a lake
                if (terrain.TerrainType == "TERRAIN_COAST" && GameplayMap.isLake(location.x, location.y)) {
                    return Locale.compose('{1_Name} ({2_Value})', "LOC_TERRAIN_LAKE_NAME", terrainType.toString());
                }
                return Locale.compose('{1_Name} ({2_Value})', terrain.Name, terrainType.toString());
            }
            else {
                // despite being "coast" this is a check for a lake
                if (terrain.TerrainType == "TERRAIN_COAST" && GameplayMap.isLake(location.x, location.y)) {
                    return "LOC_TERRAIN_LAKE_NAME";
                }
                return terrain.Name;
            }
        }
        else {
            return "";
        }
    }
    getBiomeLabel(location) {
        const biomeType = GameplayMap.getBiomeType(location.x, location.y);
        const biome = GameInfo.Biomes.lookup(biomeType);
        // Do not show a label if marine biome.
        if (biome && biome.BiomeType != "BIOME_MARINE") {
            if (this.isShowingDebug) {
                return Locale.compose('{1_Name} ({2_Value})', biome.Name, biomeType.toString());
            }
            else {
                return biome.Name;
            }
        }
        else {
            return "";
        }
    }
    getResource() {
        if (this.plotCoord) {
            const resourceType = GameplayMap.getResourceType(this.plotCoord.x, this.plotCoord.y);
            return GameInfo.Resources.lookup(resourceType);
        }
        return null;
    }
    getRouteName() {
        const routeType = GameplayMap.getRouteType(this.plotCoord.x, this.plotCoord.y);
        const route = GameInfo.Routes.lookup(routeType);
        const isFerry = GameplayMap.isFerry(this.plotCoord.x, this.plotCoord.y);
        let returnString = "";
        if (route) {
            if (isFerry) {
                returnString = Locale.compose(route.Name) + " " + Locale.compose("LOC_PLOT_DIVIDER_DOT") + " " + Locale.compose("LOC_NAVIGABLE_RIVER_FERRY");
            }
            else {
                returnString = Locale.compose(route.Name);
            }
        }
        return returnString;
    }
    getPlotEffectNames(plotIndex) {
        const plotEffects = MapPlotEffects.getPlotEffects(plotIndex);
        const localPlayerID = GameContext.localPlayerID;
        plotEffects?.forEach((item) => {
            const effectInfo = GameInfo.PlotEffects.lookup(item.effectType);
            if (!item.onlyVisibleToOwner || (item.onlyVisibleToOwner && (item.owner == localPlayerID))) {
                if (effectInfo) {
                    const toolTipPlotEffectsHorizontalRule = document.createElement("div");
                    toolTipPlotEffectsHorizontalRule.classList.add("plot-tooltip__horizontalRule");
                    const toolTipPlotEffectsText = document.createElement("div");
                    toolTipPlotEffectsText.classList.add("plot-tooltip__plot-effect-text");
                    toolTipPlotEffectsText.setAttribute('data-l10n-id', effectInfo.Name);
                    this.container.appendChild(toolTipPlotEffectsHorizontalRule);
                    this.container.appendChild(toolTipPlotEffectsText);
                }
            }
        });
    }
    getTopUnit(location) {
        let plotUnits = MapUnits.getUnits(location.x, location.y);
        if (plotUnits && plotUnits.length > 0) {
            const topUnit = Units.get(plotUnits[0]);
            return topUnit;
        }
        return null;
    }
    /**
     * Add to a plot tooltip information on the plot's owner
     * @param {float2} location The X,Y plot location.
     * @param {playerId} playerID The player associated with the request.
     */
    addOwnerInfo(location, playerID) {
        const filteredConstructibles = MapConstructibles.getHiddenFilteredConstructibles(location.x, location.y);
        const constructibles = MapConstructibles.getConstructibles(location.x, location.y);
        const player = Players.get(playerID);
        if (!player || !Players.isAlive(playerID)) {
            return;
        }
        if (filteredConstructibles.length == 0 && filteredConstructibles.length != constructibles.length) {
            return;
        }
        if (player.isIndependent) {
            const toolTipOwnershipHorizontalRule = document.createElement("div");
            toolTipOwnershipHorizontalRule.classList.add("plot-tooltip__horizontalRule");
            this.container.appendChild(toolTipOwnershipHorizontalRule);
            const plotTooltipOwnerLeader = document.createElement("div");
            plotTooltipOwnerLeader.classList.add("plot-tooltip__owner-leader-text");
            plotTooltipOwnerLeader.innerHTML = Locale.compose("LOC_CIVILIZATION_INDEPENDENT_SINGULAR", this.getCivName());
            this.container.appendChild(plotTooltipOwnerLeader);
            const localPlayerID = GameContext.localPlayerID;
            const relationship = GameplayMap.getOwnerHostility(location.x, location.y, localPlayerID);
            if (relationship != null) {
                const plotTooltipOwnerRelationship = document.createElement("div");
                plotTooltipOwnerRelationship.classList.add("plot-tooltip__owner-relationship-text");
                plotTooltipOwnerRelationship.innerHTML = Locale.compose("LOC_PLOT_TOOLTIP_RELATIONSHIP") + ": " + Locale.compose(relationship);
                this.container.appendChild(plotTooltipOwnerRelationship);
            }
            const tooltipCityBonusInfo = document.createElement("div");
            tooltipCityBonusInfo.classList.add("plot-tooltip__unitInfo");
            const bonusType = Game.CityStates.getBonusType(playerID);
            const bonusDefinition = GameInfo.CityStateBonuses.find(t => t.$hash == bonusType);
            tooltipCityBonusInfo.innerHTML = Locale.compose(bonusDefinition?.Name ?? "");
            this.container.appendChild(tooltipCityBonusInfo);
        }
        else {
            const toolTipOwnershipHorizontalRule = document.createElement("div");
            toolTipOwnershipHorizontalRule.classList.add("plot-tooltip__horizontalRule");
            this.container.appendChild(toolTipOwnershipHorizontalRule);
            const plotTooltipOwnerLeader = document.createElement("div");
            plotTooltipOwnerLeader.classList.add("plot-tooltip__owner-leader-text");
            plotTooltipOwnerLeader.innerHTML = this.getPlayerName();
            this.container.appendChild(plotTooltipOwnerLeader);
            const plotTooltipOwnerCiv = document.createElement("div");
            plotTooltipOwnerCiv.classList.add("plot-tooltip__owner-civ-text");
            plotTooltipOwnerCiv.innerHTML = this.getCivName();
            this.container.appendChild(plotTooltipOwnerCiv);
            const districtId = MapCities.getDistrict(location.x, location.y);
            const plotTooltipConqueror = this.getConquerorInfo(districtId);
            if (plotTooltipConqueror) {
                this.container.appendChild(plotTooltipConqueror);
            }
        }
    }
    getConquerorInfo(districtId) {
        if (!districtId) {
            return null;
        }
        const district = Districts.get(districtId);
        if (!district || !ComponentID.isValid(districtId)) {
            console.error(`plot-tooltip: couldn't find any district with the given id: ${districtId}`);
            return null;
        }
        if (district.owner != district.controllingPlayer) {
            const conqueror = Players.get(district.controllingPlayer);
            if (!conqueror) {
                console.error(`plot-tooltip: couldn't find any civilization with the given player ${district.controllingPlayer}`);
                return null;
            }
            if (conqueror.isIndependent) {
                const plotTooltipOwnerLeader = document.createElement("div");
                plotTooltipOwnerLeader.classList.add("plot-tooltip__owner-leader-text");
                const label = Locale.compose("{1_Term}: {2_Subject}", "LOC_PLOT_TOOLTIP_CONQUEROR", "LOC_PLOT_TOOLTIP_INDEPENDENT_CONQUEROR");
                plotTooltipOwnerLeader.innerHTML = label;
                return plotTooltipOwnerLeader;
            }
            else {
                const conquerorName = Locale.compose(conqueror.civilizationFullName);
                const plotTooltipConqueredCiv = document.createElement("div");
                plotTooltipConqueredCiv.classList.add("plot-tooltip__owner-civ-text");
                const label = Locale.compose("{1_Term}: {2_Subject}", "LOC_PLOT_TOOLTIP_CONQUEROR", conquerorName);
                plotTooltipConqueredCiv.innerHTML = label;
                return plotTooltipConqueredCiv;
            }
        }
        else {
            return null;
        }
    }
    getRiverLabel(location) {
        const riverType = GameplayMap.getRiverType(location.x, location.y);
        if (riverType != RiverTypes.NO_RIVER) {
            let riverNameLabel = GameplayMap.getRiverName(location.x, location.y);
            if (!riverNameLabel) {
                switch (riverType) {
                    case RiverTypes.RIVER_MINOR:
                        riverNameLabel = "LOC_MINOR_RIVER_NAME";
                        break;
                    case RiverTypes.RIVER_NAVIGABLE:
                        riverNameLabel = "LOC_NAVIGABLE_RIVER_NAME";
                        break;
                }
            }
            return riverNameLabel;
        }
        else {
            return "";
        }
    }
    getFeatureLabel(location) {
        let label = '';
        const featureType = GameplayMap.getFeatureType(location.x, location.y);
        const feature = GameInfo.Features.lookup(featureType);
        if (feature) {
            if (feature.Tooltip) {
                label = Locale.compose("{1_FeatureName}: {2_FeatureTooltip}", feature.Name, feature.Tooltip);
            }
            else {
                label = feature.Name;
            }
        }
        if (GameplayMap.isVolcano(location.x, location.y)) {
            const active = GameplayMap.isVolcanoActive(location.x, location.y);
            const volcanoStatus = (active) ? 'LOC_VOLCANO_ACTIVE' : 'LOC_VOLCANO_NOT_ACTIVE';
            const volcanoName = GameplayMap.getVolcanoName(location.x, location.y);
            const volcanoDetailsKey = (volcanoName) ? 'LOC_UI_NAMED_VOLCANO_DETAILS' : 'LOC_UI_VOLCANO_DETAILS';
            label = Locale.compose(volcanoDetailsKey, label, volcanoStatus, volcanoName);
        }
        return label;
    }
    addUnitInfo(location) {
        const localPlayerID = GameContext.localObserverID;
        if (GameplayMap.getRevealedState(localPlayerID, location.x, location.y) != RevealedStates.VISIBLE) {
            return this;
        }
        let topUnit = this.getTopUnit(location);
        if (topUnit) {
            if (!Visibility.isVisible(localPlayerID, topUnit?.id)) {
                return this;
            }
        }
        else {
            return this;
        }
        const player = Players.get(topUnit.owner);
        if (!player) {
            return this;
        }
        if (player.id == localPlayerID) {
            return this;
        }
        let unitName = Locale.compose(topUnit.name);
        const toolTipHorizontalRule = document.createElement("div");
        toolTipHorizontalRule.classList.add("plot-tooltip__horizontalRule");
        this.container.appendChild(toolTipHorizontalRule);
        const toolTipUnitInfo = document.createElement("div");
        toolTipUnitInfo.classList.add("plot-tooltip__unitInfo");
        toolTipUnitInfo.innerHTML = unitName;
        this.container.appendChild(toolTipUnitInfo);
        const plotOwner = GameplayMap.getOwner(this.plotCoord.x, this.plotCoord.y);
        if (plotOwner != topUnit.owner) {
            const toolTipUnitCiv = document.createElement("div");
            toolTipUnitCiv.classList.add("plot-tooltip__Civ-Info");
            if (player.isIndependent) {
                const independentID = Game.IndependentPowers.getIndependentPlayerIDFromUnit(topUnit.id);
                if (independentID != PlayerIds.NO_PLAYER) {
                    const indy = Players.get(independentID);
                    if (indy) {
                        toolTipUnitCiv.innerHTML = Locale.compose("LOC_CIVILIZATION_INDEPENDENT_SINGULAR", Locale.compose(indy.civilizationFullName));
                        this.container.appendChild(toolTipUnitCiv);
                        const relationship = Game.IndependentPowers.getIndependentHostility(independentID, localPlayerID);
                        const toolTipUnitRelationship = document.createElement("div");
                        toolTipUnitRelationship.classList.add("plot-tooltip__Unit-Relationship-Info");
                        toolTipUnitRelationship.innerHTML = Locale.compose("LOC_INDEPENDENT_RELATIONSHIP") + ": " + Locale.compose(relationship);
                        this.container.appendChild(toolTipUnitRelationship);
                    }
                }
            }
            else {
                const toolTipUnitOwner = document.createElement('div');
                toolTipUnitOwner.classList.add('plot-tooltip__owner-leader-text');
                toolTipUnitOwner.innerHTML = Locale.stylize(player.name);
                this.container.appendChild(toolTipUnitOwner);
                toolTipUnitCiv.innerHTML = Locale.compose(player.civilizationFullName);
                this.container.appendChild(toolTipUnitCiv);
            }
        }
        return this;
    }
    /**
     * Add to a plot tooltip any yields that are greater than 0 for that plot
     * @param {float2} location The X,Y plot location.
     * @param {playerId} playerID The player associated with the request.
     */
    addPlotYields(location, playerID) {
        const fragment = document.createDocumentFragment();
        let maxValueLength = 0;
        GameInfo.Yields.forEach(yield_define => {
            const yield_amount = GameplayMap.getYield(location.x, location.y, yield_define.YieldType, playerID);
            if (yield_amount > 0) {
                const tooltipIndividualYieldFlex = document.createElement("div");
                tooltipIndividualYieldFlex.classList.add("plot-tooltip__IndividualYieldFlex");
                tooltipIndividualYieldFlex.ariaLabel = `${Locale.toNumber(yield_amount)} ${Locale.compose(yield_define.Name)}`;
                fragment.appendChild(tooltipIndividualYieldFlex);
                const yieldIconCSS = UI.getIconCSS(yield_define.YieldType, "YIELD");
                const yieldIconShadow = document.createElement("div");
                yieldIconShadow.classList.add("plot-tooltip__IndividualYieldIcons-Shadow");
                yieldIconShadow.style.backgroundImage = yieldIconCSS;
                tooltipIndividualYieldFlex.appendChild(yieldIconShadow);
                const yieldIcon = document.createElement("div");
                yieldIcon.classList.add("plot-tooltip__IndividualYieldIcons");
                yieldIcon.style.backgroundImage = yieldIconCSS;
                yieldIconShadow.appendChild(yieldIcon);
                const toolTipIndividualYieldValues = document.createElement("div");
                toolTipIndividualYieldValues.classList.add("plot-tooltip__IndividualYieldValues");
                const value = yield_amount.toString();
                maxValueLength = Math.max(maxValueLength, value.length);
                toolTipIndividualYieldValues.textContent = value;
                tooltipIndividualYieldFlex.appendChild(toolTipIndividualYieldValues);
            }
        });
        this.yieldsFlexbox.appendChild(fragment);
        // Give all the yields extra room if one of them has extra digits, to keep the spacing even.
        this.yieldsFlexbox.classList.remove('resourcesFlex--double-digits', 'resourcesFlex--triple-digits');
        if (maxValueLength > 2) {
            this.yieldsFlexbox.classList.add(maxValueLength > 3 ? 'resourcesFlex--triple-digits' : 'resourcesFlex--double-digits');
        }
    }
    /**
     * Add to a plot tooltip district info and show it if the health is not 100 nor 0
     * @param {float2} location The X,Y plot location.
    */
    addPlotDistrictInformation(location) {
        const playerID = GameplayMap.getOwner(location.x, location.y);
        const playerDistricts = Players.Districts.get(playerID);
        if (!playerDistricts) {
            return;
        }
        // This type is unresolved, is it meant to be number instead?
        const currentHealth = playerDistricts.getDistrictHealth(location);
        const maxHealth = playerDistricts.getDistrictMaxHealth(location);
        const isUnderSiege = playerDistricts.getDistrictIsBesieged(location);
        if (!DistrictHealthManager.canShowDistrictHealth(currentHealth, maxHealth)) {
            return;
        }
        const districtContainer = document.createElement("div");
        districtContainer.classList.add("plot-tooltip__district-container");
        const districtTitle = document.createElement("div");
        districtTitle.classList.add("plot-tooltip__district-title", "plot-tooltip__lineThree");
        districtTitle.innerHTML = isUnderSiege ? Locale.compose("LOC_PLOT_TOOLTIP_UNDER_SIEGE") : Locale.compose("LOC_PLOT_TOOLTIP_HEALING_DISTRICT");
        const districtHealth = document.createElement("div");
        districtHealth.classList.add("plot-tooltip__district-health");
        const healthCaption = document.createElement("div");
        healthCaption.classList.add("plot-tooltip__health-caption", "plot-tooltip__lineThree");
        healthCaption.innerHTML = currentHealth + '/' + maxHealth;
        districtHealth.appendChild(healthCaption);
        districtContainer.appendChild(districtTitle);
        districtContainer.appendChild(districtHealth);
        this.container.appendChild(districtContainer);
    }
}
TooltipManager.registerPlotType('plot', PlotTooltipPriority.LOW, new PlotTooltipType());

//# sourceMappingURL=file:///base-standard/ui/tooltips/plot-tooltip.js.map
