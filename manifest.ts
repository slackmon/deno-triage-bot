import { DefineFunction, Manifest, Schema } from "deno-slack-sdk/mod.ts";

/**
 * This is where we define our Slack Function to triage messages. The actual logic lives on the path defined below as `source_file`
 */
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

/**
 * This is where we define our Slack App. The CLI will use this to programmatically register and install the app on the workspace you choose
 */
export default Manifest({
  name: "TriageBot",
  description: "Triage messages in support channels",
  icon: "assets/triage-bot.png",
  functions: [TriageReportFunction],
  outgoingDomains: [], // Since this app doesn't call any non-Slack APIs, we don't need to add any domains to our allow list.
  botScopes: [
    "commands",
    "channels:history",
    "groups:history",
    "channels:read",
    "groups:read",
    "channels:join",
  ],
});
