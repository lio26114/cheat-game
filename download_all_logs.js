const https = require("https");
const fs = require("fs");
const path = require("path");

// Read fresh URLs from saved file
const urlsPath = "D:/cheat-game/fresh_log_urls.json";
const urls = JSON.parse(fs.readFileSync(urlsPath, "utf8"));

console.log(`Downloading ${urls.length} log files...\n`);

function downloadFile(url, filename) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = [];
      res.on("data", chunk => data.push(chunk));
      res.on("end", () => {
        const content = Buffer.concat(data);
        fs.writeFileSync(filename, content);
        console.log(`Saved: ${path.basename(filename)} (${content.length} bytes)`);
        resolve(content.toString());
      });
    }).on("error", (e) => {
      console.log(`Error downloading ${filename}: ${e.message}`);
      reject(e);
    });
  });
}

(async () => {
  try {
    const allContent = [];
    for (let i = 0; i < urls.length; i++) {
      const filename = `D:/cheat-game/eas_log_${i}.txt`;
      const content = await downloadFile(urls[i], filename);
      allContent.push(content);
      
      // Check for Gradle errors in this file
      if (content.includes("FAIL") || content.includes("ERROR") || content.includes("Exception")) {
        console.log(`\n=== POSSIBLE ERRORS IN LOG ${i} ===`);
        const lines = content.split("\n");
        for (let j = 0; j < lines.length; j++) {
          const line = lines[j];
          if (line.includes("FAIL") || line.includes("ERROR") || 
              (line.includes("Exception") && !line.includes("WARNING"))) {
            console.log(`  Line ${j+1}: ${line.substring(0, 200)}`);
          }
        }
      }
    }
    
    // Search ALL content for "gradle" (case-insensitive)
    const fullLog = allContent.join("\n");
    const gradleIdx = fullLog.toLowerCase().indexOf("gradle");
    if (gradleIdx >= 0) {
      console.log("\n=== GRADLE-RELATED CONTENT ===");
      console.log(fullLog.substring(Math.max(0, gradleIdx - 500), Math.min(fullLog.length, gradleIdx + 2000)));
    }
    
    console.log("\n=== ALL LOG FILES DOWNLOADED ===");
    console.log("Check: D:/cheat-game/eas_log_*.txt");
    
  } catch(e) {
    console.log("Error:", e.message);
  }
})();
