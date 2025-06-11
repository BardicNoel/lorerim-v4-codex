// Pascal script for xEdit (Universal Record Exporter with Nested Field Support - grouped by type + manifest to subfolder)
// Specifically designed for Skyrim records

unit UserScript;

var
  currentRecordType: string;
  outputMap, countMap, typeList: TStringList;
  exportFolder: string;
  recordCounts: TStringList; // Track number of records per type for comma handling

// Universal excluded fields that apply to all record types
const
  UNIVERSAL_EXCLUDED_FIELDS: array[0..3] of string = (
    'Data Size',
    'Version Control Info 1',
    'Version Control Info 2',
    'Form Version'
  );

// Record type specific exclusions
const
  PERK_EXCLUDED_FIELDS: array[0..0] of string = (
    'PRKF - End Marker'
  );

function IsExcludedField(const fieldName: string; recordType: string): boolean;
var
  i: integer;
begin
  Result := false;
  
  // Check universal exclusions
  for i := 0 to High(UNIVERSAL_EXCLUDED_FIELDS) do
    if fieldName = UNIVERSAL_EXCLUDED_FIELDS[i] then begin
      Result := true;
      Exit;
    end;
    
  // Check record type specific exclusions
  if recordType = 'PERK' then
    for i := 0 to High(PERK_EXCLUDED_FIELDS) do
      if fieldName = PERK_EXCLUDED_FIELDS[i] then begin
        Result := true;
        Exit;
      end;
end;

function IsNullOrEmpty(const value: string): boolean;
begin
  Result := (value = '') or (value = '0') or (value = '00000000');
end;

function BoolToStr(value: boolean): string;
begin
  if value then
    Result := 'true'
  else
    Result := 'false';
end;

function EscapeString(const s: string): string;
var
  i: integer;
  c: char;
