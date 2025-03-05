import {
  FactOrFictionState,
  Update as FactOrFictionUpdate,
} from "./types/factOrFiction";

import { HeadlinesState, Update as HeadlinesUpdate } from "./types/headlines";
import { Update as InternalUpdate } from "./types/internal";
import { ClaimsOpenGraphDatabase } from "./types/shared";

/**
 * Make it explicit which events we use, to help catch typos
 *
 * Feel free to add more events here as needed.
 */
export type EventName = "click" | "input" | "change";

export type EventHandler = {
  elementId: string;
  eventName: EventName;
  callback: (event: Event) => Sent;
};

/**
 * A renderer has a body, of the html to render, and listeners.
 *
 * To understand how to use this, ctrl-f and look in the rendering files.
 */
export type RenderedWithEvents = {
  body: string;
  eventListeners: EventHandler[];
};

const pages = [
  ":internal",
  "Index",
  "FactOrFiction",
  "Headlines",
  "SocialMediaPostReviewer",
] as const;

export type Page = (typeof pages)[number];

export function isPage(page: string): page is Page {
  return pages.includes(page as Page);
}

type ActivePageGeneric<page extends Page, state> = {
  kind: page;
  state: state;
};

type ActivePage =
  | ActivePageGeneric<"FactOrFiction", FactOrFictionState>
  | ActivePageGeneric<"Headlines", HeadlinesState>
  | ActivePageGeneric<"SocialMediaPostReviewer", {}>
  | ActivePageGeneric<"Index", {}>;

/**
 * AppState includes UI state and data
 */
export type AppState = {
  kind: "AppState";
  activePage: ActivePage;
  claimsOpenGraphData: ClaimsOpenGraphDatabase;
};

type PageUpdateGeneric<page extends Page, update> = {
  page: page;
  message: update;
};

type PageUpdate =
  | PageUpdateGeneric<":internal", InternalUpdate>
  | PageUpdateGeneric<"FactOrFiction", FactOrFictionUpdate>
  | PageUpdateGeneric<"Headlines", HeadlinesUpdate>
  | PageUpdateGeneric<"SocialMediaPostReviewer", { kind: "Noop" }>;

/**
 * These are the messages passed from the client to the service worker.
 *
 * As a principle: pass as little info to the backend as possible
 */
export type Update = PageUpdate;

/**
 * These are used to make sure that events communicate over the broadcast channel
 */
type SentConstructors = "Sent" | "Noop";

export type Sent = SentConstructors | Promise<SentConstructors>;

export function dontSend(): Sent {
  return "Noop";
}

export function centralSendUpdate(update: Update): Sent {
  const renderChannel = TypedBroadcastChannel<Update>("render");
  renderChannel.postMessage(update);

  return "Sent";
}

export type DebuggingInfo = {
  kind: "DebuggingInfo";
  eventLog: `${Update["page"]}-->${Update["message"]["kind"]}`[];
};

export type RenderBroadcast =
  | {
      kind: "rerender";
      state: AppState;
      debuggingInfo: DebuggingInfo;
    }
  | { kind: "ReadyToRender" };

export type TypedBroadcastChannel<type> = {
  channel: BroadcastChannel;
  postMessage: (message: type) => void;
};

export function TypedBroadcastChannel<type>(
  name: string
): TypedBroadcastChannel<type> {
  const channel = new BroadcastChannel(name);
  return {
    channel: channel,
    postMessage: (message: type) => channel.postMessage(message),
  };
}

export type RenderError = "NeedsToInitialize";

export type ServerError = IncorrectPayload;

export type IncorrectPayload = {
  kind: "IncorrectPayload";
};

export function IncorrectPayload(): IncorrectPayload {
  return {
    kind: "IncorrectPayload",
  };
}
