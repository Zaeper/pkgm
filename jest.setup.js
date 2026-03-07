// Mock @inquirer/prompts to avoid Node.js styleText compatibility issues
jest.mock('@inquirer/prompts', () => ({
  checkbox: jest.fn(),
  input: jest.fn(),
  select: jest.fn(),
}));

jest.mock('@inquirer/core', () => ({
  createPrompt: jest.fn(),
  useKeypress: jest.fn(),
}));
