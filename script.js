let currentDir = '~';

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

    // Send the command to the backend
    const response = await fetch('/api/command', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ command }),
    }).then(res => res.json());

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
refreshFileManager([]);
