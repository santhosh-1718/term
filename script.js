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

// Function to list files in the current directory with options
async function listFiles(args = []) {
    if (!currentDirHandle) return 'No directory selected. Use `cd` to select a directory.';

    const files = [];
    for await (const entry of currentDirHandle.values()) {
        files.push(entry);
    }

    let output = '';

    // Handle options
    if (args.includes('-a') || args.includes('--all')) {
        // Show all files, including hidden files
        output = files.map(entry => entry.name).join('\n');
    } else if (args.includes('-l')) {
        // Long listing format
        output = files.map(entry => {
            const type = entry.kind === 'directory' ? 'd' : '-';
            const permissions = 'rwxrwxrwx'; // Simplified permissions
            const size = entry.kind === 'file' ? entry.size : 0;
            const date = new Date().toLocaleString(); // Simplified date
            return `${type}${permissions} 1 user user ${size} ${date} ${entry.name}`;
        }).join('\n');
    } else if (args.includes('-al') || args.includes('-la')) {
        // Long listing format with all files
        output = files.map(entry => {
            const type = entry.kind === 'directory' ? 'd' : '-';
            const permissions = 'rwxrwxrwx'; // Simplified permissions
            const size = entry.kind === 'file' ? entry.size : 0;
            const date = new Date().toLocaleString(); // Simplified date
            return `${type}${permissions} 1 user user ${size} ${date} ${entry.name}`;
        }).join('\n');
    } else {
        // Default listing (exclude hidden files)
        output = files.filter(entry => !entry.name.startsWith('.')).map(entry => entry.name).join('\n');
    }

    return output;
}

