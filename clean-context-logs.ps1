# Script PowerShell pour supprimer tous les console.log de debug dans les fichiers Context
# Ce script supprime les lignes contenant console.log, console.error et console.warn

$contextFiles = @(
    "c:\Users\adodo\Downloads\CommerceTrackingAdminDashboard\src\context\MonthlyCollectionsContext.tsx",
    "c:\Users\adodo\Downloads\CommerceTrackingAdminDashboard\src\context\AcceptedBySupervisorContext.tsx",
    "c:\Users\adodo\Downloads\CommerceTrackingAdminDashboard\src\context\PendingCollectionsContext.tsx",
    "c:\Users\adodo\Downloads\CommerceTrackingAdminDashboard\src\context\RejectedByLevelContext.tsx",
    "c:\Users\adodo\Downloads\CommerceTrackingAdminDashboard\src\context\TotalCollectionsContext.tsx",
    "c:\Users\adodo\Downloads\CommerceTrackingAdminDashboard\src\context\ValidationStatsContext.tsx"
)

foreach ($file in $contextFiles) {
    if (Test-Path $file) {
        Write-Host "Traitement de $file..." -ForegroundColor Cyan
        
        # Lire le contenu du fichier
        $content = Get-Content $file -Raw
        
        # Compter les logs avant suppression
        $beforeCount = ([regex]::Matches($content, "console\.(log|error|warn)")).Count
        
        # Supprimer toutes les lignes contenant console.log, console.error, console.warn
        $lines = Get-Content $file
        $newLines = $lines | Where-Object { 
            $_ -notmatch '^\s*console\.(log|error|warn)\(' 
        }
        
        # Écrire le nouveau contenu
        $newLines | Set-Content $file -Encoding UTF8
        
        # Compter les logs après suppression
        $afterContent = Get-Content $file -Raw
        $afterCount = ([regex]::Matches($afterContent, "console\.(log|error|warn)")).Count
        
        $removed = $beforeCount - $afterCount
        Write-Host "  ✓ $removed logs supprimés" -ForegroundColor Green
    } else {
        Write-Host "  ✗ Fichier non trouvé: $file" -ForegroundColor Red
    }
}

Write-Host "`n✅ Nettoyage terminé!" -ForegroundColor Green
