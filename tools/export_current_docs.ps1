$ErrorActionPreference = "Stop"

$workspace = (Resolve-Path (Join-Path $PSScriptRoot "..")).Path
$documents = @(
    @{ Name = "Bao-cao-do-an-website-ban-quan-ao-truc-tuyen"; Qa = "current-main" },
    @{ Name = "Tai-lieu-yeu-cau-chuc-nang-va-phi-chuc-nang-NET"; Qa = "current-requirements" },
    @{ Name = "Bao-cao-tong-hop-du-an-cua-hang-thoi-trang-truc-tuyen"; Qa = "current-summary" }
)

$word = $null
try {
    $word = New-Object -ComObject Word.Application
    $word.Visible = $false
    $word.DisplayAlerts = 0
    foreach ($item in $documents) {
        $docxPath = Join-Path $workspace ("deliverables\" + $item.Name + ".docx")
        $qaDir = Join-Path $workspace ("artifacts\qa\" + $item.Qa)
        $pdfPath = Join-Path $qaDir ($item.Name + ".pdf")
        New-Item -ItemType Directory -Path $qaDir -Force | Out-Null
        $document = $null
        try {
            $document = $word.Documents.Open($docxPath)
            foreach ($toc in $document.TablesOfContents) {
                $toc.Update()
            }
            $document.Fields.Update() | Out-Null
            $document.Repaginate()
            $document.Save()
            $document.ExportAsFixedFormat($pdfPath, 17)
            Write-Output ($item.Name + ".pdf")
        }
        finally {
            if ($null -ne $document) {
                $document.Close($false)
            }
        }
    }
}
finally {
    if ($null -ne $word) {
        $word.Quit()
    }
}
