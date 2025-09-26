import { useFocusEffect } from "@react-navigation/native";
import * as Haptics from "expo-haptics";
import { Archive, ChevronRight, Clock, Trash2 } from "lucide-react-native";
import { useCallback, useRef, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  Animated,
  FlatList,
  Platform,
  Pressable,
  StyleSheet,
  TouchableOpacity,
} from "react-native";
import { Swipeable } from "react-native-gesture-handler";
import { SafeAreaView } from "react-native-safe-area-context";

import { Text, View } from "@/components/Themed";
import { useColorScheme } from "@/components/useColorScheme";
import Colors from "@/constants/Colors";
import { Transcript, TranscriptStorage } from "@/services/transcriptStorage";

export default function TabTwoScreen() {
  const colorScheme = useColorScheme();
  const colors = Colors[colorScheme ?? "light"];

  const [transcripts, setTranscripts] = useState<Transcript[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedTranscript, setExpandedTranscript] = useState<string | null>(
    null
  );
  const swipeableRefs = useRef<Map<string, Swipeable>>(new Map());
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const loadTranscripts = useCallback(async () => {
    try {
      const storedTranscripts = await TranscriptStorage.getTranscripts();
      setTranscripts(storedTranscripts);

      // Fade-in Animation für die Liste
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    } catch (error) {
      console.error("Fehler beim Laden der Transkriptionen:", error);
      Alert.alert("Fehler", "Transkriptionen konnten nicht geladen werden.");
    } finally {
      setLoading(false);
    }
  }, [fadeAnim]);

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

  const renderRightActions = useCallback(
    (
      progress: Animated.AnimatedInterpolation<number>,
      dragX: Animated.AnimatedInterpolation<number>,
      item: Transcript
    ) => {
      const trans = dragX.interpolate({
        inputRange: [-80, 0],
        outputRange: [0, 80],
      });

      const scale = progress.interpolate({
        inputRange: [0, 1],
        outputRange: [0.8, 1],
      });

      return (
        <Animated.View
          style={[
            styles.deleteAction,
            {
              transform: [{ translateX: trans }, { scale }],
              backgroundColor: colors.destructive,
            },
          ]}
        >
          <TouchableOpacity
            style={styles.deleteActionButton}
            onPress={() => handleDeleteTranscript(item.id)}
          >
            <Trash2 size={20} color="#FFFFFF" strokeWidth={2} />
          </TouchableOpacity>
        </Animated.View>
      );
    },
    [colors.destructive, handleDeleteTranscript]
  );

  const closeAllSwipeables = useCallback(() => {
    swipeableRefs.current.forEach((ref) => {
      ref?.close();
    });
  }, []);

  const renderTranscriptItem = ({ item }: { item: Transcript }) => {
    const isExpanded = expandedTranscript === item.id;

    const handlePress = async () => {
      await Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
      closeAllSwipeables();
      setExpandedTranscript(isExpanded ? null : item.id);
    };

    const swipeableRef = (ref: Swipeable | null) => {
      if (ref) {
        swipeableRefs.current.set(item.id, ref);
      } else {
        swipeableRefs.current.delete(item.id);
      }
    };

    const handleSwipeableWillOpen = () => {
      // Schließe alle anderen Swipeables wenn diese geöffnet wird
      closeAllSwipeables();
    };

    // Wenn die Karte expanded ist, zeige nur die normale Karte ohne Swipeable
    if (isExpanded) {
      return (
        <View
          style={[
            styles.transcriptCard,
            { backgroundColor: colors.secondaryBackground },
          ]}
        >
          <Pressable onPress={handlePress} style={styles.cardPressable}>
            <View style={styles.transcriptHeader}>
              <View style={styles.transcriptInfo}>
                <View style={styles.transcriptMeta}>
                  <Clock
                    size={14}
                    color={colors.secondaryText}
                    strokeWidth={1.5}
                  />
                  <Text
                    style={[
                      styles.transcriptDate,
                      { color: colors.secondaryText },
                    ]}
                  >
                    {formatDate(item.createdAt)}
                    {item.duration && ` • ${formatDuration(item.duration)}`}
                  </Text>
                </View>
                <Text
                  style={[styles.transcriptPreview, { color: colors.text }]}
                  numberOfLines={3}
                >
                  {item.summary || item.transcript}
                </Text>
              </View>
              <Pressable
                style={[
                  styles.deleteButton,
                  { backgroundColor: colors.destructive + "15" },
                ]}
                onPress={() => handleDeleteTranscript(item.id)}
                hitSlop={8}
              >
                <Trash2 size={18} color={colors.destructive} strokeWidth={2} />
              </Pressable>
            </View>

            <View
              style={[
                styles.transcriptDetails,
                { borderTopColor: colors.separator },
              ]}
            >
              {item.summary && (
                <>
                  <View style={styles.detailHeader}>
                    <Text
                      style={[
                        styles.detailLabel,
                        { color: colors.secondaryText },
                      ]}
                    >
                      Zusammenfassung
                    </Text>
                    <View
                      style={[
                        styles.badge,
                        { backgroundColor: colors.success + "20" },
                      ]}
                    >
                      <Text
                        style={[styles.badgeText, { color: colors.success }]}
                      >
                        KI-Analyse
                      </Text>
                    </View>
                  </View>
                  <Text style={[styles.detailText, { color: colors.text }]}>
                    {item.summary}
                  </Text>
                </>
              )}
              <View style={styles.detailHeader}>
                <Text
                  style={[styles.detailLabel, { color: colors.secondaryText }]}
                >
                  Vollständige Transkription
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
              <Text style={[styles.detailText, { color: colors.text }]}>
                {item.transcript}
              </Text>
            </View>
          </Pressable>
        </View>
      );
    }

    // Wenn die Karte nicht expanded ist, zeige sie mit Swipeable
    return (
      <Swipeable
        ref={swipeableRef}
        renderRightActions={(progress, dragX) =>
          renderRightActions(progress, dragX, item)
        }
        onSwipeableWillOpen={handleSwipeableWillOpen}
        rightThreshold={40}
        friction={2}
        overshootFriction={8}
      >
        <View
          style={[
            styles.transcriptCard,
            { backgroundColor: colors.secondaryBackground },
          ]}
        >
          <Pressable onPress={handlePress} style={styles.cardPressable}>
            <View style={styles.transcriptHeader}>
              <View style={styles.transcriptInfo}>
                <View style={styles.transcriptMeta}>
                  <Clock
                    size={14}
                    color={colors.secondaryText}
                    strokeWidth={1.5}
                  />
                  <Text
                    style={[
                      styles.transcriptDate,
                      { color: colors.secondaryText },
                    ]}
                  >
                    {formatDate(item.createdAt)}
                    {item.duration && ` • ${formatDuration(item.duration)}`}
                  </Text>
                </View>
                <Text
                  style={[styles.transcriptPreview, { color: colors.text }]}
                  numberOfLines={3}
                >
                  {item.summary || item.transcript}
                </Text>
              </View>
              <View style={styles.cardActions}>
                <ChevronRight
                  size={16}
                  color={colors.tertiaryText}
                  strokeWidth={2}
                />
              </View>
            </View>
          </Pressable>
        </View>
      </Swipeable>
    );
  };

  if (loading) {
    return (
      <View style={[styles.container, { backgroundColor: colors.background }]}>
        <SafeAreaView style={styles.safeArea} edges={["top"]}>
          {/* Header */}
          <View style={[styles.header, { backgroundColor: colors.background }]}>
            <Text style={[styles.largeTitle, { color: colors.text }]}>
              Verlauf
            </Text>
            <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
              Ihre gespeicherten Aufzeichnungen
            </Text>
          </View>

          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color={colors.tint} />
            <Text style={[styles.loadingText, { color: colors.secondaryText }]}>
              Lade Transkriptionen...
            </Text>
          </View>
        </SafeAreaView>
      </View>
    );
  }

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <SafeAreaView style={styles.safeArea} edges={["top"]}>
        {/* Header */}
        <View style={[styles.header, { backgroundColor: colors.background }]}>
          <Text style={[styles.largeTitle, { color: colors.text }]}>
            Verlauf
          </Text>
          <Text style={[styles.subtitle, { color: colors.secondaryText }]}>
            {transcripts.length === 0
              ? "Keine Aufzeichnungen vorhanden"
              : `${transcripts.length} ${transcripts.length === 1 ? "Aufzeichnung" : "Aufzeichnungen"}`}
          </Text>
        </View>

        {transcripts.length === 0 ? (
          <View style={styles.emptyContainer}>
            <View
              style={[
                styles.emptyCard,
                { backgroundColor: colors.secondaryBackground },
              ]}
            >
              <View
                style={[
                  styles.emptyIconContainer,
                  { backgroundColor: colors.tertiaryBackground },
                ]}
              >
                <Archive
                  size={40}
                  color={colors.secondaryText}
                  strokeWidth={1.5}
                />
              </View>
              <Text style={[styles.emptyTitle, { color: colors.text }]}>
                Noch keine Aufzeichnungen
              </Text>
              <Text style={[styles.emptyText, { color: colors.secondaryText }]}>
                Ihre Sprachaufzeichnungen und Transkriptionen werden hier
                angezeigt.
              </Text>
            </View>
          </View>
        ) : (
          <Animated.View style={[styles.listWrapper, { opacity: fadeAnim }]}>
            <FlatList
              data={transcripts}
              keyExtractor={(item) => item.id}
              renderItem={renderTranscriptItem}
              contentContainerStyle={styles.listContainer}
              showsVerticalScrollIndicator={false}
              bounces={true}
              scrollIndicatorInsets={{ right: 1 }}
            />
          </Animated.View>
        )}
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
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  loadingText: {
    fontSize: 17,
    fontWeight: "400",
    lineHeight: 22,
    letterSpacing: -0.41,
    textAlign: "center",
    marginTop: 16,
  },
  emptyContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 20,
  },
  emptyCard: {
    borderRadius: 16,
    padding: 32,
    alignItems: "center",
    maxWidth: 280,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOffset: { width: 0, height: 2 },
        shadowOpacity: 0.08,
        shadowRadius: 8,
      },
      android: {
        elevation: 4,
      },
    }),
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 20,
  },
  emptyTitle: {
    fontSize: 20,
    fontWeight: "600",
    lineHeight: 24,
    letterSpacing: 0.38,
    textAlign: "center",
    marginBottom: 8,
  },
  emptyText: {
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 20,
    letterSpacing: -0.24,
    textAlign: "center",
    opacity: 0.8,
  },
  listWrapper: {
    flex: 1,
  },
  listContainer: {
    paddingHorizontal: 20,
    paddingBottom: 34,
  },
  transcriptCard: {
    borderRadius: 16,
    marginBottom: 12,
    overflow: "hidden",
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
  cardPressable: {
    flex: 1,
  },
  transcriptHeader: {
    flexDirection: "row",
    alignItems: "flex-start",
    padding: 16,
  },
  transcriptInfo: {
    flex: 1,
    marginRight: 12,
  },
  transcriptMeta: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 8,
  },
  transcriptDate: {
    fontSize: 13,
    fontWeight: "400",
    lineHeight: 18,
    letterSpacing: -0.08,
    marginLeft: 6,
  },
  transcriptPreview: {
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 20,
    letterSpacing: -0.24,
  },
  cardActions: {
    alignItems: "center",
    justifyContent: "center",
    paddingLeft: 8,
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
  },
  transcriptDetails: {
    padding: 16,
    paddingTop: 12,
    borderTopWidth: 0.5,
  },
  detailHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: 16,
    marginBottom: 8,
  },
  detailLabel: {
    fontSize: 13,
    fontWeight: "600",
    lineHeight: 18,
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  badge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  badgeText: {
    fontSize: 11,
    fontWeight: "600",
    letterSpacing: 0.5,
    textTransform: "uppercase",
  },
  detailText: {
    fontSize: 15,
    fontWeight: "400",
    lineHeight: 20,
    letterSpacing: -0.24,
  },
  deleteAction: {
    justifyContent: "center",
    alignItems: "center",
    width: 70,
    marginBottom: 12,
    marginRight: 20,
    borderRadius: 16,
  },
  deleteActionButton: {
    width: "100%",
    height: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
});
