import {
  ClaimReviewRaw,
  dontSend,
  FactOrFictionState,
  OpenGraph,
  RenderedWithEvents,
  sendUpdate,
  Sent,
  Topic,
  TOPICS,
} from "../types";
import { renderer } from "../utils/render";

import ClaimsOpenGraphDatabase from "../data/claim_review_opengraph_database.json";

type AnswerChosen = "True" | "False" | "NotYetChosen";

function renderQuizQuestion(
  claim: ClaimReviewRaw,
  claimsOpenGraphData: Record<string, OpenGraph>
): RenderedWithEvents {
  function revealContinueButton() {
    const button = document.getElementById("continue-button");

    if (button) {
      button.classList.add("show");
    }
  }

  let answerChosen: AnswerChosen = "NotYetChosen";

  const maybeGraphData: OpenGraph | null =
    claimsOpenGraphData[claim.review_url] || null;

  function answerClicked(trueOrFalseButton: boolean): Sent {
    const reveal = document.getElementById("answer-reveal");
    let reviewText: string = "";
    if (maybeGraphData === null) {
      if (claim.reviews.length > 0) {
        reviewText = claim.reviews[0].original_label;
      }
    } else {
      reviewText = maybeGraphData.description || maybeGraphData.title || "";
    }

    const quoteBody = [
      `
<blockquote>${reviewText}</blockquote>
`,
    ];

    if (claim.review_url.length > 0) {
      quoteBody.push(
        `<cite><a target=”_blank” href="${claim.review_url}">Read the article</a></cite>`
      );
    }

    if (claim.label === "credible") {
      document.getElementById("answer-false")?.classList.add("hide");
      document.getElementById("answer-true")?.classList.add("slide-right");
      document.getElementById("answer-true")?.setAttribute("disabled", "true");

      if (reveal) {
        reveal.innerHTML = `<hr />
<h4>True ✅</h4>
${quoteBody.join("\n")}
`;
      }
    } else {
      document.getElementById("answer-true")?.classList.add("hide");
      document.getElementById("answer-false")?.classList.add("slide-left");
      document.getElementById("answer-false")?.setAttribute("disabled", "true");

      if (reveal) {
        reveal.innerHTML = `<hr />
<h4>False ❌</h4>
${quoteBody.join("\n")}`;
      }
    }

    if (trueOrFalseButton === true) {
      answerChosen = "True";
    } else {
      answerChosen = "False";
    }

    revealContinueButton();
    return dontSend();
  }

  return {
    body: `
<div class="question">
  <div class="question-prompt">
    <h3 class="question-claim-title">Claim</h3>
    <div class="prompt">${claim.claim_text.join("<br><br>")}</div>
    <div class="answer-reveal" id="answer-reveal"> </div>
  </div>
  <div class="question-answers" id="question-answers">
  <button class="answer-true" id="answer-true">True</button>
  <button class="answer-false" id="answer-false">False</button>
  </div>
  <div class="continue">
    <button class="continue-button" id="continue-button"><strong>Continue</strong></button>
  </div>
</div>
    `,
    eventListeners: [
      {
        elementId: "answer-true",
        eventName: "click",
        callback: (event: Event) => {
          return answerClicked(true);
        },
      },
      {
        elementId: "answer-false",
        eventName: "click",
        callback: (event: Event) => {
          return answerClicked(false);
        },
      },
      {
        elementId: "continue-button",
        eventName: "click",
        callback: function (event: Event): Sent {
          const answer = answerChosen === "True" ? true : false;
          return sendUpdate({ kind: "ContinueButtonClicked", answer: answer });
        },
      },
    ],
  };
}

function renderProgressBar(
  questionIndex: number,
  claims: ClaimReviewRaw[]
): RenderedWithEvents {
  return renderer`<progress value="${questionIndex}" max="${claims.length}" />`;
}

function renderIntro(): RenderedWithEvents {
  return renderer`${renderQuizQuestion(
    {
      label: "credible",
      claim_text: [
        "You're about to be shown a claim that has been found to be true or false by a fact checking organisation. You have to decide if you think the claim is true, or false.",
        "Claim: I understand what I need to do",
      ],
      appearances: [],
      reviews: [{ original_label: "Great, let's get started" }],
      review_url: "",
    },
    {}
  )}`;
}

