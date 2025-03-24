let currentDirHandle;
let currentDirPath = ['~'];
let previousDirHandles = [];
let previousDirPaths = [];

// Check for File System Access API support
if (!('showDirectoryPicker' in window)) {
    showError('Your browser does not support the File System Access API. Please use Chrome or Edge.');
    disableUI();
}

function disableUI() {
    document.getElementById('input').disabled = true;
    document.getElementById('select-directory').disabled = true;
    document.getElementById('refresh-file-manager').disabled = true;
    document.getElementById('back-button').disabled = true;
}

function showError(message) {
    const output = document.getElementById('output');
    output.innerHTML += `<div class="terminal-error">${message}</div>`;
    output.scrollTop = output.scrollHeight;
}

function showSuccess(message) {
    const output = document.getElementById('output');
    output.innerHTML += `<div class="terminal-success">${message}</div>`;
    output.scrollTop = output.scrollHeight;
}

// Terminal command handling
async function handleCommand(command) {
    const output = document.getElementById('output');
    const input = document.getElementById('input');

    if (command.trim() === '') return;

    // Display the command
    output.innerHTML += `<div><span class="terminal-command">user@local:${getCurrentPath()}$</span> ${command}</div>`;

    if (command === 'clear') {
        output.innerHTML = '';
        input.value = '';
        return;
    }

    const args = command.split(' ').filter(arg => arg !== '');
    const cmd = args[0];
    let response = '';

    try {
        switch (cmd) {
            case 'ls':
                response = await listFiles(args.slice(1));
                break;
            case 'cd':
                response = await changeDirectory(args[1]);
                if (response === '') refreshFileManager();
                break;
            case 'cat':
                response = await readFile(args[1]);
                break;
            case 'eog':
            case 'preview':
                response = await previewFile(args[1]);
                break;
            case 'pwd':
                response = getCurrentPath();
                break;
            case 'mkdir':
                response = await createDirectory(args[1]);
                refreshFileManager();
                break;
            case 'touch':
                response = await createFile(args[1]);
                refreshFileManager();
                break;
            case 'rm':
                response = await removeFile(args[1]);
                refreshFileManager();
                break;
            case 'mv':
                response = await moveFile(args[1], args[2]);
                refreshFileManager();
                break;
            case 'cp':
                response = await copyFile(args[1], args[2]);
                refreshFileManager();
                break;
            case 'help':
                response = getHelpText();
                break;
            default:
                response = `Command not found: ${cmd}`;
        }
    } catch (err) {
        response = `Error: ${err.message}`;
    }

    // Display the output
    output.innerHTML += `<div>${response}</div>`;
    input.value = '';
    output.scrollTop = output.scrollHeight;
}

function getHelpText() {
    return `Available commands:
ls [options]       - List directory contents
cd [directory]     - Change directory
cat [file]         - Display file contents
eog/preview [file] - Preview file (image, video, audio, text)
pwd                - Print working directory
mkdir [directory]  - Create directory
touch [file]       - Create file
rm [file]          - Remove file
mv [src] [dest]    - Move/rename file
cp [src] [dest]    - Copy file
clear              - Clear terminal
help               - Show this help`;
}

function getCurrentPath() {
    return currentDirPath.join('/');
}

