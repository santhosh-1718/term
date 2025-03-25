let currentDirHandle;
let currentDirPath = ['~'];
let previousDirHandles = [];
let previousDirPaths = [];
let currentFileHandle = null;

const config = {
    username: 'isha',
    groupname: 'users',
    uid: 1000,
    gid: 100
};

const fileTypes = {
    image: ['jpg', 'jpeg', 'png', 'gif', 'bmp', 'svg', 'webp'],
    executable: ['sh', 'py', 'js', 'exe', 'bat', 'bin'],
    archive: ['zip', 'rar', '7z', 'tar', 'gz', 'bz2', 'xz'],
    text: ['txt', 'md', 'log', 'conf', 'ini', 'csv'],
    config: ['conf', 'cfg', 'ini', 'yml', 'yaml', 'json'],
    document: ['pdf', 'doc', 'docx', 'xls', 'xlsx', 'ppt', 'pptx'],
    audio: ['mp3', 'wav', 'ogg', 'flac'],
    video: ['mp4', 'avi', 'mkv', 'mov', 'wmv']
};

class NetworkTools {
    static async nc(args) {
        const host = args[0];
        const port = parseInt(args[1]);
        const options = {
            listen: args.includes('-l') || args.includes('--listen'),
            verbose: args.includes('-v') || args.includes('--verbose'),
            udp: args.includes('-u') || args.includes('--udp'),
            timeout: this._getArgValue(args, ['-w', '--timeout']),
            source: this._getArgValue(args, ['-s', '--source']),
            sourcePort: this._getArgValue(args, ['--source-port']),
            zeroIO: args.includes('-z') || args.includes('--zero-io')
        };

        if (options.listen) {
            return this._ncListen(port, options);
        } else {
            return this._ncConnect(host, port, options);
        }
    }

    static _getArgValue(args, flags) {
        for (const flag of flags) {
            const index = args.indexOf(flag);
            if (index !== -1 && index < args.length - 1) {
                return args[index + 1];
            }
        }
        return null;
    }

    static async _ncListen(port, options) {
        if (options.verbose) {
            return `[*] Listening on port ${port} (${options.udp ? 'UDP' : 'TCP'})\n` +
                   'Web browsers cannot directly create listening sockets. This is simulated.';
        }
        return 'Listening mode not fully supported in browser environment';
    }

    static async _ncConnect(host, port, options) {
        if (options.verbose) {
            let response = `[*] Connecting to ${host}:${port} (${options.udp ? 'UDP' : 'TCP'})\n`;
            
            try {
                // Simulate connection attempt
                const test = await fetch(`https://${host}:${port}`);
                response += '[+] Connection successful (simulated)\n';
            } catch (e) {
                response += '[-] Connection failed (simulated)\n';
            }
            
            return response;
        }
        return `Connected to ${host}:${port} (simulated)`;
    }

    static async wget(args) {
        const url = args[0];
        const output = this._getArgValue(args, ['-O', '--output']);
        const verbose = args.includes('-v') || args.includes('--verbose');

        try {
            if (verbose) {
                return `[*] Downloading ${url}\n` +
                       `[+] Saved to ${output || url.split('/').pop() || 'download'}`;
            }
            
            return `Downloaded ${url} to ${output || 'default filename'}`;
        } catch (e) {
            return `[-] Download failed: ${e.message}`;
        }
    }

    static async ssh(args) {
        const hostArg = args[0];
        const command = args[1];
        const verbose = args.includes('-v') || args.includes('--verbose');

        let username, host;
        if (hostArg.includes('@')) {
            [username, host] = hostArg.split('@');
        } else {
            host = hostArg;
            username = 'user';
        }

        if (verbose) {
            let response = `[*] Connecting to ${username}@${host}...\n`;
            if (command) {
                response += `[*] Executing command: ${command}\n`;
            }
            response += `Welcome to ${host} (simulated SSH session)\n` +
                        `Logged in as ${username}\n`;
            
            if (command) {
                response += `Command output: Simulated execution of '${command}'`;
            } else {
                response += 'Interactive shell (simulated)\n' +
                            'Type "exit" or "logout" to end session';
            }
            
            return response;
        }
        
        return `Connected to ${username}@${host} (simulated)`;
    }

