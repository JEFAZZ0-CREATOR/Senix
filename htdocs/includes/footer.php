<?php
/**
 * ==========================================================
 * Senix v2.0 — Footer global
 * ==========================================================
 */
?>
</main>

<footer class="site-footer">
    <div class="footer-grid">
        <div class="footer-col">
            <div class="footer-logo">SENIX</div>
            <p class="footer-desc">
                Aprende lengua de señas con inteligencia artificial. 
                Detección en tiempo real de gestos con MediaPipe Hands.
            </p>
            <div class="footer-social">
                <a href="#" aria-label="Facebook">📘</a>
                <a href="#" aria-label="Twitter">🐦</a>
                <a href="#" aria-label="Instagram">📷</a>
                <a href="#" aria-label="YouTube">📺</a>
            </div>
        </div>
        
        <div class="footer-col">
            <h4>Aprender</h4>
            <ul>
                <li><a href="<?= APP_URL ?>/dictionary.php">Abecedario</a></li>
                <li><a href="<?= APP_URL ?>/words.php">Diccionario</a></li>
                <li><a href="<?= APP_URL ?>/lessons.php">Lecciones</a></li>
                <li><a href="<?= APP_URL ?>/practice.php">Práctica libre</a></li>
                <li><a href="<?= APP_URL ?>/simulator.php">Simulador</a></li>
            </ul>
        </div>
        
        <div class="footer-col">
            <h4>Comunidad</h4>
            <ul>
                <li><a href="<?= APP_URL ?>/ranking.php">Ranking</a></li>
                <li><a href="<?= APP_URL ?>/achievements.php">Logros</a></li>
                <li><a href="<?= APP_URL ?>/tournament.php">Torneos</a></li>
                <li><a href="<?= APP_URL ?>/chat-ai.php">Asistente IA</a></li>
            </ul>
        </div>
        
        <div class="footer-col">
            <h4>Soporte</h4>
            <ul>
                <li><a href="<?= APP_URL ?>/docs/README.md">Ayuda</a></li>
                <li><a href="<?= APP_URL ?>/docs/API.md">Documentación</a></li>
                <li><a href="mailto:soporte@senix.unaux.com">Contacto</a></li>
                <li><a href="<?= APP_URL ?>/terms.php">Términos</a></li>
                <li><a href="<?= APP_URL ?>/privacy.php">Privacidad</a></li>
            </ul>
        </div>
    </div>
    
    <div class="footer-bottom">
        <p>© <?= date('Y') ?> Senix v<?= APP_VERSION ?>. Todos los derechos reservados.</p>
        <p class="footer-tagline">⌁ Hecho con IA para un mundo más inclusivo ⌁</p>
    </div>
</footer>

<script>
    // Config global
    window.SENIX_CONFIG = window.SENIX_CONFIG || {};
</script>

<!-- JS Core -->
<script src="<?= asset('js/core/config.js') ?>"></script>
<script src="<?= asset('js/core/storage.js') ?>"></script>
<script src="<?= asset('js/core/state.js') ?>"></script>
<script src="<?= asset('js/core/events.js') ?>"></script>
<script src="<?= asset('js/ui/ui.js') ?>"></script>
<script src="<?= asset('js/ui/toast.js') ?>"></script>
<script src="<?= asset('js/ui/modal.js') ?>"></script>
<script src="<?= asset('js/ui/particles.js') ?>"></script>
<script src="<?= asset('js/api/api.js') ?>"></script>
<script src="<?= asset('js/main.js') ?>"></script>

<?php if (isset($extraJS)): foreach ((array)$extraJS as $js): ?>
    <script src="<?= asset('js/' . $js) ?>"></script>
<?php endforeach; endif; ?>

<?php if (isLoggedIn()): ?>
<script src="<?= asset('js/notifications.js') ?>"></script>
<?php endif; ?>

<script>
// User dropdown toggle
function toggleUserMenu() {
    const menu = document.getElementById('user-dropdown-menu');
    if (menu) menu.classList.toggle('active');
}

document.addEventListener('click', function(e) {
    const dropdown = document.querySelector('.user-dropdown');
    const menu = document.getElementById('user-dropdown-menu');
    if (dropdown && menu && !dropdown.contains(e.target)) {
        menu.classList.remove('active');
    }
});

// Registrar service worker
if ('serviceWorker' in navigator) {
    window.addEventListener('load', function() {
        navigator.serviceWorker.register('/service-worker.js').catch(function(err) {
            console.warn('[PWA] SW no registrado:', err);
        });
    });
}
</script>
</body>
</html>
