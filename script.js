const commands = {};

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
            response = await commands[cmd](args.slice(1));
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

// Add event listener for terminal input
document.getElementById('input').addEventListener('keydown', function (event) {
    if (event.key === 'Enter') {
        const command = this.value.trim();
        handleCommand(command);
    }
});
