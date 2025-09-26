import { Text } from "@/components/Themed";
import { TranscriptStorage } from "@/services/transcriptStorage";
import {
  AudioModule,
  RecordingPresets,
  setAudioModeAsync,
  useAudioRecorder,
  useAudioRecorderState,
} from "expo-audio";
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

  // Pulsier-Animation für den Button während der Aufnahme
  useEffect(() => {
    if (recorderState.isRecording) {
      const pulseAnimation = Animated.loop(
        Animated.sequence([
          Animated.timing(pulseAnim, {
            toValue: 1.2,
            duration: 600,
            useNativeDriver: true,
          }),
          Animated.timing(pulseAnim, {
            toValue: 1,
            duration: 600,
            useNativeDriver: true,
          }),
        ])
      );
      pulseAnimation.start();
      return () => pulseAnimation.stop();
    } else {
      // Animation stoppen und auf Ursprungswert zurücksetzen
      Animated.timing(pulseAnim, {
        toValue: 1,
        duration: 200,
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
      setError(null);
      setTranscript(null);
      setSummary(null);
      setRecordingStartTime(Date.now());
      await audioRecorder.prepareToRecordAsync();
      audioRecorder.record();
    } catch (err) {
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
      setIsUploading(true);
      await audioRecorder.stop();
      await setAudioModeAsync({
        allowsRecording: false,
        playsInSilentMode: false,
      });
      await sendToOpenAI(audioRecorder.uri);
    } catch (err) {
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
          <Pressable
            onPress={handleRecordPress}
            style={[
              styles.recordButton,
              recorderState.isRecording && styles.recordButtonActive,
            ]}
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
  recordButton: {
    width: 180,
    height: 180,
    borderRadius: 90,
    backgroundColor: "#FF4D4F",
    alignItems: "center",
    justifyContent: "center",
    shadowColor: "#000",
    shadowOpacity: 0.25,
    shadowOffset: { width: 0, height: 8 },
    shadowRadius: 16,
    elevation: 6,
  },
  recordButtonActive: {
    backgroundColor: "#D9363E",
  },
  statusText: {
    marginTop: 24,
    fontSize: 16,
    textAlign: "center",
  },
  transcriptLabel: {
    marginTop: 32,
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    textTransform: "uppercase",
    letterSpacing: 0.8,
  },
  transcriptText: {
    marginTop: 8,
    fontSize: 16,
    lineHeight: 24,
    textAlign: "center",
  },
  errorText: {
    marginTop: 16,
    fontSize: 14,
    color: "#FF6B6B",
    textAlign: "center",
  },
});
