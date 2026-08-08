const userModel = require('../models/userModel');

const ROLE_LEVEL = { public: 0, contributor: 1, validator: 2, admin: 3 };

async function findOrCreateGoogleUser(profile) {
  const googleId = profile.id;
  const email = profile.emails && profile.emails[0] ? profile.emails[0].value : null;
  const name = profile.displayName;
  const avatarUrl = profile.photos && profile.photos[0] ? profile.photos[0].value : null;

  let user = await userModel.findByGoogleId(googleId);
  if (user) return user;

  if (email) {
    user = await userModel.findByEmail(email);
    if (user) return user;
  }

  return userModel.createUser({ googleId, name, email, avatarUrl });
}

function getUserById(id) {
  return userModel.findById(id);
}

function canAssumeViewRole(realRole, requestedViewRole) {
  if (!(requestedViewRole in ROLE_LEVEL)) return false;
  return ROLE_LEVEL[requestedViewRole] <= ROLE_LEVEL[realRole];
}

module.exports = {
  findOrCreateGoogleUser,
  getUserById,
  canAssumeViewRole,
  ROLE_LEVEL,
};