    static async nmap(args) {
        const target = args[0];
        const ports = this._getArgValue(args, ['-p', '--ports']) || '1-1000';
        const verbose = args.includes('-v') || args.includes('--verbose');

        const [startPort, endPort] = ports.split('-').map(Number);
        const openPorts = [];

        if (verbose) {
            let response = `[*] Scanning ${target}...\n`;
            
            const commonPorts = [21, 22, 23, 25, 53, 80, 110, 143, 443, 587, 993, 995];
            for (const port of commonPorts) {
                if (port >= startPort && port <= endPort) {
                    openPorts.push(port);
                    response += `Port ${port} is open\n`;
                }
            }
            
            response += '\n[+] Scan results:\n';
            if (openPorts.length) {
                response += 'Open ports: ' + openPorts.join(', ');
            } else {
                response += 'No open ports found';
            }
            
            return response;
        }
        
        return `Scan results for ${target}: Common ports scanned (simulated)`;
    }
}

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
    output.innerHTML += `<div class="error">${message}</div>`;
    scrollToBottom();
}

function showSuccess(message) {
    const output = document.getElementById('output');
    output.innerHTML += `<div class="success">${message}</div>`;
    scrollToBottom();
}

function scrollToBottom() {
    const terminal = document.getElementById('terminal');
    terminal.scrollTop = terminal.scrollHeight;
    document.getElementById('input').focus();
}

async function handleCommand(command) {
    const output = document.getElementById('output');
    const input = document.getElementById('input');

    if (command.trim() === '') return;

    output.innerHTML += `<div><span class="prompt" style="color:white">${getPrompt()}</span> ${command}</div>`;

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
            case 'nano':
            case 'edit':
                response = await editFile(args[1]);
                break;
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
            case 'wget':
                response = await NetworkTools.wget(args.slice(1));
                break;
            case 'nc':
                response = await NetworkTools.nc(args.slice(1));
                break;
            case 'ssh':
                response = await NetworkTools.ssh(args.slice(1));
                break;
            case 'nmap':
                response = await NetworkTools.nmap(args.slice(1));
                break;
            case 'help':
                response = getHelpText();
                break;
            default:
                response = `${cmd}: command not found`;
        }
    } catch (err) {
        response = `Error: ${err.message}`;
    }

    if (response) {
        output.innerHTML += `<div class="output">${response}</div>`;
    }
    
    input.value = '';
    scrollToBottom();
}

function getHelpText() {
    return `Available commands:
ls [options]       - List directory contents
cd [directory]     - Change directory
cat [file]         - Display file contents
nano/edit [file]   - Edit file
preview [file]     - Preview file
pwd                - Print working directory
mkdir [directory]  - Create directory
touch [file]       - Create file
rm [file]          - Remove file
mv [src] [dest]    - Move/rename file
cp [src] [dest]    - Copy file
wget [url]         - Download file
nc [host] [port]   - Netcat-like functionality
ssh [user@host]    - SSH client
nmap [target]      - Port scanning
clear              - Clear terminal
help               - Show this help`;
}

function getCurrentPath() {
    return currentDirPath.join('/');
}

function getPrompt() {
    return `${config.username}@linux:${getCurrentPath()}$`;
}

function getFileClass(filename) {
    if (filename.startsWith('.')) return 'hidden';
    
    const ext = filename.split('.').pop().toLowerCase();
    
    for (const [type, exts] of Object.entries(fileTypes)) {
        if (exts.includes(ext)) return type;
    }
    
    return 'file';
}

function getFileIconClass(filename) {
    return `${getFileClass(filename)}-icon`;
}

