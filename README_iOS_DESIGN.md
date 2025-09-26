# iOS Design System - Klartext App

Diese App wurde komplett mit modernen iOS Design Guidelines und SwiftUI-React-Native modernisiert.

## ✨ Implementierte Features

### 🎨 Design System

- **iOS System Colors**: Vollständige Implementierung der Apple System Colors (Light/Dark Mode)
- **Moderne Typografie**: iOS-konforme Schriftgrößen, Gewichtungen und Letter-Spacing
- **Adaptive Farben**: Automatische Anpassung an Light/Dark Mode
- **iOS Schatten**: Native iOS-Schatten und Elevation-Effekte

### 🧩 Komponenten

- **IOSCard**: Moderne iOS-style Card-Komponente
- **IOSSectionHeader**: Native iOS-Sektionsheader
- **IOSListItem**: iOS-konforme Listenelemente
- **Moderne Tab Bar**: Mit Blur-Effekten und iOS-Animationen

### 🎭 Animationen

- **Spring Animations**: iOS-native Federwirkungsanimationen
- **Pulse Effects**: Subtile Pulseffekte während Aufnahme
- **Fade Transitions**: Sanfte Ein-/Ausblendungen
- **Scale Transformations**: Interaktive Skalierungseffekte

### 📱 iOS-spezifische Features

- **Haptic Feedback**: iOS-natives haptisches Feedback
- **Blur Views**: iOS-native Unschärfe-Effekte
- **Safe Areas**: Korrekte Behandlung von Safe Areas
- **iOS Navigation**: Native iOS-Navigationspatterns

## 🎯 Design Principles

### Human Interface Guidelines

Die App folgt den Apple Human Interface Guidelines:

- **Clarity**: Klare, lesbare Typografie und Icons
- **Deference**: Inhalte im Vordergrund, UI im Hintergrund
- **Depth**: Schatten und Layering für Hierarchie

### Farbsystem

```typescript
// iOS System Colors implementiert
systemBlue: "#007AFF"; // Primary Action Color
systemRed: "#FF3B30"; // Destructive Actions
systemGreen: "#34C759"; // Success States
systemOrange: "#FF9500"; // Warning States
```

### Typografie

```typescript
// Large Title: 34pt, Bold
largeTitle: {
  fontSize: 34,
  fontWeight: '700',
  lineHeight: 41,
  letterSpacing: 0.37,
}

// Body: 17pt, Regular
body: {
  fontSize: 17,
  fontWeight: '400',
  lineHeight: 22,
  letterSpacing: -0.41,
}
```

## 🚀 Verwendung der neuen Komponenten

### IOSCard

```tsx
import { IOSCard } from "@/components/IOSCard";

<IOSCard elevated={true} padding={20}>
  <Text>Ihr Inhalt hier</Text>
</IOSCard>;
```

### IOSListItem

```tsx
import { IOSListItem } from "@/components/IOSCard";

<IOSListItem
  title="Aufzeichnung #1"
  subtitle="Heute, 14:30"
  rightElement={<ChevronRight />}
  onPress={() => {}}
/>;
```

## 📐 Layout-Patterns

### Card-basierte Layouts

- Rounded Corners (16px)
- iOS-konforme Schatten
- Adaptive Hintergrundfarben
- Proper Padding und Margins

### Gruppierte Listen

- Section Headers
- Separator Lines
- Swipe Actions
- Loading States

## 🌙 Dark Mode Support

Vollständige Dark Mode Unterstützung mit:

- Automatischer Erkennung der Systemeinstellung
- Angepasste Farben für bessere Lesbarkeit
- Korrekte Kontrastverhältnisse
- iOS-native Blur-Effekte

## 🔧 Technische Details

### Dependencies

- `swiftui-react-native`: ^6.3.3
- `expo-blur`: Für native Blur-Effekte
- `expo-haptics`: Für haptisches Feedback
- `react-native-shadow-2`: Für iOS-konforme Schatten

### Performance

- Native Driver für Animationen
- Optimierte Re-Renders
- Efficient Color Scheme Detection
- Lazy Loading für große Listen

## 📈 Zukünftige Verbesserungen

- [ ] SwiftUI View Controllers Integration
- [ ] iOS Widgets Support
- [ ] Apple Watch Companion
- [ ] Siri Shortcuts Integration
- [ ] iOS Focus Modes Support

---

Die App nutzt nun moderne iOS Design Patterns und bietet eine native iOS-Erfahrung mit React Native.
