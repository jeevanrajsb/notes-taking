const express = require("express");
const pool = require("../db");
const authenticateUser = require("../middleware/authMiddleware");

const router = express.Router();

// Get all notes for a user
router.get("/", authenticateUser, async (req, res) => {
    // console.log(req.user.id)
    try {
        const [notes] = await pool.query("SELECT * FROM notes WHERE user_id = ?", [req.user.id]);
        res.json(notes);
    } catch (error) {
        res.status(500).json({ message: "Error fetching notes" });
    }
});

// Create a new note (Prevent duplicate titles)
router.post("/", authenticateUser, async (req, res) => {
    const { title, contents } = req.body;
    // console.log(req.user.id)
    try {
        // Check for duplicate note title
        const [existingNotes] = await pool.query("SELECT * FROM notes WHERE title = ? AND user_id = ?", [title, req.user.id]);
        if (existingNotes.length > 0) {
            return res.status(400).json({ message: "Note with this title already exists" });
        }

        await pool.query("INSERT INTO notes (title, contents, user_id) VALUES (?, ?, ?)", [title, contents, req.user.id]);
        res.json({ message: "Note created successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error creating note" });
    }
});

// Get a single note
router.get("/:id", authenticateUser, async (req, res) => {
    const { id } = req.params;
    // console.log(id);
    // console.log(req.user.id);
    try {
        const [notes] = await pool.query("SELECT * FROM notes WHERE id = ? AND user_id = ?", [id, req.user.id]);
        if (notes.length === 0) {
            return res.status(404).json({ message: "Note not found" });
        }
        res.json(notes[0]);
    } catch (error) {
        res.status(500).json({ message: "Error fetching note" });
    }
});

// Update note content
router.put("/:id", authenticateUser, async (req, res) => {
    const { id } = req.params;
    const { title, contents } = req.body;

    try {
        // Check if the note exists and belongs to the user
        const [note] = await pool.query("SELECT * FROM notes WHERE id = ? AND user_id = ?", [id, req.user.id]);
        if (note.length === 0) {
            return res.status(404).json({ message: "Note not found or doesn't belong to the user" });
        }

        // Check for duplicate title if title is provided
        if (title) {
            const [existingNotes] = await pool.query("SELECT * FROM notes WHERE title = ? AND user_id = ?", [title, req.user.id]);
            if (existingNotes.length > 0) {
                return res.status(400).json({ message: "Note with this title already exists" });
            }
        }

        // Update the note
        await pool.query("UPDATE notes SET title = ?, contents = ? WHERE id = ? AND user_id = ?", [title || note[0].title, contents || note[0].contents, id, req.user.id]);

        res.json({ message: "Note updated successfully" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Error updating note" });
    }
});

// Delete a note
router.delete("/:id", authenticateUser, async (req, res) => {
    const { id } = req.params;

    try {
        await pool.query("DELETE FROM notes WHERE id = ? AND user_id = ?", [id, req.user.id]);
        res.json({ message: "Note deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Error deleting note" });
    }
});

module.exports = router;
