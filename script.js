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

// Function to select a directory
async function selectDirectory() {
    try {
        currentDirHandle = await window.showDirectoryPicker();
        previousDirHandles = []; // Reset back history
        refreshFileManager();
    } catch (err) {
        alert(`Error: ${err.message}`);
    }
}

// Function to get file type icon
function getFileIcon(name, kind) {
    if (kind === 'directory') return '📁';
    const ext = name.split('.').pop().toLowerCase();
    const icons = {
        'txt': '📝', 'md': '📖', 'html': '🌐', 'css': '🎨', 'js': '📜',
        'py': '🐍', 'json': '🔢', 'jpg': '🖼️', 'png': '🖼️', 'gif': '🎞️',
        'zip': '📦', 'rar': '📦', 'tar': '📦', 'mp4': '🎥', 'mp3': '🎵'
    };
    return icons[ext] || '📄';
}

// Function to refresh file manager
async function refreshFileManager() {
    const fileManagerContent = document.getElementById('file-manager-content');
    const currentDirDisplay = document.getElementById('current-directory');
    fileManagerContent.innerHTML = '';

    if (!currentDirHandle) {
        fileManagerContent.textContent = 'No directory selected. Click "Select Directory" to choose a folder.';
        return;
    }

    // Update current directory display
    currentDirDisplay.textContent = `Current Directory: ${currentDirHandle.name}`;

    let folders = [];
    let files = [];
    let hiddenFiles = [];

    for await (const entry of currentDirHandle.values()) {
        if (entry.kind === 'directory') {
            folders.push(entry);
        } else if (entry.name.startsWith('.')) {
            hiddenFiles.push(entry);
        } else {
            files.push(entry);
        }
    }

    // Sort alphabetically
    folders.sort((a, b) => a.name.localeCompare(b.name));
    files.sort((a, b) => a.name.localeCompare(b.name));
    hiddenFiles.sort((a, b) => a.name.localeCompare(b.name));

    const sortedEntries = [...folders, ...files, ...hiddenFiles];

    sortedEntries.forEach(entry => {
        const item = document.createElement('div');
        item.className = 'file-manager-item';
        item.innerHTML = `<span class='file-icon' style='font-size: 25px; margin-right: 25px;'>${getFileIcon(entry.name, entry.kind)}</span> ${entry.name}`;
        
        if (entry.kind === 'directory') {
            item.addEventListener('dblclick', async () => {
                previousDirHandles.push(currentDirHandle);
                currentDirHandle = await currentDirHandle.getDirectoryHandle(entry.name);
                refreshFileManager();
            });
        }
        fileManagerContent.appendChild(item);
    });
}

// Function to go back in directory
async function goBack() {
    if (previousDirHandles.length > 0) {
        currentDirHandle = previousDirHandles.pop();
        refreshFileManager();
    } else {
        alert('Already at the root directory.');
    } 
}

// Add event listeners
document.getElementById('input').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        const command = this.value.trim();
        handleCommand(command);
    }
});

document.getElementById('select-directory').addEventListener('click', selectDirectory);

document.getElementById('back-button').addEventListener('click', goBack);

document.getElementById('refresh-file-manager').addEventListener('click', refreshFileManager);
