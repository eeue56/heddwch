import {
  AppState,
  DebuggingInfo,
  isPage,
  Page,
  RenderBroadcast,
  TypedBroadcastChannel,
  Update,
} from "./types";
import { initialState, updateFactOrFiction } from "./updaters/factOrFiction";
import { fetchClaims, makeClaims, updateHeadlines } from "./updaters/headlines";

const renderChannel = TypedBroadcastChannel<RenderBroadcast>("render");

let appState: AppState = {
  kind: "AppState",
  activePage: { kind: "Index", state: {} },
  claimsOpenGraphData: {},
};

let debuggingInfo: DebuggingInfo = {
  kind: "DebuggingInfo",
  eventLog: [],
};

function sendRerender(state: AppState): number {
  renderChannel.postMessage({
    kind: "rerender",
    state: state,
    debuggingInfo: debuggingInfo,
  });
  return 0;
}

function dontRerender(state: AppState): number {
  return 0;
}

async function update(event: MessageEvent<Update>): Promise<number> {
  const data = event.data;
  console.info("ServiceWorker: received event", data.page, data.message.kind);

  // just ignore debug info if it doesn't exist, to avoid breaking the update loop
  try {
    debuggingInfo.eventLog.push(`${data.page}-->${data.message.kind}`);
  } catch (error) {
    console.error(
      "ServiceWorker: unable to add event",
      data.message.kind,
      "to the event log due to",
      error
    );
  }

  switch (data.page) {
    case ":internal": {
      switch (data.message.kind) {
        case "ReadyToRender": {
          return sendRerender(appState);
        }
        case "SetDebuggingInfo": {
          try {
            debuggingInfo = data.message.info;
            return sendRerender(appState);
          } catch (_) {
            return sendRerender(appState);
          }
        }
        case "Noop": {
          return sendRerender(appState);
        }
      }
    }
    case "FactOrFiction": {
      if (appState.activePage.kind !== data.page) {
        return dontRerender(appState);
      }
      const response = await updateFactOrFiction(
        data.message,
        appState.activePage.state
      );
      appState.activePage.state = response.state;
      switch (response.renderAction) {
        case "DoNotRerender": {
          return dontRerender(appState);
        }
        case "Rerender": {
          return sendRerender(appState);
        }
      }
    }
    case "Headlines": {
      if (appState.activePage.kind !== data.page) {
        return dontRerender(appState);
      }
      const response = await updateHeadlines(
        data.message,
        appState.activePage.state
      );
      appState.activePage.state = response.state;
      switch (response.renderAction) {
        case "DoNotRerender": {
          return dontRerender(appState);
        }
        case "Rerender": {
          return sendRerender(appState);
        }
      }
    }
    case "SocialMediaPostReviewer": {
      return dontRerender(appState);
    }
  }
}

renderChannel.channel.addEventListener("message", update);

export async function startStore(): Promise<void> {
  const rawPage = document.documentElement.getAttribute("data-page") || "index";

  let page: Page = "Index";
  if (isPage(rawPage)) {
    page = rawPage;
  }

  switch (page) {
    case "FactOrFiction": {
      const db = await (
        await fetch("/data/claim_review_opengraph_database.json")
      ).json();
      appState.claimsOpenGraphData = db;
      appState.activePage = { kind: "FactOrFiction", state: initialState() };
      break;
    }
    case "Headlines": {
      const fetchedClaims = await fetchClaims("Norway");
      if (fetchedClaims.kind === "Success") {
        const claims = makeClaims(
          fetchedClaims.value.credible,
          fetchedClaims.value.notCredible
        );
        const scores = claims.map((_, i) => Math.floor(Math.random() * 1000));
        appState.activePage = {
          kind: "Headlines",
          state: {
            kind: "LoadedPage",
            claims,
            scores,
          },
        };
        history.pushState(appState.activePage.state, "");
      }
      break;
    }
    case "Index": {
      appState.activePage = { kind: "Index", state: {} };
      break;
    }
  }
  return;
}

window.addEventListener("popstate", function (event) {
  appState.activePage.state = event.state;
  sendRerender(appState);
});
