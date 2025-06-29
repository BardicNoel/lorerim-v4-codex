/**
 * Represents a trait that can be chosen during character creation.
 * Players can choose 2 traits at the start, with a potential third unlocked later.
 */
export interface TraitDefinition {
  /** Display name of the trait */
  name: string;
  
  /** Full description of what the trait does */
  description: string;
  
  /** Internal EDID for reference */
  edid: string;
  
  /** Internal FormID for reference */
  formId: string;
} 