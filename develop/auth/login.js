import { auth, provider, signInWithPopup } from '../../src/tools/firebase.js';

const loginBtn = document.getElementById('googleLoginBtn');

if (loginBtn) {
    loginBtn.addEventListener('click', async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            console.log("Успішний вхід! Юзер:", user.displayName);
            
            localStorage.setItem('movieUser', JSON.stringify({
                name: user.displayName,
                email: user.email,
                photo: user.photoURL
            }));

            window.location.href = '../index.html';
            
        } catch (error) {
            console.error("Помилка авторизації:", error.message);
            alert("Помилка входу. Спробуй ще раз!");
        }
    });
}
