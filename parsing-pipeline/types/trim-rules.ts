export interface TrimProfile {
  description: string;
  remove_fields: string[];
  removeNulls?: boolean;  // Optional flag to remove null values
}

export interface TrimRules {
  profiles: {
    [profileName: string]: TrimProfile;
  };
}

export interface TrimConfig {
  recordType: string;
  profile: string;
}

// Validation function to ensure the configuration is valid
export function validateTrimProfile(profile: TrimProfile): boolean {
  if (!profile.description || typeof profile.description !== 'string') {
    return false;
  }

  if (!Array.isArray(profile.remove_fields)) {
    return false;
  }

  if (profile.removeNulls !== undefined && typeof profile.removeNulls !== 'boolean') {
    return false;
  }

  return true;
}

export function validateTrimRules(rules: TrimRules): boolean {
  if (!rules.profiles || typeof rules.profiles !== 'object') {
    return false;
  }

  return Object.values(rules.profiles).every(validateTrimProfile);
} 