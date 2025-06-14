# Resource Scraper

This tool scrapes UESP (Unofficial Elder Scrolls Pages) for Skyrim mod file format information, specifically focusing on record types like PERK, WEAP, and NPC_.

## Setup

1. Make sure you have [Node.js](https://nodejs.org/) installed (version 14 or higher recommended)
2. Install dependencies:
   ```bash
   npm install
   ```

## Usage

Run the scraper:
```bash
npm start
```

This will:
1. Fetch data for PERK, WEAP, and NPC_ records from UESP
2. Parse the subrecord tables
3. Save the results as JSON files (e.g., `PERK_subrecords.json`)

## Output

The script generates JSON files for each record type containing:
- Record name
- List of subrecords with their:
  - Name
  - Size
  - Flags 