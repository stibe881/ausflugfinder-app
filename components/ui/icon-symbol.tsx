// Fallback for using MaterialIcons on Android and web.

import MaterialIcons from "@expo/vector-icons/MaterialIcons";
import { SymbolWeight, SymbolViewProps } from "expo-symbols";
import { ComponentProps } from "react";
import { OpaqueColorValue, type StyleProp, type TextStyle } from "react-native";

type IconMapping = Record<string, ComponentProps<typeof MaterialIcons>["name"]>;
type IconSymbolName = keyof typeof MAPPING;

/**
 * SF Symbols to Material Icons mappings for AusflugFinder App
 */
const MAPPING = {
  // Navigation
  "house.fill": "home",
  "magnifyingglass": "search",
  "heart.fill": "favorite",
  "calendar": "event",
  "person.fill": "person",
  
  // Actions
  "plus": "add",
  "xmark": "close",
  "chevron.left": "chevron-left",
  "chevron.right": "chevron-right",
  "chevron.down": "expand-more",
  "chevron.up": "expand-less",
  "arrow.left": "arrow-back",
  "arrow.right": "arrow-forward",
  
  // Trip related
  "map.fill": "map",
  "map": "map",
  "mappin.and.ellipse": "place",
  "location.fill": "my-location",
  "star.fill": "star",
  "star": "star-border",
  "checkmark.circle.fill": "check-circle",
  "checkmark": "check",
  
  // Content
  "photo.fill": "photo",
  "camera.fill": "camera-alt",
  "video.fill": "videocam",
  "doc.text.fill": "description",
  "list.bullet": "format-list-bulleted",
  "square.grid.2x2.fill": "grid-view",
  "square.grid.2x2": "grid-view",
  
  // Weather
  "sun.max.fill": "wb-sunny",
  "cloud.fill": "cloud",
  "cloud.rain.fill": "grain",
  "snowflake": "ac-unit",
  
  // Social
  "person.2.fill": "people",
  "bubble.left.fill": "chat",
  "paperplane.fill": "send",
  "square.and.arrow.up": "share",
  
  // Settings
  "gearshape.fill": "settings",
  "bell.fill": "notifications",
  "globe": "language",
  "moon.fill": "dark-mode",
  "sun.min.fill": "light-mode",
  
  // Misc
  "info.circle.fill": "info",
  "exclamationmark.triangle.fill": "warning",
  "trash.fill": "delete",
  "pencil": "edit",
  "slider.horizontal.3": "tune",
  "line.3.horizontal.decrease": "filter-list",
  "clock.fill": "schedule",
  "dollarsign.circle.fill": "attach-money",
  "bag.fill": "shopping-bag",
  "mountain.2.fill": "terrain",
  "figure.walk": "directions-walk",
  
  // Legacy
  "chevron.left.forwardslash.chevron.right": "code",
} as IconMapping;

/**
 * An icon component that uses native SF Symbols on iOS, and Material Icons on Android and web.
 */
export function IconSymbol({
  name,
  size = 24,
  color,
  style,
}: {
  name: IconSymbolName;
  size?: number;
  color: string | OpaqueColorValue;
  style?: StyleProp<TextStyle>;
  weight?: SymbolWeight;
}) {
  const iconName = MAPPING[name] || "help-outline";
  return <MaterialIcons color={color} size={size} name={iconName} style={style} />;
}

export type { IconSymbolName };