begin
  Result := '';
  for i := 1 to Length(s) do begin
    c := s[i];
    case c of
      '"': Result := Result + '\"';
      '\': Result := Result + '\\';
      '/': Result := Result + '\/';
      #8: Result := Result + '\b';
      #9: Result := Result + '\t';
      #10: Result := Result + '\n';
      #12: Result := Result + '\f';
      #13: Result := Result + '\r';
      else
        if (c < ' ') or (c > #127) then
          Result := Result + '\u' + IntToHex(Ord(c), 4)
        else
          Result := Result + c;
    end;
  end;
end;

procedure DumpElement(e: IInterface; indent: integer; sl: TStringList);
var
  i, count: integer;
  child, nextChild: IInterface;
  elemName, nextName, elemValue, indentStr: string;
  isArray: boolean;
begin
  indentStr := StringOfChar(' ', indent * 2);
  count := ElementCount(e);
  if count > 0 then begin
    sl.Add(indentStr + '{');
    i := 0;
    while i < count do begin
      child := ElementByIndex(e, i);
      elemName := Name(child);
      if elemName = '' then elemName := '[' + IntToStr(i) + ']';

      // Skip excluded fields
      if IsExcludedField(elemName, currentRecordType) then begin
        Inc(i);
        Continue;
      end;

      // Skip empty Headers
      if (elemName = 'Headers') and (ElementCount(child) = 0) then begin
        Inc(i);
        Continue;
      end;

      isArray := false;
      if i + 1 < count then begin
        nextChild := ElementByIndex(e, i + 1);
        nextName := Name(nextChild);
        if nextName = elemName then
          isArray := true;
      end;

      if isArray then begin
        sl.Add(indentStr + '  "' + EscapeString(elemName) + '": [');
        while (i < count) and (Name(ElementByIndex(e, i)) = elemName) do begin
          child := ElementByIndex(e, i);
          if ElementCount(child) > 0 then begin
            DumpElement(child, indent + 2, sl);
            if (i + 1 < count) and (Name(ElementByIndex(e, i + 1)) = elemName) then
              sl[sl.Count - 1] := sl[sl.Count - 1] + ',';
          end else begin
            elemValue := GetEditValue(child);
            if not IsNullOrEmpty(elemValue) then begin
              if (i + 1 < count) and (Name(ElementByIndex(e, i + 1)) = elemName) then
                sl.Add(indentStr + '    "' + EscapeString(elemValue) + '",')
              else
                sl.Add(indentStr + '    "' + EscapeString(elemValue) + '"');
            end;
          end;
          Inc(i);
        end;
        sl.Add(indentStr + '  ]');
      end else begin
        child := ElementByIndex(e, i);
        if ElementCount(child) > 0 then begin
          sl.Add(indentStr + '  "' + EscapeString(elemName) + '": ');
          DumpElement(child, indent + 1, sl);
          if i < count - 1 then
            sl[sl.Count - 1] := sl[sl.Count - 1] + ',';
        end else begin
          // Special handling for certain fields
          if (elemName = 'FormID') then
            elemValue := Signature(e) + ':' + IntToHex(FixedFormID(e), 8)
          else if (elemName = 'EDID - Editor ID') then
            elemValue := editorID
          else
            elemValue := GetEditValue(child);

          if not IsNullOrEmpty(elemValue) then begin
            if i < count - 1 then
              sl.Add(indentStr + '  "' + EscapeString(elemName) + '": "' + EscapeString(elemValue) + '",')
            else
              sl.Add(indentStr + '  "' + EscapeString(elemName) + '": "' + EscapeString(elemValue) + '"');
          end;
        end;
        Inc(i);
      end;
    end;
    sl.Add(indentStr + '}');
  end else begin
    elemValue := GetEditValue(e);
    if not IsNullOrEmpty(elemValue) then
      sl.Add(indentStr + '"' + EscapeString(elemValue) + '"');
  end;
end;

function Process(e: IInterface): integer;
var
  sl: TStringList;
  recordType, editorID, fixedID, fullID, pluginName: string;
  i, newCount: integer;
  temp: TStringList;
  currentCount: integer;
begin
  recordType := Signature(e);
  currentRecordType := recordType; // Set current record type for field exclusion checks
  editorID := GetEditValue(ElementBySignature(e, 'EDID'));
  if recordType = '' then Exit;

  fixedID := IntToHex(FixedFormID(e), 8);
  fullID := IntToHex(GetLoadOrderFormID(e), 8);
  pluginName := GetFileName(GetFile(e));

  if outputMap.IndexOf(recordType) = -1 then
  begin
    sl := TStringList.Create;
    sl.Add('[');
    outputMap.AddObject(recordType, sl);
    countMap.Values[recordType] := '0';
    typeList.Add(recordType);
    recordCounts.Values[recordType] := '0';
  end
  else
    sl := TStringList(outputMap.Objects[outputMap.IndexOf(recordType)]);

  temp := TStringList.Create;
  temp.Add('  {');
  temp.Add('    "plugin": "' + EscapeString(pluginName) + '",');
  temp.Add('    "load_order": "' + IntToHex(GetLoadOrderFormID(e) shr 24, 2) + '",');
  temp.Add('    "form_id": "' + fixedID + '",');
  temp.Add('    "full_form_id": "' + fullID + '",');
  temp.Add('    "unique_id": "' + pluginName + '|' + fixedID + '",');
  temp.Add('    "record_type": "' + EscapeString(recordType) + '",');
  temp.Add('    "editor_id": "' + EscapeString(editorID) + '",');
  temp.Add('    "winning": ' + BoolToStr(IsWinningOverride(e)) + ',');
  temp.Add('    "data": ');
  DumpElement(e, 3, temp);
  
  // Get current count for this record type
  currentCount := StrToInt(recordCounts.Values[recordType]);
  if currentCount > 0 then
    temp[0] := ', ' + temp[0]; // Add comma before the record if it's not the first one
  
  sl.AddStrings(temp);
  temp.Free;

  // Update counts
  newCount := StrToInt(countMap.Values[recordType]) + 1;
  countMap.Values[recordType] := IntToStr(newCount);
  recordCounts.Values[recordType] := IntToStr(currentCount + 1);

  Result := 0;
end;

function Finalize: integer;
var
  i: integer;
  sl, manifest: TStringList;
  recordType, filePath: string;
  manifestPath: string;
begin
  manifest := TStringList.Create;
  manifest.Add('{');
  manifest.Add('  "summary_generated": "' + FormatDateTime('yyyy-mm-dd"T"hh:nn:ss"Z"', Now) + '",');
  manifest.Add('  "record_types": [');

  for i := 0 to typeList.Count - 1 do
  begin
    recordType := typeList[i];
    sl := TStringList(outputMap.Objects[outputMap.IndexOf(recordType)]);
    sl.Add(']');
    filePath := exportFolder + 'Export_' + recordType + '.json';
    sl.SaveToFile(filePath);
    sl.Free;

    manifest.Add('    {');
    manifest.Add('      "type": "' + recordType + '",');
    if countMap.IndexOfName(recordType) <> -1 then
      manifest.Add('      "count": ' + countMap.Values[recordType] + ',')
    else
      manifest.Add('      "count": 0,');
    manifest.Add('      "file": "Export_' + recordType + '.json"');
    if i < typeList.Count - 1 then
      manifest.Add('    },')
    else
      manifest.Add('    }');
  end;

  manifest.Add('  ]');
  manifest.Add('}');

  manifestPath := exportFolder + 'Export_manifest.json';
  manifest.SaveToFile(manifestPath);
  manifest.Free;
  outputMap.Free;
  countMap.Free;
  typeList.Free;
  recordCounts.Free;
  Result := 0;
end;

function Initialize: integer;
begin
  exportFolder := ProgramPath + 'Edit Scripts\codex-exports\\';
  ForceDirectories(exportFolder);
  outputMap := TStringList.Create;
  countMap := TStringList.Create;
  typeList := TStringList.Create;
  recordCounts := TStringList.Create;
  Result := 0;
end;

end.
