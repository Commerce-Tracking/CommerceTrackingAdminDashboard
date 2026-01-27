# Script PowerShell pour commenter tous les console.log au lieu de les supprimer
# Cela évite les erreurs de syntaxe

$files = @(
    "src\context\MonthlyCollectionsContext.tsx",
    "src\context\AcceptedBySupervisorContext.tsx",
    "src\context\PendingCollectionsContext.tsx",
    "src\context\RejectedByLevelContext.tsx",
    "src\context\TotalCollectionsContext.tsx",
    "src\context\ValidationStatsContext.tsx",
    "src\providers\complaints\ComplaintProvider.tsx",
    "src\pages\organizations\OrganizationsListPage.tsx"
)

foreach ($file in $files) {
    if (Test-Path $file) {
        Write-Host "Traitement de $file..." -ForegroundColor Cyan
        
        $content = Get-Content $file -Raw
        
        # Commenter les console.log multi-lignes
        $content = $content -replace '(\s*)console\.log\(', '$1// console.log('
        $content = $content -replace '(\s*)console\.error\(', '$1// console.error('
        $content = $content -replace '(\s*)console\.warn\(', '$1// console.warn('
        
        $content | Set-Content $file -Encoding UTF8 -NoNewline
        
        Write-Host "  ✓ Logs commentés" -ForegroundColor Green
    }
}

Write-Host "`n✅ Tous les logs ont été commentés!" -ForegroundColor Green
