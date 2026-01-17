<script>
    let { width = "3rem", show_icon = true } = $props();
</script>

<div class="logo-container" style="font-size: 1rem; font-weight: 600; color: var(--builder-text-primary, white); font-family: system-ui, -apple-system, sans-serif; letter-spacing: -0.02em;">
    {#if show_icon}
        <img src="/dark_pearl.png" alt="" class="logo-icon" style="width: 1.5em; height: 1.5em; object-fit: contain;" />
    {/if}
    <span style="width: {width};">/darkpearl</span>
</div>

<style>
    .logo-container {
        display: flex;
        align-items: center;
        gap: 0.5em;
    }

    .logo-icon {
        flex-shrink: 0;
    }
</style>
