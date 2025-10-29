# Download selected instrument samples from the tonejs-instruments repo
# Usage: run this script in PowerShell from the project root
# It will clone the repo shallowly, copy needed samples and delete the clone.

$repo = "https://github.com/nbrosowsky/tonejs-instruments.git"
$tmp = "tmp_instruments"

# Instruments to copy
$instruments = @("bass-electric","piano","violin")

Write-Host "Cloning repository (shallow)..."
git clone --depth 1 $repo $tmp

if (-Not (Test-Path $tmp)) {
    Write-Error "Clone failed. Make sure git is installed and network is available."
    exit 1
}

# Ensure samples folder exists
if (-Not (Test-Path "samples")) { New-Item -ItemType Directory -Path "samples" | Out-Null }

foreach ($inst in $instruments) {
    $src = Join-Path -Path $tmp -ChildPath (Join-Path "samples" $inst)
    $dst = Join-Path -Path (Join-Path (Get-Location) "samples") -ChildPath $inst
    if (Test-Path $src) {
        Write-Host "Copying $inst samples..."
        if (Test-Path $dst) { Remove-Item -Recurse -Force $dst }
        Copy-Item -Recurse -Force $src $dst
    } else {
        Write-Warning "Instrument folder not found in repo: $inst"
    }
}

# cleanup
Write-Host "Removing temporary clone..."
Remove-Item -Recurse -Force $tmp

Write-Host "Done. Samples are in ./samples/"
