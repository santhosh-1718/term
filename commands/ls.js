// commands/ls.js
export async function execute(args, currentDirHandle) {
    if (!currentDirHandle) return 'No directory selected. Use `cd` to select a directory.';
    const files = [];
    for await (const entry of currentDirHandle.values()) {
        files.push(entry.name);
    }
    return files.join('\n');
}

