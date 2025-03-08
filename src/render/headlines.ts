import {
  renderCss,
  renderStory,
  Story,
} from "simple-link-aggregator/dist/story";
import {
  centralSendUpdate,
  EventHandler,
  RenderedWithEvents,
  Sent,
} from "../types";
import { ClaimReviewRaw } from "../types/factOrFiction";
import { HeadlinesState, Update } from "../types/headlines";

function sendUpdate(update: Update): Sent {
  return centralSendUpdate({ page: "Headlines", message: update });
}

function renderHeadlinesStories(
  claims: ClaimReviewRaw[],
  upvotedStories: Story[],
  downvotedStories: Story[],
  scores: number[]
): RenderedWithEvents {
  const ids = [...upvotedStories, ...downvotedStories].map((story) => story.id);

  const stories = claims.map((claim, index) => {
    const trueOrFalse =
      claim.label === "credible"
        ? "<h3>This claim is true</h3>"
        : "<h3>This claim is false</h3>";
    const summary = ids.includes(index)
      ? `${trueOrFalse}<h4>What the review says:</h4>${claim.reviews[0].original_label}`
      : "";
    return Story(
      index,
      new Date(claim.reviews[0].date_published),
      claim.review_url,
      claim.claim_text.join("\n"),
      [claim.fact_checker.country],
      summary,
      "",
      scores[index]
    );
  });

  const storyHtml = stories.map((story) => {
    const isUpvoted = upvotedStories
      .map((story) => story.id)
      .includes(story.id);
    const isDownvoted = downvotedStories
      .map((story) => story.id)
      .includes(story.id);

    const html = renderStory(story, "", "", "");
    const parser = new DOMParser();
    const dom = parser.parseFromString(html, "text/html");

    const voting = dom.getElementsByClassName("story-voting")[0];

    const maybeTrueDisabled = isDownvoted ? " disabled" : "";
    const maybeTrueOutlined = isUpvoted ? " outline" : "";
    voting.children[0].innerHTML = `<button${maybeTrueDisabled} class="${maybeTrueOutlined}">✅ True</button>`;

    voting.children[1].innerHTML = "<strong><em>or</em></strong>";

    const node = document.createElement("div");
    node.classList.add("story-downvote");

    const maybeFalseDisabled = isUpvoted ? " disabled" : "";
    const maybeFalseOutlined = isDownvoted ? " outline" : "";
    node.innerHTML = `<button${maybeFalseDisabled} class="${maybeFalseOutlined}">❌ False</button>`;
    node.id = `story-downvote-${story.id}`;

    voting.appendChild(node);

    const domainElements = dom.getElementsByClassName("story-domain");

    for (const element of domainElements) {
      (element as HTMLAnchorElement).href = `https://${element.innerHTML}`;
      (element as HTMLAnchorElement).target = "_blank";
    }

    return dom.children[0].innerHTML;
  });

  const eventListeners: EventHandler[] = [];

  for (const story of stories) {
    if (ids.includes(story.id)) {
      continue;
    }
    eventListeners.push({
      elementId: `story-upvote-${story.id}`,
      eventName: "click",
      callback: () => {
        return sendUpdate({ kind: "UpvoteClicked", story: story });
      },
    });

    eventListeners.push({
      elementId: `story-downvote-${story.id}`,
      eventName: "click",
      callback: () => {
        return sendUpdate({ kind: "DownvoteClicked", story: story });
      },
    });
  }

  return {
    body: `${renderCss()}<div class="stories">${storyHtml.join("\n")}</div>`,
    eventListeners,
  };
}

function renderWelcome(): RenderedWithEvents {
  return {
    body: `
  <div class="welcome">
    <h2>Are headlines enough to judge a news story?</h2>
    <div>
      <span>If you use Reddit or Hacker News, you might be familiar with the fact that the majority of users don't read the article, only the headline. Many even comment on the thread, without reading the article.</span>

      <br>
      <br>

      <span>On Facebook, Twitter, and LinkedIn, the same problem applies. All you see is the title and the image. Many people even post or share links that they have not read.</span>

      <br>
      <br>

      <span>You're about to see a series of headlines which may be true or false, presented as they would be on Reddit. Let's see if a headline is enough to figure out what's truthful. Vote true or false, and see what you got right.</span>

      <br>
      <br>
    </div>
    <button id="button-begin">Begin</button>
  </div>`,
    eventListeners: [
      {
        elementId: "button-begin",
        eventName: "click",
        callback: function (event: Event): Sent {
          return sendUpdate({
            kind: "BeginQuizClicked",
          });
        },
      },
    ],
  };
}

export function renderHeadlines(state: HeadlinesState): RenderedWithEvents {
  switch (state.kind) {
    case "LoadedPage": {
      return renderWelcome();
    }
    case "Quiz": {
      return renderHeadlinesStories(
        state.claims,
        state.upvotedStories,
        state.downvotedStories,
        state.scores
      );
    }
  }
}
