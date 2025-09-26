import { useFocusEffect } from "@react-navigation/native";
import { Clock, FileText, Trash2 } from "lucide-react-native";
import { useCallback, useState } from "react";
import { Alert, FlatList, Pressable, StyleSheet } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";

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
      Alert.alert(
        "Transkription löschen",
        "Möchten Sie diese Transkription wirklich löschen?",
        [
          { text: "Abbrechen", style: "cancel" },
          {
            text: "Löschen",
            style: "destructive",
            onPress: async () => {
              try {
                await TranscriptStorage.deleteTranscript(id);
                await loadTranscripts();
              } catch (error) {
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

    return (
      <Pressable
        style={styles.transcriptCard}
        onPress={() => setExpandedTranscript(isExpanded ? null : item.id)}
      >
        <View style={styles.transcriptHeader}>
          <View style={styles.transcriptInfo}>
            <View style={styles.transcriptMeta}>
              <Clock size={14} color="#666" />
              <Text style={styles.transcriptDate}>
                {formatDate(item.createdAt)}
                {item.duration && ` • ${formatDuration(item.duration)}`}
              </Text>
            </View>
            <Text style={styles.transcriptPreview} numberOfLines={2}>
              {item.summary || item.transcript}
            </Text>
          </View>
          <Pressable
            style={styles.deleteButton}
            onPress={() => handleDeleteTranscript(item.id)}
            hitSlop={8}
          >
            <Trash2 size={20} color="#FF6B6B" />
          </Pressable>
        </View>

        {isExpanded && (
          <View style={styles.transcriptDetails}>
            {item.summary && (
              <>
                <Text style={styles.detailLabel}>Zusammenfassung</Text>
                <Text style={styles.detailText}>{item.summary}</Text>
              </>
            )}
            <Text style={styles.detailLabel}>Vollständige Transkription</Text>
            <Text style={styles.detailText}>{item.transcript}</Text>
          </View>
        )}
      </Pressable>
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
          <FileText size={48} color="#ccc" />
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
    fontSize: 24,
    fontFamily: "Inter_700Bold",
    textAlign: "center",
    marginBottom: 20,
  },
  loadingText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 20,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 40,
  },
  emptyText: {
    fontSize: 16,
    color: "#666",
    textAlign: "center",
    marginTop: 16,
    lineHeight: 24,
  },
  listContainer: {
    paddingHorizontal: 16,
    paddingBottom: 20,
  },
  transcriptCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 8,
    elevation: 3,
    overflow: "hidden",
  },
  transcriptHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
  },
  transcriptInfo: {
    flex: 1,
  },
  transcriptMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  transcriptDate: {
    fontSize: 12,
    color: "#666",
    marginLeft: 4,
    fontFamily: "Inter_400Regular",
  },
  transcriptPreview: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
  },
  deleteButton: {
    padding: 4,
    marginLeft: 8,
  },
  transcriptDetails: {
    padding: 16,
    paddingTop: 0,
    borderTopWidth: 1,
    borderTopColor: "#f0f0f0",
  },
  detailLabel: {
    fontSize: 14,
    fontFamily: "Inter_600SemiBold",
    color: "#333",
    marginTop: 12,
    marginBottom: 4,
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  detailText: {
    fontSize: 14,
    color: "#333",
    lineHeight: 20,
    fontFamily: "Inter_400Regular",
  },
});
