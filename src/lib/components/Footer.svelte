<script lang="ts">
	let { showEvolune = false } = $props()
</script>

<footer class="relative z-10 px-6 py-8 border-t" style="border-color: rgba(255, 255, 255, 0.05);">
	<div class="max-w-7xl mx-auto flex flex-col items-center gap-4">
		<div class="flex flex-col md:flex-row items-center justify-between w-full gap-4">
			<div class="flex items-center gap-2">
				<img src="/dark_pearl.png" alt="darkpearl" class="w-6 h-6 object-contain opacity-60" />
				<span class="text-sm text-gray-500">darkpearl - Self-hosted AI App Builder</span>
			</div>
			<div class="text-sm text-gray-500">
				Own your data. Ship faster.
			</div>
		</div>

		{#if showEvolune}
			<div class="w-full pt-4 mt-4 border-t flex flex-col items-center gap-2" style="border-color: rgba(255, 255, 255, 0.05);">
				<p class="text-sm text-gray-500">
					A product by
					<a
						href="https://evolune.in"
						target="_blank"
						rel="noopener noreferrer"
						class="text-purple-400 hover:text-purple-300 transition-colors font-medium"
					>
						Evolune Edgetech
					</a>
				</p>
				<p class="text-xs text-gray-600">
					Building the future of AI-powered development tools
				</p>
			</div>
		{/if}
	</div>
</footer>
