const form = document.querySelector("form");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
        let code = document.querySelector("#code").value;

        const response = await fetch("http://localhost:3000/verify", {
            method: "POST",
            credentials: 'include',
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({code})
        });

        const data = await response.json();

        if (response.ok) {
            window.location.href = "../main/index.html";
        }
        else {
            alert("Erreur : " + data.message);
        }
    } catch (error) {
        console.error("Erreur lors de la communication avec le serveur:", error);
        alert("Erreur de communication avec le serveur. Vérifiez la console pour plus de détails.");
    }
});