function renderTopic(topic: Topic): RenderedWithEvents {
  const id = `choose-${topic}`;
  return {
    body: `<button id="${id}">${topic}</button>`,
    eventListeners: [
      {
        elementId: id,
        eventName: "click",
        callback: function (event: Event): Sent {
          return sendUpdate({ kind: "SelectedATopic", topic: topic });
        },
      },
    ],
  };
}

function renderChooseTopic(): RenderedWithEvents {
  return renderer`
<div class="choose-a-topic">
  <h3 class="choose-a-topic-title">Choose a topic</h3>
  <div class="topics">
    ${TOPICS.map(renderTopic)}
  </div>
</div>
  `;
}

function renderWelcome(): RenderedWithEvents {
  return {
    body: `
<div class="welcome">
  <h2>Fact or fiction?</h2>
  <div>
    <span>People often believe things they've heard or seen, even if that information came from an unreliable source.</span>

    <br>
    <br>

    <span>The art of disinformation comes in multiple forms: overwhelming content, plausable stories, and aligning with the reader's bias.</span>

    <br>
    <br>

    <span>You're about to take a quiz to see if you can tell truthful headlines vs incorrect headlines.</span>
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

const SITE_ICON_URLS: Record<string, string> = {
  "www.faktisk.no":
    "https://www.faktisk.no/view-resources/dachser2/public/faktisk/icon-180.png",
  "fullfact.org": "https://fullfact.org/static/img/ff-logo.a3c246edc83d.png",
  "www.politifact.com": "/imgs/politifact.png",
  "www.snopes.com": "https://www.snopes.com/design/images/logo-main.png",
};

function getSiteIconUrl(url: string): string | null {
  const parsedUrl = new URL(url);
  return SITE_ICON_URLS[parsedUrl.hostname];
}

function renderClaim(
  claim: ClaimReviewRaw,
  claimsOpenGraphData: Record<string, OpenGraph>
): RenderedWithEvents {
  const maybeOpenGraph = claimsOpenGraphData[claim.review_url];

  let preview: RenderedWithEvents = renderer``;
  if (maybeOpenGraph) {
    const parsedUrl = new URL(claim.review_url);
    preview = renderer`
<div class="preview">
  <img src="${maybeOpenGraph.image_url || ""}" width="${
      maybeOpenGraph.image_width || 0
    }" height="${maybeOpenGraph.image_height || 0}">
  <h4>${maybeOpenGraph.title || claim.claim_text.join(" ")}</h4>
  <a target=”_blank” href="https://${parsedUrl.hostname}">
    <img src="${
      getSiteIconUrl(claim.review_url) || ""
    }" width="50px" height="50px">
  </a>
  <div class="preview-description">${maybeOpenGraph.description || ""}</div>
</div>`;
  }

  const credibleOrNot =
    claim.label === "credible" ? "credible" : "not-credible";

  let button = `<button class="answer-true" disabled>True ✅</button>`;

  if (credibleOrNot === "not-credible") {
    button = `<button class="answer-false" disabled>False ❌</button>`;
  }

  return renderer`
<div class="claim ${credibleOrNot}">
  <div class="claim-text"><strong>Claim: </strong><em>${claim.claim_text.join(
    "\n"
  )}</em></div>
  ${button}
  ${preview}
  <div class="review-url">
    <a target=”_blank” href="${claim.review_url}">
      Read the full article
    </a>
  </div>
