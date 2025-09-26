import Busboy from "busboy";
import { createServer } from "http";
import OpenAI from "openai";
import { toFile } from "openai/uploads";

const port = Number.parseInt(process.env.PORT ?? "4000", 10);
const openaiApiKey = process.env.OPENAI_API_KEY;
const corsAllowOrigin = process.env.CORS_ALLOW_ORIGIN ?? "*";

if (!openaiApiKey) {
  console.warn(
    "[warn] Es wurde kein OPENAI_API_KEY gesetzt. Der Transkriptions-Server kann ohne diesen Schlüssel nicht arbeiten."
  );
}

const openaiClient = new OpenAI({ apiKey: openaiApiKey });

const sendJson = (res, status, data) => {
  const body = Buffer.from(JSON.stringify(data), "utf-8");
  res.writeHead(status, {
    "Content-Type": "application/json; charset=utf-8",
    "Content-Length": body.length,
    "Access-Control-Allow-Origin": corsAllowOrigin,
  });
  res.end(body);
};

const sendText = (res, status, message) => {
  const body = Buffer.from(message, "utf-8");
  res.writeHead(status, {
    "Content-Type": "text/plain; charset=utf-8",
    "Content-Length": body.length,
    "Access-Control-Allow-Origin": corsAllowOrigin,
  });
  res.end(body);
};

const parseMultipart = (req) =>
  new Promise((resolve, reject) => {
    try {
      const busboy = Busboy({
        headers: req.headers,
        limits: {
          files: 1,
          fileSize: 25 * 1024 * 1024,
        },
      });

      let fileBuffer = Buffer.alloc(0);
      let fileMeta = null;
      let aborted = false;

      busboy.on("file", (fieldname, file, info) => {
        if (fieldname !== "file") {
          file.resume();
          return;
        }

        fileMeta = {
          filename: info.filename ?? "aufnahme.m4a",
          mimeType: info.mimeType || info.mime || "audio/m4a",
        };

        const chunks = [];
        file.on("data", (chunk) => {
          chunks.push(chunk);
        });
        file.on("limit", () => {
          aborted = true;
          reject(
            new Error("Die Audiodatei überschreitet das Limit von 25 MB.")
          );
        });
        file.on("end", () => {
          if (!aborted) {
            fileBuffer = Buffer.concat(chunks);
          }
        });
      });

      busboy.on("finish", () => {
        if (aborted) {
          return;
        }

        if (!fileMeta || fileBuffer.length === 0) {
          resolve(null);
          return;
        }

        resolve({
          buffer: fileBuffer,
          filename: fileMeta.filename,
          mimeType: fileMeta.mimeType,
        });
      });

      busboy.on("error", (error) => {
        aborted = true;
        reject(error);
      });

      req.pipe(busboy);
    } catch (error) {
      reject(error);
    }
  });

const server = createServer(async (req, res) => {
  if (req.method === "OPTIONS") {
    res.writeHead(204, {
      "Access-Control-Allow-Origin": corsAllowOrigin,
      "Access-Control-Allow-Methods": "GET,POST,OPTIONS",
      "Access-Control-Allow-Headers": "Content-Type,Authorization",
    });
    res.end();
    return;
  }

  if (req.url === "/health" && req.method === "GET") {
    sendJson(res, 200, { status: "ok" });
    return;
  }

  if (req.url === "/api/transcribe" && req.method === "POST") {
    if (!openaiApiKey) {
      sendJson(res, 500, { error: "OPENAI_API_KEY ist nicht konfiguriert." });
      return;
    }

    try {
      const file = await parseMultipart(req);
      if (!file) {
        sendJson(res, 400, { error: "Es wurde keine Audiodatei gesendet." });
        return;
      }

      const transcription = await openaiClient.audio.transcriptions.create({
        file: await toFile(file.buffer, file.filename, {
          type: file.mimeType,
        }),
        model: "gpt-4o-mini-transcribe",
      });

      const transcriptText =
        typeof transcription.text === "string" ? transcription.text.trim() : "";

      let summaryText = "";
      if (transcriptText.length > 0) {
        const response = await openaiClient.responses.create({
          model: "gpt-4o-mini",
          input: [
            {
              role: "system",
              content: [
                {
                  type: "input_text",
                  text: "Fasse das folgende Transkript in maximal fünf prägnanten Sätzen auf Deutsch zusammen.",
                },
              ],
            },
            {
              role: "user",
              content: [
                {
                  type: "input_text",
                  text: transcriptText,
                },
              ],
            },
          ],
        });

        summaryText = response.output_text?.trim() ?? "";
      }

      sendJson(res, 200, {
        transcript: transcriptText.length > 0 ? transcriptText : null,
        summary: summaryText.length > 0 ? summaryText : null,
      });
    } catch (error) {
      console.error(
        "Fehler bei der Transkription oder Zusammenfassung:",
        error
      );
      const message =
        error instanceof Error && error.message
          ? error.message
          : "Unbekannter Fehler bei der Transkription.";
      sendJson(res, 500, { error: message });
    }
    return;
  }

  sendText(res, 404, "Route nicht gefunden.");
});

server.listen(port, () => {
  console.log(`Transkriptions-Server läuft auf Port ${port}`);
});
