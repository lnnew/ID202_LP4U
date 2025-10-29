# Remove unused samples to speed up loading
# Keeps only notes used in C Major scale for each octave range
# Bass: C1-E2, Piano: C4-E5, Violin: C5-E6

$instruments = @{
    "bass-electric" = @("C1", "D1", "E1", "F1", "G1", "A1", "B1", "C2", "D2", "E2")
    "piano" = @("C4", "D4", "E4", "F4", "G4", "A4", "B4", "C5", "D5", "E5")
    "violin" = @("C5", "D5", "E5", "F5", "G5", "A5", "B5", "C6", "D6", "E6")
}

foreach ($inst in $instruments.Keys) {
    $instPath = Join-Path "samples" $inst
    if (-Not (Test-Path $instPath)) {
        Write-Warning "Instrument folder not found: $inst"
        continue
    }
    
    $keepNotes = $instruments[$inst]
    Write-Host "Processing $inst - keeping only: $($keepNotes -join ', ')"
    
    # Get all files in instrument folder
    $allFiles = Get-ChildItem -Path $instPath -File
    $removedCount = 0
    
    foreach ($file in $allFiles) {
        $baseName = [System.IO.Path]::GetFileNameWithoutExtension($file.Name)
        
        # Check if this note should be kept
        $shouldKeep = $false
        foreach ($note in $keepNotes) {
            if ($baseName -eq $note) {
                $shouldKeep = $true
                break
            }
        }
        
        if (-Not $shouldKeep) {
            Remove-Item -Path $file.FullName -Force
            $removedCount++
        }
    }
    
    Write-Host "  Removed $removedCount unused sample files from $inst"
    $remaining = (Get-ChildItem -Path $instPath -File).Count
    Write-Host "  Remaining files: $remaining"
}

Write-Host "`nDone! Unused samples removed. This should significantly speed up loading."
