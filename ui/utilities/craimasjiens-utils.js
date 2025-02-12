
export function getCityForPlot(location) {
    return Cities.getAtLocation(location);
}

export function getPlotHasCity(location) {
    console.error(JSON.stringify(location));
    const thisCity = getCityForPlot(location);

    if (thisCity.location.x == location.x && thisCity.location.y == location.y) {
        return true;
    }

    return false;
}

export var ReligionColors;
(function (ReligionColors) {
    ReligionColors[ReligionColors["RELIGION_BUDDHISM"] = 0xF7C600FF] = "RELIGION_BUDDHISM";      // Golden Yellow
    ReligionColors[ReligionColors["RELIGION_CATHOLICISM"] = 0xB30000FF] = "RELIGION_CATHOLICISM";  // Deep Red
    ReligionColors[ReligionColors["RELIGION_CONFUCIANISM"] = 0xC4A000FF] = "RELIGION_CONFUCIANISM"; // Earthy Yellow
    ReligionColors[ReligionColors["RELIGION_HINDUISM"] = 0xFF6600FF] = "RELIGION_HINDUISM";        // Saffron Orange
    ReligionColors[ReligionColors["RELIGION_ISLAM"] = 0x009900FF] = "RELIGION_ISLAM";              // Strong Green
    ReligionColors[ReligionColors["RELIGION_JUDAISM"] = 0x0057B7FF] = "RELIGION_JUDAISM";          // Deep Blue
    ReligionColors[ReligionColors["RELIGION_ORTHODOXY"] = 0x8B0000FF] = "RELIGION_ORTHODOXY";      // Dark Red
    ReligionColors[ReligionColors["RELIGION_PROTESTANTISM"] = 0x800080FF] = "RELIGION_PROTESTANTISM";// Purple
    ReligionColors[ReligionColors["RELIGION_SHINTO"] = 0xE60000FF] = "RELIGION_SHINTO";            // Bright Red
    ReligionColors[ReligionColors["RELIGION_SIKHISM"] = 0xFFCC00FF] = "RELIGION_SIKHISM";          // Golden Yellow
    ReligionColors[ReligionColors["RELIGION_TAOISM"] = 0x66CC66FF] = "RELIGION_TAOISM";            // Light Green
    ReligionColors[ReligionColors["RELIGION_ZOROASTRIANISM"] = 0xFFD700FF] = "RELIGION_ZOROASTRIANISM"; // Bright Gold

    ReligionColors[ReligionColors["RELIGION_CUSTOM_1"] = 0xFF00FFFF] = "RELIGION_CUSTOM_1";        // Magenta
    ReligionColors[ReligionColors["RELIGION_CUSTOM_2"] = 0x00FFFF00] = "RELIGION_CUSTOM_2";        // Cyan
    ReligionColors[ReligionColors["RELIGION_CUSTOM_3"] = 0xFF4500FF] = "RELIGION_CUSTOM_3";        // Orange-Red
    ReligionColors[ReligionColors["RELIGION_CUSTOM_4"] = 0x4B0082FF] = "RELIGION_CUSTOM_4";        // Indigo
    ReligionColors[ReligionColors["RELIGION_CUSTOM_5"] = 0x228B22FF] = "RELIGION_CUSTOM_5";        // Forest Green
    ReligionColors[ReligionColors["RELIGION_CUSTOM_6"] = 0xD2691EFF] = "RELIGION_CUSTOM_6";        // Chocolate Brown
    ReligionColors[ReligionColors["RELIGION_CUSTOM_7"] = 0x8A2BE2FF] = "RELIGION_CUSTOM_7";        // Blue Violet
    ReligionColors[ReligionColors["RELIGION_CUSTOM_8"] = 0xA52A2AFF] = "RELIGION_CUSTOM_8";        // Brown
    ReligionColors[ReligionColors["RELIGION_CUSTOM_9"] = 0xDC143CFF] = "RELIGION_CUSTOM_9";        // Crimson
    ReligionColors[ReligionColors["RELIGION_CUSTOM_10"] = 0x4682B4FF] = "RELIGION_CUSTOM_10";      // Steel Blue
    ReligionColors[ReligionColors["RELIGION_CUSTOM_11"] = 0x708090FF] = "RELIGION_CUSTOM_11";      // Slate Gray
    ReligionColors[ReligionColors["RELIGION_CUSTOM_12"] = 0x556B2FFF] = "RELIGION_CUSTOM_12";      // Dark Olive Green
})(ReligionColors || (ReligionColors = {}));