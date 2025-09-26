import { useFocusEffect } from "@react-navigation/native";
import { BlurView } from "expo-blur";
import * as Haptics from "expo-haptics";
import { Clock, FileText, Trash2 } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet } from "react-native";
import Animated from "react-native-reanimated";
import { SafeAreaView } from "react-native-safe-area-context";
import { Shadow } from "react-native-shadow-2";

import { Text, View } from "@/components/Themed";
import { Transcript, TranscriptStorage } from "@/services/transcriptStorage";

export default function TabTwoScreen() {
  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTranscript, setExpandedTranscript] = useState<string | null>(
    null
  );

  const loadTranscripts = useCallback(async () => {
    try {
      const storedTranscripts = await TranscriptStorage.getTranscripts();
      setTranscripts(storedTranscripts);
    } catch (error) {
      console.error("Fehler beim Laden der Transkriptionen:", error);
      Alert.alert("Fehler", "Transkriptionen konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadTranscripts();
    }, [loadTranscripts])
  );

  const handleDeleteTranscript = useCallback(
    async (id: string) => {
      // Apple-like haptisches Feedback beim Drücken des Lösch-Buttons
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);

      Alert.alert(
        "Transkription löschen",
        "Möchten Sie diese Transkription wirklich löschen?",
        [
          {
            text: "Abbrechen",
            style: "cancel",
            onPress: async () => {
              await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
            },
          },
          {
            text: "Löschen",
            style: "destructive",
            onPress: async () => {
              try {
                await Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Warning
                );
                await TranscriptStorage.deleteTranscript(id);
                await loadTranscripts();
                await Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Success
                );
              } catch (error) {
                await Haptics.notificationAsync(
                  Haptics.NotificationFeedbackType.Error
                );
                Alert.alert(
                  "Fehler",
                  "Transkription konnte nicht gelöscht werden."
                );
              }
            },
          },
        ]
      );
    },
    [loadTranscripts]
  );

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleDateString("de-DE", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  const formatDuration = (seconds?: number) => {
    if (!seconds) return "";
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  const renderTranscriptItem = ({ item }: { item: Transcript }) => {
    const isExpanded = expandedTranscript === item.id;

    const handlePress = async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      setExpandedTranscript(isExpanded ? null : item.id);
    };

    return (
      <Shadow
        distance={8}
        startColor="#00000008"
        endColor="#00000001"
        offset={[0, 2]}
        style={styles.shadowContainer}
      >
        <BlurView intensity={20} tint="light" style={styles.blurCard}>
          <Pressable style={styles.transcriptCard} onPress={handlePress}>
            <View style={styles.transcriptHeader}>
              <View style={styles.transcriptInfo}>
                <View style={styles.transcriptMeta}>
                  <Clock size={14} color="#86868B" />
                  <Text style={styles.transcriptDate}>
                    {formatDate(item.createdAt)}
                    {item.duration && ` • ${formatDuration(item.duration)}`}
                  </Text>
                </View>
                <Text style={styles.transcriptPreview} numberOfLines={3}>
                  {item.summary || item.transcript}
                </Text>
              </View>
              <Pressable
                style={styles.deleteButton}
                onPress={() => handleDeleteTranscript(item.id)}
                hitSlop={8}
              >
                <Trash2 size={20} color="#FF3B30" />
              </Pressable>
            </View>

            {isExpanded && (
              <Animated.View style={styles.transcriptDetails}>
                {item.summary && (
                  <>
                    <Text style={styles.detailLabel}>Zusammenfassung</Text>
                    <Text style={styles.detailText}>{item.summary}</Text>
                  </>
                )}
                <Text style={styles.detailLabel}>
                  Vollständige Transkription
                </Text>
                <Text style={styles.detailText}>{item.transcript}</Text>
              </Animated.View>
            )}
          </Pressable>
        </BlurView>
      </Shadow>
    );
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <Text style={styles.title}>Transkript-Archiv</Text>
        <Text style={styles.loadingText}>Lade Transkriptionen...</Text>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <Text style={styles.title}>Transkript-Archiv</Text>
      {transcripts.length === 0 ? (
        <View style={styles.emptyContainer}>
          <Shadow
            distance={12}
            startColor="#00000005"
            endColor="#00000001"
            offset={[0, 3]}
            style={styles.emptyIconShadow}
          >
            <BlurView
              intensity={15}
              tint="light"
              style={styles.emptyIconContainer}
            >
              <FileText size={48} color="#C7C7CC" />
            </BlurView>
          </Shadow>
          <Text style={styles.emptyText}>
            Noch keine Transkriptionen vorhanden.{"\n"}
            Nehmen Sie Audio auf der Hauptseite auf.
          </Text>
        </View>
      ) : (
        <FlatList
          data={transcripts}
          keyExtractor={(item) => item.id}
          renderItem={renderTranscriptItem}
          contentContainerStyle={styles.listContainer}
          showsVerticalScrollIndicator={false}
        />
      )}
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 20,
  },
  title: {
    fontSize: 28,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginBottom: 32,
    color: "#1D1D1F",
  },
  loadingText: {
    fontSize: 17,
    color: "#86868B",
    textAlign: "center",
    marginTop: 20,
    fontFamily: "Inter_400Regular",
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyIconShadow: {
    borderRadius: 24,
  },
  emptyIconContainer: {
    borderRadius: 24,
    padding: 20,
    alignItems: "center",
    justifyContent: "center",
  },
  emptyText: {
    fontSize: 17,
    color: "#86868B",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 26,
    fontFamily: "Inter_400Regular",
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 20,
  },
  shadowContainer: {
    borderRadius: 16,
    marginBottom: 16,
    alignSelf: "stretch", // Volle Breite der Parent-Container nutzen
  },
  blurCard: {
    borderRadius: 16,
    flex: 1, // Volle verfügbare Breite nutzen
  },
  transcriptCard: {
    borderRadius: 16,
    overflow: "hidden",
    minHeight: 140, // Noch höhere Mindesthöhe
    width: "100%", // Volle Breite nutzen
  },
  transcriptHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 20,
    paddingBottom: 20, // Gleichmäßiges Padding
    minHeight: 100, // Mindesthöhe auch für den Header
  },
  transcriptInfo: {
    flex: 1,
  },
  transcriptMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
    flexWrap: "wrap", // Text kann umbrechen wenn nötig
  },
  transcriptDate: {
    fontSize: 13,
    color: "#86868B",
    marginLeft: 6,
    fontFamily: "Inter_400Regular",
  },
  transcriptPreview: {
    fontSize: 16,
    color: "#1D1D1F",
    lineHeight: 24,
    fontFamily: "Inter_400Regular",
    flex: 1, // Nimmt den verfügbaren Platz ein
    marginRight: 8, // Abstand zum Lösch-Button
  },
  deleteButton: {
    padding: 8,
    marginLeft: 12,
    borderRadius: 8,
    alignSelf: "flex-start", // Button oben ausrichten
  },
  transcriptDetails: {
    padding: 20,
    paddingTop: 16,
    borderTopWidth: 1,
    borderTopColor: "#F2F2F7",
  },
  detailLabel: {
    fontSize: 13,
    fontFamily: "Inter_600SemiBold",
    color: "#86868B",
    marginTop: 16,
    marginBottom: 8,
    textTransform: "uppercase",
    letterSpacing: 1.2,
  },
  detailText: {
    fontSize: 16,
    color: "#1D1D1F",
    lineHeight: 24,
    fontFamily: "Inter_400Regular",
  },
});
