import { AgentCard, AgentSkill, AgentCapabilities } from "@a2a-js/sdk";

const skill: AgentSkill = {
    id: 'confirm_payment',
    name: 'Confirm Payment',
    description: 'Confirm payment from paypal',
    tags: ['payment'],
    examples: [
    'Confirm payment and place orders for item x.',
    ],
    inputModes: ['text/plain'], // Explicitly defining for skill
    outputModes: ['text/plain'] // Explicitly defining for skill
};

const capabilities: AgentCapabilities = {
    streaming: false,
    pushNotifications: false,
    stateTransitionHistory: false
};

export const vendorAgentCard: AgentCard = {
  name: 'Vendor Agent',
  description: 'An agent that can receive and confirms payments to place orders.',
  // Adjust the base URL and port as needed.
  // this will be used from the client to connect to Agent
  url: 'http://localhost:41241', // Api-Gateway URL
  version: '0.0.2', // Incremented version
  capabilities,
  securitySchemes: undefined, // Or define actual security schemes if any
  security: undefined,
  defaultInputModes: ['text/plain'],
  defaultOutputModes: ['text/plain'],
  skills: [skill],
  supportsAuthenticatedExtendedCard: false,
};