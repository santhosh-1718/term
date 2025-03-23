let currentDirHandle;
let currentDirPath = '~';
let previousDirHandles = []; // Stack to track previous directories

// Check if the browser supports the File System Access API
if (!('showDirectoryPicker' in window)) {
    document.getElementById('output').innerHTML = `
        <div style="color: red;">
            Error: Your browser does not support the File System Access API.
            Please use Google Chrome or Microsoft Edge to access this application.
        </div>
    `;
    document.getElementById('input').disabled = true;
    document.getElementById('select-directory').disabled = true;
    document.getElementById('refresh-file-manager').disabled = true;
    document.getElementById('back-button').disabled = true;
}

// Function to handle terminal commands
async function handleCommand(command) {
    const output = document.getElementById('output');
    const input = document.getElementById('input');

    if (command.trim() === '') return;

    // Display the command in the terminal
    output.innerHTML += `<div><span id="prompt">user@local:${currentDirPath}$</span> ${command}</div>`;

    if (command === 'clear') {
        output.innerHTML = '';
        input.value = '';
        return;
    }

    const args = command.split(' ');
    const cmd = args[0];

    let response = '';

    switch (cmd) {
        case 'ls':
            response = await listFiles(args.slice(1));
            break;
        case 'cd':
            response = await changeDirectory(args[1]);
            break;
        case 'cat':
            response = await readFile(args[1]);
            break;
        case 'nano':
            response = await openEditor(args[1]);
            break;
        case 'rm':
            response = await removeFile(args[1]);
            break;
        case 'mv':
            response = await moveFile(args[1], args[2]);
            break;
        case 'cp':
            response = await copyFile(args[1], args[2]);
            break;
        case 'mkdir':
            response = await createDirectory(args[1]);
            break;
        case 'rmdir':
            response = await removeDirectory(args[1]);
            break;
        case 'touch':
            response = await createFile(args[1]);
            break;
        case 'wget':
            response = await downloadFile(args[1]);
            break;
        case 'exiftool':
            response = await extractMetadata(args[1]);
            break;
        case 'strings':
            response = await extractStrings(args[1]);
            break;
        case 'nc':
            response = await handleNcCommand(args.slice(1));
            break;
        case 'ssh':
            response = await handleSshCommand(args.slice(1));
            break;
        default:
            response = `Command not found: ${cmd}`;
    }

    // Display the output
    output.innerHTML += `<div>${response}</div>`;

    // Clear the input and scroll to the bottom
    input.value = '';
    output.parentElement.scrollTop = output.parentElement.scrollHeight;
}

// Function to list files in the current directory
async function listFiles(args = []) {
    if (!currentDirHandle) return 'No directory selected. Use `cd` to select a directory.';

    const files = [];
    for await (const entry of currentDirHandle.values()) {
        files.push(entry);
    }

    let output = '';

    if (args.includes('-a') || args.includes('--all')) {
        output = files.map(entry => entry.name).join('\n');
    } else if (args.includes('-l')) {
        output = files.map(entry => {
            const type = entry.kind === 'directory' ? 'd' : '-';
            const permissions = 'rwxrwxrwx'; // Simplified permissions
            const size = entry.kind === 'file' ? entry.size : 0;
            const date = new Date(entry.lastModified).toLocaleString(); // File modification date
            return `${type}${permissions} 1 user user ${size} ${date} ${entry.name}`;
        }).join('\n');
    } else if (args.includes('-al') || args.includes('-la')) {
        output = files.map(entry => {
            const type = entry.kind === 'directory' ? 'd' : '-';
            const permissions = 'rwxrwxrwx'; // Simplified permissions
            const size = entry.kind === 'file' ? entry.size : 0;
            const date = new Date(entry.lastModified).toLocaleString(); // File modification date
            return `${type}${permissions} 1 user user ${size} ${date} ${entry.name}`;
        }).join('\n');
    } else {
        output = files.filter(entry => !entry.name.startsWith('.')).map(entry => entry.name).join('\n');
    }

    return output;
}

