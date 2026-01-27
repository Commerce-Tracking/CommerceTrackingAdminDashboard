const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, 'src');

function cleanFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');

        const newLines = [];
        let removedCount = 0;
        let inMultiLineLog = false;
        let bracketCount = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i];
            const trimmed = line.trim();

            // Détecter le début d'un console.log/error/warn
            if (trimmed.startsWith('console.log(') ||
                trimmed.startsWith('console.error(') ||
                trimmed.startsWith('console.warn(')) {

                // Compter les parenthèses pour détecter les logs multi-lignes
                const openCount = (line.match(/\(/g) || []).length;
                const closeCount = (line.match(/\)/g) || []).length;
                bracketCount = openCount - closeCount;

                if (bracketCount > 0) {
                    inMultiLineLog = true;
                }
                removedCount++;
                continue;
            }

            // Si on est dans un log multi-ligne
            if (inMultiLineLog) {
                const openCount = (line.match(/\(/g) || []).length;
                const closeCount = (line.match(/\)/g) || []).length;
                bracketCount += openCount - closeCount;

                if (bracketCount <= 0) {
                    inMultiLineLog = false;
                    bracketCount = 0;
                }
                continue;
            }

            newLines.push(line);
        }

        if (removedCount > 0) {
            fs.writeFileSync(filePath, newLines.join('\n'), 'utf8');
            console.log(`✓ ${path.basename(filePath)}: ${removedCount} logs supprimés`);
            return removedCount;
        }

        return 0;
    } catch (error) {
        console.error(`✗ Erreur avec ${filePath}:`, error.message);
        return 0;
    }
}

function walkDir(dir) {
    let totalRemoved = 0;
    let filesProcessed = 0;

    function walk(currentPath) {
        const files = fs.readdirSync(currentPath);

        for (const file of files) {
            const filePath = path.join(currentPath, file);
            const stat = fs.statSync(filePath);

            if (stat.isDirectory()) {
                walk(filePath);
            } else if (file.endsWith('.tsx') || file.endsWith('.ts')) {
                const count = cleanFile(filePath);
                if (count > 0) {
                    filesProcessed++;
                    totalRemoved += count;
                }
            }
        }
    }

    walk(dir);

    console.log(`\n✅ Nettoyage complet terminé!`);
    console.log(`   Fichiers modifiés: ${filesProcessed}`);
    console.log(`   Logs supprimés: ${totalRemoved}`);
}

console.log('🧹 Nettoyage COMPLET de tous les console.log restants...\n');
walkDir(rootDir);
