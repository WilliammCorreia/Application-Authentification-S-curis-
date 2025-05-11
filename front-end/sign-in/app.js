const form = document.querySelector("form");

form.addEventListener("submit", async (e) => {
    e.preventDefault();

    try {
        const email = document.querySelector("#email").value;
        const password = document.querySelector("#pwd").value;
    
        const response = await fetch("http://localhost:3000/login", {
            method: "POST",
            credentials: "include",
            headers: {"Content-Type": "application/json"},
            body: JSON.stringify({email, password})
        });
    
        const data = await response.json();

        if (response.ok) {
            console.log('Message : ', data.message);
            window.location.href = "../a2f/index.html";
        } else {
            console.log(data.message);
            alert(data.message);
        }
    } catch (error) {
        console.error("ERREUR : ", error);
    }
});