// commands/cat.js
export async function execute(args, currentDirHandle) {
    if (!currentDirHandle) return 'No directory selected. Use `cd` to select a directory.';
    if (args.length === 0) return 'Usage: cat <filename>';

    const fileName = args[0];
    try {
        const fileHandle = await currentDirHandle.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        return await file.text();
    } catch (err) {
        return `Error: ${err.message}`;
    }
}
