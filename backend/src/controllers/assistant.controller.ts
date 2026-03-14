import { type Response, type NextFunction } from "express";
import { type AuthRequest } from "../middlewares/auth.middleware.js";

// AI parsing fallback if no GEMINI_API_KEY is provided
const fallbackParse = (input: string) => {
  const lower = input.toLowerCase().trim();

  // Create commands: "Create task X", "Add task X"
  if (lower.startsWith("create task") || lower.startsWith("add task")) {
    const title = input.replace(/^(create task|add task)\s+/i, "").trim();
    // Default to 'todo' or extract status if possible
    let status = "todo";
    let cleanedTitle = title;

    if (title.endsWith(" in progress")) {
      status = "in-progress";
      cleanedTitle = title.replace(/\s*in progress$/i, "").trim();
    } else if (title.endsWith(" in done") || title.endsWith(" done")) {
      status = "done";
      cleanedTitle = title.replace(/\s*in done$|\s*done$/i, "").trim();
    }

    return { action: "create", title: cleanedTitle, status };
  }

  // Move commands: "Move task X to Y", "Set task X to Y", "Update task X to Y"
  if (
    lower.startsWith("move task") ||
    lower.startsWith("set task") ||
    lower.startsWith("update task")
  ) {
    const match = input.match(/(?:move|set|update) task (.+) to (.+)/i);
    if (match) {
      const title = match[1]?.trim() || "";
      const statusRaw = match[2]?.trim().toLowerCase() || "";

      const statusMap: Record<string, "todo" | "in-progress" | "done"> = {
        todo: "todo",
        "to do": "todo",
        "in progress": "in-progress",
        doing: "in-progress",
        done: "done",
        finished: "done",
        completed: "done",
      };

      return {
        action: "update",
        title,
        status: statusMap[statusRaw] || "todo",
      };
    }
  }

  return { action: null };
};

export const parseCommand = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction,
) => {
  try {
    const { prompt } = req.body;

    if (!prompt || typeof prompt !== "string") {
      return res.status(400).json({ message: "Invalid or missing prompt" });
    }

    // Attempt to use Google Generative AI if key is present
    const apiKey = process.env.GEMINI_API_KEY;
    if (apiKey) {
      try {
        // This is a basic fallback for older SDK, using standard endpoint structure.
        // If the workspace uses fetch natively we can just do a REST call to avoid sdk missing issues.
        const response = await fetch(
          `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              contents: [
                {
                  parts: [
                    {
                      text: `You are an AI task assistant. Parse this command: "${prompt}".
Return ONLY a valid JSON object matching this schema:
{
  "action": "create" | "update" | null,
  "title": string (if action is create or update),
  "status": "todo" | "in-progress" | "done" (default "todo" if create)
}
No markdown formatting, just the JSON.`,
                    },
                  ],
                },
              ],
              generationConfig: {
                temperature: 0.1,
                responseMimeType: "application/json",
              },
            }),
          },
        );

        if (response.ok) {
          const data = await response.json();
          const text = data?.candidates?.[0]?.content?.parts?.[0]?.text;
          if (text) {
            const parsed = JSON.parse(text);
            return res.json(parsed);
          }
        }
      } catch (err) {
        console.warn("Gemini API call failed, using fallback regex:", err);
      }
    }

    // Fallback to regex logic
    const parsed = fallbackParse(prompt);
    res.json(parsed);
  } catch (error) {
    next(error);
  }
};
