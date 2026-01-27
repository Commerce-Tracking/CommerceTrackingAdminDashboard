const fs = require('fs');
const path = require('path');

// Fichiers contexte à nettoyer complètement
const contextFiles = [
    'src/context/MonthlyCollectionsContext.tsx',
    'src/context/AcceptedBySupervisorContext.tsx',
    'src/context/PendingCollectionsContext.tsx',
    'src/context/RejectedByLevelContext.tsx',
    'src/context/TotalCollectionsContext.tsx',
    'src/context/ValidationStatsContext.tsx'
];

function cleanFile(filePath) {
    try {
        const fullPath = path.join(__dirname, filePath);
        const content = fs.readFileSync(fullPath, 'utf8');
        const lines = content.split('\n');

        const newLines = [];
        let removedCount = 0;
        let inMultiLineLog = false;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // Détecter le début d'un console.log/error/warn
            if (trimmed.startsWith('console.log(') ||
                trimmed.startsWith('console.error(') ||
                trimmed.startsWith('console.warn(')) {

                // Vérifier si c'est une ligne complète ou multi-ligne
                if (!trimmed.endsWith(');')) {
                    inMultiLineLog = true;
                }
                removedCount++;
                continue;
            }

            // Si on est dans un log multi-ligne, continuer à ignorer jusqu'à la fin
            if (inMultiLineLog) {
                if (trimmed.endsWith(');')) {
                    inMultiLineLog = false;
                }
                continue;
            }

            newLines.push(line);
        }

        if (removedCount > 0) {
            fs.writeFileSync(fullPath, newLines.join('\n'), 'utf8');
            console.log(`✓ ${path.basename(filePath)}: ${removedCount} logs supprimés`);
            return removedCount;
        }

        return 0;
    } catch (error) {
        console.error(`✗ Erreur avec ${filePath}:`, error.message);
        return 0;
    }
}

let totalRemoved = 0;
let filesProcessed = 0;

console.log('🧹 Nettoyage complet des fichiers contexte...\n');

for (const file of contextFiles) {
    const count = cleanFile(file);
    if (count > 0) {
        filesProcessed++;
        totalRemoved += count;
    }
}

console.log(`\n✅ Terminé!`);
console.log(`   Fichiers modifiés: ${filesProcessed}`);
console.log(`   Logs supprimés: ${totalRemoved}`);
