
export function getCityOnPlot(location) {

}

export function getPlotHasCity(location, playerID) {
    const thisCity = Cities.getAtLocation(location);

    if (thisCity.location.x == location.x && thisCity.location.y == location.y) {
        return true;
    }

    return false;
}

export const HexToFloat4 = (hex, alpha = 1) => {
    const r = (hex >> 16) & 0xff;
    const g = (hex >> 8) & 0xff;
    const b = hex & 0xff;
    return { x: r / 255, y: g / 255, z: b / 255, w: Math.min(1, Math.max(0, alpha)) };
};

export const DISCOVERY_COLOR = HexToFloat4(0x24D618, .6);