// Function to change directory
async function changeDirectory(dir) {
    if (!currentDirHandle) {
        // Request permission to access the directory
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
        // Move to the parent directory
        if (previousDirHandles.length > 0) {
            currentDirHandle = previousDirHandles.pop();
            currentDirPath = currentDirHandle.name;
            refreshFileManager();
            return '';
        } else {
            return 'Already at the root directory.';
        }
    }

    // Move to a subdirectory
    try {
        previousDirHandles.push(currentDirHandle); // Save current directory
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

// Function to open a file in the editor
async function openEditor(fileName) {
    if (!currentDirHandle) return 'No directory selected. Use `cd` to select a directory.';
    try {
        const fileHandle = await currentDirHandle.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        const content = await file.text();
        document.getElementById('editor-content').value = content;
        document.getElementById('editor').classList.remove('hidden');
        return '';
    } catch (err) {
        return `Error: ${err.message}`;
    }
}

// Function to remove a file
async function removeFile(fileName) {
    if (!currentDirHandle) return 'No directory selected. Use `cd` to select a directory.';
    try {
        await currentDirHandle.removeEntry(fileName);
        return `File ${fileName} deleted successfully.`;
    } catch (err) {
        return `Error: ${err.message}`;
    }
}

// Function to move a file
async function moveFile(source, destination) {
    if (!currentDirHandle) return 'No directory selected. Use `cd` to select a directory.';
    try {
        const sourceFile = await currentDirHandle.getFileHandle(source);
        const destinationFile = await currentDirHandle.getFileHandle(destination, { create: true });
        const writable = await destinationFile.createWritable();
        const file = await sourceFile.getFile();
        await writable.write(await file.text());
        await writable.close();
        await currentDirHandle.removeEntry(source);
        return `File ${source} moved to ${destination} successfully.`;
    } catch (err) {
        return `Error: ${err.message}`;
    }
}

// Function to copy a file
async function copyFile(source, destination) {
    if (!currentDirHandle) return 'No directory selected. Use `cd` to select a directory.';
    try {
        const sourceFile = await currentDirHandle.getFileHandle(source);
        const destinationFile = await currentDirHandle.getFileHandle(destination, { create: true });
        const writable = await destinationFile.createWritable();
        const file = await sourceFile.getFile();
        await writable.write(await file.text());
        await writable.close();
        return `File ${source} copied to ${destination} successfully.`;
    } catch (err) {
        return `Error: ${err.message}`;
    }
}

// Function to create a directory
async function createDirectory(dirName) {
    if (!currentDirHandle) return 'No directory selected. Use `cd` to select a directory.';
    try {
        await currentDirHandle.getDirectoryHandle(dirName, { create: true });
        return `Directory ${dirName} created successfully.`;
    } catch (err) {
        return `Error: ${err.message}`;
    }
}

// Function to remove a directory
async function removeDirectory(dirName) {
    if (!currentDirHandle) return 'No directory selected. Use `cd` to select a directory.';
    try {
        await currentDirHandle.removeEntry(dirName, { recursive: true });
        return `Directory ${dirName} deleted successfully.`;
    } catch (err) {
        return `Error: ${err.message}`;
    }
}

// Function to create a file
async function createFile(fileName) {
    if (!currentDirHandle) return 'No directory selected. Use `cd` to select a directory.';
    try {
        await currentDirHandle.getFileHandle(fileName, { create: true });
        return `File ${fileName} created successfully.`;
    } catch (err) {
        return `Error: ${err.message}`;
    }
}

// Function to download a file
async function downloadFile(url) {
    try {
        const response = await fetch(url);
        const content = await response.text();
        const fileName = url.split('/').pop();
        const fileHandle = await currentDirHandle.getFileHandle(fileName, { create: true });
        const writable = await fileHandle.createWritable();
        await writable.write(content);
        await writable.close();
        return `File ${fileName} downloaded successfully.`;
    } catch (err) {
        return `Error: ${err.message}`;
    }
}

// Function to handle nc command
async function handleNcCommand(args) {
    const host = args[0] || 'localhost';
    const port = args[1] || 8080;

    try {
        const ws = new WebSocket(`ws://${host}:${port}`);

        ws.onopen = () => {
            return 'Connected to WebSocket server. Type your message.';
        };

        ws.onmessage = (event) => {
            document.getElementById('output').innerHTML += `<div>${event.data}</div>`;
        };

        ws.onerror = (error) => {
            return `WebSocket error: ${error.message}`;
        };

        ws.onclose = () => {
            return 'WebSocket connection closed.';
        };

        return 'WebSocket connection initiated.';
    } catch (err) {
        return `Error: ${err.message}`;
    }
}

// Function to handle ssh command
async function handleSshCommand(args) {
    const host = args[0] || 'localhost';
    const port = args[1] || 8081;

    try {
        const ws = new WebSocket(`ws://${host}:${port}`);

        ws.onopen = () => {
            return 'Connected to SSH server. Type your command.';
        };

        ws.onmessage = (event) => {
            document.getElementById('output').innerHTML += `<div>${event.data}</div>`;
        };

        ws.onerror = (error) => {
            return `SSH WebSocket error: ${error.message}`;
        };

        ws.onclose = () => {
            return 'SSH WebSocket connection closed.';
        };

        return 'SSH WebSocket connection initiated.';
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
                previousDirHandles.push(currentDirHandle); // Save current directory
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

// Add event listener for terminal input
document.getElementById('input').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        const command = this.value.trim();
        handleCommand(command);
    }
});

// Add event listener for selecting directory
document.getElementById('select-directory').addEventListener('click', async () => {
    try {
        currentDirHandle = await window.showDirectoryPicker();
        currentDirPath = currentDirHandle.name;
        refreshFileManager();
    } catch (err) {
        alert(`Error: ${err.message}`);
    }
});

// Add event listener for back button
document.getElementById('back-button').addEventListener('click', async () => {
    if (previousDirHandles.length > 0) {
        currentDirHandle = previousDirHandles.pop();
        currentDirPath = currentDirHandle.name;
        refreshFileManager();
    } else {
        alert('Already at the root directory.');
    }
});

// Refresh file manager
document.getElementById('refresh-file-manager').addEventListener('click', refreshFileManager);

// Close image preview
document.getElementById('close-preview').addEventListener('click', () => {
    document.getElementById('image-preview').classList.add('hidden');
});

// Save file in editor
document.getElementById('save-file').addEventListener('click', async () => {
    const content = document.getElementById('editor-content').value;
    const fileName = prompt('Enter file name:');
    if (fileName) {
        try {
            const fileHandle = await currentDirHandle.getFileHandle(fileName, { create: true });
            const writable = await fileHandle.createWritable();
            await writable.write(content);
            await writable.close();
            alert('File saved successfully!');
        } catch (err) {
            alert(`Error: ${err.message}`);
        }
    }
});

// Close editor
document.getElementById('close-editor').addEventListener('click', () => {
    document.getElementById('editor').classList.add('hidden');
});
