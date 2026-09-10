const signup = document.querySelector(".sign-up");

console.log("signup:", signup);

signup.addEventListener("click", () => {

const fullname = document.querySelector("#full_name").value 
const email = document.querySelector("#email").value
const password = document.querySelector("#password").value
const role = document.querySelector("#role").value

fetch("http://127.0.0.1:8000/auth/register", {
    method: "POST",
    headers: {
        "Content-Type": "application/json"
    },
    body: JSON.stringify(
        {
    name: fullname,
    email: email,
    password: password,
    role: role,
    isLoggedIn: false
}
    )
})

})