// Enhanced ls command with Python-like functionality
async function listFiles(args = []) {
    if (!currentDirHandle) return 'No directory selected. Use `cd` to select a directory.';

    const files = [];
    const directories = [];
    
    for await (const entry of currentDirHandle.values()) {
        if (entry.kind === 'directory') {
            directories.push(entry);
        } else {
            files.push(entry);
        }
    }

    // Sort alphabetically
    directories.sort((a, b) => a.name.localeCompare(b.name));
    files.sort((a, b) => a.name.localeCompare(b.name));

    let output = '';
    const showAll = args.includes('-a') || args.includes('--all');
    const longFormat = args.includes('-l') || args.includes('-al') || args.includes('-la');
    const showAlmostAll = args.includes('-A');

    // Add . and .. if showing all (but not with --almost-all)
    if (showAll && !showAlmostAll) {
        directories.unshift({ kind: 'directory', name: '..' });
        directories.unshift({ kind: 'directory', name: '.' });
    }

    const allEntries = [...directories, ...files];

    if (longFormat) {
        output = allEntries
            .filter(entry => showAll || showAlmostAll || !entry.name.startsWith('.'))
            .map(entry => {
                const type = entry.kind === 'directory' ? 'd' : '-';
                const permissions = 'rwxrwxrwx'; // Simplified
                const size = entry.kind === 'file' ? entry.size : 4096;
                const date = entry.lastModified ? new Date(entry.lastModified).toLocaleString() : '';
                const name = entry.kind === 'directory' ? `${entry.name}/` : entry.name;
                return `${type}${permissions} 1 user user ${size} ${date} ${name}`;
            })
            .join('\n');
        
        // Add total blocks (simplified)
        if (allEntries.length > 0) {
            const totalBlocks = allEntries.reduce((sum, entry) => sum + (entry.kind === 'file' ? Math.ceil(entry.size / 512) : 8), 0);
            output = `total ${totalBlocks}\n${output}`;
        }
    } else {
        output = allEntries
            .filter(entry => showAll || showAlmostAll || !entry.name.startsWith('.'))
            .map(entry => entry.kind === 'directory' ? `${entry.name}/` : entry.name)
            .join('  ');
    }

    return output || ' '; // Return space if empty to maintain line
}

// Enhanced cd command
async function changeDirectory(dir) {
    if (!dir) {
        // No directory specified - try to open directory picker
        try {
            currentDirHandle = await window.showDirectoryPicker();
            currentDirPath = [currentDirHandle.name];
            updatePathDisplay();
            return '';
        } catch (err) {
            return `Error: ${err.message}`;
        }
    }

    if (!currentDirHandle) {
        return 'No directory selected. Use `cd` to select a directory.';
    }

    if (dir === '..') {
        if (previousDirHandles.length > 0) {
            currentDirHandle = previousDirHandles.pop();
            currentDirPath = previousDirPaths.pop();
            updatePathDisplay();
            return '';
        }
        return 'Already at root directory';
    }

    if (dir === '.' || dir === './') {
        return ''; // No change
    }

    if (dir === '~') {
        // Handle home directory - in this implementation, just go to root
        if (previousDirHandles.length > 0) {
            previousDirHandles.push(currentDirHandle);
            previousDirPaths.push([...currentDirPath]);
        }
        currentDirHandle = await window.showDirectoryPicker();
        currentDirPath = [currentDirHandle.name];
        updatePathDisplay();
        return '';
    }

    try {
        // Save current directory before changing
        previousDirHandles.push(currentDirHandle);
        previousDirPaths.push([...currentDirPath]);

        if (dir.startsWith('/')) {
            // Absolute path - not fully implemented in this browser-based version
            return 'Absolute paths not supported in this implementation';
        } else {
            // Relative path
            const newDirHandle = await currentDirHandle.getDirectoryHandle(dir);
            currentDirHandle = newDirHandle;
            currentDirPath.push(dir);
            updatePathDisplay();
            return '';
        }
    } catch (err) {
        // Restore previous directory if change failed
        if (previousDirHandles.length > 0) {
            currentDirHandle = previousDirHandles.pop();
            currentDirPath = previousDirPaths.pop();
        }
        return `cd: ${dir}: No such file or directory`;
    }
}

function updatePathDisplay() {
    document.getElementById('current-path').textContent = getCurrentPath();
    document.getElementById('prompt').textContent = `user@local:${getCurrentPath()}$`;
}

// File operations
async function readFile(fileName) {
    if (!currentDirHandle) return 'No directory selected.';
    try {
        const fileHandle = await currentDirHandle.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        return await file.text();
    } catch (err) {
        return `Error: ${err.message}`;
    }
}

