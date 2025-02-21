import { dontSend, RenderedWithEvents, SocialMediaClaimReview } from "../types";
import { renderer } from "../utils/render";

function renderTruthfulPostPrompt(): RenderedWithEvents {
  return renderer`
<div class="truthful-post-prompt">
    Write an accurate post, giving your personal opinion on this article:


</div>
    `;
}

function renderTruthfulPostInput(): RenderedWithEvents {
  let timeLastCalled = performance.now();
  return {
    body: `
  <div class="truthful-post-input-container">
    <textarea type="textarea" id="truthful-post-input">
    </textarea>
  </div>
      `,
    eventListeners: [
      {
        elementId: "truthful-post-input",
        eventName: "input",
        callback: async (event) => {
          const now = performance.now();

          if (now - timeLastCalled < 3000) {
            return dontSend();
          }
          timeLastCalled = now;

          const text = (event.target as HTMLTextAreaElement).value;
          const repl = document.getElementById("claims");

          if (repl) {
            if (text.trim().length === 0) {
              repl.innerHTML = renderClaims([]).body;
              return dontSend();
            }
            console.log("Sending network request...");
            const claims = await (
              await fetch("/claims", {
                body: JSON.stringify({ input: text }),
                headers: {
                  "Content-Type": "application/json",
                },
                method: "POST",
              })
            ).json();
            repl.innerHTML = renderClaims(claims).body;
          }

          return dontSend();
        },
      },
    ],
  };
}

function claimLabelClass(claim: SocialMediaClaimReview): string {
  switch (claim.label) {
    case "credible": {
      return "credible";
    }
    case "mostly_credible": {
      return "mostly-credible";
    }
    case "not_credible": {
      return "not-credible";
    }
    case "check_me": {
      return "needs-verification";
    }
    case "not_verifiable": {
      return "needs-verification";
    }
    case "uncertain": {
      return "uncertain";
    }
  }
}

function renderLabel(claim: SocialMediaClaimReview): RenderedWithEvents {
  switch (claim.label) {
    case "credible": {
      return renderer`<div>Claim: True</div>`;
    }
    case "mostly_credible": {
      return renderer`<div>Claim: Mostly true</div>`;
    }
    case "not_credible": {
      return renderer`<div>Claim: False</div>`;
    }
    case "check_me": {
      return renderer`<div>Claim: Needs verification</div>`;
    }
    case "not_verifiable": {
      return renderer`<div>Claim: Needs verification</div>`;
    }
    case "uncertain": {
      return renderer`<div>Claim: Uncertain</div>`;
    }
  }
}

function renderClaim(claim: SocialMediaClaimReview): RenderedWithEvents {
  return renderer`
<div class="claim ${claimLabelClass(claim)}">
  <div>${renderLabel(claim)}</div>
  <div>${claim.text}</div>
</div>
  `;
}

function renderClaims(claims: SocialMediaClaimReview[]): RenderedWithEvents {
  return renderer`
<div class="claims" id="claims">
  ${claims.map(renderClaim)}
</div>`;
}

export function renderWriteATruthfulPost(): RenderedWithEvents {
  return renderer`
<div class="write-a-truthful-post">
    ${renderTruthfulPostPrompt()}
    ${renderTruthfulPostInput()}
    ${renderClaims([])}
</div>
    `;
}
