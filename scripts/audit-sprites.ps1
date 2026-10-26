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
  $frames = [ordered]@{}
  for ($row = 0; $row -lt 4; $row++) {
    $rowFrames = @()
    for ($column = 0; $column -lt 8; $column++) {
      $left = [int][Math]::Round($column * $bitmap.Width / 8)
      $right = [int][Math]::Round(($column + 1) * $bitmap.Width / 8)
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
