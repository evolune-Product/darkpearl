<script lang="ts">
	import { Button } from '$lib/components/ui/button';
	import { Textarea } from '$lib/components/ui/textarea';
	import { pb } from '$lib/pocketbase.svelte';
	import { project_service } from '$lib/services/project.svelte';
	import { get_saved_theme, apply_builder_theme } from '$lib/builder_themes';
	import { onMount } from 'svelte';
	import { goto } from '$app/navigation';
	import { ArrowLeft, Upload, Image, Loader2, Sparkles, X, Copy, Check, Download, FileCode, FileText, Eye, Code, Info } from 'lucide-svelte';
	import * as DropdownMenu from '$lib/components/ui/dropdown-menu';

	// State
	let screenshot_file = $state<File | null>(null);
	let screenshot_preview = $state<string | null>(null);
	let description = $state('');
	let generated_code = $state('');
	let is_generating = $state(false);
	let error_message = $state('');
	let is_dragging = $state(false);
	let copied = $state(false);
	let is_authenticated = $state(false);
	let view_mode = $state<'code' | 'preview'>('code');

	// Generate preview HTML for iframe
	let preview_html = $derived.by(() => {
		if (!generated_code) return '';

		const styleTag = 'sty' + 'le';
		const scriptTag = 'scr' + 'ipt';
		const styleMatch = generated_code.match(new RegExp(`<${styleTag}[^>]*>([\\s\\S]*?)<\\/${styleTag}>`, 'i'));

		let template = generated_code
			.replace(new RegExp(`<${scriptTag}[^>]*>[\\s\\S]*?<\\/${scriptTag}>`, 'gi'), '')
			.replace(new RegExp(`<${styleTag}[^>]*>[\\s\\S]*?<\\/${styleTag}>`, 'gi'), '')
			.trim();

		const styles = styleMatch ? styleMatch[1] : '';

		return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<${'script'} src="https://cdn.tailwindcss.com"></${'script'}>
<${'style'}>
* { margin: 0; padding: 0; box-sizing: border-box; }
body { font-family: system-ui, -apple-system, sans-serif; min-height: 100vh; }
${styles}
</${'style'}>
</head>
<body>${template}</body>
</html>`;
	});

	// Apply theme and check auth on mount
	onMount(() => {
		const theme = get_saved_theme();
		apply_builder_theme(theme);

		// Check if user is authenticated
		if (!pb.authStore.isValid) {
			goto('/login');
			return;
		}
		is_authenticated = true;
	});

	// Handle file selection
	function handle_file_select(e: Event) {
		const input = e.target as HTMLInputElement;
		if (input.files && input.files[0]) {
			process_file(input.files[0]);
		}
	}

	// Handle drag and drop
	function handle_drop(e: DragEvent) {
		e.preventDefault();
		is_dragging = false;
		if (e.dataTransfer?.files && e.dataTransfer.files[0]) {
			process_file(e.dataTransfer.files[0]);
		}
	}

	function handle_drag_over(e: DragEvent) {
		e.preventDefault();
		is_dragging = true;
	}

	function handle_drag_leave() {
		is_dragging = false;
	}

	// Process the uploaded file
	function process_file(file: File) {
		if (!file.type.startsWith('image/')) {
			error_message = 'Please upload an image file';
			return;
		}

		screenshot_file = file;
		error_message = '';

		// Create preview
		const reader = new FileReader();
		reader.onload = (e) => {
			screenshot_preview = e.target?.result as string;
		};
		reader.readAsDataURL(file);
	}

	// Clear screenshot
	function clear_screenshot() {
		screenshot_file = null;
		screenshot_preview = null;
	}

	// Convert file to base64
	async function file_to_base64(file: File): Promise<string> {
		return new Promise((resolve, reject) => {
			const reader = new FileReader();
			reader.onload = () => {
				const result = reader.result as string;
				// Extract base64 data without the data URL prefix
				const base64 = result.split(',')[1];
				resolve(base64);
			};
			reader.onerror = reject;
			reader.readAsDataURL(file);
		});
	}

	// Generate code from screenshot
	async function generate_code() {
		if (!screenshot_file) {
			error_message = 'Please upload a screenshot first';
			return;
		}

		is_generating = true;
		error_message = '';
		generated_code = '';

		try {
			const base64_image = await file_to_base64(screenshot_file);

			// Get auth token from Pocketbase
			const auth_token = pb.authStore.token;

			const response = await fetch('/api/screenshot-to-code', {
				method: 'POST',
				headers: {
					'Content-Type': 'application/json',
					...(auth_token ? { Authorization: `Bearer ${auth_token}` } : {})
				},
				body: JSON.stringify({
					image: base64_image,
					image_type: screenshot_file.type,
					description: description || 'Convert this screenshot to code'
				})
			});

			if (!response.ok) {
				const error_data = await response.json();
				throw new Error(error_data.error || 'Failed to generate code');
			}

			// Handle streaming response
			const reader = response.body?.getReader();
			const decoder = new TextDecoder();

			if (!reader) {
				throw new Error('No response body');
			}

			while (true) {
				const { done, value } = await reader.read();
				if (done) break;

				const chunk = decoder.decode(value);
				const lines = chunk.split('\n');

				for (const line of lines) {
					if (line.startsWith('data: ')) {
						const data = line.slice(6);
						if (data === '[DONE]') continue;
						try {
							const parsed = JSON.parse(data);
							if (parsed.code) {
								generated_code = parsed.code;
							} else if (parsed.chunk) {
								generated_code += parsed.chunk;
							} else if (parsed.error) {
								throw new Error(parsed.error);
							}
						} catch {
							// Ignore parse errors for partial data
						}
					}
				}
			}
		} catch (err) {
			error_message = err instanceof Error ? err.message : 'An error occurred';
		} finally {
			is_generating = false;
		}
	}

	// Copy code to clipboard
	async function copy_code() {
		try {
			await navigator.clipboard.writeText(generated_code);
			copied = true;
			setTimeout(() => (copied = false), 2000);
		} catch {
			error_message = 'Failed to copy to clipboard';
		}
	}

	// Create new project with generated code
	async function create_project() {
		if (!generated_code) return;

		try {
			const project = await project_service.create({
				name: `Screenshot Project ${new Date().toLocaleDateString()}`,
				frontend_code: generated_code
			});

			// Open in new tab
			window.open(`/darkpearl/studio?id=${project.id}`, '_blank');
		} catch (err) {
			error_message = err instanceof Error ? err.message : 'Failed to create project';
		}
	}

	// Download as Svelte file
	function download_svelte() {
		if (!generated_code) return;
		const blob = new Blob([generated_code], { type: 'text/plain' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'Component.svelte';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}

	// Download as standalone HTML
	function download_html() {
		if (!generated_code) return;

		// Extract script, template, and style from Svelte code
		const styleTag = 'sty' + 'le';
		const scriptTag = 'scr' + 'ipt';
		const styleMatch = generated_code.match(new RegExp(`<${styleTag}[^>]*>([\\s\\S]*?)<\\/${styleTag}>`, 'i'));

		// Get template (everything that's not script or style)
		let template = generated_code
			.replace(new RegExp(`<${scriptTag}[^>]*>[\\s\\S]*?<\\/${scriptTag}>`, 'gi'), '')
			.replace(new RegExp(`<${styleTag}[^>]*>[\\s\\S]*?<\\/${styleTag}>`, 'gi'), '')
			.trim();

		const styles = styleMatch ? styleMatch[1] : '';

		const htmlParts = [
			'<!DOCTYPE html>',
			'<html lang="en">',
			'<head>',
			'  <meta charset="UTF-8">',
			'  <meta name="viewport" content="width=device-width, initial-scale=1.0">',
			'  <title>Generated Component</title>',
			'  <' + scriptTag + ' src="https://cdn.tailwindcss.com"></' + scriptTag + '>',
			'  <' + styleTag + '>',
			'    * { margin: 0; padding: 0; box-sizing: border-box; }',
			'    body { font-family: system-ui, -apple-system, sans-serif; }',
			'    ' + styles,
			'  </' + styleTag + '>',
			'</head>',
			'<body>',
			'  ' + template,
			'</body>',
			'</html>'
		];

		const html = htmlParts.join('\n');

		const blob = new Blob([html], { type: 'text/html' });
		const url = URL.createObjectURL(blob);
		const a = document.createElement('a');
		a.href = url;
		a.download = 'component.html';
		document.body.appendChild(a);
		a.click();
		document.body.removeChild(a);
		URL.revokeObjectURL(url);
	}
</script>

<svelte:head>
	<title>Screenshot to Code | darkpearl</title>
</svelte:head>

{#if !is_authenticated}
	<div class="min-h-screen bg-[var(--builder-bg-primary)] flex items-center justify-center">
		<Loader2 class="h-8 w-8 animate-spin text-[var(--builder-text-muted)]" />
	</div>
{:else}
<div class="min-h-screen bg-[var(--builder-bg-primary)]">
	<!-- Header -->
	<header
		class="sticky top-0 z-10 border-b border-[var(--builder-border)] bg-[var(--builder-bg-primary)]"
	>
		<div class="mx-auto flex max-w-6xl items-center gap-4 px-6 py-4">
			<a
				href="/darkpearl/dashboard"
				class="flex items-center gap-2 text-[var(--builder-text-secondary)] hover:text-[var(--builder-text-primary)]"
			>
				<ArrowLeft class="h-5 w-5" />
				<span>Back to Dashboard</span>
			</a>
			<div class="flex-1"></div>
			<h1 class="text-lg font-semibold text-[var(--builder-text-primary)]">Screenshot to Code</h1>
		</div>
	</header>

	<!-- Main Content -->
	<main class="mx-auto max-w-6xl px-6 py-8">
		<!-- Notice -->
		<div class="mb-6 flex items-start gap-3 rounded-lg border border-[var(--builder-border)] bg-[var(--builder-bg-secondary)] p-4">
			<Info class="h-5 w-5 flex-shrink-0 text-[var(--builder-accent)]" />
			<div class="text-sm text-[var(--builder-text-secondary)]">
				<span class="font-medium text-[var(--builder-text-primary)]">Note:</span> Generated code may have slight differences from the original screenshot due to resolution, font availability, and interpretation. Fine-tune the output as needed.
			</div>
		</div>

		{#if error_message}
			<div class="mb-6 rounded-lg bg-red-500/10 p-4 text-red-500">{error_message}</div>
		{/if}

		<div class="grid gap-8 lg:grid-cols-2">
			<!-- Left: Upload Section -->
			<div class="space-y-6">
				<div>
					<h2 class="mb-2 text-xl font-semibold text-[var(--builder-text-primary)]">
						Upload Screenshot
					</h2>
					<p class="text-[var(--builder-text-secondary)]">
						Upload a screenshot of a UI design and we'll convert it to Svelte code
					</p>
				</div>

				<!-- Upload Area -->
				{#if !screenshot_preview}
					<div
						class="relative rounded-lg border-2 border-dashed p-12 text-center transition-colors {is_dragging
							? 'border-[var(--builder-accent)] bg-[var(--builder-accent)]/5'
							: 'border-[var(--builder-border)] hover:border-[var(--builder-accent)]/50'}"
						ondrop={handle_drop}
						ondragover={handle_drag_over}
						ondragleave={handle_drag_leave}
						role="button"
						tabindex="0"
					>
						<input
							type="file"
							accept="image/*"
							onchange={handle_file_select}
							class="absolute inset-0 cursor-pointer opacity-0"
						/>
						<div class="flex flex-col items-center gap-4">
							<div
								class="flex h-16 w-16 items-center justify-center rounded-full bg-[var(--builder-bg-secondary)]"
							>
								<Upload class="h-8 w-8 text-[var(--builder-text-secondary)]" />
							</div>
							<div>
								<p class="font-medium text-[var(--builder-text-primary)]">
									Drop your screenshot here
								</p>
								<p class="mt-1 text-sm text-[var(--builder-text-secondary)]">
									or click to browse
								</p>
							</div>
						</div>
					</div>
				{:else}
					<!-- Preview -->
					<div class="relative">
						<button
							onclick={clear_screenshot}
							class="absolute -right-2 -top-2 z-10 flex h-8 w-8 items-center justify-center rounded-full bg-[var(--builder-bg-secondary)] text-[var(--builder-text-secondary)] shadow-lg hover:bg-[var(--builder-bg-tertiary)] hover:text-[var(--builder-text-primary)]"
						>
							<X class="h-4 w-4" />
						</button>
						<img
							src={screenshot_preview}
							alt="Screenshot preview"
							class="w-full rounded-lg border border-[var(--builder-border)]"
						/>
					</div>
				{/if}

				<!-- Description -->
				<div>
					<label
						for="description"
						class="mb-2 block text-sm font-medium text-[var(--builder-text-primary)]"
					>
						Additional Instructions (optional)
					</label>
					<Textarea
						id="description"
						bind:value={description}
						placeholder="Describe any specific requirements or functionality..."
						class="min-h-[100px] resize-none border-[var(--builder-border)] bg-[var(--builder-bg-secondary)] text-[var(--builder-text-primary)] placeholder:text-[var(--builder-text-muted)]"
					/>
				</div>

				<!-- Generate Button -->
				<Button
					onclick={generate_code}
					disabled={!screenshot_file || is_generating}
					class="w-full gap-2"
				>
					{#if is_generating}
						<Loader2 class="h-4 w-4 animate-spin" />
						Generating...
					{:else}
						<Sparkles class="h-4 w-4" />
						Generate Code
					{/if}
				</Button>
			</div>

			<!-- Right: Code Output -->
			<div class="space-y-6">
				<div class="space-y-4">
					<!-- Title Row -->
					<div class="flex items-center justify-between">
						<h2 class="text-xl font-semibold text-[var(--builder-text-primary)]">
							{#if view_mode === 'code'}Generated Code{:else}Preview{/if}
						</h2>
						{#if generated_code}
							<p class="text-sm text-[var(--builder-text-secondary)]">
								Your Svelte 5 component is ready
							</p>
						{/if}
					</div>

					<!-- Controls Row -->
					{#if generated_code}
						<div class="flex flex-wrap items-center gap-2">
							<!-- View Toggle -->
							<div class="flex rounded-lg border border-[var(--builder-border)] p-1">
								<button
									onclick={() => view_mode = 'code'}
									class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors {view_mode === 'code' ? 'bg-[var(--builder-accent)] text-[var(--builder-accent-text)]' : 'text-[var(--builder-text-secondary)] hover:text-[var(--builder-text-primary)]'}"
								>
									<Code class="h-4 w-4" />
									Code
								</button>
								<button
									onclick={() => view_mode = 'preview'}
									class="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium transition-colors {view_mode === 'preview' ? 'bg-[var(--builder-accent)] text-[var(--builder-accent-text)]' : 'text-[var(--builder-text-secondary)] hover:text-[var(--builder-text-primary)]'}"
								>
									<Eye class="h-4 w-4" />
									Preview
								</button>
							</div>

							<div class="flex-1"></div>

							<Button variant="outline" size="sm" onclick={copy_code} class="gap-2">
								{#if copied}
									<Check class="h-4 w-4" />
									Copied
								{:else}
									<Copy class="h-4 w-4" />
									Copy
								{/if}
							</Button>
							<DropdownMenu.Root>
								<DropdownMenu.Trigger>
									<Button variant="outline" size="sm" class="gap-2">
										<Download class="h-4 w-4" />
										Download
									</Button>
								</DropdownMenu.Trigger>
								<DropdownMenu.Content align="end">
									<DropdownMenu.Item class="gap-2 cursor-pointer" onclick={download_svelte}>
										<FileCode class="h-4 w-4" />
										Download as .svelte
									</DropdownMenu.Item>
									<DropdownMenu.Item class="gap-2 cursor-pointer" onclick={download_html}>
										<FileText class="h-4 w-4" />
										Download as .html
									</DropdownMenu.Item>
								</DropdownMenu.Content>
							</DropdownMenu.Root>
							<Button size="sm" onclick={create_project} class="gap-2">
								<Sparkles class="h-4 w-4" />
								Create Project
							</Button>
						</div>
					{:else}
						<p class="text-[var(--builder-text-secondary)]">
							Code will appear here after generation
						</p>
					{/if}
				</div>

				<!-- Code/Preview Display -->
				<div
					class="min-h-[400px] overflow-hidden rounded-lg border border-[var(--builder-border)] bg-[var(--builder-bg-secondary)]"
				>
					{#if is_generating}
						<div class="flex h-[400px] items-center justify-center">
							<div class="flex flex-col items-center gap-4">
								<Loader2 class="h-8 w-8 animate-spin text-[var(--builder-accent)]" />
								<p class="text-[var(--builder-text-secondary)]">Analyzing screenshot...</p>
							</div>
						</div>
					{:else if generated_code}
						{#if view_mode === 'code'}
							<pre class="h-[400px] overflow-auto p-4 whitespace-pre-wrap font-mono text-sm text-[var(--builder-text-primary)]">{generated_code}</pre>
						{:else}
							<iframe
								srcdoc={preview_html}
								title="Preview"
								class="h-[400px] w-full bg-white"
								sandbox="allow-scripts"
							></iframe>
						{/if}
					{:else}
						<div class="flex h-[400px] items-center justify-center">
							<div class="flex flex-col items-center gap-4 text-center">
								<Image class="h-12 w-12 text-[var(--builder-text-muted)]" />
								<p class="text-[var(--builder-text-muted)]">
									Upload a screenshot and click "Generate Code" to see results
								</p>
							</div>
						</div>
					{/if}
				</div>
			</div>
		</div>
	</main>
</div>
{/if}
