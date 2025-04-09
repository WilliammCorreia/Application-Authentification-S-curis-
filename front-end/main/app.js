const btn = document.querySelector("button");

/**
 * Vérifie l'autorisation de l'utilisateur en envoyant une requête au serveur pour valider le JWT.
 * Si le JWT est valide, un message est affiché dans la console.
 * Si le JWT est invalide ou expiré, l'utilisateur est redirigé vers la page de connexion.
 * En cas d'erreur de communication avec le serveur, un message d'erreur est affiché.
 *
 * @async
 * @function authorization
 * @throws {Error} Affiche une erreur dans la console et une alerte en cas de problème de communication avec le serveur.
 */
const authorization = async () => {
    try {
        const response = await fetch("http://localhost:3000/checkJWT", {
            method: "GET",
            credentials: "include"
        });
        
        const data = await response.json();
        
        if (response.ok) {
            console.log(data.message);
        } else {
            console.log(data.message);
            window.location.href = "../sign-in/index.html";
        }
    } catch (error) {
        console.error("Erreur lors de la communication avec le serveur:", error);
        alert("Erreur de communication avec le serveur. Vérifiez la console pour plus de détails.");
    }
}

btn.addEventListener("click", async () => {

    try {
        const response = await fetch("http://localhost:3000/logout", {
            method: "GET",
            credentials: "include"
        });
    
        const data = await response.json();
    
        if (response.ok) {
            console.log(data.message);
            window.location.href = "../sign-in/index.html";
        } else {
            console.log("ERREUR : ", data.message);
        }
    } catch (error) {
        console.error("Erreur lors de la communication avec le serveur:", error);
        alert("Erreur de communication avec le serveur. Vérifiez la console pour plus de détails.");
    }
});

authorization();