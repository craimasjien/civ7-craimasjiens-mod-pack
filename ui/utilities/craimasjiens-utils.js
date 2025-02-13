export function getCityForPlot(location) {
    return Cities.getAtLocation(location);
}

export function getPlotHasCity(location) {
    const thisCity = getCityForPlot(location);

    if (thisCity.location.x == location.x && thisCity.location.y == location.y) {
        return true;
    }

    return false;
}

export function HexToFloat4(hex, alpha = 1) {
    const r = (hex >> 16) & 0xff;
    const g = (hex >> 8) & 0xff;
    const b = hex & 0xff;
    return { x: r / 255, y: g / 255, z: b / 255, w: Math.min(1, Math.max(0, alpha)) };
};

export var ReligionColors;
(function (ReligionColors) {
    ReligionColors[ReligionColors["RELIGION_BUDDHISM"] = 0xF7C600] = "RELIGION_BUDDHISM";      // Golden Yellow
    ReligionColors[ReligionColors["RELIGION_CATHOLICISM"] = 0xB30000] = "RELIGION_CATHOLICISM";  // Deep Red
    ReligionColors[ReligionColors["RELIGION_CONFUCIANISM"] = 0xC4A000] = "RELIGION_CONFUCIANISM"; // Earthy Yellow
    ReligionColors[ReligionColors["RELIGION_HINDUISM"] = 0xFF6600] = "RELIGION_HINDUISM";        // Saffron Orange
    ReligionColors[ReligionColors["RELIGION_ISLAM"] = 0x009900] = "RELIGION_ISLAM";              // Strong Green
    ReligionColors[ReligionColors["RELIGION_JUDAISM"] = 0x0057B7] = "RELIGION_JUDAISM";          // Deep Blue
    ReligionColors[ReligionColors["RELIGION_ORTHODOXY"] = 0x8B0000] = "RELIGION_ORTHODOXY";      // Dark Red
    ReligionColors[ReligionColors["RELIGION_PROTESTANTISM"] = 0x800080] = "RELIGION_PROTESTANTISM";// Purple
    ReligionColors[ReligionColors["RELIGION_SHINTO"] = 0xE60000] = "RELIGION_SHINTO";            // Bright Red
    ReligionColors[ReligionColors["RELIGION_SIKHISM"] = 0xFFCC00] = "RELIGION_SIKHISM";          // Golden Yellow
    ReligionColors[ReligionColors["RELIGION_TAOISM"] = 0x66CC66FF ] = "RELIGION_TAOISM";            // Light Green
    ReligionColors[ReligionColors["RELIGION_ZOROASTRIANISM"] = 0xFFD700] = "RELIGION_ZOROASTRIANISM"; // Bright Gold

    ReligionColors[ReligionColors["RELIGION_CUSTOM_1"] = 0xFF00FF] = "RELIGION_CUSTOM_1";        // Magenta
    ReligionColors[ReligionColors["RELIGION_CUSTOM_2"] = 0x00FFFF00] = "RELIGION_CUSTOM_2";        // Cyan
    ReligionColors[ReligionColors["RELIGION_CUSTOM_3"] = 0xFF4500] = "RELIGION_CUSTOM_3";        // Orange-Red
    ReligionColors[ReligionColors["RELIGION_CUSTOM_4"] = 0x4B0082] = "RELIGION_CUSTOM_4";        // Indigo
    ReligionColors[ReligionColors["RELIGION_CUSTOM_5"] = 0x228B22] = "RELIGION_CUSTOM_5";        // Forest Green
    ReligionColors[ReligionColors["RELIGION_CUSTOM_6"] = 0xD2691E] = "RELIGION_CUSTOM_6";        // Chocolate Brown
    ReligionColors[ReligionColors["RELIGION_CUSTOM_7"] = 0x8A2BE2] = "RELIGION_CUSTOM_7";        // Blue Violet
    ReligionColors[ReligionColors["RELIGION_CUSTOM_8"] = 0xA52A2A] = "RELIGION_CUSTOM_8";        // Brown
    ReligionColors[ReligionColors["RELIGION_CUSTOM_9"] = 0xDC143C] = "RELIGION_CUSTOM_9";        // Crimson
    ReligionColors[ReligionColors["RELIGION_CUSTOM_10"] = 0x4682B4] = "RELIGION_CUSTOM_10";      // Steel Blue
    ReligionColors[ReligionColors["RELIGION_CUSTOM_11"] = 0x708090] = "RELIGION_CUSTOM_11";      // Slate Gray
    ReligionColors[ReligionColors["RELIGION_CUSTOM_12"] = 0x556B2F] = "RELIGION_CUSTOM_12";      // Dark Olive Green
})(ReligionColors || (ReligionColors = {}));

