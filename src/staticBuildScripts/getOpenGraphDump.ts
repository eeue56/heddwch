import { readFile, writeFile } from "fs/promises";

import UK_CREDIBLE_CLAIMS from "../data/uk_credible.json";
import UK_NOT_CREDIBLE_CLAIMS from "../data/uk_not_credible.json";

import USA_CREDIBLE_CLAIMS from "../data/usa_credible.json";
import USA_NOT_CREDIBLE_CLAIMS from "../data/usa_not_credible.json";

import NORWEGIAN_CREDIBLE_CLAIMS from "../data/norwegian_credible.json";
import NORWEGIAN_NOT_CREDIBLE_CLAIMS from "../data/norwegian_not_credible.json";

import SWEDISH_CREDIBLE_CLAIMS from "../data/sweden_credible.json";
import SWEDISH_NOT_CREDIBLE_CLAIMS from "../data/sweden_not_credible.json";

import { ClaimReviewRaw, OpenGraph } from "../types";

import { JSDOM } from "jsdom";

async function getUrl(
  url: string
): Promise<{ graph: OpenGraph; review_url: string }> {
  const text = await (await fetch(url, { redirect: "follow" })).text();
  const dom = new JSDOM(text);

  const metaTags = dom.window.document.head.getElementsByTagName("meta");

  const graph: OpenGraph = {};

  for (const tag of metaTags) {
    const property = tag.getAttribute("property");

    switch (property) {
      case "og:title": {
        graph.title = tag.getAttribute("content") || undefined;
        break;
      }
      case "og:image": {
        graph.image_url = tag.getAttribute("content") || undefined;
        break;
      }
      case "og:image:width": {
        graph.image_width = parseInt(tag.getAttribute("content") || "0");
        break;
      }
      case "og:image:height": {
        graph.image_height = parseInt(tag.getAttribute("content") || "0");
        break;
      }
      case "og:description": {
        graph.description = tag.getAttribute("content") || undefined;
        break;
      }
      default: {
        break;
      }
    }
  }
  return {
    graph: graph,
    review_url: url,
  };
}

async function loadDatabase(): Promise<Record<string, OpenGraph>> {
  const data = (
    await readFile("./data/claim_review_opengraph_database.json")
  ).toString("utf-8");
  return JSON.parse(data);
}

async function saveDatabase(
  database: Record<string, OpenGraph>
): Promise<number> {
  await writeFile(
    "./data/claim_review_opengraph_database.json",
    JSON.stringify(database, null, 4)
  );
  return 0;
}

async function main() {
  console.log("UK Credible Claims:", UK_CREDIBLE_CLAIMS.length);
  console.log("UK Not Credible Claims:", UK_NOT_CREDIBLE_CLAIMS.length);

  console.log("Swedish Credible Claims:", SWEDISH_CREDIBLE_CLAIMS.length);
  console.log(
    "Swedish Not Credible Claims:",
    SWEDISH_NOT_CREDIBLE_CLAIMS.length
  );

  console.log("Norwegian Credible Claims:", NORWEGIAN_CREDIBLE_CLAIMS.length);
  console.log(
    "Norwegian Not Credible Claims:",
    NORWEGIAN_NOT_CREDIBLE_CLAIMS.length
  );

  console.log("USA Credible Claims:", USA_CREDIBLE_CLAIMS.length);
  console.log("USA Not Credible Claims:", USA_NOT_CREDIBLE_CLAIMS.length);

  const remainingClaims: ClaimReviewRaw[] = [
    ...UK_CREDIBLE_CLAIMS,
    ...UK_NOT_CREDIBLE_CLAIMS,
    ...SWEDISH_CREDIBLE_CLAIMS,
    ...SWEDISH_NOT_CREDIBLE_CLAIMS,
    ...NORWEGIAN_CREDIBLE_CLAIMS,
    ...NORWEGIAN_NOT_CREDIBLE_CLAIMS,
    ...USA_CREDIBLE_CLAIMS,
    ...USA_NOT_CREDIBLE_CLAIMS,
  ] as ClaimReviewRaw[];

  const database: Record<string, OpenGraph> = await loadDatabase();

  for (let i = 0; i < remainingClaims.length; i += 10) {
    const urlsToProcess: string[] = [];

    for (const claim of remainingClaims.slice(i, i + 10)) {
      urlsToProcess.push(claim.review_url);
    }

    const results = await Promise.allSettled(urlsToProcess.map(getUrl));

    for (const result of results) {
      if (result.status === "fulfilled") {
        console.log("Success:", result.value.review_url);
        database[result.value.review_url] = result.value.graph;
      } else {
        console.error("Failed:", result.reason);
      }
    }

    await saveDatabase(database);
  }
}

main();
