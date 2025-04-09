const emailInput = document.querySelector("#email");
const pwd = document.querySelector("#pwd");
const pwdConf = document.querySelector("#pwdConf");
const form = document.querySelector("form");

form.addEventListener("submit", async (e) => {
    e.preventDefault();
    
    try {
        const email = emailInput.value;
        const password = pwd.value;
        
        if (password !== pwdConf.value) {
            alert("Les mots de passe ne correspondent pas !");
            return;
        }
        
        const response = await fetch("http://localhost:3000/register", {
            method: "POST",
            credentials: 'include',
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ email, password }),
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log("Message : ", data.message);
            window.location.href = "../a2f/index.html";
        } else {
            alert("Erreur : " + data.message);
        }
    } catch (error) {
        console.error("Erreur lors de la communication avec le serveur:", error);
        alert("Erreur de communication avec le serveur. Vérifiez la console pour plus de détails.");
    }
});