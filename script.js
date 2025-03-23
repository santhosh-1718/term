let currentDirHandle;
let currentDirPath = '~';

// Check if the browser supports the File System Access API
if (!('showDirectoryPicker' in window)) {
    document.getElementById('output').innerHTML = `
        <div style="color: red;">
            Error: Your browser does not support the File System Access API.
            Please use Google Chrome or Microsoft Edge to access this application.
        </div>
    `;
    document.getElementById('input').disabled = true;
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
            response = await listFiles();
            break;
        case 'cd':
            response = await changeDirectory(args[1]);
            break;
        case 'cat':
            response = await readFile(args[1]);
            break;
        case 'eog':
            response = await openImage(args[1]);
            break;
        case 'nano':
            response = await openEditor(args[1]);
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
async function listFiles() {
    if (!currentDirHandle) return 'No directory selected. Use `cd` to select a directory.';
    const files = [];
    for await (const entry of currentDirHandle.values()) {
        files.push(entry.name);
    }
    return files.join('\n');
}

// Function to change directory
async function changeDirectory(dir) {
    if (!currentDirHandle) {
        // Request permission to access the directory
        try {
            currentDirHandle = await window.showDirectoryPicker();
            currentDirPath = currentDirHandle.name;
            return '';
        } catch (err) {
            return `Error: ${err.message}`;
        }
    }

    if (dir === '..') {
        // Move to the parent directory
        currentDirHandle = await currentDirHandle.getParent();
        currentDirPath = currentDirHandle.name;
        return '';
    }

    // Move to a subdirectory
    try {
        const newDirHandle = await currentDirHandle.getDirectoryHandle(dir);
        currentDirHandle = newDirHandle;
        currentDirPath = dir;
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

// Function to open an image in the preview window
async function openImage(fileName) {
    if (!currentDirHandle) return 'No directory selected. Use `cd` to select a directory.';
    try {
        const fileHandle = await currentDirHandle.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        const imageUrl = URL.createObjectURL(file);
        document.getElementById('preview-image').src = imageUrl;
        document.getElementById('image-preview').classList.remove('hidden');
        return '';
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

// Add event listener for terminal input
document.getElementById('input').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        const command = this.value.trim();
        handleCommand(command);
    }
});

// Initialize file manager
document.getElementById('refresh-file-manager').addEventListener('click', async () => {
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
        item.textContent = entry.name;
        fileManagerContent.appendChild(item);
    }
});

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
