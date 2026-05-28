const fs = require('fs');

async function testAI() {
  try {
    const res = await fetch("https://text.pollinations.ai/", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        messages: [
          { role: "system", content: "Responde solo en JSON: {\"ok\": true}" },
          { role: "user", content: "Hola" }
        ],
        jsonMode: true
      })
    });
    const text = await res.text();
    fs.writeFileSync('ai_test.txt', text);
  } catch(e) {
    fs.writeFileSync('ai_test.txt', e.toString());
  }
}
testAI();
