const bcrypt = require('bcryptjs');

class PasswordValidator {
  // Strong password requirements
  static PASSWORD_REGEX = /^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)(?=.*[@$!%*?&])[A-Za-z\d@$!%*?&]{8,}$/;
  
  // Common weak passwords to reject
  static WEAK_PASSWORDS = [
    'password', 'password123', '123456', '123456789', 'qwerty',
    'abc123', 'password1', 'admin', 'letmein', 'welcome',
    'monkey', 'dragon', 'master', 'hello', 'login'
  ];

  /**
   * Validate password strength
   */
  static validatePassword(password) {
    const errors = [];
    
    if (!password) {
      errors.push('Password is required');
      return { isValid: false, errors };
    }
    
    if (password.length < 8) {
      errors.push('Password must be at least 8 characters long');
    }
    
    if (!/[a-z]/.test(password)) {
      errors.push('Password must contain at least one lowercase letter');
    }
    
    if (!/[A-Z]/.test(password)) {
      errors.push('Password must contain at least one uppercase letter');
    }
    
    if (!/\d/.test(password)) {
      errors.push('Password must contain at least one number');
    }
    
    if (!/[@$!%*?&]/.test(password)) {
      errors.push('Password must contain at least one special character (@$!%*?&)');
    }
    
    // Check against common weak passwords
    if (this.WEAK_PASSWORDS.includes(password.toLowerCase())) {
      errors.push('Password is too common. Please choose a stronger password');
    }
    
    // Check for repeated characters
    if (/(.)\1{2,}/.test(password)) {
      errors.push('Password cannot contain more than 2 consecutive identical characters');
    }
    
    return {
      isValid: errors.length === 0,
      errors,
      strength: this.calculateStrength(password)
    };
  }

  /**
   * Calculate password strength score (0-100)
   */
  static calculateStrength(password) {
    let score = 0;
    
    // Length bonus
    if (password.length >= 8) score += 20;
    if (password.length >= 12) score += 10;
    if (password.length >= 16) score += 10;
    
    // Character variety bonus
    if (/[a-z]/.test(password)) score += 10;
    if (/[A-Z]/.test(password)) score += 10;
    if (/\d/.test(password)) score += 10;
    if (/[@$!%*?&]/.test(password)) score += 10;
    
    // Complexity bonus
    const uniqueChars = new Set(password).size;
    score += Math.min(uniqueChars * 2, 20);
    
    return Math.min(score, 100);
  }

  /**
   * Hash password with strong salt rounds
   */
  static async hashPassword(password) {
    const saltRounds = parseInt(process.env.BCRYPT_ROUNDS) || 12;
    return await bcrypt.hash(password, saltRounds);
  }

  /**
   * Compare password with hash (timing-safe)
   */
  static async comparePassword(password, hash) {
    return await bcrypt.compare(password, hash);
  }

  /**
   * Generate a secure random password
   */
  static generateSecurePassword(length = 16) {
    const charset = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789@$!%*?&';
    let password = '';
    
    // Ensure at least one character from each required category
    password += 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'[Math.floor(Math.random() * 26)]; // uppercase
    password += 'abcdefghijklmnopqrstuvwxyz'[Math.floor(Math.random() * 26)]; // lowercase
    password += '0123456789'[Math.floor(Math.random() * 10)]; // number
    password += '@$!%*?&'[Math.floor(Math.random() * 7)]; // special char
    
    // Fill remaining length with random characters
    for (let i = 4; i < length; i++) {
      password += charset[Math.floor(Math.random() * charset.length)];
    }
    
    // Shuffle the password
    return password.split('').sort(() => Math.random() - 0.5).join('');
  }

  /**
   * Check if password has been compromised (basic check)
   */
  static isPasswordCompromised(password) {
    // This is a basic implementation
    // In production, you might want to integrate with HaveIBeenPwned API
    return this.WEAK_PASSWORDS.includes(password.toLowerCase());
  }

  /**
   * Get password strength description
   */
  static getStrengthDescription(strength) {
    if (strength < 30) return { level: 'Very Weak', color: 'red' };
    if (strength < 50) return { level: 'Weak', color: 'orange' };
    if (strength < 70) return { level: 'Fair', color: 'yellow' };
    if (strength < 90) return { level: 'Good', color: 'lightgreen' };
    return { level: 'Strong', color: 'green' };
  }
}

module.exports = PasswordValidator;
