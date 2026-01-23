<script lang="ts">
	import { goto } from "$app/navigation"
	import { onMount } from "svelte"
	import { auth, pb } from "$lib/pocketbase.svelte"
	import Footer from "$lib/components/Footer.svelte"
	import { Loader2 } from "lucide-svelte"

	let email = $state("")
	let password = $state("")
	let confirm_password = $state("")
	let name = $state("")
	let is_submitting = $state(false)
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
			// If check fails, continue
		}
		is_checking = false
	})

	async function handle_submit(e: Event) {
		e.preventDefault()
		error = null

		if (password !== confirm_password) {
			error = "Passwords do not match"
			return
		}

		if (password.length < 8) {
			error = "Password must be at least 8 characters"
			return
		}

		is_submitting = true

		try {
			// Create the user account
			await pb.collection("users").create({
				email,
				password,
				passwordConfirm: password,
				name: name || undefined
			})

			// Auto-login after registration
			await auth.login(email, password)
			goto("/darkpearl")
		} catch (err: any) {
			const message = err?.response?.data?.email?.message
				|| err?.response?.data?.password?.message
				|| err?.response?.message
				|| err?.message
				|| "Registration failed. Please try again."
			error = message
		} finally {
			is_submitting = false
		}
	}
</script>

<svelte:head>
	<title>Register - darkpearl</title>
</svelte:head>

<div class="min-h-screen bg-[var(--builder-bg-primary)] flex items-center justify-center p-4 pb-32 safe-area-top safe-area-bottom relative">
	{#if is_checking}
		<div class="flex flex-col items-center gap-3">
			<Loader2 class="w-8 h-8 text-[var(--builder-accent)] animate-spin" />
		</div>
	{:else}
	<div class="w-full max-w-sm">
		<!-- Logo -->
		<div class="text-center mb-8">
			<h1 class="text-2xl font-semibold text-[var(--builder-text-primary)]">darkpearl</h1>
			<p class="text-sm text-[var(--builder-text-secondary)] mt-1">Create your account</p>
		</div>

		<!-- Registration Form -->
		<form onsubmit={handle_submit} class="space-y-4">
			{#if error}
				<div class="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-red-400 text-sm">
					{error}
				</div>
			{/if}

			<div>
				<label for="name" class="block text-sm font-medium text-[var(--builder-text-secondary)] mb-1.5">
					Name <span class="text-[var(--builder-text-muted)]">(optional)</span>
				</label>
				<input
					id="name"
					type="text"
					bind:value={name}
					disabled={is_submitting}
					class="w-full px-3 py-2 bg-[var(--builder-bg-secondary)] border border-[var(--builder-border)] rounded-lg text-[var(--builder-text-primary)] placeholder-[var(--builder-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--builder-accent)] focus:border-transparent disabled:opacity-50"
					placeholder="Your name"
				/>
			</div>

			<div>
				<label for="email" class="block text-sm font-medium text-[var(--builder-text-secondary)] mb-1.5">
					Email
				</label>
				<input
					id="email"
					type="email"
					bind:value={email}
					required
					disabled={is_submitting}
					class="w-full px-3 py-2 bg-[var(--builder-bg-secondary)] border border-[var(--builder-border)] rounded-lg text-[var(--builder-text-primary)] placeholder-[var(--builder-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--builder-accent)] focus:border-transparent disabled:opacity-50"
					placeholder="you@example.com"
				/>
			</div>

			<div>
				<label for="password" class="block text-sm font-medium text-[var(--builder-text-secondary)] mb-1.5">
					Password
				</label>
				<input
					id="password"
					type="password"
					bind:value={password}
					required
					minlength={8}
					disabled={is_submitting}
					class="w-full px-3 py-2 bg-[var(--builder-bg-secondary)] border border-[var(--builder-border)] rounded-lg text-[var(--builder-text-primary)] placeholder-[var(--builder-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--builder-accent)] focus:border-transparent disabled:opacity-50"
					placeholder="••••••••"
				/>
				<p class="text-xs text-[var(--builder-text-muted)] mt-1">Minimum 8 characters</p>
			</div>

			<div>
				<label for="confirm_password" class="block text-sm font-medium text-[var(--builder-text-secondary)] mb-1.5">
					Confirm Password
				</label>
				<input
					id="confirm_password"
					type="password"
					bind:value={confirm_password}
					required
					minlength={8}
					disabled={is_submitting}
					class="w-full px-3 py-2 bg-[var(--builder-bg-secondary)] border border-[var(--builder-border)] rounded-lg text-[var(--builder-text-primary)] placeholder-[var(--builder-text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--builder-accent)] focus:border-transparent disabled:opacity-50"
					placeholder="••••••••"
				/>
			</div>

			<button
				type="submit"
				disabled={is_submitting}
				class="w-full py-2.5 bg-[var(--builder-accent)] text-white rounded-lg hover:bg-[var(--builder-accent-hover)] transition-colors font-medium disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
			>
				{#if is_submitting}
					<Loader2 class="w-4 h-4 animate-spin" />
					Creating account...
				{:else}
					Create Account
				{/if}
			</button>
		</form>

		<p class="mt-6 text-center text-sm text-[var(--builder-text-secondary)]">
			Already have an account?
			<a href="/login" class="text-[var(--builder-accent)] hover:underline">Sign in</a>
		</p>

		<p class="mt-3 text-center text-sm text-[var(--builder-text-muted)]">
			<a href="/" class="hover:text-[var(--builder-text-secondary)] transition-colors">Learn more about darkpearl</a>
		</p>
	</div>
	{/if}

	<!-- Footer -->
	<div class="absolute bottom-0 left-0 right-0">
		<Footer />
	</div>
</div>
