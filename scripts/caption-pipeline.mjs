#!/usr/bin/env node
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const BASE_URL = "https://api.almostcrackd.ai";
const SUPPORTED_TYPES = new Set([
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "image/heic",
]);

const EXTENSION_TO_TYPE = new Map([
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".png", "image/png"],
  [".webp", "image/webp"],
  [".gif", "image/gif"],
  [".heic", "image/heic"],
]);

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i += 1) {
    const arg = argv[i];
    if (!arg.startsWith("--")) continue;
    const key = arg.slice(2);
    const next = argv[i + 1];
    if (!next || next.startsWith("--")) {
      args[key] = "true";
      continue;
    }
    args[key] = next;
    i += 1;
  }
  return args;
}

function usage(exitCode = 1) {
  const text = [
    "Usage:",
    "  node scripts/caption-pipeline.mjs --file <path> --token <jwt> [--content-type <type>] [--common true]",
    "",
    "Environment:",
    "  CAPTION_PIPELINE_JWT  JWT access token if --token is omitted",
    "",
    "Examples:",
    "  CAPTION_PIPELINE_JWT=... node scripts/caption-pipeline.mjs --file ./image.png",
    "  node scripts/caption-pipeline.mjs --file ./image.jpg --token <jwt> --content-type image/jpeg",
  ];
  console.error(text.join("\n"));
  process.exit(exitCode);
}

async function fetchJson(url, options, stepLabel) {
  const response = await fetch(url, options);
  if (!response.ok) {
    const body = await response.text();
    throw new Error(`${stepLabel} failed (${response.status}): ${body}`);
  }
  return response.json();
}

async function main() {
  const args = parseArgs(process.argv);
  const token = args.token || process.env.CAPTION_PIPELINE_JWT;
  const filePath = args.file;

  if (!token || !filePath) {
    usage();
  }

  const ext = path.extname(filePath).toLowerCase();
  const detectedType = EXTENSION_TO_TYPE.get(ext);
  const contentType = args["content-type"] || detectedType;

  if (!contentType || !SUPPORTED_TYPES.has(contentType)) {
    console.error(
      `Unsupported or missing content type. Supported: ${Array.from(SUPPORTED_TYPES).join(", ")}`
    );
    usage();
  }

  console.log("Step 1: generate presigned URL");
  const step1 = await fetchJson(
    `${BASE_URL}/pipeline/generate-presigned-url`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ contentType }),
    },
    "Step 1"
  );

  if (!step1.presignedUrl || !step1.cdnUrl) {
    throw new Error("Step 1 response missing presignedUrl or cdnUrl.");
  }

  console.log("Step 2: upload image bytes to presigned URL");
  const fileBytes = await fs.readFile(filePath);
  const uploadResponse = await fetch(step1.presignedUrl, {
    method: "PUT",
    headers: {
      "Content-Type": contentType,
    },
    body: fileBytes,
  });

  if (!uploadResponse.ok) {
    const body = await uploadResponse.text();
    throw new Error(`Step 2 failed (${uploadResponse.status}): ${body}`);
  }

  console.log("Step 3: register image URL in pipeline");
  const step3 = await fetchJson(
    `${BASE_URL}/pipeline/upload-image-from-url`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        imageUrl: step1.cdnUrl,
        isCommonUse: args.common === "true",
      }),
    },
    "Step 3"
  );

  if (!step3.imageId) {
    throw new Error("Step 3 response missing imageId.");
  }

  console.log("Step 4: generate captions");
  const step4 = await fetchJson(
    `${BASE_URL}/pipeline/generate-captions`,
    {
      method: "POST",
      headers: {
        Authorization: `Bearer ${token}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ imageId: step3.imageId }),
    },
    "Step 4"
  );

  console.log("Captions response:");
  console.log(JSON.stringify(step4, null, 2));
}

main().catch((error) => {
  console.error(error?.stack || error?.message || String(error));
  process.exit(1);
});
