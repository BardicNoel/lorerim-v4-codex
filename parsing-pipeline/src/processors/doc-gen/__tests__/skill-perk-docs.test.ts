import { createSkillPerkDocsGenerator } from '../skill-perk-docs';

describe('skill-perk-docs processor', () => {
  const baseSkill = {
    FULL: 'One-Handed',
    DESC: 'Test skill description',
    CNAM: 'Combat',
    perkSections: [],
  };

  it('extracts keywords including skill name', async () => {
    const skill = {
      ...baseSkill,
      perkSections: [
        {
          PERK: {
            FULL: 'Power Bash',
            DESC: 'Bash with a torch does extra damage.',
            sections: [
              {
                CTDA: [
                  {
                    function: { functionIndex: 673 }, // IsPowerAttacking
                  },
                ],
              },
            ],
          },
        },
      ],
    };
    const data = [skill];
    const generator = createSkillPerkDocsGenerator({ includePositionalData: false });
    const result = (await generator.generate(data, {})) as any[];
    const perk = result[0].perks[0];
    expect(perk.keywords).toContain('Power Attack');
    expect(perk.keywords).toContain('One-Handed');
  });

  it('extracts requirements from CTDA', async () => {
    const skill = {
      ...baseSkill,
      perkSections: [
        {
          PERK: {
            FULL: 'Skillful',
            sections: [
              {
                CTDA: [
                  {
                    function: { functionIndex: 277, functionName: 'GetBaseActorValue (GetBaseAV)' },
                    comparisonValue: 40,
                  },
                ],
              },
            ],
          },
        },
      ],
    };
    const data = [skill];
    const generator = createSkillPerkDocsGenerator({ includePositionalData: false });
    const result = (await generator.generate(data, {})) as any[];
    const perk = result[0].perks[0];
    expect(perk.requirements).toContain('Skill Level 40');
  });

  it('extracts effects and prerequisites', async () => {
    const skill = {
      ...baseSkill,
      perkSections: [
        {
          PERK: {
            FULL: 'Combo Master',
            sections: [
              {
                DATA: { effectType: 'Mod Attack Damage', functionType: 'Multiply Value' },
              },
            ],
          },
          INAM: 2,
          CNAM: [1],
        },
        {
          PERK: {
            FULL: 'Starter',
            sections: [],
          },
          INAM: 1,
        },
      ],
    };
    const data = [skill];
    const generator = createSkillPerkDocsGenerator({ includePositionalData: false });
    const result = (await generator.generate(data, {})) as any[];
    const perk = result[0].perks[0];
    expect(perk.effects).toContain('Mod Attack Damage - Multiply Value');
    expect(perk.prerequisites).toContain('Starter');
  });

  it('handles missing/undefined fields gracefully', async () => {
    const skill = {
      ...baseSkill,
      perkSections: [
        {
          PERK: {
            FULL: 'Barebones',
            sections: [],
          },
        },
      ],
    };
    const data = [skill];
    const generator = createSkillPerkDocsGenerator({ includePositionalData: false });
    const result = (await generator.generate(data, {})) as any[];
    const perk = result[0].perks[0];
    expect(perk.name).toBe('Barebones');
    expect(perk.keywords).toBeUndefined();
    expect(perk.requirements).toBeUndefined();
    expect(perk.effects).toBeUndefined();
    expect(perk.prerequisites).toBeUndefined();
  });

  it('outputs correct structure for a sample input', async () => {
    const skill = {
      ...baseSkill,
      perkSections: [
        {
          PERK: {
            FULL: 'Sample Perk',
            DESC: 'A sample perk.',
            sections: [
              {
                CTDA: [{ function: { functionIndex: 673 } }],
                DATA: { effectType: 'Mod Attack Damage', functionType: 'Multiply Value' },
              },
            ],
          },
        },
      ],
    };
    const data = [skill];
    const generator = createSkillPerkDocsGenerator({ includePositionalData: false });
    const result = (await generator.generate(data, {})) as any[];
    expect(result[0].skillName).toBe('One-Handed');
    expect(result[0].perks[0].name).toBe('Sample Perk');
    expect(result[0].perks[0].description).toBe('A sample perk.');
    expect(result[0].perks[0].keywords).toContain('Power Attack');
    expect(result[0].perks[0].effects).toContain('Mod Attack Damage - Multiply Value');
  });

  it('extracts keywords from real CTDA structures', async () => {
    const skill = {
      ...baseSkill,
      perkSections: [
        {
          PERK: {
            FULL: 'Test Perk',
            DESC: 'A test perk with various CTDA conditions.',
            sections: [
              {
                CTDA: [
                  {
                    operator: {
                      compareOperator: 'Equal to',
                      flags: ['OR'],
                    },
                    function: {
                      functionName: 'EPMagic_SpellHasKeyword',
                      functionIndex: 693,
                      isSkillCheck: false,
                      description: 'Function index 693',
                    },
                    runOnType: 'Subject',
                  },
                  {
                    operator: {
                      compareOperator: 'Equal to',
                      flags: [],
                    },
                    function: {
                      functionName: 'HasKeyword',
                      functionIndex: 560,
                      isSkillCheck: false,
                      description: 'Function index 560',
                    },
                    runOnType: 'Subject',
                  },
                  {
                    operator: {
                      compareOperator: 'Greater than or equal to',
                      flags: [],
                    },
                    comparisonValue: 25,
                    function: {
                      functionName: 'GetBaseActorValue (GetBaseAV)',
                      functionIndex: 277,
                      isSkillCheck: false,
                      description: 'Function index 277',
                    },
                    runOnType: 'Subject',
                    reference: '0x00000000',
                  },
                ],
              },
            ],
          },
        },
      ],
    };
    const data = [skill];
    const generator = createSkillPerkDocsGenerator({ includePositionalData: false });
    const result = (await generator.generate(data, {})) as any[];
    const perk = result[0].perks[0];

    // Should include skill name
    expect(perk.keywords).toContain('One-Handed');

    // Should include function-based keywords
    expect(perk.keywords).toContain('Function: EPMagic_SpellHasKeyword');
    expect(perk.keywords).toContain('Function: HasKeyword');

    // Should include skill level requirement
    expect(perk.requirements).toContain('Skill Level 25');
  });
});
