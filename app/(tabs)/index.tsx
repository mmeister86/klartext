import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { TranscriptStorage } from "@/services/transcriptStorage";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { LinearGradient } from "expo-linear-gradient";
import { Mic, Square } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Dimensions,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Shadow } from "react-native-shadow-2";

const { width, height } = Dimensions.get("window");

export default function TabOneScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [isUploading, setIsUploading] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(
    null
  );

  // Modern iOS-like Animations
  const pulseAnim = useRef(new Animated.Value(1)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const opacityAnim = useRef(new Animated.Value(1)).current;
  const contentAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    void (async () => {
      const status = await AudioModule.requestRecordingPermissionsAsync();
      if (!status.granted) {
        setError("Mikrofonzugriff wurde verweigert.");
        return;
      }

      await setAudioModeAsync({
        playsInSilentMode: true,
        allowsRecording: true,
      });
    })();
  }, []);

  // Moderne iOS-like Animationen für UI-Übergänge
  useEffect(() => {
    if (recorderState.isRecording) {
      // Pulsierender Effekt während Aufnahme
      Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.08,
            duration: 1000,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 1000,
            useNativeDriver: true,
          }),
        ])
      ).start();

      // Leichte Skalierung beim Start
      Animated.spring(scaleAnim, {
        toValue: 0.95,
        friction: 6,
        tension: 100,
        useNativeDriver: true,
      }).start();
    } else {
      // Reset Animationen
      pulseAnim.stopAnimation();
      Animated.spring(pulseAnim, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start();

      Animated.spring(scaleAnim, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start();
    }
  }, [recorderState.isRecording, pulseAnim, scaleAnim]);

  // Content Animation für Ergebnisse
  useEffect(() => {
    if (transcript || summary || error) {
      Animated.spring(contentAnim, {
        toValue: 1,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start();
    } else {
      Animated.spring(contentAnim, {
        toValue: 0,
        friction: 8,
        tension: 100,
        useNativeDriver: true,
      }).start();
    }
  }, [transcript, summary, error, contentAnim]);

  const sendToOpenAI = useCallback(async (uri: string | null | undefined) => {
    if (!uri) {
      setError("Die Audiodatei konnte nicht gespeichert werden.");
      setTranscript(null);
      setSummary(null);
      setIsUploading(false);
      return;
    }

    try {
      const apiBaseUrl = process.env.EXPO_PUBLIC_API_BASE_URL;
      if (!apiBaseUrl) {
        throw new Error(
          "Es wurde keine Backend-URL gesetzt (EXPO_PUBLIC_API_BASE_URL)."
        );
      }

      const formData = new FormData();
      formData.append("file", {
        uri,
        name: `aufnahme-${Date.now()}.m4a`,
        type: "audio/m4a",
      } as unknown as Blob);

      const endpoint = `${apiBaseUrl.replace(/\/$/, "")}/api/transcribe`;
      const response = await fetch(endpoint, {
        method: "POST",
        body: formData,
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(
          errorText || "Fehler beim serverseitigen Transkriptionsdienst."
        );
      }

      const data = (await response.json()) as {
        transcript?: string;
        summary?: string;
        error?: string;
      };

      if (data?.error) {
        throw new Error(data.error);
      }

      if (typeof data?.transcript === "string" && data.transcript.length > 0) {
        const transcriptText = data.transcript.trim();
        const summaryText = data.summary?.trim() || null;

        // Berechne die Aufnahmedauer
        const duration = recordingStartTime
          ? (Date.now() - recordingStartTime) / 1000
          : undefined;

        // Speichere die Transkription
        try {
          await TranscriptStorage.saveTranscript(
            transcriptText,
            summaryText,
            duration
          );
        } catch (storageError) {
          console.warn(
            "Transkription konnte nicht gespeichert werden:",
            storageError
          );
          // Speichere trotzdem im State für die Anzeige
        }

        setTranscript(transcriptText.length > 0 ? transcriptText : null);
        setSummary(summaryText && summaryText.length > 0 ? summaryText : null);
        setError(null);
        setRecordingStartTime(null);

        // Apple-like Erfolgs-Feedback
        await Haptics.notificationAsync(
          Haptics.NotificationFeedbackType.Success
        );
      } else {
        setTranscript(null);
        setSummary(null);
        setError(
          "Das Backend hat keine Transkription für die Aufnahme geliefert."
        );
        setRecordingStartTime(null);
      }
    } catch (err) {
      setTranscript(null);
      setSummary(null);
      setError(
        err instanceof Error
          ? err.message
          : "Unbekannter Fehler bei der Transkription."
      );
    } finally {
      setIsUploading(false);
    }
  }, []);

  const handleStartRecording = useCallback(async () => {
    try {
      // Apple-like haptisches Feedback beim Starten der Aufnahme
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      setError(null);
      setTranscript(null);
      setSummary(null);
      setRecordingStartTime(Date.now());
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (err) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setError(
        err instanceof Error
          ? err.message
          : "Unbekannter Fehler beim Starten der Aufnahme."
      );
      setRecordingStartTime(null);
    }
  }, [audioRecorder]);

  const handleStopRecording = useCallback(async () => {
    if (!recorderState.isRecording) {
      return;
    }

    try {
      // Apple-like haptisches Feedback beim Stoppen der Aufnahme
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setIsUploading(true);
      await audioRecorder.stop();
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: false,
      });
      await sendToOpenAI(audioRecorder.uri);
    } catch (err) {
      await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Error);
      setIsUploading(false);
      setError(
        err instanceof Error
          ? err.message
          : "Unbekannter Fehler beim Stoppen der Aufnahme."
      );
    }
  }, [audioRecorder, recorderState.isRecording, sendToOpenAI]);

  const handleRecordPress = useCallback(() => {
    if (isUploading) {
      return;
    }

    if (recorderState.isRecording) {
      void handleStopRecording();
    } else {
      void handleStartRecording();
    }
  }, [
    handleStartRecording,
    handleStopRecording,
    isUploading,
    recorderState.isRecording,
  ]);

  const statusText = useMemo(() => {
    if (isUploading) {
      return "Transkription wird erstellt...";
    }
    if (recorderState.isRecording) {
      return "Aufnahme läuft – tippe zum Beenden.";
    }
    if (summary) {
      return "Fertig! Hier ist die Zusammenfassung:";
    }
    if (transcript) {
      return "Fertig! Hier ist die letzte Transkription:";
    }
    return "Tippe auf den Button, um eine Aufnahme zu starten.";
  }, [isUploading, recorderState.isRecording, summary, transcript]);

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Header with iOS-style large title */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <Text style={[styles.largeTitle, { color: colors.text }]}>
            Klartext
          </Text>
          <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
            Sprachaufzeichnung mit KI-Transkription
          </Text>
        </View>

        <ScrollView
          style={styles.scrollView}
          contentContainerStyle={styles.scrollContent}
          showsVerticalScrollIndicator={false}
          bounces={true}
          scrollIndicatorInsets={{ right: 1 }}
        >
          {/* Main Recording Area mit iOS Card Design */}
          <View
            style={[
              styles.recordingCard,
              { backgroundColor: colors.secondaryBackground },
            ]}
          >
            {/* Recording Button mit modernern iOS Design */}
            <Animated.View
              style={[
                styles.recordingButtonContainer,
                {
                  transform: [
                    { scale: Animated.multiply(pulseAnim, scaleAnim) },
                  ],
                },
              ]}
            >
              <Shadow
                distance={recorderState.isRecording ? 24 : 16}
                startColor={
                  recorderState.isRecording
                    ? colors.destructive + "30"
                    : colors.tint + "20"
                }
                endColor="transparent"
                offset={[0, recorderState.isRecording ? 6 : 3]}
                style={styles.shadowContainer}
              >
                <LinearGradient
                  colors={
                    recorderState.isRecording
                      ? [
                          colors.destructive,
                          colorScheme === "dark" ? "#C53030" : "#E53E3E",
                        ]
                      : [
                          colors.tint,
                          colorScheme === "dark" ? "#0056b3" : "#005cbf",
                        ]
                  }
                  start={{ x: 0, y: 0 }}
                  end={{ x: 1, y: 1 }}
                  style={[
                    styles.gradientButton,
                    recorderState.isRecording && styles.recordingButton,
                  ]}
                >
                  <BlurView
                    intensity={
                      Platform.OS === "ios"
                        ? recorderState.isRecording
                          ? 30
                          : 15
                        : 0
                    }
                    tint={colorScheme === "dark" ? "dark" : "light"}
                    style={styles.blurOverlay}
                  >
                    <Pressable
                      onPress={handleRecordPress}
                      style={styles.pressableButton}
                      disabled={isUploading}
                      accessibilityRole="button"
                      accessibilityLabel={
                        recorderState.isRecording
                          ? "Aufnahme stoppen"
                          : "Audioaufnahme starten und an OpenAI senden"
                      }
                    >
                      {isUploading ? (
                        <ActivityIndicator color="#fff" size="large" />
                      ) : recorderState.isRecording ? (
                        <Square size={48} color="#fff" strokeWidth={3} />
                      ) : (
                        <Mic size={48} color="#fff" strokeWidth={2.5} />
                      )}
                    </Pressable>
                  </BlurView>
                </LinearGradient>
              </Shadow>
            </Animated.View>

            {/* Status Text mit besserer Typografie */}
            <Text style={[styles.statusText, { color: colors.text }]}>
              {statusText}
            </Text>

            {/* Recording Indicator */}
            {recorderState.isRecording && (
              <Animated.View
                style={[
                  styles.recordingIndicator,
                  { backgroundColor: colors.destructive + "20" },
                ]}
              >
                <View
                  style={[
                    styles.recordingDot,
                    { backgroundColor: colors.destructive },
                  ]}
                />
                <Text
                  style={[styles.recordingText, { color: colors.destructive }]}
                >
                  REC
                </Text>
              </Animated.View>
            )}
          </View>

          {/* Results Section mit iOS Card Design */}
          <Animated.View
            style={[
              styles.resultsContainer,
              {
                opacity: contentAnim,
                transform: [
                  {
                    translateY: contentAnim.interpolate({
                      inputRange: [0, 1],
                      outputRange: [20, 0],
                    }),
                  },
                ],
              },
            ]}
          >
            {summary && (
              <View
                style={[
                  styles.resultCard,
                  { backgroundColor: colors.secondaryBackground },
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    Zusammenfassung
                  </Text>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: colors.success + "20" },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: colors.success }]}>
                      KI-Analyse
                    </Text>
                  </View>
                </View>
                <Text style={[styles.resultText, { color: colors.text }]}>
                  {summary}
                </Text>
              </View>
            )}

            {transcript && (
              <View
                style={[
                  styles.resultCard,
                  { backgroundColor: colors.secondaryBackground },
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text style={[styles.cardTitle, { color: colors.text }]}>
                    Transkription
                  </Text>
                  <View
                    style={[
                      styles.badge,
                      { backgroundColor: colors.tint + "20" },
                    ]}
                  >
                    <Text style={[styles.badgeText, { color: colors.tint }]}>
                      Volltext
                    </Text>
                  </View>
                </View>
                <Text style={[styles.resultText, { color: colors.text }]}>
                  {transcript}
                </Text>
              </View>
            )}

            {error && (
              <View
                style={[
                  styles.resultCard,
                  styles.errorCard,
                  { backgroundColor: colors.destructive + "10" },
                ]}
              >
                <View style={styles.cardHeader}>
                  <Text
                    style={[styles.cardTitle, { color: colors.destructive }]}
                  >
                    Fehler
                  </Text>
                </View>
                <Text
                  style={[styles.resultText, { color: colors.destructive }]}
                >
                  {error}
                </Text>
              </View>
            )}
          </Animated.View>
        </ScrollView>
      </SafeAreaView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  safeArea: {
    flex: 1,
  },
  header: {
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 8,
  },
  largeTitle: {
    fontSize: 34,
    fontWeight: "700",
    lineHeight: 41,
    letterSpacing: 0.37,
    marginBottom: 4,
  },
  subtitle: {
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 20,
    letterSpacing: -0.24,
    opacity: 0.6,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    paddingHorizontal: 20,
    paddingBottom: 34,
  },
  recordingCard: {
    borderRadius: 16,
    padding: 32,
    marginBottom: 20,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.1,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  recordingButtonContainer: {
    marginBottom: 24,
  },
  shadowContainer: {
    borderRadius: 75,
  },
  gradientButton: {
    width: 150,
    height: 150,
    borderRadius: 75,
    alignItems: "center",
    justifyContent: "center",
  },
  recordingButton: {
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  blurOverlay: {
    width: "100%",
    height: "100%",
    borderRadius: 75,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
  },
  pressableButton: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    fontSize: 17,
    fontWeight: "400",
    lineHeight: 22,
    letterSpacing: -0.41,
    textAlign: "center",
    marginBottom: 16,
  },
  recordingIndicator: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginTop: 8,
  },
  recordingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginRight: 6,
  },
  recordingText: {
    fontSize: 13,
    fontWeight: "600",
    letterSpacing: 0.5,
  },
  resultsContainer: {
    width: "100%",
  },
  resultCard: {
    borderRadius: 16,
    padding: 20,
    marginBottom: 16,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 1 },
        shadowOpacity: 0.08,
        shadowRadius: 4,
      },
      android: {
        elevation: 2,
      },
    }),
  },
  errorCard: {
    borderWidth: 1,
    borderColor: "rgba(255, 59, 48, 0.2)",
  },
  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 12,
  },
  cardTitle: {
    fontSize: 17,
    fontWeight: "600",
    lineHeight: 22,
    letterSpacing: -0.41,
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 12,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  resultText: {
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 20,
    letterSpacing: -0.24,
  },
});
