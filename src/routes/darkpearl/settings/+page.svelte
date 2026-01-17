<script lang="ts">
	import { onMount } from 'svelte'
	import { page } from '$app/stores'
	import { Button } from '$lib/components/ui/button'
	import { Github, Check, X, Loader2, ExternalLink, Unplug } from 'lucide-svelte'
	import { github_store } from '$lib/stores/github.svelte'

	let is_loading = $state(true)
	let success_message = $state<string | null>(null)
	let error_message = $state<string | null>(null)

	onMount(async () => {
		// Check URL params for OAuth result
		const github_success = $page.url.searchParams.get('github_success')
		const github_error = $page.url.searchParams.get('github_error')

		if (github_success) {
			success_message = 'GitHub connected successfully!'
			// Clean URL
			window.history.replaceState({}, '', '/darkpearl/settings')
		}
		if (github_error) {
			error_message = `GitHub error: ${github_error}`
			window.history.replaceState({}, '', '/darkpearl/settings')
		}

		await github_store.check_status()
		is_loading = false
	})

	function connect_github() {
		window.location.href = '/api/auth/github'
	}

	async function disconnect_github() {
		await github_store.disconnect()
		success_message = 'GitHub disconnected'
	}
</script>

<svelte:head>
	<title>Settings | darkpearl</title>
</svelte:head>

<div class="min-h-screen bg-[var(--builder-bg-primary)] text-[var(--builder-text-primary)]">
	<div class="max-w-2xl mx-auto p-8">
		<div class="mb-8">
			<a href="/darkpearl/dashboard" class="text-sm text-[var(--builder-text-secondary)] hover:text-[var(--builder-text-primary)]">
				&larr; Back to Dashboard
			</a>
		</div>

		<h1 class="text-2xl font-bold mb-8">Settings</h1>

		{#if success_message}
			<div class="mb-6 p-4 bg-green-500/10 border border-green-500/30 rounded-lg flex items-center gap-2">
				<Check size={18} class="text-green-500" />
				<span class="text-green-400">{success_message}</span>
			</div>
		{/if}

		{#if error_message}
			<div class="mb-6 p-4 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2">
				<X size={18} class="text-red-500" />
				<span class="text-red-400">{error_message}</span>
			</div>
		{/if}

		<!-- GitHub Integration -->
		<section class="bg-[var(--builder-bg-secondary)] rounded-lg p-6 mb-6">
			<div class="flex items-center gap-3 mb-4">
				<Github size={24} />
				<h2 class="text-lg font-semibold">GitHub Integration</h2>
			</div>

			<p class="text-sm text-[var(--builder-text-secondary)] mb-6">
				Connect your GitHub account to push and pull code from repositories.
			</p>

			{#if is_loading}
				<div class="flex items-center gap-2 text-[var(--builder-text-secondary)]">
					<Loader2 size={16} class="animate-spin" />
					<span>Checking connection...</span>
				</div>
			{:else if github_store.is_connected}
				<div class="flex items-center justify-between">
					<div class="flex items-center gap-3">
						{#if github_store.avatar_url}
							<img src={github_store.avatar_url} alt="" class="w-10 h-10 rounded-full" />
						{/if}
						<div>
							<div class="font-medium">{github_store.username}</div>
							<div class="text-xs text-green-400 flex items-center gap-1">
								<Check size={12} />
								Connected
							</div>
						</div>
					</div>
					<Button variant="outline" size="sm" onclick={disconnect_github}>
						<Unplug size={14} class="mr-2" />
						Disconnect
					</Button>
				</div>
			{:else}
				<Button onclick={connect_github}>
					<Github size={16} class="mr-2" />
					Connect GitHub
				</Button>
			{/if}
		</section>

		<!-- LLM Info -->
		<section class="bg-[var(--builder-bg-secondary)] rounded-lg p-6">
			<h2 class="text-lg font-semibold mb-4">LLM Configuration</h2>
			<p class="text-sm text-[var(--builder-text-secondary)]">
				LLM settings are configured via environment variables. Set <code class="bg-[var(--builder-bg-tertiary)] px-1 rounded">LLM_PROVIDER</code>,
				<code class="bg-[var(--builder-bg-tertiary)] px-1 rounded">LLM_API_KEY</code>, and
				<code class="bg-[var(--builder-bg-tertiary)] px-1 rounded">LLM_MODEL</code> in your <code class="bg-[var(--builder-bg-tertiary)] px-1 rounded">.env</code> file.
			</p>
		</section>
	</div>
</div>
