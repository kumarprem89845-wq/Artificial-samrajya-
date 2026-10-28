    </main> <!-- Closing main tag from header.php -->

    <!-- Fixed Bottom Navigation (Bottom.php) -->
    <?php if (isset($_SESSION['user_id'])): 
        $current_page = basename($_SERVER['PHP_SELF']);
    ?>
    <nav class="fixed bottom-0 left-0 right-0 max-w-md mx-auto bg-gray-950/95 backdrop-blur-md border-t border-gray-900 p-2 grid grid-cols-4 z-40">
        <a href="index.php" class="flex flex-col items-center justify-center py-1 rounded-xl transition-all <?php echo $current_page == 'index.php' ? 'text-cyan-400 font-bold' : 'text-gray-400 hover:text-white'; ?>">
            <i class="fa-solid fa-house text-lg mb-1 <?php echo $current_page == 'index.php' ? 'text-cyan-400' : 'text-gray-400'; ?>"></i>
            <span class="text-[10px] tracking-wide uppercase font-medium">Home</span>
        </a>
        <a href="my_tournaments.php" class="flex flex-col items-center justify-center py-1 rounded-xl transition-all <?php echo $current_page == 'my_tournaments.php' ? 'text-cyan-400 font-bold' : 'text-gray-400 hover:text-white'; ?>">
            <i class="fa-solid fa-trophy text-lg mb-1 <?php echo $current_page == 'my_tournaments.php' ? 'text-cyan-400' : 'text-gray-400'; ?>"></i>
            <span class="text-[10px] tracking-wide uppercase font-medium">Matches</span>
        </a>
        <a href="wallet.php" class="flex flex-col items-center justify-center py-1 rounded-xl transition-all <?php echo $current_page == 'wallet.php' ? 'text-cyan-400 font-bold' : 'text-gray-400 hover:text-white'; ?>">
            <i class="fa-solid fa-wallet text-lg mb-1 <?php echo $current_page == 'wallet.php' ? 'text-cyan-400' : 'text-gray-400'; ?>"></i>
            <span class="text-[10px] tracking-wide uppercase font-medium">Wallet</span>
        </a>
        <a href="profile.php" class="flex flex-col items-center justify-center py-1 rounded-xl transition-all <?php echo $current_page == 'profile.php' ? 'text-cyan-400 font-bold' : 'text-gray-400 hover:text-white'; ?>">
            <i class="fa-solid fa-user text-lg mb-1 <?php echo $current_page == 'profile.php' ? 'text-cyan-400' : 'text-gray-400'; ?>"></i>
            <span class="text-[10px] tracking-wide uppercase font-medium">Profile</span>
        </a>
    </nav>
    <?php endif; ?>

</div> <!-- Closing device container div from header.php -->

</body>
</html>
