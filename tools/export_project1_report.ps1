param([switch]$Synthetic)
$ErrorActionPreference = 'Stop'
$taskRoot = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
$taskStem = if ($Synthetic) { 'Project-1-Bao-cao-khao-sat-GIA-LAP-NET' } else { 'Project-1-Bao-cao-khao-sat-va-mo-hinh-he-thong-NET' }
$docxPath = Join-Path $taskRoot "deliverables\$taskStem.docx"
$qaDir = Join-Path $taskRoot $(if ($Synthetic) { 'artifacts\qa\project1-synthetic-report' } else { 'artifacts\qa\project1-report' })
New-Item -ItemType Directory -Path $qaDir -Force | Out-Null
$word = $null
$document = $null
try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0
    $document = $word.Documents.Open($docxPath)
    foreach ($toc in $document.TablesOfContents) { $toc.Update() }
    $document.Fields.Update() | Out-Null
    if ($Synthetic) {
        foreach ($toc in $document.TablesOfContents) {
            $toc.Range.Font.Size = 10
            $toc.Range.ParagraphFormat.SpaceBefore = 0
            $toc.Range.ParagraphFormat.SpaceAfter = 2
            $toc.Range.ParagraphFormat.LineSpacingRule = 0
        }
    }
    $document.Repaginate()
    foreach ($toc in $document.TablesOfContents) { $toc.UpdatePageNumbers() }
    $document.Save()
    $pdfPath = Join-Path $qaDir "$taskStem.pdf"
    $document.ExportAsFixedFormat($pdfPath, 17)
    Write-Output $pdfPath
}
finally {
    if ($null -ne $document) { $document.Close($false) }
    if ($null -ne $word) { $word.Quit() }
}