async function listFiles(args = []) {
    if (!currentDirHandle) return 'No directory selected. Use `cd` to select a directory.';

    const showAll = args.includes('-a') || args.includes('--all');
    const longFormat = args.includes('-l') || args.includes('-al') || args.includes('-la');
    const showAlmostAll = args.includes('-A');

    const entries = [];
    for await (const entry of currentDirHandle.values()) {
        entries.push(entry);
    }

    entries.sort((a, b) => {
        if (a.kind === b.kind) {
            if (a.name.startsWith('.') !== b.name.startsWith('.')) {
                return a.name.startsWith('.') ? 1 : -1;
            }
            return a.name.localeCompare(b.name);
        }
        return a.kind === 'directory' ? -1 : 1;
    });

    if (showAll && !showAlmostAll) {
        entries.unshift(
            { kind: 'directory', name: '..' },
            { kind: 'directory', name: '.' }
        );
    }

    if (longFormat) {
        let totalBlocks = 0;
        const fileList = [];
        
        for (const entry of entries) {
            if (!showAll && !showAlmostAll && entry.name.startsWith('.')) continue;
            
            try {
                const file = entry.kind === 'file' ? 
                    await entry.getFile() : 
                    { size: 4096, lastModified: Date.now() };
                
                const mode = entry.name.startsWith('.') ? 0o644 : 
                            entry.kind === 'directory' ? 0o755 : 0o644;
                
                const size = file.size;
                totalBlocks += Math.ceil(size / 512);

                const line = [
                    modeToString(mode),
                    '1',
                    config.username.padEnd(8),
                    config.groupname.padEnd(8),
                    size.toString().padStart(8),
                    formatDate(new Date(file.lastModified)),
                    `<span class="${getFileClass(entry.name)}">${entry.name}</span>`
                ].join(' ');

                fileList.push(line);
            } catch (err) {
                console.error('Error processing file:', err);
            }
        }

        return `total ${totalBlocks}\n${fileList.join('\n')}`;
    } else {
        const visibleEntries = entries.filter(entry => showAll || showAlmostAll || !entry.name.startsWith('.'));
        
        let output = '<div class="ls-output">';
        visibleEntries.forEach(entry => {
            const fileClass = getFileClass(entry.name);
            output += `<div class="ls-item ${fileClass}">${entry.name}</div>`;
        });
        output += '</div>';
        
        return output;
    }
}

function modeToString(mode) {
    const type = (mode & 0o170000) === 0o040000 ? 'd' : '-';
    const perms = [
        mode & 0o400 ? 'r' : '-',
        mode & 0o200 ? 'w' : '-',
        mode & 0o100 ? 'x' : '-',
        mode & 0o040 ? 'r' : '-',
        mode & 0o020 ? 'w' : '-',
        mode & 0o010 ? 'x' : '-',
        mode & 0o004 ? 'r' : '-',
        mode & 0o002 ? 'w' : '-',
        mode & 0o001 ? 'x' : '-'
    ].join('');
    return type + perms;
}

function formatDate(date) {
    const now = new Date();
    const sixMonthsAgo = new Date(now.getFullYear(), now.getMonth() - 6, now.getDate());
    
    const month = date.toLocaleString('default', { month: 'short' });
    const day = date.getDate().toString().padStart(2, ' ');
    
    if (date > sixMonthsAgo) {
        const hours = date.getHours().toString().padStart(2, '0');
        const minutes = date.getMinutes().toString().padStart(2, '0');
        return `${month} ${day} ${hours}:${minutes}`;
    } else {
        const year = date.getFullYear();
        return `${month} ${day}  ${year}`;
    }
}

async function changeDirectory(dir) {
    if (!dir) {
        try {
            currentDirHandle = await window.showDirectoryPicker();
            currentDirPath = [currentDirHandle.name];
            return '';
        } catch (err) {
            return `cd: ${err.message}`;
        }
    }

    if (!currentDirHandle) {
        return 'No directory selected. Use `cd` to select a directory.';
    }

    if (dir === '..') {
        if (previousDirHandles.length > 0) {
            currentDirHandle = previousDirHandles.pop();
            currentDirPath = previousDirPaths.pop();
            return '';
        }
        return 'Already at root directory';
    }

    try {
        previousDirHandles.push(currentDirHandle);
        previousDirPaths.push([...currentDirPath]);
        
        const newDirHandle = await currentDirHandle.getDirectoryHandle(dir);
        currentDirHandle = newDirHandle;
        currentDirPath.push(dir);
        return '';
    } catch (err) {
        if (previousDirHandles.length > 0) {
            currentDirHandle = previousDirHandles.pop();
            currentDirPath = previousDirPaths.pop();
        }
        return `cd: ${dir}: No such file or directory`;
    }
}

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

async function editFile(fileName) {
    if (!currentDirHandle) return 'No directory selected.';
    try {
        const fileHandle = await currentDirHandle.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        const content = await file.text();
        
        document.getElementById('editor-content').value = content;
        currentFileHandle = fileHandle;
        document.getElementById('editor-container').style.display = 'block';
        return `Editing ${fileName}`;
    } catch (err) {
        return `Error: ${err.message}`;
    }
}

