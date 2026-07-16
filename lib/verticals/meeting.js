function buildMeetingSystemPrompt() {
  return (
    "Te egy meeting summarizer agent vagy magyar nyelven.\n" +
    "A felhasználó meeting jegyzetet / transcript részletet ad.\n\n" +
    "Feladatod:\n" +
    "1. Rövid összefoglaló (3-5 mondat)\n" +
    "2. Döntések listája\n" +
    "3. Action itemek: feladat, felelős (ha ismert), határidő (ha ismert)\n" +
    "4. Nyitott kérdések / rizikók\n" +
    "5. Follow-up e-mail vázlat a résztvevőknek\n\n" +
    "Hívd a summarize_meeting toolt minden jegyzetnél.\n" +
    "Ne találj ki résztvevőket vagy határidőket, ha nincsenek a szövegben — írd 'ismeretlen'.\n" +
    "A felhasználónak szóló rövid megerősítés sima magyar szöveg legyen."
  );
}

var MEETING_TOOLS = [
  {
    type: "function",
    function: {
      name: "summarize_meeting",
      description: "Strukturált meeting összefoglaló mentése / frissítése.",
      parameters: {
        type: "object",
        properties: {
          title: { type: "string", description: "Meeting rövid címe" },
          summary: { type: "string", description: "3-5 mondatos összefoglaló" },
          decisions: {
            type: "array",
            items: { type: "string" },
            description: "Meghozott döntések"
          },
          action_items: {
            type: "array",
            items: {
              type: "object",
              properties: {
                task: { type: "string" },
                owner: { type: "string" },
                due: { type: "string" }
              },
              required: ["task"],
              additionalProperties: false
            }
          },
          open_questions: {
            type: "array",
            items: { type: "string" }
          },
          follow_up_email: {
            type: "string",
            description: "Follow-up e-mail vázlat (tárgy + törzs)"
          },
          participants: {
            type: "array",
            items: { type: "string" },
            description: "Említett résztvevők"
          }
        },
        required: ["title", "summary", "decisions", "action_items", "follow_up_email"],
        additionalProperties: false
      }
    }
  }
];

function publicMeeting(args) {
  if (!args) return null;
  return {
    title: args.title || "Meeting összefoglaló",
    summary: args.summary || "",
    decisions: args.decisions || [],
    actionItems: (args.action_items || args.actionItems || []).map(function (item) {
      return {
        task: item.task,
        owner: item.owner || "ismeretlen",
        due: item.due || "ismeretlen"
      };
    }),
    openQuestions: args.open_questions || args.openQuestions || [],
    followUpEmail: args.follow_up_email || args.followUpEmail || "",
    participants: args.participants || [],
    meetingId: args.id || null
  };
}

module.exports = {
  buildMeetingSystemPrompt: buildMeetingSystemPrompt,
  MEETING_TOOLS: MEETING_TOOLS,
  publicMeeting: publicMeeting
};
