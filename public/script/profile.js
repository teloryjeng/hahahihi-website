// script/profile.js

document.addEventListener('DOMContentLoaded', () => {
    const userStr = localStorage.getItem('user');
    if (!userStr) {
        // Jika belum login, tendang ke signin
        window.location.href = 'signin.html';
        return;
    }

    const user = JSON.parse(userStr);
    const profileNameInput = document.getElementById('profileName');
    const profileEmailInput = document.getElementById('profileEmail');

    // Tampilkan data saat ini
    if (profileNameInput) profileNameInput.value = user.name;
    if (profileEmailInput) profileEmailInput.value = user.email;

    // --- Logika Update Username ---
    const profileForm = document.getElementById('profileForm');
    if (profileForm) {
        profileForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const newName = profileNameInput.value.trim();

            if (!newName) {
                showOverlay('Username cannot be empty', false);
                return;
            }

            // Jika nama sama, tidak perlu update
            if (newName === user.name) {
                showOverlay('There is no change in your username.', false);
                return;
            }

            try {
                const response = await fetch('http://localhost:3000/api/auth/update-name', {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json'
                    },
                    body: JSON.stringify({
                        user_id: user.id,
                        new_name: newName
                    })
                });

                const data = await response.json();

                if (response.ok) {
                    // Update data di localStorage agar header ikut berubah
                    user.name = newName;
                    localStorage.setItem('user', JSON.stringify(user));
                    showOverlay('Username has been successfully updated!', true, 'profile.html');
                } else {
                    showOverlay('Failed to update username: ' + (data.error || 'An error occurred'), false);
                }
            } catch (err) {
                console.error('Error updating profile:', err);
                showOverlay('An error occurred while contacting the server.', false);
            }
        });
    }

    // --- Logika Ganti Password ---
    const passwordForm = document.getElementById('passwordForm');
    if (passwordForm) {
        passwordForm.addEventListener('submit', async (e) => {
            e.preventDefault();
            const currentPassword = document.getElementById('currentPassword').value;
            const newPassword = document.getElementById('newPassword').value;
            const confirmNewPassword = document.getElementById('confirmNewPassword').value;

            if (newPassword !== confirmNewPassword) {
                showOverlay("New password and confirmation do not match.", false);
                return;
            }

            if (newPassword.length < 6) {
                showOverlay("New password must be at least 6 characters long.", false);
                return;
            }

            try {
                const response = await fetch('http://localhost:3000/api/auth/change-password', {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify({
                        user_id: user.id,
                        current_password: currentPassword,
                        new_password: newPassword
                    })
                });

                const data = await response.json();
                if (response.ok) {
                    showOverlay("Password has been successfully updated!", true);
                    passwordForm.reset();
                } else {
                    showOverlay(data.error || "Failed to update password.", false);
                }
            } catch (err) {
                console.error(err);
                showOverlay("An error occurred while contacting the server.", false);
            }
        });
    }

    // --- Logika Hapus Akun ---
    const deleteBtn = document.getElementById('deleteAccountBtn');
    if (deleteBtn) {
        deleteBtn.addEventListener('click', () => {
            showOverlay(
                'WARNING: Are you sure you want to permanently delete this account? All your data including your cart will be lost.',
                false,
                null,
                true,
                async () => {
                    try {
                        const response = await fetch(`http://localhost:3000/api/auth/delete-account/${user.id}`, {
                            method: 'DELETE'
                        });

                        if (response.ok) {
                            // Hapus data lokal dan pindah ke home
                            localStorage.removeItem('user');
                            showOverlay('Your account has been successfully deleted.', true, 'index.html');
                        } else {
                            const data = await response.json();
                            showOverlay('Failed to delete account: ' + (data.error || 'An error occurred'), false);
                        }
                    } catch (err) {
                        console.error('Error deleting account:', err);
                        showOverlay('An error occurred while contacting the server.', false);
                    }
                }
            );
        });
    }
});
