let currentDirHandle;
let currentDirPath = '~';
const commands = {};

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

// Function to dynamically load commands from the 'commands/' folder
async function loadCommands() {
    try {
        // Fetch the list of files in the 'commands/' folder
        const response = await fetch('/commands/');
        const text = await response.text();
        const parser = new DOMParser();
        const html = parser.parseFromString(text, 'text/html');

        // Extract all .js files from the folder
        const commandFiles = Array.from(html.querySelectorAll('a'))
            .map(link => link.href)
            .filter(href => href.endsWith('.js'))
            .map(href => href.split('/').pop().replace('.js', ''));

        // Load each command dynamically
        for (const file of commandFiles) {
            try {
                const module = await import(`./commands/${file}.js`);
                commands[file] = module.execute; // Store the execute function
            } catch (err) {
                console.error(`Failed to load command ${file}:`, err);
            }
        }
    } catch (err) {
        console.error('Failed to fetch commands:', err);
    }
}

// Load all commands when the script starts
loadCommands();

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
    const cmd = args[0]; // Extract the command (e.g., 'ls')

    let response = '';

    // Check if the command exists in the commands object
    if (commands[cmd]) {
        try {
            // Execute the command with arguments (e.g., 'ls -al' -> args = ['-al'])
            response = await commands[cmd](args.slice(1), currentDirHandle);
        } catch (err) {
            response = `Error executing command ${cmd}: ${err.message}`;
        }
    } else {
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
            refreshFileManager();
            return '';
        } catch (err) {
            return `Error: ${err.message}`;
        }
    }

    if (dir === '..') {
        // Move to the parent directory
        currentDirHandle = await currentDirHandle.getParent();
        currentDirPath = currentDirHandle.name;
        refreshFileManager();
        return '';
    }

    // Move to a subdirectory
    try {
        const newDirHandle = await currentDirHandle.getDirectoryHandle(dir);
        currentDirHandle = newDirHandle;
        currentDirPath = dir;
        refreshFileManager();
        return '';
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
