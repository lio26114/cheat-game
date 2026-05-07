const https = require("https");
const fs = require("fs");
const path = require("path");

// Log file URLs from the query result
const logUrls = [
  "https://job-logs.eascdn.net/production/bb69f612-fc3d-41b5-b091-bf6b57171f24/1777735249856-d2a729ba-5c39-4f4e-82fb-c51ccac88838.txt?X-Goog-Algorithm=GOOG4-RSA-SHA256&X-Goog-Credential=www-production%40exponentjs.iam.gserviceaccount.com%2F20260502%2Fauto%2Fstorage%2Fgoog4_request&X-Goog-Date=20260502T153257Z&X-Goog-Expires=900&X-Goog-SignedHeaders=host&X-Goog-Signature=a632970a1aa2d7e88575d6117c681743f17f0e812c658bd02990d683808270ff7db96cb8f4457f0db8679bbbbde11cb5d2f2cf3d888d97a4ae92c89f7cd74af1a1790ee6907af303a6258cb7b77940d6a87cd39fdec6772a8db2cb20c90b0d4d66d0f533dafbd8186f45562c26d812c13deee9dc529763b85f6884d5e0d4c5b7105a0a9f43ace2c810d24da9adb1976ae3e304ae715d5c51da8d4d2f5b31dfe9f52966ecd4e44b3215f94c729f4fe1ff153d60fa7cc798d3727a836394686938c4ac7cc60ae0916ccddfd1ce5988e0b139c2b88a7d7dc2db51e5713789f3004c6dece6835356873b9b72bb5ee899b845197c02838a944be69aafbed8"
];

async function downloadLog(url, index) {
  return new Promise((resolve, reject) => {
    https.get(url, (res) => {
      let data = [];
      res.on("data", chunk => data.push(chunk));
      res.on("end", () => {
        const content = Buffer.concat(data).toString();
        const filename = `D:\\cheat-game\\log_${index}.txt`;
        fs.writeFileSync(filename, content);
        console.log(`Downloaded log ${index} to ${filename}`);
        console.log(`\n=== LOG ${index} (first 2000 chars) ===`);
        console.log(content.substring(0, 2000));
        if (content.length > 2000) {
          console.log(`\n... (truncated, total ${content.length} chars)`);
        }
        resolve(content);
      });
    }).on("error", reject);
  });
}

(async () => {
  try {
    const content = await downloadLog(logUrls[0], 0);
    // Check if it contains Gradle error
    if (content.includes("FAIL") || content.includes("ERROR") || content.includes("rror")) {
      console.log("\n\n=== LINES WITH ERROR ===");
      const lines = content.split("\n");
      for (let i = 0; i < lines.length; i++) {
        if (lines[i].includes("FAIL") || lines[i].includes("ERROR") || (lines[i].includes("rror") && !lines[i].includes("WARNING"))) {
          console.log(`Line ${i+1}: ${lines[i]}`);
        }
      }
    }
  } catch(e) {
    console.log("Error:", e.message);
  }
})();
