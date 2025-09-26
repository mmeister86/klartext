import { BlurView } from "expo-blur";
import { StatusBar } from "expo-status-bar";
import { Platform, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Shadow } from "react-native-shadow-2";

import EditScreenInfo from "@/components/EditScreenInfo";
import { Text, View } from "@/components/Themed";

export default function ModalScreen() {
  return (
    <BlurView intensity={20} tint="light" style={styles.blurContainer}>
      <SafeAreaView style={styles.container}>
        <Shadow
          distance={8}
          startColor="#00000010"
          endColor="#00000002"
          offset={[0, 2]}
          style={styles.titleShadow}
        >
          <BlurView intensity={40} tint="light" style={styles.titleContainer}>
            <Text style={styles.title}>Einstellungen</Text>
          </BlurView>
        </Shadow>

        <Shadow
          distance={6}
          startColor="#00000008"
          endColor="#00000001"
          offset={[0, 1]}
          style={styles.separatorShadow}
        >
          <View style={styles.separator} />
        </Shadow>

        <Shadow
          distance={12}
          startColor="#00000005"
          endColor="#00000001"
          offset={[0, 3]}
          style={styles.contentShadow}
        >
          <BlurView intensity={30} tint="light" style={styles.contentContainer}>
            <EditScreenInfo path="app/modal.tsx" />
          </BlurView>
        </Shadow>

        {/* Use a light status bar on iOS to account for the black space above the modal */}
        <StatusBar style={Platform.OS === "ios" ? "light" : "auto"} />
      </SafeAreaView>
    </BlurView>
  );
}

const styles = StyleSheet.create({
  blurContainer: {
    flex: 1,
  },
  container: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  titleShadow: {
    borderRadius: 16,
    marginBottom: 24,
  },
  titleContainer: {
    borderRadius: 16,
    paddingHorizontal: 24,
    paddingVertical: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    color: "#1D1D1F",
    textAlign: "center",
  },
  separatorShadow: {
    borderRadius: 0.5,
    marginVertical: 32,
  },
  separator: {
    height: 1,
    width: 200,
    backgroundColor: "#C6C6C8",
    opacity: 0.3,
  },
  contentShadow: {
    borderRadius: 20,
  },
  contentContainer: {
    borderRadius: 20,
    padding: 20,
    minWidth: 300,
  },
});
