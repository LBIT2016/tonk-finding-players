import { useState } from 'react';

interface AddPinFormProps {
    onSubmit: (data: { /* existing form data */ tags: string[], category: string, locationCategory: string }) => void;
}

export function AddPinForm({ onSubmit }: AddPinFormProps) {
    const [tags, setTags] = useState<string[]>([]);
    const [currentTag, setCurrentTag] = useState('');

    const handleAddTag = () => {
        if (currentTag.trim()) {
            setTags([...tags, currentTag.trim()]);
            setCurrentTag('');
        }
    };

    const handleRemoveTag = (tagToRemove: string) => {
        setTags(tags.filter(tag => tag !== tagToRemove));
    };

    const handleSubmit = (e: React.FormEvent) => {
        e.preventDefault();

        // Determine category based on tags
        let category = "Uncategorized";
        if (tags.includes("GM")) {
            category = "GM";
        } else if (tags.includes("Player")) {
            category = "Player";
        }

        // Assign location category (example logic, adjust as needed)
        const locationCategory = formData.location ? "Categorized" : "Uncategorized";

        onSubmit({
            tags,
            category, // Include the determined category
            locationCategory, // Include the location category
        });
        setTags([]);
    };

    return (
        <form onSubmit={handleSubmit}>
            <div className="mb-4">
                <label className="block text-gray-700 text-sm font-bold mb-2">
                    Tags
                </label>
                <div className="flex gap-2 mb-2">
                    {tags.map((tag) => (
                        <span key={tag} className="bg-blue-100 px-2 py-1 rounded-full text-sm flex items-center">
                            {tag}
                            <button
                                type="button"
                                onClick={() => handleRemoveTag(tag)}
                                className="ml-2 text-red-500"
                            >
                                ×
                            </button>
                        </span>
                    ))}
                </div>
                <div className="flex gap-2">
                    <input
                        type="text"
                        value={currentTag}
                        onChange={(e) => setCurrentTag(e.target.value)}
                        className="shadow appearance-none border rounded w-full py-2 px-3 text-gray-700"
                        placeholder="Enter a tag"
                    />
                    <button
                        type="button"
                        onClick={handleAddTag}
                        className="bg-blue-500 hover:bg-blue-700 text-white font-bold py-2 px-4 rounded"
                    >
                        Add Tag
                    </button>
                </div>
            </div>
        </form>
    );
}