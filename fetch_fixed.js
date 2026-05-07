const https = require("https");
const fs = require("fs");
const path = require("path");

const statePath = path.join(require("os").homedir(), ".expo", "state.json");
const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
const sessionSecret = JSON.parse(state.auth.sessionSecret);

const buildId = "bb69f612-fc3d-41b5-b091-bf6b57171f24";

// Match BuildFragment fields exactly
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
      project {
        __typename
        id
        name
        slug
      }
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
        console.log("\n=== BUILD INFO ===");
        console.log("ID:", b.id);
        console.log("Status:", b.status);
        console.log("SDK:", b.sdkVersion);
        console.log("Profile:", b.buildProfile);
        console.log("\nError:", JSON.stringify(b.error, null, 2));
        console.log("\nLog Files:", JSON.stringify(b.logFiles, null, 2));
        console.log("\nArtifacts:", JSON.stringify(b.artifacts, null, 2));
        console.log("\nProject:", JSON.stringify(b.project, null, 2));
      } else {
        console.log("Result:", result.substring(0, 3000));
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
