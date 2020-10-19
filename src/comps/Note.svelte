<script>
    import { createEventDispatcher } from "svelte";

    const dispatch = createEventDispatcher();

    export let pinned;
    export let text;

    $: canTrim = text.trim().length !== text.length;
</script>

<style>
    .note {
        background: #feff9c;
        border: 1px solid #e6e78d;
        user-select: none;
        padding: 0.5rem;
        overflow: hidden;
        tab-size: 4;
        font-family: inherit;
        height: 100%;
    }
    .note:hover {
        background: #fdff85;
    }
    .btn {
        color: #b1b36c;
        cursor: pointer;
    }
    .btn:hover {
        color: #555;
    }
    .pin {
        position: absolute;
        right: 0.75rem;
        top: 0.7rem;
    }
    .btn-enabled {
        color: #000;
    }

    .trim {
        position: absolute;
        right: 0.75rem;
        bottom: 0.75rem;
    }
</style>

<div class="card">
    <pre class="note" on:click>{text}</pre>
    <div
        title="Pin"
        class="btn pin fas fa-thumbtack {pinned ? 'btn-enabled' : ''}"
        on:click={() => dispatch('pin')} />
    {#if canTrim}
        <div
            title="Trim"
            class="btn trim fas fa-remove-format fa-sm"
            on:click={() => dispatch('trim')} />
    {/if}
</div>
