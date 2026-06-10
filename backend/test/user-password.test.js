const test = require('node:test');
const assert = require('node:assert/strict');
const crypto = require('crypto');
const User = require('../models/User');

test('new passwords use scrypt and validate correctly', () => {
  const user = new User({
    name: 'Test User',
    email: 'test@example.com',
    password: 'placeholder'
  });

  user.setPassword('StrongPassword1!');

  assert.equal(user.passwordAlgorithm, 'scrypt');
  assert.equal(user.validatePassword('StrongPassword1!'), true);
  assert.equal(user.validatePassword('WrongPassword1!'), false);
  assert.equal(user.needsPasswordRehash(), false);
});

test('legacy PBKDF2 passwords remain valid and are marked for upgrade', () => {
  const salt = crypto.randomBytes(16).toString('hex');
  const password = 'LegacyPassword1!';
  const user = new User({
    name: 'Legacy User',
    email: 'legacy@example.com',
    password: crypto.pbkdf2Sync(password, salt, 1000, 64, 'sha512').toString('hex'),
    salt
  });

  assert.equal(user.validatePassword(password), true);
  assert.equal(user.validatePassword('WrongPassword1!'), false);
  assert.equal(user.needsPasswordRehash(), true);
});