</div>
`;
}

function renderOverPage(
  topic: Topic,
  results: boolean[],
  claims: ClaimReviewRaw[],
  claimsOpenGraphData: Record<string, OpenGraph>
): RenderedWithEvents {
  const truthfulCorrectGuesses = [];
  const truthfulIncorrectGuesses = [];

  const falseCorrectGuesses = [];
  const falseIncorrectGuesses = [];

  const correctnessGrid = [];
  const truthGrid = [];

  for (let i = 0; i < results.length; i++) {
    const userGuessTrueOrFalse = results[i];
    const claim = claims[i];

    if (claim.label === "credible") {
      if (userGuessTrueOrFalse === true) {
        truthfulCorrectGuesses.push(i);
        correctnessGrid.push("🎉");
      } else {
        truthfulIncorrectGuesses.push(i);
        correctnessGrid.push("⛔");
      }
      truthGrid.push("✅");
    } else {
      if (userGuessTrueOrFalse === true) {
        falseIncorrectGuesses.push(i);
        correctnessGrid.push("⛔");
      } else {
        falseCorrectGuesses.push(i);
        correctnessGrid.push("🎉");
      }
      truthGrid.push("❌");
    }
  }

  const totalCorrect =
    truthfulCorrectGuesses.length + falseCorrectGuesses.length;
  const numberOfQuestions = results.length;

  const additionalInfo: RenderedWithEvents[] = [];
  const additionalIncorrectClaimInfo: RenderedWithEvents[] = [];
  const additionalCorrectClaimInfo: RenderedWithEvents[] = [];

  if (truthfulIncorrectGuesses.length > 0) {
    additionalInfo.push(
      renderer`<div>You missed ${truthfulIncorrectGuesses.length} true statements.</div>`
    );

    for (const i of truthfulIncorrectGuesses) {
      additionalIncorrectClaimInfo.push(
        renderClaim(claims[i], claimsOpenGraphData)
      );
    }
  }

  if (falseIncorrectGuesses.length > 0) {
    additionalInfo.push(
      renderer`<div>You missed ${falseIncorrectGuesses.length} false statements.</div>`
    );

    for (const i of falseIncorrectGuesses) {
      additionalIncorrectClaimInfo.push(
        renderClaim(claims[i], claimsOpenGraphData)
      );
    }
  }

  for (const i of [...truthfulCorrectGuesses, ...falseCorrectGuesses]) {
    additionalCorrectClaimInfo.push(
      renderClaim(claims[i], claimsOpenGraphData)
    );
  }

  const urlToCopy = "https://eeue56.github.io/heddwch/#fact-or-fiction";

  return renderer`
<div class="results-summary">
  <h3 class="results-title">Fact or Fiction - Results🥁</h3>
  <div class="results-word-summary">
    <h4>Facts about ${topic}</h4>
    <span>You guessed <strong>${totalCorrect} out of ${numberOfQuestions}</strong> correctly.</span>
    ${additionalInfo}
  </div>
  <div>
    <div class="results-correctness-grid">Your score:<br>${correctnessGrid.join(
      ""
    )} </div>
    <div class="results-truth-grid">True or false:<br>${truthGrid.join(
      ""
    )} </div>
  </div>
  <button class="results-copy-link" onclick="(function(){ navigator.clipboard.writeText('${urlToCopy}') })()"><strong>Copy link to quiz 🔗</strong></button>
</div>
<hr>
<div class="results-claims">
  <h3>These were the claims you got wrong</h3>
  ${additionalIncorrectClaimInfo}
</div>
<hr>
<div class="results-claims">
  <h3>... And the claims you got right!</h3>
  ${additionalCorrectClaimInfo}
</div>
  `;
}

function renderRestartButton(): RenderedWithEvents {
  return {
    body: `<button class="restart-button" id="restart-button">Restart</button>`,
    eventListeners: [
      {
        elementId: "restart-button",
        eventName: "click",
        callback: (): Sent => {
          return sendUpdate({ kind: "Restart" });
        },
      },
    ],
  };
}

function renderQuizState(state: FactOrFictionState): RenderedWithEvents {
  const claimsOpenGraphData: Record<string, OpenGraph> =
    ClaimsOpenGraphDatabase;

  switch (state.kind) {
    case "LoadedPage": {
      return renderWelcome();
    }
    case "ChoosingATopic": {
      return renderChooseTopic();
    }
    case "QuizIntro": {
      return renderIntro();
    }
    case "InQuiz": {
      const claim = state.claims[state.questionIndex];
      return renderer`
${renderQuizQuestion(claim, claimsOpenGraphData)}
${renderProgressBar(state.questionIndex, state.claims)}
<hr>
${renderRestartButton()}
    `;
    }
    case "QuizOver": {
      return renderer`
${renderOverPage(state.topic, state.answers, state.claims, claimsOpenGraphData)}
<hr>
${renderRestartButton()}
      `;
    }
  }
}

export function renderQuiz(state: FactOrFictionState): RenderedWithEvents {
  return renderer`
<div class="quiz-page">
  ${renderQuizState(state)}
</div>
  `;
}
