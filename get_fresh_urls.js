const https = require("https");
const fs = require("fs");
const path = require("path");

const statePath = path.join(require("os").homedir(), ".expo", "state.json");
const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
const sessionSecret = JSON.parse(state.auth.sessionSecret);

// Use exact build ID from the latest failed build
const buildId = "bb69f612-fc3d-41b5-b091-bf6b57171f24";

// Query matching what worked before - builds.byId
const query = `
query BuildsByIdQuery($buildId: ID!) {
  builds {
    byId(buildId: $buildId) {
      id
      status
      error { errorCode message }
      logFiles
    }
  }
}
`;

const variables = { buildId };
const bodyData = JSON.stringify({ query, variables });

const options = {
  hostname: "api.expo.dev",
  path: "/graphql",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(bodyData),
    "Expo-Session": JSON.stringify({ id: sessionSecret.id, version: sessionSecret.version })
  }
};

const req = https.request(options, (res) => {
  let data = [];
  res.on("data", chunk => data.push(chunk));
  res.on("end", () => {
    const result = Buffer.concat(data).toString();
    console.log("Status:", res.statusCode);
    try {
      const json = JSON.parse(result);
      if (json.data && json.data.builds && json.data.builds.byId) {
        const b = json.data.builds.byId;
        console.log("\nBuild ID:", b.id);
        console.log("Status:", b.status);
        console.log("Error:", JSON.stringify(b.error));
        console.log("\nLog Files URLs (fresh):");
        if (b.logFiles && b.logFiles.length > 0) {
          b.logFiles.forEach((url, i) => {
            console.log(`[${i}]: ${url.substring(0, 200)}...`);
          });
          // Save URLs to file for downloading
          fs.writeFileSync("D:/cheat-game/fresh_log_urls.json", JSON.stringify(b.logFiles, null, 2));
          console.log("\nSaved fresh log URLs to: D:/cheat-game/fresh_log_urls.json");
        } else {
          console.log("No log files available");
        }
      } else {
        console.log("Result:", result.substring(0, 2000));
      }
    } catch(e) {
      console.log("Parse error:", e.message);
      console.log("Raw:", result.substring(0, 2000));
    }
  });
});
req.on("error", e => console.log("Request error:", e.message));
req.write(bodyData);
req.end();
