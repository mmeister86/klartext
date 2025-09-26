import AsyncStorage from "@react-native-async-storage/async-storage";

export interface Transcript {
  id: string;
  transcript: string;
  summary: string | null;
  createdAt: string;
  duration?: number; // in Sekunden
}

const STORAGE_KEY = "transcripts";

export class TranscriptStorage {
  static async saveTranscript(
    transcript: string,
    summary: string | null,
    duration?: number
  ): Promise<Transcript> {
    try {
      const newTranscript: Transcript = {
        id: Date.now().toString(),
        transcript,
        summary,
        createdAt: new Date().toISOString(),
        duration,
      };

      const existingTranscripts = await this.getTranscripts();
      const updatedTranscripts = [newTranscript, ...existingTranscripts];

      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(updatedTranscripts)
      );
      return newTranscript;
    } catch (error) {
      console.error("Fehler beim Speichern der Transkription:", error);
      throw new Error("Transkription konnte nicht gespeichert werden");
    }
  }

  static async getTranscripts(): Promise<Transcript[]> {
    try {
      const stored = await AsyncStorage.getItem(STORAGE_KEY);
      if (!stored) return [];

      const transcripts = JSON.parse(stored) as Transcript[];
      // Sortiere nach Erstellungsdatum (neueste zuerst)
      return transcripts.sort(
        (a, b) =>
          new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
      );
    } catch (error) {
      console.error("Fehler beim Laden der Transkriptionen:", error);
      return [];
    }
  }

  static async getTranscript(id: string): Promise<Transcript | null> {
    try {
      const transcripts = await this.getTranscripts();
      return transcripts.find((t) => t.id === id) || null;
    } catch (error) {
      console.error("Fehler beim Laden der Transkription:", error);
      return null;
    }
  }

  static async deleteTranscript(id: string): Promise<void> {
    try {
      const transcripts = await this.getTranscripts();
      const filteredTranscripts = transcripts.filter((t) => t.id !== id);
      await AsyncStorage.setItem(
        STORAGE_KEY,
        JSON.stringify(filteredTranscripts)
      );
    } catch (error) {
      console.error("Fehler beim Löschen der Transkription:", error);
      throw new Error("Transkription konnte nicht gelöscht werden");
    }
  }

  static async clearAllTranscripts(): Promise<void> {
    try {
      await AsyncStorage.removeItem(STORAGE_KEY);
    } catch (error) {
      console.error("Fehler beim Löschen aller Transkriptionen:", error);
      throw new Error("Transkriptionen konnten nicht gelöscht werden");
    }
  }
}
