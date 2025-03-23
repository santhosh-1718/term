let currentDir = '~';
let fileSystem = {
    '~': {
        'Documents': {
            'file1.txt': 'This is file1 content',
            'file2.txt': 'This is file2 content'
        },
        'Downloads': {},
        'Pictures': {}
    }
};

// Function to handle terminal commands
async function handleCommand(command) {
    const output = document.getElementById('output');
    const input = document.getElementById('input');

    if (command.trim() === '') return;

    // Display the command in the terminal
    output.innerHTML += `<div><span id="prompt">user@website:${currentDir}$</span> ${command}</div>`;

    if (command === 'clear') {
        output.innerHTML = '';
        input.value = '';
        return;
    }

    const args = command.split(' ');
    const cmd = args[0];

    let response = { output: '', currentDir: currentDir, files: [] };

    switch (cmd) {
        case 'ls':
            response.output = listFiles(currentDir);
            response.files = getFiles(currentDir);
            break;
        case 'cd':
            response.output = changeDirectory(args[1]);
            response.currentDir = currentDir;
            response.files = getFiles(currentDir);
            break;
        case 'mkdir':
            response.output = makeDirectory(args[1]);
            response.files = getFiles(currentDir);
            break;
        case 'touch':
            response.output = createFile(args[1]);
            response.files = getFiles(currentDir);
            break;
        case 'cat':
            response.output = readFile(args[1]);
            break;
        default:
            response.output = `Command not found: ${cmd}`;
    }

    // Display the output
    output.innerHTML += `<div>${response.output}</div>`;

    // Update the current directory for the prompt
    currentDir = response.currentDir;

    // Refresh the file manager
    refreshFileManager(response.files);

    // Clear the input and scroll to the bottom
    input.value = '';
    output.parentElement.scrollTop = output.parentElement.scrollHeight;
}

// Function to list files in the current directory
function listFiles(dir) {
    const files = getFiles(dir);
    return files.join('\n');
}

// Function to change directory
function changeDirectory(dir) {
    if (dir === '..') {
        const parts = currentDir.split('/');
        parts.pop();
        currentDir = parts.join('/') || '~';
    } else if (dir in fileSystem[currentDir]) {
        currentDir = `${currentDir}/${dir}`;
    } else {
        return `cd: no such file or directory: ${dir}`;
    }
    return '';
}

// Function to create a directory
function makeDirectory(dir) {
    if (!fileSystem[currentDir][dir]) {
        fileSystem[currentDir][dir] = {};
        return '';
    } else {
        return `mkdir: cannot create directory '${dir}': File exists`;
    }
}

// Function to create a file
function createFile(file) {
    if (!fileSystem[currentDir][file]) {
        fileSystem[currentDir][file] = '';
        return '';
    } else {
        return `touch: cannot create file '${file}': File exists`;
    }
}

// Function to read a file
function readFile(file) {
    if (fileSystem[currentDir][file] !== undefined) {
        return fileSystem[currentDir][file];
    } else {
        return `cat: ${file}: No such file or directory`;
    }
}

// Function to get files in the current directory
function getFiles(dir) {
    return Object.keys(fileSystem[dir] || {});
}

// Function to refresh the file manager
function refreshFileManager(files) {
    const fileManagerContent = document.getElementById('file-manager-content');
    fileManagerContent.innerHTML = '';

    // Display the current directory
    const currentDirElement = document.createElement('div');
    currentDirElement.textContent = `Current Directory: ${currentDir}`;
    currentDirElement.style.fontWeight = 'bold';
    fileManagerContent.appendChild(currentDirElement);

    // Display files and folders
    files.forEach(file => {
        const item = document.createElement('div');
        item.className = 'file-manager-item';
        item.textContent = file;
        fileManagerContent.appendChild(item);
    });
}

// Add event listener for terminal input
document.getElementById('input').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        const command = this.value.trim();
        handleCommand(command);
    }
});

// Initialize file manager
refreshFileManager(getFiles(currentDir));
