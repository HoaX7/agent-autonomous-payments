import expressApp from ".";

const PORT = process.env.PORT || 41241; // Different port for coder agent
expressApp.listen(PORT, () => {
  console.log(
    `[VendorAgent] Server using new framework started on http://localhost:${PORT}`
  );
  console.log(
    `[VendorAgent] Agent Card: http://localhost:${PORT}/.well-known/agent.json`
  );
  console.log("[VendorAgent] Press Ctrl+C to stop the server");
});
