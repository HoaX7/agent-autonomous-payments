import app from ".";

const PORT = process.env.PORT || 41242; // Different port for coder agent
app.listen(PORT, () => {
  console.log(
    `[RetailAgent] Server using new framework started on http://localhost:${PORT}`
  );
  console.log(
    `[RetailAgent] Agent Card: http://localhost:${PORT}/.well-known/agent.json`
  );
  console.log("[RetailAgent] Press Ctrl+C to stop the server");
});
