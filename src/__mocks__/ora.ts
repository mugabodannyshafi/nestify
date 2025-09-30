const ora = jest.fn(() => ({
  start: jest.fn().mockReturnThis(),
  succeed: jest.fn().mockReturnThis(),
  fail: jest.fn().mockReturnThis(),
  warn: jest.fn().mockReturnThis(),
  info: jest.fn().mockReturnThis(),
  stop: jest.fn().mockReturnThis(),
  clear: jest.fn().mockReturnThis(),
  render: jest.fn().mockReturnThis(),
  frame: jest.fn().mockReturnThis(),
  text: '',
  color: 'cyan',
  isSpinning: false,
}));

export default ora;
