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

/**
 * AppState includes UI state and data
 */
export type AppState = {
  kind: "AppState";
  quizState: FactOrFictionState;
  claimsOpenGraphData: Record<string, OpenGraph>;
};

export type FactOrFictionState =
  | { kind: "LoadedPage" }
  | { kind: "ChoosingATopic" }
  | { kind: "QuizIntro"; topic: Topic; claims: ClaimReviewRaw[] }
  | {
      kind: "InQuiz";
      topic: Topic;
      claims: ClaimReviewRaw[];
      previousAnswers: boolean[];
      questionIndex: number;
    }
  | {
      kind: "QuizOver";
      topic: Topic;
      claims: ClaimReviewRaw[];
      answers: boolean[];
    };

/**
 * These are the messages passed from the client to the service worker.
 *
 * As a principle: pass as little info to the backend as possible
 */
export type Update =
  | { kind: "Noop" }
  | { kind: "ReadyToRender" }
  | { kind: "SetDebuggingInfo"; info: DebuggingInfo }
  | { kind: "ClickedTrue"; claim: SocialMediaClaimReview }
  | { kind: "ClickedFalse"; claim: SocialMediaClaimReview }
  | { kind: "SelectedATopic"; topic: Topic }
  | { kind: "BeginQuizClicked" }
  | { kind: "ContinueButtonClicked"; answer: boolean }
  | {
      kind: "AddOpenGraphData";
      claim: ClaimReviewRaw;
      openGraphData: OpenGraph;
    }
  | { kind: "Restart" };

/**
 * These are used to make sure that events communicate over the broadcast channel
 */
type SentConstructors = "Sent" | "Noop";

export type Sent = SentConstructors | Promise<SentConstructors>;

export function dontSend(): Sent {
  return "Noop";
}

export function sendUpdate(update: Update): Sent {
  const renderChannel = TypedBroadcastChannel<Update>("render");
  renderChannel.postMessage(update);

  return "Sent";
}

export type DebuggingInfo = {
  kind: "DebuggingInfo";
  eventLog: Update["kind"][];
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

type ClaimLabel =
  | "check_me"
  | "credible"
  | "mostly_credible"
  | "not_credible"
  | "not_verifiable"
  | "uncertain";

export type SocialMediaClaimReview = {
  label: ClaimLabel;
  text: string;
};

export type ClaimReviewRaw = {
  label: ClaimLabel;
  claim_text: string[];
  appearances: string[];
  reviews: Review[];
  review_url: string;
};

type Review = {
  original_label: string;
};

export const TOPICS = ["Norway", "USA", "UK", "Sweden"] as const;

export type Topic = (typeof TOPICS)[number];

export type OpenGraph = {
  title?: string;
  image_url?: string;
  image_width?: number;
  image_height?: number;
  description?: string;
};