async function createDirectory(dirName) {
    if (!currentDirHandle) return 'No directory selected.';
    try {
        await currentDirHandle.getDirectoryHandle(dirName, { create: true });
        return `Created directory '${dirName}'`;
    } catch (err) {
        return `Error: ${err.message}`;
    }
}

async function createFile(fileName) {
    if (!currentDirHandle) return 'No directory selected.';
    try {
        const fileHandle = await currentDirHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write('');
        await writable.close();
        return `Created file '${fileName}'`;
    } catch (err) {
        return `Error: ${err.message}`;
    }
}

async function removeFile(fileName) {
    if (!currentDirHandle) return 'No directory selected.';
    try {
        await currentDirHandle.removeEntry(fileName);
        return `Removed '${fileName}'`;
    } catch (err) {
        return `Error: ${err.message}`;
    }
}

async function moveFile(src, dest) {
    if (!currentDirHandle) return 'No directory selected.';
    try {
        // Simplified implementation - in real FS API this would be more complex
        const fileHandle = await currentDirHandle.getFileHandle(src);
        const file = await fileHandle.getFile();
        const content = await file.text();
        
        // Create new file
        const newFileHandle = await currentDirHandle.getFileHandle(dest, { create: true });
        const writable = await newFileHandle.createWritable();
        await writable.write(content);
        await writable.close();
        
        // Remove original
        await currentDirHandle.removeEntry(src);
        
        return `Moved '${src}' to '${dest}'`;
    } catch (err) {
        return `Error: ${err.message}`;
    }
}

async function copyFile(src, dest) {
    if (!currentDirHandle) return 'No directory selected.';
    try {
        const fileHandle = await currentDirHandle.getFileHandle(src);
        const file = await fileHandle.getFile();
        const content = await file.text();
        
        const newFileHandle = await currentDirHandle.getFileHandle(dest, { create: true });
        const writable = await newFileHandle.createWritable();
        await writable.write(content);
        await writable.close();
        
        return `Copied '${src}' to '${dest}'`;
    } catch (err) {
        return `Error: ${err.message}`;
    }
}

// Enhanced preview functionality
async function previewFile(fileName) {
    if (!currentDirHandle) return 'No directory selected.';
    
    try {
        const fileHandle = await currentDirHandle.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        const previewContainer = document.getElementById('preview-container');
        const previewContent = document.getElementById('preview-content');
        
        // Clear previous content
        previewContent.innerHTML = '';
        
        // Check file type and display appropriately
        if (file.type.startsWith('image/')) {
            const img = document.createElement('img');
            img.src = URL.createObjectURL(file);
            previewContent.appendChild(img);
        } else if (file.type.startsWith('video/')) {
            const video = document.createElement('video');
            video.src = URL.createObjectURL(file);
            video.controls = true;
            video.autoplay = true;
            previewContent.appendChild(video);
        } else if (file.type.startsWith('audio/')) {
            const audio = document.createElement('audio');
            audio.src = URL.createObjectURL(file);
            audio.controls = true;
            audio.autoplay = true;
            previewContent.appendChild(audio);
        } else if (file.type === 'text/plain' || file.size < 1024 * 1024) { // Preview text files or small files
            const text = document.createElement('pre');
            text.id = 'preview-text';
            text.textContent = await file.text();
            previewContent.appendChild(text);
        } else {
            previewContent.textContent = `Cannot preview ${file.type} files`;
        }
        
        previewContainer.style.display = 'block';
        return `Previewing ${fileName}`;
    } catch (err) {
        return `Error: ${err.message}`;
    }
}

