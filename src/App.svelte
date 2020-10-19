<script>
	import { onDestroy, onMount } from "svelte";
	import Fuse from "fuse.js";

	import Note from "./comps/Note.svelte";
	const { ipcRenderer } = require("electron");

	let history = [];
	let display = [];

	let last = "";
	ipcRenderer.on("clipboard-changed", (event, text) => {
		if (text.trim() === "" || last === text) {
			return;
		}
		last = text;
		const all = [{ pinned: false, text, date: new Date() }, ...history];
		const maxUnpinnedNotes = 50;
		history = all.filter(
			(v, i) => v.pinned || (!v.pinned && i < maxUnpinnedNotes)
		);
		display = history;
	});

	onMount(() => {
		ipcRenderer.on("saved-notes-loaded", (event, notes) => {
			history = notes;
			display = notes;
		});
		ipcRenderer.send("ready-to-receive-saved-notes");

		window.addEventListener("keydown", onSearch);

		document.addEventListener("visibilitychange", function () {
			if (document.visibilityState === "visible") {
				if (document.activeElement) {
					// Remove focus from any focused element
					document.activeElement.blur();
				}
				textToSearch = "";
				display = history;
				window.focus();
			}
		});
	});

	onDestroy(() => {
		window.removeEventListener("keydown", onSearch);
	});

	function findNotes(keyword) {
		const options = {
			includeScore: true,
			// Search in 'text' and in 'tags' array
			keys: ["text", "tags"],
		};
		const result = new Fuse(history, options).search(keyword);
		return result.map((v) => v.item);
	}

	let textToSearch = "";
	function onSearch(event) {
		textToSearch += event.key;
		display = findNotes(textToSearch);
	}

	function copyToClipboard(note) {
		ipcRenderer.send("copy-to-clipboard", note.text);
	}

	function togglePin(note) {
		note.pinned = !note.pinned;
		savePinnedNotes();
		display = history;
	}

	function trim(note) {
		note.text = note.text.trim();
		if (note.pinned) {
			savePinnedNotes();
		}
		display = history;
	}

	function savePinnedNotes() {
		const pinned = history.filter((v) => v.pinned);
		ipcRenderer.send("save-notes", pinned);
	}
</script>

<style>
	.container {
		display: grid;
		grid-template-rows: auto 1fr;
		height: 100%;
		padding: 0.5rem;
	}
	.notes {
		display: grid;
		overflow: hidden;
		grid-template-columns: repeat(10, 350px);
		grid-auto-flow: column;
		column-gap: 0.5rem;
	}
</style>

<div class="container">
	<div class="tools" />
	<div class="notes">
		{#each display.slice(0, 5) as note}
			<Note
				text={note.text}
				pinned={note.pinned}
				on:click={copyToClipboard(note)}
				on:pin={togglePin(note)}
				on:trim={trim(note)} />
		{/each}
	</div>
</div>