// Function to change directory
async function changeDirectory(dir) {
    if (!currentDirHandle) {
        try {
            currentDirHandle = await window.showDirectoryPicker();
            currentDirPath = currentDirHandle.name;
            refreshFileManager();
            return '';
        } catch (err) {
            return `Error: ${err.message}`;
        }
    }

    if (dir === '..') {
        if (previousDirHandles.length > 0) {
            currentDirHandle = previousDirHandles.pop();
            currentDirPath = currentDirHandle.name;
            refreshFileManager();
            return '';
        } else {
            return 'Already at the root directory.';
        }
    }

    try {
        previousDirHandles.push(currentDirHandle);
        const newDirHandle = await currentDirHandle.getDirectoryHandle(dir);
        currentDirHandle = newDirHandle;
        currentDirPath = dir;
        refreshFileManager();
        return '';
    } catch (err) {
        return `Error: ${err.message}`;
    }
}

// Function to read a file
async function readFile(fileName) {
    if (!currentDirHandle) return 'No directory selected. Use `cd` to select a directory.';
    try {
        const fileHandle = await currentDirHandle.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        return await file.text();
    } catch (err) {
        return `Error: ${err.message}`;
    }
}

// Function to extract metadata using exiftool-like functionality
async function extractMetadata(fileName) {
    if (!currentDirHandle) return 'No directory selected. Use `cd` to select a directory.';
    try {
        const fileHandle = await currentDirHandle.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        const arrayBuffer = await file.arrayBuffer();
        const uint8Array = new Uint8Array(arrayBuffer);

        // Parse PNG metadata
        if (file.type === 'image/png') {
            const metadata = parsePNGMetadata(uint8Array);
            return formatMetadataOutput(file, metadata);
        } else {
            return 'Metadata extraction is currently supported only for PNG files.';
        }
    } catch (err) {
        return `Error: ${err.message}`;
    }
}

// Function to parse PNG metadata
function parsePNGMetadata(uint8Array) {
    const metadata = {};

    // PNG signature (first 8 bytes)
    const pngSignature = [137, 80, 78, 71, 13, 10, 26, 10];
    for (let i = 0; i < 8; i++) {
        if (uint8Array[i] !== pngSignature[i]) {
            throw new Error('Invalid PNG file.');
        }
    }

    // Parse IHDR chunk (contains width, height, bit depth, etc.)
    const ihdrChunkOffset = 8;
    const chunkLength = (uint8Array[ihdrChunkOffset] << 24) | (uint8Array[ihdrChunkOffset + 1] << 16) | (uint8Array[ihdrChunkOffset + 2] << 8) | uint8Array[ihdrChunkOffset + 3];
    const chunkType = String.fromCharCode(...uint8Array.slice(ihdrChunkOffset + 4, ihdrChunkOffset + 8));

    if (chunkType !== 'IHDR') {
        throw new Error('IHDR chunk not found.');
    }

    // Extract width, height, bit depth, color type, compression, filter, and interlace
    metadata.width = (uint8Array[ihdrChunkOffset + 8] << 24) | (uint8Array[ihdrChunkOffset + 9] << 16) | (uint8Array[ihdrChunkOffset + 10] << 8) | uint8Array[ihdrChunkOffset + 11];
    metadata.height = (uint8Array[ihdrChunkOffset + 12] << 24) | (uint8Array[ihdrChunkOffset + 13] << 16) | (uint8Array[ihdrChunkOffset + 14] << 8) | uint8Array[ihdrChunkOffset + 15];
    metadata.bitDepth = uint8Array[ihdrChunkOffset + 16];
    metadata.colorType = uint8Array[ihdrChunkOffset + 17];
    metadata.compression = uint8Array[ihdrChunkOffset + 18];
    metadata.filter = uint8Array[ihdrChunkOffset + 19];
    metadata.interlace = uint8Array[ihdrChunkOffset + 20];

    return metadata;
}