// File manager functions
async function refreshFileManager() {
    const fileManagerContent = document.getElementById('file-manager-content');
    fileManagerContent.innerHTML = '';

    if (!currentDirHandle) {
        fileManagerContent.textContent = 'No directory selected.';
        return;
    }

    // Add parent directory link
    if (previousDirHandles.length > 0) {
        const parentItem = document.createElement('div');
        parentItem.className = 'file-manager-item';
        
        const parentIcon = document.createElement('i');
        parentIcon.className = 'fas fa-level-up-alt file-icon';
        parentItem.appendChild(parentIcon);
        
        const parentName = document.createElement('span');
        parentName.textContent = '..';
        parentItem.appendChild(parentName);
        
        parentItem.addEventListener('click', async () => {
            currentDirHandle = previousDirHandles.pop();
            currentDirPath = previousDirPaths.pop();
            updatePathDisplay();
            refreshFileManager();
        });
        
        fileManagerContent.appendChild(parentItem);
    }

    // Display files and folders
    for await (const entry of currentDirHandle.values()) {
        // Skip hidden files unless specifically requested
        if (entry.name.startsWith('.')) continue;

        const item = document.createElement('div');
        item.className = 'file-manager-item';
        
        const icon = document.createElement('i');
        icon.className = entry.kind === 'directory' ? 'fas fa-folder folder-icon' : 'fas fa-file file-icon';
        item.appendChild(icon);
        
        const name = document.createElement('span');
        name.textContent = entry.name;
        item.appendChild(name);
        
        // Single click for preview, double click for open/enter directory
        item.addEventListener('click', async (e) => {
            if (e.detail === 1) { // Single click
                if (entry.kind === 'file') {
                    await previewFile(entry.name);
                }
            }
        });
        
        item.addEventListener('dblclick', async () => {
            if (entry.kind === 'directory') {
                previousDirHandles.push(currentDirHandle);
                previousDirPaths.push([...currentDirPath]);
                currentDirHandle = await currentDirHandle.getDirectoryHandle(entry.name);
                currentDirPath.push(entry.name);
                updatePathDisplay();
                refreshFileManager();
            }
        });
        
        fileManagerContent.appendChild(item);
    }
}

// Event listeners
document.getElementById('input').addEventListener('keydown', function (e) {
    if (e.key === 'Enter') {
        handleCommand(this.value.trim());
        this.value = '';
    }
});

document.getElementById('select-directory').addEventListener('click', async () => {
    try {
        const dirHandle = await window.showDirectoryPicker();
        if (currentDirHandle) {
            previousDirHandles.push(currentDirHandle);
            previousDirPaths.push([...currentDirPath]);
        }
        currentDirHandle = dirHandle;
        currentDirPath = [dirHandle.name];
        updatePathDisplay();
        refreshFileManager();
        showSuccess(`Changed directory to ${dirHandle.name}`);
    } catch (err) {
        showError(`Error: ${err.message}`);
    }
});

document.getElementById('back-button').addEventListener('click', async () => {
    if (previousDirHandles.length > 0) {
        currentDirHandle = previousDirHandles.pop();
        currentDirPath = previousDirPaths.pop();
        updatePathDisplay();
        refreshFileManager();
        showSuccess(`Returned to ${getCurrentPath()}`);
    } else {
        showError('Already at root directory');
    }
});

document.getElementById('refresh-file-manager').addEventListener('click', () => {
    refreshFileManager();
    showSuccess('Directory refreshed');
});

document.getElementById('close-preview').addEventListener('click', () => {
    document.getElementById('preview-container').style.display = 'none';
    // Revoke object URLs to free memory
    const previewContent = document.getElementById('preview-content');
    const mediaElements = previewContent.querySelectorAll('img, video, audio');
    mediaElements.forEach(el => {
        if (el.src) URL.revokeObjectURL(el.src);
    });
});

// Initialize with welcome message
document.getElementById('output').innerHTML = `
    <div>Welcome to the Web Terminal</div>
    <div>Type 'help' for available commands</div>
    <div>Use the 'Open Directory' button or 'cd' command to begin</div>
`;
