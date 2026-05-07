const https = require("https");
const fs = require("fs");
const path = require("path");

const statePath = path.join(require("os").homedir(), ".expo", "state.json");
const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
const sessionSecret = JSON.parse(state.auth.sessionSecret);

const buildId = "bb69f612-fc3d-41b5-b091-bf6b57171f24";

// Exact query from EAS CLI source
const query = `
query BuildsByIdQuery($buildId: ID!) {
  builds {
    byId(buildId: $buildId) {
      id
      status
      platform
      error {
        errorCode
        message
        docsUrl
      }
      logFiles
      artifacts {
        buildUrl
        buildArtifactsUrl
        applicationArchiveUrl
      }
      sdkVersion
      buildProfile
      logsUrl
    }
  }
}
`;

const variables = { buildId };
const body = JSON.stringify({ query, variables });

const options = {
  hostname: "api.expo.dev",
  path: "/graphql",
  method: "POST",
  headers: {
    "Content-Type": "application/json",
    "Content-Length": Buffer.byteLength(body),
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
        const build = json.data.builds.byId;
        console.log("\n=== Build Details ===");
        console.log("ID:", build.id);
        console.log("Status:", build.status);
        console.log("Platform:", build.platform);
        console.log("SDK Version:", build.sdkVersion);
        console.log("Build Profile:", build.buildProfile);
        console.log("\nLog Files:", JSON.stringify(build.logFiles, null, 2));
        console.log("\nArtifacts:", JSON.stringify(build.artifacts, null, 2));
        console.log("\nError:", JSON.stringify(build.error, null, 2));
      } else {
        console.log("Response:", result.substring(0, 3000));
      }
    } catch(e) {
      console.log("Parse error:", e.message);
      console.log("Raw:", result.substring(0, 2000));
    }
  });
});
req.on("error", e => console.log("Request error:", e.message));
req.write(body);
req.end();
