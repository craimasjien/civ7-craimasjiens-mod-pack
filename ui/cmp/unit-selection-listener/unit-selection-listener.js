/**
 * Heavily inspired by wltk' discovery-lens solution.
 */

import LensManager from '/core/ui/lenses/lens-manager.js';
import { InterfaceMode } from '/core/ui/interface-modes/interface-modes.js';

const UNIT_TYPE_MISSIONARY = "UNIT_MISSIONARY";

function unitHasReplacements(type) {
    const replaceDef = GameInfo.UnitReplaces.lookup(type);
    return replaceDef?.ReplacesUnitType === UNIT_TYPE_MISSIONARY;
}

function isMissionary(type) {
    const unitDef = GameInfo.Units.lookup(type);
    return unitDef?.UnitType === UNIT_TYPE_MISSIONARY || unitHasReplacements(type);
}

function onUnitSelectionChanged(data) {
    if (data == null) {
        return;
    }

    setTimeout(() => {
        if (data.selected && InterfaceMode.isInInterfaceMode("INTERFACEMODE_UNIT_SELECTED")) {
            const unit = Units.get(data.unit);
            if (unit && isMissionary(unit.type)) {
                LensManager.setActiveLens("cmp-religion-lens");
            }
        }
    });
}

engine.on('UnitSelectionChanged', onUnitSelectionChanged);