async function saveFile() {
    if (!currentFileHandle) return;
    
    try {
        const writable = await currentFileHandle.createWritable();
        await writable.write(document.getElementById('editor-content').value);
        await writable.close();
        showSuccess(`File saved: ${currentFileHandle.name}`);
    } catch (err) {
        showError(`Error saving file: ${err.message}`);
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
        const fileHandle = await currentDirHandle.getFileHandle(src);
        const file = await fileHandle.getFile();
        const content = await file.text();
        
        const newFileHandle = await currentDirHandle.getFileHandle(dest, { create: true });
        const writable = await newFileHandle.createWritable();
        await writable.write(content);
        await writable.close();
        
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

async function previewFile(fileName) {
    if (!currentDirHandle) return 'No directory selected.';
    
    try {
        const fileHandle = await currentDirHandle.getFileHandle(fileName);
        const file = await fileHandle.getFile();
        const previewContainer = document.getElementById('preview-container');
        const previewContent = document.getElementById('preview-content');
        
        previewContent.innerHTML = '';
        
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
        } else if (file.type === 'text/plain' || file.size < 1024 * 1024) {
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

async function refreshFileManager() {
    const fileManagerContent = document.getElementById('file-manager-content');
    fileManagerContent.innerHTML = '';

    if (!currentDirHandle) {
        fileManagerContent.textContent = 'No directory selected.';
        return;
    }

    document.getElementById('current-path').textContent = getCurrentPath();

    if (previousDirHandles.length > 0) {
        const parentItem = document.createElement('div');
        parentItem.className = 'file-manager-item directory';
        
        const parentIcon = document.createElement('i');
        parentIcon.className = 'fas fa-level-up-alt folder-icon';
        parentItem.appendChild(parentIcon);
        
        const parentName = document.createElement('span');
        parentName.textContent = '..';
        parentItem.appendChild(parentName);
        
        parentItem.addEventListener('click', async () => {
            currentDirHandle = previousDirHandles.pop();
            currentDirPath = previousDirPaths.pop();
            refreshFileManager();
        });
        
        fileManagerContent.appendChild(parentItem);
    }

    const entries = [];
    for await (const entry of currentDirHandle.values()) {
        entries.push(entry);
    }

    entries.sort((a, b) => {
        if (a.kind === b.kind) {
            if (a.name.startsWith('.') !== b.name.startsWith('.')) {
                return a.name.startsWith('.') ? 1 : -1;
            }
            return a.name.localeCompare(b.name);
        }
        return a.kind === 'directory' ? -1 : 1;
    });

    for (const entry of entries) {
        const item = document.createElement('div');
        const fileClass = getFileClass(entry.name);
        item.className = `file-manager-item ${fileClass}`;
        
        const icon = document.createElement('i');
        icon.className = entry.kind === 'directory' ? 
            'fas fa-folder folder-icon' : 
            `fas fa-file ${fileClass}-icon`;
        item.appendChild(icon);
        
        const name = document.createElement('span');
        name.textContent = entry.name;
        item.appendChild(name);
        
        item.addEventListener('click', async (e) => {
            if (e.detail === 1) {
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
                refreshFileManager();
            } else {
                await editFile(entry.name);
            }
        });
        
        fileManagerContent.appendChild(item);
    }
}

document.getElementById('input').addEventListener('keydown', function(e) {
    if (e.key === 'Enter') {
        handleCommand(this.value.trim());
        this.value = '';
    }
});

document.getElementById('terminal').addEventListener('click', function() {
    document.getElementById('input').focus();
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
    const previewContent = document.getElementById('preview-content');
    const mediaElements = previewContent.querySelectorAll('img, video, audio');
    mediaElements.forEach(el => {
        if (el.src) URL.revokeObjectURL(el.src);
    });
});

document.getElementById('save-file').addEventListener('click', async () => {
    await saveFile();
});

document.getElementById('close-editor').addEventListener('click', () => {
    document.getElementById('editor-container').style.display = 'none';
    currentFileHandle = null;
});

document.getElementById('output').innerHTML = `
    <div class="output">Linux terminal emulator</div>
    <div class="output">Type 'help' for available commands</div>
    <div class="output">Click 'Open Directory' or use 'cd' to begin</div>
`;
