/**
 * Heavily "inspired" by https://github.com/hanweizhang/Civ7DiscoveryLens/blob/main/discovery-lens/modules/ui/dl/unit-selection-listener.js.
 * Thanks to @hanweizhang for the inspiration.
 */
import LensManager from "/core/ui/lenses/lens-manager.js";
import {
    InterfaceMode,
    InterfaceModeChangedEventName,
} from "/core/ui/interface-modes/interface-modes.js";

function isMissionary(type) {
    const unitDef = GameInfo.Units.lookup(type);
    return unitDef && unitDef.UnitType == "UNIT_MISSIONARY";
}

function onInterfaceModeChanged() {
    if (InterfaceMode.isInInterfaceMode("INTERFACEMODE_UNIT_SELECTED")) {
        const unitId = UI.Player.getHeadSelectedUnit();
        if (unitId) {
            const unit = Units.get(unitId);
            if (unit && isMissionary(unit.type)) {
                LensManager.setActiveLens("cmp-religion-lens");
            }
        }
    }
}
// Not listening to "UnitSelectionChanged" event because interface-mode-unit-selected.js's listener will be
// registered after the interface is changed. Hence it's setUnitLens method will reset the lens to default.
window.addEventListener(InterfaceModeChangedEventName, onInterfaceModeChanged);
