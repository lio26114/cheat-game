const https = require("https");
const fs = require("fs");
const path = require("path");

const statePath = path.join(require("os").homedir(), ".expo", "state.json");
const state = JSON.parse(fs.readFileSync(statePath, "utf8"));
const sessionSecret = JSON.parse(state.auth.sessionSecret);

// Get the MOST RECENT build (not a specific one)
const query = `
{
  builds(accountName: "lio26", projectSlug: "cheat-game") {
    id
    status
    error { errorCode message }
    logFiles
  }
}
`;

const bodyData = JSON.stringify({ query });

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
      if (json.data && json.data.builds) {
        const builds = json.data.builds;
        console.log("\n=== BUILDS ===");
        builds.forEach(b => {
          console.log(`ID: ${b.id}`);
          console.log(`  Status: ${b.status}`);
          console.log(`  Error: ${JSON.stringify(b.error)}`);
          console.log(`  LogFiles: ${b.logFiles ? b.logFiles.length + " files" : "none"}`);
          if (b.logFiles && b.logFiles.length > 0) {
            console.log(`\n  === LOG URLS (first one) ===`);
            console.log(b.logFiles[0].substring(0, 500));
          }
          console.log("");
        });
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
