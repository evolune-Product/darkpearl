<script lang="ts">
	import { onMount } from 'svelte'
	import * as Dialog from '$lib/components/ui/dialog'
	import { Button } from '$lib/components/ui/button'
	import { Input } from '$lib/components/ui/input'
	import { Github, Loader2, Plus, Check } from 'lucide-svelte'
	import { github_store } from '$lib/stores/github.svelte'
	import { pb } from '$lib/pocketbase.svelte'
	import type { GitHubRepo } from '../../types'

	let { open = $bindable(false), project_id, onlinked }: {
		open: boolean
		project_id: string
		onlinked?: (repo: { full_name: string; owner: string; name: string }) => void
	} = $props()

	let repos = $state<GitHubRepo[]>([])
	let is_loading = $state(true)
	let is_linking = $state(false)
	let selected_repo = $state<string | null>(null)
	let show_create = $state(false)
	let new_repo_name = $state('')
	let is_creating = $state(false)
	let error = $state<string | null>(null)

	onMount(async () => {
		if (!github_store.is_connected) {
			await github_store.check_status()
		}
		if (github_store.is_connected) {
			repos = await github_store.load_repos()
		}
		is_loading = false
	})

	async function link_repo(repo_full_name: string) {
		is_linking = true
		error = null
		try {
			const response = await fetch(`/api/projects/${project_id}/github/link`, {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${pb.authStore.token}`
				},
				body: JSON.stringify({ repo_full_name })
			})
			const data = await response.json()
			if (data.success) {
				onlinked?.(data.github_repo)
				open = false
			} else {
				error = data.error
			}
		} catch (err: any) {
			error = err.message
		} finally {
			is_linking = false
		}
	}

	async function create_and_link() {
		if (!new_repo_name.trim()) return
		is_creating = true
		error = null
		try {
			const response = await fetch('/api/github/repos', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					'Authorization': `Bearer ${pb.authStore.token}`
				},
				body: JSON.stringify({ name: new_repo_name, private: true })
			})
			const repo = await response.json()
			if (repo.error) {
				error = repo.error
				return
			}
			await link_repo(repo.full_name)
		} catch (err: any) {
			error = err.message
		} finally {
			is_creating = false
		}
	}
</script>

<Dialog.Root bind:open>
	<Dialog.Content class="max-w-md">
		<Dialog.Header>
			<Dialog.Title class="flex items-center gap-2">
				<Github size={20} />
				Link to GitHub Repository
			</Dialog.Title>
		</Dialog.Header>

		{#if !github_store.is_connected}
			<div class="py-8 text-center">
				<p class="text-[var(--builder-text-secondary)] mb-4">Connect GitHub first in Settings</p>
				<Button onclick={() => window.location.href = '/darkpearl/settings'}>
					Go to Settings
				</Button>
			</div>
		{:else if is_loading}
			<div class="py-8 flex justify-center">
				<Loader2 class="animate-spin" />
			</div>
		{:else}
			{#if error}
				<div class="mb-4 p-3 bg-red-500/10 border border-red-500/30 rounded text-red-400 text-sm">
					{error}
				</div>
			{/if}

			{#if show_create}
				<div class="space-y-4">
					<Input
						bind:value={new_repo_name}
						placeholder="repository-name"
						disabled={is_creating}
					/>
					<div class="flex gap-2">
						<Button variant="outline" onclick={() => show_create = false} disabled={is_creating}>
							Cancel
						</Button>
						<Button onclick={create_and_link} disabled={is_creating || !new_repo_name.trim()}>
							{#if is_creating}
								<Loader2 size={14} class="animate-spin mr-2" />
							{/if}
							Create & Link
						</Button>
					</div>
				</div>
			{:else}
				<div class="space-y-2 max-h-64 overflow-y-auto">
					{#each repos as repo}
						<button
							type="button"
							class="w-full p-3 text-left rounded border transition-colors {selected_repo === repo.full_name ? 'border-[var(--builder-accent)] bg-[var(--builder-accent)]/10' : 'border-[var(--builder-border)] hover:border-[var(--builder-accent)]/50'}"
							onclick={() => selected_repo = repo.full_name}
						>
							<div class="font-medium text-sm">{repo.name}</div>
							<div class="text-xs text-[var(--builder-text-secondary)]">{repo.owner.login}</div>
						</button>
					{/each}
				</div>

				<div class="flex gap-2 mt-4">
					<Button variant="outline" onclick={() => show_create = true}>
						<Plus size={14} class="mr-1" />
						New Repo
					</Button>
					<Button
						onclick={() => selected_repo && link_repo(selected_repo)}
						disabled={!selected_repo || is_linking}
						class="flex-1"
					>
						{#if is_linking}
							<Loader2 size={14} class="animate-spin mr-2" />
						{/if}
						Link Selected
					</Button>
				</div>
			{/if}
		{/if}
	</Dialog.Content>
</Dialog.Root>
