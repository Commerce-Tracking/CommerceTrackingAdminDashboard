const fs = require('fs');
const path = require('path');

const rootDir = path.join(__dirname, 'src');

// Patterns de logs à supprimer (logs qui affichent des données API complètes)
const patternsToRemove = [
    /^\s*console\.log\([^)]*(?:response\.data|res\.data|apiResponse|result\.data|err\.response\?\.data)[^)]*\);\s*$/,
    /^\s*console\.error\([^)]*(?:response\.data|res\.data|apiResponse|result\.data|err\.response\?\.data)[^)]*\);\s*$/,
    /^\s*console\.warn\([^)]*(?:response\.data|res\.data|apiResponse|result\.data|err\.response\?\.data)[^)]*\);\s*$/,
];

function shouldRemoveLine(line) {
    return patternsToRemove.some(pattern => pattern.test(line));
}

function cleanFile(filePath) {
    try {
        const content = fs.readFileSync(filePath, 'utf8');
        const lines = content.split('\n');

        const newLines = [];
        let removedCount = 0;

        for (const line of lines) {
            if (shouldRemoveLine(line)) {
                removedCount++;
            } else {
                newLines.push(line);
            }
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

    console.log(`\n✅ Terminé!`);
    console.log(`   Fichiers modifiés: ${filesProcessed}`);
    console.log(`   Logs supprimés: ${totalRemoved}`);
}

walkDir(rootDir);
