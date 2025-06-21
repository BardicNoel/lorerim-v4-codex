export const flagParserGenerator = (flagsMap: Record<number, string>) => {
  return (value: number): string[] => {
    return Object.entries(flagsMap)
      .filter(([bit]) => (value & Number(bit)) !== 0)
      .map(([, label]) => label);
  };
};

export const mapParserGenerator = (map: Record<number, any>) => {
  return (value: number): any => {
    const resolved = map[value];
    return resolved ?? null;
  };
};
