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
        case 'netcat':
            response = 'Netcat is not supported in this terminal.';
            break;
        case 'ssh':
            response = 'SSH is not supported in this terminal.';
            break;
        case 'ping':
            response = 'Ping is not supported in this terminal.';
            break;
        case 'ifconfig':
            response = 'Ifconfig is not supported in this terminal.';
            break;
        case 'curl':
            response = await curlFile(args[1]);
            break;
        case 'grep':
            response = await grepFile(args[1], args[2]);
            break;
        case 'find':
            response = await findFile(args[1]);
            break;
        case 'chmod':
            response = await changePermissions(args[1], args[2]);
            break;
        case 'chown':
            response = 'Chown is not supported in this terminal.';
            break;
        case 'ps':
            response = 'Ps is not supported in this terminal.';
            break;
        case 'kill':
            response = 'Kill is not supported in this terminal.';
            break;
        case 'top':
            response = 'Top is not supported in this terminal.';
            break;
        case 'tar':
            response = 'Tar is not supported in this terminal.';
            break;
        case 'gzip':
            response = 'Gzip is not supported in this terminal.';
            break;
        case 'unzip':
            response = 'Unzip is not supported in this terminal.';
            break;
        case 'df':
            response = 'Df is not supported in this terminal.';
            break;
        case 'du':
            response = 'Du is not supported in this terminal.';
            break;
        case 'ln':
            response = 'Ln is not supported in this terminal.';
            break;
        case 'diff':
            response = await diffFiles(args[1], args[2]);
            break;
        case 'echo':
            response = args.slice(1).join(' ');
            break;
        case 'whoami':
            response = 'user';
            break;
        case 'pwd':
            response = currentDirPath;
            break;
        case 'date':
            response = new Date().toString();
            break;
        case 'cal':
            response = 'Cal is not supported in this terminal.';
            break;
        case 'uptime':
            response = 'Uptime is not supported in this terminal.';
            break;
        case 'uname':
            response = 'Uname is not supported in this terminal.';
            break;
        case 'history':
            response = 'History is not supported in this terminal.';
            break;
        case 'man':
            response = 'Man is not supported in this terminal.';
            break;
        case 'which':
            response = 'Which is not supported in this terminal.';
            break;
        case 'whereis':
            response = 'Whereis is not supported in this terminal.';
            break;
        case 'locate':
            response = 'Locate is not supported in this terminal.';
            break;
        case 'tail':
            response = await tailFile(args[1]);
            break;
        case 'head':
            response = await headFile(args[1]);
            break;
        case 'less':
            response = 'Less is not supported in this terminal.';
            break;
        case 'more':
            response = 'More is not supported in this terminal.';
            break;
        case 'sort':
            response = await sortFile(args[1]);
            break;
        case 'uniq':
            response = await uniqFile(args[1]);
            break;
        case 'wc':
            response = await wordCount(args[1]);
            break;
        case 'cut':
            response = 'Cut is not supported in this terminal.';
            break;
        case 'tr':
            response = 'Tr is not supported in this terminal.';
            break;
        case 'sed':
            response = 'Sed is not supported in this terminal.';
            break;
        case 'awk':
            response = 'Awk is not supported in this terminal.';
            break;
        case 'xargs':
            response = 'Xargs is not supported in this terminal.';
            break;
        case 'tee':
            response = 'Tee is not supported in this terminal.';
            break;
        case 'ssh-keygen':
            response = 'Ssh-keygen is not supported in this terminal.';
            break;
        case 'scp':
            response = 'Scp is not supported in this terminal.';
            break;
        case 'rsync':
            response = 'Rsync is not supported in this terminal.';
            break;
        case 'ftp':
            response = 'Ftp is not supported in this terminal.';
            break;
        case 'sftp':
            response = 'Sftp is not supported in this terminal.';
            break;
        case 'telnet':
            response = 'Telnet is not supported in this terminal.';
            break;
        case 'nslookup':
            response = 'Nslookup is not supported in this terminal.';
            break;
        case 'dig':
            response = 'Dig is not supported in this terminal.';
            break;
        case 'host':
            response = 'Host is not supported in this terminal.';
            break;
        case 'traceroute':
            response = 'Traceroute is not supported in this terminal.';
            break;
        case 'route':
            response = 'Route is not supported in this terminal.';
            break;
        case 'netstat':
            response = 'Netstat is not supported in this terminal.';
            break;
        case 'iptables':
            response = 'Iptables is not supported in this terminal.';
            break;
        case 'crontab':
            response = 'Crontab is not supported in this terminal.';
            break;
        case 'at':
            response = 'At is not supported in this terminal.';
            break;
        case 'service':
            response = 'Service is not supported in this terminal.';
            break;
        case 'systemctl':
            response = 'Systemctl is not supported in this terminal.';
            break;
        case 'journalctl':
            response = 'Journalctl is not supported in this terminal.';
            break;
        case 'useradd':
            response = 'Useradd is not supported in this terminal.';
            break;
        case 'usermod':
            response = 'Usermod is not supported in this terminal.';
            break;
        case 'userdel':
            response = 'Userdel is not supported in this terminal.';
            break;
        case 'groupadd':
            response = 'Groupadd is not supported in this terminal.';
            break;
        case 'groupmod':
            response = 'Groupmod is not supported in this terminal.';
            break;
        case 'groupdel':
            response = 'Groupdel is not supported in this terminal.';
            break;
        case 'passwd':
            response = 'Passwd is not supported in this terminal.';
            break;
        case 'su':
            response = 'Su is not supported in this terminal.';
            break;
        case 'sudo':
            response = 'Sudo is not supported in this terminal.';
            break;
        case 'visudo':
            response = 'Visudo is not supported in this terminal.';
            break;
        case 'id':
            response = 'Id is not supported in this terminal.';
            break;
        case 'who':
            response = 'Who is not supported in this terminal.';
            break;
        case 'w':
            response = 'W is not supported in this terminal.';
            break;
        case 'last':
            response = 'Last is not supported in this terminal.';
            break;
        case 'lastlog':
            response = 'Lastlog is not supported in this terminal.';
            break;
        case 'dmesg':
            response = 'Dmesg is not supported in this terminal.';
            break;
        case 'vmstat':
            response = 'Vmstat is not supported in this terminal.';
            break;
        case 'iostat':
            response = 'Iostat is not supported in this terminal.';
            break;
        case 'mpstat':
            response = 'Mpstat is not supported in this terminal.';
            break;
        case 'sar':
            response = 'Sar is not supported in this terminal.';
            break;
        case 'free':
            response = 'Free is not supported in this terminal.';
            break;
        case 'uptime':
            response = 'Uptime is not supported in this terminal.';
            break;
        case 'lsof':
            response = 'Lsof is not supported in this terminal.';
            break;
        case 'fuser':
            response = 'Fuser is not supported in this terminal.';
            break;
        case 'strace':
            response = 'Strace is not supported in this terminal.';
            break;
        case 'ltrace':
            response = 'Ltrace is not supported in this terminal.';
            break;
        case 'gdb':
            response = 'Gdb is not supported in this terminal.';
            break;
        case 'ldd':
            response = 'Ldd is not supported in this terminal.';
            break;
        case 'objdump':
            response = 'Objdump is not supported in this terminal.';
            break;
        case 'nm':
            response = 'Nm is not supported in this terminal.';
            break;
        case 'strings':
            response = await stringsFile(args[1]);
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

// Function to extract strings from a file
async function stringsFile(fileName) {
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
