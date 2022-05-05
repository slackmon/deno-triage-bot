import { DefineFunction, Manifest, Schema } from "deno-slack-sdk/mod.ts";

const TriageReportFunction = DefineFunction({
  callback_id: "triage_channel",
  title: "Triage Channel",
  description: "Calculate stats for a triage channel",
  source_file: "functions/triage_channel.ts",
  input_parameters: {
    properties: {
      targetChannel: {
        type: Schema.slack.types.channel_id,
        description: "The channel to triage",
      },
      daysToLookback: {
        type: Schema.types.string,
        description: "How many days to look back (defaults to 7)",
      },
    },
    required: ["targetChannel"],
  },
  output_parameters: {
    properties: {
      urgentItems: {
        type: Schema.types.string,
        description: "Details on urgent priority items",
      },
      mediumItems: {
        type: Schema.types.string,
        description: "Details on medium priority items",
      },
      lowItems: {
        type: Schema.types.string,
        description: "Details on low priority items",
      },
    },
    required: ["urgentItems", "mediumItems", "lowItems"],
  },
});

export default Manifest({
  name: "TriageBot",
  description: "Triage messages in support channels",
  icon: "assets/triage-bot.png",
  functions: [TriageReportFunction],
  outgoingDomains: [],
  botScopes: [
    "commands",
    "channels:history",
    "groups:history",
    "channels:read",
    "groups:read",
    "channels:join",
  ],
});
