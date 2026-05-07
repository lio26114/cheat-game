const fs = require("fs");

const lines = fs.readFileSync("D:/cheat-game/eas_log_3.txt", "utf8").split("\n");
console.log("Total lines:", lines.length);

// Find "What went wrong" and print surrounding context
for (let i = 0; i < lines.length; i++) {
  try {
    const obj = JSON.parse(lines[i]);
    if (obj.msg && (obj.msg.includes("What went wrong") || obj.msg.includes("FAILURE"))) {
      console.log("\n=== Found at line", i+1, "===");
      // Print this line and next 30 lines
      for (let j = i; j < Math.min(i + 50, lines.length); j++) {
        try {
          const o = JSON.parse(lines[j]);
          const msg = o.msg || "";
          const source = o.source || "";
          console.log(`Line ${j+1}: [${source}] ${msg.substring(0, 300)}`);
        } catch(e) {}
      }
      i += 50; // skip ahead
    }
  } catch(e) {}
}

// Also search for common Gradle errors
console.log("\n\n=== SEARCHING FOR SPECIFIC ERRORS ===");
const errorKeywords = [
  "Could not resolve",
  "Could not create",
  "No such property",
  "Unsupported Gradle",
  "minimum required",
  "Android Gradle Plugin",
  "compileSdkVersion",
  "targetSdk",
  "React Native version",
  "New Architecture",
  "CMake",
  "NDK",
  "Hermes",
  "Fabric",
  "TurboModule",
  "PackageList",
  "autolinking",
  "node_modules"
];

for (let i = 0; i < lines.length; i++) {
  try {
    const obj = JSON.parse(lines[i]);
    const msg = (obj.msg || "") + " " + (obj.line || "");
    for (const keyword of errorKeywords) {
      if (msg.includes(keyword)) {
        console.log(`Line ${i+1}: ${msg.substring(0, 250)}`);
        break;
      }
    }
  } catch(e) {}
}
