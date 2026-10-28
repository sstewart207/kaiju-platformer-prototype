param(
  [string]$ImagePath = 'public/assets/solargon-atlas-v2.png',
  [string]$OutputPath = 'art/solargon-atlas-v2.audit.json'
)
Add-Type -AssemblyName System.Drawing
$bitmap = [Drawing.Bitmap]::new((Join-Path (Get-Location) $ImagePath))
try {
  # Authored row boundaries include the original generator's uneven vertical gutters.
  $rowEdges = @(0, [int]($bitmap.Height * 240 / 887), [int]($bitmap.Height * 463 / 887), [int]($bitmap.Height * 663 / 887), $bitmap.Height)
  $directions = @('right','left','front','back')
  # Each generated row has different horizontal spacing. Cuts sit in the gaps
  # between complete silhouettes, not at nominal eighths of the image width.
  $columnEdges = @(
    @(0,231,448,669,884,1114,1338,1546,1774),
    @(0,247,470,696,919,1142,1358,1564,1774),
    @(0,229,443,669,893,1107,1329,1552,1774),
    @(0,234,455,675,899,1122,1346,1556,1774)
  )
  $frames = [ordered]@{}
  for ($row = 0; $row -lt 4; $row++) {
    $rowFrames = @()
    for ($column = 0; $column -lt 8; $column++) {
      $left = [int][Math]::Round($columnEdges[$row][$column] * $bitmap.Width / 1774)
      $right = [int][Math]::Round($columnEdges[$row][$column+1] * $bitmap.Width / 1774)
      $top = $rowEdges[$row]; $bottom = $rowEdges[$row+1]
      $opaqueBottom = $top; $minX = $right; $maxX = $left
      for ($y = $top; $y -lt $bottom; $y++) {
        for ($x = $left; $x -lt $right; $x++) {
          if ($bitmap.GetPixel($x,$y).A -ge 180) {
            $opaqueBottom = [Math]::Max($opaqueBottom,$y)
            $minX = [Math]::Min($minX,$x); $maxX = [Math]::Max($maxX,$x)
          }
        }
      }
      $rowFrames += [ordered]@{x=$left;y=$top;width=($right-$left);height=($bottom-$top);groundX=0.5;groundY=[Math]::Round(($bottom-$opaqueBottom-1)/($bottom-$top),5);touchesSide=($minX -eq $left -or $maxX -eq ($right-1))}
    }
    $frames[$directions[$row]] = $rowFrames
  }
  $report = [ordered]@{image=$ImagePath;width=$bitmap.Width;height=$bitmap.Height;frames=$frames}
  $report | ConvertTo-Json -Depth 8 | Set-Content -LiteralPath $OutputPath
  Write-Output "Audited $($bitmap.Width) x $($bitmap.Height), 32 frames. Metadata: $OutputPath"
} finally { $bitmap.Dispose() }
