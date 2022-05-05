import type { FunctionHandler } from "deno-slack-sdk/types.ts";
import { SlackAPI } from "deno-slack-api/mod.ts";

// deno-lint-ignore no-explicit-any
const triage_channel: FunctionHandler<any, any> = async ({ inputs, token }) => {
  console.log(inputs);
  console.log(token);
  const client = SlackAPI(token, {});
  const triageStats = {
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
    await client.apiCall("conversations.join", {
      channel: inputs.targetChannel,
    });

    if (!isNaN(+inputs.daysToLookback)) {
      lookbackNumber = Number(+inputs.daysToLookback);
    }
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - lookbackNumber);

    // Get all the messages for X days
    const messageHistory = await client.apiCall("conversations.history", {
      channel: inputs.targetChannel,
      inclusive: true,
      oldest: Math.floor(startDate.getTime() / 1000),
    });
    console.log(messageHistory);

    const messages: Message[] = messageHistory.messages as Message[];

    for (const message of messages) {
      if (message.text && message.text.includes(":red_circle:")) {
        if (message.reactions) {
          const reactionsArray = [];
          for (const reaction of message.reactions) {
            reactionsArray.push(reaction.name);
          }
          if (reactionsArray.includes("white_check_mark")) {
            triageStats.urgent.complete++;
          } else if (reactionsArray.includes("eyes")) {
            triageStats.urgent.in_review++;
          } else {
            triageStats.urgent.pending++;
          }
        } else {
          triageStats.urgent.pending++;
        }
      }
      if (message.text && message.text.includes(":large_blue_circle:")) {
        if (message.reactions) {
          const reactionsArray = [];
          for (const reaction of message.reactions) {
            reactionsArray.push(reaction.name);
          }
          if (reactionsArray.includes("white_check_mark")) {
            triageStats.medium.complete++;
          } else if (reactionsArray.includes("eyes")) {
            triageStats.medium.in_review++;
          } else {
            triageStats.medium.pending++;
          }
        } else {
          triageStats.medium.pending++;
        }
      }
      if (message.text && message.text.includes(":white_circle:")) {
        if (message.reactions) {
          const reactionsArray = [];
          for (const reaction of message.reactions) {
            reactionsArray.push(reaction.name);
          }
          if (reactionsArray.includes("white_check_mark")) {
            triageStats.low.complete++;
          } else if (reactionsArray.includes("eyes")) {
            triageStats.low.in_review++;
          } else {
            triageStats.low.pending++;
          }
        } else {
          triageStats.low.pending++;
        }
      }
    }
  } catch (error) {
    console.log(error);
  }

  console.log(triageStats);

  return await {
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
