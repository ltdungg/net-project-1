$ErrorActionPreference = "Stop"

$workspace = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$docxPath = Join-Path $workspace "deliverables\Bao-cao-tong-hop-du-an-cua-hang-thoi-trang-truc-tuyen.docx"
$qaDir = Join-Path $workspace "artifacts\qa"
$pdfPath = Join-Path $qaDir "Bao-cao-tong-hop-du-an-cua-hang-thoi-trang-truc-tuyen.pdf"

New-Item -ItemType Directory -Path $qaDir -Force | Out-Null

$word = $null
$document = $null
try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0
    $document = $word.Documents.Open($docxPath)

    foreach ($toc in $document.TablesOfContents) {
        $toc.Update()
    }
    $document.Fields.Update() | Out-Null
    $document.Repaginate()
    $document.Save()
    $document.ExportAsFixedFormat($pdfPath, 17)
}
finally {
    if ($null -ne $document) {
        $document.Close($false)
    }
    if ($null -ne $word) {
        $word.Quit()
    }
}

Write-Output "Da cap nhat muc luc va xuat PDF kiem tra."
