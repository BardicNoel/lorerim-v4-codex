const fs = require('fs');

const inputText = fs.readFileSync('actor-enum-table-raw.txt', 'utf8');
const lines = inputText.trim().split('\n');

const actorValuesMap = {
    ...lines.map(line => {
        const [index, name, type, effect, formId] = line.split('\t');
        console.log({index, name, type, effect, formId})
        return {
          [index]: {
              name,
              type,
              effect,
              formId
          }
        }
      })
}

const output = JSON.stringify(actorValuesMap, null, 2)

// const mapEntries = ;

// const output = `export const actorValueMap: Record<number, string> = {\n${mapEntries.join('\n')}\n};\n`;

fs.writeFileSync('actor_value_map.ts', actorValuesMap);
// console.log('actor_value_map.ts written successfully.');
