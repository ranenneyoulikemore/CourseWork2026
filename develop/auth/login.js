import { auth, provider, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword } from '../../src/tools/firebase.js';

const googleLoginBtn = document.getElementById('googleLoginBtn');
const emailInput = document.getElementById('emailInput');
const passwordInput = document.getElementById('passwordInput');
const emailLoginBtn = document.getElementById('emailLoginBtn');
const emailRegisterBtn = document.getElementById('emailRegisterBtn');

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

            alert("Ви успішно увійшли через Google!");
            window.location.href = '../index.html';
        } catch (error) {
            alert("Помилка входу через Google.");
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

        const originalText = emailLoginBtn.innerText;
        emailLoginBtn.innerText = "Зачекайте...";
        emailLoginBtn.disabled = true;

        try {
            const result = await signInWithEmailAndPassword(auth, email, password);
            const user = result.user;
            
            localStorage.setItem('movieUser', JSON.stringify({
                name: user.displayName || email.split('@')[0],
                email: user.email,
                photo: user.photoURL || ''
            }));

            alert("Ви успішно авторизувалися!");
            window.location.href = '../index.html';
        } catch (error) {
            emailLoginBtn.innerText = originalText;
            emailLoginBtn.disabled = false;
            alert("Помилка входу! Перевірте логін та пароль.");
        }
    });
}

if (emailRegisterBtn) {
    emailRegisterBtn.addEventListener('click', async (e) => {
        e.preventDefault();

        const email = emailInput.value.trim();
        const password = passwordInput.value.trim();

        if (!email || !password) {
            alert("Будь ласка, заповніть усі поля!");
            return;
        }

        if (password.length < 6) {
            alert("Пароль має містити щонайменше 6 символів!");
            return;
        }

        const originalText = emailRegisterBtn.innerText;
        emailRegisterBtn.innerText = "Реєстрація...";
        emailRegisterBtn.disabled = true;

        try {
            const result = await createUserWithEmailAndPassword(auth, email, password);
            const user = result.user;

            localStorage.setItem('movieUser', JSON.stringify({
                name: email.split('@')[0],
                email: user.email,
                photo: ''
            }));

            alert("Реєстрація успішна! Виконуємо вхід...");
            window.location.href = '../index.html';
        } catch (error) {
            emailRegisterBtn.innerText = originalText;
            emailRegisterBtn.disabled = false;
            
            if (error.code === 'auth/email-already-in-use') {
                alert("Ця пошта вже зареєстрована! Натисніть кнопку 'Увійти'.");
            } else {
                alert("Помилка: щось пішло не так. Перевірте дані.");
            }
        }
    });
}
localStorage.setItem('movieUser', user.email);
