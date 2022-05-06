import type { FunctionHandler } from "deno-slack-sdk/types.ts";
import { SlackAPI } from "deno-slack-api/mod.ts";

// deno-lint-ignore no-explicit-any
const triage_channel: FunctionHandler<any, any> = async ({ inputs, token }) => {
  const client = SlackAPI(token, {}); // Create an instance of a SlackAPI client so we can call the Slack API
  const triageStats: TopLevelTriageStats = {
    urgent: {
      pending: 0,
      in_review: 0,
      complete: 0,
    },
    medium: {
      pending: 0,
      in_review: 0,
      complete: 0,
    },
    low: {
      pending: 0,
      in_review: 0,
      complete: 0,
    },
  };

  // Default to looking back 7 days
  let lookbackNumber = 7;

  try {
    // Make sure to join the channel so we can read the messages (only works for public channels)
    // https://api.slack.com/methods/conversations.join
    await client.apiCall("conversations.join", {
      channel: inputs.targetChannel,
    });

    // Convert the inputted value into a UNIX TS for conversations.history
    if (!isNaN(+inputs.daysToLookback)) {
      lookbackNumber = Number(+inputs.daysToLookback);
    }
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - lookbackNumber);

    // Get all the messages for X days
    // https://api.slack.com/methods/conversations.history
    const messageHistory = await client.apiCall("conversations.history", {
      channel: inputs.targetChannel, // The channel specified by the user when the function was called
      inclusive: true,
      oldest: Math.floor(startDate.getTime() / 1000),
    });

    const messages: Message[] = messageHistory.messages as Message[]; // Type the response from the API to make it easier to handle

    // Iterate over the messages in the channel
    for (const message of messages) {
      if (message.text && message.text.includes(":red_circle:")) {
        triageStats.urgent = updateStats(message);
      }
      if (message.text && message.text.includes(":large_blue_circle:")) {
        triageStats.medium = updateStats(message);
      }
      if (message.text && message.text.includes(":white_circle:")) {
        triageStats.low = updateStats(message);
      }
    }
  } catch (error) {
    console.log(error);
  }

  return await {
    // The shape of this payload aligns with what we've defined in manifest.ts
    outputs: {
      urgentItems:
        `There are ${triageStats.urgent.pending} items pending, ${triageStats.urgent.in_review} under review and ${triageStats.urgent.complete} completed in the last ${lookbackNumber} days`,
      mediumItems:
        `There are ${triageStats.medium.pending} items pending, ${triageStats.medium.in_review} under review and ${triageStats.medium.complete} completed in the last ${lookbackNumber} days`,
      lowItems:
        `There are ${triageStats.low.pending} items pending, ${triageStats.low.in_review} under review and ${triageStats.low.complete} completed in the last ${lookbackNumber} days`,
    },
  };
};

export default triage_channel;

function updateStats(message: Message): TriageStats {
  const levelStats = {
    pending: 0,
    in_review: 0,
    complete: 0,
  };
  if (message.reactions) {
    const reactionsArray = [];
    for (const reaction of message.reactions) {
      reactionsArray.push(reaction.name);
    }
    if (reactionsArray.includes("white_check_mark")) {
      levelStats.complete++;
    } else if (reactionsArray.includes("eyes")) {
      levelStats.in_review++;
    } else {
      levelStats.pending++;
    }
  } else {
    levelStats.pending++;
  }

  return levelStats;
}

export interface TopLevelTriageStats {
  urgent: TriageStats;
  medium: TriageStats;
  low: TriageStats;
}

export interface TriageStats {
  pending: number;
  in_review: number;
  complete: number;
}

// These type definitions are copied from node-slack-sdk, and will eventually be removed
export interface Message {
  type?: string;
  subtype?: string;
  text?: string;
  bot_id?: string;
  ts?: string;
  thread_ts?: string;
  root?: any;
  username?: string;
  icons?: any;
  parent_user_id?: string;
  reply_count?: number;
  reply_users_count?: number;
  latest_reply?: string;
  reply_users?: string[];
  subscribed?: boolean;
  user?: string;
  team?: string;
  bot_profile?: any;
  files?: any[];
  upload?: boolean;
  display_as_bot?: boolean;
  x_files?: string[];
  edited?: Edited;
  blocks?: Block[];
  attachments?: any[];
  topic?: string;
  purpose?: string;
  client_msg_id?: string;
  reactions?: Reaction[];
  app_id?: string;
  metadata?: any;
}

export interface Reaction {
  name?: string;
  count?: number;
  users?: string[];
  url?: string;
}

export interface Edited {
  user?: string;
  ts?: string;
}

export interface Block {
  type?: string;
  elements?: any[];
  block_id?: string;
  call_id?: string;
  api_decoration_available?: boolean;
  call?: any;
  external_id?: string;
  source?: string;
  file_id?: string;
  file?: any;
  text?: any;
  fallback?: string;
  image_url?: string;
  image_width?: number;
  image_height?: number;
  image_bytes?: number;
  alt_text?: string;
  title?: any;
  fields?: any[];
  accessory?: any;
  label?: any;
  element?: any;
  dispatch_action?: boolean;
  hint?: any;
  optional?: boolean;
}
