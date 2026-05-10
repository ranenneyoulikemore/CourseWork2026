import { auth, provider, signInWithPopup, signInWithEmailAndPassword } from '../../src/tools/firebase.js';

const googleLoginBtn = document.getElementById('googleLoginBtn');
const emailInput = document.querySelector('input[type="email"]');
const passwordInput = document.querySelector('input[type="password"]');
const emailLoginBtn = document.querySelectorAll('button')[0];
const phoneBtn = document.querySelectorAll('button')[1];

if (googleLoginBtn) {
    googleLoginBtn.addEventListener('click', async () => {
        try {
            const result = await signInWithPopup(auth, provider);
            const user = result.user;
            
            localStorage.setItem('movieUser', JSON.stringify({
                name: user.displayName,
                email: user.email,
                photo: user.photoURL
            }));

            window.location.href = '../index.html';
        } catch (error) {
            alert("Помилка входу. Спробуй ще раз!");
        }
    });
}

if (emailLoginBtn) {
    emailLoginBtn.addEventListener('click', async (e) => {
        e.preventDefault(); 

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            alert("Будь ласка, заповніть усі поля!");
            return;
        }

        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            const user = result.user;
            
            localStorage.setItem('movieUser', JSON.stringify({
                name: user.displayName || email.split('@')[0],
                email: user.email,
                photo: user.photoURL || ''
            }));

            window.location.href = '../index.html';
        } catch (error) {
            alert("Помилка входу! Перевірте логін та пароль.");
        }
    });
}

if (phoneBtn) {
    phoneBtn.addEventListener('click', (e) => {
        e.preventDefault();
        alert("Модуль SMS знаходиться в стадії інтеграції. Будь ласка, використовуйте Google або Email.");
    });
}