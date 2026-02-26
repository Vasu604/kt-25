/**
 * Database Configuration
 * Handles database connection using in-memory storage for demo
 * Replace with MongoDB connection for production
 */

const users = [];
const refreshTokens = [];

/**
 * In-memory user storage (replace with MongoDB in production)
 */
class UserStore {
  static getUsers() {
    return users;
  }

  static findUserByEmail(email) {
    return users.find(user => user.email === email);
  }

  static findUserById(id) {
    return users.find(user => user.id === id);
  }

  static addUser(user) {
    users.push(user);
    return user;
  }

  static updateUser(id, updates) {
    const index = users.findIndex(user => user.id === id);
    if (index !== -1) {
      users[index] = { ...users[index], ...updates };
      return users[index];
    }
    return null;
  }

  static deleteUser(id) {
    const index = users.findIndex(user => user.id === id);
    if (index !== -1) {
      return users.splice(index, 1)[0];
    }
    return null;
  }
}

/**
 * In-memory refresh token storage
 */
class RefreshTokenStore {
  static getRefreshTokens() {
    return refreshTokens;
  }

  static findRefreshToken(token) {
    return refreshTokens.find(rt => rt.token === token);
  }

  static addRefreshToken(tokenData) {
    refreshTokens.push(tokenData);
    return tokenData;
  }

  static removeRefreshToken(token) {
    const index = refreshTokens.findIndex(rt => rt.token === token);
    if (index !== -1) {
      return refreshTokens.splice(index, 1)[0];
    }
    return null;
  }

  static removeRefreshTokensByUserId(userId) {
    const toRemove = refreshTokens.filter(rt => rt.userId === userId);
    toRemove.forEach(rt => {
      const index = refreshTokens.indexOf(rt);
      if (index > -1) refreshTokens.splice(index, 1);
    });
    return toRemove;
  }
}

module.exports = {
  UserStore,
  RefreshTokenStore
};
