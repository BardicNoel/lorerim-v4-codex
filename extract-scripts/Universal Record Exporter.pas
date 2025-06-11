// Pascal script for xEdit (Universal Record Exporter with Nested Field Support - grouped by type + manifest to subfolder)

unit UserScript;

var
  currentRecordType: string;
  outputMap, countMap, typeList: TStringList;
  exportFolder: string;

function BoolToStr(value: boolean): string;
begin
  if value then
    Result := 'true'
  else
    Result := 'false';
end;

function EscapeString(const s: string): string;
begin
  Result := StringReplace(s, '"', '"', [rfReplaceAll]);
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
          end else begin
            elemValue := GetEditValue(child);
            sl.Add(indentStr + '    "' + EscapeString(elemValue) + '"');
          end;
          Inc(i);
          if (i < count) and (Name(ElementByIndex(e, i)) = elemName) then
            sl[sl.Count - 1] := sl[sl.Count - 1] + ',';
        end;
        sl.Add(indentStr + '  ]');
      end else begin
        child := ElementByIndex(e, i);
        if ElementCount(child) > 0 then begin
          sl.Add(indentStr + '  "' + EscapeString(elemName) + '": ');
          DumpElement(child, indent + 1, sl);
        end else begin
          elemValue := GetEditValue(child);
          sl.Add(indentStr + '  "' + EscapeString(elemName) + '": "' + EscapeString(elemValue) + '"');
        end;
        Inc(i);
        if i < count then
          sl[sl.Count - 1] := sl[sl.Count - 1] + ',';
      end;
    end;
    sl.Add(indentStr + '}');
  end else begin
    elemValue := GetEditValue(e);
    sl.Add(indentStr + '"' + EscapeString(elemValue) + '"');
  end;
end;

function Process(e: IInterface): integer;
var
  sl: TStringList;
  recordType, editorID: string;
  i, newCount: integer;
  temp: TStringList;
begin
  recordType := Signature(e);
  editorID := GetEditValue(ElementBySignature(e, 'EDID'));
  if recordType = '' then Exit;

  if outputMap.IndexOf(recordType) = -1 then
  begin
    sl := TStringList.Create;
    sl.Add('[');
    outputMap.AddObject(recordType, sl);
    countMap.Values[recordType] := '0';
    typeList.Add(recordType);
  end
  else
    sl := TStringList(outputMap.Objects[outputMap.IndexOf(recordType)]);

  temp := TStringList.Create;
  temp.Add('  {');
  temp.Add('    "plugin": "' + EscapeString(GetFileName(GetFile(e))) + '",');
  temp.Add('    "load_order": "' + IntToHex(GetLoadOrderFormID(e) shr 24, 2) + '",');
  temp.Add('    "form_id": "' + IntToHex(FixedFormID(e), 8) + '",');
  temp.Add('    "record_type": "' + EscapeString(recordType) + '",');
  temp.Add('    "editor_id": "' + EscapeString(editorID) + '",');
  temp.Add('    "winning": ' + BoolToStr(IsWinningOverride(e)) + ',');
  temp.Add('    "data": ');
  DumpElement(e, 3, temp);
  temp.Add('  },');
  sl.AddStrings(temp);
  temp.Free;

  newCount := StrToInt(countMap.Values[recordType]) + 1;
  countMap.Values[recordType] := IntToStr(newCount);

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
    if sl.Count > 1 then
      sl[sl.Count - 1] := '  }';
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
  Result := 0;
end;

function Initialize: integer;
begin
  exportFolder := ProgramPath + 'Edit Scripts\codex-exports\\';
  ForceDirectories(exportFolder);
  outputMap := TStringList.Create;
  countMap := TStringList.Create;
  typeList := TStringList.Create;
  Result := 0;
end;

end.
