/**
 * @file panel-place-building.ts
 * @copyright 2023-2024, Firaxis Games
 * @description Displays all the useful information when attempting to place a building on a plot
 */
import PlaceBuilding from '/base-standard/ui/place-building/model-place-building.js';
import { InterfaceMode, InterfaceModeChangedEventName } from '/core/ui/interface-modes/interface-modes.js';
import { MustGetElement } from "/core/ui/utilities/utilities-dom.js";
import Panel from '/core/ui/panel-support.js';
import FocusManager from '/core/ui/input/focus-manager.js';
import { ComponentID } from '/core/ui/utilities/utilities-component-id.js';
class PlaceBuildingPanel extends Panel {
    constructor(root) {
        super(root);
        this.content = null;
        this.subsystemFrame = document.createElement("fxs-subsystem-frame");
        this.requestClose = () => {
            const selectedCityID = InterfaceMode.getParameters().CityId != null ? InterfaceMode.getParameters().CityId : UI.Player.getHeadSelectedCity(); // May be null if placing results in deselecting city		
            if (selectedCityID && ComponentID.isValid(selectedCityID)) {
                InterfaceMode.switchTo("INTERFACEMODE_CITY_PRODUCTION", { CityID: selectedCityID });
                super.close();
            }
            else {
                // If we still don't have a CityId something has gone very wrong so we'll be safe a kick back to the world.
                InterfaceMode.switchTo("INTERFACEMODE_DEFAULT");
            }
        };
        this.onInterfaceModeChanged = () => {
            switch (InterfaceMode.getCurrent()) {
                case "INTERFACEMODE_PLACE_BUILDING":
                    this.setHidden(false);
                    break;
                default:
                    this.setHidden(true);
                    break;
            }
        };
        this.animateInType = this.animateOutType = 5 /* AnchorType.RelativeToLeft */;
        this.inputContext = InputContext.Shell;
    }
    onInitialize() {
        this.Root.setAttribute("tabindex", "-1");
        this.Root.classList.add("panel-place-building", "flex-auto", "font-body", "text-base", "pt-12", "pl-6", "h-screen", "relative");
        this.buildView();
        this.setHidden(true);
    }
    onAttach() {
        super.onAttach();
        window.addEventListener(InterfaceModeChangedEventName, this.onInterfaceModeChanged);
        this.subsystemFrame.addEventListener('subsystem-frame-close', this.requestClose);
    }
    onDetach() {
        window.removeEventListener(InterfaceModeChangedEventName, this.onInterfaceModeChanged);
        this.subsystemFrame.removeEventListener('subsystem-frame-close', this.requestClose);
        super.onDetach();
    }
    onReceiveFocus() {
        if (this.content) {
            FocusManager.setFocus(this.content);
        }
    }
    buildView() {
        const fragment = document.createDocumentFragment();
        const container = document.createElement('div');
        container.classList.add('flex', 'flex-col', 'w-128', 'pointer-events-none', 'mr-6', 'top-10', 'bottom-0', 'absolute');
        this.buildMainPanel();
        container.appendChild(this.subsystemFrame);
        fragment.appendChild(container);
        this.Root.appendChild(fragment);
    }
    buildMainPanel() {
        this.subsystemFrame.innerHTML = `
			<fxs-header data-slot="header" class="uppercase tracking-100 m-2" data-bind-attr-title='{{g_PlaceBuilding.cityName}}'></fxs-header>
			<div tabindex="-1" class="flex flex-col mx-2 mb-8">
				<div class="yields-container flex self-center"></div>
				<fxs-header class="uppercase tracking-100 mt-2" title="LOC_UI_CITY_VIEW_BUILDING_PLACEMENT" filigree-style="small"></fxs-header>
				<div class="uppercase font-title text-secondary text-xl self-center" data-bind-attr-data-l10n-id="{{g_PlaceBuilding.selectedConstructibleInfo.name}}"></div>
				<div class="flex items-center m-1">
					<fxs-icon class="size-20 mx-2" data-bind-attr-data-icon-id="{{g_PlaceBuilding.selectedConstructibleInfo.type}}"></icon>
					<div class="flex flex-col pr-26">
						<div class="" data-bind-for="entry:{{g_PlaceBuilding.selectedConstructibleInfo.details}}" data-bind-attr-data-l10n-id="{{entry}}"></div>
					</div>
				</div>
				<fxs-header class="uppercase my-2" data-bind-attr-title="{{g_PlaceBuilding.placementHeaderText}}" data-bind-if="{{g_PlaceBuilding.hasSelectedPlot}}" filigree-style="h4"></fxs-header>
				<div class="flex flex-col self-center my-2" data-bind-if="{{g_PlaceBuilding.shouldShowOverbuild}}">
					<div data-bind-value="{{g_PlaceBuilding.overbuildText}}"></div>
				</div>
				<div class="flex flex-col self-center my-2" data-bind-if="{{g_PlaceBuilding.shouldShowUniqueQuarterText}}">
					<div class="self-center text-center" data-bind-value="{{g_PlaceBuilding.uniqueQuarterText}}"></div>
					<div class="self-center text-center text-negative" data-bind-value="{{g_PlaceBuilding.uniqueQuarterWarning}}"></div>
				</div>
				<div class="flex self-center" data-bind-if="{{g_PlaceBuilding.hasSelectedPlot}}">
					<fxs-icon class="size-20 flex justify-center items-center mx-2" data-bind-attr-data-icon-id="{{g_PlaceBuilding.firstConstructibleSlot.type}}" data-bind-if="{{g_PlaceBuilding.firstConstructibleSlot.shouldShow}}">
						<fxs-icon class="size-12" data-icon-id="BUILDING_PLACE" data-bind-if="{{g_PlaceBuilding.firstConstructibleSlot.showPlacementIcon}}"></fxs-icon>
						<fxs-icon class="size-12" data-icon-id="CITY_REPAIR" data-bind-if="{{g_PlaceBuilding.firstConstructibleSlot.showRepairIcon}}"></fxs-icon>
					</fxs-icon>
					<fxs-icon class="size-20 flex justify-center items-center mx-2" data-bind-attr-data-icon-id="{{g_PlaceBuilding.secondConstructibleSlot.type}}" data-bind-if="{{g_PlaceBuilding.secondConstructibleSlot.shouldShow}}">
						<fxs-icon class="size-12" data-icon-id="BUILDING_PLACE" data-bind-if="{{g_PlaceBuilding.secondConstructibleSlot.showPlacementIcon}}"></fxs-icon>
						<fxs-icon class="size-12" data-icon-id="CITY_REPAIR" data-bind-if="{{g_PlaceBuilding.secondConstructibleSlot.showRepairIcon}}"></fxs-icon>
					</fxs-icon>
				</div>
				<div class="flex flex-col self-center items-center mb-2" data-bind-if="{{g_PlaceBuilding.shouldShowFromThisPlot}}">
					<div class="my-2" data-l10n-id="LOC_UI_CITY_VIEW_BONUSES_FROM_THIS_PLOT"></div>
					<div class="flex flex-col mx-2">
						<div data-bind-for="entry:{{g_PlaceBuilding.fromThisPlotYields}}">
							<div data-bind-attr-data-l10n-id="{{entry}}"></div>
						</div>
					</div>
				</div>
				<div class="flex flex-col self-center items-center" data-bind-if="{{g_PlaceBuilding.shouldShowAdjacencyBonuses}}">
					<div class="my-2 font-title uppercase text-gradient-secondary" data-l10n-id="LOC_UI_CITY_VIEW_ADJACENCY_BONUSES"></div>
					<div class="flex flex-col mx-2">
						<div data-bind-for="entry:{{g_PlaceBuilding.adjacencyBonuses}}">
							<div data-bind-attr-data-l10n-id="{{entry}}"></div>
						</div>
					</div>
				</div>
                <div class="flex flex-col self-center items-center" data-bind-if="{{g_PlaceBuilding.shouldShowBaseYieldLosses}}">
					<div class="my-2 font-title uppercase text-gradient-secondary" data-l10n-id="LOC_CRAI_CMP_UI_CITY_VIEW_CONVERT_TO_URBAN_YIELD_LOSS_WARNING"></div>
                    <div class="my-2" data-l10n-id="LOC_CRAI_CMP_UI_CITY_VIEW_CONVERT_TO_URBAN_YIELD_LOSS_DESCRIPTION"></div>
                    <div class="flex flex-col mx-2">
 						<div data-bind-for="entry:{{g_PlaceBuilding.baseYieldLoss}}">
							<div data-bind-attr-data-l10n-id="{{entry}}"></div>
						</div>
                    </div>
				</div>
			</div>
		`;
        const yieldsContainer = MustGetElement(".yields-container", this.subsystemFrame);
        const cityYields = PlaceBuilding.cityYields;
        for (const yieldEntry of cityYields) {
            if (!yieldEntry.type) {
                continue;
            }
            const yieldDiv = document.createElement("div");
            yieldDiv.classList.add("flex", "flex-col", "mx-2");
            yieldsContainer.appendChild(yieldDiv);
            const yieldIcon = document.createElement("fxs-icon");
            yieldIcon.classList.add("size-8");
            yieldIcon.setAttribute("data-icon-id", yieldEntry.type);
            yieldDiv.appendChild(yieldIcon);
            const yieldValue = document.createElement("div");
            yieldValue.classList.add("self-center");
            yieldValue.textContent = Locale.compose("LOC_UI_YIELD_ONE_DECIMAL_NO_PLUS", yieldEntry.valueNum);
            yieldDiv.appendChild(yieldValue);
        }
        waitForLayout(() => {
            this.content = MustGetElement(".subsystem-frame__content", this.subsystemFrame);
            this.content.setAttribute("proxy-mouse", "true");
            this.content.setAttribute("handle-gamepad-pan", "true");
            this.content.componentCreatedEvent.on(component => { component.setEngineInputProxy(document.body); });
        });
    }
    setHidden(hidden) {
        this.Root.classList.toggle("hidden", hidden);
    }
}
Controls.define('panel-place-building', {
    createInstance: PlaceBuildingPanel,
    description: '',
    classNames: ['panel-place-building']
});

//# sourceMappingURL=file:///base-standard/ui/place-building/panel-place-building.js.map
