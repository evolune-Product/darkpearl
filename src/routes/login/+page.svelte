<script lang="ts">
	import { goto } from "$app/navigation"
	import { onMount } from "svelte"
	import { auth } from "$lib/pocketbase.svelte"
	import Footer from "$lib/components/Footer.svelte"
	import { Loader2 } from "lucide-svelte"

	let email = $state("")
	let password = $state("")
	let is_submitting = $state(false)
	let is_google_loading = $state(false)
	let is_checking = $state(true)
	let error = $state<string | null>(null)

	onMount(async () => {
		// Check if setup is needed first
		try {
			const res = await fetch("/api/setup")
			const data = await res.json()

			if (data.needs_setup) {
				goto("/setup")
				return
			}
		} catch (err) {
			// If check fails, continue to login
		}
		is_checking = false
	})

	async function handle_submit(e: Event) {
		e.preventDefault()
		error = null
		is_submitting = true

		try {
			await auth.login(email, password)

			// Also save credentials for server-side auth (handles token expiry)
			// This is fire-and-forget - don't block login on it
			fetch("/api/auth/save-server-credentials", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ email, password })
			}).catch(() => {})

			goto("/darkpearl")
		} catch (err: any) {
			error = err.message || "Login failed. Please check your credentials."
		} finally {
			is_submitting = false
		}
	}

	async function handle_google_login() {
		error = null
		is_google_loading = true

		try {
			await auth.loginWithGoogle()
			goto("/darkpearl")
		} catch (err: any) {
			error = err.message || "Google login failed. Make sure Google OAuth is configured in Pocketbase."
		} finally {
			is_google_loading = false
		}
	}
</script>

<svelte:head>
	<title>Login - darkpearl</title>
</svelte:head>

<div class="min-h-screen flex flex-col safe-area-top safe-area-bottom relative overflow-hidden"
	style="background: linear-gradient(135deg, #080812 0%, #0a0a14 50%, #0d0d1a 100%);">

	<!-- Background image with pearl -->
	<div class="absolute inset-0 flex items-center justify-center pointer-events-none">
		<img
			src="/dark_pearl.png"
			alt=""
			class="w-[600px] h-[600px] object-contain opacity-40"
			style="filter: blur(1px);"
		/>
	</div>

	<!-- Animated glow effects -->
	<div class="absolute inset-0 pointer-events-none overflow-hidden">
		<div class="absolute top-1/4 left-1/4 w-96 h-96 rounded-full opacity-20 animate-pulse"
			style="background: radial-gradient(circle, #a855f7 0%, transparent 70%); filter: blur(80px);"></div>
		<div class="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full opacity-20 animate-pulse"
			style="background: radial-gradient(circle, #06b6d4 0%, transparent 70%); filter: blur(80px); animation-delay: 1s;"></div>
	</div>

	<!-- Main content area -->
	<div class="flex-1 flex items-center justify-center p-4">
		{#if is_checking}
			<div class="flex flex-col items-center gap-3 z-10">
				<Loader2 class="w-8 h-8 text-purple-400 animate-spin" />
			</div>
		{:else}
		<!-- Glassmorphic card -->
		<div class="w-full max-w-sm z-10">
			<div class="backdrop-blur-xl rounded-2xl p-8 border shadow-2xl"
				style="background: rgba(20, 20, 35, 0.7); border-color: rgba(168, 85, 247, 0.2); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05);">

				<!-- Logo section -->
				<div class="text-center mb-8">
					<a href="/" class="inline-block group">
						<div class="flex justify-center mb-4">
							<img src="/dark_pearl.png" alt="darkpearl" class="w-20 h-20 object-contain group-hover:scale-105 transition-transform" />
						</div>
						<h1 class="text-2xl font-semibold text-white group-hover:text-purple-300 transition-colors">darkpearl</h1>
					</a>
					<p class="text-sm text-gray-400 mt-1">Sign in to your account</p>
				</div>

				<!-- Login Form -->
				<form onsubmit={handle_submit} class="space-y-4">
					{#if error}
						<div class="p-3 rounded-lg text-red-300 text-sm"
							style="background: rgba(239, 68, 68, 0.15); border: 1px solid rgba(239, 68, 68, 0.3);">
							{error}
						</div>
					{/if}

					<div>
						<label for="email" class="block text-sm font-medium text-gray-300 mb-1.5">
							Email
						</label>
						<input
							id="email"
							type="email"
							bind:value={email}
							required
							disabled={is_submitting}
							class="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 transition-all"
							style="background: rgba(30, 30, 50, 0.6); border: 1px solid rgba(168, 85, 247, 0.2);"
							placeholder="you@example.com"
						/>
					</div>

					<div>
						<label for="password" class="block text-sm font-medium text-gray-300 mb-1.5">
							Password
						</label>
						<input
							id="password"
							type="password"
							bind:value={password}
							required
							disabled={is_submitting}
							class="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 transition-all"
							style="background: rgba(30, 30, 50, 0.6); border: 1px solid rgba(168, 85, 247, 0.2);"
							placeholder="••••••••"
						/>
					</div>

					<button
						type="submit"
						disabled={is_submitting || is_google_loading}
						class="w-full py-3 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98]"
						style="background: linear-gradient(135deg, #a855f7 0%, #06b6d4 100%); box-shadow: 0 4px 20px rgba(168, 85, 247, 0.4);"
					>
						{#if is_submitting}
							<Loader2 class="w-4 h-4 animate-spin" />
							Signing in...
						{:else}
							Sign in
						{/if}
					</button>
				</form>

				<!-- Divider -->
				<div class="flex items-center gap-3 my-6">
					<div class="flex-1 h-px" style="background: rgba(168, 85, 247, 0.2);"></div>
					<span class="text-sm text-gray-500">or</span>
					<div class="flex-1 h-px" style="background: rgba(168, 85, 247, 0.2);"></div>
				</div>

				<!-- Google Sign In -->
				<button
					type="button"
					onclick={handle_google_login}
					disabled={is_submitting || is_google_loading}
					class="w-full py-3 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3 transition-all hover:scale-[1.02] active:scale-[0.98]"
					style="background: rgba(30, 30, 50, 0.6); border: 1px solid rgba(168, 85, 247, 0.3);"
				>
					{#if is_google_loading}
						<Loader2 class="w-4 h-4 animate-spin" />
						Connecting...
					{:else}
						<svg class="w-5 h-5" viewBox="0 0 24 24">
							<path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
							<path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
							<path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
							<path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
						</svg>
						Continue with Google
					{/if}
				</button>

				<p class="mt-6 text-center text-sm text-gray-400">
					Don't have an account?
					<a href="/register" class="text-purple-400 hover:text-purple-300 transition-colors">Sign up</a>
				</p>

				<p class="mt-3 text-center text-sm text-gray-500">
					<a href="/" class="hover:text-gray-400 transition-colors">Learn more about darkpearl</a>
				</p>
			</div>
		</div>
		{/if}
	</div>

	<!-- Footer -->
	<Footer />
</div>

<style>
	@keyframes pulse {
		0%, 100% { opacity: 0.2; }
		50% { opacity: 0.3; }
	}

	.animate-pulse {
		animation: pulse 4s ease-in-out infinite;
	}
</style>
