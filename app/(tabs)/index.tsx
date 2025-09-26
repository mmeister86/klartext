import { Text } from "@/components/Themed";
import { TranscriptStorage } from "@/services/transcriptStorage";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
import { LinearGradient } from "expo-linear-gradient";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Mic, Square } from "lucide-react-native";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  ActivityIndicator,
  Animated,
  Pressable,
  ScrollView,
  StyleSheet,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Shadow } from "react-native-shadow-2";

export default function TabOneScreen() {
  const audioRecorder = useAudioRecorder(RecordingPresets.HIGH_QUALITY);
  const recorderState = useAudioRecorderState(audioRecorder);
  const [isUploading, setIsUploading] = useState(false);
  const [transcript, setTranscript] = useState<string | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [recordingStartTime, setRecordingStartTime] = useState<number | null>(
    null
  );

  const pulseAnim = useRef(new Animated.Value(1)).current;

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

  // Apple-like Animation für den Button während der Aufnahme
  useEffect(() => {
    if (recorderState.isRecording) {
      // Subtile Skalierung mit spring-ähnlichem Effekt
      Animated.spring(pulseAnim, {
        toValue: 1.05,
        friction: 3,
        tension: 100,
        useNativeDriver: true,
      }).start();
    } else {
      // Sanfte Rückkehr zur Normalgröße
      Animated.spring(pulseAnim, {
        toValue: 1,
        friction: 4,
        tension: 100,
        useNativeDriver: true,
      }).start();
    }
  }, [recorderState.isRecording, pulseAnim]);

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
        await Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
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
    <SafeAreaView style={styles.container}>
      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <Animated.View
          style={{
            transform: [{ scale: pulseAnim }],
          }}
        >
          <Shadow
            distance={16}
            startColor="#FF4D4F20"
            endColor="#00000005"
            offset={[0, 8]}
            style={styles.shadowContainer}
          >
            <LinearGradient
              colors={
                recorderState.isRecording
                  ? ['#E53E3E', '#C53030', '#9B2C2C'] // Dunklere Rot-Töne beim Aufnehmen
                  : ['#FF6B6B', '#FF4D4F', '#E53E3E'] // Helle Rot-Töne im Normalzustand
              }
              start={{ x: 0, y: 0 }}
              end={{ x: 1, y: 1 }}
              style={styles.gradientButton}
            >
              <BlurView
                intensity={recorderState.isRecording ? 40 : 20}
                tint="light"
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
                    <Square size={56} color="#fff" />
                  ) : (
                    <Mic size={56} color="#fff" />
                  )}
                </Pressable>
              </BlurView>
            </LinearGradient>
          </Shadow>
        </Animated.View>
        <Text style={styles.statusText}>{statusText}</Text>
        {summary ? (
          <>
            <Text style={styles.transcriptLabel}>Zusammenfassung</Text>
            <Text style={styles.transcriptText}>{summary}</Text>
          </>
        ) : null}
        {transcript ? (
          <>
            <Text style={styles.transcriptLabel}>Transkription</Text>
            <Text style={styles.transcriptText}>{transcript}</Text>
          </>
        ) : null}
        {error ? <Text style={styles.errorText}>{error}</Text> : null}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    flexGrow: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
    paddingVertical: 20,
  },
  shadowContainer: {
    borderRadius: 90,
  },
  gradientButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  blurOverlay: {
    width: "100%",
    height: "100%",
    borderRadius: 90,
    alignItems: "center",
    justifyContent: "center",
  },
  pressableButton: {
    width: "100%",
    height: "100%",
    alignItems: "center",
    justifyContent: "center",
  },
  statusText: {
    marginTop: 32,
    fontSize: 17,
    textAlign: "center",
    color: "#1D1D1F",
    fontFamily: "Inter_400Regular",
    opacity: 0.8,
  },
  transcriptLabel: {
    marginTop: 40,
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 1.2,
    color: "#86868B",
    textAlign: "center",
  },
  transcriptText: {
    marginTop: 12,
    fontSize: 17,
    lineHeight: 26,
    textAlign: "center",
    color: "#1D1D1F",
    fontFamily: "Inter_400Regular",
  },
  errorText: {
    marginTop: 20,
    fontSize: 15,
    color: "#FF3B30",
    textAlign: "center",
    fontFamily: "Inter_500Medium",
  },
});
