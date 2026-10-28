<?php
require_once __DIR__ . '/config.php';

// Check user login session
$is_logged_in = isset($_SESSION['user_id']);
$user_balance = 0;
$username = '';

if ($is_logged_in) {
    try {
        $stmt = $conn->prepare("SELECT username, wallet_balance FROM users WHERE id = ?");
        $stmt->execute([$_SESSION['user_id']]);
        $user_data = $stmt->fetch();
        if ($user_data) {
            $user_balance = $user_data['wallet_balance'];
            $username = $user_data['username'];
        }
    } catch (PDOException $e) {
        // Handle quietly
    }
}
?>
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
    <title>ARTIFICIAL SAMARAJYA eSPORTS</title>
    <!-- Tailwind CSS -->
    <script src="https://cdn.tailwindcss.com"></script>
    <!-- Font Awesome Icons -->
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.4.0/css/all.min.css">
    <style>
        body {
            user-select: none;
            -webkit-user-select: none;
            touch-action: manipulation;
        }
    </style>
    <script>
        // Disable right-click, text selection, and zoom scaling as requested for mobile app wrapper feel
        document.addEventListener('contextmenu', e => e.preventDefault());
        document.addEventListener('selectstart', e => e.preventDefault());
        document.addEventListener('touchstart', e => {
            if (e.touches.length > 1) e.preventDefault();
        }, { passive: false });
    </script>
</head>
<body class="bg-gray-950 text-gray-100 min-h-screen font-sans flex flex-col pb-24">

<div class="w-full max-w-md mx-auto min-h-screen bg-gray-950 border-x border-gray-900/60 shadow-2xl flex flex-col relative">
    
    <!-- Top Header (Header.php) -->
    <header class="sticky top-0 z-40 bg-gray-950/90 backdrop-blur-md border-b border-gray-900 px-4 py-3.5 flex items-center justify-between">
        <div class="flex items-center gap-2">
            <div class="p-1.5 bg-gradient-to-r from-cyan-500 to-cyan-600 rounded-lg text-slate-950 flex items-center justify-center">
                <i class="fa-solid fa-gamepad text-sm text-gray-950"></i>
            </div>
            <div>
                <h1 class="text-xs font-bold text-white uppercase tracking-wider leading-none">
                    Artificial Samrajya
                </h1>
                <span class="text-[9px] text-cyan-400 font-mono tracking-widest font-bold uppercase block mt-0.5">
                    eSPORTS ARENA
                </span>
            </div>
        </div>

        <?php if ($is_logged_in): ?>
        <a href="wallet.php" class="flex items-center gap-2 bg-gray-900 hover:bg-gray-850 px-3.5 py-1 rounded-full border border-gray-800 transition-all">
            <i class="fa-solid fa-wallet text-cyan-400 text-xs"></i>
            <span class="text-xs font-bold text-white">₹<?php echo number_format($user_balance, 2); ?></span>
        </a>
        <?php else: ?>
        <a href="login.php" class="text-xs bg-cyan-500 hover:bg-cyan-400 text-gray-950 font-bold px-3 py-1 rounded-full transition-all">
            Login
        </a>
        <?php endif; ?>
    </header>

    <!-- Main Content Container -->
    <main class="flex-1 p-4 overflow-y-auto">
