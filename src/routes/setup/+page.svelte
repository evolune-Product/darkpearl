<script lang="ts">
	import { goto } from "$app/navigation";
	import { onMount } from "svelte";
	import { Loader2 } from "lucide-svelte";
	import { auth } from "$lib/pocketbase.svelte";

	let email = $state("");
	let password = $state("");
	let confirm_password = $state("");
	let is_submitting = $state(false);
	let is_checking = $state(true);
	let error = $state<string | null>(null);

	onMount(async () => {
		// Check if setup is needed
		try {
			const res = await fetch("/api/setup");
			const data = await res.json();

			if (!data.needs_setup) {
				// Setup already done, redirect to login
				goto("/login");
				return;
			}
		} catch (err) {
			// If check fails, show setup anyway
		}
		is_checking = false;
	});

	async function handle_submit(e: Event) {
		e.preventDefault();
		error = null;

		if (password !== confirm_password) {
			error = "Passwords do not match";
			return;
		}

		if (password.length < 8) {
			error = "Password must be at least 8 characters";
			return;
		}

		is_submitting = true;

		try {
			const res = await fetch("/api/setup", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					email,
					password
				}),
			});

			const data = await res.json();

			if (!res.ok) {
				throw new Error(data.error || "Setup failed");
			}

			// Setup complete, auto-login with the same credentials
			await auth.login(email, password);
			goto("/darkpearl");
		} catch (err: any) {
			error = err.message || "Setup failed. Please try again.";
		} finally {
			is_submitting = false;
		}
	}
</script>

<svelte:head>
	<title>Setup - darkpearl</title>
</svelte:head>

<div class="min-h-screen flex items-center justify-center p-4 relative overflow-hidden"
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

	{#if is_checking}
		<div class="flex flex-col items-center gap-3 z-10">
			<Loader2 class="w-8 h-8 text-purple-400 animate-spin" />
			<p class="text-sm text-gray-400">Checking setup status...</p>
		</div>
	{:else}
		<!-- Glassmorphic card -->
		<div class="w-full max-w-sm z-10">
			<div class="backdrop-blur-xl rounded-2xl p-8 border shadow-2xl"
				style="background: rgba(20, 20, 35, 0.7); border-color: rgba(168, 85, 247, 0.2); box-shadow: 0 8px 32px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05);">

				<!-- Welcome section -->
				<div class="text-center mb-8">
					<div class="flex justify-center mb-4">
						<img src="/dark_pearl.png" alt="darkpearl" class="w-20 h-20 object-contain" />
					</div>
					<h1 class="text-2xl font-semibold text-white">Welcome to darkpearl</h1>
					<p class="text-sm text-gray-400 mt-2">Create your admin account to get started</p>
				</div>

				<!-- Setup Form -->
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
							minlength={8}
							disabled={is_submitting}
							class="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 transition-all"
							style="background: rgba(30, 30, 50, 0.6); border: 1px solid rgba(168, 85, 247, 0.2);"
							placeholder="••••••••"
						/>
						<p class="text-xs text-gray-500 mt-1">Minimum 8 characters</p>
					</div>

					<div>
						<label for="confirm_password" class="block text-sm font-medium text-gray-300 mb-1.5">
							Confirm Password
						</label>
						<input
							id="confirm_password"
							type="password"
							bind:value={confirm_password}
							required
							minlength={8}
							disabled={is_submitting}
							class="w-full px-4 py-3 rounded-xl text-white placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-purple-500/50 disabled:opacity-50 transition-all"
							style="background: rgba(30, 30, 50, 0.6); border: 1px solid rgba(168, 85, 247, 0.2);"
							placeholder="••••••••"
						/>
					</div>

					<button
						type="submit"
						disabled={is_submitting}
						class="w-full py-3 rounded-xl text-white font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 transition-all hover:scale-[1.02] active:scale-[0.98] mt-6"
						style="background: linear-gradient(135deg, #a855f7 0%, #06b6d4 100%); box-shadow: 0 4px 20px rgba(168, 85, 247, 0.4);"
					>
						{#if is_submitting}
							<Loader2 class="w-4 h-4 animate-spin" />
							Setting up...
						{:else}
							Complete Setup
						{/if}
					</button>
				</form>

				<p class="mt-6 text-center text-xs text-gray-500">
					This will create your admin account and configure the server.
				</p>
			</div>
		</div>
	{/if}
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
