// Pascal script for xEdit (Universal Record Exporter with Nested Field Support - grouped by type + manifest to subfolder)
// Specifically designed for Skyrim records

unit UserScript;

var
  currentRecordType: string;
  outputMap, countMap, typeList, recordCounts: TStringList;
  UNIVERSAL_EXCLUDED_FIELDS: TStringList;
  exportFolder: string;
  editorID: string; // Now global so DumpElement can access it

function IsExcludedField(const fieldName: string; recordType: string): boolean;
begin
  if fieldName = '' then begin
    AddMessage('Warning: Empty field name passed to IsExcludedField');
    Result := false;
    Exit;
  end;

  Result := UNIVERSAL_EXCLUDED_FIELDS.IndexOf(fieldName) > -1;
  if Result then Exit;

  if (recordType = 'PERK') and (fieldName = 'PRKF - End Marker') then
    Result := True;
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
  if s = '' then begin
    Result := '';
    Exit;
  end;

  Result := '';
  for i := 1 to Length(s) do
  begin
    c := s[i];
    case Ord(c) of
      34: Result := Result + '\"'; // "
      92: Result := Result + '\\'; // \
      47: Result := Result + '\/';  // /
      8: Result := Result + '\b';   // backspace
      9: Result := Result + '\t';   // tab
      10: Result := Result + '\n';  // newline
      12: Result := Result + '\f';  // form feed
      13: Result := Result + '\r';  // carriage return
    else
      if (Ord(c) < 32) or (Ord(c) > 127) then
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
  needsComma: boolean;
begin
  if not Assigned(e) then begin
    AddMessage('Warning: Nil element passed to DumpElement');
    Exit;
  end;

  indentStr := StringOfChar(' ', indent * 2);
  count := ElementCount(e);
  if count > 0 then begin
    sl.Add(indentStr + '{');
    i := 0;
    needsComma := false;
    while i < count do begin
      child := ElementByIndex(e, i);
      if not Assigned(child) then begin
        Inc(i);
        Continue;
      end;

      elemName := Name(child);
      if elemName = '' then elemName := '[' + IntToStr(i) + ']';

      if IsExcludedField(elemName, currentRecordType) then begin
        Inc(i);
        Continue;
      end;

      if needsComma then
        sl[sl.Count - 1] := sl[sl.Count - 1] + ',';
      needsComma := true;

      isArray := false;
      if i + 1 < count then begin
        nextChild := ElementByIndex(e, i + 1);
        if Assigned(nextChild) then begin
          nextName := Name(nextChild);
          if nextName = elemName then
            isArray := true;
        end;
      end;

      if isArray then begin
        sl.Add(indentStr + '  "' + EscapeString(elemName) + '": [');
        while (i < count) and (Name(ElementByIndex(e, i)) = elemName) do begin
          child := ElementByIndex(e, i);
          if not Assigned(child) then begin
            Inc(i);
            Continue;
          end;

          if ElementCount(child) > 0 then begin
            DumpElement(child, indent + 2, sl);
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
        if not Assigned(child) then begin
          Inc(i);
          Continue;
        end;

        if ElementCount(child) > 0 then begin
          if (Name(child) = 'Headers') and (ElementCount(child) = 0) then begin
            Inc(i);
            Continue;
          end;
          sl.Add(indentStr + '  "' + EscapeString(elemName) + '": ');
          DumpElement(child, indent + 1, sl);
        end else begin
          if (elemName = 'FormID') then
            elemValue := Signature(e) + ':' + IntToHex(FixedFormID(e), 8)
          else if (elemName = 'EDID - Editor ID') then
            elemValue := editorID
          else
            elemValue := GetEditValue(child);

          if not IsNullOrEmpty(elemValue) then
            sl.Add(indentStr + '  "' + EscapeString(elemName) + '": "' + EscapeString(elemValue) + '"');
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

function Initialize: integer;
begin
  AddMessage('Starting record export...');
  
  exportFolder := ProgramPath + 'Edit Scripts\codex-exports\\';
  if not ForceDirectories(exportFolder) then begin
    AddMessage('Error: Could not create export directory');
    Result := 1;
    Exit;
  end;

  outputMap := TStringList.Create;
  countMap := TStringList.Create;
  typeList := TStringList.Create;
  recordCounts := TStringList.Create;
  UNIVERSAL_EXCLUDED_FIELDS := TStringList.Create;
  
  UNIVERSAL_EXCLUDED_FIELDS.Add('Data Size');
  UNIVERSAL_EXCLUDED_FIELDS.Add('Version Control Info 1');
  UNIVERSAL_EXCLUDED_FIELDS.Add('Version Control Info 2');
  UNIVERSAL_EXCLUDED_FIELDS.Add('Form Version');
  
  AddMessage('Initialization complete');
  Result := 0;
end;

function Process(e: IInterface): integer;
var
  sl, temp: TStringList;
  recordType, fixedID, fullID, pluginName: string;
  currentCount, newCount: integer;
begin
  if not Assigned(e) then begin
    AddMessage('Warning: Nil record in Process');
    Result := 1;
    Exit;
  end;

  recordType := Signature(e);
  if recordType = '' then begin
    AddMessage('Warning: Empty record type in Process');
    Result := 1;
    Exit;
  end;

  currentRecordType := recordType;
  editorID := GetEditValue(ElementBySignature(e, 'EDID'));
  
  fixedID := IntToHex(FixedFormID(e), 8);
  fullID := IntToHex(GetLoadOrderFormID(e), 8);
  pluginName := GetFileName(GetFile(e));

  if outputMap.IndexOf(recordType) = -1 then begin
    sl := TStringList.Create;
    sl.Add('[');
    outputMap.AddObject(recordType, sl);
    countMap.Values[recordType] := '0';
    typeList.Add(recordType);
    recordCounts.Values[recordType] := '0';
  end else
    sl := TStringList(outputMap.Objects[outputMap.IndexOf(recordType)]);

  temp := TStringList.Create;
  try
    if StrToInt(recordCounts.Values[recordType]) > 0 then
      temp.Add(',');
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
    
    sl.AddStrings(temp);
  finally
    temp.Free;
  end;

  newCount := StrToInt(countMap.Values[recordType]) + 1;
  countMap.Values[recordType] := IntToStr(newCount);
  recordCounts.Values[recordType] := IntToStr(StrToInt(recordCounts.Values[recordType]) + 1);

  Result := 0;
end;

function Finalize: integer;
var
  i: integer;
  sl, manifest: TStringList;
  recordType, filePath: string;
  manifestPath: string;
begin
  AddMessage('Finalizing export...');
  
  manifest := TStringList.Create;
  try
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
  finally
    manifest.Free;
  end;

  outputMap.Free;
  countMap.Free;
  typeList.Free;
  recordCounts.Free;
  UNIVERSAL_EXCLUDED_FIELDS.Free;
  
  AddMessage('Export complete');
  Result := 0;
end;

end.
