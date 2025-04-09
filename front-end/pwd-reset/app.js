const form = document.querySelector("form");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    if (pwd.value !== pwdConf.value) {
        alert("Les mots de passe ne correspondent pas !");
    }

    try {
        const password = document.querySelector("#pwd").value;
        const code = document.querySelector("#code").value;
    
        const response = await fetch("http://localhost:3000/resetPwd", {
            method: "POST",
            credentials: "include",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({password, code})
        });
    
        const data = await response.json();

        if (response.ok) {
            console.log('Message : ', data.message);
            window.location.href = "../main/index.html";
        } else {
            console.log(data.message);
            alert(data.message);
        }
    } catch (error) {
        console.error("ERREUR : ", error);
    }
});