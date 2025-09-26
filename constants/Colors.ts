// Moderne iOS Design System Farben basierend auf Apple Human Interface Guidelines
const tintColorLight = "#007AFF"; // iOS System Blue
const tintColorDark = "#0A84FF"; // iOS System Blue (Dark Mode)

const systemColors = {
  // iOS System Colors
  systemBlue: "#007AFF",
  systemBlueDark: "#0A84FF",
  systemRed: "#FF3B30",
  systemRedDark: "#FF453A",
  systemGreen: "#34C759",
  systemGreenDark: "#30D158",
  systemOrange: "#FF9500",
  systemOrangeDark: "#FF9F0A",
  systemYellow: "#FFCC00",
  systemYellowDark: "#FFD60A",
  systemPink: "#FF2D92",
  systemPinkDark: "#FF375F",
  systemPurple: "#AF52DE",
  systemPurpleDark: "#BF5AF2",
  systemTeal: "#5AC8FA",
  systemTealDark: "#64D2FF",
  systemIndigo: "#5856D6",
  systemIndigoDark: "#5E5CE6",

  // iOS Label Colors
  label: "#000000",
  labelDark: "#FFFFFF",
  secondaryLabel: "#3C3C43",
  secondaryLabelDark: "#EBEBF5",
  tertiaryLabel: "#3C3C43",
  tertiaryLabelDark: "#EBEBF5",

  // iOS Background Colors
  systemBackground: "#FFFFFF",
  systemBackgroundDark: "#000000",
  secondarySystemBackground: "#F2F2F7",
  secondarySystemBackgroundDark: "#1C1C1E",
  tertiarySystemBackground: "#FFFFFF",
  tertiarySystemBackgroundDark: "#2C2C2E",

  // iOS Grouped Background Colors
  systemGroupedBackground: "#F2F2F7",
  systemGroupedBackgroundDark: "#000000",
  secondarySystemGroupedBackground: "#FFFFFF",
  secondarySystemGroupedBackgroundDark: "#1C1C1E",
  tertiarySystemGroupedBackground: "#F2F2F7",
  tertiarySystemGroupedBackgroundDark: "#2C2C2E",

  // iOS Fill Colors
  systemFill: "#78788033",
  systemFillDark: "#7878805C",
  secondarySystemFill: "#78788028",
  secondarySystemFillDark: "#78788051",
  tertiarySystemFill: "#7676801E",
  tertiarySystemFillDark: "#7676803D",
  quaternarySystemFill: "#74748014",
  quaternarySystemFillDark: "#7676802E",

  // iOS Separator Colors
  separator: "#3C3C4336",
  separatorDark: "#54545899",
  opaqueSeparator: "#C6C6C8",
  opaqueSeparatorDark: "#38383A",
};

export default {
  light: {
    text: systemColors.label,
    background: systemColors.systemBackground,
    tint: tintColorLight,
    tabIconDefault: systemColors.secondaryLabel,
    tabIconSelected: tintColorLight,

    // Zusätzliche iOS-spezifische Farben
    secondaryText: systemColors.secondaryLabel,
    tertiaryText: systemColors.tertiaryLabel,
    secondaryBackground: systemColors.secondarySystemBackground,
    tertiaryBackground: systemColors.tertiarySystemBackground,
    groupedBackground: systemColors.systemGroupedBackground,
    secondaryGroupedBackground: systemColors.secondarySystemGroupedBackground,

    systemFill: systemColors.systemFill,
    secondarySystemFill: systemColors.secondarySystemFill,
    tertiarySystemFill: systemColors.tertiarySystemFill,
    quaternarySystemFill: systemColors.quaternarySystemFill,

    separator: systemColors.separator,
    opaqueSeparator: systemColors.opaqueSeparator,

    // Aktionsfarben
    destructive: systemColors.systemRed,
    warning: systemColors.systemOrange,
    success: systemColors.systemGreen,
  },
  dark: {
    text: systemColors.labelDark,
    background: systemColors.systemBackgroundDark,
    tint: tintColorDark,
    tabIconDefault: systemColors.secondaryLabelDark,
    tabIconSelected: tintColorDark,

    // Zusätzliche iOS-spezifische Farben (Dark Mode)
    secondaryText: systemColors.secondaryLabelDark,
    tertiaryText: systemColors.tertiaryLabelDark,
    secondaryBackground: systemColors.secondarySystemBackgroundDark,
    tertiaryBackground: systemColors.tertiarySystemBackgroundDark,
    groupedBackground: systemColors.systemGroupedBackgroundDark,
    secondaryGroupedBackground:
      systemColors.secondarySystemGroupedBackgroundDark,

    systemFill: systemColors.systemFillDark,
    secondarySystemFill: systemColors.secondarySystemFillDark,
    tertiarySystemFill: systemColors.tertiarySystemFillDark,
    quaternarySystemFill: systemColors.quaternarySystemFillDark,

    separator: systemColors.separatorDark,
    opaqueSeparator: systemColors.opaqueSeparatorDark,

    // Aktionsfarben (Dark Mode)
    destructive: systemColors.systemRedDark,
    warning: systemColors.systemOrangeDark,
    success: systemColors.systemGreenDark,
  },

  // Direkte Farbreferenzen für SwiftUI-React-Native
  system: systemColors,
};
