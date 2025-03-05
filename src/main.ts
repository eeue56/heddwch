import { renderQuiz } from "./render/factOrFiction";
import { renderWriteATruthfulPost } from "./render/writeATruthfulPost";
import {
  AppState,
  centralSendUpdate,
  RenderBroadcast,
  RenderedWithEvents,
  RenderError,
  TypedBroadcastChannel,
} from "./types";

import { startStore } from "./centralStore";
import { renderHeadlines } from "./render/headlines";
import { getDebuggingInfo, storeDebuggingInfo } from "./utils/localstorage";
import { renderer } from "./utils/render";

/**
 * Keep track of last render time to avoid rendering too often
 */
let lastRenderTime = 0;

/**
 * Call the individual render functions
 */
async function renderBody(state: AppState): Promise<RenderedWithEvents> {
  switch (state.activePage.kind) {
    case "SocialMediaPostReviewer": {
      return renderer`${renderWriteATruthfulPost()}`;
    }
    case "FactOrFiction": {
      return renderQuiz(state.activePage.state, state.claimsOpenGraphData);
    }
    case "Headlines": {
      return renderHeadlines(state.activePage.state);
    }
    case "Index": {
      return renderer`
<div class="landing-intro">
      <div>Welcome to the landing page of Heddwch, a collection examining media </div>
      <div><a href="./fact-or-fiction">Fact or Fiction quiz - can you spot fake news?</a></div>
      <div><a href="./headlines">A Reddit style UI - can you spot fake news?</a></div>
      <div>Heddwch is peace in Welsh. The bards of the Eisteddfod ask the audience "a oes heddwch?" - "is there peace?", before awarding the winning poet the chair.
</div>`;
    }
  }
}

/**
 * This is the main render function - it is triggered from the service-worker.
 *
 * State and settings come from the service-worker (via indexeddb)
 *
 * After rendering, this function calls postRender.
 *
 * By default, it logs info on rendering + event attachment time
 */
async function render(state: AppState): Promise<void> {
  const rightNow = performance.now();
  const diff = rightNow - lastRenderTime;

  // try to avoid re-rendering too much
  if (diff > 5 || lastRenderTime === 0) {
    lastRenderTime = rightNow;
  } else {
    return;
  }

  switch (state.activePage.kind) {
    case "FactOrFiction": {
      document.title = "Fact or fiction? | Heddwch";
      break;
    }
    case "Headlines": {
      document.title = "Headlines | Heddwch";
      break;
    }
    case "SocialMediaPostReviewer": {
      document.title = "Post reviewer | Heddwch";
      break;
    }
    case "Index": {
      document.title = "Factual tools | Heddwch";
      break;
    }
  }
  const mainElement = document.getElementById("main");

  console.group("Rendering info");

  if (!mainElement) {
    console.error("Could not find element with id 'main'");
    return;
  }

  try {
    let start = performance.now();
    const body = await renderBody(state);
    let end = performance.now();

    console.info("Render time:", end - start);

    mainElement.innerHTML = body.body;

    start = performance.now();

    for (const eventListener of body.eventListeners) {
      const element = document.getElementById(eventListener.elementId);

      if (element) {
        element.addEventListener(
          eventListener.eventName,
          eventListener.callback
        );
      } else {
        console.error(
          "Could not find element with selector '#",
          eventListener.elementId,
          "'"
        );
      }
    }

    end = performance.now();

    console.info("Added", body.eventListeners.length, "listeners");
    console.info("Attachment time:", end - start);
    console.groupEnd();

    postRender(state);
  } catch (error) {
    console.groupEnd();
    if ((error as RenderError) === "NeedsToInitialize") {
      // pass for now
    } else {
      console.error(error);
    }
  }
}

/**
 * This function runs functions that require basic rendering of the DOM first.

 */
function postRender(state: AppState): void {}

/**
 * The channel that the service-worker and the client communicate on.
 */
const renderChannel = TypedBroadcastChannel<RenderBroadcast>("render");
renderChannel.channel.addEventListener(
  "message",
  (event: MessageEvent<RenderBroadcast>) => {
    if (event.data.kind === "rerender") {
      storeDebuggingInfo(event.data.debuggingInfo);
      render(event.data.state);
    }
  }
);

async function main() {
  await startStore();
  let info = getDebuggingInfo();
  if (!info) {
    info = { kind: "DebuggingInfo", eventLog: [] };
  }
  centralSendUpdate({
    page: ":internal",
    message: { kind: "SetDebuggingInfo", info },
  });
  centralSendUpdate({ page: ":internal", message: { kind: "ReadyToRender" } });
}

main();
