document.addEventListener("DOMContentLoaded", function () {
    const inputField = document.getElementById("input");
    const outputDiv = document.getElementById("output");

    inputField.addEventListener("keypress", function (event) {
        if (event.key === "Enter") {
            event.preventDefault();
            const command = inputField.value.trim();
            inputField.value = "";

            if (command) {
                outputDiv.innerHTML += `<div><span style="color:white;">user@local:~$</span> ${command}</div>`;
                executeCommand(command);
            }
        }
    });

    function executeCommand(command) {
        fetch("/execute", {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify({ command: command })
        })
        .then(response => response.json())
        .then(data => {
            outputDiv.innerHTML += `<div>${data.output}</div>`;
            outputDiv.scrollTop = outputDiv.scrollHeight;
        })
        .catch(error => {
            outputDiv.innerHTML += `<div>Error executing command</div>`;
        });
    }
});