// Function to format metadata output
function formatMetadataOutput(file, metadata) {
    return `
ExifTool Version Number         : 1.0
File Name                       : ${file.name}
Directory                       : .
File Size                       : ${file.size} bytes
File Modification Date/Time     : ${new Date(file.lastModified).toLocaleString()}
File Access Date/Time           : ${new Date().toLocaleString()}
File Inode Change Date/Time     : ${new Date().toLocaleString()}
File Permissions                : -rw-r--r--
File Type                       : PNG
File Type Extension             : png
MIME Type                       : ${file.type}
Image Width                     : ${metadata.width}
Image Height                    : ${metadata.height}
Bit Depth                       : ${metadata.bitDepth}
Color Type                      : ${metadata.colorType}
Compression                     : ${metadata.compression === 0 ? 'Deflate/Inflate' : 'Unknown'}
Filter                          : ${metadata.filter === 0 ? 'Adaptive' : 'Unknown'}
Interlace                       : ${metadata.interlace === 0 ? 'Noninterlaced' : 'Interlaced'}
Image Size                      : ${metadata.width}x${metadata.height}
Megapixels                      : ${(metadata.width * metadata.height / 1000000).toFixed(3)}
`;
}

// Function to extract strings from a file
async function extractStrings(fileName) {
    if (!currentDirHandle) return 'No directory selected. Use `cd` to select a directory.';
    try {
        const fileHandle = await currentDirHandle.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        const content = await file.text();
        const strings = content.match(/[^\x00-\x1F\x7F]+/g) || [];
        return strings.join('\n');
    } catch (err) {
        return `Error: ${err.message}`;
    }
}

// Function to refresh the file manager
async function refreshFileManager() {
    const fileManagerContent = document.getElementById('file-manager-content');
    fileManagerContent.innerHTML = '';

    if (!currentDirHandle) {
        fileManagerContent.textContent = 'No directory selected. Use `cd` to select a directory.';
        return;
    }

    // Display the current directory
    const currentDirElement = document.createElement('div');
    currentDirElement.textContent = `Current Directory: ${currentDirPath}`;
    currentDirElement.style.fontWeight = 'bold';
    fileManagerContent.appendChild(currentDirElement);

    // Display files and folders
    for await (const entry of currentDirHandle.values()) {
        const item = document.createElement('div');
        item.className = 'file-manager-item';

        const icon = document.createElement('i');
        icon.className = entry.kind === 'directory' ? 'fas fa-folder folder-icon' : 'fas fa-file file-icon';
        item.appendChild(icon);

        const name = document.createElement('span');
        name.textContent = entry.name;
        item.appendChild(name);

        // Add double-click event to open files and folders
        item.addEventListener('dblclick', async () => {
            if (entry.kind === 'directory') {
                previousDirHandles.push(currentDirHandle);
                currentDirHandle = await currentDirHandle.getDirectoryHandle(entry.name);
                currentDirPath = entry.name;
                refreshFileManager();
            } else {
                const fileHandle = await currentDirHandle.getFileHandle(entry.name);
                const file = await fileHandle.getFile();
                const content = await file.text();
                document.getElementById('editor-content').value = content;
                document.getElementById('editor').classList.remove('hidden');
            }
        });

        fileManagerContent.appendChild(item);
    }
}

// Add event listeners
document.getElementById('input').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        const command = this.value.trim();
        handleCommand(command);
    }
});

document.getElementById('select-directory').addEventListener('click', async () => {
    try {
        currentDirHandle = await window.showDirectoryPicker();
        currentDirPath = currentDirHandle.name;
        refreshFileManager();
    } catch (err) {
        alert(`Error: ${err.message}`);
    }
});

document.getElementById('back-button').addEventListener('click', async () => {
    if (previousDirHandles.length > 0) {
        currentDirHandle = previousDirHandles.pop();
        currentDirPath = currentDirHandle.name;
        refreshFileManager();
    } else {
        alert('Already at the root directory.');
    }
});

document.getElementById('refresh-file-manager').addEventListener('click', refreshFileManager);
